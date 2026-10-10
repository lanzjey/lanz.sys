import { useContext, useEffect, useState } from "react";
import { NavContext } from "../lib/nav";
import { scrollToElement } from "../lib/scroll";
import { SCENES } from "../lib/scenes";
import { labelFor } from "../lib/menu";

// Moon phase glyph, drawn with SVG so it stays crisp at any size. `phase` runs 0-7
// (new moon → full moon → waning crescent) and tags each section like a calendar day.
export function Moon({ phase = 4, size = 22 }) {
  const p = (((phase % 8) + 8) % 8) / 8;
  const waxing = p <= .5;
  const k = Math.cos(2 * Math.PI * (waxing ? p : 1 - p));
  const rx = (10 * Math.abs(k)).toFixed(2);
  const lit = `M12 2A10 10 0 0 1 12 22A${rx} 10 0 0 ${k < 0 ? 1 : 0} 12 2Z`;
  return <svg className="moon-glyph" viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
    <circle cx="12" cy="12" r="10" className="moon-dark" />
    <path d={lit} className="moon-lit" transform={waxing ? undefined : "translate(24 0) scale(-1 1)"} />
    <circle cx="12" cy="12" r="10" className="moon-rim" />
  </svg>;
}

// Game-style button prompt that returns to the hero menu. Esc does the same.
export function BackToMenu() {
  const navigate = useContext(NavContext);
  return <button type="button" className="back-menu" onClick={() => navigate("home")}>
    <i aria-hidden="true" /><span>Back to Menu</span><kbd aria-hidden="true">Esc</kbd>
  </button>;
}

// Section title: a slanted tab with the moon phase, then the heading. `em` words become cyan slabs.
export function SectionHeader({ id, eyebrow, phase, title, text, word }) {
  return <header className="sec-head">
    {word && <span className="bg-word" aria-hidden="true">{word}</span>}
    <div className="sec-top">
      <p className="sec-tab"><Moon phase={phase} size={18} /><span>{eyebrow}</span><b className="sec-count">{String(Math.max(1, SCENES.indexOf(String(id).replace(/-title$/, "")))).padStart(2, "0")} / {String(SCENES.length - 1).padStart(2, "0")}</b></p>
      <BackToMenu />
    </div>
    <h2 id={id}>{title}</h2>
    {text && <p className="sec-lead">{text}</p>}
  </header>;
}

// Previous and next scene prompts at the end of every scene: the journey in narrative order.
export function SceneNav({ id }) {
  const navigate = useContext(NavContext);
  const index = SCENES.indexOf(id);
  const prev = SCENES[index - 1];
  const next = SCENES[index + 1];
  return <nav className="scene-nav" aria-label="Scenes">
    {prev && <button type="button" className="scene-step is-prev" onClick={() => navigate(prev)}><i aria-hidden="true" /><span><small>Previous</small>{labelFor(prev)}</span></button>}
    {next && <button type="button" className="scene-step is-next" onClick={() => navigate(next)}><span><small>Next</small>{labelFor(next)}</span><i aria-hidden="true" /></button>}
  </nav>;
}

export function Arrow({ direction = "up-right" }) {
  const paths = { "up-right": "M7 17 17 7M8 7h9v9", right: "M5 12h14M13 6l6 6-6 6", down: "M12 5v14M6 13l6 6 6-6", up: "M12 19V5M6 11l6-6 6 6", left: "M19 12H5M11 6l-6 6 6 6" };
  return <svg className="icon-arrow" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[direction]} /></svg>;
}

// Cycles through a list of words with a quick slide, no typing loop to wait for.
export function RoleTicker({ words, reducedMotion }) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (reducedMotion || words.length < 2) return undefined;
    const timer = window.setInterval(() => setIndex((value) => (value + 1) % words.length), 2800);
    return () => window.clearInterval(timer);
  }, [words, reducedMotion]);
  return <span className="role-ticker">
    <span key={index} className="role-word" aria-hidden="true">{words[index]}</span>
    <span className="sr-only">{words.join(", ")}</span>
  </span>;
}

// Expands a trimmed list. Collapsing carries the visitor back to the top of the section.
export function ShowMore({ hasMore, expanded, hidden, toggle }) {
  if (!hasMore) return null;
  const onClick = (event) => {
    if (expanded) scrollToElement(event.currentTarget.closest("section"));
    toggle();
  };
  return <div className="show-more">
    <button type="button" className="btn btn-ghost" aria-expanded={expanded} onClick={onClick}>
      <span>{expanded ? "Show less" : `Show more (+${hidden})`}</span>
      <Arrow direction={expanded ? "up" : "down"} />
    </button>
  </div>;
}
