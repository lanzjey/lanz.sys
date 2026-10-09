import { useEffect, useMemo, useRef, useState } from "react";
import { RoleTicker } from "./ui";
import { menuItems } from "../lib/menu";
import { isFilled, prefersReducedMotion } from "../lib/utils";

// The opening screen is a game menu: a tilted stack of sections with a red and white slash
// that follows the selection (hover, arrow keys, or tap), over a duotone portrait with layered parallax.
export default function Hero({ profile, projects, onNavigate }) {
  const [reducedMotion] = useState(prefersReducedMotion);
  const [active, setActive] = useState(3);
  const sectionRef = useRef(null);
  const roles = useMemo(() => profile.roles?.length ? profile.roles : [profile.role], [profile.roles, profile.role]);
  const words = profile.name.trim().split(/\s+/);
  const building = projects.find((project) => /ongoing|in progress/i.test(project.status) && isFilled(project.name));
  const cards = [
    isFilled(profile.availability) && { tag: "Now", text: profile.availability, target: "contact" },
    building && { tag: "Building", text: building.name, target: "projects" },
    isFilled(profile.playerClass) && { tag: "Studying", text: profile.playerClass, target: "about" },
  ].filter(Boolean);

  // Pointer parallax for the layered scene (mouse and pen only, one write per frame).
  useEffect(() => {
    const node = sectionRef.current;
    if (!node || reducedMotion || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return undefined;
    let frame = 0;
    let x = 0;
    let y = 0;
    const apply = () => { frame = 0; node.style.setProperty("--px", x.toFixed(3)); node.style.setProperty("--py", y.toFixed(3)); };
    const onMove = (event) => {
      x = event.clientX / window.innerWidth - .5;
      y = event.clientY / window.innerHeight - .5;
      if (!frame) frame = requestAnimationFrame(apply);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => { window.removeEventListener("pointermove", onMove); cancelAnimationFrame(frame); };
  }, [reducedMotion]);

  // Arrow keys and Enter drive the menu while the hero is on screen.
  useEffect(() => {
    const onKeyDown = (event) => {
      if (window.scrollY > window.innerHeight * .5 || event.target.closest?.("input, textarea, select, [role='dialog']")) return;
      if (event.key === "ArrowDown") { event.preventDefault(); setActive((value) => (value + 1) % menuItems.length); }
      else if (event.key === "ArrowUp") { event.preventDefault(); setActive((value) => (value - 1 + menuItems.length) % menuItems.length); }
      else if (event.key === "Enter" && !event.target.closest?.("a, button")) onNavigate(menuItems[active].id);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [active, onNavigate]);

  return <section ref={sectionRef} id="home" className="hero" aria-labelledby="hero-name">

    <div className="scene" aria-hidden="true">
      <i className="scene-word">Portfolio</i>
      <i className="scene-slash scene-slash-a" /><i className="scene-slash scene-slash-b" />
      <div className="scene-moon"><i /></div>
      <div className="scene-portrait"><img src="/assets/portrait-cutout.webp" alt="" width="720" height="1053" decoding="async" fetchPriority="high" /></div>
    </div>

    <div className="container hero-grid">
      <div className="hero-id reveal">
        <p className="hero-tag"><span className="live-dot" aria-hidden="true" />{profile.availability}</p>
        <h1 id="hero-name" className="hero-name" aria-label={profile.name}>
          {[words.slice(0, -1), words.slice(-1)].filter((line) => line.length).map((line, li) => <span key={li} className="cut-line" aria-hidden="true">
            {line.map((word, wj) => {
              const wi = li ? words.length - 1 : wj;
              return <span key={word} className="cut-word">
                {[...word].map((letter, i) => <i key={i} className={(i + wi) % 3 === 1 ? "is-dark" : ""} style={{ "--r": `${((i * 37 + wi * 19) % 7) - 3}deg` }}>{letter}</i>)}
              </span>;
            })}
          </span>)}
        </h1>
        <p className="hero-role"><RoleTicker words={roles} reducedMotion={reducedMotion} /></p>
      </div>

      <nav className="hero-menu reveal" style={{ "--d": ".15s", "--count": menuItems.length, "--i": active }} aria-label="Sections">
        <i className="slash" aria-hidden="true"><b /></i>
        <ul>
          {menuItems.map((item, index) => <li key={item.id}>
            <button type="button" className={index === active ? "is-active" : ""} onPointerEnter={(event) => { if (event.pointerType !== "touch") setActive(index); }} onFocus={() => setActive(index)} onClick={() => onNavigate(item.id)}>
              <span>{item.label}</span>
            </button>
          </li>)}
        </ul>
        <p className="hero-hint" aria-hidden="true"><kbd>↑</kbd><kbd>↓</kbd> choose <kbd>Enter</kbd> go</p>
      </nav>
    </div>
    {cards.length > 0 && <ul className="now-cards reveal" style={{ "--d": ".4s" }} aria-label="Currently">
      {cards.map((card, index) => <li key={card.tag} style={{ "--k": index }}>
        <button type="button" onClick={() => onNavigate(card.target)}><b>{card.tag}</b><span>{card.text}</span></button>
      </li>)}
    </ul>}
    <p className="scroll-cue" aria-hidden="true">Scroll</p>
  </section>;
}
