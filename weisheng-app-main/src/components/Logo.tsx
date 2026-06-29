import React from 'react';
import { motion } from 'framer-motion';

interface LogoProps {
  size?: number;
  color?: string;
  className?: string;
}

/** Convert angle (degrees, 0=right, clockwise in SVG coords) to point on circle */
function polar(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

/** Build an SVG arc path for a circle arc, skipping a gap of `gapDeg` degrees centered at `gapCenterDeg`.
 *  All angles in degrees, SVG convention (0=right, clockwise).
 *  Example: gapCenterDeg=270 (top), gapDeg=35 → arc runs from 287.5° clockwise to 252.5°
 */
function ringArcPath(
  cx: number,
  cy: number,
  r: number,
  gapCenterDeg: number,
  gapDeg: number,
): string {
  const half = gapDeg / 2;
  // Arc starts just past the gap (clockwise), ends just before the gap
  const startDeg = gapCenterDeg + half; // e.g. 270+17.5=287.5
  const endDeg = gapCenterDeg - half;   // e.g. 270-17.5=252.5
  // Normalise to [0, 360)
  const sDeg = ((startDeg % 360) + 360) % 360;
  const eDeg = ((endDeg % 360) + 360) % 360;
  const start = polar(cx, cy, r, sDeg);
  const end = polar(cx, cy, r, eDeg);
  // Arc length = 360 - gap (e.g. 325°), which is > 180° → large-arc-flag = 1
  const largeArc = gapDeg < 180 ? 1 : 0;
  // We go clockwise (sweep-flag = 1) from start to end
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
}

export default function Logo({ size = 48, className = '' }: LogoProps) {
  const gold = '#C9A96E';
  const cx = 50;
  const cy = 50;
  const outerR = 42;
  const innerR = 28;
  const gapDeg = 35;

  // Outer ring: gap centered at top (270° in SVG coords)
  const outerPath = ringArcPath(cx, cy, outerR, 270, gapDeg);
  // Inner ring: gap centered at bottom (90° in SVG coords)
  const innerPath = ringArcPath(cx, cy, innerR, 90, gapDeg);

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient id="coreGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFF8E7" />
            <stop offset="60%" stopColor="#D4B87A" />
            <stop offset="100%" stopColor="#C9A96E" />
          </radialGradient>
          <radialGradient id="outerGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#C9A96E" stopOpacity="0.35" />
            <stop offset="50%" stopColor="#C9A96E" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#C9A96E" stopOpacity="0" />
          </radialGradient>
          <filter id="coreGlow" x="-150%" y="-150%" width="400%" height="400%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Glow Layer 2 — soft wide halo (behind everything) */}
        <circle cx={cx} cy={cy} r="12" fill="url(#outerGlow)" />

        {/* Glow Layer 1 — tighter glow (~1.4× core radius) */}
        <circle cx={cx} cy={cy} r="10.5" fill="url(#outerGlow)" />

        {/* Inner Ring — Gap at 6 o'clock (Bottom, 90°) */}
        <motion.g
          animate={{
            opacity: [0.2, 1, 0.2],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2,
          }}
        >
          <motion.path
            d={innerPath}
            stroke={gold}
            strokeWidth="1.8"
            strokeLinecap="butt"
            fill="none"
            animate={{ scale: [0.98, 1, 0.98] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            style={{ originX: "50%", originY: "50%" }}
          />
        </motion.g>

        {/* Outer Ring — Gap at 12 o'clock (Top, 270°) */}
        <motion.g
          animate={{
            opacity: [1, 0.2, 1],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <motion.path
            d={outerPath}
            stroke={gold}
            strokeWidth="2.5"
            strokeLinecap="butt"
            fill="none"
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            style={{ originX: "50%", originY: "50%" }}
          />
        </motion.g>

        {/* Central Core Sphere */}
        <motion.circle
          cx={cx}
          cy={cy}
          r="7.5"
          fill="url(#coreGradient)"
          filter="url(#coreGlow)"
          animate={{
            opacity: [1, 0.7, 1],
            scale: [1, 1.15, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </svg>
    </div>
  );
}
