import { useCallback, useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

const formatDate = (value) => new Date(value).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });

export default function Inbox({ notify, onCountChange }) {
  const [messages, setMessages] = useState(null);
  const [openId, setOpenId] = useState(null);
  const [filter, setFilter] = useState("all");

  const load = useCallback(() => supabase.from("messages").select("id, name, email, message, read_at, created_at").order("created_at", { ascending: false }).limit(500).then(({ data, error }) => {
    if (error) { notify(error.message, "error"); setMessages([]); return; }
    setMessages(data);
    onCountChange();
  }), [notify, onCountChange]);
  useEffect(() => { load(); }, [load]);

  const setRead = async (message, read) => {
    const read_at = read ? new Date().toISOString() : null;
    setMessages((current) => current.map((item) => (item.id === message.id ? { ...item, read_at } : item)));
    const { error } = await supabase.from("messages").update({ read_at }).eq("id", message.id);
    if (error) { notify(error.message, "error"); load(); return; }
    onCountChange();
  };

  const open = (message) => {
    setOpenId(message.id);
    if (!message.read_at) setRead(message, true);
  };

  const remove = async (message) => {
    if (!window.confirm(`Delete the message from ${message.name}? This can't be undone.`)) return;
    const { error } = await supabase.from("messages").delete().eq("id", message.id);
    if (error) { notify(error.message, "error"); return; }
    setMessages((current) => current.filter((item) => item.id !== message.id));
    setOpenId(null);
    onCountChange();
    notify("Message deleted.", "success");
  };

  if (messages === null) return <p className="adm-muted">Loading…</p>;
  const visible = filter === "unread" ? messages.filter((message) => !message.read_at) : messages;
  const current = messages.find((message) => message.id === openId);
  const unread = messages.filter((message) => !message.read_at).length;

  return <div className={`adm-inbox ${current ? "has-open" : ""}`}>
    <div className="adm-inbox-list">
      <div className="adm-toolbar">
        <div className="adm-segmented" role="group" aria-label="Filter messages">
          <button type="button" className={filter === "all" ? "is-active" : ""} aria-pressed={filter === "all"} onClick={() => setFilter("all")}>All ({messages.length})</button>
          <button type="button" className={filter === "unread" ? "is-active" : ""} aria-pressed={filter === "unread"} onClick={() => setFilter("unread")}>Unread ({unread})</button>
        </div>
        <button type="button" className="adm-btn adm-btn-small" onClick={load}>Refresh</button>
      </div>
      {visible.length ? <ul className="adm-messages">
        {visible.map((message) => <li key={message.id}>
          <button type="button" className={`adm-message-row ${message.read_at ? "" : "is-unread"} ${message.id === openId ? "is-open" : ""}`} onClick={() => open(message)}>
            <span className="adm-message-top"><strong>{message.name}</strong><time dateTime={message.created_at}>{formatDate(message.created_at)}</time></span>
            <span className="adm-message-preview">{message.message}</span>
          </button>
        </li>)}
      </ul> : <div className="adm-empty"><p>{filter === "unread" ? "No unread messages." : "No messages yet. Messages from your contact form will appear here."}</p></div>}
    </div>
    <div className="adm-inbox-detail" aria-live="polite">
      {current ? <article className="adm-message">
        <button type="button" className="adm-btn adm-btn-quiet adm-btn-small adm-inbox-back" onClick={() => setOpenId(null)}>← All messages</button>
        <header>
          <h2>{current.name}</h2>
          <p><a href={`mailto:${current.email}`}>{current.email}</a> · <time dateTime={current.created_at}>{formatDate(current.created_at)}</time></p>
        </header>
        <p className="adm-message-body">{current.message}</p>
        <div className="adm-row">
          <a className="adm-btn adm-btn-primary" href={`mailto:${current.email}?subject=${encodeURIComponent("Re: your message on my portfolio")}`}>Reply by email</a>
          <button type="button" className="adm-btn" onClick={() => setRead(current, !current.read_at)}>{current.read_at ? "Mark as unread" : "Mark as read"}</button>
          <button type="button" className="adm-btn adm-btn-danger" onClick={() => remove(current)}>Delete</button>
        </div>
      </article> : <p className="adm-muted adm-inbox-placeholder">Select a message to read it.</p>}
    </div>
  </div>;
}
