import { useEffect, useRef } from "react";

// Warp tunnel of rainbow light streaks. `speed` is read every frame through a ref,
// so phase changes accelerate or calm the tunnel smoothly without re-rendering.
export default function LinkStartTunnel({ speed = .2, colorful = false, reducedMotion = false }) {
  const canvasRef = useRef(null);
  const target = useRef({ speed, colorful });
  useEffect(() => { target.current = { speed, colorful }; }, [speed, colorful]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let width = 0;
    let height = 0;
    let frame = 0;
    let current = target.current.speed;
    let saturation = 0;
    let last = performance.now();
    const stars = [];
    const spawn = (star = {}) => Object.assign(star, {
      x: (Math.random() - .5) * 2,
      y: (Math.random() - .5) * 2,
      z: Math.random() * .9 + .1,
      hue: 235 + Math.random() * 75,
    });
    for (let i = 0; i < 420; i += 1) stars.push(spawn());

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = (dt) => {
      current += (target.current.speed - current) * Math.min(1, dt * 2.2);
      saturation += ((target.current.colorful ? 1 : 0) - saturation) * Math.min(1, dt * 2);
      ctx.fillStyle = `rgba(4, 3, 12, ${Math.max(.18, .55 - current * .35)})`;
      ctx.fillRect(0, 0, width, height);
      const cx = width / 2;
      const cy = height / 2;
      const scale = Math.max(width, height) * .5;
      ctx.lineCap = "round";
      ctx.globalCompositeOperation = "lighter";
      stars.forEach((star) => {
        const previousZ = star.z;
        star.z -= current * dt * .9;
        if (star.z <= .02) { spawn(star); star.z = 1; return; }
        const x = cx + (star.x / star.z) * scale;
        const y = cy + (star.y / star.z) * scale;
        const px = cx + (star.x / previousZ) * scale;
        const py = cy + (star.y / previousZ) * scale;
        if (x < -50 || x > width + 50 || y < -50 || y > height + 50) { spawn(star); star.z = 1; return; }
        const brightness = Math.min(1, (1 - star.z) * 1.4);
        const sat = Math.round(saturation * 95);
        ctx.strokeStyle = `hsla(${star.hue}, ${sat}%, ${70 + (1 - saturation) * 15}%, ${brightness * .9})`;
        ctx.lineWidth = Math.max(.6, (1 - star.z) * 3);
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(x, y);
        ctx.stroke();
      });
      ctx.globalCompositeOperation = "source-over";
    };

    const loop = (time) => {
      const dt = Math.min(.05, (time - last) / 1000);
      last = time;
      draw(dt);
      frame = requestAnimationFrame(loop);
    };
    resize();
    if (reducedMotion) draw(.016);
    else frame = requestAnimationFrame(loop);
    window.addEventListener("resize", resize);
    return () => { cancelAnimationFrame(frame); window.removeEventListener("resize", resize); };
  }, [reducedMotion]);

  return <canvas ref={canvasRef} className="link-tunnel" aria-hidden="true" />;
}
