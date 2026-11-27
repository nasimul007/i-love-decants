import type { Metadata } from "next";
import { AdminApp } from "@/components/admin/AdminApp";

export const metadata: Metadata = { title: "Admin — I Love Decants", robots: { index: false, follow: false } };

export default function AdminPage() {
  return (
    <div className="container" lang="en" style={{ padding: "1.5rem 0 4rem" }}>{/* the admin stays English (and light) for staff */}
      <AdminApp />
    </div>
  );
}
