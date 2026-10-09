import { useEffect, useRef, useState } from "react";
import { Moon } from "./ui";
import { setScrollLocked } from "../lib/scroll";
import { menuItems } from "../lib/menu";

const links = [{ id: "home", label: "Home" }, ...menuItems];

// The persistent menu: a vertical list on wide screens, a full-screen sheet on phones and tablets.
// The current section is the cyan slab.
export default function Navbar({ onNavigate, brand }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("home");
  const toggleRef = useRef(null);
  const listRef = useRef(null);
  const progressRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible) setActive(visible.target.id);
    }, { rootMargin: "-40% 0px -50% 0px", threshold: [0, .1, .4] });
    document.querySelectorAll("main > section[id]").forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      progressRef.current?.style.setProperty("--progress", `${max > 0 ? Math.min(1, window.scrollY / max) : 0}`);
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { window.removeEventListener("scroll", onScroll); cancelAnimationFrame(frame); };
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    setScrollLocked(true);
    listRef.current?.querySelector("a")?.focus();
    const onKeyDown = (event) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      toggleRef.current?.focus();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => { setScrollLocked(false); document.removeEventListener("keydown", onKeyDown); };
  }, [open]);

  const go = (event, id) => {
    event.preventDefault();
    setOpen(false);
    onNavigate(id);
  };

  return <>
    <header className="topbar">
      <a className="brand" href="#home" onClick={(event) => go(event, "home")} aria-label={`${brand}, back to top`}>{brand}<b>/</b></a>
      <button ref={toggleRef} type="button" className="menu-toggle" aria-expanded={open} aria-controls="primary-menu" onClick={() => setOpen(!open)}>
        <span>{open ? "Close" : "Menu"}</span>
      </button>
      <span ref={progressRef} className="scroll-progress" aria-hidden="true" />
    </header>
    <nav id="primary-menu" ref={listRef} data-lenis-prevent className={`menu ${open ? "is-open" : ""} ${active === "home" ? "is-hero" : ""}`} aria-label="Primary">
      <ul>
        {links.map(({ id, label }, index) => <li key={id}>
          <a className={active === id ? "on" : ""} href={`#${id}`} aria-current={active === id ? "location" : undefined} onClick={(event) => go(event, id)}>
            <Moon phase={index} size={16} /><span>{label}</span>
          </a>
        </li>)}
      </ul>
    </nav>
  </>;
}
