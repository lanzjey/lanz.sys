import { useCallback, useEffect, useRef, useState } from "react";
import LinkStartTunnel from "./LinkStartTunnel";
import { Arrow } from "./ui";
import { prefersReducedMotion } from "../lib/utils";
import { setQuickMode } from "../lib/preferences";

// The System scans the visitor, then asks whether they accept the invitation to enter.
const checks = ["Scanning player", "Verifying identity", "Locating gate", "Syncing System"];
const LINK_START_MS = 2300;

// Phases: 0 sensory check → 1 LINK START tunnel → 2 welcome / login.
export default function IntroExperience({ profile, onEnter, ready = true }) {
  const enterTimer = useRef(null);
  const [reducedMotion] = useState(prefersReducedMotion);
  const [phase, setPhase] = useState(reducedMotion ? 2 : 0);
  const [checked, setChecked] = useState(reducedMotion ? checks.length : 0);
  const [requested, setRequested] = useState(false);
  const [declined, setDeclined] = useState(false);
  const exiting = requested && ready;

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

  // Entering waits for the portfolio content; the exit plays once it has arrived.
  const enter = useCallback(() => setRequested(true), []);
  const decline = () => { setDeclined(true); window.setTimeout(() => setDeclined(false), 2200); };
  useEffect(() => {
    if (!exiting) return undefined;
    enterTimer.current = window.setTimeout(onEnter, reducedMotion ? 0 : 900);
    return () => window.clearTimeout(enterTimer.current);
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

  const nameWords = profile.name.split(/\s+/);
  const speed = exiting ? 2.6 : phase === 1 ? 1.5 : phase === 2 ? .12 : .05;

  return <main className={`intro intro-phase-${phase} ${exiting ? "is-exiting" : ""}`} aria-label="LANZ.SYS login sequence">
    <LinkStartTunnel speed={speed} colorful={phase === 1 || exiting} reducedMotion={reducedMotion} />
    <div className="intro-rings" aria-hidden="true"><i /><i /><i /></div>
    <div className="intro-flash" aria-hidden="true" />

    <header className="intro-topbar">
      <span className="brand"><span className="brand-mark" aria-hidden="true"><i /><i /><i /><i /></span><span className="brand-name">LANZ<b>.SYS</b></span></span>
      <button className="intro-skip" type="button" onClick={() => { enter(); setPhase(2); }} disabled={exiting}>Skip <kbd>Esc</kbd></button>
    </header>

    <div className="intro-stage">
      <section className="intro-check sys-window" aria-label="System scan" aria-hidden={phase !== 0}>
        <div className="sys-window-title"><span className="sys-diamond" aria-hidden="true" />System scan</div>
        <ul>
          {checks.map((label, index) => <li key={label} className={index < checked ? "is-ok" : ""}>
            <span>{label}</span><span className="intro-check-dots" aria-hidden="true" /><b>{index < checked ? "OK" : "··"}</b>
          </li>)}
        </ul>
        <p className="intro-check-foot">Player: {profile.name.split(" ")[0].toLowerCase()} · Rank: unassigned</p>
      </section>

      <h1 className="intro-linkstart" aria-hidden={phase !== 1}><span>Gate</span> <span>Open</span></h1>

      {phase === 2 && <section className="intro-ready" aria-labelledby="intro-title">
        <p className="intro-welcome"><b>[ SYSTEM ]</b> A new gate has appeared. You have been chosen as a Player.</p>
        <h1 id="intro-title" className="intro-name"><span>{nameWords.slice(0, -1).join(" ")}</span><span className="text-gradient">{nameWords.at(-1)}</span></h1>
        <p className="intro-role">{profile.role}</p>
        <div className="intro-choices">
          <button className="button button-primary button-large" type="button" onClick={enter} disabled={exiting} autoFocus>{requested && !ready ? "Syncing world data…" : <>Accept <Arrow direction="right" /></>}</button>
          <button className="button button-ghost button-large" type="button" onClick={decline} disabled={exiting}>Decline</button>
        </div>
        <p className="intro-declined" role="status">{declined ? "[ SYSTEM ] Declined. The System will ask again…" : ""}</p>
        <button className="intro-quick" type="button" onClick={() => { setQuickMode(true); enter(); }} disabled={exiting}>Quick view</button>
        <p className="intro-hint">Quick view skips the animations. Or press <kbd>Enter</kbd> to accept.</p>
      </section>}
    </div>

    <footer className="intro-footer"><span>Shadow dungeon portfolio</span><span>{["Scanning", "Opening gate", "Awaiting response"][phase]}</span></footer>
  </main>;
}
