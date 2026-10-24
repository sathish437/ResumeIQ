/**
 * Singleton service for Google Identity Services (GSI).
 * Handles:
 * - Single script loading and verification
 * - Idempotent initialization (guards against duplicate google.accounts.id.initialize() calls, especially in React StrictMode)
 * - Dynamic credential callback routing
 * - Button rendering
 */

export interface GoogleCredentialResponse {
  credential: string;
  select_by?: string;
}

export interface GoogleButtonOptions {
  type?: 'standard' | 'icon';
  theme?: 'outline' | 'filled_blue' | 'filled_black';
  size?: 'large' | 'medium' | 'small';
  text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
  shape?: 'rectangular' | 'pill' | 'circle' | 'square';
  logo_alignment?: 'left' | 'center';
  width?: number;
  locale?: string;
}

export type GooglePromptNotification = {
  isNotDisplayed: () => boolean;
  isSkippedMoment: () => boolean;
  isDismissedMoment: () => boolean;
  getNotDisplayedReason: () => string;
  getSkippedReason: () => string;
  getDismissedReason: () => string;
};

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: GoogleCredentialResponse) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          renderButton: (parent: HTMLElement, options: GoogleButtonOptions) => void;
          prompt: (notification?: (notification: GooglePromptNotification) => void) => void;
          disableAutoSelect: () => void;
        };
      };
    };
  }
}

const SCRIPT_ID = 'google-gsi-client';
const SCRIPT_SRC = 'https://accounts.google.com/gsi/client';

let isGsiInitialized = false;
let initializedClientId = '';
let activeCredentialCallback: ((response: GoogleCredentialResponse) => void) | null = null;
let scriptLoadPromise: Promise<void> | null = null;

/**
 * Loads the Google Identity Services script once.
 * Returns a cached promise if loading is already in progress.
 */
export function loadGoogleScript(): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Window is undefined'));
  }

  if (window.google?.accounts?.id) {
    return Promise.resolve();
  }

  if (scriptLoadPromise) {
    return scriptLoadPromise;
  }

  scriptLoadPromise = new Promise<void>((resolve, reject) => {
    let script =
      (document.getElementById(SCRIPT_ID) as HTMLScriptElement | null) ||
      (document.querySelector(`script[src="${SCRIPT_SRC}"]`) as HTMLScriptElement | null);

    if (!script) {
      script = document.createElement('script');
      script.id = SCRIPT_ID;
      script.src = SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    } else if (!script.id) {
      script.id = SCRIPT_ID;
    }

    const timeoutId = setTimeout(() => {
      cleanup();
      reject(new Error('Google Identity Services script loading timed out.'));
    }, 15000);

    const onLoad = () => {
      let attempts = 0;
      const checkInterval = setInterval(() => {
        attempts++;
        if (window.google?.accounts?.id) {
          clearInterval(checkInterval);
          cleanup();
          resolve();
        } else if (attempts > 30) {
          clearInterval(checkInterval);
          cleanup();
          reject(new Error('Google Identity Services script loaded but window.google.accounts.id is unavailable.'));
        }
      }, 100);
    };

    const onError = () => {
      cleanup();
      reject(
        new Error(
          'Failed to load Google Identity Services script. Ensure accounts.google.com is accessible and third-party scripts are not blocked.'
        )
      );
    };

    function cleanup() {
      clearTimeout(timeoutId);
      script?.removeEventListener('load', onLoad);
      script?.removeEventListener('error', onError);
    }

    script.addEventListener('load', onLoad);
    script.addEventListener('error', onError);

    // If script was already loaded before listeners attached
    if (window.google?.accounts?.id) {
      cleanup();
      resolve();
    }
  });

  return scriptLoadPromise;
}

/**
 * Idempotently initializes Google Identity Services.
 * Ensures window.google.accounts.id.initialize is called only once per clientId,
 * preventing duplicate initialization warnings during React StrictMode remounts.
 */
export function initializeGoogleIdentity(
  clientId: string,
  onCredential: (response: GoogleCredentialResponse) => void
): void {
  activeCredentialCallback = onCredential;

  if (!window.google?.accounts?.id) {
    return;
  }

  if (isGsiInitialized && initializedClientId === clientId) {
    // Already initialized with this client ID.
    // The active callback is updated above so the existing GSI registration invokes the latest handler.
    return;
  }

  window.google.accounts.id.initialize({
    client_id: clientId,
    callback: (response: GoogleCredentialResponse) => {
      if (activeCredentialCallback) {
        activeCredentialCallback(response);
      }
    },
    auto_select: false,
    cancel_on_tap_outside: true,
  });

  isGsiInitialized = true;
  initializedClientId = clientId;
}

/**
 * Renders the official Google Sign-In button into the target container.
 * Protects against redundant re-rendering if the button iframe is already attached.
 */
export function renderGoogleButton(container: HTMLElement, options: GoogleButtonOptions): void {
  if (!window.google?.accounts?.id) {
    throw new Error('Google Identity Services is not loaded.');
  }

  // If container already contains the rendered Google iframe, avoid re-rendering
  // which tears down the iframe and causes duplicate button requests
  if (container.querySelector('iframe')) {
    return;
  }

  container.innerHTML = '';
  window.google.accounts.id.renderButton(container, options);
}

/**
 * Disables Google One Tap auto-select on user logout.
 * Prevents an automatic sign-in loop or duplicate prompt attempts when redirected to LoginPage.
 */
export function disableGoogleAutoSelect(): void {
  try {
    if (typeof window !== 'undefined' && window.google?.accounts?.id?.disableAutoSelect) {
      window.google.accounts.id.disableAutoSelect();
    }
  } catch {
    // Ignore if GSI is not loaded
  }
}

/**
 * Invokes the Google One Tap / Sign-In prompt.
 */
export function promptGoogleSignIn(
  onNotification?: (notification: GooglePromptNotification) => void
): void {
  if (window.google?.accounts?.id) {
    window.google.accounts.id.prompt(onNotification);
  }
}

/**
 * Resets Google Identity state (used when user clicks Retry).
 */
export function resetGoogleIdentity(): void {
  isGsiInitialized = false;
  initializedClientId = '';
  activeCredentialCallback = null;
  scriptLoadPromise = null;

  const script = document.getElementById(SCRIPT_ID);
  if (script) {
    script.remove();
  }
}
