import { useEffect, useRef, useState } from "react";
import { Arrow } from "./ui";
import { SUPABASE_KEY, SUPABASE_URL, TURNSTILE_SITE_KEY, isSupabaseConfigured } from "../lib/config";

const TURNSTILE_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
const canSubmitOnline = isSupabaseConfigured && Boolean(TURNSTILE_SITE_KEY);

let turnstileScript = null;
function loadTurnstile() {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  turnstileScript ??= new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = TURNSTILE_SRC;
    script.async = true;
    script.onload = () => resolve(window.turnstile);
    script.onerror = () => { turnstileScript = null; reject(new Error("Turnstile failed to load")); };
    document.head.append(script);
  });
  return turnstileScript;
}

// Sends messages to the admin inbox through the `contact` Edge Function.
// If the backend is not configured, it falls back to opening the visitor's email app.
export default function ContactForm({ email }) {
  const formRef = useRef(null);
  const widgetRef = useRef(null);
  const widgetId = useRef(null);
  const startedAt = useRef(0);
  const [token, setToken] = useState("");
  const [state, setState] = useState({ kind: "idle", text: "" });

  useEffect(() => {
    startedAt.current = Date.now();
    if (!canSubmitOnline) return undefined;
    let cancelled = false;
    loadTurnstile().then((turnstile) => {
      if (cancelled || !widgetRef.current) return;
      widgetId.current = turnstile.render(widgetRef.current, {
        sitekey: TURNSTILE_SITE_KEY,
        theme: "dark",
        appearance: "interaction-only",
        callback: setToken,
        "expired-callback": () => setToken(""),
        "error-callback": () => setToken(""),
      });
    }).catch(() => setState({ kind: "error", text: "Spam protection could not load. Please email me directly." }));
    return () => {
      cancelled = true;
      if (widgetId.current != null) window.turnstile?.remove(widgetId.current);
    };
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    if (!canSubmitOnline) {
      const body = `Name: ${data.name}\nEmail: ${data.email}\n\n${data.message}`;
      setState({ kind: "info", text: "Opening your email app with this draft…" });
      window.location.href = `mailto:${email}?subject=${encodeURIComponent("Portfolio inquiry")}&body=${encodeURIComponent(body)}`;
      return;
    }
    if (!token) { setState({ kind: "error", text: "Please wait a moment for the security check to finish, then try again." }); return; }
    setState({ kind: "sending", text: "Sending…" });
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: SUPABASE_KEY },
        body: JSON.stringify({ ...data, startedAt: startedAt.current, turnstileToken: token }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.ok) throw new Error(result.error || "Could not send right now. Please try again later.");
      formRef.current?.reset();
      setState({ kind: "success", text: "Message sent! Thank you — I'll get back to you soon." });
    } catch (error) {
      setState({ kind: "error", text: error.message });
    } finally {
      setToken("");
      if (widgetId.current != null) window.turnstile?.reset(widgetId.current);
    }
  };

  const sending = state.kind === "sending";
  return <form ref={formRef} className="contact-form" onSubmit={submit}>
    <div className="contact-form-bar"><span className="terminal-dots" aria-hidden="true"><i /><i /><i /></span><span>new_message.txt</span></div>
    <label>Name<input name="name" autoComplete="name" placeholder="Your name" maxLength={120} required /></label>
    <label>Email<input name="email" type="email" autoComplete="email" placeholder="you@example.com" maxLength={254} required /></label>
    <label>Message<textarea name="message" rows="5" placeholder="Tell me about your project…" minLength={10} maxLength={5000} required /></label>
    {/* Honeypot: hidden from people and assistive tech; bots tend to fill it. */}
    <label className="form-trap" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
    {canSubmitOnline && <div ref={widgetRef} className="turnstile-slot" />}
    <button className="button button-primary button-large" type="submit" disabled={sending}>{sending ? "Sending…" : <>Send message <Arrow /></>}</button>
    <p className={`form-status is-${state.kind}`} role="status" aria-live="polite">
      {state.text || (canSubmitOnline ? `Prefer email? Write to ${email}.` : "This opens your email app with the message ready to send.")}
    </p>
  </form>;
}
