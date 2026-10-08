import { useCallback, useEffect, useRef, useState } from "react";
import { scrollToElement } from "../lib/scroll";

const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// A single navigation controller: resolves a destination id or section id,
// shows a short route cue, and scrolls to the matching section.
export function useWorldNavigation(destinations) {
  const [transition, setTransition] = useState(null);
  const timer = useRef(null);
  const count = useRef(0);
  const lastHash = useRef(window.location.hash);
  const navigate = useCallback((targetId, { updateHistory = true } = {}) => {
    const destination = targetId === "home"
      ? { id: "home", label: "Home", sectionId: "home" }
      : destinations.find((item) => item.id === targetId || item.sectionId === targetId);
    const sectionId = destination?.sectionId || targetId;
    const section = document.getElementById(sectionId);
    if (!section) return;
    const label = destination?.label || sectionId;
    const nextHash = `#${sectionId}`;
    if (updateHistory && window.location.hash !== nextHash) window.history.pushState({ portfolioWorld: true }, "", nextHash);
    lastHash.current = nextHash;
    window.clearTimeout(timer.current);
    scrollToElement(section);
    if (reduced() || sectionId === "home") { setTransition(null); return; }
    count.current += 1;
    setTransition({ key: count.current, label });
    timer.current = window.setTimeout(() => setTransition(null), 1600);
  }, [destinations]);

  useEffect(() => {
    const syncFromLocation = () => {
      const hash = window.location.hash;
      if (!hash || hash === lastHash.current) return;
      lastHash.current = hash;
      navigate(decodeURIComponent(hash.slice(1)), { updateHistory: false });
    };
    window.addEventListener("popstate", syncFromLocation);
    window.addEventListener("hashchange", syncFromLocation);
    return () => {
      window.removeEventListener("popstate", syncFromLocation);
      window.removeEventListener("hashchange", syncFromLocation);
    };
  }, [navigate]);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  return { navigate, transition };
}
