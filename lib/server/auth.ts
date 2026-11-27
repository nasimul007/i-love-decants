import "server-only";
import bcrypt from "bcryptjs";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { HttpError } from "./http";
import type { AdminSection } from "@/types";

const CUSTOMER_COOKIE = "ild_session";
const STAFF_COOKIE = "ild_staff";
const CUSTOMER_TTL_MS = 30 * 24 * 3600_000;
const STAFF_TTL_MS = 12 * 3600_000;

export const hashPassword = (pw: string) => bcrypt.hash(pw, 10);
export const verifyPassword = (pw: string, hash: string) => bcrypt.compare(pw, hash);
/** Compared when the account doesn't exist so response time doesn't reveal valid emails. */
export const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", 10);

const sha = (s: string) => createHash("sha256").update(s).digest("hex");

async function startSession(cookieName: string, ttl: number, who: { customerId: string } | { staffId: string }) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + ttl);
  await db.session.create({ data: { tokenHash: sha(token), expiresAt, ...who } });
  (await cookies()).set(cookieName, token, {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", expires: expiresAt,
  });
}

async function endSession(cookieName: string) {
  const jar = await cookies();
  const token = jar.get(cookieName)?.value;
  if (token) await db.session.deleteMany({ where: { tokenHash: sha(token) } });
  jar.delete(cookieName);
}

async function lookup(cookieName: string) {
  const token = (await cookies()).get(cookieName)?.value;
  if (!token) return null;
  const s = await db.session.findUnique({
    where: { tokenHash: sha(token) },
    include: { customer: true, staff: true },
  });
  if (!s || s.expiresAt < new Date()) return null;
  return s;
}

export const startCustomerSession = (customerId: string) => startSession(CUSTOMER_COOKIE, CUSTOMER_TTL_MS, { customerId });
export const startStaffSession = (staffId: string) => startSession(STAFF_COOKIE, STAFF_TTL_MS, { staffId });
export const endCustomerSession = () => endSession(CUSTOMER_COOKIE);
export const endStaffSession = () => endSession(STAFF_COOKIE);

export async function currentCustomer() {
  return (await lookup(CUSTOMER_COOKIE))?.customer ?? null;
}
export async function requireCustomer() {
  const c = await currentCustomer();
  if (!c) throw new HttpError(401, "Please sign in.");
  return c;
}

export async function currentStaff() {
  return (await lookup(STAFF_COOKIE))?.staff ?? null;
}

/** Throws 401/403 unless a staff member (owner, or manager with `section` permission) is signed in. */
export async function requireStaff(section?: AdminSection) {
  const s = await currentStaff();
  if (!s) throw new HttpError(401, "Staff sign-in required.");
  if (section && s.role !== "OWNER") {
    const perms = (s.permissions ?? {}) as Partial<Record<AdminSection, boolean>>;
    if (!perms[section]) throw new HttpError(403, "You don't have access to this section.");
  }
  return s;
}
export async function requireOwner() {
  const s = await requireStaff();
  if (s.role !== "OWNER") throw new HttpError(403, "Owner only.");
  return s;
}

export const audit = (actor: "customer" | "owner" | "manager", user: string, action: string) =>
  db.auditLog.create({ data: { actor, user, action } });

export const publicCustomer = (c: { email: string; name: string; phone: string; address: string; city: string; joinedAt: Date; lastLogin: Date }) => ({
  email: c.email, name: c.name, phone: c.phone, address: c.address, city: c.city,
  joinedAt: c.joinedAt.toISOString(), lastLogin: c.lastLogin.toISOString(),
});
