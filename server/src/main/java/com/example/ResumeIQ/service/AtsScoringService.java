package com.example.ResumeIQ.service;

import com.example.ResumeIQ.domain.ResumeDocument;
import com.example.ResumeIQ.dto.response.AtsScoreBreakdown;
import com.example.ResumeIQ.dto.response.AtsScoreResult;
import com.example.ResumeIQ.dto.response.ResumeAnalysisResponse;
import com.example.ResumeIQ.dto.response.SkillGapAnalysisResponse;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Pattern;

/**
 * Deterministic, evidence-based ATS compatibility scoring service.
 * <p>
 * Evaluates candidate resume text and structured analysis against specific target job requirements
 * across four transparent, configurable categories:
 * 1. Required Skill Match (50 points)
 * 2. Preferred Skill Match (20 points)
 * 3. Relevant Experience and Project Evidence (20 points)
 * 4. Resume Structure and Essential Information (10 points)
 */
@Service
public class AtsScoringService {

    public static final String FORMULA_EXPLANATION =
            "Estimated ATS compatibility score evaluated using a 4-pillar heuristic: "
                    + "Required Skill Match (50 pts), Preferred Skill Match (20 pts), "
                    + "Project & Experience Evidence (20 pts), and Document Structure & Completeness (10 pts).";

    public static final String DISCLAIMER =
            "This score is an evidence-based compatibility estimate against the specified target requirements. "
                    + "It does not predict recruiter decisions, guarantee interview selection, or reflect proprietary algorithms of specific vendor ATS systems.";

    private static final Pattern EMAIL_PATTERN = Pattern.compile(
            "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}");
    private static final Pattern PHONE_PATTERN = Pattern.compile(
            "(\\+?\\d{1,3}[-.\\s]?)?\\(?\\d{3}\\)?[-.\\s]?\\d{3}[-.\\s]?\\d{4}");

    /**
     * Calculates an ATS compatibility score against target job requirements.
     *
     * @param resume              the uploaded resume document
     * @param analysis            structured resume analysis (skills, projects, education, summary)
     * @param targetRequirements  the target job description or role title
     * @param matchedSkills       skills matched from target requirements with evidence
     * @param missingSkills       skills required by target but missing in resume
     * @param skillsNeedingProof  skills appearing in resume but lacking supporting project evidence
     * @return deterministic {@link AtsScoreResult}
     */
    public AtsScoreResult calculateScore(
            ResumeDocument resume,
            ResumeAnalysisResponse analysis,
            String targetRequirements,
            List<SkillGapAnalysisResponse.MatchedSkill> matchedSkills,
            List<SkillGapAnalysisResponse.MissingSkill> missingSkills,
            List<SkillGapAnalysisResponse.EvidenceNeededSkill> skillsNeedingProof) {

        if (targetRequirements == null || targetRequirements.isBlank()) {
            throw new IllegalArgumentException("Target role or job description is required to calculate an ATS compatibility score.");
        }

        String targetClean = targetRequirements.strip();
        boolean isFullJobDescription = targetClean.length() > 120 || targetClean.contains("\n");

        // 1. Separate Required vs Preferred Skills
        Set<String> preferredKeywords = extractPreferredKeywords(targetClean);

        Set<String> deduplicatedMatched = new LinkedHashSet<>();
        List<SkillGapAnalysisResponse.MatchedSkill> requiredMatched = new ArrayList<>();
        List<SkillGapAnalysisResponse.MatchedSkill> preferredMatched = new ArrayList<>();

        if (matchedSkills != null) {
            for (var item : matchedSkills) {
                if (item == null || item.skill() == null || item.skill().isBlank()) continue;
                String normalized = item.skill().strip().toLowerCase(Locale.ROOT);
                if (deduplicatedMatched.add(normalized)) {
                    if (isPreferredSkill(item.skill(), item.evidence(), preferredKeywords)) {
                        preferredMatched.add(item);
                    } else {
                        requiredMatched.add(item);
                    }
                }
            }
        }

        Set<String> deduplicatedMissing = new LinkedHashSet<>();
        List<SkillGapAnalysisResponse.MissingSkill> requiredMissing = new ArrayList<>();
        List<SkillGapAnalysisResponse.MissingSkill> preferredMissing = new ArrayList<>();

        if (missingSkills != null) {
            for (var item : missingSkills) {
                if (item == null || item.skill() == null || item.skill().isBlank()) continue;
                String normalized = item.skill().strip().toLowerCase(Locale.ROOT);
                if (deduplicatedMissing.add(normalized)) {
                    if (isPreferredSkill(item.skill(), item.importance(), preferredKeywords)) {
                        preferredMissing.add(item);
                    } else {
                        requiredMissing.add(item);
                    }
                }
            }
        }

        // --- Category 1: Required Skill Match (Max 50 points) ---
        int requiredScore = calculateRequiredSkillsScore(requiredMatched, requiredMissing);

        // --- Category 2: Preferred Skill Match (Max 20 points) ---
        int preferredScore = calculatePreferredSkillsScore(
                preferredMatched, preferredMissing, requiredMatched, isFullJobDescription);

        // --- Category 3: Relevant Experience and Project Evidence (Max 20 points) ---
        int experienceScore = calculateExperienceEvidenceScore(analysis, targetClean, matchedSkills);

        // --- Category 4: Resume Structure and Essential Information (Max 10 points) ---
        int structureScore = calculateResumeStructureScore(resume, analysis);

        int totalScore = Math.max(0, Math.min(100, requiredScore + preferredScore + experienceScore + structureScore));

        AtsScoreBreakdown breakdown = new AtsScoreBreakdown(
                requiredScore,
                preferredScore,
                experienceScore,
                structureScore
        );

        List<String> missingRequirements = compileMissingRequirements(requiredMissing, skillsNeedingProof);

        return new AtsScoreResult(
                totalScore,
                targetClean,
                breakdown,
                missingRequirements,
                FORMULA_EXPLANATION,
                DISCLAIMER
        );
    }

    private int calculateRequiredSkillsScore(
            List<SkillGapAnalysisResponse.MatchedSkill> requiredMatched,
            List<SkillGapAnalysisResponse.MissingSkill> requiredMissing) {

        int totalRequired = requiredMatched.size() + requiredMissing.size();
        if (totalRequired == 0) {
            return 25; // Neutral baseline when job description is very short or role title only
        }

        // Award full credit for project-backed evidence, 70% credit for declaration-only skills
        double weightedPoints = 0.0;
        for (var match : requiredMatched) {
            boolean hasProjectEvidence = match.supportingProjects() != null && !match.supportingProjects().isEmpty();
            weightedPoints += hasProjectEvidence ? 1.0 : 0.70;
        }

        double ratio = weightedPoints / totalRequired;
        int score = (int) Math.round(ratio * 50.0);
        return Math.max(0, Math.min(50, score));
    }

    private int calculatePreferredSkillsScore(
            List<SkillGapAnalysisResponse.MatchedSkill> preferredMatched,
            List<SkillGapAnalysisResponse.MissingSkill> preferredMissing,
            List<SkillGapAnalysisResponse.MatchedSkill> requiredMatched,
            boolean isFullJobDescription) {

        int totalPreferred = preferredMatched.size() + preferredMissing.size();

        if (totalPreferred > 0) {
            double ratio = (double) preferredMatched.size() / totalPreferred;
            return (int) Math.round(ratio * 20.0);
        }

        // When the job description does not explicitly distinguish preferred requirements:
        // Distribute points based on depth of verified required skills and project backing
        if (!isFullJobDescription) {
            // For a role title target, reward having 3+ verified skills
            int matchedCount = requiredMatched.size();
            if (matchedCount >= 5) return 18;
            if (matchedCount >= 3) return 14;
            if (matchedCount >= 1) return 10;
            return 4;
        }

        // Full JD with no preferred keywords: grant proportional baseline
        int projectBacked = (int) requiredMatched.stream()
                .filter(m -> m.supportingProjects() != null && !m.supportingProjects().isEmpty())
                .count();
        if (projectBacked >= 3) return 17;
        if (projectBacked >= 1) return 12;
        return 8;
    }

    private int calculateExperienceEvidenceScore(
            ResumeAnalysisResponse analysis,
            String targetRequirements,
            List<SkillGapAnalysisResponse.MatchedSkill> matchedSkills) {

        int score = 0;
        if (analysis == null) {
            return score;
        }

        var projects = analysis.projects() != null ? analysis.projects() : List.<ResumeAnalysisResponse.ProjectDetail>of();
        int projectCount = projects.size();

        // 1. Project volume and documented technologies (up to 8 points)
        if (projectCount >= 3) {
            score += 8;
        } else if (projectCount == 2) {
            score += 6;
        } else if (projectCount == 1) {
            score += 4;
        }

        // 2. Project technologies aligned with matched skills (up to 7 points)
        Set<String> projectTechs = new HashSet<>();
        for (var p : projects) {
            if (p.technologies() != null) {
                for (var t : p.technologies()) {
                    projectTechs.add(t.toLowerCase(Locale.ROOT));
                }
            }
        }

        int alignedTechCount = 0;
        if (matchedSkills != null) {
            for (var m : matchedSkills) {
                if (m.supportingProjects() != null && !m.supportingProjects().isEmpty()) {
                    alignedTechCount++;
                }
            }
        }

        if (alignedTechCount >= 4) {
            score += 7;
        } else if (alignedTechCount >= 2) {
            score += 5;
        } else if (alignedTechCount == 1) {
            score += 3;
        }

        // 3. Technical responsibilities & architectural descriptions (up to 5 points)
        boolean hasDetailedDescriptions = projects.stream().anyMatch(
                p -> p.description() != null && p.description().strip().length() > 50);
        if (hasDetailedDescriptions) {
            score += 5;
        } else if (!projects.isEmpty()) {
            score += 2;
        }

        return Math.min(20, score);
    }

    private int calculateResumeStructureScore(ResumeDocument resume, ResumeAnalysisResponse analysis) {
        int score = 0;
        String rawText = resume != null && resume.text() != null ? resume.text() : "";

        // 1. Contact / Identity indicators (2 points)
        boolean hasEmail = EMAIL_PATTERN.matcher(rawText).find();
        boolean hasPhone = PHONE_PATTERN.matcher(rawText).find();
        if (hasEmail || hasPhone) {
            score += 2;
        } else if (analysis != null && analysis.professionalSummary() != null && !analysis.professionalSummary().isBlank()) {
            score += 1;
        }

        // 2. Explicit Skills Section (3 points)
        if (analysis != null && analysis.skills() != null && !analysis.skills().isEmpty()) {
            score += analysis.skills().size() >= 3 ? 3 : 2;
        } else if (rawText.toLowerCase(Locale.ROOT).contains("skill")) {
            score += 1;
        }

        // 3. Projects or Work Experience Section (3 points)
        if (analysis != null && analysis.projects() != null && !analysis.projects().isEmpty()) {
            score += 3;
        } else if (rawText.toLowerCase(Locale.ROOT).contains("project") || rawText.toLowerCase(Locale.ROOT).contains("experience")) {
            score += 2;
        }

        // 4. Education or Certifications Section (2 points)
        if (analysis != null && analysis.educationAndCertifications() != null && !analysis.educationAndCertifications().isEmpty()) {
            score += 2;
        } else if (rawText.toLowerCase(Locale.ROOT).contains("education") || rawText.toLowerCase(Locale.ROOT).contains("bachelor")
                || rawText.toLowerCase(Locale.ROOT).contains("degree")) {
            score += 1;
        }

        return Math.min(10, score);
    }

    private boolean isPreferredSkill(String skill, String contextText, Set<String> preferredKeywords) {
        if (skill == null) return false;
        String lowerSkill = skill.toLowerCase(Locale.ROOT);
        String lowerContext = contextText != null ? contextText.toLowerCase(Locale.ROOT) : "";

        if (lowerContext.contains("preferred") || lowerContext.contains("nice to have")
                || lowerContext.contains("bonus") || lowerContext.contains("optional")
                || lowerContext.contains("plus")) {
            return true;
        }

        for (String pref : preferredKeywords) {
            if (lowerSkill.contains(pref) || lowerContext.contains(pref)) {
                return true;
            }
        }

        return false;
    }

    private Set<String> extractPreferredKeywords(String targetRequirements) {
        Set<String> set = new HashSet<>();
        String lower = targetRequirements.toLowerCase(Locale.ROOT);

        int prefIdx = lower.indexOf("preferred");
        if (prefIdx != -1) {
            int end = Math.min(lower.length(), prefIdx + 300);
            extractTokens(lower.substring(prefIdx, end), set);
        }

        int niceIdx = lower.indexOf("nice to have");
        if (niceIdx != -1) {
            int end = Math.min(lower.length(), niceIdx + 300);
            extractTokens(lower.substring(niceIdx, end), set);
        }

        int plusIdx = lower.indexOf("plus:");
        if (plusIdx != -1) {
            int end = Math.min(lower.length(), plusIdx + 200);
            extractTokens(lower.substring(plusIdx, end), set);
        }

        return set;
    }

    private void extractTokens(String snippet, Set<String> targetSet) {
        String[] words = snippet.split("[,;\\n•\\-*]");
        for (String w : words) {
            String trimmed = w.trim().toLowerCase(Locale.ROOT);
            if (trimmed.length() > 2 && trimmed.length() < 30) {
                targetSet.add(trimmed);
            }
        }
    }

    private List<String> compileMissingRequirements(
            List<SkillGapAnalysisResponse.MissingSkill> missing,
            List<SkillGapAnalysisResponse.EvidenceNeededSkill> evidenceNeeded) {

        List<String> result = new ArrayList<>();
        if (missing != null) {
            for (var m : missing) {
                if (m != null && m.skill() != null && !m.skill().isBlank()) {
                    String reason = m.importance() != null && !m.importance().isBlank()
                            ? " (" + m.importance().strip() + ")"
                            : "";
                    result.add("Missing required skill: " + m.skill().strip() + reason);
                }
            }
        }

        if (evidenceNeeded != null) {
            for (var e : evidenceNeeded) {
                if (e != null && e.skill() != null && !e.skill().isBlank()) {
                    String issue = e.issue() != null && !e.issue().isBlank()
                            ? " (" + e.issue().strip() + ")"
                            : " (needs verifiable project context)";
                    result.add("Evidence needed: " + e.skill().strip() + issue);
                }
            }
        }

        return result;
    }
}
