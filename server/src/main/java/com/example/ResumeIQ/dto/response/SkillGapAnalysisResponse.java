package com.example.ResumeIQ.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.Instant;
import java.util.List;

/**
 * Structured response for role-specific skill gap analysis.
 */
@Schema(name = "SkillGapAnalysisResponse", description = "Structured skill gap analysis comparing resume against target role or job requirements")
public record SkillGapAnalysisResponse(
        @Schema(description = "Resume identifier", example = "0f8b9a6c-1d2e-4f3a-9c7b-5d6e7f8a9b0c")
        String resumeId,

        @Schema(description = "Target role or job description evaluated", example = "Senior Backend Engineer")
        String targetRoleOrJobDescription,

        @Schema(description = "Match percentage (0-100) calculated as matched / (matched + missing) * 100", example = "75")
        Integer matchPercentage,

        @Schema(description = "Required skills matched by the resume with supporting project evidence")
        List<MatchedSkill> matchedSkills,

        @Schema(description = "Required skills genuinely missing from the resume with learning actions")
        List<MissingSkill> missingSkills,

        @Schema(description = "Skills appearing in the resume that lack sufficient supporting evidence")
        List<EvidenceNeededSkill> skillsNeedingEvidence,

        @Schema(description = "Prioritized recommendations and actionable next steps")
        List<RecommendedNextStep> recommendedNextSteps,

        @Schema(description = "Personalized six-step learning roadmap tailored to the target role and evidence")
        List<RoadmapStepResponse> roadmap,

        @Schema(description = "Estimated ATS compatibility score breakdown evaluated against target requirements")
        AtsScoreResult atsScore,

        @Schema(description = "Timestamp when analysis was generated")
        Instant analyzedAt
) {
    public SkillGapAnalysisResponse(
            String resumeId,
            String targetRoleOrJobDescription,
            Integer matchPercentage,
            List<MatchedSkill> matchedSkills,
            List<MissingSkill> missingSkills,
            List<EvidenceNeededSkill> skillsNeedingEvidence,
            List<RecommendedNextStep> recommendedNextSteps,
            List<RoadmapStepResponse> roadmap,
            Instant analyzedAt) {
        this(resumeId, targetRoleOrJobDescription, matchPercentage, matchedSkills, missingSkills,
                skillsNeedingEvidence, recommendedNextSteps, roadmap, null, analyzedAt);
    }

    public SkillGapAnalysisResponse(
            String resumeId,
            String targetRoleOrJobDescription,
            Integer matchPercentage,
            List<MatchedSkill> matchedSkills,
            List<MissingSkill> missingSkills,
            List<EvidenceNeededSkill> skillsNeedingEvidence,
            List<RecommendedNextStep> recommendedNextSteps,
            Instant analyzedAt) {
        this(resumeId, targetRoleOrJobDescription, matchPercentage, matchedSkills, missingSkills,
                skillsNeedingEvidence, recommendedNextSteps, List.of(), null, analyzedAt);
    }

    public record MatchedSkill(
            @Schema(description = "Skill name", example = "Spring Boot")
            String skill,

            @Schema(description = "Relevant projects supporting this matched skill")
            List<String> supportingProjects,

            @Schema(description = "Evidence explanation from the resume", example = "Developed payments platform using Spring Boot and PostgreSQL")
            String evidence
    ) {}

    public record MissingSkill(
            @Schema(description = "Missing skill name", example = "Kubernetes")
            String skill,

            @Schema(description = "Requirement importance in the target role", example = "Required for production container orchestration")
            String importance,

            @Schema(description = "Suggested learning or improvement action", example = "Deploy a containerized sample project using Minikube or complete CKAD practice labs")
            String learningAction
    ) {}

    public record EvidenceNeededSkill(
            @Schema(description = "Skill name", example = "AWS")
            String skill,

            @Schema(description = "Why additional evidence is required", example = "Listed in skills section but without specific AWS services or project context")
            String issue,

            @Schema(description = "Suggested improvement to demonstrate proficiency", example = "Specify exact AWS services used (e.g. S3, ECS, RDS) in project bullet points")
            String recommendation
    ) {}

    public record RecommendedNextStep(
            @Schema(description = "Action title", example = "Add Container Orchestration Proof")
            String title,

            @Schema(description = "Action detail", example = "Add a project or work experience bullet describing your container deployment experience")
            String description,

            @Schema(description = "Priority level", example = "High")
            String priority
    ) {}

    public record RoadmapStepResponse(
            @Schema(description = "Sequential step number from 1 to 6", example = "1")
            Integer stepNumber,

            @Schema(description = "Concise role-specific step title", example = "Strengthen Java Core & Spring Boot Architecture")
            String title,

            @Schema(description = "Domain focus area", example = "Backend Architecture Fundamentals")
            String focus,

            @Schema(description = "Specific objectives and actionable tasks", example = "Audit existing projects for SOLID design principles and connection pooling")
            String whatToDo,

            @Schema(description = "Why the step matters for the target role", example = "Essential foundation for building enterprise microservices")
            String whyItMatters,

            @Schema(description = "Measurable completion criterion", example = "Refactor service layer with unit tests and Flyway migrations")
            String practicalTask,

            @Schema(description = "Prerequisites referencing earlier steps, or empty", example = "Prerequisite: Step 1")
            String dependencies,

            @Schema(description = "Estimated effort", example = "1-2 weeks")
            String estimatedEffort
    ) {}
}
