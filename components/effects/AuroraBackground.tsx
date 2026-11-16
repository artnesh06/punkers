'use client';

import { useEffect, useRef } from 'react';
import styles from './AuroraBackground.module.css';

interface Blob {
  x: number;
  y: number;
  r: number;
  color: [number, number, number];
  spd: number;
  amp: number;
}

export default function AuroraBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let W: number, H: number;
    let t = 0;
    let animationFrameId: number;

    const resize = () => {
      W = canvas.width = window.innerWidth;
      H = canvas.height = 320;
    };

    // Aurora blobs: each has color, speed, amplitude, base position
    const blobs: Blob[] = [
      { x: 0.15, y: 0.5, r: 0.55, color: [229, 48, 48], spd: 0.000018, amp: 0.12 },
      { x: 0.45, y: 0.4, r: 0.5, color: [180, 20, 120], spd: 0.000024, amp: 0.16 },
      { x: 0.72, y: 0.6, r: 0.48, color: [229, 90, 20], spd: 0.000015, amp: 0.1 },
      { x: 0.88, y: 0.3, r: 0.42, color: [100, 0, 180], spd: 0.00002, amp: 0.14 },
      { x: 0.3, y: 0.7, r: 0.38, color: [229, 20, 60], spd: 0.000022, amp: 0.18 },
    ];

    const draw = () => {
      t += 0.1;
      ctx.clearRect(0, 0, W, H);

      blobs.forEach((b, i) => {
        const cx = (b.x + Math.sin(t * b.spd * 1000 + i * 1.3) * b.amp) * W;
        const cy = (b.y + Math.cos(t * b.spd * 800 + i * 2.1) * b.amp * 0.6) * H;
        const rad = b.r * W * 0.5;
        const [r, g, bl] = b.color;
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad);
        grad.addColorStop(0, `rgba(${r},${g},${bl},0.9)`);
        grad.addColorStop(0.5, `rgba(${r},${g},${bl},0.3)`);
        grad.addColorStop(1, `rgba(${r},${g},${bl},0)`);
        ctx.beginPath();
        ctx.ellipse(
          cx,
          cy,
          rad,
          rad * 0.55,
          Math.sin(t * b.spd * 600 + i) * 0.4,
          0,
          Math.PI * 2
        );
        ctx.fillStyle = grad;
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(draw);
    };

    window.addEventListener('resize', resize);
    resize();
    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <>
      <canvas ref={canvasRef} id="auroraCanvas" className={styles.aurora} />
      <div className={styles.vignette} />
    </>
  );
}
