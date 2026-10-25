import type {
  ResumeUploadResponse,
  ResumeAskResponse,
  ResumeAnalysisResponse,
  SkillGapAnalysisResponse,
  AtsScoreResult,
  ApiErrorResponse,
} from '../types/resume';
import { getStoredAuthToken } from './authApi';

const SESSION_STORAGE_KEY = 'resumeiq_session_id';
const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

/**
 * Gets common headers including session ID and Authorization bearer token if available.
 */
function getHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const headers: Record<string, string> = {
    'X-Session-Id': getSessionId(),
    ...extra,
  };
  const token = getStoredAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

/**
 * Gets or initializes a persistent session ID for the user's browser session.
 * Passed via X-Session-Id to coordinate memory and uploaded resume context on the backend.
 */
export function getSessionId(): string {
  let sessionId = localStorage.getItem(SESSION_STORAGE_KEY);
  if (!sessionId) {
    sessionId = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : 'session-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
    localStorage.setItem(SESSION_STORAGE_KEY, sessionId);
  }
  return sessionId;
}

/**
 * Reset session ID (starts a fresh session/conversation)
 */
export function resetSessionId(): string {
  const newId = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : 'session-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
  localStorage.setItem(SESSION_STORAGE_KEY, newId);
  return newId;
}

export class ResumeApiError extends Error {
  public status: number;
  public details?: ApiErrorResponse;

  constructor(message: string, status: number, details?: ApiErrorResponse) {
    super(message);
    this.name = 'ResumeApiError';
    this.status = status;
    this.details = details;
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (res.ok) {
    return (await res.json()) as T;
  }

  let errorDetails: ApiErrorResponse | undefined;
  try {
    errorDetails = await res.json();
  } catch {
    // If not JSON, ignore
  }

  let userFriendlyMessage = errorDetails?.message;

  if (!userFriendlyMessage) {
    if (res.status === 404) {
      userFriendlyMessage = 'No active resume found for this session. Please upload a resume first.';
    } else if (res.status === 413) {
      userFriendlyMessage = 'The uploaded file exceeds the maximum size limit (10MB).';
    } else if (res.status === 422) {
      userFriendlyMessage = 'The document could not be processed. Please ensure it contains selectable text (not scanned images).';
    } else if (res.status === 502) {
      userFriendlyMessage = 'The AI assistant is temporarily unavailable. Please try again in a few moments.';
    } else if (res.status === 500) {
      userFriendlyMessage = 'An unexpected server error occurred. Please try again.';
    } else {
      userFriendlyMessage = `Request failed with status ${res.status}: ${res.statusText}`;
    }
  }

  throw new ResumeApiError(userFriendlyMessage, res.status, errorDetails);
}

/**
 * Uploads a resume file (.pdf or .docx)
 */
export async function uploadResume(file: File): Promise<ResumeUploadResponse> {
  const allowedExtensions = ['.pdf', '.docx'];
  const ext = '.' + file.name.split('.').pop()?.toLowerCase();
  if (!allowedExtensions.includes(ext)) {
    throw new ResumeApiError(
      'Invalid file format. Only PDF and DOCX documents are supported.',
      400
    );
  }

  // 10MB limit in bytes
  if (file.size > 10 * 1024 * 1024) {
    throw new ResumeApiError(
      'File is too large. The maximum supported file size is 10MB.',
      413
    );
  }

  const formData = new FormData();
  formData.append('resume', file);

  try {
    const res = await fetch(`${BASE_URL}/api/resumes/upload`, {
      method: 'POST',
      headers: getHeaders(),
      credentials: 'include',
      body: formData,
    });

    return await handleResponse<ResumeUploadResponse>(res);
  } catch (err: unknown) {
    if (err instanceof ResumeApiError) {
      throw err;
    }
    throw new ResumeApiError(
      'Unable to connect to the ResumeIQ server. Please check your network or ensure the server is running.',
      0
    );
  }
}

/**
 * Ask a grounded question about the current uploaded resume
 */
export async function askResume(question: string): Promise<ResumeAskResponse> {
  const trimmed = question.trim();
  if (!trimmed) {
    throw new ResumeApiError('Question cannot be empty.', 400);
  }

  try {
    const res = await fetch(`${BASE_URL}/api/resumes/ask`, {
      method: 'POST',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      credentials: 'include',
      body: JSON.stringify({ question: trimmed }),
    });

    return await handleResponse<ResumeAskResponse>(res);
  } catch (err: unknown) {
    if (err instanceof ResumeApiError) {
      throw err;
    }
    throw new ResumeApiError(
      'Unable to connect to the ResumeIQ server. Please check your network or ensure the server is running.',
      0
    );
  }
}

/**
 * Trigger structured AI analysis for the currently uploaded resume
 */
export async function analyzeResume(): Promise<ResumeAnalysisResponse> {
  try {
    const res = await fetch(`${BASE_URL}/api/resumes/analyze`, {
      method: 'POST',
      headers: getHeaders(),
      credentials: 'include',
    });

    return await handleResponse<ResumeAnalysisResponse>(res);
  } catch (err: unknown) {
    if (err instanceof ResumeApiError) {
      throw err;
    }
    throw new ResumeApiError(
      'Unable to connect to the ResumeIQ server. Please check your network or ensure the server is running.',
      0
    );
  }
}

/**
 * Compare the uploaded resume against a target role or job description
 */
export async function analyzeSkillGap(
  targetRoleOrJobDescription: string
): Promise<SkillGapAnalysisResponse> {
  const trimmed = targetRoleOrJobDescription.trim();
  if (!trimmed) {
    throw new ResumeApiError('Target role or job description cannot be empty.', 400);
  }

  try {
    const res = await fetch(`${BASE_URL}/api/resumes/skill-gap`, {
      method: 'POST',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      credentials: 'include',
      body: JSON.stringify({ targetRoleOrJobDescription: trimmed }),
    });

    return await handleResponse<SkillGapAnalysisResponse>(res);
  } catch (err: unknown) {
    if (err instanceof ResumeApiError) {
      throw err;
    }
    throw new ResumeApiError(
      'Unable to connect to the ResumeIQ server. Please check your network or ensure the server is running.',
      0
    );
  }
}

/**
 * Fetches the latest uploaded resume for the authenticated user.
 * Returns null if the current user has not uploaded any resume yet.
 */
export async function fetchLatestResume(): Promise<ResumeUploadResponse | null> {
  try {
    const res = await fetch(`${BASE_URL}/api/resumes/latest`, {
      method: 'GET',
      headers: getHeaders(),
      credentials: 'include',
    });

    if (res.status === 404) {
      return null;
    }

    return await handleResponse<ResumeUploadResponse>(res);
  } catch (err: unknown) {
    if (err instanceof ResumeApiError && err.status === 404) {
      return null;
    }
    return null;
  }
}

/**
 * Deletes a resume owned by the authenticated user.
 */
export async function deleteResume(resumeId: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/resumes/${resumeId}`, {
    method: 'DELETE',
    headers: getHeaders(),
    credentials: 'include',
  });
  if (!res.ok && res.status !== 404) {
    throw new ResumeApiError('Failed to delete resume', res.status);
  }
}

/**
 * Calculates evidence-based ATS compatibility score for target requirements against the active resume.
 */
export async function calculateAtsScore(
  targetRoleOrJobDescription: string
): Promise<AtsScoreResult> {
  const trimmed = targetRoleOrJobDescription.trim();
  if (!trimmed) {
    throw new ResumeApiError('Target role or job description cannot be empty.', 400);
  }

  try {
    const res = await fetch(`${BASE_URL}/api/resumes/ats-score`, {
      method: 'POST',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      credentials: 'include',
      body: JSON.stringify({ targetRoleOrJobDescription: trimmed }),
    });

    return await handleResponse<AtsScoreResult>(res);
  } catch (err: unknown) {
    if (err instanceof ResumeApiError) {
      throw err;
    }
    throw new ResumeApiError(
      'Unable to connect to the ResumeIQ server. Please check your network or ensure the server is running.',
      0
    );
  }
}
