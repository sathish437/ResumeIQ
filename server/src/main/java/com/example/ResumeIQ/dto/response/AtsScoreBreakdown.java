package com.example.ResumeIQ.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

/**
 * Breakdown of the evidence-based ATS compatibility score across transparent weighted categories.
 */
@Schema(name = "AtsScoreBreakdown", description = "Weighted score breakdown across ATS evaluation categories")
public record AtsScoreBreakdown(
        @Schema(description = "Required skill match points (max 50)", example = "42")
        int requiredSkillsScore,

        @Schema(description = "Preferred skill match points (max 20)", example = "15")
        int preferredSkillsScore,

        @Schema(description = "Relevant experience and project evidence points (max 20)", example = "16")
        int experienceEvidenceScore,

        @Schema(description = "Resume structure and essential information points (max 10)", example = "9")
        int resumeStructureScore
) {}
