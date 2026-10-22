import React, { useState, useEffect } from 'react';
import type {
  ResumeUploadResponse,
  ResumeAnalysisResponse,
  ChatMessage,
  NavigationTab,
} from '../types/resume';
import { uploadResume, analyzeResume, resetSessionId } from '../api/client';
import { ResumeContext } from './ResumeContextInstance';

const LOCAL_RESUME_KEY = 'resumeiq_cached_resume';
const LOCAL_ANALYSIS_KEY = 'resumeiq_cached_analysis';
const LOCAL_CHAT_KEY = 'resumeiq_cached_chat';

export const ResumeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<NavigationTab>('dashboard');
  
  const [currentResume, setCurrentResume] = useState<ResumeUploadResponse | null>(() => {
    try {
      const cached = localStorage.getItem(LOCAL_RESUME_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });

  const [analysis, setAnalysis] = useState<ResumeAnalysisResponse | null>(() => {
    try {
      const cached = localStorage.getItem(LOCAL_ANALYSIS_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
    try {
      const cached = localStorage.getItem(LOCAL_CHAT_KEY);
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Sync state to localStorage for refresh resilience
  useEffect(() => {
    if (currentResume) {
      localStorage.setItem(LOCAL_RESUME_KEY, JSON.stringify(currentResume));
    } else {
      localStorage.removeItem(LOCAL_RESUME_KEY);
    }
  }, [currentResume]);

  useEffect(() => {
    if (analysis) {
      localStorage.setItem(LOCAL_ANALYSIS_KEY, JSON.stringify(analysis));
    } else {
      localStorage.removeItem(LOCAL_ANALYSIS_KEY);
    }
  }, [analysis]);

  useEffect(() => {
    localStorage.setItem(LOCAL_CHAT_KEY, JSON.stringify(chatMessages));
  }, [chatMessages]);

  const handleFileUpload = async (file: File): Promise<ResumeUploadResponse | null> => {
    setIsUploading(true);
    setUploadError(null);
    setUploadProgressText('Uploading document and extracting text...');

    try {
      const uploaded = await uploadResume(file);
      setCurrentResume(uploaded);
      setAnalysis(null);
      setChatMessages([]);
      setUploadProgressText('Resume successfully uploaded and verified!');
      return uploaded;
    } catch (err: any) {
      setUploadError(err.message || 'Failed to upload resume.');
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const handleRunAnalysis = async (): Promise<ResumeAnalysisResponse | null> => {
    if (!currentResume) {
      setAnalysisError('Please upload a resume first before running analysis.');
      return null;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      const result = await analyzeResume();
      setAnalysis(result);
      return result;
    } catch (err: any) {
      setAnalysisError(err.message || 'Failed to generate resume analysis.');
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    resetSessionId();
    setCurrentResume(null);
    setAnalysis(null);
    setChatMessages([]);
    setUploadError(null);
    setAnalysisError(null);
    setActiveTab('dashboard');
  };

  return (
    <ResumeContext.Provider
      value={{
        activeTab,
        setActiveTab,
        currentResume,
        setCurrentResume,
        analysis,
        setAnalysis,
        chatMessages,
        setChatMessages,
        isUploading,
        uploadProgressText,
        isAnalyzing,
        uploadError,
        analysisError,
        handleFileUpload,
        handleRunAnalysis,
        handleReset,
      }}
    >
      {children}
    </ResumeContext.Provider>
  );
};
