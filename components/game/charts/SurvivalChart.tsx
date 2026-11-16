'use client';

import React, { useMemo } from 'react';
import { GAME } from '@/lib/constants/game';

export default function SurvivalChart() {
  // Generate some semi-random but upward trending data for the survival curve
  const points = useMemo(() => {
    const data = [];
    let current = GAME.totalNFTs;
    for (let i = 0; i <= 30; i++) {
        current = Math.floor(GAME.totalNFTs * Math.pow(0.97, i));
        data.push({ x: i, y: current });
    }
    return data;
  }, []);

  const maxValue = GAME.totalNFTs;
  const width = 800;
  const height = 150;

  const pathData = useMemo(() => {
    if (points.length === 0) return '';
    return points.map((p, i) => {
      const x = (p.x / 30) * width;
      const y = height - (p.y / maxValue) * height;
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
  }, [points]);

  const areaData = useMemo(() => {
    if (points.length === 0) return '';
    const lastPoint = points[points.length - 1];
    const lastX = (lastPoint.x / 30) * width;
    return `${pathData} L ${lastX} ${height} L 0 ${height} Z`;
  }, [pathData, points]);

  return (
    <div style={{ width: '100%', height: '180px', position: 'relative', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
      {/* Grid lines */}
      <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 1px, transparent 1px, transparent 25px)' }}></div>
      <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.02) 0px, rgba(255,255,255,0.02) 1px, transparent 1px, transparent 50px)' }}></div>

      <svg 
        viewBox={`0 0 ${width} ${height}`} 
        className="growth-chart-svg" 
        preserveAspectRatio="none"
        style={{ width: '100%', height: '100%', display: 'block' }}
      >
        <defs>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(229, 48, 48, 0.2)" />
            <stop offset="100%" stopColor="rgba(229, 48, 48, 0)" />
          </linearGradient>
        </defs>

        {/* Area fill */}
        <path d={areaData} fill="url(#areaGradient)" />

        {/* Line */}
        <path 
          d={pathData} 
          fill="none" 
          stroke="var(--red)" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          style={{ filter: 'drop-shadow(0 0 8px rgba(229, 48, 48, 0.6))' }}
        />

        {/* Scanline overlay in SVG */}
        <rect width={width} height={height} fill="url(#scanline)" opacity="0.1" />
      </svg>
      
      {/* Labels */}
      <div style={{ position: 'absolute', top: '10px', left: '10px', fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--red)', letterSpacing: '2px' }}>
        SURVIVAL_DECAY_LOG.EXE
      </div>
      <div style={{ position: 'absolute', bottom: '10px', right: '10px', fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'rgba(255,255,255,0.3)', letterSpacing: '1px' }}>
        DAY: 24/60 · ALIVE: {points[points.length-1].y}
      </div>
    </div>
  );
}
