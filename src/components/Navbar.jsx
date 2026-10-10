import { useEffect, useRef, useState } from "react";
import { Moon } from "./ui";
import { setScrollLocked } from "../lib/scroll";
import { menuItems } from "../lib/menu";

const links = [{ id: "home", label: "Home" }, ...menuItems];

// The persistent menu: a vertical list on wide screens, a full-screen sheet on phones and tablets.
// The current section is the cyan slab.
export default function Navbar({ onNavigate, brand, scene }) {
  const [open, setOpen] = useState(false);
  const active = scene;
  const toggleRef = useRef(null);
  const listRef = useRef(null);

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
      <a className="brand" href="#home" onClick={(event) => go(event, "home")} aria-label={`${brand}, back to top`}>lanz<b>.sys</b></a>
      <button ref={toggleRef} type="button" className="menu-toggle" aria-expanded={open} aria-controls="primary-menu" onClick={() => setOpen(!open)}>
        <span>{open ? "Close" : "Menu"}</span>
      </button>
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
