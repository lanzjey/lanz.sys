import { useEffect, useRef } from "react";
import { scrollState } from "../lib/scroll";
import { prefersReducedMotion } from "../lib/utils";

const GLYPHS = "01010110100101101001ABCDEF0123456789";
const PARTICLE_COLORS = ["205, 195, 255", "255, 255, 255", "139, 92, 246", "125, 190, 255"];

// A single 2D canvas behind the whole site: light orbs, parallax particles,
// falling machine-code streams and an occasional system scan line.
export default function AmbientBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const reduced = prefersReducedMotion();
    let width = 0;
    let height = 0;
    let dpr = 1;
    let particles = [];
    let streams = [];
    let frame = 0;
    let last = performance.now();
    let scanAt = 4;

    const orbs = [
      { x: .82, y: .12, r: .55, color: "40, 140, 255", speed: .00006, phase: 0 },
      { x: .1, y: .7, r: .5, color: "139, 92, 246", speed: .00005, phase: 2 },
      { x: .55, y: .95, r: .45, color: "109, 40, 217", speed: .00007, phase: 4 },
    ];

    const makeStream = (initial) => {
      const depth = .35 + Math.random() * .65;
      return {
        x: Math.random() * width,
        y: initial ? Math.random() * height : -Math.random() * height * .5,
        depth,
        speed: (18 + Math.random() * 30) * depth,
        length: 8 + Math.floor(Math.random() * 14),
        size: Math.round(10 + depth * 5),
        chars: Array.from({ length: 24 }, () => GLYPHS[Math.floor(Math.random() * GLYPHS.length)]),
        tick: 0,
      };
    };

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const area = width * height;
      particles = Array.from({ length: Math.round(Math.min(140, area / 11000)) }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        z: .2 + Math.random() * .8,
        drift: .15 + Math.random() * .5,
        twinkle: Math.random() * Math.PI * 2,
        color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
      }));
      streams = Array.from({ length: Math.round(Math.min(22, width / 70)) }, () => makeStream(true));
    };

    const draw = (time, dt) => {
      ctx.clearRect(0, 0, width, height);
      const velocity = scrollState.velocity;
      const boost = Math.min(3, Math.abs(velocity) * .05);

      // Light orbs
      ctx.globalCompositeOperation = "lighter";
      orbs.forEach((orb) => {
        const t = time * orb.speed + orb.phase;
        const x = (orb.x + Math.sin(t) * .08) * width;
        const y = (orb.y + Math.cos(t * 1.3) * .06) * height;
        const radius = orb.r * Math.max(width, height);
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
        gradient.addColorStop(0, `rgba(${orb.color}, .09)`);
        gradient.addColorStop(1, `rgba(${orb.color}, 0)`);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
      });

      // Machine-code streams
      ctx.globalCompositeOperation = "source-over";
      ctx.textAlign = "center";
      streams.forEach((stream, index) => {
        stream.y += (stream.speed * (1 + boost)) * dt;
        stream.tick += dt;
        if (stream.tick > .12) {
          stream.tick = 0;
          stream.chars[Math.floor(Math.random() * stream.chars.length)] = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
        }
        const lineHeight = stream.size * 1.25;
        if (stream.y - stream.length * lineHeight > height) streams[index] = makeStream(false);
        ctx.font = `500 ${stream.size}px "JetBrains Mono", monospace`;
        for (let i = 0; i < stream.length; i += 1) {
          const y = stream.y - i * lineHeight;
          if (y < -lineHeight || y > height + lineHeight) continue;
          const fade = 1 - i / stream.length;
          const head = i === 0;
          ctx.fillStyle = head ? `rgba(228, 218, 255, ${.32 * stream.depth})` : `rgba(150, 120, 255, ${.11 * fade * stream.depth})`;
          ctx.fillText(stream.chars[i % stream.chars.length], stream.x, y);
        }
      });

      // Parallax particles: deeper ones move less with scroll
      const scrollY = scrollState.y;
      particles.forEach((particle) => {
        particle.y -= particle.drift * particle.z * dt * 14;
        particle.twinkle += dt * (1 + particle.z);
        let y = (particle.y - scrollY * particle.z * .25) % height;
        if (y < 0) y += height;
        const alpha = (.25 + Math.sin(particle.twinkle) * .2 + .2) * particle.z;
        const size = particle.z * 1.8;
        const stretch = Math.abs(velocity) > 6 ? Math.min(14, Math.abs(velocity) * particle.z * .22) : 0;
        ctx.fillStyle = `rgba(${particle.color}, ${alpha})`;
        if (stretch > 2) ctx.fillRect(particle.x - size / 2, y - (velocity > 0 ? 0 : stretch), size, stretch);
        else { ctx.beginPath(); ctx.arc(particle.x, y, size, 0, Math.PI * 2); ctx.fill(); }
      });

      // Occasional horizontal system scan
      const seconds = time / 1000;
      if (seconds > scanAt) {
        const progress = (seconds - scanAt) / 2.2;
        if (progress >= 1) scanAt = seconds + 7 + Math.random() * 6;
        else {
          const y = progress * height;
          const gradient = ctx.createLinearGradient(0, y - 60, 0, y);
          gradient.addColorStop(0, "rgba(139, 92, 246, 0)");
          gradient.addColorStop(1, "rgba(139, 92, 246, .06)");
          ctx.fillStyle = gradient;
          ctx.fillRect(0, y - 60, width, 60);
          ctx.fillStyle = "rgba(196, 181, 253, .2)";
          ctx.fillRect(0, y, width, 1);
        }
      }
    };

    const loop = (time) => {
      const dt = Math.min(.05, (time - last) / 1000);
      last = time;
      scrollState.velocity *= .92;
      draw(time, dt);
      frame = requestAnimationFrame(loop);
    };
    const onVisibility = () => {
      cancelAnimationFrame(frame);
      if (!document.hidden && !reduced) { last = performance.now(); frame = requestAnimationFrame(loop); }
    };

    resize();
    if (reduced) draw(0, 0);
    else frame = requestAnimationFrame(loop);
    const onResize = () => { resize(); if (reduced) draw(0, 0); };
    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return <div className="bg-fx" aria-hidden="true">
    <canvas ref={canvasRef} className="bg-canvas" />
    <div className="bg-grid" />
    <div className="bg-vignette" />
  </div>;
}
