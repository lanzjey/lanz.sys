import { useCallback, useEffect, useRef, useState } from "react";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Intro from "./components/Intro";
import Resume from "./components/Resume";
import Backdrop from "./components/Backdrop";
import Transition from "./components/Transition";
import SceneStage from "./components/SceneStage";
import ProjectPanel from "./components/ProjectPanel";
import { About, Certificates, Contact, Projects, Services, Skills } from "./components/Sections";
import { SceneNav } from "./components/ui";
import { prefersReducedMotion } from "./lib/utils";
import { labelFor } from "./lib/menu";
import { NavContext } from "./lib/nav";
import { SCENES, sceneFromLocation, transitionKind, urlFor } from "./lib/scenes";
import { setScrollLocked } from "./lib/scroll";
import { fallbackPortfolio, loadPortfolio } from "./services/portfolioRepository";

const INTRO_KEY = "jlm-intro-seen";
const COVER_MS = 380;
const REVEAL_MS = 440;

const introSeen = () => {
  if (prefersReducedMotion()) return true;
  try { return window.sessionStorage.getItem(INTRO_KEY) === "1"; } catch { return false; }
};

function Footer({ name }) {
  return <footer className="footer">
    <div className="container footer-inner">
      <span className="footer-brand">lanz<b>.sys</b></span>
      <span className="footer-copy">
        <span>© {new Date().getFullYear()} {name}. Built with React.</span>
        <small>Design inspired by Persona 3 Reload, with original artwork. Persona belongs to its respective owners; this site is not affiliated with or endorsed by them.</small>
      </span>
    </div>
  </footer>;
}

function App() {
  const [content, setContent] = useState(null);
  const [introDone, setIntroDone] = useState(introSeen);
  const [ready, setReady] = useState(introSeen);
  const [scene, setScene] = useState(sceneFromLocation);
  const [tx, setTx] = useState(null);
  const [activeProject, setActiveProject] = useState(null);
  const targetRef = useRef(scene);
  const timers = useRef([]);
  const firstScene = useRef(true);

  useEffect(() => {
    let cancelled = false;
    loadPortfolio().then(({ content: loaded }) => { if (!cancelled) setContent(loaded); });
    return () => { cancelled = true; };
  }, []);

  const onIntroExit = useCallback(() => setReady(true), []);
  const onIntroDone = useCallback(() => {
    try { window.sessionStorage.setItem(INTRO_KEY, "1"); } catch { /* the intro simply plays again next visit */ }
    setIntroDone(true);
  }, []);

  // One history entry per scene change. Re-opening the current scene adds nothing. If a transition
  // is still playing, it is finished instantly so navigation never waits on an animation.
  const go = useCallback((id, { push = true } = {}) => {
    if (!SCENES.includes(id) || id === targetRef.current) return;
    if (timers.current.length) {
      timers.current.forEach(window.clearTimeout);
      timers.current = [];
      setScene(targetRef.current);
      setTx(null);
    }
    const from = targetRef.current;
    targetRef.current = id;
    if (push) { try { window.history.pushState({ scene: id }, "", urlFor(id)); } catch { /* history unavailable: the scene still changes */ } }
    if (prefersReducedMotion()) { setScene(id); return; }
    setTx({ kind: transitionKind(from, id), phase: "in", label: labelFor(id) });
    timers.current = [
      window.setTimeout(() => { setScene(id); setTx((current) => current && { ...current, phase: "out" }); }, COVER_MS),
      window.setTimeout(() => { setTx(null); timers.current = []; }, COVER_MS + REVEAL_MS),
    ];
  }, []);

  useEffect(() => {
    try { window.history.replaceState({ scene: targetRef.current }, "", urlFor(targetRef.current)); } catch { /* ignore */ }
    const onPop = () => go(sceneFromLocation(), { push: false });
    window.addEventListener("popstate", onPop);
    return () => { window.removeEventListener("popstate", onPop); timers.current.forEach(window.clearTimeout); };
  }, [go]);

  // Move focus into the new scene so keyboard and screen-reader users start at its top.
  useEffect(() => {
    if (firstScene.current) { firstScene.current = false; return; }
    document.querySelector(".scene")?.focus({ preventScroll: true });
  }, [scene]);

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

  // Esc returns to the hub; the arrow keys step through the journey.
  useEffect(() => {
    if (!introDone || !content) return undefined;
    const onKeyDown = (event) => {
      if (panelOpen || event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || document.querySelector(".menu.is-open")) return;
      if (event.target.closest?.("input, textarea, select, [contenteditable], .panel-shots")) return;
      const index = SCENES.indexOf(targetRef.current);
      if (event.key === "Escape" && index > 0) go("home");
      else if (event.key === "ArrowRight" && index > 0 && index < SCENES.length - 1) go(SCENES[index + 1]);
      else if (event.key === "ArrowLeft" && index > 0) go(SCENES[index - 1]);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [introDone, content, panelOpen, go]);

  const profile = (content || fallbackPortfolio).profile;
  const index = SCENES.indexOf(scene);

  const renderScene = () => {
    switch (scene) {
      case "about": return <About profile={content.profile} education={content.education} experience={content.experience} onNavigate={go} />;
      case "projects": return <Projects projects={content.projects} onOpen={setActiveProject} />;
      case "skills": return <Skills skills={content.skills} tools={content.tools} />;
      case "services": return <Services services={content.services} email={content.profile.email} onNavigate={go} />;
      case "certificates": return <Certificates certificates={content.certificates} />;
      case "resume": return <Resume profile={content.profile} skills={content.skills} education={content.education} experience={content.experience} certificates={content.certificates} tools={content.tools} resume={content.resume} />;
      case "contact": return <Contact profile={content.profile} socialLinks={content.socialLinks} resume={content.resume} />;
      default: return <Hero profile={content.profile} projects={content.projects} onNavigate={go} />;
    }
  };

  return <>
    {!introDone && <Intro name={profile.name} onExit={onIntroExit} onDone={onIntroDone} />}
    {introDone && !content && <div className="loading" role="status">Loading portfolio…</div>}
    {content && <NavContext.Provider value={go}>
      <div className={`site-shell ${ready ? "is-ready" : ""}`}>
        <Backdrop scene={scene} />
        <SceneStage scene={scene} />
        <button type="button" className="skip-link" onClick={() => document.querySelector(".scene")?.focus()}>Skip to content</button>
        <Navbar onNavigate={go} scene={scene} brand="lanz.sys" />
        <span className="thread" style={{ "--p": index / (SCENES.length - 1) }} aria-hidden="true" />
        <main id="main">
          <div key={scene} className={`scene scene-${scene}`} data-scene={scene} tabIndex={-1} aria-label={labelFor(scene)}>
            {renderScene()}
            {scene !== "home" && <>
              <SceneNav id={scene} />
              <Footer name={profile.name} />
            </>}
          </div>
        </main>
        <p className="sr-only" role="status" aria-live="polite">{labelFor(scene)}</p>
        {panelOpen && <ProjectPanel projects={content.projects} index={activeProject} onChange={setActiveProject} onClose={() => setActiveProject(null)} />}
        <Transition tx={tx} />
      </div>
    </NavContext.Provider>}
  </>;
}

export default App;
