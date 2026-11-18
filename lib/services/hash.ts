/**
 * DEMO ONLY. A tiny non-cryptographic hash so plain-text passwords are not
 * sitting in localStorage. A real backend MUST use bcrypt/argon2 server-side.
 */
export function hashSimple(str: string): string {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  return h.toString(16);
}
