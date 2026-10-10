import { useEffect, useState } from "react";
import { deviceReducesMotion, motionOverride } from "./motion";

// True for visitors who ask their system for less motion.
export const prefersReducedMotion = () => motionOverride() !== "full" && deviceReducesMotion();

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

const statusLabels = { Completed: "Completed", Ongoing: "In progress", "In Progress": "In progress", Planned: "Planned", "On Hold": "On hold", Archived: "Archived" };
export const statusLabel = (status) => statusLabels[status] || status;
