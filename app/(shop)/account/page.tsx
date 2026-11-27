import type { Metadata } from "next";
import { PageHero, RouteView } from "@/components/ui/PageHero";
import { AccountView } from "@/components/account/AccountView";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("My account — I Love Decants"), robots: { index: false } };
}

export default async function AccountPage() {
  const t = await getT();
  return (
    <RouteView>
      <PageHero
        eyebrow={t("My account")}
        title={t("Your orders, in one place.")}
        lead={t("Track every order from the moment it is received to the moment it arrives, and keep your delivery details up to date.")}
        noteTitle={t("Faster checkout.")}
        note={t("Your saved name, phone and address are filled in automatically when you order.")}
        orb="rgba(143,163,143,.3)"
      />
      <section className="section"><AccountView /></section>
    </RouteView>
  );
}
