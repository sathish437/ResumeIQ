import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion } from 'motion/react';
import {
  Bot,
  AlertCircle,
  ShieldCheck,
  CheckCircle2,
  RotateCcw,
} from 'lucide-react';
import { useAuth } from '../context/useAuth';

import {
  loadGoogleScript,
  initializeGoogleIdentity,
  renderGoogleButton,
  promptGoogleSignIn,
  resetGoogleIdentity,
  type GoogleCredentialResponse,
} from '../services/googleIdentityService';

const GOOGLE_CLIENT_ID = (
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  '837596203973-dnhf7rp7qgpte6bbafunvshu2b0ghmui.apps.googleusercontent.com'
).trim();

export const LoginPage: React.FC = () => {
  const { loginWithGoogleCredential, authError, clearError } = useAuth();
  const [isVerifyingWithBackend, setIsVerifyingWithBackend] = useState(false);
  const [scriptState, setScriptState] = useState<'loading' | 'ready' | 'error'>(() => {
    return typeof window !== 'undefined' && Boolean(window.google?.accounts?.id)
      ? 'ready'
      : 'loading';
  });
  const [buttonRendered, setButtonRendered] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [retryCounter, setRetryCounter] = useState(0);
  const googleBtnContainerRef = useRef<HTMLDivElement>(null);

  const handleCredentialResponse = useCallback(
    async (response: GoogleCredentialResponse) => {
      if (!response.credential) {
        return;
      }

      clearError();
      setErrorMessage(null);
      setIsVerifyingWithBackend(true);

      try {
        await loginWithGoogleCredential(response.credential);
      } catch (err: unknown) {
        console.error('Failed to authenticate with backend:', err);
      } finally {
        setIsVerifyingWithBackend(false);
      }
    },
    [loginWithGoogleCredential, clearError]
  );

  // Single reliable lifecycle for script loading and button rendering
  useEffect(() => {
    let active = true;

    async function setupGsi() {
      try {
        await loadGoogleScript();
        if (!active) return;

        setScriptState('ready');

        // Idempotently configure Google Identity Services (safe for React StrictMode remounts)
        initializeGoogleIdentity(GOOGLE_CLIENT_ID, handleCredentialResponse);

        if (googleBtnContainerRef.current) {
          renderGoogleButton(googleBtnContainerRef.current, {
            theme: 'filled_black',
            size: 'large',
            type: 'standard',
            shape: 'rectangular',
            text: 'continue_with',
            logo_alignment: 'left',
            width: 320,
          });
          if (active) {
            setButtonRendered(true);
          }
        }
      } catch (err: unknown) {
        if (!active) return;
        setScriptState('error');
        const msg =
          err instanceof Error
            ? err.message
            : 'Unable to initialize Google Sign-In. Please check your network or ad-blocker settings.';
        setErrorMessage(msg);
      }
    }

    setupGsi();

    return () => {
      active = false;
    };
  }, [handleCredentialResponse, retryCounter]);

  const handleManualSignInClick = () => {
    clearError();
    setErrorMessage(null);

    try {
      promptGoogleSignIn((notification) => {
        if (notification.isNotDisplayed()) {
          const reason = notification.getNotDisplayedReason?.() || 'unknown';
          if (reason === 'opt_out_or_no_session') {
            setErrorMessage(
              'No active Google session found. Please sign in to Google in your browser, or ensure third-party cookies are not blocked.'
            );
          } else if (reason === 'suppressed_by_user') {
            setErrorMessage('Google prompt was dismissed. Click to try again.');
          } else {
            console.warn('Google prompt not displayed. Reason:', reason);
          }
        }
      });
    } catch {
      setRetryCounter((c) => c + 1);
    }
  };

  const handleRetry = () => {
    resetGoogleIdentity();
    setScriptState('loading');
    setErrorMessage(null);
    setButtonRendered(false);
    setRetryCounter((c) => c + 1);
  };

  const activeError = authError || errorMessage;

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--bg-app)',
        padding: '24px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background ambient lighting */}
      <div
        style={{
          position: 'absolute',
          top: '-15%',
          right: '-10%',
          width: '550px',
          height: '550px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(239, 68, 68, 0.12) 0%, rgba(0, 0, 0, 0) 70%)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-15%',
          left: '-10%',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(220, 38, 38, 0.08) 0%, rgba(0, 0, 0, 0) 70%)',
          pointerEvents: 'none',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        style={{
          width: '100%',
          maxWidth: '460px',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-main)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 12px 36px rgba(0, 0, 0, 0.35)',
          padding: '36px 32px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '54px',
              height: '54px',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
              color: '#ffffff',
              boxShadow: '0 4px 16px rgba(220, 38, 38, 0.35)',
              marginBottom: '16px',
            }}
          >
            <Bot size={28} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <h1
              style={{
                fontSize: '1.65rem',
                fontWeight: 900,
                color: 'var(--text-main)',
                letterSpacing: '-0.03em',
                margin: 0,
              }}
            >
              ResumeIQ
            </h1>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 800,
                padding: '2px 7px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: '#ef4444',
                color: '#ffffff',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              AI
            </span>
          </div>

          <p
            style={{
              fontSize: '0.85rem',
              color: 'var(--text-muted)',
              marginTop: '8px',
              lineHeight: 1.45,
            }}
          >
            AI-powered resume analysis, grounded evidence extraction & personalized career roadmaps.
          </p>
        </div>

        {/* Error notification banner with Retry button */}
        {activeError && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="alert alert-danger"
            role="alert"
            style={{ marginBottom: '20px', padding: '12px 14px' }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div style={{ fontSize: '0.8rem', lineHeight: 1.45, flex: 1 }}>
              <div style={{ fontWeight: 700, marginBottom: '2px' }}>Authentication Notification</div>
              <div style={{ marginBottom: '8px' }}>{activeError}</div>
              <button
                type="button"
                className="btn btn-outline"
                style={{ fontSize: '0.74rem', padding: '3px 8px', gap: '4px' }}
                onClick={handleRetry}
              >
                <RotateCcw size={11} />
                <span>Retry Connection</span>
              </button>
            </div>
          </motion.div>
        )}

        {/* Authentication Card Body */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
            padding: '20px 0',
            borderTop: '1px solid var(--border-subtle)',
            borderBottom: '1px solid var(--border-subtle)',
            marginBottom: '24px',
          }}
        >
          {isVerifyingWithBackend ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px',
                padding: '16px 0',
              }}
            >
              <span className="spinner" style={{ width: '28px', height: '28px', borderColor: '#ef4444', borderTopColor: 'transparent' }} />
              <div style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--text-main)' }}>
                Verifying Google identity & establishing session...
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Validating credentials securely on the backend
              </div>
            </div>
          ) : (
            <>
              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                Sign in to your account
              </div>

              {/* Official Google Identity Services Render Container */}
              <div
                ref={googleBtnContainerRef}
                id="google-signin-button-container"
                style={{
                  minHeight: '44px',
                  display: buttonRendered ? 'flex' : 'none',
                  justifyContent: 'center',
                  width: '100%',
                }}
              />

              {/* Fallback & Initializing Button State */}
              {!buttonRendered && (
                <div style={{ width: '100%', maxWidth: '320px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={handleManualSignInClick}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '12px',
                      width: '100%',
                      padding: '11px 16px',
                      backgroundColor: '#ffffff',
                      color: '#1f2937',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.08)',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#f9fafb')}
                    onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}
                  >
                    {/* Official Google multicolored G logo SVG */}
                    <svg width="18" height="18" viewBox="0 0 18 18">
                      <path
                        fill="#4285F4"
                        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.616z"
                      />
                      <path
                        fill="#34A853"
                        d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"
                      />
                      <path
                        fill="#EA4335"
                        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z"
                      />
                    </svg>
                    <span>
                      {scriptState === 'loading' ? 'Loading Google Sign-In...' : 'Continue with Google'}
                    </span>
                  </button>

                  {scriptState === 'loading' && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      <span className="spinner" style={{ width: '11px', height: '11px' }} />
                      <span>Connecting to Google Identity Services...</span>
                    </div>
                  )}
                </div>
              )}

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.72rem',
                  color: 'var(--text-subtle)',
                  marginTop: '4px',
                }}
              >
                <ShieldCheck size={14} style={{ color: '#22c55e' }} />
                <span>Verified securely by Google OAuth 2.0</span>
              </div>
            </>
          )}
        </div>

        {/* Feature Highlights */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            <CheckCircle2 size={14} style={{ color: '#ef4444', flexShrink: 0 }} />
            <span>AI resume extraction with grounded page & segment evidence citations</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            <CheckCircle2 size={14} style={{ color: '#ef4444', flexShrink: 0 }} />
            <span>Interactive AI Resume Chat with source-backed answers</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            <CheckCircle2 size={14} style={{ color: '#ef4444', flexShrink: 0 }} />
            <span>Domain-specific 6-stage roadmap & custom job description benchmarking</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
