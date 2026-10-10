import { useEffect, useLayoutEffect, useRef } from "react";
import { Arrow } from "./ui";
import ProjectMedia from "./ProjectMedia";
import { isVideoFile, toEmbedUrl } from "../services/content";
import { isFilled, prefersReducedMotion, statusLabel } from "../lib/utils";

// Image, uploaded video file, or YouTube/Vimeo link.
function MediaItem({ item, poster }) {
  const embed = toEmbedUrl(item.src);
  if (embed) return <iframe src={embed} title={item.alt} loading="lazy" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowFullScreen />;
  if (item.type === "video" || isVideoFile(item.src)) return <video controls playsInline preload="metadata" poster={poster || undefined}><source src={item.src} />Your browser does not support video playback.</video>;
  return <img src={item.src} alt={item.alt} loading="lazy" />;
}

const EASE = "cubic-bezier(.2, .8, .2, 1)";

// The panel opens out of the project row you chose and folds back into the row you leave from.
// If that row is not on screen (filtered out, scrolled away), it opens from the middle instead.
function rowInset(index) {
  const box = document.querySelector(`.proj-row[data-index="${index}"]`)?.getBoundingClientRect();
  const w = window.innerWidth;
  const h = window.innerHeight;
  if (!box || box.bottom < 0 || box.top > h || box.right < 0 || box.left > w) return "inset(38% 22% 38% 22%)";
  const clamp = (value, max) => Math.max(0, Math.min(max, value));
  return `inset(${clamp(box.top, h)}px ${clamp(w - box.right, w)}px ${clamp(h - box.bottom, h)}px ${clamp(box.left, w)}px)`;
}

// Full-screen project detail. Slides in over the page; Back, Esc, the close button and the
// bottom bar on phones all return to the grid, and Prev / Next (or the arrow keys) step through projects.
export default function ProjectPanel({ projects, index, onChange, onClose }) {
  const panelRef = useRef(null);
  const scrollRef = useRef(null);
  const closing = useRef(false);
  const openedFrom = useRef(index);
  const project = projects[index];

  useLayoutEffect(() => {
    const panel = panelRef.current;
    if (!panel?.animate || prefersReducedMotion()) return;
    panel.animate([{ clipPath: rowInset(openedFrom.current), opacity: .55 }, { clipPath: "inset(0px 0px 0px 0px)", opacity: 1 }], { duration: 460, easing: EASE });
  }, []);

  const close = () => {
    if (closing.current) return;
    closing.current = true;
    const panel = panelRef.current;
    if (!panel?.animate || prefersReducedMotion()) { onClose(); return; }
    const fold = panel.animate([{ clipPath: "inset(0px 0px 0px 0px)", opacity: 1 }, { clipPath: rowInset(index), opacity: .4 }], { duration: 340, easing: EASE, fill: "forwards" });
    fold.onfinish = onClose;
    fold.oncancel = onClose;
  };
  const step = (delta) => onChange((index + delta + projects.length) % projects.length);

  useEffect(() => { scrollRef.current?.scrollTo({ top: 0 }); }, [index]);

  useEffect(() => {
    const panel = panelRef.current;
    panel?.querySelector(".panel-back")?.focus();
    const onKeyDown = (event) => {
      if (event.key === "Escape") { event.preventDefault(); close(); return; }
      if (event.target.closest?.(".panel-shots")) {
        if (event.key !== "Tab") return;
      } else if (event.key === "ArrowRight") step(1);
      else if (event.key === "ArrowLeft") step(-1);
      if (event.key !== "Tab" || !panel) return;
      const items = [...panel.querySelectorAll("a[href], button:not([disabled]), video[controls], [tabindex='0']")].filter((node) => node.offsetParent !== null);
      const first = items[0];
      const last = items.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  });

  if (!project) return null;
  const details = [["Objective", project.objective], ["Challenge", project.challenge], ["Solution", project.solution]].filter(([, value]) => isFilled(value));
  const facts = [["Status", statusLabel(project.status)], ["Role", project.role], ["Year", project.year]].filter(([, value]) => isFilled(value));
  const features = (project.features || []).filter(isFilled);
  const results = (project.results || []).filter(isFilled);
  const tech = (project.tech || []).filter(isFilled);

  return <div ref={panelRef} className="panel" role="dialog" aria-modal="true" aria-labelledby="panel-title">
    <div className="panel-bar">
      <button type="button" className="btn btn-fill btn-small panel-back" onClick={close} aria-label="Back to projects"><Arrow direction="left" /><span className="panel-back-text">Back to projects</span></button>
      <span className="panel-count">{index + 1} / {projects.length}</span>
      {projects.length > 1 && <span className="panel-steps">
        <button type="button" className="btn btn-small" onClick={() => step(-1)}><span>Prev</span></button>
        <button type="button" className="btn btn-small" onClick={() => step(1)}><span>Next</span></button>
      </span>}
      <button type="button" className="icon-close" onClick={close} aria-label="Close project">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
      </button>
    </div>

    <div ref={scrollRef} className="panel-scroll" data-lenis-prevent>
      <article className="panel-wrap" key={index}>
        <header className="panel-head">
          <p className="card-meta"><span>{project.category}</span><span className="pill">{statusLabel(project.status)}</span><span>{project.year}</span></p>
          <h2 id="panel-title">{project.name}</h2>
          <p className="panel-lead">{project.description}</p>
        </header>

        <div className="panel-hero">
          {project.video ? <MediaItem item={{ src: project.video, alt: `${project.name} video` }} poster={project.media} /> : <ProjectMedia project={project} index={index} />}
        </div>

        <div className="panel-grid">
          <div className="panel-main">
            {details.map(([label, value]) => <section key={label}><h3>{label}</h3><p>{value}</p></section>)}
            {features.length > 0 && <section><h3>Features</h3><ul className="ticks">{features.map((feature) => <li key={feature}>{feature}</li>)}</ul></section>}
            {results.length > 0 && <section><h3>Results</h3><ul className="ticks">{results.map((result) => <li key={result}>{result}</li>)}</ul></section>}
          </div>
          <aside className="panel-side">
            {facts.length > 0 && <dl className="facts">{facts.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>}
            {tech.length > 0 && <section><h3>Technologies</h3><ul className="chips">{tech.map((item) => <li key={item}>{item}</li>)}</ul></section>}
            {(project.liveUrl || project.githubUrl) && <section className="btn-row panel-links">
              {project.liveUrl && <a className="btn btn-fill" href={project.liveUrl} target="_blank" rel="noreferrer"><span>Live project</span><Arrow /></a>}
              {project.githubUrl && <a className="btn" href={project.githubUrl} target="_blank" rel="noreferrer"><span>Source code</span><Arrow /></a>}
            </section>}
          </aside>
        </div>

        {project.gallery?.length > 0 && <section className="panel-gallery">
          <h3>Gallery</h3>
          <div className="panel-shots" tabIndex={0} aria-label="Project gallery">
            {project.gallery.map((item) => <figure key={item.src}><MediaItem item={{ ...item, alt: item.alt || `${project.name} media` }} />{item.caption && <figcaption>{item.caption}</figcaption>}</figure>)}
          </div>
        </section>}
      </article>
    </div>

    <div className="panel-foot">
      <button type="button" className="btn btn-small" onClick={() => step(-1)} disabled={projects.length < 2}><span>Prev</span></button>
      <button type="button" className="btn btn-fill btn-small" onClick={close}><span>Close</span></button>
      <button type="button" className="btn btn-small" onClick={() => step(1)} disabled={projects.length < 2}><span>Next</span></button>
    </div>
  </div>;
}
