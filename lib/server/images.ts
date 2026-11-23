import "server-only";

export const MAX_IMAGE_BYTES = 2 * 1024 * 1024; // the admin page shrinks photos first, so this is generous
export const MAX_IMAGES_PER_PRODUCT = 8;

/** Decide the real type from the file's first bytes (never trust the filename or the declared type). */
export function sniffImage(b: Uint8Array): "image/jpeg" | "image/png" | "image/webp" | null {
  if (b.length > 12 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b.length > 12 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "image/png";
  if (b.length > 12 && String.fromCharCode(...b.slice(0, 4)) === "RIFF" && String.fromCharCode(...b.slice(8, 12)) === "WEBP") return "image/webp";
  return null;
}
