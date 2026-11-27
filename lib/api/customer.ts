"use client";

import { call, mutate, refresh } from "./client";
import type { Order, PublicCustomer, ServiceResult } from "@/types";

export const ME = "/api/me";
export const MY_ORDERS = "/api/me/orders";

export const customerApi = {
  async login(email: string, password: string): Promise<ServiceResult<PublicCustomer>> {
    const res = await call<PublicCustomer>("POST", "/api/auth/login", { email, password });
    if (res.ok) { mutate(ME, res.data); void refresh(MY_ORDERS); }
    return res;
  },
  async register(input: { name: string; phone: string; email: string; password: string }): Promise<ServiceResult<PublicCustomer>> {
    const res = await call<PublicCustomer>("POST", "/api/auth/register", input);
    if (res.ok) { mutate(ME, res.data); void refresh(MY_ORDERS); }
    return res;
  },
  async logout(): Promise<void> {
    await call("POST", "/api/auth/logout");
    mutate(ME, null);
    mutate<Order[]>(MY_ORDERS, []);
  },
  async updateProfile(patch: { name: string; phone: string; address: string; city: string }): Promise<ServiceResult<PublicCustomer>> {
    const res = await call<PublicCustomer>("PATCH", ME, patch);
    if (res.ok) mutate(ME, res.data);
    return res;
  },
};
