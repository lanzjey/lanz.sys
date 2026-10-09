import { GateEmblem } from "./world/gates";
import { gateShapes, gateTheme } from "./world/gateData";

const streaks = Array.from({ length: 20 }, (_, index) => ({ angle: index * 18, delay: ((index * 7) % 10) * 0.03, length: 38 + ((index * 13) % 9) * 6 }));

// Full-screen "teleport gate" shown while travelling between sections.
// Travelling through one of the world gates flies the camera into that gate's
// portal, in the gate's own colours; other trips use the default cyan and orange.
export default function TeleportOverlay({ transition }) {
  if (!transition) return null;
  const { gate, origin } = transition;
  const theme = gateTheme[gate];
  const shape = gateShapes[gate];
  const style = { "--ox": `${origin.x}%`, "--oy": `${origin.y}%`, ...(theme ? { "--tp-a": theme.a, "--tp-b": theme.b } : {}) };
  return <div key={transition.key} className="teleport" role="status" aria-live="polite" style={style}>
    <i className="tp-grid" aria-hidden="true" />
    <span className="tp-streaks" aria-hidden="true">
      {streaks.map((streak) => <i key={streak.angle} style={{ "--a": `${streak.angle}deg`, "--d": `${streak.delay}s`, "--l": `${streak.length}vmax` }} />)}
    </span>
    <i className="tp-ring" aria-hidden="true" /><i className="tp-ring tp-ring-2" aria-hidden="true" /><i className="tp-ring tp-ring-3" aria-hidden="true" />
    {shape && <svg className="tp-gate" viewBox="-44 -108 88 116" aria-hidden="true">
      <path className="tp-gate-frame" d={shape.d} />
      <path className="tp-gate-portal" d={shape.d} transform={`translate(0 ${shape.cy}) scale(.74) translate(0 ${-shape.cy})`} />
      <g transform={`translate(-20 ${shape.cy - 20}) scale(.625)`} className="tp-gate-emblem"><GateEmblem id={gate} /></g>
    </svg>}
    <i className="tp-scan" aria-hidden="true" />
    <div className="tp-core">
      <span className="sys-diamond" aria-hidden="true" />
      <span className="tp-kicker">Gate opened · entering</span>
      <strong className="tp-label">{transition.label}</strong>
      {transition.subtitle && <span className="tp-sub">{transition.subtitle}</span>}
      <i className="tp-bar" aria-hidden="true" />
    </div>
    <i className="tp-flash" aria-hidden="true" />
  </div>;
}
