"use client";

import { useEffect, useRef } from "react";

interface Shape {
  x: number; y: number; vx: number; vy: number; r: number; alpha: number; alphaDir: number;
  alphaSpeed: number; color: string; kind: "circle" | "star" | "heart" | "line" | "spiral"; rot: number; rotSpeed: number;
}

const COLORS = ["#ead2d4", "#c9899e", "#8fa391", "#b8adc8", "#f5d8dc", "#d9c7ba"];
const KINDS: Shape["kind"][] = ["circle", "star", "heart", "line", "spiral"];

function draw(ctx: CanvasRenderingContext2D, s: Shape) {
  ctx.save();
  ctx.translate(s.x, s.y);
  ctx.rotate(s.rot);
  ctx.globalAlpha = s.alpha;
  ctx.strokeStyle = s.color;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  if (s.kind === "circle") ctx.arc(0, 0, s.r, 0, Math.PI * 2);
  else if (s.kind === "star") {
    for (let i = 0; i < 5; i++) {
      const a = (i * 4 * Math.PI) / 5 - Math.PI / 2;
      const b = a + Math.PI / 5;
      if (i === 0) ctx.moveTo(Math.cos(a) * s.r, Math.sin(a) * s.r);
      else ctx.lineTo(Math.cos(a) * s.r, Math.sin(a) * s.r);
      ctx.lineTo(Math.cos(b) * s.r * 0.4, Math.sin(b) * s.r * 0.4);
    }
    ctx.closePath();
  } else if (s.kind === "heart") {
    const r = s.r * 0.7;
    ctx.moveTo(0, r * 0.4);
    ctx.bezierCurveTo(-r, -r * 0.5, -r * 2, r * 0.5, 0, r * 1.4);
    ctx.bezierCurveTo(r * 2, r * 0.5, r, -r * 0.5, 0, r * 0.4);
  } else if (s.kind === "line") {
    ctx.moveTo(-s.r, 0); ctx.lineTo(s.r, 0); ctx.moveTo(0, -s.r); ctx.lineTo(0, s.r);
  } else {
    for (let t = 0; t < Math.PI * 4; t += 0.15) {
      const r2 = (s.r / (Math.PI * 4)) * t;
      if (t === 0) ctx.moveTo(r2 * Math.cos(t), r2 * Math.sin(t));
      else ctx.lineTo(r2 * Math.cos(t), r2 * Math.sin(t));
    }
  }
  ctx.stroke();
  ctx.restore();
}

/** Decorative drifting doodles behind the auth card. Runs only while mounted + active. */
export function DoodleCanvas({ active }: { active: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!active || !canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;
    canvas.width = parent.offsetWidth;
    canvas.height = parent.offsetHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const shapes: Shape[] = Array.from({ length: 18 }, () => ({
      x: Math.random() * canvas.width, y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.6, vy: (Math.random() - 0.5) * 0.6,
      r: 8 + Math.random() * 22, alpha: 0.15 + Math.random() * 0.45,
      alphaDir: Math.random() > 0.5 ? 1 : -1, alphaSpeed: 0.004 + Math.random() * 0.008,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      kind: KINDS[Math.floor(Math.random() * KINDS.length)],
      rot: Math.random() * Math.PI * 2, rotSpeed: (Math.random() - 0.5) * 0.03,
    }));

    let raf = 0;
    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const s of shapes) {
        s.x += s.vx; s.y += s.vy; s.rot += s.rotSpeed; s.alpha += s.alphaDir * s.alphaSpeed;
        if (s.alpha > 0.6 || s.alpha < 0.08) s.alphaDir *= -1;
        if (s.x < -s.r * 2) s.x = canvas.width + s.r;
        if (s.x > canvas.width + s.r * 2) s.x = -s.r;
        if (s.y < -s.r * 2) s.y = canvas.height + s.r;
        if (s.y > canvas.height + s.r * 2) s.y = -s.r;
        draw(ctx, s);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active]);

  return <canvas className="auth-canvas" ref={ref} />;
}
