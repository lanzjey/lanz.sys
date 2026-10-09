import { useEffect, useMemo, useRef, useState } from "react";
import { Arrow, BackToMenu, SectionHeader, ShowMore } from "./ui";
import { useShowMore } from "../hooks/useShowMore";
import ContactForm from "./ContactForm";
import SocialIcon from "./SocialIcon";
import ProjectMedia from "./ProjectMedia";
import { isFilled, pad, statusLabel } from "../lib/utils";
import { toRoman } from "../lib/menu";

const icons = {
  video: "M4 6h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Zm14 5 4-3v8l-4-3",
  web: "M3 5h18v14H3zM3 9h18M7 7h.01M10 7h.01",
  social: "M18 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM6 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm12 7a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM8.6 13.5l6.8 4M15.4 6.5l-6.8 4",
  design: "M12 19l7-7 3 3-7 7-3-3ZM18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5ZM2 2l7.6 7.6M11 13a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z",
  content: "M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z",
  data: "M12 8c4.4 0 8-1.3 8-3s-3.6-3-8-3-8 1.3-8 3 3.6 3 8 3ZM4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3",
  research: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM21 21l-4.3-4.3",
  assist: "M9 11l3 3 8-8M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9",
};
const iconFor = (name) => {
  const key = name.toLowerCase();
  if (key.includes("video")) return icons.video;
  if (key.includes("web")) return icons.web;
  if (key.includes("social")) return icons.social;
  if (key.includes("graphic") || key.includes("design")) return icons.design;
  if (key.includes("content")) return icons.content;
  if (key.includes("data")) return icons.data;
  if (key.includes("research")) return icons.research;
  return icons.assist;
};
function Icon({ path }) {
  return <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={path} /></svg>;
}

// Category tabs with LB / RB shoulder prompts that step through them, like a game's tab bar.
function FilterTabs({ label, items, value, onChange, counts }) {
  const step = (delta) => onChange(items[(items.indexOf(value) + delta + items.length) % items.length]);
  const stepping = items.length > 2;
  return <div className="filter-bar">
    {stepping && <button type="button" className="shoulder" aria-label="Previous category" onClick={() => step(-1)}>LB</button>}
    <div className="filter-tabs" role="group" aria-label={label}>
      {items.map((item) => <button key={item} type="button" className={value === item ? "is-active" : ""} aria-pressed={value === item} onClick={() => onChange(item)}>
        <span>{item}{counts && <small>{counts[item]}</small>}</span>
      </button>)}
    </div>
    {stepping && <button type="button" className="shoulder" aria-label="Next category" onClick={() => step(1)}>RB</button>}
  </div>;
}

const countBy = (items, key) => items.reduce((acc, item) => ({ ...acc, [item[key]]: (acc[item[key]] || 0) + 1 }), { All: items.length });

/* ── About ──────────────────────────────────────────────── */
export function About({ profile, onNavigate }) {
  const facts = [
    ["Studying", profile.playerClass],
    ["Focus", profile.specialization],
    ["Status", profile.availability, true],
    ["Based in", profile.location],
  ].filter(([, value]) => isFilled(value));
  return <section id="about" className="section" aria-labelledby="about-title">
    <div className="container">
      <SectionHeader id="about-title" phase={0} word="ABOUT" eyebrow="About" title={<>The person behind <em>the work</em></>} />
      <div className="about-grid">
        <figure className="portrait scroll-fx">
          <div className="portrait-frame"><img src={profile.image} alt={profile.imageAlt} loading="lazy" /></div>
          <figcaption><strong>{profile.name}</strong><span>{profile.role}</span></figcaption>
        </figure>
        <div className="about-body scroll-fx" style={{ "--delay": 1 }}>
          <p className="about-lead">{profile.about}</p>
          <p className="about-text">{profile.intro}</p>
          <dl className="facts">
            {facts.map(([label, value, live]) => <div key={label}><dt>{label}</dt><dd>{live && <i className="live-dot" aria-hidden="true" />}{value}</dd></div>)}
          </dl>
          <div className="btn-row">
            <button type="button" className="btn btn-fill" onClick={() => onNavigate("projects")}><span>See my projects</span><Arrow direction="right" /></button>
            <button type="button" className="btn" onClick={() => onNavigate("contact")}><span>Contact me</span></button>
          </div>
        </div>
      </div>
    </div>
  </section>;
}

/* ── Skills + toolkit ───────────────────────────────────── */
const levelSteps = { beginner: 1, intermediate: 2, advanced: 3, expert: 4 };

export function Skills({ skills, tools }) {
  const [category, setCategory] = useState("All");
  const [toolCategory, setToolCategory] = useState("All");
  const categories = useMemo(() => ["All", ...new Set(skills.map((skill) => skill.category))], [skills]);
  const counts = useMemo(() => countBy(skills, "category"), [skills]);
  const toolList = useMemo(() => tools.filter((tool) => isFilled(tool.name)), [tools]);
  const toolCategories = useMemo(() => ["All", ...new Set(toolList.map((tool) => tool.category))], [toolList]);
  const visible = skills.filter((skill) => category === "All" || skill.category === category);
  const visibleTools = toolList.filter((tool) => toolCategory === "All" || tool.category === toolCategory);
  const more = useShowMore(visible, 6);
  const toolMore = useShowMore(visibleTools, 12);
  return <section id="skills" className="section" aria-labelledby="skills-title">
    <div className="container">
      <SectionHeader id="skills-title" phase={1} word="SKILLS" eyebrow="Skills" title={<>What I bring <em>to a project</em></>} text="A snapshot of the capabilities I'm building across software, creative, and digital work." />
      <FilterTabs label="Filter skills by category" items={categories} value={category} onChange={setCategory} counts={counts} />
      <div className="card-grid" key={category}>
        {more.shown.map((skill, index) => {
          const steps = levelSteps[skill.level?.toLowerCase()] || 0;
          return <article key={skill.name} className={`card skill scroll-fx ${index >= more.limit ? "is-extra" : ""}`} style={{ "--delay": index % 3, "--extra": index - more.limit }}>
            <div className="card-meta"><span>{skill.category}</span>{steps > 0 && <span className="level-text">{skill.level}</span>}</div>
            <h3>{skill.name}</h3>
            {steps > 0 && <div className="level-bar" role="img" aria-label={`${skill.level}: ${steps} of 4`}>{[1, 2, 3, 4].map((n) => <i key={n} className={n <= steps ? "on" : ""} />)}</div>}
            {isFilled(skill.description) && <p>{skill.description}</p>}
            {skill.related?.length > 0 && <ul className="chips" aria-label="Related">{skill.related.map((item) => <li key={item}>{item}</li>)}</ul>}
          </article>;
        })}
      </div>
      <ShowMore {...more} />

      {toolList.length > 0 && <div className="subsection scroll-fx">
        <h3 className="subhead">Toolkit</h3>
        <FilterTabs label="Filter tools by category" items={toolCategories} value={toolCategory} onChange={setToolCategory} />
        <ul className="tool-grid" key={toolCategory}>
          {toolMore.shown.map((tool, index) => <li key={`${tool.name}-${index}`} className={`tool ${index >= toolMore.limit ? "is-extra" : ""}`} style={{ "--extra": index - toolMore.limit }}>
            <strong>{tool.name}</strong><span>{tool.category}</span>
            {isFilled(tool.usage) && <small>{tool.usage}</small>}
          </li>)}
        </ul>
        <ShowMore {...toolMore} />
      </div>}
    </div>
  </section>;
}

const processSteps = [
  { title: "Send a message", text: "Tell me what you need, what you want to achieve, and any deadline." },
  { title: "We agree on a plan", text: "I reply with questions and a clear scope, so you know what to expect." },
  { title: "I deliver and refine", text: "You see the work in stages and can give feedback before it's final." },
];

/* ── Services ───────────────────────────────────────────── */
export function Services({ services, email, onNavigate }) {
  const more = useShowMore(services, 4);
  return <section id="services" className="section" aria-labelledby="services-title">
    <div className="container">
      <SectionHeader id="services-title" phase={2} word="SERVICES" eyebrow="Services" title={<>Digital work, <em>ready to go</em></>} text="Ways I can help, from creative production to organized, dependable digital support." />
      <div className="card-grid card-grid-2">
        {more.shown.map((service, index) => <article key={service.name} className={`card service scroll-fx ${index >= more.limit ? "is-extra" : ""}`} style={{ "--delay": index % 2, "--extra": index - more.limit }}>
          <div className="service-head">
            <span className="icon-badge"><Icon path={iconFor(service.name)} /></span>
            {isFilled(service.availability) && <span className="pill">{service.availability}</span>}
          </div>
          <h3>{service.name}</h3>
          <p>{service.description}</p>
          {service.capabilities?.length > 0 && <ul className="ticks">{service.capabilities.filter(isFilled).map((item) => <li key={item}>{item}</li>)}</ul>}
          {service.tools?.length > 0 && <ul className="chips" aria-label="Tools">{service.tools.map((tool) => <li key={tool}>{tool}</li>)}</ul>}
          <a className="card-link" href={`mailto:${email}?subject=${encodeURIComponent(service.cta || service.name)}`}>{isFilled(service.cta) ? service.cta : "Start a project"} <Arrow /></a>
        </article>)}
      </div>
      <ShowMore {...more} />
      <div className="subsection scroll-fx">
        <h3 className="subhead">How working with me goes</h3>
        <ol className="steps">
          {processSteps.map((step, index) => <li key={step.title}><b aria-hidden="true">{pad(index + 1)}</b><strong>{step.title}</strong><span>{step.text}</span></li>)}
        </ol>
        <button type="button" className="btn" onClick={() => onNavigate("contact")}><span>Start with a message</span><Arrow direction="right" /></button>
      </div>
    </div>
  </section>;
}

/* ── Projects ───────────────────────────────────────────── */
export function Projects({ projects, onOpen }) {
  const [filter, setFilter] = useState("All");
  const [selected, setSelected] = useState(0);
  const categories = useMemo(() => ["All", ...new Set(projects.map((project) => project.category))], [projects]);
  const counts = useMemo(() => countBy(projects, "category"), [projects]);
  const visible = projects.map((project, index) => ({ project, index })).filter(({ project }) => filter === "All" || project.category === filter);
  const more = useShowMore(visible, 6);
  const current = more.shown[Math.min(selected, more.shown.length - 1)];
  const onFilter = (value) => { setFilter(value); setSelected(0); };
  const tiltStage = (event) => {
    if (event.pointerType === "touch") return;
    const box = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - box.left) / box.width - .5;
    const y = (event.clientY - box.top) / box.height - .5;
    event.currentTarget.style.setProperty("--rx", `${(-y * 10).toFixed(2)}deg`);
    event.currentTarget.style.setProperty("--ry", `${(x * 14).toFixed(2)}deg`);
  };
  const resetStage = (event) => { event.currentTarget.style.setProperty("--rx", "0deg"); event.currentTarget.style.setProperty("--ry", "0deg"); };
  return <section id="projects" className="section" aria-labelledby="projects-title">
    <div className="container">
      <SectionHeader id="projects-title" phase={3} word="WORK" eyebrow="Projects" title={<>Selected <em>projects</em></>} text="Pick a project to preview it. Open one for the goal, what I did, and the results." />
      <FilterTabs label="Filter projects by category" items={categories} value={filter} onChange={onFilter} counts={counts} />
      <div className="proj-layout">
        <ol className="proj-list" key={filter}>
          {more.shown.map(({ project, index }, order) => <li key={`${project.name}-${index}`} className={`${order >= more.limit ? "is-extra" : ""}`} style={{ "--extra": order - more.limit }}>
            <button type="button" className={`proj-row ${order === selected ? "is-active" : ""}`} style={{ "--o": order }} aria-label={`View project: ${project.name}`}
              onClick={() => onOpen(index)} onFocus={() => setSelected(order)} onPointerEnter={(event) => { if (event.pointerType !== "touch") setSelected(order); }}>
              <b className="proj-num" aria-hidden="true">{toRoman(order + 1)}</b>
              <span className="proj-text">
                <strong>{project.name}</strong>
                <small>{project.category} · {project.year}</small>
                <span className="proj-desc">{project.description}</span>
              </span>
              <span className="pill">{statusLabel(project.status)}</span>
            </button>
          </li>)}
        </ol>
        {current && <aside className="proj-preview" aria-hidden="true" onPointerMove={tiltStage} onPointerLeave={resetStage}>
          <div className="proj-stage" key={current.index}>
            <ProjectMedia project={current.project} index={current.index} />
            <div className="proj-stage-info">
              <span className="card-meta"><span>{current.project.category}</span><span>{current.project.year}</span></span>
              <strong>{current.project.name}</strong>
              <p>{current.project.description}</p>
              <span className="chips">{current.project.tech.filter(isFilled).map((tech) => <span key={tech}>{tech}</span>)}</span>
            </div>
          </div>
        </aside>}
      </div>
      <ShowMore {...more} />
    </div>
  </section>;
}

/* ── Experience ─────────────────────────────────────────── */
export function Experience({ education, experience }) {
  const milestones = [
    ...experience.map((item) => ({ ...item, kind: "Experience" })),
    ...education.map((item) => ({ ...item, kind: "Education" })),
  ].filter((item) => isFilled(item.title));
  const more = useShowMore(milestones, 4);
  return <section id="experience" className="section" aria-labelledby="experience-title">
    <div className="container">
      <SectionHeader id="experience-title" phase={4} word="JOURNEY" eyebrow="Experience" title={<>Growth through <em>practice</em></>} text="Education and hands-on experience, in the order they happened." />
      {milestones.length ? <>
        <ol className="timeline">
          {more.shown.map((item, index) => <li key={`${item.kind}-${index}`} className={`timeline-item ${index >= more.limit ? "is-extra" : ""}`} style={{ "--extra": index - more.limit }}>
            <span className="timeline-node" aria-hidden="true" />
            <div className="card scroll-fx">
              <div className="card-meta"><span className={`kind kind-${item.kind.toLowerCase()}`}>{item.kind}</span>{isFilled(item.period) && <span>{item.period}</span>}</div>
              <h3>{item.title}</h3>
              {isFilled(item.organization) && <p className="timeline-org">{item.organization}</p>}
              {isFilled(item.description) && <p>{item.description}</p>}
            </div>
          </li>)}
        </ol>
        <ShowMore {...more} />
      </> : <div className="card empty scroll-fx"><p><strong>Details on the way.</strong>Education and experience will appear here as they are added.</p></div>}
    </div>
  </section>;
}

/* ── Certificates ───────────────────────────────────────── */
export function Certificates({ certificates }) {
  const credentials = certificates.filter((item) => isFilled(item.title) && isFilled(item.issuer));
  const more = useShowMore(credentials, 6);
  return <section id="certificates" className="section" aria-labelledby="certificates-title">
    <div className="container">
      <SectionHeader id="certificates-title" phase={5} word="CERTS" eyebrow="Certificates" title={<>Credentials <em>earned</em></>} text="Training and certifications, with verification links where they exist." />
      {credentials.length ? <>
        <ul className="card-grid">
          {more.shown.map((item, index) => <li key={`${item.title}-${index}`} className={`card cert scroll-fx ${index >= more.limit ? "is-extra" : ""}`} style={{ "--delay": index % 3, "--extra": index - more.limit }}>
            {item.image ? <a className="cert-thumb" href={item.image} target="_blank" rel="noopener noreferrer"><img src={item.image} alt={`${item.title} certificate`} loading="lazy" /></a> : <span className="icon-badge" aria-hidden="true"><Icon path={icons.assist} /></span>}
            <h3>{item.title}</h3>
            <p className="cert-issuer">{item.issuer}{isFilled(item.date) ? ` · ${item.date}` : ""}</p>
            {isFilled(item.credentialId) && <p className="cert-id">ID {item.credentialId}</p>}
            {(item.credentialUrl || item.pdf) && <p className="cert-links">
              {item.credentialUrl && <a className="card-link" href={item.credentialUrl} target="_blank" rel="noopener noreferrer">Verify <Arrow /></a>}
              {item.pdf && <a className="card-link" href={item.pdf} target="_blank" rel="noopener noreferrer">PDF <Arrow /></a>}
            </p>}
          </li>)}
        </ul>
        <ShowMore {...more} />
      </> : <div className="card empty scroll-fx"><p><strong>Certificates are on the way.</strong>They will appear here as they are earned and verified.</p></div>}
    </div>
  </section>;
}

/* ── Feedback (rendered once approved messages exist) ───── */
export function Testimonials({ testimonials }) {
  const more = useShowMore(testimonials, 3);
  if (!testimonials.length) return null;
  return <section id="feedback" className="section" aria-labelledby="feedback-title">
    <div className="container">
      <SectionHeader id="feedback-title" phase={6} eyebrow="Feedback" title={<>Kind words from <em>collaborators</em></>} />
      <div className="card-grid">
        {more.shown.map((item, index) => <figure key={`${item.name}-${index}`} className={`card quote scroll-fx ${index >= more.limit ? "is-extra" : ""}`} style={{ "--extra": index - more.limit }}>
          <blockquote>{item.message}</blockquote>
          <figcaption><strong>{item.name}</strong><span>{item.role}</span></figcaption>
        </figure>)}
      </div>
      <ShowMore {...more} />
    </div>
  </section>;
}

/* ── Contact ────────────────────────────────────────────── */
export function Contact({ profile, socialLinks, resume }) {
  const [copied, setCopied] = useState(false);
  const sectionRef = useRef(null);
  // The one Dark Hour moment: the page backdrop turns green while the contact section is on screen.
  useEffect(() => {
    const node = sectionRef.current;
    if (!node) return undefined;
    const root = document.documentElement;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) root.dataset.darkHour = "1";
      else delete root.dataset.darkHour;
    }, { threshold: .35 });
    observer.observe(node);
    return () => { observer.disconnect(); delete root.dataset.darkHour; };
  }, []);
  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(profile.email);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch { setCopied(false); }
  };
  const resumeHref = resume.file || resume.url;
  return <section ref={sectionRef} id="contact" className="section section-contact" aria-labelledby="contact-title">
    <div className="dh-moon" aria-hidden="true"><i /></div>
    <div className="container">
      <p className="stamp" aria-hidden="true">Mail</p>
      <div className="contact-panel scroll-fx">
        <div className="contact-info">
          <div className="sec-top"><p className="sec-tab"><span>Contact</span></p><BackToMenu /></div>
          <h2 id="contact-title">Let's build something <em>together</em></h2>
          <p className="sec-lead">Have an idea, a project, or need thoughtful digital support? Send a message and I'll get back to you.</p>
          <p className="avail"><i className="live-dot" aria-hidden="true" />{profile.availability}</p>

          <div className="contact-email">
            <span className="label">Email</span>
            <a href={`mailto:${profile.email}`}>{profile.email}</a>
            <button type="button" className="btn btn-small" onClick={copyEmail} aria-live="polite"><span>{copied ? "Copied" : "Copy"}</span></button>
          </div>

          <div id="social" className="contact-links">
            <span className="label">Find me online</span>
            <ul>
              {socialLinks.map((social, index) => <li key={`${social.label}-${index}`}>{social.placeholder || !social.href
                ? <span className="social-link is-pending" aria-disabled="true"><SocialIcon platform={social.platform} />{social.label}<small>Coming soon</small></span>
                : <a className="social-link" href={social.href} target={social.href.startsWith("http") ? "_blank" : undefined} rel={social.href.startsWith("http") ? "noopener noreferrer" : undefined}><SocialIcon platform={social.platform} />{social.label}<Arrow /></a>}</li>)}
            </ul>
          </div>

          <div className="resume-row">
            <span className="resume-icon" aria-hidden="true">CV</span>
            <span className="resume-copy"><strong>{resume.title}</strong><span>{resume.description}</span></span>
            {resumeHref
              ? <a className="btn btn-small" href={resumeHref} {...(resume.file ? { download: true } : { target: "_blank", rel: "noreferrer" })}><span>{resume.file ? "Download" : "Open"}</span></a>
              : <span className="pill">Coming soon</span>}
          </div>
        </div>
        <ContactForm email={profile.email} />
      </div>
    </div>
  </section>;
}
