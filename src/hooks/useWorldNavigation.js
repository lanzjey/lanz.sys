import { useCallback, useEffect, useRef, useState } from "react";
import { scrollToElement } from "../lib/scroll";

const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Teleport timing (ms): the gate closes, the page jumps while hidden, the gate opens.
const JUMP_AT = 500;
const TOTAL = 1700;

// Destinations that are not 3D world portals still get a name for the teleport gate.
const extraDestinations = {
  home: { label: "HOME", subtitle: "STARTING TOWN" },
  resume: { label: "RESUME", subtitle: "PLAYER RECORD" },
};

// A single navigation controller: resolves a destination id or section id,
// plays the teleport transition, and brings the matching section into view.
export function useWorldNavigation(destinations) {
  const [transition, setTransition] = useState(null);
  const timers = useRef([]);
  const count = useRef(0);
  const lastHash = useRef(window.location.hash);
  const navigate = useCallback((targetId, { updateHistory = true } = {}) => {
    const destination = destinations.find((item) => item.id === targetId || item.sectionId === targetId);
    const sectionId = destination?.sectionId || targetId;
    const section = document.getElementById(sectionId);
    if (!section) return;
    const info = destination || extraDestinations[sectionId] || { label: sectionId.toUpperCase() };
    const nextHash = `#${sectionId}`;
    if (updateHistory && window.location.hash !== nextHash) window.history.pushState({ portfolioWorld: true }, "", nextHash);
    lastHash.current = nextHash;
    timers.current.forEach(window.clearTimeout);
    timers.current = [];
    // Reduced motion, or a section that is already on screen: plain scroll, no gate.
    if (reduced() || Math.abs(section.getBoundingClientRect().top) < window.innerHeight * .35) {
      setTransition(null);
      scrollToElement(section);
      return;
    }
    count.current += 1;
    setTransition({ key: count.current, label: info.label, subtitle: info.subtitle });
    timers.current = [
      window.setTimeout(() => scrollToElement(section, { immediate: true }), JUMP_AT),
      window.setTimeout(() => setTransition(null), TOTAL),
    ];
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
  useEffect(() => () => timers.current.forEach(window.clearTimeout), []);
  return { navigate, transition };
}
