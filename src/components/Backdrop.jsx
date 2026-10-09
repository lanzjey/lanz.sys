import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "../lib/utils";

// The living background, three layers deep:
//   1. a WebGL shader at reduced resolution: a vivid azure gradient, rippling water caustics,
//      sweeping diagonal light bands and a breathing glow;
//   2. a 2D canvas of drifting light motes in three depth layers that react to scroll and pointer;
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
uniform vec2 r; uniform float t; uniform float dh; uniform vec2 m;
void main(){
  vec2 uv = gl_FragCoord.xy / r;
  float asp = r.x / r.y;
  vec2 p = vec2(uv.x * asp, uv.y) * 5.0 + m * .5;
  vec2 i = p; float c = 1.0; float inten = .0065;
  for (int n = 0; n < 4; n++) {
    float tt = t * .24 * (1.0 - 3.2 / float(n + 1));
    i = p + vec2(cos(tt - i.x) + sin(tt + i.y), sin(tt - i.y) + cos(tt + i.x));
    c += 1.0 / length(vec2(p.x / (sin(i.x + tt) / inten), p.y / (cos(i.y + tt) / inten)));
  }
  c /= 4.0; c = 1.17 - pow(c, 1.35);
  float w = pow(abs(c), 6.0);
  float g = clamp(uv.y * .72 + uv.x * .5, 0.0, 1.0);
  vec3 base = mix(vec3(.01, .03, .12), vec3(.05, .27, .85), g * g);
  float band = sin((uv.x * asp * .9 - uv.y * 1.3) * 5.5 + t * .35);
  band = pow(max(band, 0.0), 8.0) * (.1 + .22 * uv.y);
  vec2 gp = uv - vec2(.74 + sin(t * .2) * .03, .64);
  float glow = .24 / (1.0 + 9.0 * dot(gp, gp) * asp);
  vec3 col = base + vec3(.2, .62, 1.0) * w * .6 + vec3(.25, .65, 1.0) * band + vec3(.1, .45, 1.0) * glow;
  col += (fract(sin(dot(gl_FragCoord.xy + t, vec2(12.9898, 78.233))) * 43758.5453) - .5) * .022;
  vec3 dhBase = mix(vec3(.0, .04, .03), vec3(.03, .32, .2), g * g);
  vec3 dhCol = dhBase + vec3(.3, 1.0, .65) * w * .55 + vec3(.3, 1.0, .6) * band * .8 + vec3(.2, .9, .5) * glow;
  col = mix(col, dhCol, dh);
  float vig = smoothstep(1.3, .3, length(uv - .5));
  gl_FragColor = vec4(col * (.6 + .4 * vig), 1.0);
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
        uniforms = Object.fromEntries(["r", "t", "dh", "m"].map((name) => [name, gl.getUniformLocation(program, name)]));
      } else gl = null;
    }

    // Layer 2: light motes in three depth bands.
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
    const draw = (now) => {
      frame = requestAnimationFrame(draw);
      tick += 1;
      const t = now / 1000;
      tint += ((document.documentElement.dataset.darkHour ? 1 : 0) - tint) * .06;
      sx += (pointer.x - sx) * .06;
      sy += (pointer.y - sy) * .06;
      sScroll += (scrollY - sScroll) * .12;
      root.style.setProperty("--mx", sx.toFixed(3));
      root.style.setProperty("--my", sy.toFixed(3));
      root.style.setProperty("--sy", sScroll.toFixed(0));

      if (gl && tick % 2 === 0) {
        gl.uniform2f(uniforms.r, glCanvas.width, glCanvas.height);
        gl.uniform1f(uniforms.t, t % 3600);
        gl.uniform1f(uniforms.dh, tint);
        gl.uniform2f(uniforms.m, sx, sy);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      }

      fx.clearRect(0, 0, width, height);
      const red = Math.round(150 - 30 * tint);
      const green = Math.round(225 + 30 * tint);
      const blue = Math.round(255 - 65 * tint);
      for (const mote of motes) {
        const drift = Math.sin(t * .3 + mote.ph) * 22 * mote.z;
        const x = ((mote.x * width + drift + sx * 90 * mote.z) % width + width) % width;
        const y = (((mote.y * height - t * 14 * mote.z - sScroll * .28 * mote.z) % height) + height) % height;
        const flicker = .65 + .35 * Math.sin(t * 1.4 + mote.ph * 3);
        fx.fillStyle = `rgba(${red}, ${green}, ${blue}, ${(.18 + .5 * mote.z) * flicker})`;
        fx.beginPath();
        fx.arc(x, y, .8 + mote.z * 2.4, 0, 6.2832);
        fx.fill();
      }
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
      gl?.getExtension("WEBGL_lose_context")?.loseContext();
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
