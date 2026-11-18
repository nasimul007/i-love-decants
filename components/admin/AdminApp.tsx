"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import type { FormEvent } from "react";
import { useAdminConfig, useAdminSession } from "@/hooks/useServices";
import { adminService, can } from "@/lib/services/admin";
import { Dashboard } from "./Dashboard";

const useHydrated = () => useSyncExternalStore(() => () => {}, () => true, () => false);

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
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const res = adminService.setupOwner(v);
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
        <p className="admin-setup-hint"><b>🔐</b> Credentials are stored locally in your browser. This is a frontend demo.</p>
      </div>
    </div>
  );
}

function LoginPanel() {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [msg, setMsg] = useState("");
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const res = adminService.login(user, pass);
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
      </div>
    </div>
  );
}

export function AdminApp() {
  const hydrated = useHydrated();
  const config = useAdminConfig();
  const session = useAdminSession();

  // Re-validate the stored session against the config (e.g. manager removed or perms changed).
  useEffect(() => {
    if (!session || !config) return;
    if (session.role === "manager") {
      const m = config.managers.find((x) => x.username === session.username);
      if (!m) adminService.logout();
    }
  }, [session, config]);

  if (!hydrated) return <div className="container" style={{ padding: "6rem 0", textAlign: "center", color: "var(--muted)" }}>Loading…</div>;
  if (!config?.setup) return <SetupWizard />;
  if (!session) return <LoginPanel />;

  // Use the freshest permissions from config for managers.
  const live = session.role === "manager"
    ? { ...session, permissions: config.managers.find((m) => m.username === session.username)?.permissions ?? session.permissions }
    : session;
  return <Dashboard session={live} canSee={(s) => can(live, s)} />;
}
