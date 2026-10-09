import { useEffect, useRef, useState } from "react";
import { Arrow, ReturnToWorld, SectionHeader } from "./ui";
import { isFilled } from "../lib/utils";

const HOLD_MS = 1500;
const RING = 2 * Math.PI * 84;
const stages = ["Shadow seal engaged", "Gathering mana…", "Extracting from the shadows…", "The seal is breaking…"];

const groupBy = (items, key) => items.reduce((groups, item) => {
  const name = item[key] || "Other";
  (groups[name] ||= []).push(item);
  return groups;
}, {});

function Entry({ title, meta, org, description }) {
  return <li className="cv-entry">
    <div className="cv-entry-head"><strong>{title}</strong>{isFilled(meta) && <span>{meta}</span>}</div>
    {isFilled(org) && <p className="cv-org">{org}</p>}
    {isFilled(description) && <p>{description}</p>}
  </li>;
}

// The vault: hexagonal seal, spinning rings, a padlock, and a progress ring that fills while held.
function Vault({ progress, unlocked }) {
  return <svg className="vault-art" viewBox="0 0 240 240" aria-hidden="true">
    <circle className="vault-orbit" cx="120" cy="120" r="112" />
    <circle className="vault-orbit vault-orbit-2" cx="120" cy="120" r="98" />
    <path className="vault-hex" d="M120 24 L203 72 V168 L120 216 L37 168 V72 Z" />
    <circle className="vault-track" cx="120" cy="120" r="84" />
    <circle className="vault-progress" cx="120" cy="120" r="84" strokeDasharray={RING} strokeDashoffset={RING * (1 - (unlocked ? 1 : progress / 100))} />
    {[0, 1, 2, 3, 4, 5].map((index) => {
      const angle = (index / 6) * Math.PI * 2 - Math.PI / 2;
      return <circle key={index} className="vault-node" cx={120 + Math.cos(angle) * 96} cy={120 + Math.sin(angle) * 96} r="3.2" style={{ "--i": index }} />;
    })}
    <g className="vault-lock">
      <path className="vault-shackle" d="M98 112V94a22 22 0 0 1 44 0v18" />
      <rect className="vault-body" x="86" y="110" width="68" height="52" rx="8" />
      <circle className="vault-key" cx="120" cy="132" r="6" /><path className="vault-key" d="M120 138v12" />
    </g>
    <g transform="translate(116 174) scale(1.75)">
      <g className="vault-soldier">
        <path d="M-10 0 L-8 -26 Q-14 -30 -13 -38 L-6 -42 H6 L13 -38 Q14 -30 8 -26 L10 0 L4 4 L0 1 L-5 5 Z M-5 -42 V-52 Q0 -60 5 -52 V-42 Z M-5 -53 L-9 -61 L-3 -56 M5 -53 L9 -61 L3 -56 M15 -24 V-64 L17.5 -69 L20 -64 V-24 Z M11 -27 H24 V-24 H11 Z" />
        <circle className="vault-eye" cx="-2" cy="-50" r="1.2" /><circle className="vault-eye" cx="2" cy="-50" r="1.2" />
      </g>
    </g>
  </svg>;
}

// A sealed player record. Holding the seal decrypts it (a keyboard or screen-reader
// activation unlocks at once); the unlocked item can then be viewed or downloaded.
// With an uploaded file the buttons open or download it; without one, the on-page
// sheet is the resume and "Download" saves it as a PDF through the print dialog.
export default function Resume({ profile, skills, education, experience, certificates, tools, resume, onNavigate }) {
  const [progress, setProgress] = useState(0);
  const [unlocked, setUnlocked] = useState(false);
  const holding = useRef(false);
  const startedAt = useRef(0);
  const frame = useRef(0);
  const printTimer = useRef(0);

  useEffect(() => () => { cancelAnimationFrame(frame.current); window.clearTimeout(printTimer.current); }, []);

  const fileHref = resume.file || resume.url;
  const experienceItems = experience.filter((item) => isFilled(item.title));
  const educationItems = education.filter((item) => isFilled(item.title));
  const credentials = certificates.filter((item) => isFilled(item.title) && isFilled(item.issuer));
  const skillItems = skills.filter((skill) => isFilled(skill.name));
  const skillGroups = Object.entries(groupBy(skillItems, "category"));
  const toolNames = tools.filter((tool) => isFilled(tool.name)).map((tool) => tool.name);
  const roles = (profile.roles || []).filter(isFilled);
  const stats = [["Skill slots", skillItems.length], ["Tools", toolNames.length], ["Experience", experienceItems.length], ["Education", educationItems.length], ["Credentials", credentials.length]].filter(([, count]) => count > 0);

  const unlock = () => { holding.current = false; cancelAnimationFrame(frame.current); setProgress(100); setUnlocked(true); };
  const tick = (now) => {
    if (!holding.current) return;
    const ratio = Math.min(1, (now - startedAt.current) / HOLD_MS);
    setProgress(Math.round(ratio * 100));
    if (ratio >= 1) unlock();
    else frame.current = requestAnimationFrame(tick);
  };
  const beginHold = (event) => {
    if (unlocked) return;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    holding.current = true;
    startedAt.current = performance.now() - (progress / 100) * HOLD_MS;
    frame.current = requestAnimationFrame(tick);
  };
  const endHold = () => {
    if (!holding.current) return;
    holding.current = false;
    cancelAnimationFrame(frame.current);
    setProgress(0);
  };
  // detail === 0: activated from the keyboard or assistive technology, which cannot "hold".
  const activate = (event) => { if (event.detail === 0 && !unlocked) unlock(); };

  const viewResume = (event) => {
    if (fileHref) return;
    event.preventDefault();
    document.getElementById("resume-sheet")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const downloadResume = (event) => {
    if (fileHref) return;
    event.preventDefault();
    window.print();
  };
  // Skip the ritual: a file downloads straight away; otherwise unlock, then print the sheet.
  const skipAndDownload = (event) => {
    if (fileHref) return;
    event.preventDefault();
    unlock();
    printTimer.current = window.setTimeout(() => window.print(), 700);
  };

  const stage = unlocked ? "Extraction complete" : stages[Math.min(stages.length - 1, Math.floor(progress / 34))];

  return <section id="resume" className={`section section-resume ${unlocked ? "is-unlocked" : ""}`} aria-labelledby="resume-title">
    <div className="container">
      <SectionHeader id="resume-title" index="07" word="UNLOCK" eyebrow="Player record · Shadow archive" title={<>Unlock the <em>full record.</em></>} text="My education, skills, and work, sealed in a shadow archive. Hold the seal to extract it, then take your copy." />

      <div className={`vault scroll-fx ${progress > 0 && !unlocked ? "is-holding" : ""} ${unlocked ? "is-unlocked" : ""}`} style={{ "--p": progress / 100 }}>
        <div className="vault-stage">
          <Vault progress={progress} unlocked={unlocked} />
          <i className="vault-burst" aria-hidden="true" /><i className="vault-burst vault-burst-2" aria-hidden="true" />
          {unlocked && <span className="vault-arise" aria-hidden="true">ARISE</span>}
          {unlocked && <span className="vault-smoke" aria-hidden="true">{Array.from({ length: 8 }, (_, index) => <i key={index} style={{ "--i": index }} />)}</span>}
          <span className="vault-readout" aria-hidden="true">{unlocked ? "100" : String(progress).padStart(2, "0")}<small>%</small></span>
        </div>

        <div className="vault-item">
          <span className="rarity-chip"><span className="sys-diamond" aria-hidden="true" />Legendary item</span>
          <h3>Player Record</h3>
          <p className="vault-sub">{resume.title} · {profile.name}</p>
          {stats.length > 0 && <ul className="item-stats">{stats.map(([label, count]) => <li key={label}><span>{label}</span><b>{count}</b></li>)}</ul>}
          <p className="seal-status" role="status" aria-live="polite">Seal status <b>{unlocked ? "UNLOCKED" : "LOCKED"}</b><span>{stage}</span></p>

          {unlocked
            ? <div className="vault-claim">
              <p className="item-acquired"><span className="sys-diamond" aria-hidden="true" />Item acquired: Player Record</p>
              <div className="resume-actions">
                <a className="button button-primary button-large" href={fileHref || "#resume-sheet"} onClick={downloadResume} {...(resume.file ? { download: true } : fileHref ? { target: "_blank", rel: "noopener noreferrer" } : {})}>Download Resume <Arrow direction="down" /></a>
                <a className="button button-ghost button-large" href={fileHref || "#resume-sheet"} onClick={viewResume} {...(fileHref ? { target: "_blank", rel: "noopener noreferrer" } : {})}>View Resume <Arrow direction={fileHref ? "up-right" : "down"} /></a>
              </div>
            </div>
            : <div className="vault-controls">
              <button type="button" className="hold-button" style={{ "--p": progress / 100 }} onPointerDown={beginHold} onPointerUp={endHold} onPointerCancel={endHold} onLostPointerCapture={endHold} onContextMenu={(event) => event.preventDefault()} onClick={activate}>
                <span className="hold-fill" aria-hidden="true" />
                <span className="hold-label">{progress > 0 ? "Extracting…" : "Hold to unlock"}</span>
              </button>
              <a className="vault-skip" href={fileHref || "#resume-sheet"} onClick={skipAndDownload} {...(resume.file ? { download: true } : fileHref ? { target: "_blank", rel: "noopener noreferrer" } : {})}>Skip and download</a>
            </div>}
        </div>
      </div>

      <article id="resume-sheet" className={`cv-sheet ${unlocked ? "is-open" : "is-sealed"}`} aria-label={`${profile.name} resume`} aria-hidden={!unlocked} inert={!unlocked} tabIndex={-1}>
        <header className="cv-header">
          <h3>{profile.name}</h3>
          <p className="cv-role">{roles.length ? roles.join(" · ") : profile.role}</p>
          <p className="cv-contact">
            {isFilled(profile.email) && <a href={`mailto:${profile.email}`}>{profile.email}</a>}
            {isFilled(profile.location) && <span>{profile.location}</span>}
          </p>
        </header>

        {isFilled(profile.about) && <section className="cv-block"><h4>Profile</h4><p>{profile.about}</p></section>}

        {experienceItems.length > 0 && <section className="cv-block"><h4>Experience</h4>
          <ul>{experienceItems.map((item, index) => <Entry key={`${item.title}-${index}`} title={item.title} meta={item.period} org={item.organization} description={item.description} />)}</ul>
        </section>}

        {educationItems.length > 0 && <section className="cv-block"><h4>Education</h4>
          <ul>{educationItems.map((item, index) => <Entry key={`${item.title}-${index}`} title={item.title} meta={item.period} org={item.organization} description={item.description} />)}</ul>
        </section>}

        {skillGroups.length > 0 && <section className="cv-block"><h4>Skills</h4>
          <dl className="cv-skills">{skillGroups.map(([category, items]) => <div key={category}><dt>{category}</dt><dd>{items.map((skill) => skill.name).join(", ")}</dd></div>)}</dl>
        </section>}

        {toolNames.length > 0 && <section className="cv-block"><h4>Tools</h4><p>{toolNames.join(", ")}</p></section>}

        {credentials.length > 0 && <section className="cv-block"><h4>Certifications</h4>
          <ul>{credentials.map((item, index) => <Entry key={`${item.title}-${index}`} title={item.title} meta={item.date} org={item.issuer} />)}</ul>
        </section>}
      </article>
      <ReturnToWorld onNavigate={onNavigate} />
    </div>
  </section>;
}
