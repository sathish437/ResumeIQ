package com.example.ResumeIQ.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

import java.util.List;

/**
 * Deterministic, evidence-based ATS compatibility score evaluated against specific target requirements.
 */
@Schema(name = "AtsScoreResult", description = "ATS compatibility score and transparent category breakdown")
public record AtsScoreResult(
        @Schema(description = "Overall compatibility score out of 100", example = "82")
        int totalScore,

        @Schema(description = "Target role or job description evaluated against", example = "Senior Backend Engineer")
        String targetRoleOrJobDescription,

        @Schema(description = "Category-by-category score breakdown")
        AtsScoreBreakdown breakdown,

        @Schema(description = "Important missing requirements or gaps identified from target requirements")
        List<String> missingRequirements,

        @Schema(description = "Transparent description of scoring weights and methodology")
        String formulaExplanation,

        @Schema(description = "Important disclaimer regarding heuristic nature of ATS compatibility estimation")
        String disclaimer
) {}
