import { useCallback, useEffect, useRef, useState } from "react";
import "./admin.css";
import { isSupabaseConfigured } from "../lib/config";
import { supabase } from "./supabaseClient";
import { GROUPS, SECTIONS } from "./sections";
import { CollectionEditor, SingletonEditor } from "./editors";
import Inbox from "./Inbox";
import { Login, Notice, SetNewPassword } from "./Login";

const sectionFromHash = () => {
  const id = window.location.hash.replace(/^#\/?/, "");
  return id === "inbox" || SECTIONS.some((section) => section.id === id) ? id : "profile";
};

export default function AdminApp() {
  const [session, setSession] = useState(undefined);
  const [isAdmin, setIsAdmin] = useState(null);
  const [recovering, setRecovering] = useState(false);

  useEffect(() => {
    document.title = "Admin · LANZ.SYS";
    const robots = document.createElement("meta");
    robots.name = "robots";
    robots.content = "noindex, nofollow";
    document.head.append(robots);
    return () => robots.remove();
  }, []);

  useEffect(() => {
    if (!supabase) return undefined;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((event, next) => {
      if (event === "PASSWORD_RECOVERY") setRecovering(true);
      setSession(next);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) return;
    let active = true;
    supabase.rpc("is_admin").then(({ data, error }) => { if (active) setIsAdmin(!error && data === true); });
    return () => { active = false; };
  }, [session]);

  if (!isSupabaseConfigured) return <Notice title="Not connected yet"><p className="adm-muted">Add <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_PUBLISHABLE_KEY</code> to your environment settings, then reload.</p></Notice>;
  if (session === undefined) return <div className="adm-loading">Loading…</div>;
  if (recovering && session) return <SetNewPassword onDone={() => setRecovering(false)} />;
  if (!session) return <Login />;
  if (isAdmin === null) return <div className="adm-loading">Checking access…</div>;
  if (!isAdmin) return <Notice title="Access denied"><p className="adm-muted">This account doesn't have admin access.</p><button type="button" className="adm-btn adm-btn-block" onClick={() => supabase.auth.signOut()}>Sign out</button></Notice>;
  return <Dashboard email={session.user.email} />;
}

function Dashboard({ email }) {
  const [active, setActive] = useState(sectionFromHash);
  const [unread, setUnread] = useState(0);
  const [toast, setToast] = useState(null);
  const [navOpen, setNavOpen] = useState(false);
  const dirty = useRef(false);
  const toastTimer = useRef(null);

  const notify = useCallback((text, kind = "info") => {
    window.clearTimeout(toastTimer.current);
    setToast({ text, kind, id: Date.now() });
    toastTimer.current = window.setTimeout(() => setToast(null), kind === "error" ? 6000 : 3200);
  }, []);
  const setDirty = useCallback((value) => { dirty.current = value; }, []);
  const confirmLeave = useCallback(() => !dirty.current || window.confirm("You have unsaved changes. Leave without saving?"), []);

  const refreshUnread = useCallback(async () => {
    const { count } = await supabase.from("messages").select("id", { count: "exact", head: true }).is("read_at", null);
    setUnread(count || 0);
  }, []);
  useEffect(() => {
    // Initial count, then poll every minute and whenever the tab regains focus.
    const first = window.setTimeout(refreshUnread, 0);
    const interval = window.setInterval(refreshUnread, 60_000);
    window.addEventListener("focus", refreshUnread);
    return () => { window.clearTimeout(first); window.clearInterval(interval); window.removeEventListener("focus", refreshUnread); };
  }, [refreshUnread]);

  useEffect(() => {
    const warn = (event) => { if (dirty.current) { event.preventDefault(); event.returnValue = ""; } };
    const onHash = () => setActive(sectionFromHash());
    window.addEventListener("beforeunload", warn);
    window.addEventListener("hashchange", onHash);
    return () => { window.removeEventListener("beforeunload", warn); window.removeEventListener("hashchange", onHash); };
  }, []);

  const go = (id) => {
    setNavOpen(false);
    if (id === active || !confirmLeave()) return;
    dirty.current = false;
    window.location.hash = `/${id}`;
    setActive(id);
  };
  const signOut = async () => { if (confirmLeave()) await supabase.auth.signOut(); };

  const section = SECTIONS.find((item) => item.id === active);
  const title = active === "inbox" ? "Inbox" : section.label;
  const description = active === "inbox" ? "Messages sent through your portfolio's contact form." : section.description || "Changes appear on your portfolio as soon as you save.";

  return <div className="adm-shell">
    <header className="adm-topbar">
      <button type="button" className="adm-menu" onClick={() => setNavOpen(!navOpen)} aria-expanded={navOpen} aria-controls="adm-nav" aria-label="Toggle sections menu">☰</button>
      <span className="adm-brand"><span className="brand-mark" aria-hidden="true"><i /><i /><i /><i /></span><span className="brand-name">LANZ<b>.SYS</b></span><span className="adm-pill">Admin</span></span>
      <div className="adm-topbar-actions">
        <span className="adm-user" title={email}>{email}</span>
        <a className="adm-btn adm-btn-small" href="/" target="_blank" rel="noopener noreferrer">View site ↗</a>
        <button type="button" className="adm-btn adm-btn-small adm-btn-quiet" onClick={signOut}>Sign out</button>
      </div>
    </header>

    <nav id="adm-nav" className={`adm-nav ${navOpen ? "is-open" : ""}`} aria-label="Content sections">
      <button type="button" className={`adm-nav-item ${active === "inbox" ? "is-active" : ""}`} aria-current={active === "inbox" ? "page" : undefined} onClick={() => go("inbox")}>
        Inbox {unread > 0 && <span className="adm-count" aria-label={`${unread} unread`}>{unread}</span>}
      </button>
      {GROUPS.map((group) => <div key={group} className="adm-nav-group">
        <span className="adm-nav-heading">{group}</span>
        {SECTIONS.filter((item) => item.group === group).map((item) => <button key={item.id} type="button" className={`adm-nav-item ${active === item.id ? "is-active" : ""}`} aria-current={active === item.id ? "page" : undefined} onClick={() => go(item.id)}>{item.label}</button>)}
      </div>)}
    </nav>

    <main className="adm-main">
      <header className="adm-page-head">
        <h1>{title}</h1>
        <p className="adm-muted">{description}</p>
      </header>
      {active === "inbox"
        ? <Inbox notify={notify} onCountChange={refreshUnread} />
        : section.singleton
          ? <SingletonEditor key={section.id} section={section} notify={notify} onDirtyChange={setDirty} />
          : <CollectionEditor key={section.id} section={section} notify={notify} onDirtyChange={setDirty} confirmLeave={confirmLeave} />}
    </main>

    {toast && <div key={toast.id} className={`adm-toast is-${toast.kind}`} role={toast.kind === "error" ? "alert" : "status"}>{toast.text}</div>}
  </div>;
}
