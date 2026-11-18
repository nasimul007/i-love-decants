/** Accepts 01XXXXXXXXX, +8801XXXXXXXXX or 8801XXXXXXXXX (spaces/dashes ignored). */
const BD_PHONE = /^(?:\+?880|0)1[3-9]\d{8}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const isBdPhone = (value: string): boolean => BD_PHONE.test(value.replace(/[\s-]/g, ""));
export const isEmail = (value: string): boolean => EMAIL.test(value.trim());

export type PasswordStrength = { score: 0 | 1 | 2 | 3 | 4; label: string };

export function passwordStrength(pw: string): PasswordStrength {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw) || pw.length >= 12) score++;
  const labels = ["Too weak", "Weak", "Fair", "Good", "Strong"];
  return { score: score as PasswordStrength["score"], label: labels[score] };
}

/** Returns an error message or "" when the password is acceptable. */
export function validatePassword(pw: string): string {
  if (pw.length < 8) return "Password must be at least 8 characters.";
  if (!/[A-Za-z]/.test(pw) || !/\d/.test(pw)) return "Use at least one letter and one number.";
  return "";
}
