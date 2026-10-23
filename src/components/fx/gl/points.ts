'use client';

import { fxPixelRatio } from '../budget';
import { reducedMotion } from '../motion';
import { addEffect, kick } from '../ticker';

/**
 * Plain WebGL for the point-cloud scenes (embers, the home crown). They only draw points with a
 * custom shader, and three.js for that was a 136 KB download on almost every page; this is a few
 * KB. Scenes with meshes and textures (card fan, river, showdown) still use three.js (./three).
 *
 * Matrices are column-major Float32Arrays, as WebGL takes them.
 */

export type Mat4 = Float32Array;

/** A perspective projection (fov in degrees, vertical). */
export function perspective(fovDeg: number, aspect: number, near: number, far: number): Mat4 {
  const f = 1 / Math.tan((fovDeg * Math.PI) / 360);
  const nf = 1 / (near - far);
  return new Float32Array([f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) * nf, -1, 0, 0, 2 * far * near * nf, 0]);
}

/**
 * The model-view matrix for a camera at (0, 0, z) looking down -z at an object rotated by `rx`
 * then `ry` (three.js's 'XYZ' order): translate(0, 0, -z) · Rx · Ry.
 */
export function modelView(z: number, rx = 0, ry = 0): Mat4 {
  const cx = Math.cos(rx);
  const sx = Math.sin(rx);
  const cy = Math.cos(ry);
  const sy = Math.sin(ry);
  // Rx · Ry, column-major, then the camera's translation in the last column.
  return new Float32Array([cy, sx * sy, -cx * sy, 0, 0, cx, sx, 0, sy, -sx * cy, cx * cy, 0, 0, 0, -z, 1]);
}

export type PointsCtx = {
  gl: WebGLRenderingContext;
  dpr: number;
  /** Uniform location in the scene's program. */
  u: (name: string) => WebGLUniformLocation | null;
};

export type PointsScene = {
  /** Called every drawn frame; `t` in seconds since mount, `still` under reduced motion. Draws its own points. */
  frame: (t: number, dt: number, still: boolean, size: { w: number; h: number }) => void;
};

function compile(gl: WebGLRenderingContext, type: number, src: string): WebGLShader | null {
  const s = gl.createShader(type);
  if (!s) return null;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
}

/**
 * Mounts a transparent canvas that fills `el`, builds a program from `vertex`/`fragment` (GLSL ES
 * 1.0, attributes as given in `attributes`), and draws `setup`'s frames on the shared loop
 * (../ticker): only while on screen, the tab visible and the visitor not idle, at `fps`; one still
 * frame under reduced motion. Returns a cleanup function, or null without WebGL.
 */
export function mountPoints(
  el: HTMLElement,
  shaders: { vertex: string; fragment: string },
  attributes: Record<string, { data: Float32Array; size: number }>,
  setup: (ctx: PointsCtx) => PointsScene,
  opts: { fps?: number } = {},
): (() => void) | null {
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl', { alpha: true, antialias: false, premultipliedAlpha: true, powerPreference: 'low-power' });
  if (!gl) return null;
  const vs = compile(gl, gl.VERTEX_SHADER, shaders.vertex);
  const fs = compile(gl, gl.FRAGMENT_SHADER, `precision mediump float;\n${shaders.fragment}`);
  const prog = gl.createProgram();
  if (!vs || !fs || !prog) return null;
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
  gl.useProgram(prog);

  let count = 0;
  const buffers: WebGLBuffer[] = [];
  for (const [name, { data, size }] of Object.entries(attributes)) {
    const loc = gl.getAttribLocation(prog, name);
    if (loc < 0) continue;
    const buf = gl.createBuffer()!;
    buffers.push(buf);
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0);
    count = data.length / size;
  }
  gl.disable(gl.DEPTH_TEST);
  gl.enable(gl.BLEND);
  gl.clearColor(0, 0, 0, 0);

  const dpr = fxPixelRatio();
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;pointer-events:none';
  el.appendChild(canvas);
  const uniforms = new Map<string, WebGLUniformLocation | null>();
  const s = setup({ gl, dpr, u: (n) => (uniforms.has(n) ? uniforms.get(n)! : (uniforms.set(n, gl.getUniformLocation(prog, n)), uniforms.get(n)!)) });

  const size = { w: 1, h: 1 };
  const resize = () => {
    size.w = el.clientWidth || 1;
    size.h = el.clientHeight || 1;
    canvas.width = Math.round(size.w * dpr);
    canvas.height = Math.round(size.h * dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);
    drawn = false;
    kick();
  };
  let drawn = false;
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(el);

  let visible = true;
  const io = new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (visible) kick();
  });
  io.observe(el);

  const t0 = performance.now();
  let last = t0;
  const stop = addEffect(
    (now) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      gl.clear(gl.COLOR_BUFFER_BIT);
      s.frame((now - t0) / 1000, dt, reducedMotion(), size);
      gl.drawArrays(gl.POINTS, 0, count);
      drawn = true;
    },
    { active: () => visible && !(drawn && reducedMotion()), fps: opts.fps ?? 60 },
  );

  return () => {
    stop();
    ro.disconnect();
    io.disconnect();
    for (const b of buffers) gl.deleteBuffer(b);
    gl.deleteProgram(prog);
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    canvas.remove();
  };
}

/** Additive (glow on dark) or normal (on pale art) blending, for premultiplied colours. */
export function setBlend(gl: WebGLRenderingContext, additive: boolean) {
  if (additive) gl.blendFunc(gl.ONE, gl.ONE);
  else gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
}
