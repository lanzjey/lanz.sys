import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "../lib/utils";

// The living background, three layers deep:
//   1. a WebGL shader at reduced resolution: a moonlit night sea of five layered, flowing waves
//      with cyan crest lines, moon glints and a soft horizon haze that darkens as you scroll;
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
float waveY(float x, float base, float amp, float freq, float spd, float ph) {
  return base + amp * sin(x * freq + t * spd + ph) + amp * .55 * sin(x * freq * 2.3 - t * spd * .7 + ph * 1.7) + amp * .25 * sin(x * freq * 4.1 + t * spd * 1.3 + ph * .4);
}
void main(){
  vec2 uv = gl_FragCoord.xy / r;
  float asp = r.x / r.y;
  float x = uv.x * asp;
  vec3 sky = mix(vec3(.008, .02, .07), vec3(.02, .08, .26), smoothstep(.15, 1.0, uv.y));
  vec2 mp = vec2(asp * .70, .74 + sin(t * .15) * .01);
  float md = length(vec2(x, uv.y) - mp);
  sky += vec3(.12, .5, 1.0) * .13 / (1.0 + 16.0 * md * md);
  vec3 col = sky;
  float refl = exp(-pow((x - mp.x) * 2.6, 2.0));
  for (int i = 0; i < 5; i++) {
    float fi = float(i);
    float k = fi / 4.0;
    float base = .56 - fi * .115 + m.y * .012 * (fi + 1.0);
    float amp = .010 + k * .022;
    float yy = waveY(x + m.x * .06 * (fi + 1.0), base, amp, 2.6 + fi * 1.3, .30 + fi * .11, fi * 2.1);
    float above = uv.y - yy;
    float fill = smoothstep(.0025, -.0025, above);
    vec3 lc = mix(vec3(.03, .16, .5), vec3(.012, .05, .22), k);
    lc *= .55 + .45 * smoothstep(-.28, 0.0, above);
    float ripple = pow(.5 + .5 * sin(above * 110.0 + x * 7.0 + t * (.6 + fi * .2)), 3.0) * .045;
    float glint = refl * pow(.5 + .5 * sin(x * 95.0 + sin(above * 38.0 + t * .9 + fi) * 3.2 - t * 1.6), 9.0) * (1.0 - k * .5) * smoothstep(-.2, 0.0, above);
    vec3 layer = lc + vec3(.2, .6, 1.0) * ripple * (1.0 - k * .4) + vec3(.55, .9, 1.0) * glint * .34;
    layer += vec3(.25, .75, 1.0) * smoothstep(.014, 0.0, abs(above)) * (.5 - k * .25);
    col = mix(col, layer, fill);
  }
  col += vec3(.1, .35, .8) * exp(-pow((uv.y - .60) * 6.0, 2.0)) * .09;
  col *= mix(1.0, .55, d);
  float lum = dot(col, vec3(.3, .59, .11));
  col = mix(col, vec3(lum * .35, lum * 1.35, lum * .85) + vec3(.0, .012, .01), dh);
  col += (fract(sin(dot(gl_FragCoord.xy + t, vec2(12.9898, 78.233))) * 43758.5453) - .5) * .018;
  col *= .8 + .2 * smoothstep(1.4, .3, length(uv - .5));
  gl_FragColor = vec4(col, 1.0);
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
