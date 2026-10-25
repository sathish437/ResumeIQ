package com.example.ResumeIQ.service;

import com.example.ResumeIQ.domain.ResumeDocument;
import com.example.ResumeIQ.domain.ResumeSegment;
import com.example.ResumeIQ.dto.response.AtsScoreResult;
import com.example.ResumeIQ.dto.response.ResumeAnalysisResponse;
import com.example.ResumeIQ.dto.response.SkillGapAnalysisResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class AtsScoringServiceTest {

    private AtsScoringService scoringService;
    private ResumeDocument sampleResume;
    private ResumeAnalysisResponse sampleAnalysis;

    @BeforeEach
    void setUp() {
        scoringService = new AtsScoringService();

        String rawText = """
                Jane Doe
                Email: jane.doe@example.com | Phone: +1-555-0199
                Professional Summary:
                Passionate software developer with experience building backend services and REST APIs.
                Skills:
                Java, Spring Boot, PostgreSQL, Docker, Git
                Projects:
                E-Commerce API: Built a scalable payment microservice using Java, Spring Boot, and PostgreSQL.
                Implemented containerized deployment with Docker and automated testing.
                Education:
                B.S. in Computer Science, State University, 2024.
                """;

        sampleResume = new ResumeDocument(
                "resume-1",
                "sample.pdf",
                "PDF",
                "READY",
                rawText.length(),
                List.of(ResumeSegment.page(1, rawText)),
                rawText,
                Instant.now());

        sampleAnalysis = new ResumeAnalysisResponse(
                "resume-1",
                "Passionate software developer with experience building backend services and REST APIs.",
                List.of("Java", "Spring Boot", "PostgreSQL", "Docker", "Git"),
                List.of(new ResumeAnalysisResponse.ProjectDetail(
                        "E-Commerce API",
                        List.of("Java", "Spring Boot", "PostgreSQL", "Docker"),
                        "Built a scalable payment microservice using Java, Spring Boot, and PostgreSQL. Implemented containerized deployment.")),
                List.of("B.S. in Computer Science, State University, 2024"),
                List.of(),
                Instant.now());
    }

    @Test
    void calculatesScoreForTargetRoleTitle() {
        List<SkillGapAnalysisResponse.MatchedSkill> matched = List.of(
                new SkillGapAnalysisResponse.MatchedSkill("Java", List.of("E-Commerce API"), "Demonstrated in E-Commerce API"),
                new SkillGapAnalysisResponse.MatchedSkill("Spring Boot", List.of("E-Commerce API"), "Used in backend platform"),
                new SkillGapAnalysisResponse.MatchedSkill("PostgreSQL", List.of("E-Commerce API"), "Database used in project")
        );
        List<SkillGapAnalysisResponse.MissingSkill> missing = List.of(
                new SkillGapAnalysisResponse.MissingSkill("Kubernetes", "Required for production deployment", "Learn Kubernetes basics")
        );
        List<SkillGapAnalysisResponse.EvidenceNeededSkill> evidenceNeeded = List.of();

        AtsScoreResult result = scoringService.calculateScore(
                sampleResume,
                sampleAnalysis,
                "Backend Software Engineer",
                matched,
                missing,
                evidenceNeeded);

        assertThat(result.totalScore()).isBetween(50, 95);
        assertThat(result.breakdown().requiredSkillsScore()).isGreaterThan(0);
        assertThat(result.breakdown().resumeStructureScore()).isGreaterThan(5);
        assertThat(result.missingRequirements()).contains("Missing required skill: Kubernetes (Required for production deployment)");
        assertThat(result.formulaExplanation()).contains("4-pillar heuristic");
        assertThat(result.disclaimer()).contains("does not predict recruiter decisions");
    }

    @Test
    void calculatesEvidenceBasedScoreForFullJobDescription() {
        String jobDescription = """
                Senior Java Engineer
                Requirements:
                - Strong proficiency in Java and Spring Boot
                - Experience with PostgreSQL and relational data modeling
                - Kubernetes and cloud deployment experience
                Preferred / Nice to Have:
                - Kafka or event-driven messaging
                - Docker containerization
                """;

        List<SkillGapAnalysisResponse.MatchedSkill> matched = List.of(
                new SkillGapAnalysisResponse.MatchedSkill("Java", List.of("E-Commerce API"), "Core language"),
                new SkillGapAnalysisResponse.MatchedSkill("Spring Boot", List.of("E-Commerce API"), "Primary framework"),
                new SkillGapAnalysisResponse.MatchedSkill("PostgreSQL", List.of("E-Commerce API"), "Relational DB"),
                new SkillGapAnalysisResponse.MatchedSkill("Docker", List.of("E-Commerce API"), "Preferred containerization tool")
        );
        List<SkillGapAnalysisResponse.MissingSkill> missing = List.of(
                new SkillGapAnalysisResponse.MissingSkill("Kubernetes", "Mandatory cluster orchestration", "Deploy to Minikube"),
                new SkillGapAnalysisResponse.MissingSkill("Kafka", "Nice to have event streaming", "Complete Kafka tutorial")
        );

        AtsScoreResult result = scoringService.calculateScore(
                sampleResume,
                sampleAnalysis,
                jobDescription,
                matched,
                missing,
                List.of());

        assertThat(result.totalScore()).isBetween(60, 95);
        assertThat(result.breakdown().requiredSkillsScore()).isBetween(25, 45);
        assertThat(result.breakdown().preferredSkillsScore()).isBetween(5, 15);
        assertThat(result.breakdown().experienceEvidenceScore()).isBetween(10, 20);
        assertThat(result.breakdown().resumeStructureScore()).isBetween(8, 10);
    }

    @Test
    void deduplicatesRepeatedSkills() {
        List<SkillGapAnalysisResponse.MatchedSkill> matched = List.of(
                new SkillGapAnalysisResponse.MatchedSkill("Java", List.of("E-Commerce API"), "Core language"),
                new SkillGapAnalysisResponse.MatchedSkill("java", List.of("E-Commerce API"), "Duplicate entry"),
                new SkillGapAnalysisResponse.MatchedSkill("JAVA", List.of("E-Commerce API"), "Case variation")
        );
        List<SkillGapAnalysisResponse.MissingSkill> missing = List.of(
                new SkillGapAnalysisResponse.MissingSkill("AWS", "Cloud hosting", "Learn EC2/S3"),
                new SkillGapAnalysisResponse.MissingSkill("aws", "Duplicate cloud", "Learn EC2/S3")
        );

        AtsScoreResult result = scoringService.calculateScore(
                sampleResume,
                sampleAnalysis,
                "Backend Engineer",
                matched,
                missing,
                List.of());

        // Deduplication ensures 1 unique matched and 1 unique missing
        assertThat(result.breakdown().requiredSkillsScore()).isEqualTo(25); // 50% of 50 pts
    }

    @Test
    void awardsPartialCreditWhenSkillLacksProjectEvidence() {
        List<SkillGapAnalysisResponse.MatchedSkill> matchedWithProject = List.of(
                new SkillGapAnalysisResponse.MatchedSkill("Java", List.of("E-Commerce API"), "Has project")
        );
        List<SkillGapAnalysisResponse.MatchedSkill> matchedWithoutProject = List.of(
                new SkillGapAnalysisResponse.MatchedSkill("Java", List.of(), "Only listed in skills section")
        );

        AtsScoreResult scoreWithProject = scoringService.calculateScore(
                sampleResume, sampleAnalysis, "Java Developer", matchedWithProject, List.of(), List.of());
        AtsScoreResult scoreWithoutProject = scoringService.calculateScore(
                sampleResume, sampleAnalysis, "Java Developer", matchedWithoutProject, List.of(), List.of());

        assertThat(scoreWithProject.breakdown().requiredSkillsScore())
                .isGreaterThan(scoreWithoutProject.breakdown().requiredSkillsScore());
    }

    @Test
    void throwsExceptionWhenTargetIsBlank() {
        assertThatThrownBy(() -> scoringService.calculateScore(
                sampleResume, sampleAnalysis, "   ", List.of(), List.of(), List.of()))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Target role or job description is required");
    }

    @Test
    void scoreIsAlwaysClampedBetweenZeroAndHundred() {
        AtsScoreResult emptyResult = scoringService.calculateScore(
                new ResumeDocument("r2", "empty.pdf", "PDF", "READY", 0, List.of(), "", Instant.now()),
                null,
                "Target Role",
                List.of(),
                List.of(new SkillGapAnalysisResponse.MissingSkill("All", "Everything missing", "Learn")),
                List.of());

        assertThat(emptyResult.totalScore()).isBetween(0, 100);
    }
}
