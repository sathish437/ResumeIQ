package com.example.ResumeIQ.service;

import com.example.ResumeIQ.domain.AppUser;
import com.example.ResumeIQ.domain.ResumeDocument;
import com.example.ResumeIQ.dto.request.SkillGapRequest;
import com.example.ResumeIQ.dto.response.ResumeAnalysisResponse;
import com.example.ResumeIQ.dto.response.SkillGapAnalysisResponse;
import com.example.ResumeIQ.dto.response.StructuredResumeAnalysis;
import com.example.ResumeIQ.dto.response.StructuredSkillGapAnalysis;
import com.example.ResumeIQ.exception.AiServiceException;
import com.example.ResumeIQ.exception.DocumentValidationException;
import com.example.ResumeIQ.exception.ResumeNotFoundException;
import com.example.ResumeIQ.repository.ResumeAnalysisRepository;
import com.example.ResumeIQ.repository.ResumeRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * Analyzes stored resume content using {@link ChatClient} to produce structured insights
 * (professional summary, skills, projects, education, missing details, skill gap analysis) and persists them.
 */
@Service
public class ResumeAnalysisService {

    private static final Logger log = LoggerFactory.getLogger(ResumeAnalysisService.class);

    static final String SYSTEM_PROMPT = """
            You are ResumeIQ, an evidence-based resume analysis system.

            Rules:
            1. Analyze ONLY the supplied resume content. The resume is your single source of truth.
            2. Never invent or assume skills, projects, qualifications, certifications, dates, or metrics.
               If the resume does not mention it, it does not exist.
            3. Produce a structured analysis containing:
               - professionalSummary: A concise professional summary based strictly on the resume.
               - skills: Explicitly mentioned technical and domain skills.
               - projects: List of projects with "name", "technologies" used, and "description".
               - educationAndCertifications: Degrees, schools, certifications mentioned.
               - missingOrUnavailableInformation: Important career or document details that are omitted (e.g. contact info, dates, metrics).
            """;

    static final String SKILL_GAP_SYSTEM_PROMPT = """
            You are ResumeIQ, an evidence-based skill gap analyzer and career roadmap architect.

            Rules:
            1. Evidence-Based Grounding: Analyze ONLY the supplied resume content as candidate truth.
               Never invent or assume skills, projects, qualifications, or experience.
            2. Role/Job Description Grounding: Compare the resume strictly against the target role
               or job description provided by the user. If a complete job description is supplied,
               extract required skills, preferred skills, responsibilities, and experience expectations.
               Do not assume every listed technology is mandatory if marked preferred or optional.
            3. Strict Classification:
               - matchedSkills: Required or preferred skills from the target/job description that ARE supported
                 by evidence in the resume. For each matched skill, list "supportingProjects" (project names
                 from the resume) and "evidence" (brief explanation of how it is demonstrated in the resume).
               - missingSkills: Required skills explicitly mentioned or clearly required by the target/job description
                 that are genuinely absent from the resume. For each, specify "importance" (why required)
                 and a practical "learningAction" to bridge the gap.
                 Do NOT classify general technologies as missing unless demanded by the target role.
               - skillsNeedingEvidence: Skills that appear in the resume (e.g. mentioned in a skills list)
                 but lack sufficient supporting evidence, project depth, or context. Specify "issue" and
                 a concrete "recommendation".
               - recommendedNextSteps: Concrete, prioritized actionable next steps to bridge genuine gaps.
            4. Dynamic 6-Step Learning Roadmap:
               Generate EXACTLY SIX sequential, domain-specific steps tailored strictly to this candidate's
               existing evidence and the target role/job description. Never use a fixed generic roadmap.
               Progress logically through these 6 stages:
                 Stage 1 (stepNumber: 1): Foundation — Strengthen relevant prerequisites and existing skills.
                 Stage 2 (stepNumber: 2): Priority Skill Gaps — Address the most critical missing or weak skills.
                 Stage 3 (stepNumber: 3): Practical Implementation — Complete focused exercises and hands-on modules.
                 Stage 4 (stepNumber: 4): Project and Validation — Build or upgrade a relevant portfolio project.
                 Stage 5 (stepNumber: 5): Career Evidence and Interview Prep — Architecture explanations, system design, mock Q&A.
                 Stage 6 (stepNumber: 6): Job Readiness and Applications — Portfolio polish, resume bullet points, targeted applications.
               Each step must include:
                 - stepNumber: integer 1 to 6
                 - title: concise, role-specific title
                 - focus: domain focus area
                 - whatToDo: concrete, actionable objectives and tasks
                 - whyItMatters: why this step matters for the target role
                 - practicalTask: a measurable, verifiable completion criterion
                 - dependencies: prerequisite earlier steps (e.g. "Prerequisite: Step 1") or empty string
                 - estimatedEffort: realistic timeline (e.g. "1-2 weeks")
            5. Match Calculation:
               Calculate matchPercentage (integer between 0 and 100) based strictly on matched required skills
               versus total required skills from the job description (e.g. matched / (matched + missing) * 100).
               Never invent arbitrary scores.
            """;

    private final ChatClient chatClient;
    private final ResumeRepository resumeRepository;
    private final ResumeAnalysisRepository analysisRepository;
    private final ResumeSessionContext sessionContext;
    private final ObjectMapper objectMapper;

    public ResumeAnalysisService(ChatClient chatClient,
                                 ResumeRepository resumeRepository,
                                 ResumeAnalysisRepository analysisRepository,
                                 ResumeSessionContext sessionContext,
                                 @org.springframework.beans.factory.annotation.Autowired(required = false) ObjectMapper objectMapper) {
        this.chatClient = chatClient;
        this.resumeRepository = resumeRepository;
        this.analysisRepository = analysisRepository;
        this.sessionContext = sessionContext;
        this.objectMapper = objectMapper != null ? objectMapper : new ObjectMapper();
    }

    public ResumeAnalysisResponse analyze(AppUser user) {
        if (user == null || user.id() == null) {
            return analyze();
        }
        ResumeDocument resume = resumeRepository.findLatestByUserId(user.id())
                .orElseThrow(ResumeNotFoundException::noResumeUploaded);
        return analyzeDocument(resume);
    }

    public ResumeAnalysisResponse analyze(String resumeId, AppUser user) {
        if (user == null || user.id() == null) {
            return analyze(resumeId);
        }
        ResumeDocument resume = resumeRepository.findByIdAndUserId(resumeId, user.id())
                .orElseThrow(() -> new ResumeNotFoundException(resumeId));
        return analyzeDocument(resume);
    }

    public ResumeAnalysisResponse analyze() {
        String resumeId = sessionContext.getRecentResumeId()
                .orElseThrow(ResumeNotFoundException::noResumeUploaded);
        return analyze(resumeId);
    }

    public ResumeAnalysisResponse analyze(String resumeId) {
        ResumeDocument resume = resumeRepository.findById(resumeId)
                .orElseThrow(() -> new ResumeNotFoundException(resumeId));
        return analyzeDocument(resume);
    }

    private ResumeAnalysisResponse analyzeDocument(ResumeDocument resume) {
        // Check if an analysis has already been persisted
        var existing = analysisRepository.findByResumeId(resume.id());
        if (existing.isPresent()) {
            return existing.get();
        }

        StructuredResumeAnalysis structured = askModelForAnalysis(resume);

        ResumeAnalysisResponse response = new ResumeAnalysisResponse(
                resume.id(),
                structured.professionalSummary() != null ? structured.professionalSummary().strip() : "",
                structured.skills() != null ? structured.skills() : List.of(),
                structured.projects() != null ? structured.projects() : List.of(),
                structured.educationAndCertifications() != null ? structured.educationAndCertifications() : List.of(),
                structured.missingOrUnavailableInformation() != null ? structured.missingOrUnavailableInformation() : List.of(),
                Instant.now());

        analysisRepository.save(response);
        return response;
    }

    private StructuredResumeAnalysis askModelForAnalysis(ResumeDocument resume) {
        StructuredResumeAnalysis structured = null;
        String rawContent = null;

        try {
            var callSpec = chatClient.prompt()
                    .system(SYSTEM_PROMPT)
                    .user("Resume content from file '" + resume.filename() + "':\n---\n" + resume.text() + "\n---")
                    .call();

            try {
                structured = callSpec.entity(StructuredResumeAnalysis.class);
            } catch (Exception ex) {
                log.debug("Direct analysis structured output call unmocked or failed: {}", ex.getMessage());
            }

            if (structured == null || structured.professionalSummary() == null) {
                rawContent = callSpec.content();
            }
        } catch (RuntimeException ex) {
            log.warn("Resume analysis failed for resume {}: {}", resume.id(), ex.getMessage());
            throw new AiServiceException(
                    "The AI assistant is currently unavailable. Please try again later.", ex);
        }

        if (structured != null) {
            return structured;
        }

        if (rawContent != null && !rawContent.isBlank()) {
            String stripped = rawContent.strip();
            if (stripped.startsWith("{") && stripped.endsWith("}")) {
                try {
                    return objectMapper.readValue(stripped, StructuredResumeAnalysis.class);
                } catch (Exception ignored) {
                }
            }
            return new StructuredResumeAnalysis(
                    stripped,
                    List.of(),
                    List.of(),
                    List.of(),
                    List.of());
        }

        throw new AiServiceException("The AI assistant returned an empty analysis.");
    }

    public SkillGapAnalysisResponse analyzeSkillGap(SkillGapRequest request, AppUser user) {
        if (user == null || user.id() == null) {
            return analyzeSkillGap(request);
        }
        ResumeDocument resume = resumeRepository.findLatestByUserId(user.id())
                .orElseThrow(ResumeNotFoundException::noResumeUploaded);
        return executeSkillGapAnalysis(resume, request);
    }

    public SkillGapAnalysisResponse analyzeSkillGap(String resumeId, SkillGapRequest request, AppUser user) {
        if (user == null || user.id() == null) {
            return analyzeSkillGap(resumeId, request);
        }
        ResumeDocument resume = resumeRepository.findByIdAndUserId(resumeId, user.id())
                .orElseThrow(() -> new ResumeNotFoundException(resumeId));
        return executeSkillGapAnalysis(resume, request);
    }

    public SkillGapAnalysisResponse analyzeSkillGap(SkillGapRequest request) {
        String resumeId = sessionContext.getRecentResumeId()
                .orElseThrow(ResumeNotFoundException::noResumeUploaded);
        return analyzeSkillGap(resumeId, request);
    }

    public SkillGapAnalysisResponse analyzeSkillGap(String resumeId, SkillGapRequest request) {
        ResumeDocument resume = resumeRepository.findById(resumeId)
                .orElseThrow(() -> new ResumeNotFoundException(resumeId));
        return executeSkillGapAnalysis(resume, request);
    }

    private SkillGapAnalysisResponse executeSkillGapAnalysis(ResumeDocument resume, SkillGapRequest request) {
        if (request == null || request.targetRoleOrJobDescription() == null || request.targetRoleOrJobDescription().isBlank()) {
            throw new DocumentValidationException("targetRoleOrJobDescription", "Target role or job description must not be blank.");
        }

        StructuredSkillGapAnalysis structured = askModelForSkillGap(resume, request.targetRoleOrJobDescription().strip());

        int matchedCount = structured.matchedSkills() != null ? structured.matchedSkills().size() : 0;
        int missingCount = structured.missingSkills() != null ? structured.missingSkills().size() : 0;
        int total = matchedCount + missingCount;

        Integer percentage = structured.matchPercentage();
        if (percentage == null) {
            percentage = total > 0 ? Math.round((float) matchedCount / total * 100) : 0;
        } else {
            percentage = Math.max(0, Math.min(100, percentage));
        }

        List<SkillGapAnalysisResponse.RoadmapStepResponse> validatedRoadmap = ensureSixRoadmapSteps(
                structured.roadmap(),
                request.targetRoleOrJobDescription().strip(),
                structured.matchedSkills(),
                structured.missingSkills());

        return new SkillGapAnalysisResponse(
                resume.id(),
                request.targetRoleOrJobDescription().strip(),
                percentage,
                structured.matchedSkills() != null ? structured.matchedSkills() : List.of(),
                structured.missingSkills() != null ? structured.missingSkills() : List.of(),
                structured.skillsNeedingEvidence() != null ? structured.skillsNeedingEvidence() : List.of(),
                structured.recommendedNextSteps() != null ? structured.recommendedNextSteps() : List.of(),
                validatedRoadmap,
                Instant.now()
        );
    }

    private StructuredSkillGapAnalysis askModelForSkillGap(ResumeDocument resume, String targetRoleOrJobDescription) {
        StructuredSkillGapAnalysis structured = null;
        String rawContent = null;

        try {
            var callSpec = chatClient.prompt()
                    .system(SKILL_GAP_SYSTEM_PROMPT)
                    .user("""
                            Resume content from file '%s':
                            ---
                            %s
                            ---

                            Target Role or Job Description:
                            ---
                            %s
                            ---
                            """.formatted(resume.filename(), resume.text(), targetRoleOrJobDescription))
                    .call();

            try {
                structured = callSpec.entity(StructuredSkillGapAnalysis.class);
            } catch (Exception ex) {
                log.debug("Direct skill gap structured output call unmocked or failed: {}", ex.getMessage());
            }

            if (structured == null || structured.matchedSkills() == null) {
                rawContent = callSpec.content();
            }
        } catch (RuntimeException ex) {
            log.warn("Skill gap analysis failed for resume {}: {}", resume.id(), ex.getMessage());
            throw new AiServiceException(
                    "The AI assistant is currently unavailable. Please try again later.", ex);
        }

        if (structured != null) {
            return structured;
        }

        if (rawContent != null && !rawContent.isBlank()) {
            String stripped = rawContent.strip();
            if (stripped.startsWith("{") && stripped.endsWith("}")) {
                try {
                    return objectMapper.readValue(stripped, StructuredSkillGapAnalysis.class);
                } catch (Exception ignored) {
                }
            }
        }

        return new StructuredSkillGapAnalysis(0, List.of(), List.of(), List.of(), List.of(), List.of());
    }

    List<SkillGapAnalysisResponse.RoadmapStepResponse> ensureSixRoadmapSteps(
            List<SkillGapAnalysisResponse.RoadmapStepResponse> inputRoadmap,
            String targetRoleOrJobDescription,
            List<SkillGapAnalysisResponse.MatchedSkill> matchedSkills,
            List<SkillGapAnalysisResponse.MissingSkill> missingSkills) {

        List<SkillGapAnalysisResponse.RoadmapStepResponse> validSteps = new ArrayList<>();
        if (inputRoadmap != null) {
            for (var step : inputRoadmap) {
                if (step != null && step.title() != null && !step.title().isBlank()) {
                    validSteps.add(step);
                }
            }
        }

        if (validSteps.size() == 6) {
            List<SkillGapAnalysisResponse.RoadmapStepResponse> renumbered = new ArrayList<>();
            for (int i = 0; i < 6; i++) {
                var s = validSteps.get(i);
                renumbered.add(new SkillGapAnalysisResponse.RoadmapStepResponse(
                        i + 1,
                        s.title(),
                        s.focus() != null && !s.focus().isBlank() ? s.focus() : "Stage " + (i + 1),
                        s.whatToDo() != null && !s.whatToDo().isBlank() ? s.whatToDo() : "Execute objectives for " + s.title(),
                        s.whyItMatters() != null && !s.whyItMatters().isBlank() ? s.whyItMatters() : "Essential milestone for " + targetRoleOrJobDescription,
                        s.practicalTask() != null && !s.practicalTask().isBlank() ? s.practicalTask() : "Complete measurable verification project",
                        s.dependencies() != null ? s.dependencies() : (i > 0 ? "Prerequisite: Step " + i : ""),
                        s.estimatedEffort() != null && !s.estimatedEffort().isBlank() ? s.estimatedEffort() : "1-2 weeks"
                ));
            }
            return renumbered;
        }

        String primaryRole = targetRoleOrJobDescription.length() > 60
                ? targetRoleOrJobDescription.substring(0, 60).trim() + "..."
                : targetRoleOrJobDescription.trim();

        String topMatched = (matchedSkills != null && !matchedSkills.isEmpty())
                ? matchedSkills.get(0).skill()
                : "core engineering fundamentals";

        String topMissing = (missingSkills != null && !missingSkills.isEmpty())
                ? missingSkills.get(0).skill()
                : "advanced role architecture";

        String secondMissing = (missingSkills != null && missingSkills.size() > 1)
                ? missingSkills.get(1).skill()
                : "production testing & deployment";

        return List.of(
                new SkillGapAnalysisResponse.RoadmapStepResponse(
                        1,
                        "Foundation: Strengthen Core " + topMatched + " Prerequisites",
                        "Prerequisites & Architecture Fundamentals",
                        "Solidify foundational design patterns, language idiom proficiency, and robust exception handling in " + topMatched + ".",
                        "A solid architectural base prevents technical debt and ensures production stability in " + primaryRole + ".",
                        "Audit existing code repository for clean separation of concerns and write comprehensive unit tests.",
                        "",
                        "1-2 weeks"
                ),
                new SkillGapAnalysisResponse.RoadmapStepResponse(
                        2,
                        "Priority Skill Gaps: Bridge " + topMissing + " Requirements",
                        "Primary Skill Gap Remediation",
                        "Focus on acquiring practical fluency in " + topMissing + " via targeted documentation, official guides, and focused exercises.",
                        topMissing + " is an essential qualification for " + primaryRole + " positions and an immediate hiring filter.",
                        "Build an isolated prototype module integrating " + topMissing + " with verifiable test outputs.",
                        "Prerequisite: Step 1",
                        "1-2 weeks"
                ),
                new SkillGapAnalysisResponse.RoadmapStepResponse(
                        3,
                        "Practical Implementation: Master " + secondMissing + " Integration",
                        "Hands-On Tooling & Toolchain Integration",
                        "Implement end-to-end features connecting " + topMatched + " and " + topMissing + " with " + secondMissing + ".",
                        "Demonstrating end-to-end integration bridges theoretical knowledge with real enterprise workflows.",
                        "Implement end-to-end workflow with automated validation and error logging.",
                        "Prerequisite: Step 2",
                        "2 weeks"
                ),
                new SkillGapAnalysisResponse.RoadmapStepResponse(
                        4,
                        "Project and Validation: Production-Grade Portfolio Milestone",
                        "Comprehensive Demonstration Project",
                        "Build or upgrade a standout full-lifecycle application tailored for " + primaryRole + ", complete with CI/CD and containerization.",
                        "Hiring managers evaluate verifiable project architecture and commit histories over self-proclaimed skills.",
                        "Publish an open-source GitHub repository with clean architecture, interactive demo, and CI test badge.",
                        "Prerequisite: Step 3",
                        "2-3 weeks"
                ),
                new SkillGapAnalysisResponse.RoadmapStepResponse(
                        5,
                        "Career Evidence and Interview Prep: System Design & Deep Dive",
                        "Technical Articulation & Whiteboard Scenarios",
                        "Practice explaining architectural trade-offs, scalability bottlenecks, and debugging stories for " + primaryRole + ".",
                        "Technical interviews evaluate trade-off reasoning and problem-solving clarity as much as code syntax.",
                        "Complete 5 mock interview rounds covering system design, live coding, and behavioral STAR stories.",
                        "Prerequisite: Step 4",
                        "1-2 weeks"
                ),
                new SkillGapAnalysisResponse.RoadmapStepResponse(
                        6,
                        "Job Readiness and Applications: Portfolio Launch & Targeted Search",
                        "Resume Polish & Strategic Job Applications",
                        "Update resume bullet points with quantified business impacts, deliverables from Step 4, and target " + primaryRole + " openings.",
                        "Tailored applications with demonstrable repository links yield significantly higher response rates.",
                        "Submit 5 high-alignment applications per week with customized cover notes referencing your validated project.",
                        "Prerequisite: Step 5",
                        "Ongoing"
                )
        );
    }
}
