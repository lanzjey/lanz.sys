import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "../lib/utils";

// A very quiet living background in the page's own near-black navy:
//   1. a WebGL shader at reduced resolution drawing a slow, faint drifting haze;
//   2. a 2D canvas of tiny light motes in three depth layers (scroll and pointer parallax).
// Everything stops when the tab is hidden, drops to a lighter setup on touch devices, and falls
// back to the plain CSS colour on reduced motion or data-saver. <html data-dark-hour="1"> tints it green.
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
  vec2 p = vec2(uv.x * asp, uv.y);
  float n = sin(p.x * 2.6 + t * .07 + m.x * .6) * .5 + sin(p.y * 3.4 - t * .05 + p.x * 1.7) * .5;
  n += sin((p.x + p.y) * 4.2 + t * .09) * .35;
  float haze = smoothstep(-.3, 1.0, n);
  float shimmer = pow(.5 + .5 * sin(p.x * 9.0 + sin(p.y * 6.0 + t * .12) * 2.2 - t * .1), 6.0);
  vec3 col = vec3(.008, .024, .06);
  col += vec3(.012, .045, .13) * haze * (.35 + .65 * uv.y);
  col += vec3(.01, .05, .12) * shimmer * .22 * smoothstep(.1, .8, uv.y);
  col *= mix(1.0, .75, d);
  float lum = dot(col, vec3(.3, .59, .11));
  col = mix(col, vec3(lum * .3, lum * 1.5, lum * .9) + vec3(.0, .006, .004), dh);
  col += (fract(sin(dot(gl_FragCoord.xy + t, vec2(12.9898, 78.233))) * 43758.5453) - .5) * .008;
  gl_FragColor = vec4(col, 1.0);
}`;

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
      const rgb = tint > .5 ? "170, 255, 205" : "150, 215, 255";
      motes.forEach((mote) => {
        const drift = Math.sin(t * .3 + mote.ph) * 22 * mote.z;
        const x = ((mote.x * width + drift + sx * 90 * mote.z) % width + width) % width;
        const y = (((mote.y * height - t * 16 * mote.z - sScroll * .3 * mote.z) % height) + height) % height;
        const flicker = .7 + .3 * Math.sin(t * 1.4 + mote.ph * 3);
        fx.fillStyle = `rgba(${rgb}, ${(.1 + .3 * mote.z) * flicker})`;
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
      window.removeEventListener("scroll", onScroll);
      glCanvas.classList.remove("is-live");
    };
  }, []);

  return <div ref={rootRef} className="backdrop" aria-hidden="true">
    <canvas ref={glRef} className="bd-gl" />
    <canvas ref={fxRef} className="bd-fx" />
    <i className="veil" />
  </div>;
}
