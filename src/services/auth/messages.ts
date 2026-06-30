const MESSAGE_MAP: Record<string, string> = {
  'Invalid login credentials': 'Invalid email or password. Please try again.',
  'Email not confirmed': 'Please confirm your email before signing in.',
  'User already registered': 'An account with this email already exists.',
  'Signup requires a valid password': 'Please choose a stronger password.',
  'Password should be at least 6 characters': 'Password must be at least 8 characters.',
  'Unable to validate email address: invalid format': 'Please enter a valid email address.',
  'Email rate limit exceeded': 'Too many attempts. Please wait a moment and try again.',
  'For security purposes, you can only request this once every 60 seconds':
    'Please wait a minute before requesting another reset email.',
}

export function mapAuthError(message: string): string {
  const normalized = message.trim()
  if (MESSAGE_MAP[normalized]) return MESSAGE_MAP[normalized]

  if (/password/i.test(normalized) && /least|short|weak/i.test(normalized)) {
    return 'Password must be at least 8 characters and include letters and numbers.'
  }

  if (/network|fetch|failed to fetch/i.test(normalized)) {
    return 'Network error. Check your connection and try again.'
  }

  if (/already (registered|exists)/i.test(normalized)) {
    return 'An account with this email already exists.'
  }

  if (/invalid.*(credentials|login|password)/i.test(normalized)) {
    return 'Invalid email or password. Please try again.'
  }

  return normalized || 'Something went wrong. Please try again.'
}

export const AUTH_SUCCESS = {
  resetEmailSent: 'Check your inbox for a password reset link.',
  passwordUpdated: 'Your password has been updated. You can sign in with your new password.',
  registrationCheckEmail:
    'Account created. Check your email to confirm your address, then sign in.',
  registrationComplete: 'Welcome to ASCEND. Your account is ready.',
} as const
