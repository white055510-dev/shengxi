import React, { useEffect } from 'react';
import { motion } from 'framer-motion';

interface SplashScreenProps {
  onFinish: () => void;
  appName: string;
  tagline: string;
}

/** SVG polar coordinate helper */
function polar(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

/** Build arc path data; clockwise=true goes sweep=1, clockwise=false goes sweep=0 */
function arcPath(
  cx: number, cy: number, r: number,
  gapCenterDeg: number, gapDeg: number,
  clockwise: boolean,
) {
  const half = gapDeg / 2;
  const sDeg = clockwise ? gapCenterDeg + half : gapCenterDeg - half;
  const eDeg = clockwise ? gapCenterDeg - half : gapCenterDeg + half;
  const s = polar(cx, cy, r, sDeg);
  const e = polar(cx, cy, r, eDeg);
  const sweep = clockwise ? 1 : 0;
  const largeArc = 1; // arc > 180°
  return `M ${s.x.toFixed(2)} ${s.y.toFixed(2)} A ${r} ${r} 0 ${largeArc} ${sweep} ${e.x.toFixed(2)} ${e.y.toFixed(2)}`;
}

/** Arc length of a circular segment (gap excluded) */
function arcLen(r: number, gapDeg: number) {
  return r * ((360 - gapDeg) * Math.PI) / 180;
}

export default function SplashScreen({ onFinish, appName, tagline }: SplashScreenProps) {
  const gold = '#C9A96E';
  const cx = 50, cy = 50;
  const outerR = 42, innerR = 28, gapDeg = 35;

  const outerArcLen = arcLen(outerR, gapDeg);
  const innerArcLen = arcLen(innerR, gapDeg);

  // Outer: clockwise, gap at top (270°)
  const outerD = arcPath(cx, cy, outerR, 270, gapDeg, true);
  // Inner: counter-clockwise, gap at bottom (90°)
  const innerD = arcPath(cx, cy, innerR, 90, gapDeg, false);

  useEffect(() => {
    const timer = setTimeout(onFinish, 1800);
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black">
      <svg
        width={80}
        height={80}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="mb-6"
      >
        {/* Glow halo behind center */}
        <circle cx={cx} cy={cy} r="12" fill="#C9A96E" opacity="0.08" />
        <circle cx={cx} cy={cy} r="9" fill="#C9A96E" opacity="0.15" />

        {/* Outer Ring — clockwise draw */}
        <motion.path
          d={outerD}
          fill="none"
          stroke={gold}
          strokeWidth="2.5"
          strokeLinecap="butt"
          strokeDasharray={outerArcLen}
          initial={{ strokeDashoffset: outerArcLen }}
          animate={{ strokeDashoffset: 0 }}
          transition={{ duration: 0.7, ease: "easeInOut", delay: 0 }}
        />

        {/* Inner Ring — counter-clockwise draw */}
        <motion.path
          d={innerD}
          fill="none"
          stroke={gold}
          strokeWidth="1.8"
          strokeLinecap="butt"
          strokeDasharray={innerArcLen}
          initial={{ strokeDashoffset: innerArcLen }}
          animate={{ strokeDashoffset: 0 }}
          transition={{ duration: 0.7, ease: "easeInOut", delay: 0.25 }}
        />

        {/* Center orb */}
        <defs>
          <radialGradient id="splashCore" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFF8E7" />
            <stop offset="60%" stopColor="#D4B87A" />
            <stop offset="100%" stopColor="#C9A96E" />
          </radialGradient>
          <filter id="splashGlow" x="-200%" y="-200%" width="500%" height="500%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        <motion.circle
          cx={cx}
          cy={cy}
          r="7.5"
          fill="url(#splashCore)"
          filter="url(#splashGlow)"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.7 }}
          style={{ originX: "50%", originY: "50%" }}
        />
      </svg>

      {/* App name + tagline */}
      <motion.div
        className="flex flex-col items-center"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut", delay: 1.0 }}
      >
        <h1 className="text-2xl font-bold tracking-tight text-white mb-1">
          {appName}
        </h1>
        <p className="text-[10px] uppercase tracking-[0.4em] text-white/30 font-bold">
          {tagline}
        </p>
      </motion.div>
    </div>
  );
}
