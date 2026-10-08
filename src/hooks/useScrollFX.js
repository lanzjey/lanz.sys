import { useEffect } from "react";
import { prefersReducedMotion } from "../lib/utils";
import { scrollState } from "../lib/scroll";

const clamp = (value) => Math.min(1, Math.max(0, value));
const easeOut = (t) => 1 - (1 - t) ** 3;

// Scroll-linked 3D motion. Every `.scroll-fx` element receives:
//   --enter  0 → 1 as it travels from the bottom edge into view (eased)
//   --p      0 → 1 across its whole pass through the viewport
// and the root receives --hero (0 → 1 while the hero scrolls away).
export function useScrollFX(enabled) {
  useEffect(() => {
    if (!enabled) return undefined;
    const root = document.documentElement;
    if (prefersReducedMotion()) {
      root.classList.add("fx-static");
      return () => root.classList.remove("fx-static");
    }
    let frame = 0;
    let lastY = window.scrollY;
    const update = () => {
      frame = 0;
      const vh = window.innerHeight;
      const y = window.scrollY;
      scrollState.velocity = scrollState.velocity * .8 + (y - lastY) * .2;
      scrollState.y = y;
      scrollState.hero = clamp(y / vh);
      lastY = y;
      root.style.setProperty("--hero", scrollState.hero.toFixed(4));
      const elements = document.querySelectorAll(".scroll-fx");
      const rects = Array.from(elements, (element) => element.getBoundingClientRect());
      elements.forEach((element, index) => {
        const rect = rects[index];
        const stagger = Number(element.style.getPropertyValue("--stagger")) || 0;
        const delay = (stagger % 4) * 36;
        const enter = easeOut(clamp((vh - rect.top - delay) / (vh * .42)));
        const p = clamp((vh - rect.top) / (vh + rect.height));
        element.style.setProperty("--enter", enter.toFixed(4));
        element.style.setProperty("--p", p.toFixed(4));
      });
    };
    const request = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", request, { passive: true });
    window.addEventListener("resize", request);
    // Filters swap cards in and out; measure them as soon as they mount.
    const observer = new MutationObserver(request);
    observer.observe(document.querySelector("main") || document.body, { childList: true, subtree: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", request);
      window.removeEventListener("resize", request);
      observer.disconnect();
    };
  }, [enabled]);
}
