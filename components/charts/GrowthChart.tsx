'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import styles from './GrowthChart.module.css';

interface DayData {
  day: number;
  date: string;
  revenue: number;
  totalRevenue: number;
  deaths: number;
  totalDeaths: number;
  survivors: number;
}

interface TooltipData {
  x: number;
  day: number;
  date: string;
  totalRevenue: number;
  totalDeaths: number;
  survivors: number;
}

const W = 800;
const H = 180;

/**
 * Convert data points into a smooth cubic bezier SVG path (matching the HTML reference style).
 * Uses Catmull-Rom → cubic bezier conversion for natural curves.
 */
function smoothPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M${points[0].x},${points[0].y}`;
  if (points.length === 2) return `M${points[0].x},${points[0].y} L${points[1].x},${points[1].y}`;

  let d = `M${points[0].x},${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];

    // Catmull-Rom to cubic bezier control points (tension = 0.33)
    const t = 0.33;
    const cp1x = p1.x + (p2.x - p0.x) * t;
    const cp1y = p1.y + (p2.y - p0.y) * t;
    const cp2x = p2.x - (p3.x - p1.x) * t;
    const cp2y = p2.y - (p3.y - p1.y) * t;

    d += ` C${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
  }
  return d;
}

function smoothArea(points: { x: number; y: number }[]): string {
  if (points.length === 0) return '';
  const line = smoothPath(points);
  const last = points[points.length - 1];
  const first = points[0];
  // Close area to bottom of chart (H) for gradient fill
  return `${line} L${last.x},${H} L${first.x},${H} Z`;
}

export default function GrowthChart() {
  const [days, setDays] = useState<DayData[]>([]);
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const [loading, setLoading] = useState(true);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/stats/global');
        if (res.ok) {
          const data = await res.json();
          setDays(data.days || []);
        }
      } catch (e) {
        console.error('Failed to load chart data:', e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Each metric uses its own max for independent scaling
  // This ensures all three lines use the full chart height
  const maxRevenue = Math.max(1, ...days.map(d => d.totalRevenue));
  const maxDeaths = Math.max(1, ...days.map(d => d.totalDeaths));
  const maxSurvivors = Math.max(1, ...days.map(d => d.survivors));

  const PAD_TOP = 8;
  const PAD_BOT = 20;

  const toX = (i: number) => {
    if (days.length <= 1) return W / 2;
    return (i / (days.length - 1)) * W;
  };

  // Scale value against its own max so each line fills the chart independently
  const toY = (val: number, max: number) => {
    if (max === 0) return H - PAD_BOT;
    return PAD_TOP + (1 - val / max) * (H - PAD_TOP - PAD_BOT);
  };

  const revenuePoints = days.map((d, i) => ({ x: toX(i), y: toY(d.totalRevenue, maxRevenue) }));
  const deathPoints = days.map((d, i) => ({ x: toX(i), y: toY(d.totalDeaths, maxDeaths) }));
  const survivorPoints = days.map((d, i) => ({ x: toX(i), y: toY(d.survivors, maxSurvivors) }));

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (days.length === 0 || !svgRef.current) return;
      const rect = svgRef.current.getBoundingClientRect();
      const mouseX = ((e.clientX - rect.left) / rect.width) * W;
      // Find closest day index
      let closest = 0;
      let closestDist = Infinity;
      for (let i = 0; i < days.length; i++) {
        const dist = Math.abs(toX(i) - mouseX);
        if (dist < closestDist) {
          closestDist = dist;
          closest = i;
        }
      }
      const d = days[closest];
      setTooltip({
        x: toX(closest),
        day: d.day,
        date: d.date,
        totalRevenue: d.totalRevenue,
        totalDeaths: d.totalDeaths,
        survivors: d.survivors,
      });
    },
    [days]
  );

  const handleMouseLeave = () => setTooltip(null);

  if (loading) {
    return <div className={styles.chartArea}><div className={styles.loading}>Loading...</div></div>;
  }

  if (days.length === 0) {
    return <div className={styles.chartArea}><div className={styles.loading}>No data yet</div></div>;
  }

  // Tooltip position as percentage for CSS
  const tooltipLeftPct = tooltip ? (tooltip.x / W) * 100 : 0;
  // Flip tooltip to left side when near right edge
  const tooltipFlip = tooltipLeftPct > 75;

  return (
    <div className={styles.chartArea}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className={styles.svg}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <defs>
          <linearGradient id="gcGradRevenue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(255,204,0,0.2)" />
            <stop offset="100%" stopColor="rgba(255,204,0,0)" />
          </linearGradient>
          <linearGradient id="gcGradRip" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(229,48,48,0.15)" />
            <stop offset="100%" stopColor="rgba(229,48,48,0)" />
          </linearGradient>
          <linearGradient id="gcGradSurv" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(0,255,102,0.15)" />
            <stop offset="100%" stopColor="rgba(0,255,102,0)" />
          </linearGradient>
          {/* Clip-path draw animation — matching HTML reference */}
          <clipPath id="gcClipDraw">
            <rect x="0" y="0" width="0" height="180">
              <animate attributeName="width" from="0" to="800" dur="2s" fill="freeze" begin="0.3s" />
            </rect>
          </clipPath>
        </defs>

        {/* Grid lines — matching HTML reference exactly */}
        <line x1="0" y1="36" x2="800" y2="36" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
        <line x1="0" y1="72" x2="800" y2="72" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
        <line x1="0" y1="108" x2="800" y2="108" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
        <line x1="0" y1="144" x2="800" y2="144" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
        <line x1="200" y1="0" x2="200" y2="180" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
        <line x1="400" y1="0" x2="400" y2="180" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
        <line x1="600" y1="0" x2="600" y2="180" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />

        {/* All chart paths wrapped in clip-path for draw animation */}
        <g clipPath="url(#gcClipDraw)">
          {/* Area fills */}
          <path d={smoothArea(revenuePoints)} fill="url(#gcGradRevenue)" />
          <path d={smoothArea(deathPoints)} fill="url(#gcGradRip)" />
          <path d={smoothArea(survivorPoints)} fill="url(#gcGradSurv)" />

          {/* Lines */}
          <path d={smoothPath(revenuePoints)} fill="none" stroke="#ffcc00" strokeWidth="2.5" strokeLinecap="round" />
          <path d={smoothPath(deathPoints)} fill="none" stroke="#e53030" strokeWidth="2.5" strokeLinecap="round" />
          <path d={smoothPath(survivorPoints)} fill="none" stroke="#00ff66" strokeWidth="2.5" strokeLinecap="round" />
        </g>

        {/* Hover crosshair + dots */}
        {tooltip && (
          <>
            <line
              x1={tooltip.x} y1="0" x2={tooltip.x} y2={H}
              stroke="rgba(255,255,255,0.15)" strokeWidth="1" strokeDasharray="4 3"
            />
            <circle cx={tooltip.x} cy={revenuePoints[tooltip.day - 1]?.y} r="4" fill="#ffcc00" stroke="#111" strokeWidth="1.5" />
            <circle cx={tooltip.x} cy={deathPoints[tooltip.day - 1]?.y} r="4" fill="#e53030" stroke="#111" strokeWidth="1.5" />
            <circle cx={tooltip.x} cy={survivorPoints[tooltip.day - 1]?.y} r="4" fill="#00ff66" stroke="#111" strokeWidth="1.5" />
          </>
        )}
      </svg>

      {/* Tooltip overlay */}
      {tooltip && (
        <div
          className={styles.tooltip}
          style={{
            left: `${tooltipLeftPct}%`,
            transform: tooltipFlip ? 'translateX(-100%)' : 'translateX(0)',
          }}
        >
          <div className={styles.tooltipDay}>Day {tooltip.day}</div>
          <div className={styles.tooltipDate}>{tooltip.date}</div>
          <div className={styles.tooltipRow}>
            <span className={styles.dot} style={{ background: '#ffcc00' }} />
            <span className={styles.tooltipLabel}>Revenue</span>
            <span style={{ color: '#ffcc00' }}>{tooltip.totalRevenue.toLocaleString()}</span>
          </div>
          <div className={styles.tooltipRow}>
            <span className={styles.dot} style={{ background: '#e53030' }} />
            <span className={styles.tooltipLabel}>Deaths</span>
            <span style={{ color: '#e53030' }}>{tooltip.totalDeaths.toLocaleString()}</span>
          </div>
          <div className={styles.tooltipRow}>
            <span className={styles.dot} style={{ background: '#00ff66' }} />
            <span className={styles.tooltipLabel}>Survivors</span>
            <span style={{ color: '#00ff66' }}>{tooltip.survivors.toLocaleString()}</span>
          </div>
        </div>
      )}
    </div>
  );
}
