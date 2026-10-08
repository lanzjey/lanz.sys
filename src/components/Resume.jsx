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

// Dedicated resume section: an on-page, print-ready sheet plus view / download actions.
// With an uploaded file, the buttons open or download it; without one, the sheet itself
// is the resume ("Download" saves it as a PDF through the browser's print dialog).
export default function Resume({ profile, skills, education, experience, certificates, tools, resume }) {
  const fileHref = resume.file || resume.url;
  const experienceItems = experience.filter((item) => isFilled(item.title));
  const educationItems = education.filter((item) => isFilled(item.title));
  const credentials = certificates.filter((item) => isFilled(item.title) && isFilled(item.issuer));
  const skillGroups = Object.entries(groupBy(skills.filter((skill) => isFilled(skill.name)), "category"));
  const toolNames = tools.filter((tool) => isFilled(tool.name)).map((tool) => tool.name);
  const roles = (profile.roles || []).filter(isFilled);

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

  return <section id="resume" className="section section-resume" aria-labelledby="resume-title">
    <div className="container">
      <SectionHeader id="resume-title" index="07" word="RESUME" eyebrow="Player record · Resume" title={<>My <em>resume.</em></>} text={resume.description || "A concise overview of education, skills, and selected work."} />
      <div className="resume-actions scroll-fx">
        <a className="button button-primary" href={fileHref || "#resume-sheet"} onClick={viewResume} {...(fileHref ? { target: "_blank", rel: "noopener noreferrer" } : {})}>View Resume <Arrow direction={fileHref ? "up-right" : "down"} /></a>
        <a className="button button-ghost" href={fileHref || "#resume-sheet"} onClick={downloadResume} {...(resume.file ? { download: true } : fileHref ? { target: "_blank", rel: "noopener noreferrer" } : {})}>Download Resume <Arrow direction="down" /></a>
      </div>

      <article id="resume-sheet" className="cv-sheet scroll-fx" aria-label={`${profile.name} resume`} tabIndex={-1}>
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
