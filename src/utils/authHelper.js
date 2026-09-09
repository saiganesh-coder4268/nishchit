/**
 * Translates Firebase Authentication errors into clear, actionable human-friendly messages.
 */
export function formatAuthError(error) {
  if (!error) return 'An unexpected error occurred. Please try again.';
  
  const code = error.code || '';
  const message = error.message || '';

  if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
    return 'Invalid email or password. Please verify your credentials or register a new account.';
  }
  if (code === 'auth/email-already-in-use') {
    return 'This email address is already registered. Please sign in instead.';
  }
  if (code === 'auth/weak-password') {
    return 'Password is too weak. Please use at least 6 characters.';
  }
  if (code === 'auth/invalid-email') {
    return 'Please enter a valid email address.';
  }
  if (code === 'auth/popup-closed-by-user') {
    return 'Sign-in popup was closed before completing.';
  }
  if (code === 'auth/popup-blocked') {
    return 'Sign-in popup was blocked by your browser. Please allow popups for this site.';
  }
  if (code === 'auth/network-request-failed') {
    return 'Network connection error. Please check your internet connection.';
  }
  if (code === 'auth/too-many-requests') {
    return 'Access temporarily disabled due to many failed login attempts. Please reset your password or try again later.';
  }
  if (code === 'auth/operation-not-allowed') {
    return 'This authentication method is not enabled in the project settings.';
  }

  // Fallback to cleaner message
  return message.replace(/^Firebase:\s*/i, '').replace(/\s*\([^)]*\)\.?$/, '') || 'Authentication failed.';
}
