import type { Metadata } from "next";
import { PageHero, RouteView } from "@/components/ui/PageHero";
import { AccountView } from "@/components/account/AccountView";

export const metadata: Metadata = { title: "My account — I Love Decants", robots: { index: false } };

export default function AccountPage() {
  return (
    <RouteView>
      <PageHero
        eyebrow="My account"
        title="Your orders, in one place."
        lead="Track every order from the moment it is received to the moment it arrives, and keep your delivery details up to date."
        noteTitle="Faster checkout."
        note="Your saved name, phone and address are filled in automatically when you order."
        orb="rgba(143,163,143,.3)"
      />
      <section className="section"><AccountView /></section>
    </RouteView>
  );
}
