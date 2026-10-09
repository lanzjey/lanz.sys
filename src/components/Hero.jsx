import { useMemo, useState } from "react";
import FloatingWorld from "./world/FloatingWorld";
import { Arrow, HPBar, Typewriter } from "./ui";
import { pad, prefersReducedMotion } from "../lib/utils";

function NameLine({ word, offset, className = "" }) {
  return <span className={`hero-name-line ${className}`}>
    {[...word].map((char, index) => <span key={index} className="hero-char" style={{ "--i": offset + index }}>{char === " " ? " " : char}</span>)}
  </span>;
}

export default function Hero({ profile, destinations, onNavigate }) {
  const [activeDestination, setActiveDestination] = useState(null);
  const [reducedMotion] = useState(prefersReducedMotion);
  const words = profile.name.trim().split(/\s+/);
  const firstLine = words.length > 1 ? words.slice(0, -1).join(" ") : words[0];
  const lastLine = words.length > 1 ? words.at(-1) : "";
  const roles = useMemo(() => profile.roles?.length ? profile.roles : [profile.role], [profile.roles, profile.role]);
  const activeIndex = destinations.findIndex((destination) => destination.id === activeDestination);
  const selected = destinations[activeIndex];

  return <section id="home" className="hero" aria-labelledby="hero-name">
    <div className="hero-floor" aria-hidden="true" />
    <div className="hero-scroll-cue" aria-hidden="true"><span>Scroll to explore</span><i /></div>
    <div className="container hero-grid">
      <div className="hero-copy">
        <HPBar name={words[0]} className="hero-hp" />
        <p className="hero-kicker"><span className="status-dot" aria-hidden="true" />{profile.availability}</p>
        <h1 id="hero-name" className="hero-name" aria-label={profile.name}>
          <span aria-hidden="true">
            <NameLine word={firstLine} offset={0} />
            {lastLine && <NameLine word={lastLine} offset={firstLine.length} className="text-gradient" />}
          </span>
        </h1>
        <p className="hero-role"><span className="hero-prompt" aria-hidden="true">&gt;_</span><Typewriter words={roles} reducedMotion={reducedMotion} /></p>
        <p className="hero-intro">{profile.intro}</p>
        <div className="hero-actions">
          <button type="button" className="button button-primary button-large" onClick={() => onNavigate("missions")}>View my work <Arrow direction="right" /></button>
          <button type="button" className="button button-ghost button-large" onClick={() => onNavigate("contact")}>Hire me</button>
        </div>
        <button type="button" className="hero-link" onClick={() => onNavigate("resume")}>Or view my resume <Arrow direction="right" /></button>
      </div>

      <div className="hero-visual">
        <div className="hero-visual-glow" aria-hidden="true" />
        <FloatingWorld destinations={destinations} activeId={activeDestination} onActive={setActiveDestination} onSelect={onNavigate} reducedMotion={reducedMotion} />
        <span className="hud-corner hud-corner-tl" aria-hidden="true" /><span className="hud-corner hud-corner-tr" aria-hidden="true" />
        <span className="hud-corner hud-corner-bl" aria-hidden="true" /><span className="hud-corner hud-corner-br" aria-hidden="true" />
        <div className="hero-readout" aria-live="polite">
          <span className="hero-readout-label">{selected ? `Gate ${pad(activeIndex + 1)}` : "Gate hub"}</span>
          <strong>{selected ? selected.label : "LANZ.SYS · Hub"}</strong>
          <span className="hero-readout-detail">{selected ? selected.detail : `${destinations.length} gates are open around the central Gate. Select one to enter.`}</span>
        </div>
      </div>
    </div>

    <nav className="container hero-destinations" aria-label="World destinations">
      {destinations.map((destination, index) => <button key={destination.id} type="button" className={`destination ${activeDestination === destination.id ? "is-active" : ""}`} style={{ "--i": index }}
        onPointerEnter={() => setActiveDestination(destination.id)} onPointerLeave={() => setActiveDestination(null)}
        onFocus={() => setActiveDestination(destination.id)} onBlur={() => setActiveDestination(null)}
        onClick={() => onNavigate(destination.id)}>
        <span className="destination-index">{pad(index + 1)}</span>
        <span className="destination-label">{destination.label}</span>
        <span className="destination-sub">{destination.subtitle}</span>
      </button>)}
    </nav>
  </section>;
}
