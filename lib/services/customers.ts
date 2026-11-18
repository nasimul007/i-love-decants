import { KEYS, readJSON, removeKey, writeJSON } from "@/lib/storage";
import { hashSimple } from "./hash";
import { loginHistoryService } from "./loginHistory";
import { isBdPhone, isEmail, validatePassword } from "@/lib/validators";
import type { Customer, CustomerSession, ServiceResult } from "@/types";

export interface RegisterInput { name: string; phone: string; email: string; password: string }
export type FieldErrors = Partial<Record<"name" | "phone" | "email" | "password", string>>;

export const customerService = {
  list: (): Customer[] => readJSON<Customer[]>(KEYS.customers, []),
  save: (list: Customer[]) => writeJSON(KEYS.customers, list),
  session: (): CustomerSession | null => readJSON<CustomerSession | null>(KEYS.customerSession, null),
  current(): Customer | null {
    const s = this.session();
    return s ? this.list().find((c) => c.email === s.email) ?? null : null;
  },

  validateRegistration(input: RegisterInput): FieldErrors {
    const errors: FieldErrors = {};
    if (!input.name.trim()) errors.name = "Please enter your name.";
    if (!isBdPhone(input.phone.trim())) errors.phone = "Enter a valid Bangladeshi phone number.";
    if (!isEmail(input.email)) errors.email = "Enter a valid email address.";
    const pw = validatePassword(input.password);
    if (pw) errors.password = pw;
    return errors;
  },

  register(input: RegisterInput): ServiceResult<Customer> {
    const email = input.email.trim().toLowerCase();
    const list = this.list();
    if (list.some((c) => c.email === email)) return { ok: false, error: "This email is already registered." };
    const now = new Date().toISOString();
    const customer: Customer = {
      email, passwordHash: hashSimple(input.password), name: input.name.trim(),
      phone: input.phone.trim(), address: "", joinedAt: now, lastLogin: now,
    };
    this.save([...list, customer]);
    this.startSession(email);
    return { ok: true, data: customer };
  },

  login(emailRaw: string, password: string): ServiceResult<Customer> {
    const email = emailRaw.trim().toLowerCase();
    const found = this.list().find((c) => c.email === email && c.passwordHash === hashSimple(password));
    if (!found) return { ok: false, error: "Incorrect email or password." };
    this.startSession(email);
    return { ok: true, data: found };
  },

  startSession(email: string): void {
    writeJSON(KEYS.customerSession, { email });
    loginHistoryService.record("customer", email, "login");
    this.save(this.list().map((c) => (c.email === email ? { ...c, lastLogin: new Date().toISOString() } : c)));
  },

  logout(): void {
    const s = this.session();
    if (s) loginHistoryService.record("customer", s.email, "logout");
    removeKey(KEYS.customerSession);
  },

  updateProfile(email: string, patch: { name: string; phone: string; address: string }): ServiceResult {
    if (patch.phone && !isBdPhone(patch.phone)) return { ok: false, error: "Enter a valid Bangladeshi phone number." };
    this.save(
      this.list().map((c) =>
        c.email === email ? { ...c, name: patch.name.trim() || c.name, phone: patch.phone.trim(), address: patch.address.trim() } : c,
      ),
    );
    return { ok: true };
  },
};
