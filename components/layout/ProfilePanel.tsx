"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useUI } from "@/components/providers/UIProvider";
import { useCurrentCustomer, useMyOrders } from "@/hooks/useServices";
import { customerApi } from "@/lib/api/customer";
import { money } from "@/lib/format";

export function ProfilePanel() {
  const { profileOpen, closeProfile, showToast } = useUI();
  const customer = useCurrentCustomer();
  const orders = useMyOrders();
  const [form, setForm] = useState({ name: "", phone: "", address: "" });
  const [error, setError] = useState("");

  useEffect(() => {
    if (customer && profileOpen) {
      setForm({ name: customer.name, phone: customer.phone, address: customer.address });
      setError("");
    }
  }, [customer, profileOpen]);

  const mine = orders.slice(0, 5);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (!customer) return;
    const res = await customerApi.updateProfile(form);
    if (!res.ok) { setError(res.error ?? ""); return; }
    setError("");
    showToast("Profile updated.");
  };

  const signOut = async () => {
    await customerApi.logout();
    closeProfile();
    showToast("Signed out.");
  };

  return (
    <div className={`profile-panel${profileOpen ? " is-open" : ""}`} aria-label="Your profile">
      <div className="profile-panel-header">
        <h2>Your profile</h2>
        <button className="icon-btn" type="button" aria-label="Close profile" onClick={closeProfile}>×</button>
      </div>
      <div className="profile-body">
        {!customer ? (
          <p style={{ color: "var(--muted)", padding: "1rem 0" }}>Not signed in.</p>
        ) : (
          <>
            <div className="profile-section">
              <h3>Personal details</h3>
              <form onSubmit={save}>
                <div className="profile-field"><label>Full name</label><input type="text" value={form.name} placeholder="Your name" onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                <div className="profile-field"><label>Phone</label><input type="tel" value={form.phone} placeholder="01XXXXXXXXX" onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
                <div className="profile-field"><label>Delivery address</label><textarea value={form.address} placeholder="House, road, area, landmark…" onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
                {error && <p className="auth-msg">{error}</p>}
                <button className="profile-save-btn" type="submit">Save changes</button>
              </form>
            </div>
            <div className="profile-section">
              <h3>Recent orders</h3>
              <div className="profile-orders">
                {mine.length ? mine.map((o) => (
                  <div className="profile-order-row" key={o.id}>
                    <strong>{o.id}</strong>
                    <span style={{ color: "var(--muted)", fontSize: ".78rem" }}>{o.items.length} item(s) · {money(o.grandTotal)}</span>
                  </div>
                )) : <p className="profile-empty">No orders yet.</p>}
              </div>
            </div>
            <button className="profile-logout" type="button" onClick={signOut}>Sign out</button>
          </>
        )}
      </div>
    </div>
  );
}
