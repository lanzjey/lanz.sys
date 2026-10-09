import { useEffect, useState } from "react";

// True for visitors who ask their system for less motion, and for those who switched on Quick mode.
export const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.classList.contains("quick-mode");

// Template entries ("Add …", "Example …", "… placeholder") stay in the data files but are not shown to visitors.
export const isFilled = (value) => typeof value === "string" && value.trim() !== "" && !/^(add|example)\b|placeholder/i.test(value.trim());

export const pad = (value, length = 2) => String(value).padStart(length, "0");

export function useInView(ref, { threshold = .05, rootMargin = "0px" } = {}) {
  const [inView, setInView] = useState(() => !("IntersectionObserver" in window));
  useEffect(() => {
    const node = ref.current;
    if (!node || !("IntersectionObserver" in window)) return undefined;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold, rootMargin });
    observer.observe(node);
    return () => observer.disconnect();
  }, [ref, threshold, rootMargin]);
  return inView;
}

// Pointer-driven 3D tilt and spotlight for cards with the `tilt` class.
export const tilt = {
  onPointerMove(event) {
    if (event.pointerType === "touch" || prefersReducedMotion()) return;
    const card = event.currentTarget;
    const bounds = card.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width;
    const y = (event.clientY - bounds.top) / bounds.height;
    card.style.setProperty("--mx", `${x * 100}%`);
    card.style.setProperty("--my", `${y * 100}%`);
    card.style.setProperty("--rx", `${(.5 - y) * 6}deg`);
    card.style.setProperty("--ry", `${(x - .5) * 8}deg`);
  },
  onPointerLeave(event) {
    event.currentTarget.style.setProperty("--rx", "0deg");
    event.currentTarget.style.setProperty("--ry", "0deg");
  },
};
