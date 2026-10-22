package com.example.ResumeIQ.service;

import com.example.ResumeIQ.domain.ResumeDocument;
import com.example.ResumeIQ.dto.response.ResumeAnalysisResponse;
import com.example.ResumeIQ.dto.response.StructuredResumeAnalysis;
import com.example.ResumeIQ.exception.AiServiceException;
import com.example.ResumeIQ.exception.ResumeNotFoundException;
import com.example.ResumeIQ.repository.ResumeAnalysisRepository;
import com.example.ResumeIQ.repository.ResumeRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

/**
 * Analyzes stored resume content using {@link ChatClient} to produce structured insights
 * (professional summary, skills, projects, education, missing details) and persists them.
 */
@Service
public class ResumeAnalysisService {

    private static final Logger log = LoggerFactory.getLogger(ResumeAnalysisService.class);

    static final String SYSTEM_PROMPT = """
            You are ResumeIQ, an evidence-based resume analysis system.

            Rules:
            1. Analyze ONLY the supplied resume content. The resume is your single source of truth.
            2. Never invent or assume skills, projects, qualifications, certifications, dates, or metrics.
               If the resume does not mention it, it does not exist.
            3. Produce a structured analysis containing:
               - professionalSummary: A concise professional summary based strictly on the resume.
               - skills: Explicitly mentioned technical and domain skills.
               - projects: List of projects with "name", "technologies" used, and "description".
               - educationAndCertifications: Degrees, schools, certifications mentioned.
               - missingOrUnavailableInformation: Important career or document details that are omitted (e.g. contact info, dates, metrics).
            """;

    private final ChatClient chatClient;
    private final ResumeRepository resumeRepository;
    private final ResumeAnalysisRepository analysisRepository;
    private final ResumeSessionContext sessionContext;
    private final ObjectMapper objectMapper;

    public ResumeAnalysisService(ChatClient chatClient,
                                 ResumeRepository resumeRepository,
                                 ResumeAnalysisRepository analysisRepository,
                                 ResumeSessionContext sessionContext,
                                 @org.springframework.beans.factory.annotation.Autowired(required = false) ObjectMapper objectMapper) {
        this.chatClient = chatClient;
        this.resumeRepository = resumeRepository;
        this.analysisRepository = analysisRepository;
        this.sessionContext = sessionContext;
        this.objectMapper = objectMapper != null ? objectMapper : new ObjectMapper();
    }

    public ResumeAnalysisResponse analyze() {
        String resumeId = sessionContext.getRecentResumeId()
                .orElseThrow(ResumeNotFoundException::noResumeUploaded);
        return analyze(resumeId);
    }

    public ResumeAnalysisResponse analyze(String resumeId) {
        ResumeDocument resume = resumeRepository.findById(resumeId)
                .orElseThrow(() -> new ResumeNotFoundException(resumeId));

        // Check if an analysis has already been persisted
        var existing = analysisRepository.findByResumeId(resumeId);
        if (existing.isPresent()) {
            return existing.get();
        }

        StructuredResumeAnalysis structured = askModelForAnalysis(resume);

        ResumeAnalysisResponse response = new ResumeAnalysisResponse(
                resume.id(),
                structured.professionalSummary() != null ? structured.professionalSummary().strip() : "",
                structured.skills() != null ? structured.skills() : List.of(),
                structured.projects() != null ? structured.projects() : List.of(),
                structured.educationAndCertifications() != null ? structured.educationAndCertifications() : List.of(),
                structured.missingOrUnavailableInformation() != null ? structured.missingOrUnavailableInformation() : List.of(),
                Instant.now());

        analysisRepository.save(response);
        return response;
    }

    private StructuredResumeAnalysis askModelForAnalysis(ResumeDocument resume) {
        StructuredResumeAnalysis structured = null;
        String rawContent = null;

        try {
            var callSpec = chatClient.prompt()
                    .system(SYSTEM_PROMPT)
                    .user("Resume content from file '" + resume.filename() + "':\n---\n" + resume.text() + "\n---")
                    .call();

            try {
                structured = callSpec.entity(StructuredResumeAnalysis.class);
            } catch (Exception ex) {
                log.debug("Direct analysis structured output call unmocked or failed: {}", ex.getMessage());
            }

            if (structured == null || structured.professionalSummary() == null) {
                rawContent = callSpec.content();
            }
        } catch (RuntimeException ex) {
            log.warn("Resume analysis failed for resume {}: {}", resume.id(), ex.getMessage());
            throw new AiServiceException(
                    "The AI assistant is currently unavailable. Please try again later.", ex);
        }

        if (structured != null) {
            return structured;
        }

        if (rawContent != null && !rawContent.isBlank()) {
            String stripped = rawContent.strip();
            if (stripped.startsWith("{") && stripped.endsWith("}")) {
                try {
                    return objectMapper.readValue(stripped, StructuredResumeAnalysis.class);
                } catch (Exception ignored) {
                }
            }
            return new StructuredResumeAnalysis(
                    stripped,
                    List.of(),
                    List.of(),
                    List.of(),
                    List.of());
        }

        throw new AiServiceException("The AI assistant returned an empty analysis.");
    }
}
