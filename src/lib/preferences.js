import { useSyncExternalStore } from "react";

// "Quick mode": a visitor-chosen switch that skips the intro, the teleport transitions
// and the decorative motion, so the portfolio can be read straight away.
const KEY = "lanz-quick-mode";
const listeners = new Set();

let quick = false;
try { quick = window.localStorage.getItem(KEY) === "1"; } catch { /* storage unavailable: default to full experience */ }

const apply = () => document.documentElement.classList.toggle("quick-mode", quick);
apply();

export const isQuickMode = () => quick;

export function setQuickMode(value) {
  quick = value;
  try { window.localStorage.setItem(KEY, value ? "1" : "0"); } catch { /* remembered for this visit only */ }
  apply();
  listeners.forEach((listener) => listener());
}

const subscribe = (listener) => { listeners.add(listener); return () => listeners.delete(listener); };
export const useQuickMode = () => useSyncExternalStore(subscribe, () => quick);
