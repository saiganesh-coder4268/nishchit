/**
 * Translates Firebase Authentication errors and operational states into clear,
 * human-friendly messages for the Nishchit platform.
 * 
 * Never exposes raw technical codes or Firebase stack traces.
 */
export function formatAuthError(error) {
  if (!error) return 'An unexpected issue occurred. Please try again.';
  
  const code = (error.code || '').toLowerCase();
  const message = (error.message || (typeof error === 'string' ? error : '')).toLowerCase();

  // 1. Google popup closed or cancelled by user
  if (
    code.includes('popup-closed-by-user') ||
    message.includes('popup-closed-by-user') ||
    message.includes('popup closed') ||
    message.includes('user cancelled') ||
    message.includes('cancelled')
  ) {
    return 'Sign-in was cancelled.';
  }

  // 2. Popup blocked by browser
  if (code.includes('popup-blocked') || message.includes('popup-blocked')) {
    return 'The sign-in popup was blocked by your browser. Please allow popups for this site and try again.';
  }

  // 3. Network connection failure
  if (
    code.includes('network-request-failed') ||
    message.includes('network-request-failed') ||
    message.includes('network error') ||
    message.includes('failed to fetch')
  ) {
    return "We couldn't connect to the authentication service. Please try again.";
  }

  // 4. Firebase / Authentication service temporarily unavailable
  if (
    code.includes('service-unavailable') ||
    code.includes('operation-not-allowed') ||
    message.includes('temporarily unavailable')
  ) {
    return "We couldn't connect to the authentication service. Please try again.";
  }

  // 5. Rate limiting
  if (code.includes('too-many-requests') || message.includes('too-many-requests')) {
    return 'Too many sign-in attempts. Please wait a moment and try again.';
  }

  // 6. Role mismatch
  if (code.includes('role-mismatch') || message.includes('role mismatch')) {
    if (message.includes('driver')) {
      return 'This account does not have access to the Driver Portal.';
    }
    if (message.includes('parent')) {
      return 'This account does not have access to the Parent Portal.';
    }
    return 'This account is associated with a different Nishchit portal.';
  }

  // 7. Unauthorized / permission denied
  if (
    code.includes('permission-denied') ||
    code.includes('unauthorized') ||
    message.includes('permission denied') ||
    message.includes('not authorized')
  ) {
    return 'This account does not have access to this portal.';
  }

  // 8. Invalid credentials
  if (
    code.includes('invalid-credential') ||
    code.includes('user-not-found') ||
    code.includes('wrong-password') ||
    message.includes('invalid-credential')
  ) {
    return 'Sign-in credentials could not be verified. Please check your details and try again.';
  }

  if (code.includes('account-exists-with-different-credential')) {
    return 'An account already exists with this email under a different sign-in method.';
  }

  // Generic fallback without technical error strings or stack traces
  const raw = error.message || String(error);
  const cleaned = raw
    .replace(/^Firebase:\s*/i, '')
    .replace(/^Error\s*:\s*/i, '')
    .replace(/\s*\([^)]*\)\.?$/, '')
    .trim();

  if (
    !cleaned ||
    cleaned.toLowerCase() === 'error' ||
    cleaned.includes('auth/') ||
    cleaned.includes('firebase')
  ) {
    return "We couldn't connect to the authentication service. Please try again.";
  }

  return cleaned;
}
