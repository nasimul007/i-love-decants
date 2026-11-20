import { isBdPhone, isEmail, validatePassword } from "@/lib/validators";

export interface RegisterInput { name: string; phone: string; email: string; password: string }
export type FieldErrors = Partial<Record<"name" | "phone" | "email" | "password", string>>;

/** Instant client-side feedback only; the server validates again. */
export const customerService = {
  validateRegistration(input: RegisterInput): FieldErrors {
    const errors: FieldErrors = {};
    if (!input.name.trim()) errors.name = "Please enter your name.";
    if (!isBdPhone(input.phone.trim())) errors.phone = "Enter a valid Bangladeshi phone number.";
    if (!isEmail(input.email)) errors.email = "Enter a valid email address.";
    const pw = validatePassword(input.password);
    if (pw) errors.password = pw;
    return errors;
  },
};
