"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useAdminMe } from "@/hooks/useServices";
import { adminApi } from "@/lib/api/admin";
import { can } from "@/lib/services/admin";
import { Dashboard } from "./Dashboard";

function StoreLink() {
  return <p style={{ margin: "1rem 0 0", textAlign: "center", fontSize: ".84rem" }}><a href="/" style={{ color: "var(--rose-deep)" }}>← Back to the store</a></p>;
}

function BrandMark() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: ".75rem", marginBottom: ".5rem" }}>
      <span style={{ width: 42, height: 42, display: "grid", placeItems: "center", borderRadius: "50%", background: "linear-gradient(145deg,var(--rose-deep),#795060)", color: "#fff", fontFamily: "var(--serif)", fontSize: "1.2rem", flexShrink: 0 }}>i</span>
      <span style={{ fontFamily: "var(--serif)", fontSize: "1.15rem", fontWeight: 600 }}>I Love Decants</span>
    </div>
  );
}

function SetupWizard() {
  const [v, setV] = useState({ name: "", username: "", password: "", confirm: "" });
  const [msg, setMsg] = useState("");
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const res = await adminApi.setup(v);
    if (!res.ok) setMsg(res.error ?? "");
  };
  const f = (k: keyof typeof v) => ({ value: v[k], onChange: (e: { target: { value: string } }) => setV({ ...v, [k]: e.target.value }) });
  return (
    <div className="admin-login-page">
      <div className="admin-login-card">
        <BrandMark />
        <h1>Set up your admin account.</h1>
        <p>This is the first time admin is opened. Create your owner account — you can manage manager accounts afterwards.</p>
        <form className="admin-form" onSubmit={submit} noValidate>
          <div className="admin-field"><label htmlFor="setupOwnerName">Your name</label><input id="setupOwnerName" type="text" placeholder="Your full name" {...f("name")} /></div>
          <div className="admin-field"><label htmlFor="setupOwnerUser">Admin username</label><input id="setupOwnerUser" type="text" autoComplete="username" placeholder="Choose a username" {...f("username")} /></div>
          <div className="admin-field"><label htmlFor="setupOwnerPass">Password</label><input id="setupOwnerPass" type="password" autoComplete="new-password" placeholder="Choose a strong password" {...f("password")} /></div>
          <div className="admin-field"><label htmlFor="setupOwnerPass2">Confirm password</label><input id="setupOwnerPass2" type="password" autoComplete="new-password" placeholder="Repeat password" {...f("confirm")} /></div>
          <p className="admin-form-msg" aria-live="polite">{msg}</p>
          <button className="btn btn-primary" type="submit" style={{ width: "100%", borderRadius: ".9rem" }}>Create owner account</button>
        </form>
        <p className="admin-setup-hint"><b>🔐</b> Use at least 8 characters. Passwords are hashed on the server.</p>
      </div>
    </div>
  );
}

function LoginPanel() {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [msg, setMsg] = useState("");
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const res = await adminApi.login(user, pass);
    if (!res.ok) setMsg(res.error ?? "");
  };
  return (
    <div className="admin-login-page">
      <div className="admin-login-card">
        <BrandMark />
        <h1>Admin sign in.</h1>
        <p>Enter your credentials to access the admin dashboard.</p>
        <form className="admin-form" onSubmit={submit} noValidate>
          <div className="admin-field"><label htmlFor="adminLoginUser">Username</label><input id="adminLoginUser" type="text" autoComplete="username" placeholder="Username" value={user} onChange={(e) => setUser(e.target.value)} /></div>
          <div className="admin-field"><label htmlFor="adminLoginPass">Password</label><input id="adminLoginPass" type="password" autoComplete="current-password" placeholder="Password" value={pass} onChange={(e) => setPass(e.target.value)} /></div>
          <p className="admin-form-msg" aria-live="polite">{msg}</p>
          <button className="btn btn-primary" type="submit" style={{ width: "100%", borderRadius: ".9rem" }}>Open dashboard</button>
        </form>
        <StoreLink />
      </div>
    </div>
  );
}

export function AdminApp() {
  const { session, needsSetup, loaded } = useAdminMe();

  if (!loaded) return <div className="container" style={{ padding: "6rem 0", textAlign: "center", color: "var(--muted)" }}>Loading…</div>;
  if (needsSetup) return <SetupWizard />;
  if (!session) return <LoginPanel />;
  // Permissions come from the server with the session; the server also enforces them on every request.
  return <Dashboard session={session} canSee={(s) => can(session, s)} />;
}
