import { useEffect, useRef, useState } from "react";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import IntroExperience from "./components/IntroExperience";
import { About, Contact, Experience, Loadout, ProjectDialog, Projects, Services, Skills, Testimonials } from "./components/Sections";
import { Arrow } from "./components/ui";
import Resume from "./components/Resume";
import QuickStart from "./components/QuickStart";
import FloatingCta from "./components/FloatingCta";
import { isQuickMode } from "./lib/preferences";
import TeleportOverlay from "./components/TeleportOverlay";
import AmbientBackground from "./components/AmbientBackground";
import { scrollToElement, setScrollLocked, startSmoothScroll } from "./lib/scroll";
import { useScrollFX } from "./hooks/useScrollFX";
import { fallbackPortfolio, loadPortfolio } from "./services/portfolioRepository";
import { useWorldNavigation } from "./hooks/useWorldNavigation";

function App() {
  const [content, setContent] = useState(null);
  const [introComplete, setIntroComplete] = useState(isQuickMode);
  useEffect(() => {
    let cancelled = false;
    loadPortfolio().then(({ content: loaded }) => { if (!cancelled) setContent(loaded); });
    return () => { cancelled = true; };
  }, []);
  const [activeProject, setActiveProject] = useState(null);
  const { navigate, transition } = useWorldNavigation(fallbackPortfolio.worldDestinations);
  const pendingTarget = useRef(window.location.hash ? decodeURIComponent(window.location.hash.slice(1)) : null);
  useScrollFX(introComplete);

  useEffect(() => (introComplete ? startSmoothScroll() : undefined), [introComplete]);

  useEffect(() => {
    if (!introComplete || !pendingTarget.current) return;
    scrollToElement(document.getElementById(pendingTarget.current), { immediate: true });
    pendingTarget.current = null;
  }, [introComplete]);

  // Mission briefing dialog: focus trap, Escape to close, restore focus afterwards.
  useEffect(() => {
    if (!activeProject) return undefined;
    const previousFocus = document.activeElement;
    const onKeyDown = (event) => {
      if (event.key === "Escape") setActiveProject(null);
      if (event.key !== "Tab") return;
      const items = [...document.querySelectorAll(".project-dialog a[href], .project-dialog button:not([disabled]), .project-dialog video[controls]")];
      const first = items[0];
      const last = items.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.body.classList.add("dialog-open");
    setScrollLocked(true);
    document.addEventListener("keydown", onKeyDown);
    requestAnimationFrame(() => document.querySelector(".dialog-close")?.focus());
    return () => {
      document.body.classList.remove("dialog-open");
      setScrollLocked(false);
      document.removeEventListener("keydown", onKeyDown);
      previousFocus?.focus?.();
    };
  }, [activeProject]);

  // Escape anywhere below the hero returns to the world hub.
  useEffect(() => {
    if (!introComplete) return undefined;
    const onKeyDown = (event) => {
      if (event.key !== "Escape" || activeProject || document.querySelector(".navbar.menu-is-open") || window.scrollY < window.innerHeight * .5) return;
      event.preventDefault();
      navigate("home");
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [activeProject, introComplete, navigate]);

  if (introComplete && !content) return <div className="quick-loading" role="status">Loading portfolio…</div>;
  if (!introComplete || !content) return <IntroExperience profile={(content || fallbackPortfolio).profile} ready={Boolean(content)} onEnter={() => setIntroComplete(true)} />;
  const { profile, skills, projects, services, education, experience, certificates, resume, socialLinks, tools, testimonials, worldDestinations, highlights = [] } = content;

  return <div className="site-shell">
    <a className="skip-link" href="#about">Skip to content</a>
    <AmbientBackground />
    <Navbar onNavigate={navigate} />
    <main>
      <Hero profile={profile} destinations={worldDestinations} onNavigate={navigate} />
      <QuickStart profile={profile} highlights={highlights} hasTestimonials={testimonials.length > 0} onNavigate={navigate} />
      <About profile={profile} onNavigate={navigate} />
      <Skills skills={skills} onNavigate={navigate} />
      <Services services={services} email={profile.email} onNavigate={navigate} />
      <Projects projects={projects} onOpen={setActiveProject} onNavigate={navigate} />
      <Experience education={education} experience={experience} certificates={certificates} onNavigate={navigate} />
      <Loadout tools={tools} onNavigate={navigate} />
      <Testimonials testimonials={testimonials} onNavigate={navigate} />
      <Resume profile={profile} skills={skills} education={education} experience={experience} certificates={certificates} tools={tools} resume={resume} onNavigate={navigate} />
      <Contact profile={profile} socialLinks={socialLinks} resume={resume} onNavigate={navigate} />
    </main>
    <footer className="footer">
      <div className="container footer-inner">
        <span className="brand"><span className="brand-mark" aria-hidden="true"><i /><i /><i /><i /></span><span className="brand-name">LANZ<b>.SYS</b></span></span>
        <span className="footer-copy">
          <span>© {new Date().getFullYear()} {profile.name}. A Solo Leveling-inspired portfolio, built with React.</span>
          <small>Fan-inspired design with original artwork. Solo Leveling belongs to its respective owners; this site is not affiliated with or endorsed by them.</small>
        </span>
        <a className="footer-top" href="#home" onClick={(event) => { event.preventDefault(); navigate("home"); }}>Return to World <Arrow direction="up" /></a>
      </div>
    </footer>
    <ProjectDialog project={activeProject} onClose={() => setActiveProject(null)} />
    <FloatingCta onNavigate={navigate} />
    <TeleportOverlay transition={transition} />
  </div>;
}

export default App;
