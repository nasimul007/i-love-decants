import { KEYS, readJSON, removeKey, writeJSON } from "@/lib/storage";
import { hashSimple } from "./hash";
import { loginHistoryService } from "./loginHistory";
import type {
  AdminConfig, AdminSection, AdminSession, Manager, ManagerPermissions, ServiceResult,
} from "@/types";

export const ADMIN_SECTIONS: { id: AdminSection; label: string }[] = [
  { id: "inventory", label: "Inventory" },
  { id: "products", label: "Prices & sprays" },
  { id: "customers", label: "Customers" },
  { id: "history", label: "Login history" },
  { id: "coupons", label: "Coupons" },
];

export function can(session: AdminSession | null, section: AdminSection): boolean {
  if (!session) return false;
  return session.role === "owner" || !!session.permissions?.[section];
}

export const adminService = {
  config: (): AdminConfig | null => readJSON<AdminConfig | null>(KEYS.adminConfig, null),
  saveConfig: (cfg: AdminConfig) => writeJSON(KEYS.adminConfig, cfg),
  isSetup(): boolean {
    return this.config()?.setup === true;
  },
  session: (): AdminSession | null => readJSON<AdminSession | null>(KEYS.adminSession, null),

  /** First-run wizard: creates the master Owner and signs them in. */
  setupOwner(input: { name: string; username: string; password: string; confirm: string }): ServiceResult<AdminSession> {
    if (!input.name.trim() || !input.username.trim()) return { ok: false, error: "Please enter your name and a username." };
    if (input.password.length < 6) return { ok: false, error: "Password must be at least 6 characters." };
    if (input.password !== input.confirm) return { ok: false, error: "Passwords do not match." };
    this.saveConfig({
      setup: true, ownerName: input.name.trim(), ownerUsername: input.username.trim(),
      ownerHash: hashSimple(input.password), managers: [],
    });
    const session: AdminSession = { role: "owner", name: input.name.trim(), username: input.username.trim() };
    writeJSON(KEYS.adminSession, session);
    loginHistoryService.record("owner", session.username, "login");
    return { ok: true, data: session };
  },

  login(username: string, password: string): ServiceResult<AdminSession> {
    const cfg = this.config();
    if (!cfg) return { ok: false, error: "Admin not configured." };
    const user = username.trim();
    const hash = hashSimple(password);
    let session: AdminSession | null = null;
    if (user === cfg.ownerUsername && hash === cfg.ownerHash) {
      session = { role: "owner", name: cfg.ownerName, username: user };
    } else {
      const m = cfg.managers.find((x) => x.username === user && x.passwordHash === hash);
      if (m) session = { role: "manager", name: m.name, username: m.username, permissions: m.permissions };
    }
    if (!session) return { ok: false, error: "Incorrect username or password." };
    writeJSON(KEYS.adminSession, session);
    loginHistoryService.record(session.role, session.username, "login");
    return { ok: true, data: session };
  },

  logout(): void {
    const s = this.session();
    if (s) loginHistoryService.record(s.role, s.username, "logout");
    removeKey(KEYS.adminSession);
  },

  managers: (): Manager[] => adminService.config()?.managers ?? [],

  saveManager(input: {
    editId?: string; name: string; username: string; password: string; permissions: ManagerPermissions;
  }): ServiceResult {
    const cfg = this.config();
    if (!cfg) return { ok: false, error: "Admin not configured." };
    const name = input.name.trim();
    const username = input.username.trim();
    if (!name || !username) return { ok: false, error: "Name and username are required." };
    const clash = cfg.managers.some((m) => m.username === username && m.id !== input.editId) || username === cfg.ownerUsername;
    if (clash) return { ok: false, error: "That username is already taken." };
    if (!input.editId && !input.password) return { ok: false, error: "Password is required for a new manager." };

    const managers = input.editId
      ? cfg.managers.map((m) =>
          m.id === input.editId
            ? { ...m, name, username, permissions: input.permissions, passwordHash: input.password ? hashSimple(input.password) : m.passwordHash }
            : m,
        )
      : [...cfg.managers, { id: `mgr-${Date.now()}`, name, username, passwordHash: hashSimple(input.password), permissions: input.permissions }];
    this.saveConfig({ ...cfg, managers });
    return { ok: true };
  },

  removeManager(id: string): void {
    const cfg = this.config();
    if (cfg) this.saveConfig({ ...cfg, managers: cfg.managers.filter((m) => m.id !== id) });
  },
};
