import React, { useState, useEffect, useRef, useCallback } from 'react';
import type {
  ResumeUploadResponse,
  ResumeAnalysisResponse,
  SkillGapAnalysisResponse,
  ChatMessage,
  NavigationTab,
} from '../types/resume';
import {
  uploadResume,
  analyzeResume,
  analyzeSkillGap,
  fetchLatestResume,
  resetSessionId,
} from '../api/client';
import { useAuth } from './useAuth';
import { ResumeContext } from './ResumeContextInstance';

export const ResumeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const userId = user?.id;

  const [activeTab, setActiveTab] = useState<NavigationTab>('dashboard');

  const [currentResume, setCurrentResume] = useState<ResumeUploadResponse | null>(null);
  const currentResumeRef = useRef<ResumeUploadResponse | null>(null);

  const [analysis, setAnalysis] = useState<ResumeAnalysisResponse | null>(null);
  const [skillGapAnalysis, setSkillGapAnalysis] = useState<SkillGapAnalysisResponse | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isAnalyzingSkillGap, setIsAnalyzingSkillGap] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [skillGapError, setSkillGapError] = useState<string | null>(null);

  // Sync ref with current state
  useEffect(() => {
    currentResumeRef.current = currentResume;
  }, [currentResume]);

  // Clean any old legacy shared localStorage keys on mount
  useEffect(() => {
    try {
      localStorage.removeItem('resumeiq_cached_resume');
      localStorage.removeItem('resumeiq_cached_analysis');
      localStorage.removeItem('resumeiq_cached_skill_gap');
      localStorage.removeItem('resumeiq_cached_chat');
      localStorage.removeItem('resumeiq_session_id');
    } catch {
      // ignore
    }
  }, []);

  // When authenticated user changes (or signs out), reset state and fetch user-scoped data
  useEffect(() => {
    let isCurrent = true;

    resetSessionId();

    if (!isAuthenticated || !userId) {
      queueMicrotask(() => {
        if (!isCurrent) return;
        setCurrentResume(null);
        currentResumeRef.current = null;
        setAnalysis(null);
        setSkillGapAnalysis(null);
        setChatMessages([]);
        setUploadError(null);
        setAnalysisError(null);
        setSkillGapError(null);
      });
      return;
    }

    // Try restoring user-scoped cache for this specific user
    try {
      const userResumeKey = `resumeiq_${userId}_cached_resume`;
      const userAnalysisKey = `resumeiq_${userId}_cached_analysis`;
      const userSkillGapKey = `resumeiq_${userId}_cached_skill_gap`;
      const userChatKey = `resumeiq_${userId}_cached_chat`;

      const cachedResume = localStorage.getItem(userResumeKey);
      const parsedResume = cachedResume ? JSON.parse(cachedResume) : null;
      const cachedAnalysis = localStorage.getItem(userAnalysisKey);
      const parsedAnalysis = cachedAnalysis ? JSON.parse(cachedAnalysis) : null;
      const cachedSkillGap = localStorage.getItem(userSkillGapKey);
      const parsedSkillGap = cachedSkillGap ? JSON.parse(cachedSkillGap) : null;
      const cachedChat = localStorage.getItem(userChatKey);
      const parsedChat = cachedChat ? JSON.parse(cachedChat) : [];

      queueMicrotask(() => {
        if (!isCurrent) return;
        setCurrentResume(parsedResume);
        currentResumeRef.current = parsedResume;
        setAnalysis(parsedAnalysis);
        setSkillGapAnalysis(parsedSkillGap);
        setChatMessages(parsedChat);
      });
    } catch {
      // ignore JSON parse errors
    }

    // Always re-validate and fetch the authoritative latest resume from backend for this user
    fetchLatestResume()
      .then((serverResume) => {
        if (!isCurrent) return;
        if (serverResume) {
          setCurrentResume(serverResume);
          currentResumeRef.current = serverResume;
        } else {
          // User has no resume on the server -> clear any stale cache
          setCurrentResume(null);
          currentResumeRef.current = null;
          setAnalysis(null);
          setSkillGapAnalysis(null);
          setChatMessages([]);
          try {
            localStorage.removeItem(`resumeiq_${userId}_cached_resume`);
            localStorage.removeItem(`resumeiq_${userId}_cached_analysis`);
            localStorage.removeItem(`resumeiq_${userId}_cached_skill_gap`);
            localStorage.removeItem(`resumeiq_${userId}_cached_chat`);
          } catch {
            // ignore
          }
        }
      })
      .catch(() => {
        // network or server error, retain cached state if available
      });

    return () => {
      isCurrent = false;
    };
  }, [userId, isAuthenticated]);

  // Sync state to user-namespaced localStorage keys
  useEffect(() => {
    if (!userId) return;
    try {
      const userResumeKey = `resumeiq_${userId}_cached_resume`;
      if (currentResume) {
        localStorage.setItem(userResumeKey, JSON.stringify(currentResume));
      } else {
        localStorage.removeItem(userResumeKey);
      }
    } catch {
      // ignore
    }
  }, [currentResume, userId]);

  useEffect(() => {
    if (!userId) return;
    try {
      const userAnalysisKey = `resumeiq_${userId}_cached_analysis`;
      if (analysis) {
        localStorage.setItem(userAnalysisKey, JSON.stringify(analysis));
      } else {
        localStorage.removeItem(userAnalysisKey);
      }
    } catch {
      // ignore
    }
  }, [analysis, userId]);

  useEffect(() => {
    if (!userId) return;
    try {
      const userSkillGapKey = `resumeiq_${userId}_cached_skill_gap`;
      if (skillGapAnalysis) {
        localStorage.setItem(userSkillGapKey, JSON.stringify(skillGapAnalysis));
      } else {
        localStorage.removeItem(userSkillGapKey);
      }
    } catch {
      // ignore
    }
  }, [skillGapAnalysis, userId]);

  useEffect(() => {
    if (!userId) return;
    try {
      const userChatKey = `resumeiq_${userId}_cached_chat`;
      if (chatMessages && chatMessages.length > 0) {
        localStorage.setItem(userChatKey, JSON.stringify(chatMessages));
      } else {
        localStorage.removeItem(userChatKey);
      }
    } catch {
      // ignore
    }
  }, [chatMessages, userId]);

  const handleFileUpload = async (file: File): Promise<ResumeUploadResponse | null> => {
    setIsUploading(true);
    setUploadError(null);
    setAnalysisError(null);
    setSkillGapError(null);
    setUploadProgressText('Uploading document and extracting text...');

    try {
      const uploaded = await uploadResume(file);
      currentResumeRef.current = uploaded;
      setCurrentResume(uploaded);
      setAnalysis(null);
      setSkillGapAnalysis(null);
      setChatMessages([]);
      setUploadProgressText('Resume successfully uploaded and verified!');
      return uploaded;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to upload resume.';
      setUploadError(msg);
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const handleRunAnalysis = async (
    resumeOverride?: ResumeUploadResponse | null
  ): Promise<ResumeAnalysisResponse | null> => {
    const resumeToUse = resumeOverride ?? currentResumeRef.current ?? currentResume;
    if (!resumeToUse) {
      setAnalysisError('Please upload a resume first before running analysis.');
      return null;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      const result = await analyzeResume();
      setAnalysis(result);
      return result;
    } catch (err: unknown) {
      const anyErr = err as { status?: number; message?: string };
      if (anyErr?.status === 404) {
        setAnalysisError(
          'Active session expired or no resume was found on the server. Please re-upload your resume.'
        );
      } else {
        setAnalysisError(anyErr?.message || 'Failed to generate resume analysis.');
      }
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRunSkillGap = async (
    targetRoleOrJobDescription: string
  ): Promise<SkillGapAnalysisResponse | null> => {
    const resumeToUse = currentResumeRef.current ?? currentResume;
    if (!resumeToUse) {
      setSkillGapError('Please upload a resume first before analyzing skill gaps.');
      return null;
    }

    setIsAnalyzingSkillGap(true);
    setSkillGapError(null);

    try {
      const result = await analyzeSkillGap(targetRoleOrJobDescription);
      setSkillGapAnalysis(result);
      return result;
    } catch (err: unknown) {
      const anyErr = err as { status?: number; message?: string };
      if (anyErr?.status === 404) {
        setSkillGapError(
          'Active session expired or no resume was found on the server. Please re-upload your resume.'
        );
      } else {
        setSkillGapError(anyErr?.message || 'Failed to generate skill gap analysis.');
      }
      return null;
    } finally {
      setIsAnalyzingSkillGap(false);
    }
  };

  const handleClearSkillGap = useCallback(() => {
    setSkillGapAnalysis(null);
    setSkillGapError(null);
    if (userId) {
      try {
        localStorage.removeItem(`resumeiq_${userId}_cached_skill_gap`);
      } catch {
        // ignore
      }
    }
  }, [userId]);

  const handleReset = useCallback(() => {
    resetSessionId();
    currentResumeRef.current = null;
    setCurrentResume(null);
    setAnalysis(null);
    setSkillGapAnalysis(null);
    setChatMessages([]);
    setUploadError(null);
    setAnalysisError(null);
    setSkillGapError(null);
    setActiveTab('dashboard');

    if (userId) {
      try {
        localStorage.removeItem(`resumeiq_${userId}_cached_resume`);
        localStorage.removeItem(`resumeiq_${userId}_cached_analysis`);
        localStorage.removeItem(`resumeiq_${userId}_cached_skill_gap`);
        localStorage.removeItem(`resumeiq_${userId}_cached_chat`);
      } catch {
        // ignore
      }
    }
  }, [userId]);

  return (
    <ResumeContext.Provider
      value={{
        activeTab,
        setActiveTab,
        currentResume,
        setCurrentResume,
        analysis,
        setAnalysis,
        skillGapAnalysis,
        setSkillGapAnalysis,
        isAnalyzingSkillGap,
        skillGapError,
        chatMessages,
        setChatMessages,
        isUploading,
        uploadProgressText,
        isAnalyzing,
        uploadError,
        analysisError,
        handleFileUpload,
        handleRunAnalysis,
        handleRunSkillGap,
        handleClearSkillGap,
        handleReset,
      }}
    >
      {children}
    </ResumeContext.Provider>
  );
};
