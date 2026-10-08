import { useEffect, useRef, useState } from "react";
import { Arrow } from "./ui";

const links = [
  ["home", "Home"], ["about", "Profile"], ["skills", "Skills"], ["services", "Services"],
  ["projects", "Missions"], ["experience", "Experience"], ["loadout", "Loadout"], ["resume", "Resume"], ["contact", "Contact"],
];

export default function Navbar({ onNavigate }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("home");
  const [scrolled, setScrolled] = useState(false);
  const toggleRef = useRef(null);
  const progressRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible) setActive(visible.target.id);
    }, { rootMargin: "-35% 0px -55% 0px", threshold: [0, .1, .4] });
    document.querySelectorAll("main > section[id]").forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setScrolled(window.scrollY > 12);
      progressRef.current?.style.setProperty("--progress", `${max > 0 ? window.scrollY / max : 0}`);
    };
    const onScroll = () => { if (!frame) frame = window.requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { window.removeEventListener("scroll", onScroll); window.cancelAnimationFrame(frame); };
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const closeOnEscape = (event) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      toggleRef.current?.focus();
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  const go = (event, id) => {
    event.preventDefault();
    if (open) toggleRef.current?.focus();
    setOpen(false);
    onNavigate(id);
  };

  return <header className={`navbar ${scrolled ? "is-scrolled" : ""} ${open ? "menu-is-open" : ""}`}>
    <div className="navbar-inner">
      <a className="brand" href="#home" onClick={(event) => go(event, "home")} aria-label="LANZ.SYS, back to start">
        <span className="brand-mark" aria-hidden="true"><i /><i /><i /><i /></span>
        <span className="brand-name">LANZ<b>.SYS</b></span>
      </a>
      <nav id="primary-navigation" data-lenis-prevent className={`nav-links ${open ? "open" : ""}`} aria-label="Primary navigation">
        {links.map(([id, label]) => <a key={id} className={active === id ? "active" : ""} href={`#${id}`} aria-current={active === id ? "location" : undefined} onClick={(event) => go(event, id)}>{label}</a>)}
        <a className="button button-primary button-small nav-cta" href="#contact" onClick={(event) => go(event, "contact")}>Let's talk <Arrow /></a>
      </nav>
      <button ref={toggleRef} type="button" className="menu-toggle" aria-label={open ? "Close navigation" : "Open navigation"} aria-expanded={open} aria-controls="primary-navigation" onClick={() => setOpen(!open)}>
        <span /><span /><span />
      </button>
    </div>
    <span ref={progressRef} className="scroll-progress" aria-hidden="true" />
  </header>;
}
