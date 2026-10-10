import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "../lib/utils";

// Authored 2D composition for each scene, drawn in SVG and CSS on top of the shader backdrop.
// Purely decorative: every layer is aria-hidden and ignores the pointer, so it never gets in the
// way of clicks, selection or keyboard use. Each stage mounts when its scene does, so its
// entrance plays as the transition reveals it.
const ticks = Array.from({ length: 48 }, (_, i) => i);

function About() {
  return <div className="stage st-about">
    <svg className="st-seal" viewBox="-300 -300 600 600">
      <g className="spin-a"><circle className="dash-a" r="278" /><circle className="dash-b" r="244" /></g>
      <g className="spin-b">
        <circle className="ring" r="206" />
        {ticks.map((i) => <line key={i} className="tick" x1="0" y1="-206" x2="0" y2={i % 4 === 0 ? -192 : -199} transform={`rotate(${i * 7.5})`} />)}
      </g>
      <circle className="ring" r="150" /><circle className="ring faint" r="112" />
    </svg>
    <i className="st-sweep" />
    <i className="st-shape sa" /><i className="st-shape sb" /><i className="st-shape sc" />
  </div>;
}

function Projects() {
  return <div className="stage st-projects">
    <svg viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid slice">
      <polygon className="pj" style={{ "--d": "0s" }} points="40,430 330,290 410,420 120,570" />
      <polygon className="pj" style={{ "--d": ".18s" }} points="640,40 960,40 900,210 580,210" />
      <polygon className="pj" style={{ "--d": ".36s" }} points="700,300 980,250 960,420 680,470" />
      <polygon className="pj thin" style={{ "--d": ".54s" }} points="430,520 700,500 740,590 470,600" />
      <line className="pj-cut" x1="0" y1="560" x2="1000" y2="120" />
    </svg>
    <i className="st-bar b1" /><i className="st-bar b2" />
  </div>;
}

function Skills() {
  const traces = [
    "M0 120 H230 L270 160 H520 L560 120 H1000",
    "M0 300 H150 L210 360 H470 L510 320 H760 L800 360 H1000",
    "M0 470 H300 L340 430 H600 L640 470 H1000",
    "M120 0 V90 L160 130 V260",
    "M860 600 V520 L820 480 V340",
  ];
  return <div className="stage st-skills">
    <svg viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid slice">
      <defs><pattern id="sk-grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0H0V40" fill="none" stroke="rgba(55,214,255,.13)" /></pattern></defs>
      <rect width="1000" height="600" fill="url(#sk-grid)" />
      {traces.map((d, i) => <g key={d}>
        <path className="trace" d={d} pathLength="1" style={{ "--d": `${i * .12}s` }} />
        <path className="pulse" d={d} pathLength="1" style={{ "--d": `${1 + i * .7}s` }} />
      </g>)}
      {[[270, 160], [560, 120], [210, 360], [510, 320], [800, 360], [340, 430], [640, 470], [160, 130]].map(([x, y]) => <circle key={`${x}-${y}`} className="node" cx={x} cy={y} r="5" />)}
    </svg>
    <i className="st-scan" />
  </div>;
}

function Services() {
  const nodes = [[500, 40], [880, 260], [880, 340], [500, 560], [120, 340], [120, 260], [500, 300]];
  const links = [[0, 6], [1, 6], [2, 6], [3, 6], [4, 6], [5, 6], [0, 1], [3, 4], [5, 0], [2, 3]];
  return <div className="stage st-services">
    <svg viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid slice">
      <g className="sv-rot"><polygon className="sv-poly" points="500,40 880,260 880,340 500,560 120,340 120,260" /></g>
      <g className="sv-rot rev"><polygon className="sv-poly inner" points="500,110 780,270 780,330 500,490 220,330 220,270" /></g>
      {links.map(([a, b], i) => <line key={`${a}-${b}`} className="sv-link" pathLength="1" x1={nodes[a][0]} y1={nodes[a][1]} x2={nodes[b][0]} y2={nodes[b][1]} style={{ "--d": `${.2 + i * .09}s` }} />)}
      {nodes.map(([x, y], i) => <circle key={`${x}-${y}`} className="sv-node" cx={x} cy={y} r={i === 6 ? 8 : 5} style={{ "--d": `${i * .4}s` }} />)}
    </svg>
  </div>;
}

function Certificates() {
  return <div className="stage st-certs">
    <svg viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid slice">
      <defs>
        <pattern id="cr-fine" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0V20" fill="none" stroke="rgba(55,214,255,.07)" /></pattern>
        <pattern id="cr-wide" width="100" height="100" patternUnits="userSpaceOnUse"><path d="M100 0H0V100" fill="none" stroke="rgba(55,214,255,.14)" /></pattern>
      </defs>
      <rect width="1000" height="600" fill="url(#cr-fine)" /><rect width="1000" height="600" fill="url(#cr-wide)" />
    </svg>
    <i className="cr-card c1" /><i className="cr-card c2" /><i className="cr-card c3" /><i className="cr-card c4" />
    <i className="cr-scan" />
  </div>;
}

function Resume() {
  return <div className="stage st-resume">
    <svg viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid slice">
      <defs><pattern id="rs-grid" width="50" height="50" patternUnits="userSpaceOnUse"><path d="M50 0H0V50" fill="none" stroke="rgba(90,160,255,.08)" /></pattern></defs>
      <rect width="1000" height="600" fill="url(#rs-grid)" />
    </svg>
    <i className="rs-margin" />
  </div>;
}

function Contact() {
  return <div className="stage st-contact">
    <i className="ct-bloom a" /><i className="ct-bloom b" />
    <i className="ct-beam" />
  </div>;
}

const stages = { about: About, projects: Projects, skills: Skills, services: Services, certificates: Certificates, resume: Resume, contact: Contact };

// Subtle 2D parallax: the scene's own scroll position is written to one CSS variable (--sy) on a
// wrapper, and a few layers drift a few pixels against the content. It never moves the content.
export default function SceneStage({ scene }) {
  const host = useRef(null);
  const Stage = stages[scene];

  useEffect(() => {
    const element = host.current;
    const root = document.querySelector(".scene");
    if (!element || !root || prefersReducedMotion()) return undefined;
    let frame = 0;
    const apply = () => { frame = 0; element.style.setProperty("--sy", String(Math.round(root.scrollTop))); };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(apply); };
    root.addEventListener("scroll", onScroll, { passive: true });
    return () => { root.removeEventListener("scroll", onScroll); cancelAnimationFrame(frame); };
  }, [scene]);

  return <div ref={host} className="stage-host">{Stage ? <Stage key={scene} /> : null}</div>;
}
