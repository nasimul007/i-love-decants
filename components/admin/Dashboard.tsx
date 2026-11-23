"use client";

import { useEffect, useState } from "react";
import type { AdminSection, AdminSession } from "@/types";
import { ADMIN_SECTIONS } from "@/lib/services/admin";
import { adminApi } from "@/lib/api/admin";
import {
  CouponsPanel, CustomersPanel, HistoryPanel, InventoryPanel, ManagersPanel, OverviewPanel, PricingPanel,
} from "./Panels";
import { OrdersPanel } from "./OrdersPanel";
import { ContentPanel } from "./ContentPanel";
import { ProductDetailsPanel } from "./ProductDetailsPanel";

type TabId = "overview" | "orders" | AdminSection | "managers";

interface Props {
  session: AdminSession;
  canSee: (section: AdminSection) => boolean;
}

export function Dashboard({ session, canSee }: Props) {
  const tabs: { id: TabId; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "orders", label: "Orders" },
    ...ADMIN_SECTIONS.filter((s) => canSee(s.id)).map((s) => ({ id: s.id as TabId, label: s.label })),
    ...(session.role === "owner" ? [{ id: "managers" as TabId, label: "Managers" }] : []),
  ];
  const [tab, setTab] = useState<TabId>("overview");

  // If permissions are revoked while open, fall back to a tab that still exists.
  useEffect(() => {
    if (!tabs.some((t) => t.id === tab)) setTab("overview");
  }, [tabs, tab]);

  return (
    <div className="admin-dashboard is-active">
      <div className="admin-sticky">
      <div className="admin-topbar">
        <div className="admin-topbar-brand">
          <span style={{ width: 40, height: 40, display: "grid", placeItems: "center", borderRadius: "50%", background: "linear-gradient(145deg,var(--rose-deep),#795060)", color: "#fff", fontFamily: "var(--serif)", fontSize: "1.1rem", flexShrink: 0 }}>i</span>
          <div><strong>I Love Decants</strong><br /><small>Admin Dashboard</small></div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: ".65rem" }}>
          <a className="admin-signout" href="/" target="_blank" rel="noreferrer" style={{ textDecoration: "none" }}>View store ↗</a>
          <span className={`admin-role-badge ${session.role}`}>{session.role === "owner" ? "Owner" : "Manager"}</span>
          <span style={{ fontSize: ".83rem", color: "var(--muted)" }}>{session.name || session.username}</span>
          <button className="admin-signout" type="button" onClick={() => void adminApi.logout()}>Sign out</button>
        </div>
      </div>

      <div className="admin-tabs" role="tablist">
        {tabs.map((t) => (
          <button key={t.id} className={`admin-tab-btn${tab === t.id ? " is-active" : ""}`} type="button" role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)}>{t.label}</button>
        ))}
      </div>
      </div>

      <div className="admin-tab-panel is-active">
        {tab === "overview" && <OverviewPanel />}
        {tab === "orders" && <OrdersPanel />}
        {tab === "content" && canSee("content") && <ContentPanel />}
        {tab === "inventory" && canSee("inventory") && <InventoryPanel />}
        {tab === "products" && canSee("products") && <><PricingPanel /><div style={{ height: "1.25rem" }} /><ProductDetailsPanel /></>}
        {tab === "customers" && canSee("customers") && <CustomersPanel />}
        {tab === "history" && canSee("history") && <HistoryPanel />}
        {tab === "coupons" && canSee("coupons") && <CouponsPanel />}
        {tab === "managers" && session.role === "owner" && <ManagersPanel />}
      </div>
    </div>
  );
}
