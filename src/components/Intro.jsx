import { useEffect, useRef, useState } from "react";

// A three-second opening. A blue and white speed-line burst slams the name in, the screen turns
// to the Dark Hour (green moon, clock running past midnight), then a stamp and a slash wipe
// hand over to the page. Any key, click or the Skip button ends it early.
const EXIT_MS = 2450;
const DONE_MS = 3050;

export default function Intro({ name, onExit, onDone }) {
  const [exiting, setExiting] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const finished = useRef(false);
  const timers = useRef([]);
  const words = name.trim().split(/\s+/);
  const first = words[0] || name;
  const second = words.length > 2 ? words[1] : words[1] || "";

  useEffect(() => {
    const later = (fn, ms) => timers.current.push(window.setTimeout(fn, ms));
    later(() => { setExiting(true); onExit(); }, EXIT_MS);
    later(() => { finished.current = true; onDone(); }, DONE_MS);
    // The clock runs from midnight up to the half minute while the Dark Hour screen is up.
    const clock = window.setInterval(() => setSeconds((value) => Math.min(37, value + 1)), 34);
    later(() => window.clearInterval(clock), 1500);
    const pending = timers.current;
    return () => { pending.forEach(window.clearTimeout); window.clearInterval(clock); };
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

  return <div className={`intro ${exiting ? "is-exiting" : ""}`} role="dialog" aria-modal="true" aria-label="Opening animation" onPointerDown={skip}>
    <div className="intro-burst" aria-hidden="true"><i /><i /></div>
    <div className="intro-words" aria-hidden="true">
      <span style={{ "--i": 0 }}>{first}</span>
      {second && <span style={{ "--i": 1 }}>{second}</span>}
    </div>
    <div className="intro-dh" aria-hidden="true">
      <i className="intro-moon" />
      <p className="intro-clock"><small>AM</small>00<b>:</b>00<b>:</b>{String(seconds).padStart(2, "0")}</p>
      <p className="intro-stamp">Portfolio</p>
    </div>
    <div className="intro-flash" aria-hidden="true" />
    <div className="intro-slab intro-slab-a" aria-hidden="true" />
    <div className="intro-slab intro-slab-b" aria-hidden="true" />
    <button type="button" className="intro-skip" onPointerDown={(event) => event.stopPropagation()} onClick={skip}>Skip <kbd>Esc</kbd></button>
  </div>;
}
