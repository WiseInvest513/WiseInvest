"use client";

import { useEffect, useRef, useState } from "react";

type TrailPoint = { x: number; y: number };

const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

class Rocket {
  x: number;
  y: number;
  targetY: number;
  progress: number;
  durationMs: number;
  trail: TrailPoint[];

  constructor(width: number, height: number) {
    this.x = width * 0.5;
    this.y = height;
    this.targetY = height * 0.25;
    this.progress = 0;
    this.durationMs = 900; // Slower launch for a clearer upward phase
    this.trail = Array.from({ length: 6 }, () => ({ x: this.x, y: this.y }));
  }

  update(deltaMs: number): boolean {
    const lastY = this.y;
    this.progress = clamp(this.progress + deltaMs / this.durationMs, 0, 1);

    // Ease-out so it feels punchy and rapid.
    const eased = 1 - (1 - this.progress) * (1 - this.progress);
    this.y = this.y + (this.targetY - this.y) * (eased * 0.16 + 0.06);

    // Keep the trajectory deterministic to guarantee ~300ms arrival.
    if (this.progress >= 1) this.y = this.targetY;

    this.trail.pop();
    this.trail.unshift({ x: this.x, y: lastY });

    return this.progress >= 1;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.beginPath();
    ctx.moveTo(this.trail[this.trail.length - 1].x, this.trail[this.trail.length - 1].y);
    for (let i = this.trail.length - 2; i >= 0; i -= 1) {
      ctx.lineTo(this.trail[i].x, this.trail[i].y);
    }
    ctx.strokeStyle = "rgba(255, 58, 58, 0.95)";
    ctx.lineWidth = 2.4;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(this.x, this.y, 3.2, 0, Math.PI * 2);
    ctx.fillStyle = "#ffe27a";
    ctx.fill();
  }
}

class Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  friction: number;
  gravity: number;
  alpha: number;
  decay: number;
  radius: number;
  color: string;
  trail: TrailPoint[];

  constructor(x: number, y: number, index: number, count: number) {
    const angle = (Math.PI * 2 * index) / count;
    const speed = 11 + Math.random() * 7.5;
    const colorRoll = Math.random();
    const palette =
      colorRoll < 0.62
        ? "#ff2d2d" // red dominant
        : colorRoll < 0.78
          ? "#ffd400" // yellow
          : colorRoll < 0.9
            ? "#2edb65" // green
            : "#9b4dff"; // purple

    this.x = x;
    this.y = y;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;

    this.friction = 0.955;
    this.gravity = 0.14;
    this.alpha = 1;
    this.decay = 0.013 + Math.random() * 0.009;
    this.radius = 1.7 + Math.random() * 1.6;
    this.color = palette;
    this.trail = Array.from({ length: 3 }, () => ({ x, y }));
  }

  update(): boolean {
    this.trail.pop();
    this.trail.unshift({ x: this.x, y: this.y });

    this.vx *= this.friction;
    this.vy *= this.friction;
    this.vy += this.gravity;

    this.x += this.vx;
    this.y += this.vy;

    this.alpha -= this.decay;
    return this.alpha > 0;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.beginPath();
    ctx.moveTo(this.trail[this.trail.length - 1].x, this.trail[this.trail.length - 1].y);
    for (let i = this.trail.length - 2; i >= 0; i -= 1) {
      ctx.lineTo(this.trail[i].x, this.trail[i].y);
    }
    ctx.strokeStyle = this.color === "#ff2d2d"
      ? `rgba(255, 45, 45, ${Math.max(this.alpha, 0)})`
      : this.color === "#ffd400"
        ? `rgba(255, 212, 0, ${Math.max(this.alpha, 0)})`
        : this.color === "#2edb65"
          ? `rgba(46, 219, 101, ${Math.max(this.alpha, 0)})`
          : `rgba(155, 77, 255, ${Math.max(this.alpha, 0)})`;
    ctx.lineWidth = 1.4;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.color === "#ff2d2d"
      ? `rgba(255, 45, 45, ${Math.max(this.alpha, 0)})`
      : this.color === "#ffd400"
        ? `rgba(255, 212, 0, ${Math.max(this.alpha, 0)})`
        : this.color === "#2edb65"
          ? `rgba(46, 219, 101, ${Math.max(this.alpha, 0)})`
          : `rgba(155, 77, 255, ${Math.max(this.alpha, 0)})`;
    ctx.fill();
  }
}

export function SingleFireworkOverlay() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [active, setActive] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    let rafId = 0;
    let mounted = true;
    let hasExploded = false;
    let lastFrameTime = performance.now();
    let elapsedMs = 0;

    const rocket = new Rocket(width, height);
    const particles: Particle[] = [];

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;

      const dpr = Math.max(1, window.devicePixelRatio || 1);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const spawnExplosion = (x: number, y: number) => {
      const count = 260;
      for (let i = 0; i < count; i += 1) {
        particles.push(new Particle(x, y, i, count));
      }
    };

    const tick = (now: number) => {
      const deltaMs = Math.min(32, now - lastFrameTime);
      lastFrameTime = now;
      elapsedMs += deltaMs;

      // Subtle trail without creating a heavy dark overlay.
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
      ctx.fillRect(0, 0, width, height);
      ctx.globalCompositeOperation = "lighter";

      if (!hasExploded) {
        const exploded = rocket.update(deltaMs);
        rocket.draw(ctx);
        if (exploded) {
          hasExploded = true;
          spawnExplosion(rocket.x, rocket.y);
        }
      }

      for (let i = particles.length - 1; i >= 0; i -= 1) {
        const particle = particles[i];
        const alive = particle.update();
        if (!alive) {
          particles.splice(i, 1);
          continue;
        }
        particle.draw(ctx);
      }

      // Safety gate for longer celebration while still auto-cleaning.
      if (elapsedMs >= 2400 && particles.length === 0) {
        ctx.globalCompositeOperation = "source-over";
        ctx.clearRect(0, 0, width, height);
        if (mounted) setActive(false);
        return;
      }

      if (hasExploded && particles.length === 0) {
        ctx.globalCompositeOperation = "source-over";
        ctx.clearRect(0, 0, width, height);
        if (mounted) setActive(false);
        return;
      }

      rafId = window.requestAnimationFrame(tick);
    };

    resize();
    window.addEventListener("resize", resize);
    rafId = window.requestAnimationFrame(tick);

    return () => {
      mounted = false;
      window.removeEventListener("resize", resize);
      window.cancelAnimationFrame(rafId);
    };
  }, []);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-[10010] bg-transparent"
      aria-hidden
    />
  );
}

// Backward-compatible export name for existing imports.
export const FireworksOverlay = SingleFireworkOverlay;
