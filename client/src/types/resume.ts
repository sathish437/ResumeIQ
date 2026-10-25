export interface ResumePageResponse {
  pageNumber: number;
  text: string;
}

export interface ResumeUploadResponse {
  resumeId: string;
  filename: string;
  fileType: string;
  status: string;
  characterCount: number;
  segmentCount: number;
  references: string[];
  text: string;
  pages?: ResumePageResponse[] | null;
  createdAt: string;
}

export interface ResumeSource {
  reference: string;
  evidence: string;
}

export interface ResumeAskResponse {
  resumeId: string;
  question: string;
  answer: string;
  sources: ResumeSource[];
  sourceReferences: string[];
  insufficientEvidence: boolean;
}

export interface ProjectDetail {
  name: string;
  technologies: string[];
  description: string;
}

export interface AtsScoreBreakdown {
  requiredSkillsScore: number;
  preferredSkillsScore: number;
  experienceEvidenceScore: number;
  resumeStructureScore: number;
}

export interface AtsScoreResult {
  totalScore: number;
  targetRoleOrJobDescription: string;
  breakdown: AtsScoreBreakdown;
  missingRequirements: string[];
  formulaExplanation: string;
  disclaimer: string;
}

export interface RecommendedRole {
  id: string;
  title: string;
  category: string;
  fitRank: number;
  fitRationale: string;
  matchedSkills: MatchedSkill[];
  skillsToDevelop: MissingSkill[];
  supportingProjects: string[];
}

export interface ResumeAnalysisResponse {
  resumeId: string;
  professionalSummary: string;
  skills: string[];
  projects: ProjectDetail[];
  educationAndCertifications: string[];
  missingOrUnavailableInformation: string[];
  recommendedRoles?: RecommendedRole[];
  analyzedAt: string;
}

export interface MatchedSkill {
  skill: string;
  supportingProjects: string[];
  evidence: string;
}

export interface MissingSkill {
  skill: string;
  importance: string;
  learningAction: string;
}

export interface EvidenceNeededSkill {
  skill: string;
  issue: string;
  recommendation: string;
}

export interface RecommendedNextStep {
  title: string;
  description: string;
  priority: string;
}

export interface RoadmapStepResponse {
  stepNumber: number;
  title: string;
  focus?: string;
  whatToDo: string;
  whyItMatters: string;
  practicalTask: string;
  dependencies?: string;
  estimatedEffort?: string;
}

export interface SkillGapAnalysisResponse {
  resumeId: string;
  targetRoleOrJobDescription: string;
  matchPercentage: number;
  matchedSkills: MatchedSkill[];
  missingSkills: MissingSkill[];
  skillsNeedingEvidence: EvidenceNeededSkill[];
  recommendedNextSteps: RecommendedNextStep[];
  roadmap?: RoadmapStepResponse[];
  atsScore?: AtsScoreResult;
  analyzedAt: string;
}

export interface ApiErrorResponse {
  timestamp?: string;
  status?: number;
  error?: string;
  message: string;
  field?: string;
  path?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  sources?: ResumeSource[];
  sourceReferences?: string[];
  insufficientEvidence?: boolean;
  timestamp: string;
  isError?: boolean;
  isEdited?: boolean;
}

export type NavigationTab = 
  | 'dashboard'
  | 'analysis'
  | 'chat'
  | 'skill-gap';

