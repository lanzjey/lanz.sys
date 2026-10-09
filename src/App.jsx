import { useCallback, useEffect, useRef, useState } from "react";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Intro from "./components/Intro";
import Resume from "./components/Resume";
import ProjectPanel from "./components/ProjectPanel";
import { About, Certificates, Contact, Experience, Projects, Services, Skills, Testimonials } from "./components/Sections";
import { Arrow } from "./components/ui";
import { prefersReducedMotion } from "./lib/utils";
import { scrollToElement, setScrollLocked, startSmoothScroll } from "./lib/scroll";
import { useScrollFX } from "./hooks/useScrollFX";
import { fallbackPortfolio, loadPortfolio } from "./services/portfolioRepository";

const INTRO_KEY = "jlm-intro-seen";
const sectionAlias = { missions: "projects", profile: "about", loadout: "skills", education: "experience" };

const introSeen = () => {
  if (prefersReducedMotion()) return true;
  try { return window.sessionStorage.getItem(INTRO_KEY) === "1"; } catch { return false; }
};

function App() {
  const [content, setContent] = useState(null);
  const [introDone, setIntroDone] = useState(introSeen);
  const [ready, setReady] = useState(introSeen);
  const [wipe, setWipe] = useState("");
  const [activeProject, setActiveProject] = useState(null);
  const pendingTarget = useRef(window.location.hash ? decodeURIComponent(window.location.hash.slice(1)) : null);
  const wipeTimers = useRef([]);
  useScrollFX(introDone && Boolean(content));

  useEffect(() => {
    let cancelled = false;
    loadPortfolio().then(({ content: loaded }) => { if (!cancelled) setContent(loaded); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => (introDone && content ? startSmoothScroll() : undefined), [introDone, content]);
  useEffect(() => () => wipeTimers.current.forEach(window.clearTimeout), []);

  const onIntroExit = useCallback(() => setReady(true), []);
  const onIntroDone = useCallback(() => {
    try { window.sessionStorage.setItem(INTRO_KEY, "1"); } catch { /* the intro simply plays again next visit */ }
    setIntroDone(true);
  }, []);

  useEffect(() => {
    if (!introDone || !content || !pendingTarget.current) return;
    scrollToElement(document.getElementById(sectionAlias[pendingTarget.current] || pendingTarget.current), { immediate: true });
    pendingTarget.current = null;
  }, [introDone, content]);

  // Jumping across the page plays a short diagonal wipe, then lands on the section.
  const navigate = useCallback((id) => {
    const target = document.getElementById(sectionAlias[id] || id);
    if (!target) return;
    try { window.history.replaceState(null, "", `#${target.id}`); } catch { /* the address bar just stays as it was */ }
    const far = Math.abs(target.getBoundingClientRect().top) > window.innerHeight * 1.4;
    if (!far || prefersReducedMotion()) { scrollToElement(target); return; }
    wipeTimers.current.forEach(window.clearTimeout);
    setWipe("in");
    wipeTimers.current = [
      window.setTimeout(() => { scrollToElement(target, { immediate: true }); setWipe("out"); }, 340),
      window.setTimeout(() => setWipe(""), 860),
    ];
  }, []);

  const panelOpen = activeProject !== null;
  useEffect(() => {
    if (!panelOpen) return undefined;
    const previousFocus = document.activeElement;
    const main = document.getElementById("main");
    if (main) main.inert = true;
    setScrollLocked(true);
    return () => {
      if (main) main.inert = false;
      setScrollLocked(false);
      previousFocus?.focus?.();
    };
  }, [panelOpen]);

  const profile = (content || fallbackPortfolio).profile;
  const showSite = introDone && content;
  const initials = profile.name.split(/\s+/).filter(Boolean).map((word) => word[0]).slice(0, 2).join("").toUpperCase();

  return <>
    {!introDone && <Intro name={profile.name} onExit={onIntroExit} onDone={onIntroDone} />}
    {introDone && !content && <div className="loading" role="status">Loading portfolio…</div>}
    {content && <div className={`site-shell ${ready ? "is-ready" : ""}`}>
      <a className="skip-link" href="#about">Skip to content</a>
      <Navbar onNavigate={navigate} brand={initials} />
      <main id="main">
        <Hero profile={content.profile} onNavigate={navigate} />
        <About profile={content.profile} onNavigate={navigate} />
        <Skills skills={content.skills} tools={content.tools} />
        <Services services={content.services} email={content.profile.email} onNavigate={navigate} />
        <Projects projects={content.projects} onOpen={setActiveProject} />
        <Experience education={content.education} experience={content.experience} />
        <Certificates certificates={content.certificates} />
        <Testimonials testimonials={content.testimonials} />
        <Resume profile={content.profile} skills={content.skills} education={content.education} experience={content.experience} certificates={content.certificates} tools={content.tools} resume={content.resume} />
        <Contact profile={content.profile} socialLinks={content.socialLinks} resume={content.resume} />
      </main>
      <footer className="footer">
        <div className="container footer-inner">
          <span className="footer-brand">{profile.name}</span>
          <span className="footer-copy">
            <span>© {new Date().getFullYear()} {profile.name}. Built with React.</span>
            <small>Design inspired by Persona 3 Reload, with original artwork. Persona belongs to its respective owners; this site is not affiliated with or endorsed by them.</small>
          </span>
          <a className="text-link" href="#home" onClick={(event) => { event.preventDefault(); navigate("home"); }}>Back to top <Arrow direction="up" /></a>
        </div>
      </footer>
      {panelOpen && showSite && <ProjectPanel projects={content.projects} index={activeProject} onChange={setActiveProject} onClose={() => setActiveProject(null)} />}
      <div className={`wipe ${wipe ? `is-${wipe}` : ""}`} aria-hidden="true"><i /><i /></div>
    </div>}
  </>;
}

export default App;
