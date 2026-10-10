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

// Home: the approved near-black navy, with a faint haze and a breathing royal-blue light behind the portrait.
vec3 home(vec2 uv, float asp) {
  vec2 p = vec2(uv.x * asp, uv.y);
  float n = sin(p.x * 2.6 + t * .07 + m.x * .6) * .5 + sin(p.y * 3.4 - t * .05 + p.x * 1.7) * .5;
  n += sin((p.x + p.y) * 4.2 + t * .09) * .35;
  float haze = smoothstep(-.3, 1.0, n);
  float shimmer = pow(.5 + .5 * sin(p.x * 9.0 + sin(p.y * 6.0 + t * .12) * 2.2 - t * .1), 6.0);
  vec3 col = vec3(.008, .024, .06);
  col += vec3(.012, .045, .13) * haze * (.35 + .65 * uv.y);
  col += vec3(.01, .05, .12) * shimmer * .22 * smoothstep(.1, .8, uv.y);
  vec2 lp = p - vec2(asp * .72, .55);
  col += vec3(.02, .09, .42) * (.5 / (1.0 + 7.0 * dot(lp, lp))) * (.85 + .15 * sin(t * .35)) * .55;
  col += vec3(.03, .10, .38) * pow(max(0.0, sin(p.x * 3.1 - p.y * 2.2 + t * .12)), 10.0) * .10 * smoothstep(.2, 1.0, uv.y);
  return col;
}

// About: turquoise and cyan with drifting pools of light (the seal and sweep are drawn by the stage).
vec3 about(vec2 uv, float asp) {
  vec2 p = vec2(uv.x * asp, uv.y);
  float g = clamp(uv.y * .7 + uv.x * .35, 0.0, 1.0);
  vec3 col = mix(vec3(.01, .09, .16), vec3(.02, .30, .40), g);
  col += vec3(.02, .12, .16) * fbm(p * 2.2 + t * .03);
  col += vec3(.05, .28, .34) * smoothstep(.55, .9, fbm(p * 3.2 + vec2(t * .04, -t * .03))) * .35;
  col += vec3(.3, .8, .95) * pow(max(0.0, sin(p.x * 2.2 + uv.y * 1.4 + t * .15)), 8.0) * .12 * uv.y;
  return col;
}

// Projects: bold royal blue with white-edged contour lines (ideas taking form).
vec3 projects(vec2 uv, float asp) {
  vec2 p = vec2(uv.x * asp, uv.y);
  vec3 col = mix(vec3(.02, .07, .36), vec3(.06, .20, .70), uv.y * .8 + uv.x * .2);
  float n = fbm(p * 1.8 + vec2(t * .015, -t * .01));
  col += vec3(.7, .85, 1.0) * smoothstep(.05, 0.0, abs(fract(n * 8.0) - .5) - .44) * .16;
  col += vec3(.1, .3, .9) * fbm(p * 1.1 - t * .02) * .25;
  return col;
}

// Skills: cyan and black, a technical field (traces, grid and scan are drawn by the stage).
vec3 skills(vec2 uv, float asp) {
  vec2 p = vec2(uv.x * asp, uv.y);
  vec3 col = mix(vec3(.0, .03, .05), vec3(.01, .20, .26), smoothstep(.2, 1.0, uv.y * .9 + uv.x * .2));
  col += vec3(.05, .35, .42) * smoothstep(.5, .85, fbm(p * 2.6 + vec2(-t * .03, t * .02))) * .3;
  col *= .8 + .2 * smoothstep(.0, .6, uv.y);
  return col;
}

// Services: deep navy with three soft anchor glows that the stage's structure connects.
vec3 services(vec2 uv, float asp) {
  vec2 p = vec2(uv.x * asp, uv.y);
  vec3 col = mix(vec3(.008, .02, .09), vec3(.03, .07, .24), uv.y);
  col += vec3(.02, .05, .16) * fbm(p * 1.4 + t * .02);
  for (int i = 0; i < 3; i++) {
    float fi = float(i);
    vec2 c = vec2(asp * (.2 + fi * .3), .35 + .3 * hash(vec2(fi, 5.0)));
    vec2 q = p - c;
    col += vec3(.1, .35, .8) * .09 * (.8 + .2 * sin(t * .6 + fi * 2.0)) / (1.0 + 18.0 * dot(q, q));
  }
  return col;
}

// Certificates: a navy digital archive, layered grids and a slow foil shine.
vec3 certificates(vec2 uv, float asp) {
  vec2 p = vec2(uv.x * asp, uv.y);
  vec3 col = mix(vec3(.008, .025, .11), vec3(.03, .08, .28), uv.y);
  col += vec3(.15, .4, .9) * max(smoothstep(.04, 0.0, abs(fract(p.x * 9.0) - .5) - .47), smoothstep(.04, 0.0, abs(fract(p.y * 9.0) - .5) - .47)) * .05;
  col += vec3(.6, .85, 1.0) * smoothstep(.07, 0.0, abs(p.x * .8 - uv.y * .55 - mod(t * .1, 3.4) + .8)) * .08;
  return col;
}

// Resume: restrained midnight blue, almost still.
vec3 resume(vec2 uv, float asp) {
  vec3 col = mix(vec3(.005, .014, .05), vec3(.012, .04, .12), uv.y);
  col += vec3(.02, .05, .12) * (.5 + .5 * sin(t * .05 + uv.x * 1.5)) * .5 * smoothstep(.2, 1.0, uv.y);
  return col;
}

// Contact: a calm dark cyan, with a soft light drifting in from the right and a slow mist.
vec3 contact(vec2 uv, float asp) {
  vec2 p = vec2(uv.x * asp, uv.y);
  vec3 col = mix(vec3(.0, .025, .04), vec3(.01, .13, .17), uv.y * .8);
  vec2 q = p - vec2(asp * (.78 + .03 * sin(t * .12)), .62);
  col += vec3(.1, .6, .75) * .13 / (1.0 + 10.0 * dot(q, q));
  col += vec3(.04, .3, .38) * fbm(p * 2.0 + vec2(t * .02, -t * .015)) * .22;
  col += vec3(.1, .6, .75) * smoothstep(.004, 0.0, abs(uv.y - .62)) * .1 * (.6 + .4 * sin(t * .4));
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
    // Quality steps down on slow devices: level 1 renders smaller and less often, level 2 drops the shader.
    let level = 0;
    let frames = 0;
    let acc = 0;
    let prevNow = 0;
    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      fxCanvas.width = width;
      fxCanvas.height = height;
      if (gl) {
        glCanvas.width = Math.min(960, Math.round(width * (coarse ? .4 : .5) * (level === 1 ? .55 : 1)));
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
      if (prevNow) {
        acc += now - prevNow;
        frames += 1;
        if (frames === 90) {
          if (acc / 90 > 42 && level < 2) {
            level += 1;
            if (level === 2) { gl = null; glCanvas.classList.remove("is-live"); } else resize();
          }
          frames = 0;
          acc = 0;
        }
      }
      prevNow = now;
      const t = now / 1000;
      sx += (pointer.x - sx) * .06;
      sy += (pointer.y - sy) * .06;

      if (targetRef.current !== to) { from = to; to = targetRef.current; fadeStart = now; }
      let k = fadeStart ? Math.min(1, (now - fadeStart) / FADE_MS) : 1;
      if (k >= 1 && fadeStart) { from = to; fadeStart = 0; k = 0; }
      else if (!fadeStart) k = 0;

      if (gl && tick % (level === 1 ? 3 : 2) === 0) {
        gl.uniform2f(uniforms.r, glCanvas.width, glCanvas.height);
        gl.uniform1f(uniforms.t, t % 3600);
        gl.uniform1f(uniforms.sa, from);
        gl.uniform1f(uniforms.sb, to);
        gl.uniform1f(uniforms.k, k);
        gl.uniform2f(uniforms.m, sx, sy);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      }

      fx.clearRect(0, 0, width, height);
      const rgb = "150, 215, 255";
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
      prevNow = 0;
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
