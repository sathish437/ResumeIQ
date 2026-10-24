package com.example.ResumeIQ.dto.response;

import java.util.List;

/**
 * Structured model output schema for Spring AI ChatClient for skill gap analysis.
 */
public record StructuredSkillGapAnalysis(
        Integer matchPercentage,
        List<SkillGapAnalysisResponse.MatchedSkill> matchedSkills,
        List<SkillGapAnalysisResponse.MissingSkill> missingSkills,
        List<SkillGapAnalysisResponse.EvidenceNeededSkill> skillsNeedingEvidence,
        List<SkillGapAnalysisResponse.RecommendedNextStep> recommendedNextSteps,
        List<SkillGapAnalysisResponse.RoadmapStepResponse> roadmap
) {
    public StructuredSkillGapAnalysis(
            Integer matchPercentage,
            List<SkillGapAnalysisResponse.MatchedSkill> matchedSkills,
            List<SkillGapAnalysisResponse.MissingSkill> missingSkills,
            List<SkillGapAnalysisResponse.EvidenceNeededSkill> skillsNeedingEvidence,
            List<SkillGapAnalysisResponse.RecommendedNextStep> recommendedNextSteps) {
        this(matchPercentage, matchedSkills, missingSkills, skillsNeedingEvidence, recommendedNextSteps, List.of());
    }
}
