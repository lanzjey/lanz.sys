import { useId, useRef, useState } from "react";
import { isVideoFile, toEmbedUrl } from "../services/content";

function Help({ id, text, error }) {
  if (error) return <p id={id} className="adm-field-error" role="alert">{error}</p>;
  return text ? <p id={id} className="adm-field-help">{text}</p> : null;
}

function UploadButton({ accept, multiple, onFiles, children, busy }) {
  const input = useRef(null);
  return <>
    <button type="button" className="adm-btn adm-btn-small" onClick={() => input.current?.click()} disabled={busy}>{busy ? "Uploading…" : children}</button>
    <input ref={input} type="file" accept={accept} multiple={multiple} hidden onChange={(event) => { const files = [...event.target.files]; event.target.value = ""; if (files.length) onFiles(files); }} />
  </>;
}

function useUpload(upload) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const run = async (files, onDone) => {
    setBusy(true);
    setError("");
    try {
      for (const file of files) onDone(await upload(file));
    } catch (uploadError) {
      setError(uploadError.message);
    } finally {
      setBusy(false);
    }
  };
  return { busy, error, run };
}

function TagsInput({ id, value, onChange, describedBy }) {
  const [draft, setDraft] = useState("");
  const items = Array.isArray(value) ? value : [];
  const add = () => {
    const parts = draft.split(/[,\n]/).map((part) => part.trim()).filter((part) => part && !items.includes(part));
    if (parts.length) onChange([...items, ...parts]);
    setDraft("");
  };
  const move = (index, delta) => {
    const next = [...items];
    const [item] = next.splice(index, 1);
    next.splice(index + delta, 0, item);
    onChange(next);
  };
  return <div className="adm-tags">
    {items.length > 0 && <ul className="adm-tag-list">
      {items.map((item, index) => <li key={`${item}-${index}`}>
        <span>{item}</span>
        {index > 0 && <button type="button" onClick={() => move(index, -1)} aria-label={`Move ${item} left`}>‹</button>}
        <button type="button" onClick={() => onChange(items.filter((_, i) => i !== index))} aria-label={`Remove ${item}`}>×</button>
      </li>)}
    </ul>}
    <div className="adm-tags-input">
      <input id={id} value={draft} aria-describedby={describedBy} placeholder="Type and press Enter" onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => { if (event.key === "Enter" || event.key === ",") { event.preventDefault(); add(); } else if (event.key === "Backspace" && !draft && items.length) onChange(items.slice(0, -1)); }}
        onBlur={add} />
      <button type="button" className="adm-btn adm-btn-small" onClick={add} disabled={!draft.trim()}>Add</button>
    </div>
  </div>;
}

function ImageField({ id, value, onChange, upload, describedBy }) {
  const { busy, error, run } = useUpload(upload);
  return <div className="adm-media">
    <div className="adm-media-preview">{value ? <img src={value} alt="" /> : <span>No image</span>}</div>
    <div className="adm-media-controls">
      <div className="adm-row">
        <UploadButton accept="image/*" busy={busy} onFiles={(files) => run(files.slice(0, 1), onChange)}>{value ? "Replace image" : "Upload image"}</UploadButton>
        {value && <button type="button" className="adm-btn adm-btn-small adm-btn-quiet" onClick={() => onChange("")}>Remove</button>}
      </div>
      <input id={id} type="url" value={value || ""} aria-describedby={describedBy} placeholder="…or paste an image link" onChange={(event) => onChange(event.target.value)} />
      {error && <p className="adm-field-error" role="alert">{error}</p>}
    </div>
  </div>;
}

function FileField({ id, value, onChange, upload, accept, describedBy }) {
  const { busy, error, run } = useUpload(upload);
  const name = value ? decodeURIComponent(value.split("/").pop().split("?")[0]) : "";
  return <div className="adm-media-controls">
    <div className="adm-row">
      {value ? <a className="adm-file-chip" href={value} target="_blank" rel="noopener noreferrer">📄 {name}</a> : <span className="adm-muted">No file uploaded</span>}
    </div>
    <div className="adm-row">
      <UploadButton accept={accept} busy={busy} onFiles={(files) => run(files.slice(0, 1), onChange)}>{value ? "Replace file" : "Upload file"}</UploadButton>
      {value && <button type="button" className="adm-btn adm-btn-small adm-btn-quiet" onClick={() => onChange("")}>Remove</button>}
    </div>
    <input id={id} type="hidden" value={value || ""} aria-describedby={describedBy} />
    {error && <p className="adm-field-error" role="alert">{error}</p>}
  </div>;
}

function VideoPreview({ src }) {
  const embed = toEmbedUrl(src);
  if (embed) return <iframe src={embed} title="Video preview" loading="lazy" allowFullScreen />;
  if (isVideoFile(src) || src.includes("/storage/v1/object/")) return <video src={src} controls preload="metadata" />;
  return <span>Link preview not available</span>;
}

function VideoField({ id, value, onChange, upload, describedBy }) {
  const { busy, error, run } = useUpload(upload);
  return <div className="adm-media">
    <div className="adm-media-preview">{value ? <VideoPreview src={value} /> : <span>No video</span>}</div>
    <div className="adm-media-controls">
      <div className="adm-row">
        <UploadButton accept="video/mp4,video/webm" busy={busy} onFiles={(files) => run(files.slice(0, 1), onChange)}>{value ? "Replace video" : "Upload video"}</UploadButton>
        {value && <button type="button" className="adm-btn adm-btn-small adm-btn-quiet" onClick={() => onChange("")}>Remove</button>}
      </div>
      <input id={id} type="url" value={value || ""} aria-describedby={describedBy} placeholder="…or paste a YouTube / Vimeo link" onChange={(event) => onChange(event.target.value)} />
      {error && <p className="adm-field-error" role="alert">{error}</p>}
    </div>
  </div>;
}

function GalleryField({ value, onChange, upload }) {
  const items = Array.isArray(value) ? value : [];
  const [link, setLink] = useState("");
  const { busy, error, run } = useUpload(upload);
  const append = (item) => onChange((current) => [...(Array.isArray(current) ? current : []), item]);
  const update = (index, patch) => onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  const move = (index, delta) => {
    const next = [...items];
    const [item] = next.splice(index, 1);
    next.splice(index + delta, 0, item);
    onChange(next);
  };
  const addLink = () => {
    if (!link.trim()) return;
    append({ type: toEmbedUrl(link) ? "embed" : isVideoFile(link) ? "video" : "image", src: link.trim(), alt: "", caption: "" });
    setLink("");
  };
  return <div className="adm-gallery">
    {items.length > 0 && <ol className="adm-gallery-list">
      {items.map((item, index) => <li key={`${item.src}-${index}`} className="adm-gallery-item">
        <div className="adm-gallery-thumb">{item.type === "image" ? <img src={item.src} alt="" /> : <VideoPreview src={item.src} />}</div>
        <div className="adm-gallery-meta">
          <span className="adm-badge">{item.type === "embed" ? "Video link" : item.type === "video" ? "Video" : "Image"}</span>
          <input value={item.alt || ""} placeholder="Description (for accessibility)" onChange={(event) => update(index, { alt: event.target.value })} aria-label={`Gallery item ${index + 1} description`} />
          <input value={item.caption || ""} placeholder="Caption (optional)" onChange={(event) => update(index, { caption: event.target.value })} aria-label={`Gallery item ${index + 1} caption`} />
        </div>
        <div className="adm-gallery-actions">
          <button type="button" className="adm-icon-btn" disabled={index === 0} onClick={() => move(index, -1)} aria-label="Move up">↑</button>
          <button type="button" className="adm-icon-btn" disabled={index === items.length - 1} onClick={() => move(index, 1)} aria-label="Move down">↓</button>
          <button type="button" className="adm-icon-btn adm-danger" onClick={() => onChange(items.filter((_, i) => i !== index))} aria-label="Remove">×</button>
        </div>
      </li>)}
    </ol>}
    <div className="adm-row">
      <UploadButton accept="image/*" multiple busy={busy} onFiles={(files) => run(files, (src) => append({ type: "image", src, alt: "", caption: "" }))}>Upload images</UploadButton>
      <UploadButton accept="video/mp4,video/webm" busy={busy} onFiles={(files) => run(files.slice(0, 1), (src) => append({ type: "video", src, alt: "", caption: "" }))}>Upload video</UploadButton>
    </div>
    <div className="adm-tags-input">
      <input type="url" value={link} placeholder="Paste a YouTube / Vimeo / image link" onChange={(event) => setLink(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addLink(); } }} aria-label="Add gallery link" />
      <button type="button" className="adm-btn adm-btn-small" onClick={addLink} disabled={!link.trim()}>Add link</button>
    </div>
    {error && <p className="adm-field-error" role="alert">{error}</p>}
  </div>;
}

export function Field({ field, value, form, onChange, error, suggestions = [], upload }) {
  const id = useId();
  const helpId = `${id}-help`;
  const describedBy = field.help || error ? helpId : undefined;
  const placeholder = typeof field.placeholder === "function" ? field.placeholder(form) : field.placeholder;
  const common = { id, "aria-describedby": describedBy, "aria-invalid": error ? true : undefined };
  let control;

  switch (field.type) {
    case "textarea":
      control = <textarea {...common} rows={field.rows || 3} value={value || ""} onChange={(event) => onChange(event.target.value)} />;
      break;
    case "select":
      control = <select {...common} value={value || ""} onChange={(event) => onChange(event.target.value)}>
        {!field.required && <option value="">— Not set —</option>}
        {field.options.map((option) => <option key={option} value={option}>{field.optionLabels?.[option] || option}</option>)}
      </select>;
      break;
    case "toggle":
      return <div className="adm-field adm-field-toggle">
        <label className="adm-switch"><input type="checkbox" checked={Boolean(value)} onChange={(event) => onChange(event.target.checked)} /><span aria-hidden="true" />{field.label}</label>
      </div>;
    case "category":
      control = <>
        <input {...common} list={`${id}-list`} value={value || ""} placeholder="Choose or type a new category" onChange={(event) => onChange(event.target.value)} />
        <datalist id={`${id}-list`}>{suggestions.map((option) => <option key={option} value={option} />)}</datalist>
      </>;
      break;
    case "tags":
      control = <TagsInput id={id} value={value} onChange={onChange} describedBy={describedBy} />;
      break;
    case "image":
      control = <ImageField id={id} value={value} onChange={onChange} upload={upload} describedBy={describedBy} />;
      break;
    case "file":
      control = <FileField id={id} value={value} onChange={onChange} upload={upload} accept={field.accept} describedBy={describedBy} />;
      break;
    case "video":
      control = <VideoField id={id} value={value} onChange={onChange} upload={upload} describedBy={describedBy} />;
      break;
    case "gallery":
      control = <GalleryField value={value} onChange={onChange} upload={upload} />;
      break;
    default:
      control = <input {...common} type={field.type === "email" ? "email" : field.type === "date" ? "date" : field.type === "url" ? "url" : "text"} value={value || ""} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />;
  }

  return <div className={`adm-field adm-field-${field.type}`}>
    <label htmlFor={id} className="adm-label">{field.label}{field.required && <span className="adm-required" aria-hidden="true"> *</span>}</label>
    {control}
    <Help id={helpId} text={field.help} error={error} />
  </div>;
}
