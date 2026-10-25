package com.example.ResumeIQ.controller;

import com.example.ResumeIQ.domain.AppUser;
import com.example.ResumeIQ.dto.request.ResumeAskRequest;
import com.example.ResumeIQ.dto.request.ResumeUploadRequest;
import com.example.ResumeIQ.dto.request.SkillGapRequest;
import com.example.ResumeIQ.dto.response.ApiErrorResponse;
import com.example.ResumeIQ.dto.response.ResumeAnalysisResponse;
import com.example.ResumeIQ.dto.response.ResumeAskResponse;
import com.example.ResumeIQ.dto.response.ResumeUploadResponse;
import com.example.ResumeIQ.dto.response.SkillGapAnalysisResponse;
import com.example.ResumeIQ.exception.ResumeNotFoundException;
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
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

/**
 * Entry points for resume operations:
 * 1. Upload and persist a resume (PDF/DOCX) scoped to the authenticated AppUser
 * 2. Retrieve user-owned resumes
 * 3. Ask questions about the authenticated user's resume using Gemini ChatClient & Chat Memory
 * 4. Generate structured resume analysis strictly isolated per user
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
                    Validates the uploaded resume, extracts its complete text and stores it under
                    the authenticated user. PDF files are stored as page segments and DOCX files as ordered
                    paragraph segments. OCR is not supported; image-only documents are rejected with 422.""")
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
                    content = @Content(schema = @Schema(implementation = ResumeUploadResponse.class))),
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
            @RequestPart("resume") MultipartFile resume,
            Authentication authentication) {

        AppUser user = resolveUser(authentication);
        return ResponseEntity.ok(resumeService.upload(resume, user));
    }

    @GetMapping(value = {"/latest", "/current"})
    @Operation(summary = "Get the latest resume of the authenticated user",
            description = "Returns the most recently uploaded resume for the authenticated user, or 204 No Content if no resume has been uploaded.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Latest resume returned successfully",
                    content = @Content(schema = @Schema(implementation = ResumeUploadResponse.class))),
            @ApiResponse(responseCode = "204", description = "No resume has been uploaded yet for this user"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "500", description = "Unexpected server error")
    })
    public ResponseEntity<ResumeUploadResponse> getLatest(Authentication authentication) {
        AppUser user = resolveUser(authentication);
        if (user == null) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED).build();
        }
        return resumeService.getLatestResume(user)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.noContent().build());
    }

    @GetMapping(value = "/{resumeId}")
    @Operation(summary = "Get an uploaded resume by ID",
            description = "Returns the resume by ID if owned by the authenticated user, or 404 if not found.")
    public ResponseEntity<ResumeUploadResponse> getById(
            @PathVariable("resumeId") String resumeId,
            Authentication authentication) {
        AppUser user = resolveUser(authentication);
        if (user == null) {
            throw new ResumeNotFoundException(resumeId);
        }
        return resumeService.getResumeByIdAndUser(resumeId, user)
                .map(ResponseEntity::ok)
                .orElseThrow(() -> new ResumeNotFoundException(resumeId));
    }

    @DeleteMapping(value = "/{resumeId}")
    @Operation(summary = "Delete an uploaded resume by ID",
            description = "Deletes the resume by ID if owned by the authenticated user.")
    public ResponseEntity<Void> deleteById(
            @PathVariable("resumeId") String resumeId,
            Authentication authentication) {
        AppUser user = resolveUser(authentication);
        if (user != null) {
            boolean deleted = resumeService.deleteResume(resumeId, user);
            if (!deleted) {
                throw new ResumeNotFoundException(resumeId);
            }
        }
        return ResponseEntity.noContent().build();
    }

    @PostMapping(value = "/ask", consumes = MediaType.APPLICATION_JSON_VALUE)
    @Operation(
            summary = "Ask a question about an uploaded resume",
            description = "Answers a question using only the stored content of the user's uploaded resume.")
    @io.swagger.v3.oas.annotations.parameters.RequestBody(
            required = true,
            content = @Content(
                    mediaType = MediaType.APPLICATION_JSON_VALUE,
                    schema = @Schema(implementation = ResumeAskRequest.class)))
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Answer produced from the stored resume",
                    content = @Content(schema = @Schema(implementation = ResumeAskResponse.class))),
            @ApiResponse(responseCode = "400", description = "Blank question",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "No resume has been uploaded for the current user",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "502", description = "The AI assistant is unavailable",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "500", description = "Unexpected server error",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponse.class)))
    })
    public ResponseEntity<ResumeAskResponse> ask(
            @Valid @RequestBody ResumeAskRequest request,
            Authentication authentication) {

        AppUser user = resolveUser(authentication);
        return ResponseEntity.ok(resumeQaService.ask(request, user));
    }

    @PostMapping(value = "/analyze")
    @Operation(
            summary = "Analyze the uploaded resume",
            description = "Analyzes the user's uploaded resume using Spring AI ChatClient.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Structured resume analysis result",
                    content = @Content(schema = @Schema(implementation = ResumeAnalysisResponse.class))),
            @ApiResponse(responseCode = "404", description = "No resume has been uploaded for the current user",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "502", description = "The AI assistant is unavailable",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "500", description = "Unexpected server error",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponse.class)))
    })
    public ResponseEntity<ResumeAnalysisResponse> analyze(Authentication authentication) {
        if (resumeAnalysisService == null) {
            throw new IllegalStateException("ResumeAnalysisService is not available.");
        }
        AppUser user = resolveUser(authentication);
        return ResponseEntity.ok(resumeAnalysisService.analyze(user));
    }

    @PostMapping(value = "/skill-gap", consumes = MediaType.APPLICATION_JSON_VALUE)
    @Operation(
            summary = "Analyze skill gap against a target role or job description",
            description = "Compares the user's uploaded resume against a target role or job description.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Skill gap analysis result",
                    content = @Content(schema = @Schema(implementation = SkillGapAnalysisResponse.class))),
            @ApiResponse(responseCode = "400", description = "Blank target role or job description",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "No resume has been uploaded for the current user",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "502", description = "The AI assistant is unavailable",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "500", description = "Unexpected server error",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponse.class)))
    })
    public ResponseEntity<SkillGapAnalysisResponse> skillGap(
            @Valid @RequestBody SkillGapRequest request,
            Authentication authentication) {
        if (resumeAnalysisService == null) {
            throw new IllegalStateException("ResumeAnalysisService is not available.");
        }
        AppUser user = resolveUser(authentication);
        return ResponseEntity.ok(resumeAnalysisService.analyzeSkillGap(request, user));
    }

    @PostMapping(value = "/ats-score", consumes = MediaType.APPLICATION_JSON_VALUE)
    @Operation(
            summary = "Calculate ATS compatibility score against target requirements",
            description = "Calculates an evidence-based ATS compatibility score (0-100) and transparent breakdown.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "ATS score calculated successfully",
                    content = @Content(schema = @Schema(implementation = com.example.ResumeIQ.dto.response.AtsScoreResult.class))),
            @ApiResponse(responseCode = "400", description = "Blank target role or job description",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "No resume has been uploaded for the current user",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "502", description = "The AI assistant is unavailable",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "500", description = "Unexpected server error",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponse.class)))
    })
    public ResponseEntity<com.example.ResumeIQ.dto.response.AtsScoreResult> atsScore(
            @Valid @RequestBody SkillGapRequest request,
            Authentication authentication) {
        if (resumeAnalysisService == null) {
            throw new IllegalStateException("ResumeAnalysisService is not available.");
        }
        AppUser user = resolveUser(authentication);
        return ResponseEntity.ok(resumeAnalysisService.calculateAtsScore(request, user));
    }

    private AppUser resolveUser(Authentication authentication) {
        if (authentication != null && authentication.getPrincipal() instanceof AppUser user) {
            return user;
        }
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof AppUser user) {
            return user;
        }
        return null;
    }
}
