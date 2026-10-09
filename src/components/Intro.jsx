import { useEffect, useRef, useState } from "react";

// A two-second opening: the clock reaches midnight, the screen flashes the Dark Hour green,
// then a blue slash wipes away to reveal the page. Any key, click or the Skip button ends it early.
const EXIT_MS = 1450;
const DONE_MS = 2100;

export default function Intro({ name, onExit, onDone }) {
  const [midnight, setMidnight] = useState(false);
  const [exiting, setExiting] = useState(false);
  const finished = useRef(false);
  const timers = useRef([]);
  const words = name.trim().split(/\s+/);

  useEffect(() => {
    const later = (fn, ms) => timers.current.push(window.setTimeout(fn, ms));
    later(() => setMidnight(true), 850);
    later(() => { setExiting(true); onExit(); }, EXIT_MS);
    later(() => { finished.current = true; onDone(); }, DONE_MS);
    const pending = timers.current;
    return () => pending.forEach(window.clearTimeout);
  }, [onExit, onDone]);

  const skip = () => {
    if (finished.current) return;
    finished.current = true;
    timers.current.forEach(window.clearTimeout);
    onExit();
    onDone();
  };

  useEffect(() => {
    const onKey = (event) => { if (event.key === "Escape" || event.key === "Enter" || event.key === " ") skip(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return <div className={`intro ${midnight ? "is-midnight" : ""} ${exiting ? "is-exiting" : ""}`} role="dialog" aria-modal="true" aria-label="Opening animation" onPointerDown={skip}>
    <div className="intro-slab intro-slab-a" aria-hidden="true" />
    <div className="intro-slab intro-slab-b" aria-hidden="true" />
    <div className="intro-center">
      <svg className="intro-clock" viewBox="0 0 200 200" aria-hidden="true">
        <circle className="clock-ring" cx="100" cy="100" r="92" />
        <circle className="clock-ring clock-ring-inner" cx="100" cy="100" r="76" />
        {Array.from({ length: 12 }, (_, i) => <line key={i} className="clock-tick" x1="100" y1="12" x2="100" y2={i % 3 === 0 ? 30 : 22} transform={`rotate(${i * 30} 100 100)`} />)}
        <line className="clock-hand" x1="100" y1="100" x2="100" y2="34" />
        <circle className="clock-pin" cx="100" cy="100" r="5" />
      </svg>
      <p className="intro-time" aria-hidden="true">{midnight ? "00:00" : "23:59"}</p>
      <h1 className="intro-name">{words.map((word, index) => <span key={word + index} style={{ "--i": index }}>{word}</span>)}</h1>
      <p className="intro-sub">Portfolio</p>
    </div>
    <button type="button" className="intro-skip" onPointerDown={(event) => event.stopPropagation()} onClick={skip}>Skip <kbd>Esc</kbd></button>
  </div>;
}
