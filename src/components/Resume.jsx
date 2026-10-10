import { useEffect, useRef, useState } from "react";
import { Arrow, SectionHeader } from "./ui";
import { isFilled } from "../lib/utils";

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

// The resume card. With an uploaded file the buttons open or download it. Without one,
// the on-page sheet is the resume and "Download" saves it as a PDF through the print dialog.
export default function Resume({ profile, skills, education, experience, certificates, tools, resume }) {
  const [open, setOpen] = useState(false);
  const printTimer = useRef(0);
  useEffect(() => () => window.clearTimeout(printTimer.current), []);

  const fileHref = resume.file || resume.url;
  const experienceItems = experience.filter((item) => isFilled(item.title));
  const educationItems = education.filter((item) => isFilled(item.title));
  const credentials = certificates.filter((item) => isFilled(item.title) && isFilled(item.issuer));
  const skillItems = skills.filter((skill) => isFilled(skill.name));
  const skillGroups = Object.entries(groupBy(skillItems, "category"));
  const toolNames = tools.filter((tool) => isFilled(tool.name)).map((tool) => tool.name);
  const roles = (profile.roles || []).filter(isFilled);
  const stats = [["Skills", skillItems.length], ["Tools", toolNames.length], ["Experience", experienceItems.length], ["Education", educationItems.length], ["Certificates", credentials.length]].filter(([, count]) => count > 0);

  const download = (event) => {
    if (fileHref) return;
    event.preventDefault();
    setOpen(true);
    printTimer.current = window.setTimeout(() => window.print(), 250);
  };

  return <section id="resume" className="section" aria-labelledby="resume-title">
    <div className="container">
      <SectionHeader id="resume-title" phase={6} word="RESUME" eyebrow="Resume" title={<>Take the <em>full record</em></>} text="My education, skills, and work in one place. Read it here or save a copy." />

      <div className="resume-card">
        <div className="resume-seal" aria-hidden="true"><span>CV</span></div>
        <div className="resume-main">
          <h3>{resume.title}</h3>
          <p className="resume-sub">{profile.name}</p>
          {stats.length > 0 && <ul className="stat-row">{stats.map(([label, count]) => <li key={label}><b>{count}</b><span>{label}</span></li>)}</ul>}
          <div className="btn-row">
            {fileHref
              ? <a className="btn btn-fill" href={fileHref} {...(resume.file ? { download: true } : { target: "_blank", rel: "noopener noreferrer" })}><span>{resume.file ? "Download resume" : "Open resume"}</span><Arrow direction={resume.file ? "down" : "up-right"} /></a>
              : <button type="button" className="btn btn-fill" onClick={download}><span>Download as PDF</span><Arrow direction="down" /></button>}
            <button type="button" className="btn" aria-expanded={open} aria-controls="resume-sheet" onClick={() => setOpen(!open)}><span>{open ? "Hide preview" : "Preview here"}</span><Arrow direction={open ? "up" : "down"} /></button>
          </div>
        </div>
      </div>

      <article id="resume-sheet" className={`cv-sheet ${open ? "is-open" : ""}`} aria-label={`${profile.name} resume`} hidden={!open}>
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
    </div>
  </section>;
}
