import { useState } from "react";
import { supabase } from "./supabaseClient";

function Shell({ title, children }) {
  return <main className="adm-auth">
    <div className="adm-auth-card">
      <div className="adm-auth-brand"><span className="brand-mark" aria-hidden="true"><i /><i /><i /><i /></span><span className="brand-name">LANZ<b>.SYS</b></span><span className="adm-pill">Admin</span></div>
      <h1>{title}</h1>
      {children}
    </div>
    <a className="adm-auth-back" href="/">← Back to portfolio</a>
  </main>;
}

export function Login() {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) setMessage({ kind: "error", text: error.message === "Invalid login credentials" ? "Incorrect email or password." : error.message });
    } else {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/admin` });
      setMessage(error ? { kind: "error", text: error.message } : { kind: "success", text: "If that email belongs to the admin account, a reset link is on its way." });
    }
    setBusy(false);
  };

  return <Shell title={mode === "login" ? "Sign in" : "Reset password"}>
    <form className="adm-auth-form" onSubmit={submit}>
      <label className="adm-label" htmlFor="adm-email">Email</label>
      <input id="adm-email" type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} required autoFocus />
      {mode === "login" && <>
        <label className="adm-label" htmlFor="adm-password">Password</label>
        <input id="adm-password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
      </>}
      {message && <p className={message.kind === "error" ? "adm-field-error" : "adm-success"} role="alert">{message.text}</p>}
      <button type="submit" className="adm-btn adm-btn-primary adm-btn-block" disabled={busy}>{busy ? "Please wait…" : mode === "login" ? "Sign in" : "Send reset link"}</button>
      <button type="button" className="adm-link" onClick={() => { setMode(mode === "login" ? "reset" : "login"); setMessage(null); }}>{mode === "login" ? "Forgot password?" : "← Back to sign in"}</button>
    </form>
  </Shell>;
}

export function SetNewPassword({ onDone }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const submit = async (event) => {
    event.preventDefault();
    if (password.length < 10) { setError("Use at least 10 characters."); return; }
    if (password !== confirm) { setError("The passwords don't match."); return; }
    setBusy(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (updateError) setError(updateError.message);
    else onDone();
  };
  return <Shell title="Choose a new password">
    <form className="adm-auth-form" onSubmit={submit}>
      <label className="adm-label" htmlFor="adm-new">New password</label>
      <input id="adm-new" type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} required autoFocus />
      <label className="adm-label" htmlFor="adm-confirm">Confirm password</label>
      <input id="adm-confirm" type="password" autoComplete="new-password" value={confirm} onChange={(event) => setConfirm(event.target.value)} required />
      {error && <p className="adm-field-error" role="alert">{error}</p>}
      <button type="submit" className="adm-btn adm-btn-primary adm-btn-block" disabled={busy}>{busy ? "Saving…" : "Save password"}</button>
    </form>
  </Shell>;
}

export function Notice({ title, children }) {
  return <Shell title={title}><div className="adm-auth-form">{children}</div></Shell>;
}
