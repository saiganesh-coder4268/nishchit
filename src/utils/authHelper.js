/**
 * Translates Firebase Authentication errors and session states into clear,
 * actionable human-friendly messages for the Nishchit platform.
 */
export function formatAuthError(error) {
  if (!error) return 'An unexpected error occurred. Please try again.';
  
  const code = (error.code || '').toLowerCase();
  const message = (error.message || (typeof error === 'string' ? error : '')).toLowerCase();

  // Popup closed or cancelled by user
  if (
    code.includes('popup-closed-by-user') ||
    message.includes('popup-closed-by-user') ||
    message.includes('popup closed')
  ) {
    return "Sign-in was cancelled. You can try again whenever you're ready.";
  }

  // Popup blocked by browser
  if (code.includes('popup-blocked') || message.includes('popup-blocked')) {
    return 'The sign-in popup was blocked by your browser. Please allow popups for this site and try again.';
  }

  // Network connection error
  if (code.includes('network-request-failed') || message.includes('network-request-failed') || message.includes('network error')) {
    return 'Unable to reach the authentication service. Please check your internet connection and try again.';
  }

  // Too many attempts / rate limiting
  if (code.includes('too-many-requests') || message.includes('too-many-requests')) {
    return 'Too many sign-in attempts. Please wait a moment and try again.';
  }

  // Account / credential issues
  if (
    code.includes('invalid-credential') ||
    code.includes('user-not-found') ||
    code.includes('wrong-password') ||
    message.includes('invalid-credential')
  ) {
    return 'Sign-in credentials could not be verified. Please verify your details or continue with Google.';
  }

  if (code.includes('account-exists-with-different-credential')) {
    return 'An account already exists with this email address under a different sign-in method.';
  }

  // Operation not allowed or provider error -> Clean user-facing notice
  if (code.includes('operation-not-allowed') || message.includes('operation-not-allowed')) {
    return 'Sign-in is temporarily unavailable. Please try again or continue with Google.';
  }

  // Generic fallback without technical error strings
  const raw = error.message || String(error);
  const cleaned = raw
    .replace(/^Firebase:\s*/i, '')
    .replace(/^Error\s*:\s*/i, '')
    .replace(/\s*\([^)]*\)\.?$/, '')
    .trim();

  if (!cleaned || cleaned.toLowerCase() === 'error' || cleaned.includes('auth/')) {
    return "We couldn't complete sign-in right now. Please try again.";
  }

  return cleaned;
}

