import { z } from "zod";
import { db } from "@/lib/db";
import { audit, hashPassword, publicCustomer, startCustomerSession } from "@/lib/server/auth";
import { body, clientIp, HttpError, ok, rateLimit, route } from "@/lib/server/http";
import { isBdPhone, isPersonName, NAME_ERROR, validatePassword } from "@/lib/validators";

const schema = z.object({
  name: z.string().trim().min(1, "Please enter your name.").max(100).refine(isPersonName, NAME_ERROR),
  phone: z.string().trim().refine(isBdPhone, "Enter a valid Bangladeshi phone number."),
  email: z.string().trim().toLowerCase().email("Enter a valid email address.").max(200),
  password: z.string().max(200).superRefine((pw, ctx) => {
    const e = validatePassword(pw);
    if (e) ctx.addIssue({ code: "custom", message: e });
  }),
});

export const POST = route(async (req) => {
  rateLimit(`register:${clientIp(req)}`, 10);
  const input = await body(req, schema);
  if (await db.customer.findUnique({ where: { email: input.email } })) {
    throw new HttpError(409, "This email is already registered.");
  }
  const customer = await db.customer.create({
    data: { name: input.name, phone: input.phone, email: input.email, passwordHash: await hashPassword(input.password) },
  });
  await startCustomerSession(customer.id);
  await audit("customer", customer.email, "login");
  return ok(publicCustomer(customer), 201);
});
