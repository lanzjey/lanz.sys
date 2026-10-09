import { useMemo, useState } from "react";
import { Arrow, Eyebrow, HPBar, ReturnToWorld, SectionHeader, ShowMore } from "./ui";
import { useShowMore } from "../hooks/useShowMore";
import ContactForm from "./ContactForm";
import SocialIcon from "./SocialIcon";
import { isVideoFile, toEmbedUrl } from "../services/content";
import { isFilled, pad, tilt } from "../lib/utils";

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

function FilterTabs({ label, items, value, onChange, counts }) {
  return <div className="filter-tabs" role="group" aria-label={label}>
    {items.map((item) => <button key={item} type="button" className={value === item ? "is-active" : ""} aria-pressed={value === item} onClick={() => onChange(item)}>
      {item}{counts && <span className="filter-count">{counts[item]}</span>}
    </button>)}
  </div>;
}

const countBy = (items, key) => items.reduce((acc, item) => ({ ...acc, [item[key]]: (acc[item[key]] || 0) + 1 }), { All: items.length });

/* ── 01 Profile ─────────────────────────────────────────── */
export function About({ profile, onNavigate }) {
  const facts = [
    ["Discipline", profile.playerClass],
    ["Focus", profile.specialization],
    ["Status", profile.availability, true],
    ["Base", profile.location],
  ].filter(([, value]) => isFilled(value));
  return <section id="about" className="section" aria-labelledby="about-title">
    <div className="container">
      <SectionHeader id="about-title" index="01" eyebrow="Player profile" word="ABOUT" title={<>The person behind <em>the work.</em></>} />
      <div className="about-grid">
        <figure className="profile-card tilt scroll-fx" {...tilt}>
          <div className="profile-card-frame">
            <img src={profile.image} alt={profile.imageAlt} loading="lazy" />
            <span className="profile-scan" aria-hidden="true" />
          </div>
          <figcaption>
            <HPBar name={profile.name.split(" ")[0]} />
            <span className="profile-card-row"><span>Player ID · 001</span><span className="profile-card-status"><span className="status-dot" aria-hidden="true" />Online</span></span>
          </figcaption>
        </figure>
        <div className="about-body scroll-fx" style={{ "--stagger": 1 }}>
          <p className="about-lead">{profile.about}</p>
          <p className="about-text">{profile.intro}</p>
          <dl className="fact-grid">
            {facts.map(([label, value, live]) => <div key={label} className="fact">
              <dt>{label}</dt>
              <dd>{live && <span className="status-dot" aria-hidden="true" />}{value}</dd>
            </div>)}
          </dl>
          <div className="button-row">
            <button type="button" className="button button-primary" onClick={() => onNavigate("missions")}>See missions <Arrow direction="right" /></button>
            <button type="button" className="button button-ghost" onClick={() => onNavigate("contact")}>Contact me</button>
          </div>
        </div>
      </div>
      <ReturnToWorld onNavigate={onNavigate} />
    </div>
  </section>;
}

/* ── 02 Skills ──────────────────────────────────────────── */
const levelSteps = { beginner: 1, intermediate: 2, advanced: 3, expert: 4 };

export function Skills({ skills, onNavigate }) {
  const [category, setCategory] = useState("All");
  const categories = useMemo(() => ["All", ...new Set(skills.map((skill) => skill.category))], [skills]);
  const counts = useMemo(() => countBy(skills, "category"), [skills]);
  const visible = skills.filter((skill) => category === "All" || skill.category === category);
  const more = useShowMore(visible, 6);
  return <section id="skills" className="section" aria-labelledby="skills-title">
    <div className="container">
      <SectionHeader id="skills-title" index="02" word="SKILLS" eyebrow="Skill slots" title={<>Skills I bring <em>to your project.</em></>} text="A snapshot of the capabilities I'm building across software, creative, and digital work." />
      <FilterTabs label="Filter skills by branch" items={categories} value={category} onChange={setCategory} counts={counts} />
      <div><div className="card-grid skill-grid" key={category}>
        {more.shown.map((skill, index) => {
          const steps = levelSteps[skill.level?.toLowerCase()] || 0;
          return <article key={skill.name} className={`card skill-card tilt scroll-fx ${index >= more.limit ? "is-extra" : ""}`} style={{ "--stagger": index, "--extra": index - more.limit }} {...tilt}>
            <div className="card-meta"><span>{skill.category}</span>{steps > 0 && <span className="level-badge">{skill.level}</span>}</div>
            <h3>{skill.name}</h3>
            {steps > 0 && <div className="proficiency" role="img" aria-label={`${skill.level}: proficiency ${steps * 250} of 1000`}>
              <span className="proficiency-track"><i style={{ "--fill": steps / 4 }} /></span>
              <span className="proficiency-value">{steps * 250}<small>/1000</small></span>
            </div>}
            {isFilled(skill.description) && <p>{skill.description}</p>}
            {skill.related?.length > 0 && <ul className="chip-list" aria-label="Related">{skill.related.map((item) => <li key={item}>{item}</li>)}</ul>}
          </article>;
        })}
      </div></div>
      <ShowMore {...more} />
      <ReturnToWorld onNavigate={onNavigate} />
    </div>
  </section>;
}

const processSteps = [
  { title: "Send a message", text: "Tell me what you need, what you want to achieve, and any deadline." },
  { title: "We agree on a plan", text: "I reply with questions and a clear scope, so you know what to expect." },
  { title: "I deliver and refine", text: "You see the work in stages and can give feedback before it's final." },
];

/* ── 03 Services ────────────────────────────────────────── */
export function Services({ services, email, onNavigate }) {
  const more = useShowMore(services, 4);
  return <section id="services" className="section" aria-labelledby="services-title">
    <div className="container">
      <SectionHeader id="services-title" index="03" word="ABILITY" eyebrow="Abilities · Services" title={<>Digital work, <em>ready to deploy.</em></>} text="Ways I can help — from creative production to organized, dependable digital support." />
      <div className="card-grid service-grid">
        {more.shown.map((service, index) => <article key={service.name} className={`card service-card tilt scroll-fx ${index >= more.limit ? "is-extra" : ""}`} style={{ "--stagger": index, "--extra": index - more.limit }} {...tilt}>
          <div className="service-head">
            <span className="icon-badge"><Icon path={iconFor(service.name)} /></span>
            <span className="service-head-meta">{isFilled(service.availability) && <span className={`availability-badge is-${service.availability.toLowerCase().replace(/\s+/g, "-")}`}>{service.availability}</span>}<span className="service-index">{pad(index + 1)}</span></span>
          </div>
          <h3>{service.name}</h3>
          <p>{service.description}</p>
          {service.capabilities?.length > 0 && <ul className="tick-list">{service.capabilities.filter(isFilled).map((item) => <li key={item}>{item}</li>)}</ul>}
          {service.tools?.length > 0 && <ul className="chip-list" aria-label="Tools">{service.tools.map((tool) => <li key={tool}>{tool}</li>)}</ul>}
          <a className="card-link" href={`mailto:${email}?subject=${encodeURIComponent(service.cta || service.name)}`}>{isFilled(service.cta) ? service.cta : "Start a project"} <Arrow /></a>
        </article>)}
      </div>
      <ShowMore {...more} />
      <div className="process scroll-fx">
        <h3 className="subheading">How working with me goes</h3>
        <ol className="process-steps">
          {processSteps.map((step, index) => <li key={step.title} className="process-step">
            <span className="process-number" aria-hidden="true">{pad(index + 1)}</span>
            <strong>{step.title}</strong>
            <span>{step.text}</span>
          </li>)}
        </ol>
        <button type="button" className="button button-ghost" onClick={() => onNavigate("contact")}>Start with a message <Arrow direction="right" /></button>
      </div>
      <ReturnToWorld onNavigate={onNavigate} />
    </div>
  </section>;
}

/* ── 04 Missions ────────────────────────────────────────── */
function ProjectMedia({ project, index }) {
  if (project.media) return <div className="project-media"><img src={project.media} alt="" loading="lazy" /></div>;
  return <div className={`project-media project-media-placeholder tone-${index % 3}`} aria-hidden="true">
    <span className="pm-grid" />
    <span className="pm-window"><span className="pm-bar"><i /><i /><i /></span><span className="pm-body"><span className="pm-side" /><span className="pm-map"><i /><i /><i /></span></span></span>
    <span className="pm-label">Mission {pad(index + 1, 3)}</span>
  </div>;
}

export function Projects({ projects, onOpen, onNavigate }) {
  const [filter, setFilter] = useState("All");
  const categories = useMemo(() => ["All", ...new Set(projects.map((project) => project.category))], [projects]);
  const counts = useMemo(() => countBy(projects, "category"), [projects]);
  const visible = projects.map((project, index) => ({ project, index })).filter(({ project }) => filter === "All" || project.category === filter);
  const more = useShowMore(visible, 6);
  return <section id="projects" className="section" aria-labelledby="projects-title">
    <div className="container">
      <SectionHeader id="projects-title" index="04" word="QUESTS" eyebrow="Quest log · Projects" title={<>Selected <em>projects.</em></>} text="Projects, experiments, and work in progress. Open one to see the goal, what I did, and the results." />
      <FilterTabs label="Filter missions by category" items={categories} value={filter} onChange={setFilter} counts={counts} />
      <div><div className="project-grid" key={filter}>
        {more.shown.map(({ project, index }, order) => <button key={`${project.name}-${index}`} type="button" className={`card project-card tilt scroll-fx ${project.featured && filter === "All" ? "is-featured" : ""} ${order >= more.limit ? "is-extra" : ""}`} style={{ "--stagger": order, "--extra": order - more.limit }} onClick={() => onOpen(project)} {...tilt} aria-label={`View project: ${project.name}`}>
          <ProjectMedia project={project} index={index} />
          <span className="project-body">
            <span className="card-meta"><span>{project.category} · {project.year}</span><span className="status-pill"><span className="status-dot" aria-hidden="true" />{project.status}</span></span>
            <span className="project-title">{project.name}</span>
            <span className="project-description">{project.description}</span>
            <span className="chip-list">{project.tech.filter(isFilled).map((tech) => <span key={tech}>{tech}</span>)}</span>
            <span className="card-link">View project <Arrow /></span>
          </span>
        </button>)}
      </div></div>
      <ShowMore {...more} />
      <ReturnToWorld onNavigate={onNavigate} />
    </div>
  </section>;
}

/* ── 05 Experience ──────────────────────────────────────── */
export function Experience({ education, experience, certificates, onNavigate }) {
  const milestones = [
    ...experience.map((item) => ({ ...item, kind: "Experience" })),
    ...education.map((item) => ({ ...item, kind: "Education" })),
  ];
  const credentials = certificates.filter((item) => isFilled(item.title) && isFilled(item.issuer));
  const timeline = useShowMore(milestones, 4);
  const credentialMore = useShowMore(credentials, 3);
  return <section id="experience" className="section" aria-labelledby="experience-title">
    <div className="container">
      <SectionHeader id="experience-title" index="05" word="JOURNEY" eyebrow="Progression" title={<>Growth through <em>practice.</em></>} text="Education, experience, and credentials earned along the way." />
      <div className="experience-grid">
        <ol id="education" className="timeline">
          {timeline.shown.map((item, index) => <li key={`${item.kind}-${index}`} className={`timeline-item ${index >= timeline.limit ? "is-extra" : ""}`} style={{ "--stagger": index, "--extra": index - timeline.limit }}>
            <span className="timeline-node" aria-hidden="true" />
            <div className="card timeline-card scroll-fx" style={{ "--stagger": index }}>
              <div className="card-meta"><span className={`kind-badge kind-${item.kind.toLowerCase()}`}>{item.kind}</span>{isFilled(item.period) && <span>{item.period}</span>}</div>
              <h3>{item.title}</h3>
              {isFilled(item.organization) && <p className="timeline-org">{item.organization}</p>}
              {isFilled(item.description) && <p>{item.description}</p>}
            </div>
          </li>)}
          {timeline.hasMore && <li className="timeline-more"><ShowMore {...timeline} /></li>}
        </ol>
        <aside id="certificates" className="credentials" aria-labelledby="credentials-title">
          <h3 id="credentials-title" className="subheading">Credentials</h3>
          {credentials.length ? <ul className="credential-list">
            {credentialMore.shown.map((item, index) => <li key={`${item.title}-${index}`} className={`card credential-card scroll-fx ${index >= credentialMore.limit ? "is-extra" : ""}`} style={{ "--extra": index - credentialMore.limit }}>
              {item.image ? <a className="credential-thumb" href={item.image} target="_blank" rel="noopener noreferrer"><img src={item.image} alt={`${item.title} certificate`} loading="lazy" /></a> : <span className="icon-badge" aria-hidden="true">✦</span>}
              <span className="credential-copy">
                <strong>{item.title}</strong>
                <span>{item.issuer}{isFilled(item.date) ? ` · ${item.date}` : ""}</span>
                {isFilled(item.credentialId) && <span className="credential-id">ID {item.credentialId}</span>}
                <span className="credential-links">
                  {item.credentialUrl && <a className="card-link" href={item.credentialUrl} target="_blank" rel="noopener noreferrer">Verify <Arrow /></a>}
                  {item.pdf && <a className="card-link" href={item.pdf} target="_blank" rel="noopener noreferrer">PDF <Arrow /></a>}
                </span>
              </span>
            </li>)}
          </ul> : <div className="card empty-state scroll-fx">
            <span className="icon-badge" aria-hidden="true">✦</span>
            <p><strong>Credentials loading…</strong>Certificates will appear here as they're earned and verified.</p>
          </div>}
          <ShowMore {...credentialMore} />
        </aside>
      </div>
      <ReturnToWorld onNavigate={onNavigate} />
    </div>
  </section>;
}

/* ── 06 Loadout ─────────────────────────────────────────── */
const initials = (name) => name.split(/\s+/).filter((word) => /^[A-Za-z]/.test(word)).slice(0, 2).map((word) => word[0]).join("").toUpperCase();

export function Loadout({ tools, onNavigate }) {
  const [category, setCategory] = useState("All");
  const categories = useMemo(() => ["All", ...new Set(tools.map((tool) => tool.category))], [tools]);
  const counts = useMemo(() => countBy(tools, "category"), [tools]);
  const visible = tools.filter((tool) => category === "All" || tool.category === category);
  const more = useShowMore(visible, 8);
  return <section id="loadout" className="section" aria-labelledby="loadout-title">
    <div className="container">
      <SectionHeader id="loadout-title" index="06" word="LOADOUT" eyebrow="Inventory · Loadout" title={<>Tools for <em>the build.</em></>} text="The software in my current working kit." />
      <FilterTabs label="Filter tools by category" items={categories} value={category} onChange={setCategory} counts={counts} />
      <div><ul className="tool-grid" key={category}>
        {more.shown.map((tool, index) => <li key={`${tool.name}-${index}`} className={`card tool-card tilt scroll-fx ${index >= more.limit ? "is-extra" : ""}`} style={{ "--stagger": index, "--extra": index - more.limit }} {...tilt}>
          <span className="tool-glyph" aria-hidden="true">{initials(tool.name)}</span>
          <span className="tool-copy"><strong>{tool.name}</strong><span>{tool.category}</span></span>
          {isFilled(tool.usage) && <p className="tool-usage">{tool.usage}</p>}
        </li>)}
      </ul></div>
      <ShowMore {...more} />
      <ReturnToWorld onNavigate={onNavigate} />
    </div>
  </section>;
}

/* ── Feedback (only rendered once approved messages exist) ── */
export function Testimonials({ testimonials, onNavigate }) {
  const more = useShowMore(testimonials, 3);
  if (!testimonials.length) return null;
  return <section id="testimonials" className="section" aria-labelledby="testimonials-title">
    <div className="container">
      <SectionHeader id="testimonials-title" index="—" eyebrow="Feedback" title={<>Kind words from <em>collaborators.</em></>} />
      <div className="card-grid testimonial-grid">
        {more.shown.map((item, index) => <figure key={`${item.name}-${index}`} className={`card testimonial-card scroll-fx ${index >= more.limit ? "is-extra" : ""}`} style={{ "--extra": index - more.limit }}>
          <blockquote>{item.message}</blockquote>
          <figcaption><strong>{item.name}</strong><span>{item.role}</span></figcaption>
        </figure>)}
      </div>
      <ShowMore {...more} />
      <ReturnToWorld onNavigate={onNavigate} />
    </div>
  </section>;
}

/* ── 07 Contact ─────────────────────────────────────────── */
export function Contact({ profile, socialLinks, resume, onNavigate }) {
  const [copied, setCopied] = useState(false);
  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(profile.email);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch { setCopied(false); }
  };
  const resumeHref = resume.file || resume.url;
  return <section id="contact" className="section section-contact" aria-labelledby="contact-title">
    <div className="container">
      <span className="bg-word scroll-fx" aria-hidden="true">MESSAGE</span>
      <div className="contact-panel scroll-fx">
        <div className="contact-info">
          <Eyebrow index="08">Message window</Eyebrow>
          <h2 id="contact-title">Let's build something <em>together.</em></h2>
          <p className="section-lead">Have an idea, a project, or need thoughtful digital support? Send a message and I'll get back to you.</p>
          <p className="hud-chip"><span className="status-dot" aria-hidden="true" />{profile.availability}</p>

          <div className="contact-email">
            <span className="contact-label">Email</span>
            <a href={`mailto:${profile.email}`}>{profile.email}</a>
            <button type="button" className="copy-button" onClick={copyEmail} aria-live="polite">{copied ? "Copied ✓" : "Copy"}</button>
          </div>

          <div id="social" className="contact-links">
            <span className="contact-label">Channels</span>
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
              ? <a className="button button-ghost button-small" href={resumeHref} {...(resume.file ? { download: true } : { target: "_blank", rel: "noreferrer" })}>{resume.file ? "Download" : "Open"} <Arrow direction={resume.file ? "down" : "up-right"} /></a>
              : <span className="resume-soon">Coming soon</span>}
          </div>
        </div>

        <ContactForm email={profile.email} />
      </div>
      <ReturnToWorld onNavigate={onNavigate} />
    </div>
  </section>;
}

/* ── Mission briefing dialog ───────────────────────────── */
export function ProjectDialog({ project, onClose }) {
  if (!project) return null;
  const details = [["Objective", project.objective], ["Challenge", project.challenge], ["Solution", project.solution]].filter(([, value]) => isFilled(value));
  const facts = [["Status", project.status], ["Role", project.role], ["Year", project.year]].filter(([, value]) => isFilled(value));
  const features = (project.features || []).filter(isFilled);
  return <div className="dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="project-dialog" data-lenis-prevent role="dialog" aria-modal="true" aria-labelledby="dialog-title">
      <button type="button" className="dialog-close" onClick={onClose} aria-label="Close mission briefing">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
      </button>
      <div className="dialog-media">
        {project.video ? <MediaItem item={{ src: project.video, alt: `${project.name} video` }} poster={project.media} /> : <ProjectMedia project={project} index={0} />}
      </div>
      <div className="dialog-body">
        <Eyebrow index="Quest">{project.category}</Eyebrow>
        <h2 id="dialog-title">{project.name}</h2>
        <p className="dialog-lead">{project.description}</p>
        {facts.length > 0 && <dl className="dialog-facts">{facts.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>}
        {details.map(([label, value]) => <section key={label} className="dialog-section"><h3>{label}</h3><p>{value}</p></section>)}
        {features.length > 0 && <section className="dialog-section"><h3>Features</h3><ul className="tick-list">{features.map((feature) => <li key={feature}>{feature}</li>)}</ul></section>}
        {project.results?.length > 0 && <section className="dialog-section"><h3>Results</h3><ul className="tick-list">{project.results.map((result) => <li key={result}>{result}</li>)}</ul></section>}
        <section className="dialog-section"><h3>Technologies</h3><ul className="chip-list">{project.tech.filter(isFilled).map((tech) => <li key={tech}>{tech}</li>)}</ul></section>
        {project.gallery?.length > 0 && <section className="dialog-section"><h3>Gallery</h3><div className="dialog-gallery">{project.gallery.map((item) => <figure key={item.src} className="dialog-gallery-item"><MediaItem item={{ ...item, alt: item.alt || `${project.name} media` }} />{item.caption && <figcaption>{item.caption}</figcaption>}</figure>)}</div></section>}
        {(project.githubUrl || project.liveUrl) && <div className="button-row">
          {project.liveUrl && <a className="button button-primary" href={project.liveUrl} target="_blank" rel="noreferrer">Live project <Arrow /></a>}
          {project.githubUrl && <a className="button button-ghost" href={project.githubUrl} target="_blank" rel="noreferrer">Source code <Arrow /></a>}
        </div>}
      </div>
    </section>
  </div>;
}

// Image, uploaded video file, or YouTube/Vimeo link.
function MediaItem({ item, poster }) {
  const embed = toEmbedUrl(item.src);
  if (embed) return <iframe src={embed} title={item.alt} loading="lazy" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowFullScreen />;
  if (item.type === "video" || isVideoFile(item.src)) return <video controls playsInline preload="metadata" poster={poster || undefined}><source src={item.src} />Your browser does not support video playback.</video>;
  return <img src={item.src} alt={item.alt} loading="lazy" />;
}
