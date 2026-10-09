import { useMemo, useState } from "react";
import { Arrow, RoleTicker } from "./ui";
import { prefersReducedMotion } from "../lib/utils";

export default function Hero({ profile, onNavigate }) {
  const [reducedMotion] = useState(prefersReducedMotion);
  const words = profile.name.trim().split(/\s+/);
  const lines = words.length > 2 ? [words[0], words.slice(1, -1).join(" "), words.at(-1)] : words;
  const roles = useMemo(() => profile.roles?.length ? profile.roles : [profile.role], [profile.roles, profile.role]);

  return <section id="home" className="hero" aria-labelledby="hero-name">
    <div className="hero-art" aria-hidden="true">
      <i className="shard shard-a" /><i className="shard shard-b" />
      <div className="moon-wrap"><div className="moon" /><i className="moon-orbit" /><i className="moon-orbit moon-orbit-2" /></div>
    </div>
    <div className="container hero-grid">
      <div className="hero-copy">
        <p className="hero-tag reveal"><span>{profile.playerClass || "Portfolio"}</span><span className="live"><i aria-hidden="true" />{profile.availability}</span></p>
        <h1 id="hero-name" className="hero-name reveal" style={{ "--d": ".08s" }} aria-label={profile.name}>
          {lines.map((line, index) => <span key={line} aria-hidden="true" className={index === 1 ? "is-accent" : ""}>{line}</span>)}
        </h1>
        <p className="hero-role reveal" style={{ "--d": ".16s" }}><RoleTicker words={roles} reducedMotion={reducedMotion} /></p>
        <p className="hero-intro reveal" style={{ "--d": ".22s" }}>{profile.intro}</p>
        <div className="hero-actions reveal" style={{ "--d": ".3s" }}>
          <button type="button" className="btn btn-fill" onClick={() => onNavigate("projects")}><span>View my work</span><Arrow direction="right" /></button>
          <button type="button" className="btn" onClick={() => onNavigate("contact")}><span>Hire me</span></button>
        </div>
        <button type="button" className="text-link reveal" style={{ "--d": ".36s" }} onClick={() => onNavigate("resume")}>Or view my resume <Arrow direction="right" /></button>
      </div>
    </div>
    <p className="scroll-cue" aria-hidden="true">Scroll</p>
  </section>;
}
