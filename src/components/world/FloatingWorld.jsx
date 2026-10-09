import { useRef } from "react";
import { GateEmblem } from "./gates";
import { gateShapes, gateTheme } from "./gateData";
import { pad } from "../../lib/utils";

const rand = (seed) => { const x = Math.sin(seed * 127.1) * 43758.5453; return x - Math.floor(x); };

// Where each gate stands, on an ellipse around the central island (viewBox 600 × 540).
const gatePositions = {
  profile: [76, 214], skills: [214, 128], services: [386, 128], missions: [524, 214],
  experience: [524, 398], loadout: [388, 494], resume: [212, 494], contact: [76, 398],
};
// Back-to-front, so nearer gates overlap farther ones and the island sits between.
const backRow = ["skills", "services"];
const frontRows = ["profile", "missions", "contact", "experience", "resume", "loadout"];

const motes = Array.from({ length: 30 }, (_, index) => ({
  x: rand(index + 1) * 600, y: 60 + rand(index + 40) * 440, r: .7 + rand(index + 80) * 1.6, delay: -rand(index + 120) * 9, duration: 7 + rand(index + 160) * 6,
  warm: rand(index + 200) > .7,
}));
const farIslands = [
  { x: 40, y: 70, s: .55, d: 0 }, { x: 548, y: 56, s: .7, d: -3 }, { x: 470, y: 470, s: .5, d: -5 }, { x: 118, y: 478, s: .6, d: -1.5 },
];
const clouds = [
  { y: 392, rx: 150, ry: 16, d: 0, speed: 46, o: .2 }, { y: 205, rx: 110, ry: 11, d: -20, speed: 60, o: .14 },
  { y: 450, rx: 190, ry: 18, d: -10, speed: 52, o: .16 },
];

function Gate({ id, index, label, active, onActive, onSelect }) {
  const [x, y] = gatePositions[id];
  const theme = gateTheme[id];
  const { d, cy } = gateShapes[id];
  const portal = `translate(0 ${cy}) scale(.74) translate(0 ${-cy})`;
  return <g transform={`translate(${x} ${y})`} data-gate={id} className={`gate ${active ? "is-active" : ""}`} style={{ "--ga": theme.a, "--gb": theme.b, "--gd": `${index * -1.1}s` }}
    onPointerEnter={() => onActive(id)} onPointerLeave={() => onActive(null)} onClick={() => onSelect(id)}>
    <ellipse className="gate-hit" cx="0" cy="-44" rx="46" ry="64" />
    <g className="gate-bob">
      <path className="gate-beam" d="M-26 0 L-34 -118 L34 -118 L26 0 Z" />
      <path className="gate-under" d="M-46 4 Q-40 22 -22 28 L-10 26 L0 46 L11 27 L24 29 Q40 22 46 4 Z" />
      <ellipse className="gate-top" cx="0" cy="4" rx="46" ry="11" />
      <ellipse className="gate-ring" cx="0" cy="4" rx="35" ry="8" />
      <path className="gate-glow" d={d} />
      <path className="gate-body" d={d} />
      <path className="gate-portal" d={d} transform={portal} fill={`url(#portal-${id})`} />
      <g className="gate-emblem" transform={`translate(-20 ${cy - 20}) scale(.625)`} style={{ color: theme.a }}><GateEmblem id={id} /></g>
      <text className="gate-label" x="0" y="42" textAnchor="middle">{pad(index + 1)} {label}</text>
    </g>
  </g>;
}

// A floating fantasy world: layered sky, drifting islands and clouds, a castle island
// at the centre, and the eight gates standing on their own islands around it.
export default function FloatingWorld({ destinations, activeId, onActive, onSelect, reducedMotion }) {
  const root = useRef(null);
  const byId = Object.fromEntries(destinations.map((destination, index) => [destination.id, { ...destination, index }]));
  const gate = (id) => byId[id] && <Gate key={id} id={id} index={byId[id].index} label={byId[id].label} active={activeId === id} onActive={onActive} onSelect={onSelect} />;

  const track = (event) => {
    if (event.pointerType === "touch" || reducedMotion) return;
    const bounds = root.current.getBoundingClientRect();
    root.current.style.setProperty("--wx", ((event.clientX - bounds.left) / bounds.width - .5).toFixed(3));
    root.current.style.setProperty("--wy", ((event.clientY - bounds.top) / bounds.height - .5).toFixed(3));
  };
  const reset = () => { root.current.style.setProperty("--wx", 0); root.current.style.setProperty("--wy", 0); };

  return <div ref={root} className="world" onPointerMove={track} onPointerLeave={reset}>
    <svg className="world-svg" viewBox="0 0 600 560" role="img" aria-label="A floating fantasy world with a castle island at its centre, ringed by eight teleport gates">
      <defs>
        <radialGradient id="w-sun" cx="50%" cy="50%" r="50%"><stop offset="0" stopColor="#a78bfa" stopOpacity=".55" /><stop offset="1" stopColor="#a78bfa" stopOpacity="0" /></radialGradient>
        <radialGradient id="w-nebula" cx="50%" cy="50%" r="50%"><stop offset="0" stopColor="#3b82f6" stopOpacity=".3" /><stop offset="1" stopColor="#3b82f6" stopOpacity="0" /></radialGradient>
        <radialGradient id="w-cloud" cx="50%" cy="50%" r="50%"><stop offset="0" stopColor="#b9a9ff" stopOpacity=".85" /><stop offset="1" stopColor="#b9a9ff" stopOpacity="0" /></radialGradient>
        <linearGradient id="w-rock" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2a1f5c" /><stop offset="1" stopColor="#07040f" /></linearGradient>
        <linearGradient id="w-turf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2f2470" /><stop offset="1" stopColor="#140e2e" /></linearGradient>
        <linearGradient id="w-ray" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#c4b5fd" stopOpacity=".16" /><stop offset="1" stopColor="#c4b5fd" stopOpacity="0" /></linearGradient>
        <radialGradient id="w-portal" cx="50%" cy="55%" r="55%"><stop offset="0" stopColor="#f3ecff" stopOpacity=".95" /><stop offset=".3" stopColor="#8b5cf6" stopOpacity=".9" /><stop offset=".7" stopColor="#3a2a9e" stopOpacity=".9" /><stop offset="1" stopColor="#0a0620" /></radialGradient>
        <radialGradient id="w-spill" cx="50%" cy="50%" r="50%"><stop offset="0" stopColor="#a78bfa" stopOpacity=".7" /><stop offset="1" stopColor="#a78bfa" stopOpacity="0" /></radialGradient>
        {Object.entries(gateTheme).map(([id, theme]) => <linearGradient key={id} id={`portal-${id}`} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor={theme.b} stopOpacity=".95" /><stop offset="1" stopColor={theme.a} stopOpacity=".28" />
        </linearGradient>)}
      </defs>

      {/* Far sky: sun-glow, nebula, god rays, distant islands */}
      <g className="w-layer" style={{ "--depth": 3 }}>
        <circle cx="470" cy="110" r="150" fill="url(#w-sun)" />
        <circle cx="120" cy="330" r="170" fill="url(#w-nebula)" />
        <path d="M410 0 L470 0 L360 300 Z M330 0 L370 0 L300 260 Z" fill="url(#w-ray)" />
        {farIslands.map((island, index) => <g key={index} className="w-far" transform={`translate(${island.x} ${island.y}) scale(${island.s})`}>
          <g className="w-bob" style={{ "--bd": `${island.d}s` }}><path d="M-34 0 L-24 12 L-4 16 L8 34 L22 12 L34 0 Z" /><ellipse className="w-far-top" cx="0" cy="0" rx="34" ry="6" /></g>
        </g>)}
      </g>

      {/* Mid sky: drifting clouds behind the island */}
      <g className="w-layer" style={{ "--depth": 6 }}>
        {clouds.slice(1, 2).map((cloud, index) => <ellipse key={index} className="w-cloud" cx="300" cy={cloud.y} rx={cloud.rx} ry={cloud.ry} fill="url(#w-cloud)" opacity={cloud.o} style={{ "--cd": `${cloud.d}s`, "--cs": `${cloud.speed}s` }} />)}
        <ellipse cx="300" cy="300" rx="235" ry="180" className="w-orbit" />
        <ellipse cx="300" cy="300" rx="235" ry="180" className="w-orbit-flow" />
      </g>

      {/* World: back gates, central island, front gates */}
      <g className="w-layer" style={{ "--depth": 10 }}>
        {backRow.map(gate)}

        <g className="w-bob w-bob-slow">
          {/* island body */}
          <path d="M196 306 Q210 350 244 366 L262 372 L276 408 L300 436 L322 404 L338 372 L362 364 Q392 350 404 306 Z" fill="url(#w-rock)" stroke="rgba(139,92,246,.45)" strokeWidth="1" />
          <path className="w-facet" d="M244 366 L276 328 L300 436 M362 364 L330 328 L300 436 M276 408 L300 330 M222 332 L252 352 M378 332 L348 352" />
          <path className="w-fall" d="M214 322 V398" /><path className="w-fall w-fall-2" d="M386 322 V384" />
          <path d="M268 392 l-6 22 l9 -9z M338 384 l7 20 l-10 -8z" className="w-crystal" />
          {/* ground and summoning circle */}
          <ellipse cx="300" cy="306" rx="106" ry="25" fill="url(#w-turf)" stroke="rgba(139,92,246,.6)" strokeWidth="1.2" />
          <ellipse cx="300" cy="308" rx="84" ry="18" fill="url(#w-spill)" />
          <ellipse className="w-circle" cx="300" cy="308" rx="78" ry="16" />
          <ellipse className="w-circle w-circle-2" cx="300" cy="308" rx="56" ry="11" />
          {/* obsidian spires */}
          <path className="w-spire" d="M200 304 L206 268 L214 300 Z M214 306 L224 254 L234 304 Z M366 304 L376 258 L386 306 Z M388 302 L394 270 L402 304 Z" />
          {/* the Gate */}
          <g className="w-gate">
            <ellipse className="w-gate-glow" cx="300" cy="236" rx="66" ry="86" />
            <path className="w-gate-stone" d="M236 306 V240 A64 84 0 0 1 364 240 V306 Z" />
            <ellipse className="w-gate-void" cx="300" cy="238" rx="50" ry="70" fill="url(#w-portal)" />
            <ellipse className="w-swirl" cx="300" cy="238" rx="44" ry="62" />
            <ellipse className="w-swirl w-swirl-2" cx="300" cy="238" rx="30" ry="44" />
            <ellipse className="w-swirl w-swirl-3" cx="300" cy="238" rx="16" ry="24" />
            <path className="w-gate-rim" d="M250 306 V240 A50 70 0 0 1 350 240 V306" />
          </g>
          {/* shadow army */}
          <g className="w-army">
            {[[262, 316, 1], [338, 316, 1], [236, 306, .8], [364, 306, .8], [282, 322, 1.1], [318, 322, 1.1]].map(([x, y, k], index) => <g key={index} className="w-soldier" transform={`translate(${x} ${y}) scale(${k})`} style={{ "--i": index }}>
              <path d="M-6 0 L-8 -22 L-4 -30 H4 L8 -22 L6 0 Z M-3 -30 V-38 A4 4 0 0 1 4 -38 V-30 Z M10 4 V-36" />
              <circle className="w-eye" cx="-1.6" cy="-37" r="1.1" /><circle className="w-eye" cx="1.6" cy="-37" r="1.1" />
            </g>)}
          </g>
        </g>

        {frontRows.map(gate)}
      </g>

      {/* Near sky: low clouds and drifting light motes */}
      <g className="w-layer" style={{ "--depth": 16 }}>
        {[clouds[0], clouds[2]].map((cloud, index) => <ellipse key={index} className="w-cloud" cx="300" cy={cloud.y} rx={cloud.rx} ry={cloud.ry} fill="url(#w-cloud)" opacity={cloud.o} style={{ "--cd": `${cloud.d}s`, "--cs": `${cloud.speed}s` }} />)}
        {motes.map((mote, index) => <circle key={index} className={`w-mote ${mote.warm ? "is-warm" : ""}`} cx={mote.x} cy={mote.y} r={mote.r} style={{ "--md": `${mote.delay}s`, "--mt": `${mote.duration}s` }} />)}
      </g>
    </svg>
  </div>;
}
