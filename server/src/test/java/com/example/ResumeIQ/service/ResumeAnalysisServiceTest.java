package com.example.ResumeIQ.service;

import com.example.ResumeIQ.domain.ResumeDocument;
import com.example.ResumeIQ.domain.ResumeSegment;
import com.example.ResumeIQ.dto.response.ResumeAnalysisResponse;
import com.example.ResumeIQ.dto.response.StructuredResumeAnalysis;
import com.example.ResumeIQ.exception.ResumeNotFoundException;
import com.example.ResumeIQ.repository.ResumeAnalysisRepository;
import com.example.ResumeIQ.repository.ResumeRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Answers;
import org.springframework.ai.chat.client.ChatClient;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ResumeAnalysisServiceTest {

    private final ResumeRepository resumeRepository = mock(ResumeRepository.class);
    private final ResumeAnalysisRepository analysisRepository = mock(ResumeAnalysisRepository.class);
    private final ChatClient chatClient = mock(ChatClient.class, Answers.RETURNS_DEEP_STUBS);
    private final ResumeSessionContext sessionContext = new ResumeSessionContext();
    private final ObjectMapper objectMapper = new ObjectMapper();

    private final ResumeAnalysisService service = new ResumeAnalysisService(
            chatClient, resumeRepository, analysisRepository, sessionContext, objectMapper);

    private final ResumeDocument resume = new ResumeDocument(
            "resume-1",
            "resume.pdf",
            "PDF",
            "SUCCESS",
            42,
            List.of(ResumeSegment.page(1, "Jane Doe\nJava Developer\nSkills: Java, Spring Boot")),
            "Jane Doe\nJava Developer\nSkills: Java, Spring Boot",
            Instant.parse("2026-10-21T10:15:30Z"));

    @BeforeEach
    void resetContext() {
        sessionContext.clear();
    }

    @Test
    void analyzesResumeAndPersistsResult() {
        when(resumeRepository.findById("resume-1")).thenReturn(Optional.of(resume));
        when(analysisRepository.findByResumeId("resume-1")).thenReturn(Optional.empty());
        sessionContext.setCurrentResumeId("resume-1");

        StructuredResumeAnalysis modelResult = new StructuredResumeAnalysis(
                "Senior Java engineer with 5 years experience.",
                List.of("Java", "Spring Boot"),
                List.of(new ResumeAnalysisResponse.ProjectDetail("Billing Platform", List.of("Spring Boot"), "Core platform")),
                List.of("B.S. in Computer Science"),
                List.of("Missing certifications"));

        when(chatClient.prompt().system(anyString()).user(anyString()).call().entity(StructuredResumeAnalysis.class))
                .thenReturn(modelResult);

        ResumeAnalysisResponse response = service.analyze();

        assertThat(response.resumeId()).isEqualTo("resume-1");
        assertThat(response.professionalSummary()).contains("Senior Java engineer");
        assertThat(response.skills()).containsExactly("Java", "Spring Boot");
        assertThat(response.projects()).hasSize(1);
        assertThat(response.projects().get(0).name()).isEqualTo("Billing Platform");
        assertThat(response.educationAndCertifications()).contains("B.S. in Computer Science");
        assertThat(response.missingOrUnavailableInformation()).contains("Missing certifications");

        verify(analysisRepository).save(any(ResumeAnalysisResponse.class));
    }

    @Test
    void returnsExistingAnalysisWithoutCallingAiModelAgain() {
        ResumeAnalysisResponse existing = new ResumeAnalysisResponse(
                "resume-1",
                "Cached summary",
                List.of("Java"),
                List.of(),
                List.of(),
                List.of(),
                Instant.now());

        when(resumeRepository.findById("resume-1")).thenReturn(Optional.of(resume));
        when(analysisRepository.findByResumeId("resume-1")).thenReturn(Optional.of(existing));
        sessionContext.setCurrentResumeId("resume-1");

        ResumeAnalysisResponse response = service.analyze();

        assertThat(response.professionalSummary()).isEqualTo("Cached summary");
        verify(chatClient, never()).prompt();
    }

    @Test
    void throwsNotFoundWhenNoResumeUploaded() {
        assertThatThrownBy(service::analyze)
                .isInstanceOf(ResumeNotFoundException.class)
                .hasMessageContaining("No resume has been uploaded");
    }
}
