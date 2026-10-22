package com.example.ResumeIQ.controller;

import com.example.ResumeIQ.dto.request.ResumeAskRequest;
import com.example.ResumeIQ.dto.request.ResumeUploadRequest;
import com.example.ResumeIQ.dto.response.ApiErrorResponse;
import com.example.ResumeIQ.dto.response.ResumeAnalysisResponse;
import com.example.ResumeIQ.dto.response.ResumeAskResponse;
import com.example.ResumeIQ.dto.response.ResumeUploadResponse;
import com.example.ResumeIQ.service.ResumeAnalysisService;
import com.example.ResumeIQ.service.ResumeQaService;
import com.example.ResumeIQ.service.ResumeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Encoding;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

/**
 * Entry points for resume operations:
 * 1. Upload and persist a resume (PDF/DOCX)
 * 2. Ask questions about the current session's resume using Gemini ChatClient & Chat Memory
 * 3. Generate structured resume analysis (professional summary, skills, projects, education, missing details)
 */
@RestController
@RequestMapping("/api/resumes")
@Tag(name = "Resume", description = "Upload resumes, ask questions, and analyze resume content")
public class ResumeController {

    private final ResumeService resumeService;
    private final ResumeQaService resumeQaService;
    private final ResumeAnalysisService resumeAnalysisService;

    public ResumeController(ResumeService resumeService, ResumeQaService resumeQaService) {
        this(resumeService, resumeQaService, null);
    }

    @Autowired
    public ResumeController(ResumeService resumeService,
                            ResumeQaService resumeQaService,
                            @Autowired(required = false) ResumeAnalysisService resumeAnalysisService) {
        this.resumeService = resumeService;
        this.resumeQaService = resumeQaService;
        this.resumeAnalysisService = resumeAnalysisService;
    }

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(
            summary = "Upload a resume",
            description = """
                    Validates the uploaded resume, extracts its complete text and stores it so
                    questions can be asked about it later.
                    PDF files are stored as page segments and DOCX files as ordered
                    paragraph segments. OCR is not supported; image-only documents are
                    rejected with a 422 response. No AI call is made during upload.""")
    @io.swagger.v3.oas.annotations.parameters.RequestBody(
            required = true,
            content = @Content(
                    mediaType = MediaType.MULTIPART_FORM_DATA_VALUE,
                    schema = @Schema(implementation = ResumeUploadRequest.class),
                    encoding = @Encoding(name = "resume", contentType = "application/pdf, "
                            + "application/vnd.openxmlformats-officedocument."
                            + "wordprocessingml.document")))
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Resume stored successfully",
                    content = @Content(schema = @Schema(implementation = ResumeUploadResponse.class),
                            examples = @ExampleObject(name = "success", value = """
                                    {
                                      "resumeId": "0f8b9a6c-1d2e-4f3a-9c7b-5d6e7f8a9b0c",
                                      "filename": "resume.pdf",
                                      "fileType": "PDF",
                                      "status": "SUCCESS",
                                      "characterCount": 24,
                                      "segmentCount": 1,
                                      "references": ["Page 1"],
                                      "text": "Jane Doe\\nJava Developer",
                                      "pages": [
                                        {
                                          "pageNumber": 1,
                                          "text": "Jane Doe\\nJava Developer"
                                        }
                                      ],
                                      "createdAt": "2026-10-21T10:15:30Z"
                                    }"""))),
            @ApiResponse(responseCode = "400", description = "Missing, empty, unsupported, or mismatched file",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "413", description = "Uploaded file exceeds the size limit",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "422", description = "Document is corrupt, unreadable, or has no extractable text",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "500", description = "Unexpected server error",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponse.class)))
    })
    public ResponseEntity<ResumeUploadResponse> upload(
            @Parameter(description = "Resume file (.pdf or .docx)", required = true)
            @RequestPart("resume") MultipartFile resume) {

        return ResponseEntity.ok(resumeService.upload(resume));
    }

    @PostMapping(value = "/ask", consumes = MediaType.APPLICATION_JSON_VALUE)
    @Operation(
            summary = "Ask a question about an uploaded resume",
            description = """
                    Answers a question using only the stored content of the most recently
                    uploaded resume for the current session. Returns a structured response with
                    the grounded answer, supporting evidence references, and an insufficientEvidence flag.
                    Maintains conversational chat memory across follow-up questions.
                    Supports questions in English, Tamil script, Thanglish, and mixed English+Thanglish, automatically detecting and responding in the language and writing style of the latest question.""")
    @io.swagger.v3.oas.annotations.parameters.RequestBody(
            required = true,
            content = @Content(
                    mediaType = MediaType.APPLICATION_JSON_VALUE,
                    schema = @Schema(implementation = ResumeAskRequest.class),
                    examples = @ExampleObject(name = "default", value = """
                            {
                              "question": "What projects are mentioned in my resume?"
                            }""")))
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Answer produced from the stored resume",
                    content = @Content(schema = @Schema(implementation = ResumeAskResponse.class),
                            examples = @ExampleObject(name = "success", value = """
                                    {
                                      "resumeId": "0f8b9a6c-1d2e-4f3a-9c7b-5d6e7f8a9b0c",
                                      "question": "What projects are mentioned in my resume?",
                                      "answer": "The resume mentions three projects: payments platform, billing service, and auth gateway.",
                                      "sources": [
                                        {
                                          "reference": "Page 2",
                                          "evidence": "Billing platform built using Java and Spring Boot"
                                        }
                                      ],
                                      "sourceReferences": ["Page 2"],
                                      "insufficientEvidence": false
                                    }"""))),
            @ApiResponse(responseCode = "400", description = "Blank question",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "No resume has been uploaded for the current session",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "502", description = "The AI assistant is unavailable",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "500", description = "Unexpected server error",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponse.class)))
    })
    public ResponseEntity<ResumeAskResponse> ask(
            @Valid @RequestBody ResumeAskRequest request) {

        return ResponseEntity.ok(resumeQaService.ask(request));
    }

    @PostMapping(value = "/analyze")
    @Operation(
            summary = "Analyze the uploaded resume",
            description = """
                    Analyzes the current session's uploaded resume using Spring AI ChatClient.
                    Returns structured analysis including professional summary, explicit skills,
                    projects and their technologies, education and certifications, and missing or
                    unavailable information. The result is persisted in PostgreSQL.""")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Structured resume analysis result",
                    content = @Content(schema = @Schema(implementation = ResumeAnalysisResponse.class),
                            examples = @ExampleObject(name = "success", value = """
                                    {
                                      "resumeId": "0f8b9a6c-1d2e-4f3a-9c7b-5d6e7f8a9b0c",
                                      "professionalSummary": "Software Engineer with 5 years experience in distributed systems.",
                                      "skills": ["Java", "Spring Boot", "PostgreSQL"],
                                      "projects": [
                                        {
                                          "name": "Payments Platform",
                                          "technologies": ["Spring Boot", "Kafka"],
                                          "description": "High throughput transaction processor"
                                        }
                                      ],
                                      "educationAndCertifications": ["B.Tech Computer Science"],
                                      "missingOrUnavailableInformation": ["Phone number not provided"],
                                      "analyzedAt": "2026-10-21T10:15:30Z"
                                    }"""))),
            @ApiResponse(responseCode = "404", description = "No resume has been uploaded for the current session",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "502", description = "The AI assistant is unavailable",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "500", description = "Unexpected server error",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponse.class)))
    })
    public ResponseEntity<ResumeAnalysisResponse> analyze() {
        if (resumeAnalysisService == null) {
            throw new IllegalStateException("ResumeAnalysisService is not available.");
        }
        return ResponseEntity.ok(resumeAnalysisService.analyze());
    }
}
