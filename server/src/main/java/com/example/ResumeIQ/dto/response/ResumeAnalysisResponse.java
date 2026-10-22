package com.example.ResumeIQ.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.Instant;
import java.util.List;

/**
 * Structured analysis of an uploaded resume.
 */
@Schema(name = "ResumeAnalysisResponse", description = "Structured resume analysis")
public record ResumeAnalysisResponse(
        @Schema(description = "Resume identifier", example = "0f8b9a6c-1d2e-4f3a-9c7b-5d6e7f8a9b0c")
        String resumeId,

        @Schema(description = "Professional summary based only on the resume",
                example = "Software engineer with 5 years of experience in backend development.")
        String professionalSummary,

        @Schema(description = "Skills explicitly mentioned in the resume",
                example = "[\"Java\", \"Spring Boot\", \"PostgreSQL\"]")
        List<String> skills,

        @Schema(description = "Projects and their technologies")
        List<ProjectDetail> projects,

        @Schema(description = "Education and certifications explicitly mentioned")
        List<String> educationAndCertifications,

        @Schema(description = "Missing or unavailable information (e.g. missing dates, contact info, metrics)")
        List<String> missingOrUnavailableInformation,

        @Schema(description = "Timestamp when analysis was generated", example = "2026-10-21T10:15:30Z")
        Instant analyzedAt
) {
    public record ProjectDetail(
            @Schema(description = "Project title or name", example = "Payments Platform")
            String name,

            @Schema(description = "Technologies used in the project", example = "[\"Spring Boot\", \"Kafka\"]")
            List<String> technologies,

            @Schema(description = "Description of the project based strictly on the resume", example = "High throughput transaction processor")
            String description
    ) {}
}
