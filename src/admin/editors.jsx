import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Field } from "./fields";
import { collectMediaUrls, removeMedia, supabase, uploadMedia } from "./supabaseClient";

const TEXT_TYPES = new Set(["text", "textarea", "email", "url", "category", "select", "date", "image", "file", "video"]);

function emptyValues(fields) {
  return Object.fromEntries(fields.map((field) => [field.name,
    field.defaultValue ?? (field.type === "tags" || field.type === "gallery" ? [] : field.type === "toggle" ? false : "")]));
}

function toFormValues(fields, row) {
  const base = emptyValues(fields);
  if (!row) return base;
  return Object.fromEntries(fields.map((field) => [field.name, row[field.name] ?? base[field.name]]));
}

// Form values → clean database payload (trimmed text, empty → null).
function toPayload(fields, values) {
  const payload = {};
  for (const field of fields) {
    let value = values[field.name];
    if (TEXT_TYPES.has(field.type)) {
      value = typeof value === "string" ? value.trim() : value;
      if (field.normalize) value = field.normalize(value, values);
      value = value === "" || value == null ? null : value;
    } else if (field.type === "tags") {
      value = (Array.isArray(value) ? value : []).map((item) => String(item).trim()).filter(Boolean);
    } else if (field.type === "gallery") {
      value = (Array.isArray(value) ? value : []).filter((item) => item?.src).map((item) => ({ type: item.type || "image", src: item.src.trim(), alt: (item.alt || "").trim(), caption: (item.caption || "").trim() }));
    } else if (field.type === "toggle") {
      value = Boolean(value);
    }
    payload[field.name] = value;
  }
  return payload;
}

function validate(fields, payload) {
  const errors = {};
  for (const field of fields) {
    const value = payload[field.name];
    if (field.required && (value == null || (Array.isArray(value) && !value.length))) errors[field.name] = `${field.label} is required.`;
    else if (field.validate) { const message = field.validate(value, payload); if (message) errors[field.name] = message; }
  }
  return errors;
}

// Shared form state for both editor kinds, including upload bookkeeping so
// files uploaded and then discarded never linger in storage.
function useEntityForm(section, row, onDirtyChange) {
  const original = useMemo(() => toFormValues(section.fields, row), [section.fields, row]);
  const [values, setValues] = useState(original);
  const [errors, setErrors] = useState({});
  const sessionUploads = useRef(new Set());

  const dirty = useMemo(() => JSON.stringify(toPayload(section.fields, values)) !== JSON.stringify(toPayload(section.fields, original)), [section.fields, values, original]);
  useEffect(() => { onDirtyChange?.(dirty); }, [dirty, onDirtyChange]);
  useEffect(() => () => onDirtyChange?.(false), [onDirtyChange]);

  const setField = (name) => (next) => {
    setValues((current) => ({ ...current, [name]: typeof next === "function" ? next(current[name]) : next }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  };
  const upload = (folder) => async (file) => {
    const url = await uploadMedia(file, folder);
    sessionUploads.current.add(url);
    return url;
  };
  const prepare = () => {
    const payload = toPayload(section.fields, values);
    const found = validate(section.fields, payload);
    setErrors(found);
    return Object.keys(found).length ? null : payload;
  };
  // After saving: delete files that were replaced/removed, and unused uploads.
  const cleanupAfterSave = async (payload) => {
    const kept = collectMediaUrls(payload);
    const stale = [...collectMediaUrls(row || {}), ...sessionUploads.current].filter((url) => !kept.has(url));
    sessionUploads.current.clear();
    await removeMedia(new Set(stale));
  };
  const discardUploads = async () => {
    const kept = collectMediaUrls(row || {});
    const unused = [...sessionUploads.current].filter((url) => !kept.has(url));
    sessionUploads.current.clear();
    await removeMedia(new Set(unused));
  };
  return { values, errors, dirty, setField, upload, prepare, cleanupAfterSave, discardUploads, reset: () => setValues(original) };
}

function EntityForm({ section, form, suggestions }) {
  return <div className="adm-form-grid">
    {section.fields.map((field) => <Field key={field.name} field={field} value={form.values[field.name]} form={form.values}
      onChange={form.setField(field.name)} error={form.errors[field.name]} suggestions={suggestions[field.name]}
      upload={form.upload(field.folder || section.table)} />)}
  </div>;
}

const friendly = (error) => (error?.message?.includes("row-level security") ? "Permission denied — this account is not an admin." : error?.message || "Something went wrong.");

/* ── Single-record sections (Profile, Resume) ──────────────────────────── */
export function SingletonEditor({ section, notify, onDirtyChange }) {
  const [row, setRow] = useState(undefined);
  const [loadError, setLoadError] = useState("");
  useEffect(() => {
    let active = true;
    supabase.from(section.table).select("*").eq("id", 1).maybeSingle().then(({ data, error }) => {
      if (!active) return;
      if (error) setLoadError(friendly(error));
      else setRow(data || null);
    });
    return () => { active = false; };
  }, [section.table]);
  if (loadError) return <p className="adm-alert">{loadError}</p>;
  if (row === undefined) return <p className="adm-muted">Loading…</p>;
  return <SingletonForm key={row?.updated_at || "new"} section={section} row={row} notify={notify} onSaved={setRow} onDirtyChange={onDirtyChange} />;
}

function SingletonForm({ section, row, notify, onSaved, onDirtyChange }) {
  const form = useEntityForm(section, row, onDirtyChange);
  const [saving, setSaving] = useState(false);
  const save = async (event) => {
    event.preventDefault();
    const payload = form.prepare();
    if (!payload) { notify("Please fix the highlighted fields.", "error"); return; }
    setSaving(true);
    const { data, error } = await supabase.from(section.table).upsert({ id: 1, ...payload }).select().single();
    setSaving(false);
    if (error) { notify(friendly(error), "error"); return; }
    await form.cleanupAfterSave(payload);
    notify("Saved — now live on your portfolio.", "success");
    onSaved(data);
  };
  return <form className="adm-editor" onSubmit={save} noValidate>
    <EntityForm section={section} form={form} suggestions={{}} />
    <div className="adm-savebar">
      <span className="adm-muted">{form.dirty ? "Unsaved changes" : "All changes saved"}</span>
      <div className="adm-row">
        <button type="button" className="adm-btn adm-btn-quiet" disabled={!form.dirty || saving} onClick={() => { form.discardUploads(); form.reset(); }}>Discard</button>
        <button type="submit" className="adm-btn adm-btn-primary" disabled={!form.dirty || saving}>{saving ? "Saving…" : "Save changes"}</button>
      </div>
    </div>
  </form>;
}

/* ── List sections (Projects, Skills, …) ───────────────────────────────── */
export function CollectionEditor({ section, notify, onDirtyChange, confirmLeave }) {
  const [rows, setRows] = useState(null);
  const [editing, setEditing] = useState(null); // null = list, "new" = create, row = edit
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(() => supabase.from(section.table).select("*").order("sort_order").order("created_at").then(({ data, error }) => {
    if (error) { notify(friendly(error), "error"); setRows([]); return; }
    setRows(data);
  }), [section.table, notify]);
  useEffect(() => { load(); }, [load]);

  const suggestions = useMemo(() => {
    const result = {};
    section.fields.filter((field) => field.type === "category").forEach((field) => {
      result[field.name] = [...new Set((rows || []).map((row) => row[field.name]).filter(Boolean))].sort();
    });
    return result;
  }, [rows, section.fields]);

  // Renumber after a move so the stored order always matches what you see.
  const move = async (index, delta) => {
    const next = [...rows];
    const [item] = next.splice(index, 1);
    next.splice(index + delta, 0, item);
    setRows(next.map((row, i) => ({ ...row, sort_order: i })));
    const changed = next.map((row, i) => ({ row, i })).filter(({ row, i }) => row.sort_order !== i);
    const results = await Promise.all(changed.map(({ row, i }) => supabase.from(section.table).update({ sort_order: i }).eq("id", row.id)));
    const failed = results.find((result) => result.error);
    if (failed) { notify(friendly(failed.error), "error"); load(); }
  };

  const toggleFeatured = async (row) => {
    setBusyId(row.id);
    const { error } = await supabase.from(section.table).update({ featured: !row.featured }).eq("id", row.id);
    setBusyId(null);
    if (error) { notify(friendly(error), "error"); return; }
    setRows((current) => current.map((item) => (item.id === row.id ? { ...item, featured: !row.featured } : item)));
    notify(row.featured ? "Removed from featured." : "Marked as featured.", "success");
  };

  const remove = async (row) => {
    const title = row[section.titleField] || "this item";
    if (!window.confirm(`Delete “${title}”? This can't be undone.`)) return;
    setBusyId(row.id);
    const { error } = await supabase.from(section.table).delete().eq("id", row.id);
    setBusyId(null);
    if (error) { notify(friendly(error), "error"); return; }
    await removeMedia(collectMediaUrls(row));
    setRows((current) => current.filter((item) => item.id !== row.id));
    setEditing(null);
    notify(`Deleted “${title}”.`, "success");
  };

  if (rows === null) return <p className="adm-muted">Loading…</p>;

  if (editing) {
    return <ItemForm key={editing === "new" ? "new" : editing.id} section={section} row={editing === "new" ? null : editing} suggestions={suggestions}
      nextOrder={rows.length ? Math.max(...rows.map((row) => row.sort_order)) + 1 : 0} notify={notify} onDirtyChange={onDirtyChange}
      onClose={(saved) => { if (saved || confirmLeave()) { setEditing(null); if (saved) load(); } }}
      onDelete={editing === "new" ? null : () => remove(editing)} />;
  }

  return <div className="adm-collection">
    <div className="adm-toolbar">
      <span className="adm-muted">{rows.length} {rows.length === 1 ? "item" : "items"} · shown on the site in this order</span>
      <button type="button" className="adm-btn adm-btn-primary" onClick={() => setEditing("new")}>+ Add {section.label.replace(/s$/, "").toLowerCase()}</button>
    </div>
    {rows.length ? <ol className="adm-list">
      {rows.map((row, index) => <li key={row.id} className={`adm-list-item ${busyId === row.id ? "is-busy" : ""}`}>
        <div className="adm-order">
          <button type="button" className="adm-icon-btn" disabled={index === 0} onClick={() => move(index, -1)} aria-label={`Move ${row[section.titleField]} up`}>↑</button>
          <button type="button" className="adm-icon-btn" disabled={index === rows.length - 1} onClick={() => move(index, 1)} aria-label={`Move ${row[section.titleField]} down`}>↓</button>
        </div>
        {section.thumbField && <div className="adm-thumb">{row[section.thumbField] ? <img src={row[section.thumbField]} alt="" /> : <span aria-hidden="true">◇</span>}</div>}
        <button type="button" className="adm-list-main" onClick={() => setEditing(row)}>
          <strong>{row[section.titleField] || "Untitled"}</strong>
          {section.subtitle?.(row) && <span>{section.subtitle(row)}</span>}
        </button>
        {section.featured && <button type="button" className={`adm-star ${row.featured ? "is-on" : ""}`} onClick={() => toggleFeatured(row)} aria-pressed={row.featured} aria-label={row.featured ? "Unfeature" : "Feature"} title={row.featured ? "Featured" : "Mark as featured"}>★</button>}
        <button type="button" className="adm-btn adm-btn-small" onClick={() => setEditing(row)}>Edit</button>
        <button type="button" className="adm-btn adm-btn-small adm-btn-danger" onClick={() => remove(row)}>Delete</button>
      </li>)}
    </ol> : <div className="adm-empty"><p>Nothing here yet.</p><button type="button" className="adm-btn adm-btn-primary" onClick={() => setEditing("new")}>Add the first one</button></div>}
  </div>;
}

function ItemForm({ section, row, suggestions, nextOrder, notify, onClose, onDelete, onDirtyChange }) {
  const form = useEntityForm(section, row, onDirtyChange);
  const [saving, setSaving] = useState(false);
  const singular = section.label.replace(/s$/, "");
  const save = async (event) => {
    event.preventDefault();
    const payload = form.prepare();
    if (!payload) { notify("Please fix the highlighted fields.", "error"); return; }
    setSaving(true);
    const query = row
      ? supabase.from(section.table).update(payload).eq("id", row.id)
      : supabase.from(section.table).insert({ ...payload, sort_order: nextOrder });
    const { error } = await query;
    setSaving(false);
    if (error) { notify(friendly(error), "error"); return; }
    await form.cleanupAfterSave(payload);
    onDirtyChange?.(false);
    notify(row ? "Saved — now live on your portfolio." : `${singular} added — now live on your portfolio.`, "success");
    onClose(true);
  };
  const cancel = async () => {
    if (form.dirty && !window.confirm("Discard your unsaved changes?")) return;
    await form.discardUploads();
    onDirtyChange?.(false);
    onClose(true);
  };
  return <form className="adm-editor" onSubmit={save} noValidate>
    <div className="adm-editor-head">
      <button type="button" className="adm-btn adm-btn-quiet adm-btn-small" onClick={cancel}>← Back to list</button>
      <h2>{row ? `Edit: ${row[section.titleField] || singular}` : `New ${singular.toLowerCase()}`}</h2>
    </div>
    <EntityForm section={section} form={form} suggestions={suggestions} />
    <div className="adm-savebar">
      {onDelete ? <button type="button" className="adm-btn adm-btn-danger" onClick={onDelete} disabled={saving}>Delete</button> : <span />}
      <div className="adm-row">
        <button type="button" className="adm-btn adm-btn-quiet" onClick={cancel} disabled={saving}>Cancel</button>
        <button type="submit" className="adm-btn adm-btn-primary" disabled={saving || (row && !form.dirty)}>{saving ? "Saving…" : row ? "Save changes" : `Add ${singular.toLowerCase()}`}</button>
      </div>
    </div>
  </form>;
}
