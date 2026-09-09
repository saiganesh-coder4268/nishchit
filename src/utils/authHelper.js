/**
 * Translates Firebase Authentication errors into clear, actionable human-friendly messages.
 */
export function formatAuthError(error) {
  if (!error) return 'An unexpected error occurred. Please try again.';
  
  const code = (error.code || '').toLowerCase();
  const message = (error.message || (typeof error === 'string' ? error : '')).toLowerCase();

  if (
    code.includes('invalid-credential') ||
    code.includes('wrong-password') ||
    code.includes('user-not-found') ||
    message.includes('invalid-credential') ||
    message.includes('user-not-found')
  ) {
    return 'Invalid credentials. If you are a new user, please click "Register" below or verify your password.';
  }
  if (code.includes('email-already-in-use') || message.includes('email-already-in-use')) {
    return 'This email address is already registered. Please sign in with your password.';
  }
  if (code.includes('weak-password') || message.includes('weak-password')) {
    return 'Password is too weak. Please use at least 6 characters.';
  }
  if (code.includes('invalid-email') || message.includes('invalid-email')) {
    return 'Please enter a valid email address.';
  }
  if (code.includes('popup-closed-by-user') || message.includes('popup-closed')) {
    return 'Sign-in popup was closed before completing.';
  }
  if (code.includes('popup-blocked') || message.includes('popup-blocked')) {
    return 'Sign-in popup was blocked by your browser. Please allow popups for this site.';
  }
  if (code.includes('network-request-failed') || message.includes('network')) {
    return 'Network connection error. Please check your internet connection.';
  }
  if (code.includes('too-many-requests') || message.includes('too-many-requests')) {
    return 'Access temporarily disabled due to many failed attempts. Please try again in a few moments.';
  }
  if (code.includes('operation-not-allowed') || message.includes('operation-not-allowed')) {
    return 'This authentication method is currently being configured.';
  }

  const raw = error.message || String(error);
  const cleaned = raw
    .replace(/^Firebase:\s*/i, '')
    .replace(/^Error\s*:\s*/i, '')
    .replace(/\s*\([^)]*\)\.?$/, '')
    .trim();

  if (!cleaned || cleaned.toLowerCase() === 'error') {
    return 'Authentication failed. Please verify your email and password or register a new profile.';
  }

  return cleaned;
}

