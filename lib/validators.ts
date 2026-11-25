/** Accepts 01XXXXXXXXX, +8801XXXXXXXXX or 8801XXXXXXXXX (spaces/dashes ignored). */
const BD_PHONE = /^(?:\+?880|0)1[3-9]\d{8}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Canonical 01XXXXXXXXX form of a Bangladeshi mobile number (used to recognise the same customer). */
export const normalizePhone = (value: string): string => {
  const d = value.replace(/[\s-]/g, "").replace(/^\+/, "");
  return d.startsWith("880") ? "0" + d.slice(3) : d;
};

/** Phone fields keep only the 11-digit local number (01XXXXXXXXX). "+880 17…" pasted in becomes "017…". */
export const toLocalPhone = (value: string): string => {
  const d = value.replace(/\D/g, "");
  return (d.startsWith("880") ? d.slice(2) : d).slice(0, 11);
};
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

/** A person's name: letters in any script (Bangla too), spaces and . ' - only — no digits or symbols. */
const PERSON_NAME = /^[\p{L}\p{M}][\p{L}\p{M} .'’-]*$/u;
export const isPersonName = (value: string): boolean => {
  const v = value.trim();
  return v.length >= 2 && v.length <= 100 && PERSON_NAME.test(v);
};
export const NAME_ERROR = "Enter a valid name (letters only, no numbers or symbols).";
