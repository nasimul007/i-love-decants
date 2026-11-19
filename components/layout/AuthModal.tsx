"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useUI } from "@/components/providers/UIProvider";
import { customerService } from "@/lib/services/customers";
import { customerApi } from "@/lib/api/customer";
import type { FieldErrors } from "@/lib/services/customers";
import { passwordStrength } from "@/lib/validators";
import { DoodleCanvas } from "./DoodleCanvas";

export function AuthModal() {
  const { authPanel, setAuthPanel, closeAuth, showToast } = useUI();
  const open = authPanel !== null;
  const panel = authPanel ?? "login";

  const [login, setLogin] = useState({ email: "", password: "" });
  const [loginMsg, setLoginMsg] = useState("");
  const [reg, setReg] = useState({ name: "", phone: "", email: "", password: "" });
  const [regErr, setRegErr] = useState<FieldErrors>({});
  const [regMsg, setRegMsg] = useState("");

  useEffect(() => {
    if (!open) { setLoginMsg(""); setRegErr({}); setRegMsg(""); }
  }, [open]);

  const strength = passwordStrength(reg.password);

  const submitLogin = async (e: FormEvent) => {
    e.preventDefault();
    const res = await customerApi.login(login.email, login.password);
    if (!res.ok || !res.data) { setLoginMsg(res.error ?? "Could not sign in."); return; }
    setLogin({ email: "", password: "" });
    closeAuth();
    showToast(`Welcome back, ${res.data.name.split(" ")[0]}!`);
  };

  const submitRegister = async (e: FormEvent) => {
    e.preventDefault();
    const errors = customerService.validateRegistration(reg);
    setRegErr(errors);
    if (Object.keys(errors).length) return;
    const res = await customerApi.register(reg);
    if (!res.ok) { setRegMsg(res.error ?? "Could not create account."); return; }
    closeAuth();
    showToast(`Account created! Welcome, ${reg.name.trim().split(" ")[0]}.`);
    setReg({ name: "", phone: "", email: "", password: "" });
  };

  return (
    <div className={`auth-overlay${open ? " is-open" : ""}`} role="dialog" aria-modal="true" aria-labelledby="authTitle" onClick={(e) => { if (e.target === e.currentTarget) closeAuth(); }}>
      <div className="auth-box">
        <DoodleCanvas active={open} />
        <button className="auth-close" type="button" aria-label="Close" onClick={closeAuth}>&times;</button>
        <div className="auth-content">
          <div className="auth-tabs" role="tablist">
            <button className={`auth-tab${panel === "login" ? " is-active" : ""}`} type="button" role="tab" aria-selected={panel === "login"} onClick={() => setAuthPanel("login")}>Sign in</button>
            <button className={`auth-tab${panel === "register" ? " is-active" : ""}`} type="button" role="tab" aria-selected={panel === "register"} onClick={() => setAuthPanel("register")}>Create account</button>
          </div>

          {panel === "login" ? (
            <div>
              <h2 id="authTitle">Welcome back.</h2>
              <p className="auth-sub">Sign in to your I Love Decants account.</p>
              <form className="auth-form" onSubmit={submitLogin} noValidate>
                <div className="auth-field"><label>Email<input type="email" autoComplete="email" placeholder="you@example.com" value={login.email} onChange={(e) => setLogin({ ...login, email: e.target.value })} /></label></div>
                <div className="auth-field"><label>Password<input type="password" autoComplete="current-password" placeholder="Your password" value={login.password} onChange={(e) => setLogin({ ...login, password: e.target.value })} /></label></div>
                <p className="auth-msg" aria-live="polite">{loginMsg}</p>
                <button className="auth-submit" type="submit">Sign in</button>
              </form>
              <p className="auth-switch">Don&apos;t have an account? <a role="button" tabIndex={0} onClick={() => setAuthPanel("register")}>Create one</a></p>
            </div>
          ) : (
            <div>
              <h2 id="authTitle">Join I Love Decants.</h2>
              <p className="auth-sub">Create your account to save your info for faster checkout.</p>
              <form className="auth-form" onSubmit={submitRegister} noValidate>
                <div className="auth-row">
                  <div className="auth-field"><label>Full name<input type="text" autoComplete="name" placeholder="Your name" value={reg.name} onChange={(e) => setReg({ ...reg, name: e.target.value })} /></label><span className="field-err">{regErr.name}</span></div>
                  <div className="auth-field"><label>Phone<input type="tel" inputMode="tel" placeholder="01XXXXXXXXX" value={reg.phone} onChange={(e) => setReg({ ...reg, phone: e.target.value })} /></label><span className="field-err">{regErr.phone}</span></div>
                </div>
                <div className="auth-field"><label>Email<input type="email" autoComplete="email" placeholder="you@example.com" value={reg.email} onChange={(e) => setReg({ ...reg, email: e.target.value })} /></label><span className="field-err">{regErr.email}</span></div>
                <div className="auth-field">
                  <label>Password<input type="password" autoComplete="new-password" placeholder="At least 8 characters, letters + numbers" value={reg.password} onChange={(e) => setReg({ ...reg, password: e.target.value })} /></label>
                  {reg.password && <small style={{ color: strength.score >= 3 ? "#446046" : "var(--muted)" }}>Strength: {strength.label}</small>}
                  <span className="field-err">{regErr.password}</span>
                </div>
                <p className="auth-msg" aria-live="polite">{regMsg}</p>
                <button className="auth-submit" type="submit">Create account</button>
              </form>
              <p className="auth-switch">Already have an account? <a role="button" tabIndex={0} onClick={() => setAuthPanel("login")}>Sign in</a></p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
