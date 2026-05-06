import { useRef, useEffect, useCallback } from "react";
import { OpportunityType } from "@/types";
import { cn } from "@/lib/utils";

// RGBA color sets per opportunity type (4 colors each, matching mobile config)
const COLORS_BY_TYPE: Record<OpportunityType, [number, number, number, number][]> = {
  buy: [
    [0.0, 0.43, 0.47, 1],   // #006D77 teal
    [0.0, 0.55, 0.58, 1],   // lighter teal
    [0.03, 0.33, 0.35, 1],  // #08535A dark teal
    [0.0, 0.38, 0.42, 1],   // mid teal
  ],
  sell: [
    [0.72, 0.36, 0.22, 1],  // #B85C38 terracotta
    [0.85, 0.45, 0.28, 1],  // lighter terracotta
    [0.49, 0.25, 0.15, 1],  // #7D3F27 dark terracotta
    [0.65, 0.32, 0.2, 1],   // mid terracotta
  ],
  rent: [
    [0.25, 0.25, 0.71, 1],  // #3F3FB4 indigo
    [0.32, 0.32, 0.82, 1],  // lighter indigo
    [0.22, 0.22, 0.6, 1],   // #373799 dark indigo
    [0.28, 0.28, 0.75, 1],  // mid indigo
  ],
  lease: [
    [0.61, 0.31, 0.59, 1],  // #9C4F96 orchid
    [0.72, 0.4, 0.68, 1],   // lighter orchid
    [0.49, 0.24, 0.47, 1],  // #7E3E79 dark orchid
    [0.56, 0.28, 0.53, 1],  // mid orchid
  ],
  mortgage: [
    [0.36, 0.42, 0.31, 1],  // #5C6B4F olive
    [0.45, 0.52, 0.38, 1],  // lighter olive
    [0.24, 0.28, 0.18, 1],  // #3D472F dark olive
    [0.32, 0.38, 0.28, 1],  // mid olive
  ],
};

const DEFAULT_COLORS = COLORS_BY_TYPE.buy;
const BOTTOM_COLOR: [number, number, number, number] = [0.1, 0.1, 0.1, 1];

// GLSL fragment shader ported from the Skia shader
const FRAGMENT_SHADER = `
  precision highp float;

  uniform vec2 iResolution;
  uniform float headerHeight;
  uniform float iTime;
  uniform vec4 color1;
  uniform vec4 color2;
  uniform vec4 color3;
  uniform vec4 color4;
  uniform vec4 bottomColor;
  uniform float twistSpeed;
  uniform float maxTwist;
  uniform float loopDuration;

  void main() {
    vec2 uv = gl_FragCoord.xy / iResolution;
    uv.y = 1.0 - uv.y; // flip Y for WebGL
    float aspect = iResolution.x / iResolution.y;
    float headerRatio = headerHeight / iResolution.y;

    // Twist focal point
    vec2 focalPoint = vec2(0.5, headerRatio * 0.5);
    vec2 uvCentered = uv - focalPoint;
    uvCentered.x *= aspect;

    float dist = length(uvCentered);
    float twistFalloff = 1.0 - smoothstep(0.0, 0.8, dist);
    float angle = twistFalloff * maxTwist * sin(iTime * twistSpeed);

    float s = sin(angle);
    float c = cos(angle);
    vec2 uvTwisted = vec2(
      uvCentered.x * c - uvCentered.y * s,
      uvCentered.x * s + uvCentered.y * c
    );
    uvTwisted.x /= aspect;
    uvTwisted += focalPoint;

    vec2 headerUV = vec2(uvTwisted.x, uvTwisted.y / headerRatio);

    // Point animation
    float ease = smoothstep(0.0, 1.0, sin(fract(iTime / loopDuration) * 6.28318530718) * 0.5 + 0.5);

    vec2 center = vec2(0.5, 0.5);
    vec2 p1 = mix(vec2(-0.2, -0.2), center, ease * 0.65);
    vec2 p2 = mix(vec2(1.2, -0.2), center, ease * 0.6);
    vec2 p3 = mix(vec2(-0.2, 1.2), center, ease * 0.7);
    vec2 p4 = mix(vec2(1.2, 1.2), center, ease * 0.65);

    // Inverse distance weighting
    float softness = 1.5;
    float eps = 0.001;

    float w1 = 1.0 / (pow(distance(headerUV, p1), softness) + eps);
    float w2 = 1.0 / (pow(distance(headerUV, p2), softness) + eps);
    float w3 = 1.0 / (pow(distance(headerUV, p3), softness) + eps);
    float w4 = 1.0 / (pow(distance(headerUV, p4), softness) + eps);

    vec4 meshColor = (color1 * w1 + color2 * w2 + color3 * w3 + color4 * w4) / (w1 + w2 + w3 + w4);

    // Blend to bottom color below header region
    float belowHeader = smoothstep(headerRatio * 0.7, headerRatio * 1.2, uv.y);

    gl_FragColor = mix(meshColor, bottomColor, belowHeader);
  }
`;

const VERTEX_SHADER = `
  attribute vec2 position;
  void main() {
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

function lerpRGBA(
  a: [number, number, number, number],
  b: [number, number, number, number],
  t: number
): [number, number, number, number] {
  return [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
    a[3] + (b[3] - a[3]) * t,
  ];
}

interface MeshGradientProps {
  activeType: OpportunityType;
  className?: string;
  /** Header height ratio (0-1). Default 1.0 = full canvas is "header" */
  headerRatio?: number;
  twistSpeed?: number;
  maxTwist?: number;
  loopDuration?: number;
}

export function MeshGradient({
  activeType,
  className,
  headerRatio = 1.0,
  twistSpeed = 0.3,
  maxTwist = 4,
  loopDuration = 12,
}: MeshGradientProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const uniformsRef = useRef<Record<string, WebGLUniformLocation | null>>({});
  const rafRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const startColorsRef = useRef<[number, number, number, number][]>(
    COLORS_BY_TYPE[activeType]?.map(c => [...c] as [number, number, number, number]) ?? DEFAULT_COLORS.map(c => [...c] as [number, number, number, number])
  );
  const currentColorsRef = useRef<[number, number, number, number][]>(
    COLORS_BY_TYPE[activeType]?.map(c => [...c] as [number, number, number, number]) ?? DEFAULT_COLORS.map(c => [...c] as [number, number, number, number])
  );
  const targetColorsRef = useRef<[number, number, number, number][]>(
    COLORS_BY_TYPE[activeType]?.map(c => [...c] as [number, number, number, number]) ?? DEFAULT_COLORS.map(c => [...c] as [number, number, number, number])
  );
  const colorTransitionRef = useRef<number>(1); // 0 = start, 1 = done

  // Update target colors on type change - snapshot current as start
  useEffect(() => {
    const newTarget = COLORS_BY_TYPE[activeType] ?? DEFAULT_COLORS;
    startColorsRef.current = currentColorsRef.current.map(c => [...c] as [number, number, number, number]);
    targetColorsRef.current = newTarget.map(c => [...c] as [number, number, number, number]);
    colorTransitionRef.current = 0;
  }, [activeType]);

  const initGL = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl", { alpha: false, antialias: false });
    if (!gl) return;
    glRef.current = gl;

    // Compile shaders
    const vs = gl.createShader(gl.VERTEX_SHADER)!;
    gl.shaderSource(vs, VERTEX_SHADER);
    gl.compileShader(vs);

    const fs = gl.createShader(gl.FRAGMENT_SHADER)!;
    gl.shaderSource(fs, FRAGMENT_SHADER);
    gl.compileShader(fs);

    const program = gl.createProgram()!;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    gl.useProgram(program);
    programRef.current = program;

    // Full-screen quad
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const pos = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

    // Cache uniform locations
    const names = ["iResolution", "headerHeight", "iTime", "color1", "color2", "color3", "color4", "bottomColor", "twistSpeed", "maxTwist", "loopDuration"];
    for (const name of names) {
      uniformsRef.current[name] = gl.getUniformLocation(program, name);
    }

    startTimeRef.current = performance.now() / 1000;
  }, []);

  const render = useCallback(() => {
    const gl = glRef.current;
    const canvas = canvasRef.current;
    if (!gl || !canvas) return;

    // Resize canvas to match display size
    const dpr = Math.min(window.devicePixelRatio, 2);
    const w = canvas.clientWidth * dpr;
    const h = canvas.clientHeight * dpr;
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
    }

    // Smoothly interpolate colors (transition over ~1.5s)
    if (colorTransitionRef.current < 1) {
      colorTransitionRef.current = Math.min(1, colorTransitionRef.current + 0.012);
      const t = colorTransitionRef.current;
      const eased = t * t * (3 - 2 * t); // smoothstep
      for (let i = 0; i < 4; i++) {
        currentColorsRef.current[i] = lerpRGBA(
          startColorsRef.current[i],
          targetColorsRef.current[i],
          eased
        );
      }
    }

    const u = uniformsRef.current;
    const time = performance.now() / 1000 - startTimeRef.current;
    const colors = currentColorsRef.current;

    gl.uniform2f(u.iResolution!, w, h);
    gl.uniform1f(u.headerHeight!, h * headerRatio);
    gl.uniform1f(u.iTime!, time);
    gl.uniform4fv(u.color1!, colors[0]);
    gl.uniform4fv(u.color2!, colors[1]);
    gl.uniform4fv(u.color3!, colors[2]);
    gl.uniform4fv(u.color4!, colors[3]);
    gl.uniform4fv(u.bottomColor!, BOTTOM_COLOR);
    gl.uniform1f(u.twistSpeed!, twistSpeed);
    gl.uniform1f(u.maxTwist!, maxTwist);
    gl.uniform1f(u.loopDuration!, loopDuration);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    rafRef.current = requestAnimationFrame(render);
  }, [headerRatio, twistSpeed, maxTwist, loopDuration]);

  useEffect(() => {
    initGL();
    rafRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafRef.current);
  }, [initGL, render]);

  return (
    <canvas
      ref={canvasRef}
      className={cn("absolute inset-0 w-full h-full", className)}
      style={{ display: "block" }}
    />
  );
}
