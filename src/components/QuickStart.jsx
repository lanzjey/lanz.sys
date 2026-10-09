import { Arrow, SectionHeader } from "./ui";
import { isFilled, tilt } from "../lib/utils";

const icon = {
  work: "M3 5h18v14H3zM3 9h18M7 7h.01M10 7h.01",
  services: "M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z",
  skills: "M12 2l2.9 6.3 6.8.7-5.1 4.6 1.5 6.7L12 16.8 5.9 20.3l1.5-6.7L2.3 9l6.8-.7Z",
  proof: "M9 11l3 3 8-8M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9",
  resume: "M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Zm0 0v5h5M9 13h6M9 17h6",
  contact: "M4 5h16v11H8l-4 4Z",
};

// "What are you looking for?": plain-language shortcuts to what a client usually wants first,
// plus the headline numbers (shown only once real figures have been added in the admin).
export default function QuickStart({ profile, highlights, hasTestimonials, onNavigate }) {
  const tasks = [
    { id: "missions", icon: icon.work, title: "See my projects", text: "Real work, with the goal, my role and the results." },
    { id: "services", icon: icon.services, title: "What I can do for you", text: "Services, what's included, and how to get started." },
    { id: "skills", icon: icon.skills, title: "My skills and tools", text: "What I'm good at and the software I use." },
    hasTestimonials
      ? { id: "testimonials", icon: icon.proof, title: "Client feedback", text: "What past clients say about working with me." }
      : { id: "experience", icon: icon.proof, title: "Experience and credentials", text: "My background, education and certificates." },
    { id: "resume", icon: icon.resume, title: "View or download my resume", text: "The full record, ready to save or share." },
    { id: "contact", icon: icon.contact, title: "Hire me or ask a question", text: "Send a message. I'll reply as soon as I can." },
  ];
  const stats = highlights.filter((item) => isFilled(item.value) && isFilled(item.label));

  return <section id="start" className="section section-start" aria-labelledby="start-title">
    <div className="container">
      <SectionHeader id="start-title" index="→" word="START" eyebrow="Start here" title={<>What are you <em>looking for?</em></>} text="Pick what matters to you and jump straight there. Everything on this site is only a click away." />

      {stats.length > 0 && <ul className="stat-strip scroll-fx" aria-label="Highlights">
        {stats.map((item, index) => <li key={`${item.label}-${index}`} className="stat">
          <b>{item.value}</b><span>{item.label}</span>{isFilled(item.note) && <small>{item.note}</small>}
        </li>)}
      </ul>}

      <ul className="quick-grid">
        {tasks.map((task, index) => <li key={task.id}>
          <button type="button" className="card quick-card tilt scroll-fx" style={{ "--stagger": index }} onClick={() => onNavigate(task.id)} {...tilt}>
            <span className="icon-badge"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={task.icon} /></svg></span>
            <span className="quick-copy"><strong>{task.title}</strong><span>{task.text}</span></span>
            <Arrow direction="right" />
          </button>
        </li>)}
      </ul>

      <p className="quick-foot scroll-fx"><span className="status-dot" aria-hidden="true" />{profile.availability}{isFilled(profile.email) && <> · <a href={`mailto:${profile.email}`}>{profile.email}</a></>}</p>
    </div>
  </section>;
}
