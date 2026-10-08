import { useCallback, useEffect, useRef, useState } from "react";
import LinkStartTunnel from "./LinkStartTunnel";
import { Arrow } from "./ui";
import { prefersReducedMotion } from "../lib/utils";

// A nod to the full-dive sensory check before logging in.
const checks = ["Touch", "Sight", "Hearing", "Taste", "Smell"];
const LINK_START_MS = 2300;

// Phases: 0 sensory check → 1 LINK START tunnel → 2 welcome / login.
export default function IntroExperience({ profile, onEnter }) {
  const enterTimer = useRef(null);
  const [reducedMotion] = useState(prefersReducedMotion);
  const [phase, setPhase] = useState(reducedMotion ? 2 : 0);
  const [checked, setChecked] = useState(reducedMotion ? checks.length : 0);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (phase !== 0) return undefined;
    const timer = window.setTimeout(() => {
      if (checked < checks.length) setChecked(checked + 1);
      else setPhase(1);
    }, checked === 0 ? 700 : checked < checks.length ? 260 : 650);
    return () => window.clearTimeout(timer);
  }, [phase, checked]);

  useEffect(() => {
    if (phase !== 1) return undefined;
    const timer = window.setTimeout(() => setPhase(2), LINK_START_MS);
    return () => window.clearTimeout(timer);
  }, [phase]);

  const enter = useCallback(() => {
    if (exiting) return;
    setExiting(true);
    if (reducedMotion) onEnter();
    else enterTimer.current = window.setTimeout(onEnter, 900);
  }, [exiting, onEnter, reducedMotion]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") enter();
      if (event.key === "Enter" && !event.repeat && !event.target.closest?.("button, a, input, textarea, select")) {
        event.preventDefault();
        enter();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [enter]);
  useEffect(() => () => window.clearTimeout(enterTimer.current), []);

  const nameWords = profile.name.split(/\s+/);
  const speed = exiting ? 2.6 : phase === 1 ? 1.5 : phase === 2 ? .12 : .05;

  return <main className={`intro intro-phase-${phase} ${exiting ? "is-exiting" : ""}`} aria-label="LANZ.SYS login sequence">
    <LinkStartTunnel speed={speed} colorful={phase === 1 || exiting} reducedMotion={reducedMotion} />
    <div className="intro-rings" aria-hidden="true"><i /><i /><i /></div>
    <div className="intro-flash" aria-hidden="true" />

    <header className="intro-topbar">
      <span className="brand"><span className="brand-mark" aria-hidden="true"><i /><i /><i /><i /></span><span className="brand-name">LANZ<b>.SYS</b></span></span>
      <button className="intro-skip" type="button" onClick={enter} disabled={exiting}>Skip <kbd>Esc</kbd></button>
    </header>

    <div className="intro-stage">
      <section className="intro-check sao-window" aria-label="Sensory check" aria-hidden={phase !== 0}>
        <div className="sao-window-title"><span className="sao-diamond" aria-hidden="true" />System check</div>
        <ul>
          {checks.map((label, index) => <li key={label} className={index < checked ? "is-ok" : ""}>
            <span>{label}</span><span className="intro-check-dots" aria-hidden="true" /><b>{index < checked ? "OK" : "··"}</b>
          </li>)}
        </ul>
        <p className="intro-check-foot">Language: English · Account: {profile.name.split(" ")[0].toLowerCase()}</p>
      </section>

      <h1 className="intro-linkstart" aria-hidden={phase !== 1}><span>Link</span> <span>Start</span></h1>

      {phase === 2 && <section className="intro-ready" aria-labelledby="intro-title">
        <p className="intro-welcome">Welcome to <b>LANZ.SYS</b></p>
        <h1 id="intro-title" className="intro-name"><span>{nameWords.slice(0, -1).join(" ")}</span><span className="text-gradient">{nameWords.at(-1)}</span></h1>
        <p className="intro-role">{profile.role}</p>
        <button className="button button-primary button-large" type="button" onClick={enter} disabled={exiting} autoFocus>Enter world <Arrow direction="right" /></button>
        <p className="intro-hint">or press <kbd>Enter</kbd></p>
      </section>}
    </div>

    <footer className="intro-footer"><span>Full-dive portfolio environment</span><span>{["Checking", "Connecting", "Ready"][phase]}</span></footer>
  </main>;
}
