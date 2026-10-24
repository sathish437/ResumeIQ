/**
 * Authentication and user profile types for ResumeIQ.
 */

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  pictureUrl?: string | null;
}

export interface AuthResponse {
  authenticated: boolean;
  token?: string | null;
  user?: UserProfile | null;
  message?: string | null;
}
