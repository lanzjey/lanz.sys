import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { scrollState } from "../lib/scroll";

const CYAN = "#5fe3ff";
const ORANGE = "#ffa640";
const WHITE = "#f4fbff";
const TIERS = 16;
const ORBIT_RADIUS = 3.05;

// Seeded pseudo-random so the castle is identical on every load.
const rand = (seed) => { const x = Math.sin(seed * 127.1) * 43758.5453; return x - Math.floor(x); };

function softDotTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 64;
  const ctx = canvas.getContext("2d");
  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(.4, "rgba(255,255,255,.35)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(canvas);
}

// A floating castle of stacked floors: wide at the base, tapering to a spire.
function useCastleGeometry() {
  return useMemo(() => {
    const tiers = [];
    const edges = [];
    const windows = [];
    for (let i = 0; i < TIERS; i += 1) {
      const t = i / (TIERS - 1);
      const radius = 2.05 * (1 - t ** 1.45) + .2;
      const height = .12 + (1 - t) * .05;
      const y = -1 + t * 2.3;
      tiers.push({ radius, height, y });
      const segments = 48;
      for (let s = 0; s < segments; s += 1) {
        const a = s / segments * Math.PI * 2;
        const b = (s + 1) / segments * Math.PI * 2;
        const top = y + height / 2;
        edges.push(Math.cos(a) * radius * .96, top, Math.sin(a) * radius * .96, Math.cos(b) * radius * .96, top, Math.sin(b) * radius * .96);
      }
      const count = Math.round(radius * 26);
      for (let w = 0; w < count; w += 1) {
        if (rand(i * 100 + w) < .35) continue;
        const a = w / count * Math.PI * 2;
        windows.push(Math.cos(a) * (radius + .012), y, Math.sin(a) * (radius + .012));
      }
    }
    const spikes = Array.from({ length: 11 }, (_, index) => {
      const a = rand(index + 3) * Math.PI * 2;
      const r = rand(index + 9) * 1.55;
      return { x: Math.cos(a) * r, z: Math.sin(a) * r, length: .35 + rand(index + 17) * .85, width: .07 + rand(index + 21) * .1 };
    });
    const clouds = [];
    for (let i = 0; i < 320; i += 1) {
      const a = rand(i + 41) * Math.PI * 2;
      const r = 1.9 + rand(i + 59) * 1.9;
      clouds.push(Math.cos(a) * r, -.85 + rand(i + 73) * .55, Math.sin(a) * r);
    }
    return { tiers, edges: new Float32Array(edges), windows: new Float32Array(windows), spikes, clouds: new Float32Array(clouds) };
  }, []);
}

function Castle({ pointer, nodeCount, activeIndex, reducedMotion, compact }) {
  const root = useRef(null);
  const castle = useRef(null);
  const cloudLayer = useRef(null);
  const windowMaterial = useRef(null);
  const crystal = useRef(null);
  const orbit = useRef(null);
  const nodes = useRef([]);
  const beamRef = useRef(null);
  const { tiers, edges, windows, spikes, clouds } = useCastleGeometry();
  const dot = useMemo(() => softDotTexture(), []);
  const beam = useMemo(() => new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, .3, 0), new THREE.Vector3()]),
    new THREE.LineBasicMaterial({ color: ORANGE, transparent: true, opacity: .9 }),
  ), []);
  useEffect(() => () => { dot.dispose(); beam.geometry.dispose(); beam.material.dispose(); }, [dot, beam]);

  useFrame((state, delta) => {
    const motion = reducedMotion ? 0 : 1;
    const t = state.clock.elapsedTime;
    const hero = scrollState.hero;
    const damp = THREE.MathUtils.damp;
    const px = pointer?.current?.x || 0;
    const py = pointer?.current?.y || 0;
    if (root.current) {
      root.current.rotation.x = damp(root.current.rotation.x, py * .1 * motion + hero * .45, 3, delta);
      root.current.rotation.z = damp(root.current.rotation.z, -px * .05 * motion, 3, delta);
      root.current.position.y = .35 + Math.sin(t * .6) * .08 * motion + hero * 1.1;
      root.current.scale.setScalar(damp(root.current.scale.x, .88 + hero * .25, 3, delta));
    }
    if (castle.current) castle.current.rotation.y += delta * (.12 + Math.abs(scrollState.velocity) * .01) * motion + px * delta * .4 * motion;
    if (cloudLayer.current) cloudLayer.current.rotation.y -= delta * .05 * motion;
    if (windowMaterial.current) windowMaterial.current.opacity = .75 + Math.sin(t * 2.3) * .2 * motion;
    if (crystal.current) { crystal.current.rotation.y += delta * 1.2 * motion; crystal.current.position.y = 1.8 + Math.sin(t * 1.6) * .06 * motion; }
    if (orbit.current) orbit.current.rotation.y += delta * .09 * motion;
    nodes.current.forEach((node, index) => {
      if (!node) return;
      const selected = index === activeIndex;
      node.scale.setScalar(damp(node.scale.x, selected ? 2 : 1, 6, delta));
      node.rotation.y += delta * motion;
      node.material.color.set(selected ? ORANGE : index % 2 ? WHITE : CYAN);
    });
    const line = beamRef.current;
    const target = nodes.current[activeIndex];
    if (line) {
      line.visible = Boolean(target);
      if (target) {
        line.geometry.attributes.position.setXYZ(1, target.position.x, target.position.y, target.position.z);
        line.geometry.attributes.position.needsUpdate = true;
      }
    }
    state.camera.lookAt(0, .3, 0);
  });

  return <>
    <ambientLight intensity={.55} color="#9fc4ff" />
    <directionalLight position={[4, 5, 3]} intensity={2.4} color="#ffd6a0" />
    <pointLight position={[-4, -1, 3]} intensity={30} distance={14} color={CYAN} />
    <pointLight position={[0, -2.2, 0]} intensity={14} distance={6} color={ORANGE} />
    <group ref={root} scale={.88}>
      <group ref={castle}>
        {tiers.map(({ radius, height, y }, index) => <mesh key={index} position={[0, y, 0]}>
          <cylinderGeometry args={[radius * .96, radius, height, compact ? 20 : 32, 1]} />
          <meshStandardMaterial color={index % 3 === 0 ? "#1d2f47" : "#15233a"} metalness={.55} roughness={.45} emissive="#0d2c4a" emissiveIntensity={.35} />
        </mesh>)}
        <lineSegments>
          <bufferGeometry><bufferAttribute attach="attributes-position" args={[edges, 3]} /></bufferGeometry>
          <lineBasicMaterial color={CYAN} transparent opacity={.55} />
        </lineSegments>
        <points>
          <bufferGeometry><bufferAttribute attach="attributes-position" args={[windows, 3]} /></bufferGeometry>
          <pointsMaterial ref={windowMaterial} map={dot} color="#ffbe6b" size={.07} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
        </points>
        {spikes.map(({ x, z, length, width }, index) => <mesh key={index} position={[x, -1.06 - length / 2, z]} rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[width, length, 5]} />
          <meshStandardMaterial color="#132036" metalness={.4} roughness={.6} emissive="#0a1d33" emissiveIntensity={.4} />
        </mesh>)}
        <mesh position={[0, 1.5, 0]}><coneGeometry args={[.13, .5, 6]} /><meshStandardMaterial color="#21395a" metalness={.7} roughness={.3} emissive="#123a5e" emissiveIntensity={.5} /></mesh>
        <mesh ref={crystal} position={[0, 1.85, 0]}><octahedronGeometry args={[.11, 0]} /><meshBasicMaterial color={ORANGE} /></mesh>
      </group>
      <points ref={cloudLayer}>
        <bufferGeometry><bufferAttribute attach="attributes-position" args={[clouds, 3]} /></bufferGeometry>
        <pointsMaterial map={dot} color="#cfe6ff" size={compact ? .7 : .85} transparent opacity={.13} depthWrite={false} />
      </points>
      <group rotation={[.18, 0, 0]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[ORBIT_RADIUS, .006, 6, 220]} />
          <meshBasicMaterial color={CYAN} transparent opacity={.35} />
        </mesh>
        <group ref={orbit}>
          {Array.from({ length: nodeCount }, (_, index) => {
            const angle = index / nodeCount * Math.PI * 2;
            return <mesh key={index} ref={(node) => { nodes.current[index] = node; }} position={[Math.cos(angle) * ORBIT_RADIUS, 0, Math.sin(angle) * ORBIT_RADIUS]}>
              <octahedronGeometry args={[.11, 0]} />
              <meshBasicMaterial color={CYAN} />
            </mesh>;
          })}
          <primitive ref={beamRef} object={beam} />
        </group>
      </group>
    </group>
  </>;
}

export default function CastleScene({ pointer, nodeCount = 7, activeIndex = -1, reducedMotion = false, active = true, className = "" }) {
  const [compact, setCompact] = useState(() => window.matchMedia("(max-width: 760px)").matches);
  useEffect(() => {
    const media = window.matchMedia("(max-width: 760px)");
    const update = () => setCompact(media.matches);
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  return <div className={`core-canvas ${className}`} aria-hidden="true">
    <Canvas camera={{ position: [0, .55, compact ? 9.4 : 8.6], fov: 40 }} dpr={compact ? [1, 1.25] : [1, 1.6]} frameloop={active && !reducedMotion ? "always" : "demand"} gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}>
      <Castle pointer={pointer} nodeCount={nodeCount} activeIndex={activeIndex} reducedMotion={reducedMotion} compact={compact} />
    </Canvas>
  </div>;
}
