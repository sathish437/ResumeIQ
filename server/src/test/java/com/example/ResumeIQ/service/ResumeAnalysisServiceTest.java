package com.example.ResumeIQ.service;

import com.example.ResumeIQ.domain.ResumeDocument;
import com.example.ResumeIQ.domain.ResumeSegment;
import com.example.ResumeIQ.dto.request.SkillGapRequest;
import com.example.ResumeIQ.dto.response.ResumeAnalysisResponse;
import com.example.ResumeIQ.dto.response.SkillGapAnalysisResponse;
import com.example.ResumeIQ.dto.response.StructuredResumeAnalysis;
import com.example.ResumeIQ.dto.response.StructuredSkillGapAnalysis;
import com.example.ResumeIQ.exception.DocumentValidationException;
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

    @Test
    void analyzesSkillGapSuccessfullyWithModelOutput() {
        when(resumeRepository.findById("resume-1")).thenReturn(Optional.of(resume));
        sessionContext.setCurrentResumeId("resume-1");

        StructuredSkillGapAnalysis mockResult = new StructuredSkillGapAnalysis(
                75,
                List.of(new SkillGapAnalysisResponse.MatchedSkill(
                        "Java", List.of("Billing Platform"), "Used Java extensively in Billing Platform")),
                List.of(new SkillGapAnalysisResponse.MissingSkill(
                        "Kubernetes", "Required for cloud deployment", "Build a sample deployment on Minikube")),
                List.of(new SkillGapAnalysisResponse.EvidenceNeededSkill(
                        "AWS", "Listed without specific service context", "Specify S3/EC2 usage in project bullets")),
                List.of(new SkillGapAnalysisResponse.RecommendedNextStep(
                        "Demonstrate Container Orchestration", "Add a Docker/K8s project", "High"))
        );

        when(chatClient.prompt().system(anyString()).user(anyString()).call().entity(StructuredSkillGapAnalysis.class))
                .thenReturn(mockResult);

        SkillGapAnalysisResponse response = service.analyzeSkillGap(new SkillGapRequest("Senior Java and Kubernetes Engineer"));

        assertThat(response.resumeId()).isEqualTo("resume-1");
        assertThat(response.targetRoleOrJobDescription()).isEqualTo("Senior Java and Kubernetes Engineer");
        assertThat(response.matchPercentage()).isEqualTo(75);
        assertThat(response.matchedSkills()).hasSize(1);
        assertThat(response.matchedSkills().get(0).skill()).isEqualTo("Java");
        assertThat(response.matchedSkills().get(0).supportingProjects()).contains("Billing Platform");
        assertThat(response.missingSkills()).hasSize(1);
        assertThat(response.missingSkills().get(0).skill()).isEqualTo("Kubernetes");
        assertThat(response.skillsNeedingEvidence()).hasSize(1);
        assertThat(response.skillsNeedingEvidence().get(0).skill()).isEqualTo("AWS");
        assertThat(response.recommendedNextSteps()).hasSize(1);
        assertThat(response.roadmap()).hasSize(6);
        assertThat(response.roadmap().get(0).stepNumber()).isEqualTo(1);
        assertThat(response.roadmap().get(5).stepNumber()).isEqualTo(6);
    }

    @Test
    void analyzesSkillGapWithCustomRoadmapFromAi() {
        when(resumeRepository.findById("resume-1")).thenReturn(Optional.of(resume));
        sessionContext.setCurrentResumeId("resume-1");

        List<SkillGapAnalysisResponse.RoadmapStepResponse> aiRoadmap = List.of(
                new SkillGapAnalysisResponse.RoadmapStepResponse(1, "Step 1", "F1", "Do 1", "Why 1", "Task 1", "", "1 week"),
                new SkillGapAnalysisResponse.RoadmapStepResponse(2, "Step 2", "F2", "Do 2", "Why 2", "Task 2", "Prereq 1", "1 week"),
                new SkillGapAnalysisResponse.RoadmapStepResponse(3, "Step 3", "F3", "Do 3", "Why 3", "Task 3", "Prereq 2", "1 week"),
                new SkillGapAnalysisResponse.RoadmapStepResponse(4, "Step 4", "F4", "Do 4", "Why 4", "Task 4", "Prereq 3", "1 week"),
                new SkillGapAnalysisResponse.RoadmapStepResponse(5, "Step 5", "F5", "Do 5", "Why 5", "Task 5", "Prereq 4", "1 week"),
                new SkillGapAnalysisResponse.RoadmapStepResponse(6, "Step 6", "F6", "Do 6", "Why 6", "Task 6", "Prereq 5", "1 week")
        );

        StructuredSkillGapAnalysis mockResult = new StructuredSkillGapAnalysis(
                80,
                List.of(new SkillGapAnalysisResponse.MatchedSkill("Java", List.of(), "Demonstrated in summary")),
                List.of(new SkillGapAnalysisResponse.MissingSkill("Docker", "Required", "Learn Docker")),
                List.of(),
                List.of(),
                aiRoadmap
        );

        when(chatClient.prompt().system(anyString()).user(anyString()).call().entity(StructuredSkillGapAnalysis.class))
                .thenReturn(mockResult);

        SkillGapAnalysisResponse response = service.analyzeSkillGap(new SkillGapRequest("Company: TechCorp\nRole: Java Backend Developer\nRequirements: Java 17, Spring Boot, Docker"));

        assertThat(response.roadmap()).hasSize(6);
        assertThat(response.roadmap().get(0).title()).isEqualTo("Step 1");
        assertThat(response.roadmap().get(5).title()).isEqualTo("Step 6");
    }

    @Test
    void throwsValidationExceptionWhenSkillGapRequestIsBlank() {
        when(resumeRepository.findById("resume-1")).thenReturn(Optional.of(resume));
        sessionContext.setCurrentResumeId("resume-1");

        assertThatThrownBy(() -> service.analyzeSkillGap(new SkillGapRequest("   ")))
                .isInstanceOf(DocumentValidationException.class)
                .hasMessageContaining("Target role or job description must not be blank");
    }

    @Test
    void throwsNotFoundWhenSkillGapCalledWithoutResume() {
        assertThatThrownBy(() -> service.analyzeSkillGap(new SkillGapRequest("Java Developer")))
                .isInstanceOf(ResumeNotFoundException.class)
                .hasMessageContaining("No resume has been uploaded");
    }
}
