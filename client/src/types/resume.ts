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

export interface ResumeAnalysisResponse {
  resumeId: string;
  professionalSummary: string;
  skills: string[];
  projects: ProjectDetail[];
  educationAndCertifications: string[];
  missingOrUnavailableInformation: string[];
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
  | 'chat';

