package com.example.ResumeIQ.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Request payload for role-specific skill gap analysis.
 */
@Schema(name = "SkillGapRequest", description = "Target role or job description to compare against the uploaded resume")
public record SkillGapRequest(
        @Schema(description = "Target role title or job description text",
                example = "Senior Backend Engineer with Java, Spring Boot, PostgreSQL, and AWS experience")
        @NotBlank(message = "Target role or job description must not be blank.")
        @Size(max = 20000, message = "Target role or job description cannot exceed 20,000 characters.")
        String targetRoleOrJobDescription
) {
}
