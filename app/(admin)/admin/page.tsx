import type { Metadata } from "next";
import { RouteView } from "@/components/ui/PageHero";
import { AdminApp } from "@/components/admin/AdminApp";

export const metadata: Metadata = { title: "Admin — I Love Decants", robots: { index: false, follow: false } };

export default function AdminPage() {
  return (
    <RouteView id="route-admin">
      <div className="container" style={{ padding: "3rem 0 4rem" }}>
        <AdminApp />
      </div>
    </RouteView>
  );
}
