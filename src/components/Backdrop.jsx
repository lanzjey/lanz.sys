import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "../lib/utils";

// The living background, three layers deep:
//   1. a WebGL shader at reduced resolution: an underwater scene with a bright azure surface,
//      rippling caustics and swaying light shafts that sinks to deep navy as you scroll down;
//   2. a 2D canvas of rising bubbles and light motes in three depth layers (scroll and pointer parallax);
//   3. skewed glass shards that shift with scroll and pointer for a subtle 3D parallax.
// Everything stops when the tab is hidden, drops to a lighter setup on touch devices, and falls
// back to a CSS gradient on reduced motion or data-saver. <html data-dark-hour="1"> tints it green.
const VERT = "attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }";
const FRAG = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec2 r; uniform float t; uniform float dh; uniform float d; uniform vec2 m;
void main(){
  vec2 uv = gl_FragCoord.xy / r;
  float asp = r.x / r.y;
  vec2 p = vec2(uv.x * asp, uv.y) * 4.5 + m * .5;
  vec2 i = p; float c = 1.0; float inten = .0065;
  for (int n = 0; n < 4; n++) {
    float tt = t * .26 * (1.0 - 3.2 / float(n + 1));
    i = p + vec2(cos(tt - i.x) + sin(tt + i.y), sin(tt - i.y) + cos(tt + i.x));
    c += 1.0 / length(vec2(p.x / (sin(i.x + tt) / inten), p.y / (cos(i.y + tt) / inten)));
  }
  c /= 4.0; c = 1.17 - pow(c, 1.35);
  float w = clamp(pow(abs(c), 9.0), 0.0, 1.0);
  float y = uv.y;
  vec3 topC = mix(vec3(.10, .70, 1.0), vec3(.04, .34, .95), d);
  vec3 midC = mix(vec3(.02, .28, .98), vec3(.01, .12, .6), d);
  vec3 botC = mix(vec3(.01, .07, .56), vec3(.005, .03, .2), d);
  vec3 base = mix(mix(botC, midC, smoothstep(0.0, .55, y)), topC, smoothstep(.42, 1.0, y));
  float s = sin((uv.x * asp * 1.1 + (1.0 - y) * .9) * 7.0 + sin(t * .18 + uv.x * 3.0) * 1.2 + t * .14);
  float rays = pow(max(s, 0.0), 6.0) * smoothstep(.1, 1.0, y) * .3 * (1.0 - d * .7);
  float surf = smoothstep(.84, 1.0, y) * (.5 + .5 * sin(uv.x * asp * 26.0 + sin(y * 30.0 + t * 1.2) * 2.0 - t * 1.4)) * .22;
  vec3 col = base + vec3(.6, .9, 1.0) * w * (.18 + .3 * y) * (1.0 - .5 * d) + vec3(.6, .9, 1.0) * (rays * .55 + surf * .6);
  col += (fract(sin(dot(gl_FragCoord.xy + t, vec2(12.9898, 78.233))) * 43758.5453) - .5) * .02;
  vec3 dhBase = mix(mix(vec3(.0, .05, .04), vec3(.02, .22, .15), smoothstep(0.0, .6, y)), vec3(.05, .42, .3), smoothstep(.5, 1.0, y));
  vec3 dhCol = dhBase + vec3(.4, 1.0, .7) * w * (.2 + .4 * y) + vec3(.4, 1.0, .7) * (rays + surf) * .8;
  col = mix(col, dhCol, dh);
  col = 1.0 - exp(-col * 1.25);
  float vig = smoothstep(1.4, .3, length(uv - .5));
  gl_FragColor = vec4(col * (.78 + .22 * vig), 1.0);
}`;

const SHARDS = [
  { cls: "bd-a", dx: 60, dy: 40, depth: .07 },
  { cls: "bd-b", dx: 110, dy: 70, depth: .14 },
  { cls: "bd-c", dx: 80, dy: 50, depth: .2 },
  { cls: "bd-d", dx: 150, dy: 90, depth: .1 },
];

export default function Backdrop() {
  const rootRef = useRef(null);
  const glRef = useRef(null);
  const fxRef = useRef(null);

  useEffect(() => {
    const root = rootRef.current;
    const glCanvas = glRef.current;
    const fxCanvas = fxRef.current;
    if (!root || prefersReducedMotion() || navigator.connection?.saveData) return undefined;

    // Layer 1: the shader (optional: the particles and shards still run without WebGL).
    let gl = null;
    let uniforms = {};
    try { gl = glCanvas.getContext("webgl", { antialias: false, alpha: false, powerPreference: "low-power" }); } catch { gl = null; }
    if (gl) {
      const compile = (type, source) => {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        return gl.getShaderParameter(shader, gl.COMPILE_STATUS) ? shader : null;
      };
      const vs = compile(gl.VERTEX_SHADER, VERT);
      const fs = compile(gl.FRAGMENT_SHADER, FRAG);
      const program = vs && fs ? gl.createProgram() : null;
      if (program) {
        gl.attachShader(program, vs);
        gl.attachShader(program, fs);
        gl.linkProgram(program);
      }
      if (program && gl.getProgramParameter(program, gl.LINK_STATUS)) {
        gl.useProgram(program);
        gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
        const position = gl.getAttribLocation(program, "p");
        gl.enableVertexAttribArray(position);
        gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
        uniforms = Object.fromEntries(["r", "t", "dh", "d", "m"].map((name) => [name, gl.getUniformLocation(program, name)]));
      } else gl = null;
    }

    // Layer 2: bubbles and light motes in three depth bands.
    const fx = fxCanvas.getContext("2d");
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const motes = Array.from({ length: coarse ? 30 : 72 }, () => ({ x: Math.random(), y: Math.random(), z: .2 + Math.random() * .8, ph: Math.random() * 6.28 }));

    let width = 0;
    let height = 0;
    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      fxCanvas.width = width;
      fxCanvas.height = height;
      if (gl) {
        glCanvas.width = Math.min(960, Math.round(width * (coarse ? .4 : .5)));
        glCanvas.height = Math.round(glCanvas.width * (height / width));
        gl.viewport(0, 0, glCanvas.width, glCanvas.height);
      }
    };
    resize();
    window.addEventListener("resize", resize);

    const pointer = { x: 0, y: 0 };
    const onPointer = (event) => { pointer.x = event.clientX / window.innerWidth - .5; pointer.y = event.clientY / window.innerHeight - .5; };
    window.addEventListener("pointermove", onPointer, { passive: true });

    let scrollY = window.scrollY;
    const onScroll = () => { scrollY = window.scrollY; };
    window.addEventListener("scroll", onScroll, { passive: true });

    let frame = 0;
    let tick = 0;
    let tint = 0;
    let sx = 0;
    let sy = 0;
    let sScroll = scrollY;
    let depth = 0;
    const draw = (now) => {
      frame = requestAnimationFrame(draw);
      tick += 1;
      const t = now / 1000;
      tint += ((document.documentElement.dataset.darkHour ? 1 : 0) - tint) * .06;
      sx += (pointer.x - sx) * .06;
      sy += (pointer.y - sy) * .06;
      sScroll += (scrollY - sScroll) * .12;
      const room = document.documentElement.scrollHeight - height;
      depth += ((room > 0 ? Math.min(1, Math.max(0, scrollY / room)) : 0) - depth) * .05;
      root.style.setProperty("--mx", sx.toFixed(3));
      root.style.setProperty("--my", sy.toFixed(3));
      root.style.setProperty("--sy", sScroll.toFixed(0));

      if (gl && tick % 2 === 0) {
        gl.uniform2f(uniforms.r, glCanvas.width, glCanvas.height);
        gl.uniform1f(uniforms.t, t % 3600);
        gl.uniform1f(uniforms.dh, tint);
        gl.uniform1f(uniforms.d, depth);
        gl.uniform2f(uniforms.m, sx, sy);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      }

      fx.clearRect(0, 0, width, height);
      const rgb = tint > .5 ? "190, 255, 215" : "235, 250, 255";
      motes.forEach((mote, index) => {
        const drift = Math.sin(t * .3 + mote.ph) * 22 * mote.z;
        const x = ((mote.x * width + drift + sx * 90 * mote.z) % width + width) % width;
        const y = (((mote.y * height - t * 16 * mote.z - sScroll * .3 * mote.z) % height) + height) % height;
        const flicker = .7 + .3 * Math.sin(t * 1.4 + mote.ph * 3);
        if (index % 3 === 0) {
          fx.strokeStyle = `rgba(${rgb}, ${(.2 + .45 * mote.z) * flicker})`;
          fx.lineWidth = 1.2;
          fx.beginPath();
          fx.arc(x, y, 3 + mote.z * 9, 0, 6.2832);
          fx.stroke();
        } else {
          fx.fillStyle = `rgba(${rgb}, ${(.25 + .5 * mote.z) * flicker})`;
          fx.beginPath();
          fx.arc(x, y, .9 + mote.z * 2.2, 0, 6.2832);
          fx.fill();
        }
      });
    };
    const onVisibility = () => {
      cancelAnimationFrame(frame);
      if (!document.hidden) frame = requestAnimationFrame(draw);
    };
    document.addEventListener("visibilitychange", onVisibility);
    frame = requestAnimationFrame(draw);
    if (gl) glCanvas.classList.add("is-live");

    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("scroll", onScroll);
      glCanvas.classList.remove("is-live");
    };
  }, []);

  return <div ref={rootRef} className="backdrop" aria-hidden="true">
    <canvas ref={glRef} className="bd-gl" />
    <div className="bd-layer">
      {SHARDS.map((shard) => <i key={shard.cls} className={`bd-shard ${shard.cls}`} style={{ "--dx": shard.dx, "--dy": shard.dy, "--depth": shard.depth }} />)}
    </div>
    <canvas ref={fxRef} className="bd-fx" />
    <i className="veil" />
  </div>;
}
