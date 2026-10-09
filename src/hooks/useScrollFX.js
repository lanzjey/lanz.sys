import { useEffect } from "react";
import { prefersReducedMotion } from "../lib/utils";

const clamp = (value) => Math.min(1, Math.max(0, value));
const easeOut = (t) => 1 - (1 - t) ** 3;

// Scroll-linked depth. Every `.scroll-fx` element receives --enter (0 → 1 as it rises into view).
// Only elements near the viewport are measured each frame, and the CSS decides how far
// they tilt, so phones get a lighter effect and reduced-motion visitors get none.
export function useScrollFX(enabled) {
  useEffect(() => {
    if (!enabled) return undefined;
    const root = document.documentElement;
    if (prefersReducedMotion()) {
      root.classList.add("fx-static");
      return () => root.classList.remove("fx-static");
    }
    const near = new Set();
    let frame = 0;
    const update = () => {
      frame = 0;
      const vh = window.innerHeight;
      root.style.setProperty("--hero", clamp(window.scrollY / vh).toFixed(3));
      near.forEach((element) => {
        const top = element.getBoundingClientRect().top;
        element.style.setProperty("--enter", easeOut(clamp((vh - top) / (vh * .45))).toFixed(3));
      });
    };
    const request = () => { if (!frame) frame = requestAnimationFrame(update); };
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) near.add(entry.target);
        else { near.delete(entry.target); entry.target.style.setProperty("--enter", entry.boundingClientRect.top < 0 ? "1" : "0"); }
      });
      request();
    }, { rootMargin: "20% 0px 20% 0px" });
    const watch = () => document.querySelectorAll(".scroll-fx").forEach((element) => observer.observe(element));
    watch();
    // Filters and "show more" mount new cards; pick them up as they appear.
    const mutations = new MutationObserver(watch);
    mutations.observe(document.querySelector("main") || document.body, { childList: true, subtree: true });
    window.addEventListener("scroll", request, { passive: true });
    window.addEventListener("resize", request);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      mutations.disconnect();
      window.removeEventListener("scroll", request);
      window.removeEventListener("resize", request);
    };
  }, [enabled]);
}
