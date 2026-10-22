import { createContext } from 'react';
import type {
  ResumeUploadResponse,
  ResumeAnalysisResponse,
  ChatMessage,
  NavigationTab,
} from '../types/resume';

export interface ResumeContextType {
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  currentResume: ResumeUploadResponse | null;
  setCurrentResume: (resume: ResumeUploadResponse | null) => void;
  analysis: ResumeAnalysisResponse | null;
  setAnalysis: (analysis: ResumeAnalysisResponse | null) => void;
  chatMessages: ChatMessage[];
  setChatMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  isUploading: boolean;
  uploadProgressText: string;
  isAnalyzing: boolean;
  uploadError: string | null;
  analysisError: string | null;
  handleFileUpload: (file: File) => Promise<ResumeUploadResponse | null>;
  handleRunAnalysis: () => Promise<ResumeAnalysisResponse | null>;
  handleReset: () => void;
}

export const ResumeContext = createContext<ResumeContextType | undefined>(undefined);
