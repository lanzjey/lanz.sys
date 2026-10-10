import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "../lib/utils";
import { SCENES } from "../lib/scenes";

// One animated environment per scene, drawn by a single small shader at reduced resolution
// and cross-faded when the scene changes. A 2D canvas of light motes floats on top.
// Everything stops when the tab is hidden, runs lighter on touch devices, and falls back to
// per-scene CSS colours on reduced motion, data-saver or when WebGL is unavailable.
const VERT = "attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }";
const FRAG = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec2 r; uniform float t; uniform float sa; uniform float sb; uniform float k; uniform vec2 m;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p); vec2 f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}
float fbm(vec2 p) {
  float v = 0.0; float a = .5;
  for (int i = 0; i < 4; i++) { v += a * noise(p); p = p * 2.03 + 7.1; a *= .5; }
  return v;
}
float ring(float rad, float r0, float w) { return smoothstep(w, 0.0, abs(rad - r0)); }

// Home: the approved near-black navy with a faint drifting haze.
vec3 home(vec2 uv, float asp) {
  vec2 p = vec2(uv.x * asp, uv.y);
  float n = sin(p.x * 2.6 + t * .07 + m.x * .6) * .5 + sin(p.y * 3.4 - t * .05 + p.x * 1.7) * .5;
  n += sin((p.x + p.y) * 4.2 + t * .09) * .35;
  float haze = smoothstep(-.3, 1.0, n);
  float shimmer = pow(.5 + .5 * sin(p.x * 9.0 + sin(p.y * 6.0 + t * .12) * 2.2 - t * .1), 6.0);
  vec3 col = vec3(.008, .024, .06);
  col += vec3(.012, .045, .13) * haze * (.35 + .65 * uv.y);
  col += vec3(.01, .05, .12) * shimmer * .22 * smoothstep(.1, .8, uv.y);
  return col;
}

// About: teal-cyan dusk with a slowly turning seal and soft light shafts.
vec3 about(vec2 uv, float asp) {
  vec2 p = vec2(uv.x * asp, uv.y);
  vec2 q = p - vec2(asp * .70, .52);
  float rad = length(q); float ang = atan(q.y, q.x);
  float g = clamp(uv.y * .7 + uv.x * .35, 0.0, 1.0);
  vec3 col = mix(vec3(.01, .09, .16), vec3(.02, .30, .40), g);
  col += vec3(.02, .12, .16) * fbm(p * 2.2 + t * .03);
  float dashA = step(.35, .5 + .5 * sin(ang * 36.0 + t * .35));
  float dashB = step(.45, .5 + .5 * sin(ang * 22.0 - t * .25));
  col += vec3(.25, .85, 1.0) * (ring(rad, .46, .004) * dashA * .55 + ring(rad, .38, .003) * dashB * .4 + ring(rad, .52, .0025) * .25 + ring(rad, .30, .0025) * .18);
  col += vec3(.4, .95, 1.0) * step(.9, fract(ang * 5.73 + t * .02)) * ring(rad, .43, .02) * .3;
  col += vec3(.3, .8, .95) * pow(max(0.0, sin(p.x * 2.2 + uv.y * 1.4 + t * .15)), 8.0) * .14 * uv.y;
  return col;
}

// Projects: deep cobalt chart with contour lines, a grid and pulsing points of interest.
vec3 projects(vec2 uv, float asp) {
  vec2 p = vec2(uv.x * asp, uv.y);
  vec3 col = mix(vec3(.008, .03, .16), vec3(.03, .12, .5), uv.y * .8 + uv.x * .2);
  float n = fbm(p * 1.8 + vec2(t * .015, -t * .01));
  col += vec3(.2, .6, 1.0) * smoothstep(.05, 0.0, abs(fract(n * 8.0) - .5) - .44) * .22;
  vec2 gp = p * 13.0;
  col += vec3(.2, .5, 1.0) * max(smoothstep(.04, 0.0, abs(fract(gp.x) - .5) - .46), smoothstep(.04, 0.0, abs(fract(gp.y) - .5) - .46)) * .045;
  for (int i = 0; i < 5; i++) {
    float fi = float(i);
    vec2 bp = vec2(hash(vec2(fi, 1.0)) * asp, .2 + hash(vec2(fi, 2.0)) * .65);
    float d = length(p - bp);
    float pulse = .5 + .5 * sin(t * 1.2 + fi * 1.7);
    col += vec3(.4, .9, 1.0) * (exp(-d * d * 9000.0) * .9 + ring(d, .02 + pulse * .03, .002) * .25 * (1.0 - pulse));
  }
  col += vec3(.8, .95, 1.0) * smoothstep(.003, 0.0, abs(p.x * .55 - uv.y + .12 + sin(t * .1) * .015)) * .18;
  return col;
}

// Skills: turquoise with light bars that fill like skill meters and slow dark shards.
vec3 skills(vec2 uv, float asp) {
  vec2 p = vec2(uv.x * asp, uv.y);
  vec3 col = mix(vec3(.01, .10, .17), vec3(.02, .36, .46), smoothstep(.1, 1.0, uv.y * .8 + uv.x * .3));
  for (int i = 0; i < 6; i++) {
    float fi = float(i);
    float len = fract(p.x * .35 - t * (.05 + fi * .012) - fi * .21);
    col += vec3(.3, .9, .95) * smoothstep(.006, 0.0, abs(uv.y - (.16 + fi * .13))) * smoothstep(0.0, .1, len) * smoothstep(1.0, .5, len) * .18;
  }
  col *= 1.0 - smoothstep(.015, 0.0, abs(fract((p.x * 1.1 - uv.y * .8 + t * .04) * 2.5) - .5) - .4) * .28;
  col += vec3(.1, .5, .6) * fbm(p * 3.0 - t * .03) * .12;
  return col;
}

// Services: indigo to royal dusk with rising orbs (possibilities) and a drifting path.
vec3 services(vec2 uv, float asp) {
  vec2 p = vec2(uv.x * asp, uv.y);
  vec3 col = mix(vec3(.015, .02, .12), vec3(.09, .09, .42), smoothstep(0.0, 1.0, uv.y));
  col += vec3(.04, .06, .2) * fbm(p * 1.6 + t * .02);
  for (int i = 0; i < 9; i++) {
    float fi = float(i);
    vec2 oc = vec2(hash(vec2(fi, 1.0)) * asp, fract(hash(vec2(fi, 2.0)) + t * (.025 + .03 * hash(vec2(fi, 3.0)))));
    float rr = .012 + .03 * hash(vec2(fi, 4.0));
    float d = length(p - oc);
    col += vec3(.5, .7, 1.0) * (exp(-d * d / (rr * rr)) * .55 + ring(d, rr * 1.8, .0015) * .2);
  }
  col += vec3(.3, .6, 1.0) * smoothstep(.003, 0.0, abs(uv.y - (.3 + .22 * sin(p.x * 2.0 + t * .1)))) * .12;
  return col;
}

// Certificates: calm navy with faint medal rings and a slow foil shine.
vec3 certificates(vec2 uv, float asp) {
  vec2 p = vec2(uv.x * asp, uv.y);
  vec2 q = p - vec2(asp * .5, .5);
  float rad = length(q); float ang = atan(q.y, q.x);
  vec3 col = mix(vec3(.008, .025, .11), vec3(.03, .08, .28), uv.y);
  col += vec3(.15, .4, .9) * pow(.5 + .5 * sin(rad * 110.0 + sin(ang * 14.0 + t * .1) * 2.5), 8.0) * .08 * smoothstep(.9, .1, rad);
  col += vec3(.3, .7, 1.0) * (ring(rad, .28, .003) + ring(rad, .36, .002) + ring(rad, .5, .0025)) * .2;
  col += vec3(.6, .85, 1.0) * smoothstep(.07, 0.0, abs(p.x * .8 - uv.y * .55 - mod(t * .12, 3.4) + .8)) * .1;
  return col;
}

// Resume: near-black blue ruled page with a cyan scan line.
vec3 resume(vec2 uv, float asp) {
  vec2 p = vec2(uv.x * asp, uv.y);
  vec3 col = mix(vec3(.005, .014, .05), vec3(.01, .035, .11), uv.y);
  col += vec3(.1, .3, .8) * smoothstep(.06, 0.0, abs(fract(uv.y * 26.0) - .5) - .47) * .05;
  col += vec3(.2, .6, 1.0) * smoothstep(.0015, 0.0, abs(p.x - .11 * asp)) * .12;
  float d = uv.y - fract(t * .07);
  float trail = d < 0.0 ? exp(d * 12.0) * .09 : 0.0;
  col += vec3(.3, .8, 1.0) * (smoothstep(.004, 0.0, abs(d)) * .5 + trail);
  return col;
}

// Contact: the Dark Hour. Green night, a large moon glow, pulsing rings and a faint HUD grid.
vec3 contact(vec2 uv, float asp) {
  vec2 p = vec2(uv.x * asp, uv.y);
  vec2 q = p - vec2(asp * .74, .68);
  float rad = length(q);
  vec3 col = mix(vec3(.0, .03, .025), vec3(.02, .16, .12), uv.y * .8);
  col += vec3(.15, 1.0, .65) * .16 / (1.0 + 16.0 * dot(q, q));
  float pulse = fract(t * .12);
  col += vec3(.3, 1.0, .7) * ring(rad, .1 + pulse * .7, .006) * (1.0 - pulse) * .35;
  vec2 gp = p * 16.0;
  col += vec3(.1, .6, .4) * max(smoothstep(.03, 0.0, abs(fract(gp.x) - .5) - .47), smoothstep(.03, 0.0, abs(fract(gp.y) - .5) - .47)) * .05 * smoothstep(1.1, .2, rad);
  col += vec3(.1, .5, .35) * fbm(p * 2.4 + t * .03) * .12;
  return col;
}

vec3 pick(float id, vec2 uv, float asp) {
  if (id < .5) return home(uv, asp);
  if (id < 1.5) return about(uv, asp);
  if (id < 2.5) return projects(uv, asp);
  if (id < 3.5) return skills(uv, asp);
  if (id < 4.5) return services(uv, asp);
  if (id < 5.5) return certificates(uv, asp);
  if (id < 6.5) return resume(uv, asp);
  return contact(uv, asp);
}

void main() {
  vec2 uv = gl_FragCoord.xy / r;
  float asp = r.x / r.y;
  vec3 col = pick(sa, uv, asp);
  if (k > .001) col = mix(col, pick(sb, uv, asp), smoothstep(0.0, 1.0, k));
  col += (fract(sin(dot(gl_FragCoord.xy + t, vec2(12.9898, 78.233))) * 43758.5453) - .5) * .008;
  col *= .86 + .14 * smoothstep(1.4, .3, length(uv - .5));
  gl_FragColor = vec4(col, 1.0);
}`;

const FADE_MS = 700;

export default function Backdrop({ scene }) {
  const rootRef = useRef(null);
  const glRef = useRef(null);
  const fxRef = useRef(null);
  const targetRef = useRef(SCENES.indexOf(scene));

  useEffect(() => { targetRef.current = Math.max(0, SCENES.indexOf(scene)); }, [scene]);

  useEffect(() => {
    const root = rootRef.current;
    const glCanvas = glRef.current;
    const fxCanvas = fxRef.current;
    if (!root || prefersReducedMotion() || navigator.connection?.saveData) return undefined;

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
        uniforms = Object.fromEntries(["r", "t", "sa", "sb", "k", "m"].map((name) => [name, gl.getUniformLocation(program, name)]));
      } else gl = null;
    }

    const fx = fxCanvas.getContext("2d");
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const motes = Array.from({ length: coarse ? 22 : 48 }, () => ({ x: Math.random(), y: Math.random(), z: .2 + Math.random() * .8, ph: Math.random() * 6.28 }));

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

    let frame = 0;
    let tick = 0;
    let sx = 0;
    let sy = 0;
    let from = targetRef.current;
    let to = targetRef.current;
    let fadeStart = 0;
    const draw = (now) => {
      frame = requestAnimationFrame(draw);
      tick += 1;
      const t = now / 1000;
      sx += (pointer.x - sx) * .06;
      sy += (pointer.y - sy) * .06;

      if (targetRef.current !== to) { from = to; to = targetRef.current; fadeStart = now; }
      let k = fadeStart ? Math.min(1, (now - fadeStart) / FADE_MS) : 1;
      if (k >= 1 && fadeStart) { from = to; fadeStart = 0; k = 0; }
      else if (!fadeStart) k = 0;

      if (gl && tick % 2 === 0) {
        gl.uniform2f(uniforms.r, glCanvas.width, glCanvas.height);
        gl.uniform1f(uniforms.t, t % 3600);
        gl.uniform1f(uniforms.sa, from);
        gl.uniform1f(uniforms.sb, to);
        gl.uniform1f(uniforms.k, k);
        gl.uniform2f(uniforms.m, sx, sy);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      }

      fx.clearRect(0, 0, width, height);
      const rgb = to === SCENES.length - 1 ? "170, 255, 205" : "150, 215, 255";
      motes.forEach((mote) => {
        const x = ((mote.x * width + Math.sin(t * .3 + mote.ph) * 22 * mote.z + sx * 90 * mote.z) % width + width) % width;
        const y = (((mote.y * height - t * 14 * mote.z) % height) + height) % height;
        fx.fillStyle = `rgba(${rgb}, ${(.1 + .3 * mote.z) * (.65 + .35 * Math.sin(t * 1.4 + mote.ph * 3))})`;
        fx.beginPath();
        fx.arc(x, y, .7 + mote.z * 1.5, 0, 6.2832);
        fx.fill();
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
      glCanvas.classList.remove("is-live");
    };
  }, []);

  return <div ref={rootRef} className="backdrop" data-scene={scene} aria-hidden="true">
    <canvas ref={glRef} className="bd-gl" />
    <canvas ref={fxRef} className="bd-fx" />
  </div>;
}
