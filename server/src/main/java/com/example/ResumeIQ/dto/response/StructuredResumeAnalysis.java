package com.example.ResumeIQ.dto.response;

import java.util.List;

/**
 * Structured model output schema for Spring AI ChatClient for resume analysis.
 */
public record StructuredResumeAnalysis(
        String professionalSummary,
        List<String> skills,
        List<ResumeAnalysisResponse.ProjectDetail> projects,
        List<String> educationAndCertifications,
        List<String> missingOrUnavailableInformation
) {
}
