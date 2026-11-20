import type { PaymentMethod } from "@/types";

/** Checkout payment options (labels/providers shown in the UI; the server re-validates them). */
export const PAYMENT_ROUTES: Record<
  PaymentMethod,
  { label: string; providerLabel: string; accountLabel: string; accountPlaceholder: string; providers: string[]; offline?: boolean }
> = {
  bank: { label: "Bank transfer", providerLabel: "Choose bank", accountLabel: "Your bank account / number", accountPlaceholder: "Account number used for transfer", providers: ["Bank A", "Bank B", "Bank C"] },
  wallet: { label: "Wallet payment", providerLabel: "Choose wallet", accountLabel: "Your wallet number", accountPlaceholder: "Wallet number used for transfer", providers: ["Wallet A", "Wallet B", "Wallet C"] },
  cod: { label: "Cash on delivery", providerLabel: "", accountLabel: "", accountPlaceholder: "", providers: ["Pay on arrival"], offline: true },
};
