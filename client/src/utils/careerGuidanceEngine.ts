import type {
  ResumeAnalysisResponse,
  SkillGapAnalysisResponse,
  ProjectDetail,
  RecommendedRole as BackendRecommendedRole,
} from '../types/resume';

export interface ApparentExperienceLevel {
  level: string;
  evidence: string;
  confidence: 'high' | 'moderate' | 'limited';
}

export interface CareerProfileData {
  technicalSummary: string;
  apparentLevel: ApparentExperienceLevel;
  totalSkillsCount: number;
  totalProjectsCount: number;
  explicitSkills: string[];
  projectTechnologies: string[];
  allDetectedSkills: string[];
  keyProjects: ProjectDetail[];
}

export interface MatchedEvidenceSkill {
  skill: string;
  supportingProjects: string[];
  evidence: string;
}

export interface MissingRoleSkill {
  skill: string;
  importance: string;
  learningAction: string;
  status: 'Not found in resume';
}

export interface WeakEvidenceSkill {
  skill: string;
  issue: string;
  recommendation: string;
}

export interface PracticalExperienceRecommendation {
  title: string;
  focus: string;
  recommendedProject: string;
  deliverables: string[];
}

export interface RoadmapStep {
  id: string;
  stepNumber: number;
  title: string;
  focus: string;
  whatToDo: string;
  whyItMatters: string;
  practicalTask: string;
  dependencies?: string;
  estimatedEffort?: string;
}

export interface NextActionsChecklist {
  whatToLearnFirst: {
    skill: string;
    action: string;
  };
  whatProjectToBuild: {
    title: string;
    description: string;
  };
  whatResumeEvidenceToAdd: {
    guidance: string;
    exampleBulletPoint: string;
  };
  whatToPractiseBeforeApplying: {
    topic: string;
    guidance: string;
  };
}

export interface RecommendedJobRole {
  id: string;
  title: string;
  category: string;
  fitRank: number;
  fitBadge: string;
  fitRationale: string;
  matchedSkills: MatchedEvidenceSkill[];
  skillsToDevelop: string[];
  supportingProjects: string[];
  alreadyHave: MatchedEvidenceSkill[];
  needToImprove: WeakEvidenceSkill[];
  needToLearn: MissingRoleSkill[];
  practicalExperience: PracticalExperienceRecommendation;
  roadmap: RoadmapStep[];
  nextActions: NextActionsChecklist;
  isCustomTarget?: boolean;
}

/**
 * Derives experience level strictly from verified resume text without fabricating seniority.
 */
function deriveApparentExperienceLevel(analysis: ResumeAnalysisResponse): ApparentExperienceLevel {
  const summary = (analysis.professionalSummary || '').toLowerCase();
  const education = (analysis.educationAndCertifications || []).join(' ').toLowerCase();
  const projectCount = analysis.projects ? analysis.projects.length : 0;

  // 1. Check for explicit years of experience stated in professional summary
  const yearsMatch = summary.match(/(\d+)\+?\s*(?:years?|yrs?)\s*(?:of)?\s*(?:experience|exp)/i);
  if (yearsMatch) {
    const years = parseInt(yearsMatch[1], 10);
    if (!isNaN(years) && years > 0) {
      const label = years >= 5
        ? `${years}+ Years Stated Experience (Senior)`
        : years >= 2
        ? `${years}+ Years Stated Experience`
        : `${years} Year Stated Experience`;
      return {
        level: label,
        evidence: `Explicitly stated in professional summary: "${yearsMatch[0]}".`,
        confidence: 'high',
      };
    }
  }

  // 2. Check for explicit fresher / student / early career indicators
  if (/fresher|entry[- ]level|intern|student|recent grad|junior/i.test(summary) ||
      /b\.?tech|b\.?e\.?|b\.?s\.?|bachelor|student/i.test(education)) {
    return {
      level: 'Fresher / Early Career',
      evidence: `Academic qualifications and ${projectCount} project(s) documented. Duration not explicitly quantified in resume.`,
      confidence: 'moderate',
    };
  }

  // 3. Fallback to documented projects
  if (projectCount > 0) {
    return {
      level: 'Project-Demonstrated Developer',
      evidence: `Demonstrates capability through ${projectCount} technical project(s). Years of professional experience not stated.`,
      confidence: 'moderate',
    };
  }

  return {
    level: 'Experience Not Specified',
    evidence: 'The uploaded resume does not explicitly quantify years of experience or project timelines.',
    confidence: 'limited',
  };
}

/**
 * Extracts candidate career profile data from the parsed resume.
 */
export function extractCareerProfile(analysis: ResumeAnalysisResponse): CareerProfileData {
  const explicitSkills = (analysis.skills || []).map((s) => s.trim()).filter(Boolean);
  const projectTechSet = new Set<string>();

  (analysis.projects || []).forEach((proj) => {
    (proj.technologies || []).forEach((tech) => {
      const clean = tech.trim();
      if (clean) projectTechSet.add(clean);
    });
  });

  const projectTechnologies = Array.from(projectTechSet);
  const allSet = new Set<string>();
  explicitSkills.forEach((s) => allSet.add(s));
  projectTechnologies.forEach((s) => allSet.add(s));
  const allDetectedSkills = Array.from(allSet);

  const apparentLevel = deriveApparentExperienceLevel(analysis);

  let technicalSummary = analysis.professionalSummary?.trim() || '';
  if (!technicalSummary) {
    const topSkillsStr = allDetectedSkills.slice(0, 5).join(', ');
    technicalSummary = `Technical profile with demonstrated skills in ${topSkillsStr || 'software engineering'} across ${analysis.projects?.length || 0} documented project(s).`;
  }

  return {
    technicalSummary,
    apparentLevel,
    totalSkillsCount: allDetectedSkills.length,
    totalProjectsCount: analysis.projects?.length || 0,
    explicitSkills,
    projectTechnologies,
    allDetectedSkills,
    keyProjects: analysis.projects || [],
  };
}

/**
 * Generates a domain-specific 6-stage roadmap for any target role.
 */
export function generateCanonicalRoadmap(
  roleTitle: string,
  matchedSkills: string[],
  missingSkills: string[]
): RoadmapStep[] {
  const topMatched = matchedSkills[0] || 'Core Technical Foundations';
  const topMissing = missingSkills[0] || 'Target Architecture Requirements';
  const secondMissing = missingSkills[1] || 'Testing & Production Tooling';

  return [
    {
      id: 'step-1',
      stepNumber: 1,
      title: `Foundation: Strengthen ${topMatched} Prerequisites`,
      focus: 'Architecture & Language Prerequisites',
      whatToDo: `Solidify core design patterns, clean code principles, and robust exception handling in ${topMatched}.`,
      whyItMatters: `A reliable foundation prevents architectural debt when tackling advanced requirements for ${roleTitle}.`,
      practicalTask: `Audit your existing ${topMatched} codebase and write thorough unit tests with Mockito/Jest.`,
      dependencies: '',
      estimatedEffort: '1-2 weeks',
    },
    {
      id: 'step-2',
      stepNumber: 2,
      title: `Priority Skill Gaps: Bridge ${topMissing} Requirements`,
      focus: 'Primary Skill Gap Remediation',
      whatToDo: `Acquire practical fluency in ${topMissing} via focused exercises and official documentation.`,
      whyItMatters: `${topMissing} is a primary hiring filter and mandatory qualification for ${roleTitle} openings.`,
      practicalTask: `Build an isolated prototype module integrating ${topMissing} with verifiable test outputs.`,
      dependencies: 'Prerequisite: Step 1',
      estimatedEffort: '1-2 weeks',
    },
    {
      id: 'step-3',
      stepNumber: 3,
      title: `Practical Implementation: Master ${secondMissing} Integration`,
      focus: 'Toolchain & Service Integration',
      whatToDo: `Connect ${topMatched} and ${topMissing} with ${secondMissing} in a working pipeline.`,
      whyItMatters: 'Demonstrating cross-toolchain integration bridges conceptual knowledge with production workflows.',
      practicalTask: 'Implement end-to-end service communication with automated validation and error logging.',
      dependencies: 'Prerequisite: Step 2',
      estimatedEffort: '2 weeks',
    },
    {
      id: 'step-4',
      stepNumber: 4,
      title: 'Project and Validation: Production-Grade Portfolio Milestone',
      focus: 'Comprehensive Demonstration Project',
      whatToDo: `Build or upgrade a standout full-lifecycle application tailored for ${roleTitle}, with CI/CD and containerization.`,
      whyItMatters: 'Hiring managers evaluate verifiable project architecture and commit histories over self-proclaimed skills.',
      practicalTask: 'Publish an open-source GitHub repository with clean architecture, interactive demo, and CI test badge.',
      dependencies: 'Prerequisite: Step 3',
      estimatedEffort: '2-3 weeks',
    },
    {
      id: 'step-5',
      stepNumber: 5,
      title: 'Career Evidence and Interview Prep: System Design & Deep Dive',
      focus: 'Technical Articulation & Whiteboard Scenarios',
      whatToDo: `Practice explaining architectural trade-offs, scalability bottlenecks, and debugging stories for ${roleTitle}.`,
      whyItMatters: 'Technical interviews evaluate trade-off reasoning and problem-solving clarity as much as code syntax.',
      practicalTask: 'Complete 5 mock interview rounds covering system design, live coding, and behavioral STAR stories.',
      dependencies: 'Prerequisite: Step 4',
      estimatedEffort: '1-2 weeks',
    },
    {
      id: 'step-6',
      stepNumber: 6,
      title: 'Job Readiness and Applications: Portfolio Launch & Targeted Search',
      focus: 'Resume Polish & Strategic Job Applications',
      whatToDo: `Update resume bullet points with quantified business impacts, deliverables from Step 4, and target ${roleTitle} openings.`,
      whyItMatters: 'Tailored applications with demonstrable repository links yield significantly higher response rates.',
      practicalTask: 'Submit 5 high-alignment applications per week with customized cover notes referencing your validated project.',
      dependencies: 'Prerequisite: Step 5',
      estimatedEffort: 'Ongoing',
    },
  ];
}

/**
 * Evaluates candidate resume evidence and returns personalized role recommendations.
 * Uses dynamic AI-generated recommendations from backend analysis when available.
 * Does NOT use fixed hardcoded role arrays or fabricated suitability percentages.
 */
export function evaluateRecommendedRoles(
  analysis: ResumeAnalysisResponse,
  backendSkillGap?: SkillGapAnalysisResponse | null
): RecommendedJobRole[] {
  const profile = extractCareerProfile(analysis);

  // 1. If backend AI analysis contains dynamically generated recommendedRoles, use them directly!
  if (analysis.recommendedRoles && analysis.recommendedRoles.length > 0) {
    return analysis.recommendedRoles.map((role: BackendRecommendedRole, idx: number) => {
      const roleId = role.id || `role-${idx + 1}`;
      const title = role.title;
      const category = role.category || 'Software Engineering';

      const alreadyHave: MatchedEvidenceSkill[] = (role.matchedSkills || []).map((m) => ({
        skill: m.skill,
        supportingProjects: m.supportingProjects || [],
        evidence: m.evidence || `Demonstrated in resume evidence.`,
      }));

      const needToLearn: MissingRoleSkill[] = (role.skillsToDevelop || []).map((s) => ({
        skill: s.skill,
        importance: s.importance || `Important requirement for ${title}.`,
        learningAction: s.learningAction || `Complete focused tutorials and hands-on exercises for ${s.skill}.`,
        status: 'Not found in resume' as const,
      }));

      const needToImprove: WeakEvidenceSkill[] = alreadyHave
        .filter((m) => m.supportingProjects.length === 0)
        .map((m) => ({
          skill: m.skill,
          issue: 'Listed in resume skills but lacks detailed project bullet points.',
          recommendation: `Add a project or repository link showing practical usage of ${m.skill}.`,
        }));

      // Check if backendSkillGap matches this specific role
      const isMatchingBackend = backendSkillGap && (
        backendSkillGap.targetRoleOrJobDescription.toLowerCase().includes(title.toLowerCase()) ||
        title.toLowerCase().includes(backendSkillGap.targetRoleOrJobDescription.toLowerCase())
      );

      let finalAlreadyHave = alreadyHave;
      let finalNeedToLearn = needToLearn;
      let finalNeedToImprove = needToImprove;
      let roadmap: RoadmapStep[] = [];

      if (isMatchingBackend && backendSkillGap) {
        if (backendSkillGap.matchedSkills && backendSkillGap.matchedSkills.length > 0) {
          finalAlreadyHave = backendSkillGap.matchedSkills.map((m) => ({
            skill: m.skill,
            supportingProjects: m.supportingProjects || [],
            evidence: m.evidence || 'Verified by deep AI analysis of resume text.',
          }));
        }
        if (backendSkillGap.missingSkills && backendSkillGap.missingSkills.length > 0) {
          finalNeedToLearn = backendSkillGap.missingSkills.map((m) => ({
            skill: m.skill,
            importance: m.importance || `Required for ${title}.`,
            learningAction: m.learningAction || 'Prioritize hands-on project implementation.',
            status: 'Not found in resume' as const,
          }));
        }
        if (backendSkillGap.skillsNeedingEvidence && backendSkillGap.skillsNeedingEvidence.length > 0) {
          finalNeedToImprove = backendSkillGap.skillsNeedingEvidence.map((e) => ({
            skill: e.skill,
            issue: e.issue,
            recommendation: e.recommendation,
          }));
        }
        if (backendSkillGap.roadmap && backendSkillGap.roadmap.length === 6) {
          roadmap = backendSkillGap.roadmap.map((s) => ({
            id: `step-${s.stepNumber}`,
            stepNumber: s.stepNumber,
            title: s.title,
            focus: s.focus || `Stage ${s.stepNumber}`,
            whatToDo: s.whatToDo,
            whyItMatters: s.whyItMatters,
            practicalTask: s.practicalTask,
            dependencies: s.dependencies || (s.stepNumber > 1 ? `Prerequisite: Step ${s.stepNumber - 1}` : ''),
            estimatedEffort: s.estimatedEffort || '1-2 weeks',
          }));
        }
      }

      if (roadmap.length !== 6) {
        roadmap = generateCanonicalRoadmap(
          title,
          finalAlreadyHave.map((m) => m.skill),
          finalNeedToLearn.map((m) => m.skill)
        );
      }

      const topMatched = finalAlreadyHave[0]?.skill || 'Core Stack';
      const topMissing = finalNeedToLearn[0]?.skill || 'Target Domain Tools';

      return {
        id: roleId,
        title,
        category,
        fitRank: role.fitRank || idx + 1,
        fitBadge: `#${role.fitRank || idx + 1} Evidence Match`,
        fitRationale: role.fitRationale || `Matches candidate resume evidence in ${topMatched}.`,
        matchedSkills: finalAlreadyHave,
        skillsToDevelop: finalNeedToLearn.map((m) => m.skill),
        supportingProjects: role.supportingProjects || Array.from(new Set(finalAlreadyHave.flatMap((m) => m.supportingProjects))),
        alreadyHave: finalAlreadyHave,
        needToImprove: finalNeedToImprove,
        needToLearn: finalNeedToLearn,
        practicalExperience: {
          title: `${title} Showcase Project`,
          focus: `Demonstrate ${topMatched} and bridge ${topMissing}.`,
          recommendedProject: `Build a production-grade application tailored for ${title} requirements with automated testing.`,
          deliverables: [
            `Core architecture implementing ${topMatched}`,
            `Integration with ${topMissing}`,
            'Automated tests and CI/CD workflow',
            'Public GitHub repository with documentation',
          ],
        },
        roadmap,
        nextActions: {
          whatToLearnFirst: {
            skill: topMissing,
            action: finalNeedToLearn[0]?.learningAction || `Complete practical documentation exercises for ${topMissing}.`,
          },
          whatProjectToBuild: {
            title: `${title} Portfolio Application`,
            description: `Build and deploy an application showcasing skills required for ${title}.`,
          },
          whatResumeEvidenceToAdd: {
            guidance: `Add quantified bullet points highlighting ${topMatched} deliverables.`,
            exampleBulletPoint: `Engineered feature using ${topMatched}, improving test coverage and system reliability.`,
          },
          whatToPractiseBeforeApplying: {
            topic: `${title} Architecture & Trade-Offs`,
            guidance: `Review core design principles and live coding scenarios for ${title}.`,
          },
        },
      };
    });
  }

  // 2. Safe heuristic fallback strictly derived from candidate's explicit skills (no hardcoded role arrays)
  const candidateSkills = profile.allDetectedSkills;
  const lowerSkills = candidateSkills.map((s) => s.toLowerCase());

  interface DynamicTrack {
    title: string;
    category: string;
    requiredPatterns: string[];
    gaps: string[];
  }

  const potentialTracks: DynamicTrack[] = [];

  if (lowerSkills.some((s) => s.includes('java') || s.includes('spring'))) {
    potentialTracks.push({
      title: 'Java & Spring Boot Backend Engineer',
      category: 'Backend Engineering',
      requiredPatterns: ['java', 'spring', 'sql', 'postgres', 'mysql', 'docker', 'rest', 'api'],
      gaps: ['Redis', 'Kafka', 'Docker', 'Kubernetes'],
    });
  }

  if (lowerSkills.some((s) => s.includes('python') || s.includes('django') || s.includes('fastapi'))) {
    potentialTracks.push({
      title: 'Python Backend & Systems Engineer',
      category: 'Backend Engineering',
      requiredPatterns: ['python', 'django', 'fastapi', 'sql', 'postgres', 'docker', 'rest'],
      gaps: ['PostgreSQL', 'Docker', 'Celery', 'Redis'],
    });
  }

  if (lowerSkills.some((s) => s.includes('react') || s.includes('vue') || s.includes('angular') || s.includes('javascript') || s.includes('typescript') || s.includes('frontend'))) {
    potentialTracks.push({
      title: 'Frontend / UI Engineer (React & TypeScript)',
      category: 'Frontend Engineering',
      requiredPatterns: ['react', 'vue', 'angular', 'javascript', 'typescript', 'html', 'css', 'tailwind'],
      gaps: ['TypeScript', 'Next.js', 'State Management', 'Testing Library'],
    });
  }

  if (lowerSkills.some((s) => s.includes('node') || s.includes('express') || s.includes('nest'))) {
    potentialTracks.push({
      title: 'Node.js Full Stack Engineer',
      category: 'Full Stack Engineering',
      requiredPatterns: ['node', 'express', 'javascript', 'typescript', 'react', 'mongo', 'postgres'],
      gaps: ['TypeScript', 'PostgreSQL', 'Docker', 'Redis'],
    });
  }

  if (lowerSkills.some((s) => s.includes('machine learning') || s.includes('pandas') || s.includes('numpy') || s.includes('tensorflow') || s.includes('data'))) {
    potentialTracks.push({
      title: 'Data & Applied ML Engineer',
      category: 'Data & AI Engineering',
      requiredPatterns: ['python', 'pandas', 'numpy', 'sql', 'machine learning', 'tensorflow'],
      gaps: ['Model Deployment', 'Docker', 'Feature Engineering', 'Airflow'],
    });
  }

  // If no specific stack matches, propose Software Engineer based on whatever was extracted
  if (potentialTracks.length === 0) {
    const primarySkill = candidateSkills[0] || 'Software Engineering';
    potentialTracks.push({
      title: `${primarySkill} Software Engineer`,
      category: 'Software Engineering',
      requiredPatterns: candidateSkills.map((s) => s.toLowerCase()),
      gaps: ['System Design', 'Production Testing', 'CI/CD'],
    });
  }

  // Only return tracks where the candidate actually demonstrates matching skills
  const matchedTracks = potentialTracks.map((track, idx) => {
    const matchedEvidence: MatchedEvidenceSkill[] = [];
    track.requiredPatterns.forEach((pattern) => {
      const match = candidateSkills.find((cs) => cs.toLowerCase().includes(pattern) || pattern.includes(cs.toLowerCase()));
      if (match && !matchedEvidence.some((m) => m.skill.toLowerCase() === match.toLowerCase())) {
        const supportingProjects: string[] = [];
        (analysis.projects || []).forEach((p) => {
          if ((p.technologies || []).some((t) => t.toLowerCase().includes(pattern))) {
            if (p.name) supportingProjects.push(p.name);
          }
        });
        matchedEvidence.push({
          skill: match,
          supportingProjects,
          evidence: supportingProjects.length > 0
            ? `Demonstrated in project(s): ${supportingProjects.join(', ')}`
            : 'Explicitly declared in resume skills list.',
        });
      }
    });

    const needToLearn: MissingRoleSkill[] = track.gaps
      .filter((gap) => !lowerSkills.some((ls) => ls.includes(gap.toLowerCase())))
      .map((skill) => ({
        skill,
        importance: `Standard requirement for ${track.title}.`,
        learningAction: `Complete documentation exercises and build an implementation prototype with ${skill}.`,
        status: 'Not found in resume' as const,
      }));

    const needToImprove: WeakEvidenceSkill[] = matchedEvidence
      .filter((m) => m.supportingProjects.length === 0)
      .map((m) => ({
        skill: m.skill,
        issue: 'Listed in resume skills but not demonstrated in project bullet points.',
        recommendation: `Add a verifiable project link or deliverables illustrating ${m.skill}.`,
      }));

    const roadmap = generateCanonicalRoadmap(
      track.title,
      matchedEvidence.map((m) => m.skill),
      needToLearn.map((m) => m.skill)
    );

    const topMatched = matchedEvidence[0]?.skill || 'Core Skills';
    const topMissing = needToLearn[0]?.skill || 'Key Gaps';

    return {
      id: `dynamic-role-${idx + 1}`,
      title: track.title,
      category: track.category,
      fitRank: idx + 1,
      fitBadge: `#${idx + 1} Stack Match`,
      fitRationale: `Relevant candidate fit supported by ${matchedEvidence.length} verified resume skill(s) including ${matchedEvidence.slice(0, 3).map((m) => m.skill).join(', ')}.`,
      matchedSkills: matchedEvidence,
      skillsToDevelop: needToLearn.map((m) => m.skill),
      supportingProjects: Array.from(new Set(matchedEvidence.flatMap((m) => m.supportingProjects))),
      alreadyHave: matchedEvidence,
      needToImprove,
      needToLearn,
      practicalExperience: {
        title: `${track.title} Demonstration Project`,
        focus: `Demonstrate ${topMatched} and bridge ${topMissing}.`,
        recommendedProject: `Build an application tailored for ${track.title} with clean architecture and tests.`,
        deliverables: [
          `Architecture implementing ${topMatched}`,
          `Integration with ${topMissing}`,
          'Automated tests and repository documentation',
        ],
      },
      roadmap,
      nextActions: {
        whatToLearnFirst: {
          skill: topMissing,
          action: needToLearn[0]?.learningAction || `Study ${topMissing} documentation.`,
        },
        whatProjectToBuild: {
          title: `${track.title} Showcase Project`,
          description: `Build a project showcasing skills for ${track.title}.`,
        },
        whatResumeEvidenceToAdd: {
          guidance: `Add quantified bullet points highlighting ${topMatched}.`,
          exampleBulletPoint: `Built scalable feature using ${topMatched} with unit tests.`,
        },
        whatToPractiseBeforeApplying: {
          topic: `${track.title} Core Principles`,
          guidance: `Review key design patterns and interview scenarios for ${track.title}.`,
        },
      },
    };
  });

  return matchedTracks.slice(0, 3);
}

/**
 * Builds a custom target role from a user-supplied role title or job description.
 */
export function buildCustomTargetRole(
  customTargetText: string,
  analysis: ResumeAnalysisResponse,
  backendSkillGap?: SkillGapAnalysisResponse | null,
  companyName?: string,
  jobTitle?: string
): RecommendedJobRole {
  const profile = extractCareerProfile(analysis);

  let displayTitle = '';
  if (jobTitle && jobTitle.trim()) {
    displayTitle = companyName && companyName.trim()
      ? `${jobTitle.trim()} (${companyName.trim()})`
      : jobTitle.trim();
  } else if (customTargetText.length <= 60 && !customTargetText.includes('\n')) {
    displayTitle = customTargetText.trim();
  } else {
    const firstLine = customTargetText.split('\n')[0].trim();
    if (firstLine.length > 5 && firstLine.length <= 60 && !firstLine.toLowerCase().startsWith('job description')) {
      displayTitle = companyName ? `${firstLine} (${companyName})` : firstLine;
    } else {
      displayTitle = companyName ? `Custom Role — ${companyName}` : 'Custom Job Description Target';
    }
  }

  const targetRoleId =
    'custom-' +
    (displayTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 35) || 'target');

  if (backendSkillGap) {
    const alreadyHave: MatchedEvidenceSkill[] = (backendSkillGap.matchedSkills || []).map((m) => ({
      skill: m.skill,
      supportingProjects: m.supportingProjects || [],
      evidence: m.evidence || 'Verified by deep AI analysis of resume text.',
    }));

    const needToImprove: WeakEvidenceSkill[] = (backendSkillGap.skillsNeedingEvidence || []).map((e) => ({
      skill: e.skill,
      issue: e.issue,
      recommendation: e.recommendation,
    }));

    const needToLearn: MissingRoleSkill[] = (backendSkillGap.missingSkills || []).map((m) => ({
      skill: m.skill,
      importance: m.importance || `Required for ${displayTitle}.`,
      learningAction: m.learningAction || 'Prioritize hands-on project implementation.',
      status: 'Not found in resume' as const,
    }));

    let roadmap: RoadmapStep[] = [];
    if (backendSkillGap.roadmap && backendSkillGap.roadmap.length === 6) {
      roadmap = backendSkillGap.roadmap.map((s) => ({
        id: `step-${s.stepNumber}`,
        stepNumber: s.stepNumber,
        title: s.title,
        focus: s.focus || `Stage ${s.stepNumber}`,
        whatToDo: s.whatToDo,
        whyItMatters: s.whyItMatters,
        practicalTask: s.practicalTask,
        dependencies: s.dependencies || (s.stepNumber > 1 ? `Prerequisite: Step ${s.stepNumber - 1}` : ''),
        estimatedEffort: s.estimatedEffort || '1-2 weeks',
      }));
    } else {
      roadmap = generateCanonicalRoadmap(displayTitle, alreadyHave.map((m) => m.skill), needToLearn.map((m) => m.skill));
    }

    const topMissing = needToLearn[0]?.skill || 'Target Requirements';
    const topMatched = alreadyHave[0]?.skill || 'Demonstrated Skills';

    return {
      id: targetRoleId,
      title: displayTitle,
      category: 'Custom Benchmark',
      fitRank: 0,
      fitBadge: backendSkillGap.matchPercentage != null ? `Custom Target (${backendSkillGap.matchPercentage}% Match)` : 'Custom Target',
      fitRationale: `Custom benchmark evaluated against your active resume. Found ${alreadyHave.length} matching skill(s) and ${needToLearn.length} gap(s).`,
      matchedSkills: alreadyHave,
      skillsToDevelop: needToLearn.map((m) => m.skill),
      supportingProjects: Array.from(new Set(alreadyHave.flatMap((m) => m.supportingProjects))),
      alreadyHave,
      needToImprove,
      needToLearn,
      practicalExperience: {
        title: `${displayTitle} Demonstration Project`,
        focus: `Demonstrate ${topMatched} and bridge ${topMissing}.`,
        recommendedProject: `Build a project demonstrating the specific requirements of ${displayTitle}.`,
        deliverables: [
          `Core implementation demonstrating ${topMatched}`,
          `Integration with ${topMissing}`,
          'Automated tests and repository documentation',
        ],
      },
      roadmap,
      nextActions: {
        whatToLearnFirst: {
          skill: topMissing,
          action: needToLearn[0]?.learningAction || `Review documentation for ${topMissing}.`,
        },
        whatProjectToBuild: {
          title: `${displayTitle} Showcase Project`,
          description: `Build an application meeting the requirements of ${displayTitle}.`,
        },
        whatResumeEvidenceToAdd: {
          guidance: `Add bullet points highlighting ${topMatched}.`,
          exampleBulletPoint: `Implemented solution meeting ${displayTitle} specifications.`,
        },
        whatToPractiseBeforeApplying: {
          topic: `${displayTitle} Requirements`,
          guidance: `Prepare technical explanations for key requirements in ${displayTitle}.`,
        },
      },
      isCustomTarget: true,
    };
  }

  // Pre-backend client-side evaluation
  const lowerText = customTargetText.toLowerCase();
  const matchedEvidence: MatchedEvidenceSkill[] = [];

  profile.allDetectedSkills.forEach((skill) => {
    const sLower = skill.toLowerCase();
    if (lowerText.includes(sLower)) {
      const supportingProjects: string[] = [];
      (analysis.projects || []).forEach((p) => {
        if ((p.technologies || []).some((t) => t.toLowerCase() === sLower)) {
          if (p.name) supportingProjects.push(p.name);
        }
      });

      matchedEvidence.push({
        skill,
        supportingProjects,
        evidence: supportingProjects.length > 0
          ? `Demonstrated in project(s): ${supportingProjects.join(', ')}`
          : 'Explicitly declared in resume technical skills list.',
      });
    }
  });

  const roadmap = generateCanonicalRoadmap(displayTitle, matchedEvidence.map((m) => m.skill), ['Domain-Specific Requirements']);

  return {
    id: targetRoleId,
    title: displayTitle,
    category: 'Custom Benchmark',
    fitRank: 0,
    fitBadge: 'Custom Target',
    fitRationale: `Custom target benchmark evaluating your active resume against ${displayTitle}.`,
    matchedSkills: matchedEvidence,
    skillsToDevelop: ['Domain-Specific Requirements'],
    supportingProjects: Array.from(new Set(matchedEvidence.flatMap((m) => m.supportingProjects))),
    alreadyHave: matchedEvidence,
    needToImprove: [],
    needToLearn: [
      {
        skill: 'Custom Requirements',
        importance: `Key qualifications specified in ${displayTitle}.`,
        learningAction: 'Run AI Verification for granular requirement extraction.',
        status: 'Not found in resume',
      },
    ],
    practicalExperience: {
      title: `${displayTitle} Blueprint`,
      focus: 'Targeted implementation project.',
      recommendedProject: `Build an application demonstrating the specific requirements of ${displayTitle}.`,
      deliverables: [
        'Core architecture matching target specifications',
        'Automated test suite and documentation',
      ],
    },
    roadmap,
    nextActions: {
      whatToLearnFirst: {
        skill: 'Target Skill Gaps',
        action: 'Review target requirements and execute initial tutorial exercises.',
      },
      whatProjectToBuild: {
        title: `${displayTitle} Project`,
        description: 'Implement a working demonstration project meeting target criteria.',
      },
      whatResumeEvidenceToAdd: {
        guidance: 'Align resume project descriptions with target role keywords.',
        exampleBulletPoint: `Implemented solution meeting ${displayTitle} specifications with verified test coverage.`,
      },
      whatToPractiseBeforeApplying: {
        topic: 'Domain-specific design patterns and interview scenarios.',
        guidance: 'Rehearse technical explanations for key technologies in the target specification.',
      },
    },
    isCustomTarget: true,
  };
}
