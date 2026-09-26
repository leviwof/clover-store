// Lightweight, framework-agnostic validators for the auth forms.
// Each returns a human-readable error message, or null when the value is valid.
// Kept UI-free so the sign-in and sign-up forms share one source of truth.

// Pragmatic email shape check — mirrors what the browser's type="email" accepts
// without trying to fully implement RFC 5322 (the server is the real authority).
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const MIN_PASSWORD_LENGTH = 8;

export function validateEmail(value: string): string | null {
  const email = value.trim();
  if (!email) return "Enter your email address.";
  if (!EMAIL_RE.test(email)) return "Enter a valid email address.";
  return null;
}

export function validateName(value: string): string | null {
  if (!value.trim()) return "Enter your name.";
  return null;
}

// Sign-up: enforce the same minimum the server (Better Auth) applies, so the
// user gets instant feedback instead of a round-trip rejection.
export function validateNewPassword(value: string): string | null {
  if (!value) return "Choose a password.";
  if (value.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  return null;
}

// Sign-in: only require presence. Never surface length/complexity rules here —
// they'd leak nothing useful and could reject a legitimate existing password.
export function validateCurrentPassword(value: string): string | null {
  if (!value) return "Enter your password.";
  return null;
}
