import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "../lib/utils";

// Full-page animated water caustics, drawn with one small fragment shader at reduced resolution.
// It slows to 30 fps, stops when the tab is hidden, and falls back to the CSS gradient on
// reduced motion, data-saver, or when WebGL is missing. The Dark Hour tint blends in when
// <html data-dark-hour="1"> is set (the contact section does that).
const VERT = "attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }";
const FRAG = `
precision mediump float;
uniform vec2 r; uniform float t; uniform float dh; uniform vec2 m;
void main(){
  vec2 uv = gl_FragCoord.xy / r;
  vec2 p = (gl_FragCoord.xy / r.y) * 5.0 + m * 0.4;
  vec2 i = p; float c = 1.0; float inten = .006;
  for (int n = 0; n < 4; n++) {
    float tt = t * .22 * (1.0 - 3.2 / float(n + 1));
    i = p + vec2(cos(tt - i.x) + sin(tt + i.y), sin(tt - i.y) + cos(tt + i.x));
    c += 1.0 / length(vec2(p.x / (sin(i.x + tt) / inten), p.y / (cos(i.y + tt) / inten)));
  }
  c /= 4.0; c = 1.17 - pow(c, 1.35);
  float w = pow(abs(c), 7.0);
  vec3 deep = mix(vec3(.008, .022, .07), vec3(.04, .13, .42), smoothstep(.1, 1.0, uv.y * .8 + uv.x * .35));
  vec3 lit = vec3(.22, .72, .95);
  vec3 col = deep + lit * w * .42;
  vec3 dhDeep = vec3(.01, .06, .05);
  vec3 dhCol = dhDeep + mix(vec3(.02, .15, .1), vec3(.28, 1.0, .72), w) * (.12 + w * .4);
  col = mix(col, dhCol, dh);
  float vig = smoothstep(1.25, .25, length(uv - .5));
  gl_FragColor = vec4(col * (.55 + .45 * vig), 1.0);
}`;

export default function Backdrop() {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    const saveData = navigator.connection?.saveData;
    if (!canvas || prefersReducedMotion() || saveData) return undefined;
    const gl = canvas.getContext("webgl", { antialias: false, alpha: false, powerPreference: "low-power" });
    if (!gl) return undefined;
    const compile = (type, source) => {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      return gl.getShaderParameter(shader, gl.COMPILE_STATUS) ? shader : null;
    };
    const vs = compile(gl.VERTEX_SHADER, VERT);
    const fs = compile(gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return undefined;
    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return undefined;
    gl.useProgram(program);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, "p");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    const u = Object.fromEntries(["r", "t", "dh", "m"].map((name) => [name, gl.getUniformLocation(program, name)]));

    const scale = .45;
    const resize = () => {
      canvas.width = Math.min(960, Math.round(window.innerWidth * scale));
      canvas.height = Math.round(canvas.width * (window.innerHeight / window.innerWidth));
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();
    window.addEventListener("resize", resize);

    const pointer = { x: 0, y: 0 };
    const onPointer = (event) => { pointer.x = event.clientX / window.innerWidth - .5; pointer.y = event.clientY / window.innerHeight - .5; };
    window.addEventListener("pointermove", onPointer, { passive: true });

    let frame = 0;
    let last = 0;
    let tint = 0;
    let smoothX = 0;
    let smoothY = 0;
    const draw = (now) => {
      frame = requestAnimationFrame(draw);
      if (now - last < 33) return;
      last = now;
      tint += ((document.documentElement.dataset.darkHour ? 1 : 0) - tint) * .08;
      smoothX += (pointer.x - smoothX) * .06;
      smoothY += (pointer.y - smoothY) * .06;
      gl.uniform2f(u.r, canvas.width, canvas.height);
      gl.uniform1f(u.t, now / 1000);
      gl.uniform1f(u.dh, tint);
      gl.uniform2f(u.m, smoothX, smoothY);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    const onVisibility = () => {
      cancelAnimationFrame(frame);
      if (!document.hidden) frame = requestAnimationFrame(draw);
    };
    document.addEventListener("visibilitychange", onVisibility);
    frame = requestAnimationFrame(draw);
    canvas.classList.add("is-live");

    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointer);
      canvas.classList.remove("is-live");
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, []);

  return <div className="backdrop" aria-hidden="true">
    <canvas ref={ref} />
    <i className="veil" />
  </div>;
}
