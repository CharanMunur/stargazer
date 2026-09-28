import React, { useEffect, useRef, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import type { TemplateCardProps } from './types';
import sampleStargazers from '@/data/sampleStargazers.json';

// Yellow star matching Stargazer design tokens
const YellowStar: React.FC<{ size?: number }> = ({ size = 68 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="#FACC15"
    stroke="#EAB308"
    strokeWidth="1.1"
    aria-hidden="true"
    className="shrink-0 drop-shadow-[0_0_18px_rgba(250,204,21,0.55)]"
  >
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

function AnimatedNumber({ value, animated = true }: { value: number; animated?: boolean }) {
  const [displayValue, setDisplayValue] = useState(animated ? 0 : value);

  useEffect(() => {
    if (!animated) {
      setDisplayValue(value);
      return;
    }
    let startTime: number | null = null;
    const duration = 1200;

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(value * ease));

      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };

    const animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, [value, animated]);

  return <>{displayValue.toLocaleString()}</>;
}

interface PrecomputedAvatarItem {
  angle: number;
  cosA: number;
  sinA: number;
  startDist: number;
  exitDist: number;
  initialProgress: number;
  speed: number;
  stargazerIndex: number;
}

export const HyperdriveCard: React.FC<TemplateCardProps> = ({
  data,
  theme = 'dark',
  animated = true,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const avatarRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [scale, setScale] = useState(1);

  const isDark = theme === 'dark';
  const bgColor = isDark ? '#05070D' : '#F6F9FD';
  const titleColor = isDark ? '#FFFFFF' : '#0F172A';
  const subColor = isDark ? '#38BDF8' : '#0284C7';

  useEffect(() => {
    if (!containerRef.current) return;
    const updateScale = () => {
      if (containerRef.current) {
        setScale(containerRef.current.clientWidth / 1600);
      }
    };
    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const stargazersList =
    data.stargazers && data.stargazers.length > 0 ? data.stargazers : sampleStargazers;

  const count = 28;
  const avatarItems = useMemo<PrecomputedAvatarItem[]>(() => {
    const items: PrecomputedAvatarItem[] = [];
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + (i % 5) * 0.12;
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);
      const absCos = Math.abs(cosA);
      const absSin = Math.abs(sinA);

      // Distance to Cockpit HUD edge (half-width 310, half-height 170)
      const hudDist = Math.min(
        absCos > 0.0001 ? 310 / absCos : 9999,
        absSin > 0.0001 ? 170 / absSin : 9999
      );
      // Starts deep inside the HUD so it is never visible on spawn
      const startDist = hudDist * 0.35;

      // Distance to screen boundary (half-width 800, half-height 450)
      const edgeDist = Math.min(
        absCos > 0.0001 ? 800 / absCos : 9999,
        absSin > 0.0001 ? 450 / absSin : 9999
      );
      // Exits fully beyond the viewport before wrapping
      const exitDist = edgeDist + 140;

      const speed = 0.22 + (i % 4) * 0.035;
      const initialProgress = (i * (1 / count)) % 1;

      items.push({
        angle,
        cosA,
        sinA,
        startDist,
        exitDist,
        initialProgress,
        speed,
        stargazerIndex: i % stargazersList.length,
      });
    }
    return items;
  }, [stargazersList.length]);

  // Precompute 64 anamorphic laser warp streaks
  const laserBeams = useMemo(() => {
    const beams = [];
    const beamCount = 64;
    for (let i = 0; i < beamCount; i++) {
      const angle = (i / beamCount) * Math.PI * 2 + ((i * 17) % 7) * 0.05;
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);
      const absCos = Math.abs(cosA);
      const absSin = Math.abs(sinA);
      const edgeDist = Math.min(
        absCos > 0.0001 ? 800 / absCos : 9999,
        absSin > 0.0001 ? 450 / absSin : 9999
      );
      const speed = 0.35 + (i % 5) * 0.06;
      const initialProgress = (i * (1 / beamCount)) % 1;
      const baseLength = 160 + (i % 4) * 80;
      const isGold = i % 8 === 0;
      const isWhite = i % 5 === 0 && !isGold;

      beams.push({
        angle,
        cosA,
        sinA,
        edgeDist,
        speed,
        initialProgress,
        baseLength,
        isGold,
        isWhite,
        strokeWidth: isGold ? 2.5 : isWhite ? 2.0 : 1.5,
        alphaMultiplier: 0.25 + (i % 3) * 0.18,
      });
    }
    return beams;
  }, []);

  // Precompute 36 high-velocity stardust specks
  const stardust = useMemo(() => {
    const dust = [];
    for (let s = 0; s < 36; s++) {
      const angle = (s / 36) * Math.PI * 2 + ((s * 23) % 9) * 0.08;
      const speed = 0.5 + (s % 4) * 0.1;
      const initialProgress = (s * (1 / 36)) % 1;
      const radius = 1.2 + (s % 2) * 1.0;
      const isGold = s % 3 === 0;
      dust.push({ angle, speed, initialProgress, radius, isGold });
    }
    return dust;
  }, []);

  // High-performance 60/120fps hardware-accelerated animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = 1600;
    const height = 900;
    const cx = 800;
    const cy = 450;

    const renderFrame = (timeSec: number) => {
      // 1. Background Fill
      ctx.fillStyle = isDark ? '#05070D' : '#F6F9FD';
      ctx.fillRect(0, 0, width, height);

      // 2. Anamorphic Hyperspace Radial Glow
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 750);
      if (isDark) {
        grad.addColorStop(0, 'rgba(14, 165, 233, 0.25)');
        grad.addColorStop(0.3, 'rgba(99, 102, 241, 0.12)');
        grad.addColorStop(0.55, 'rgba(245, 158, 11, 0.04)');
        grad.addColorStop(0.75, 'transparent');
      } else {
        grad.addColorStop(0, 'rgba(14, 165, 233, 0.18)');
        grad.addColorStop(0.3, 'rgba(99, 102, 241, 0.08)');
        grad.addColorStop(0.7, 'transparent');
      }
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // 3. 64 Anamorphic Laser Warp Beams (Continuous, seamless lifecycle)
      ctx.save();
      for (let i = 0; i < laserBeams.length; i++) {
        const b = laserBeams[i];
        const p = (b.initialProgress + timeSec * b.speed) % 1;

        const length = b.baseLength * (0.3 + Math.pow(p, 1.4) * 1.5);
        const startDist = 70 + Math.pow(p, 2.0) * (b.edgeDist - 40);
        const endDist = startDist + length;

        const x1 = cx + b.cosA * startDist;
        const y1 = cy + b.sinA * startDist;
        const x2 = cx + b.cosA * endDist;
        const y2 = cy + b.sinA * endDist;

        let alpha = 1;
        if (p < 0.15) {
          alpha = p / 0.15;
        } else if (p > 0.8) {
          alpha = (1 - p) / 0.2;
        }
        alpha *= b.alphaMultiplier;

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = b.isGold
          ? '#FACC15'
          : b.isWhite
          ? (isDark ? '#E0F2FE' : '#0369A1')
          : (isDark ? '#38BDF8' : '#0284C7');
        ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
        ctx.lineWidth = b.strokeWidth;
        ctx.lineCap = 'round';
        ctx.stroke();
      }
      ctx.restore();

      // 4. Relativistic Shockwave Rings (Expanding continuous wavefronts)
      ctx.save();
      const ringCount = 4;
      for (let k = 0; k < ringCount; k++) {
        const ringP = (k / ringCount + timeSec * 0.22) % 1;
        const r = 70 + Math.pow(ringP, 1.6) * 1050;

        let ringAlpha = 0;
        if (ringP < 0.25) {
          ringAlpha = (ringP / 0.25) * 0.26;
        } else {
          ringAlpha = ((1 - ringP) / 0.75) * 0.26;
        }

        if (ringAlpha > 0.01) {
          ctx.beginPath();
          ctx.ellipse(cx, cy, r * 1.08, r * 0.94, 0, 0, Math.PI * 2);
          ctx.strokeStyle = isDark ? '#38BDF8' : '#0284C7';
          ctx.globalAlpha = ringAlpha;
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      }
      ctx.restore();

      // 5. Stardust specks (High-velocity particles)
      ctx.save();
      for (let s = 0; s < stardust.length; s++) {
        const d = stardust[s];
        const sP = (d.initialProgress + timeSec * d.speed) % 1;
        const sDist = 60 + Math.pow(sP, 2.2) * 900;

        const px = cx + Math.cos(d.angle) * sDist;
        const py = cy + Math.sin(d.angle) * sDist;

        let sAlpha = 1;
        if (sP < 0.2) sAlpha = sP / 0.2;
        else if (sP > 0.85) sAlpha = (1 - sP) / 0.15;

        ctx.beginPath();
        ctx.arc(px, py, d.radius, 0, Math.PI * 2);
        ctx.fillStyle = d.isGold ? '#FACC15' : isDark ? '#BAE6FD' : '#0284C7';
        ctx.globalAlpha = Math.max(0, Math.min(1, sAlpha * 0.6));
        ctx.fill();
      }
      ctx.restore();

      // 6. Direct DOM transform updates for Contributor Avatars (0 React re-renders!)
      for (let i = 0; i < avatarItems.length; i++) {
        const el = avatarRefs.current[i];
        if (!el) continue;
        const item = avatarItems[i];
        const p = (item.initialProgress + timeSec * item.speed) % 1;

        const dist = item.startDist + (item.exitDist - item.startDist) * Math.pow(p, 2.2);
        const posX = cx + item.cosA * dist;
        const posY = cy + item.sinA * dist;

        const scaleVal = 0.38 + Math.pow(p, 1.8) * 1.35;
        const alpha = p < 0.1 ? p / 0.1 : 1;
        const z = 5 + Math.round(p * 35);

        el.style.transform = `translate3d(${posX}px, ${posY}px, 0) translate(-50%, -50%) scale(${scaleVal})`;
        el.style.opacity = `${alpha}`;
        el.style.zIndex = `${z}`;
      }
    };

    if (!animated) {
      renderFrame(0.5);
      return;
    }

    let animId: number;
    let start: number | null = null;
    const loop = (now: number) => {
      if (start === null) start = now;
      const timeSec = (now - start) / 1000;
      renderFrame(timeSec);
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [animated, isDark, avatarItems, laserBeams, stardust]);

  const repoFullName = data.owner ? `${data.owner}/${data.repo}` : data.repo;

  return (
    <div
      ref={containerRef}
      className={`relative w-full aspect-[16/9] overflow-hidden select-none ${className}`}
      style={{ backgroundColor: bgColor }}
    >
      <div
        className="w-[1600px] h-[900px] absolute top-0 left-0 origin-top-left overflow-hidden"
        style={{
          transform: `scale(${scale})`,
          fontFamily: "'DM Sans', sans-serif",
          backgroundColor: bgColor,
        }}
      >
        {/* Hardware-Accelerated 60/120fps Hyperdrive Canvas */}
        <canvas
          ref={canvasRef}
          width={1600}
          height={900}
          className="absolute inset-0 pointer-events-none"
        />

        {/* 3D Contributor Avatars flying outward */}
        {avatarItems.map((item, idx) => {
          const user = stargazersList[item.stargazerIndex] || { login: 'user', avatarUrl: '' };
          const chipSize = 74;

          return (
            <div
              key={idx}
              ref={(el) => {
                avatarRefs.current[idx] = el;
              }}
              className="absolute pointer-events-none flex items-center justify-center rounded-2xl will-change-transform"
              style={{
                left: 0,
                top: 0,
                width: chipSize,
                height: chipSize,
                transform: 'translate3d(800px, 450px, 0) translate(-50%, -50%) scale(0.38)',
                opacity: 0,
                backgroundColor: isDark ? 'rgba(10, 18, 30, 0.94)' : 'rgba(255, 255, 255, 0.96)',
                border: isDark
                  ? '2px solid rgba(56, 189, 248, 0.55)'
                  : '2px solid rgba(2, 132, 199, 0.4)',
                boxShadow: isDark
                  ? '0 0 24px rgba(56, 189, 248, 0.4), 0 8px 18px rgba(0,0,0,0.65)'
                  : '0 0 20px rgba(2, 132, 199, 0.25), 0 8px 14px rgba(0,0,0,0.08)',
                zIndex: 10,
              }}
            >
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.login}
                  className="w-full h-full object-cover rounded-xl"
                  crossOrigin="anonymous"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-bold text-sm uppercase text-sky-400">
                  {user.login.slice(0, 2)}
                </div>
              )}
            </div>
          );
        })}

        {/* Center Aerospace Cockpit Core HUD */}
        <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
          <motion.div
            initial={animated ? { scale: 0.88, opacity: 0 } : { scale: 1, opacity: 1 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="relative flex flex-col items-center text-center px-12 py-10 rounded-[32px]"
            style={{
              backgroundColor: isDark ? 'rgba(8, 14, 25, 0.88)' : 'rgba(255, 255, 255, 0.92)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              border: isDark
                ? '1.5px solid rgba(56, 189, 248, 0.3)'
                : '1.5px solid rgba(2, 132, 199, 0.2)',
              boxShadow: isDark
                ? '0 25px 60px -12px rgba(0, 0, 0, 0.85), 0 0 45px rgba(56, 189, 248, 0.2)'
                : '0 25px 60px -12px rgba(0, 0, 0, 0.1), 0 0 35px rgba(2, 132, 199, 0.15)',
              width: '620px',
            }}
          >
            {/* Owner Mascot Avatar */}
            {data.ownerAvatarUrl && (
              <div
                className="w-20 h-20 rounded-2xl overflow-hidden mb-4 border shadow-md shrink-0 flex items-center justify-center"
                style={{
                  borderColor: isDark ? 'rgba(56, 189, 248, 0.4)' : 'rgba(2, 132, 199, 0.3)',
                  backgroundColor: isDark ? 'rgba(20, 28, 45, 0.8)' : '#FFFFFF',
                  boxShadow: isDark
                    ? '0 8px 24px rgba(0,0,0,0.5), 0 0 20px rgba(56, 189, 248, 0.2)'
                    : '0 8px 24px rgba(0,0,0,0.08), 0 0 15px rgba(2, 132, 199, 0.12)',
                }}
              >
                <img
                  src={data.ownerAvatarUrl}
                  alt={data.owner}
                  className="w-full h-full object-cover"
                  crossOrigin="anonymous"
                />
              </div>
            )}

            {/* Repo Owner & Name */}
            <h2
              className="text-3xl font-bold tracking-tight truncate max-w-[520px] mb-3"
              style={{ color: titleColor }}
            >
              {repoFullName}
            </h2>

            {/* Giant Star Counter Row */}
            <div className="flex items-center justify-center gap-4 my-1">
              <YellowStar size={68} />
              <span
                className="text-8xl font-black tracking-tight leading-none"
                style={{ color: titleColor }}
              >
                <AnimatedNumber value={data.stars} animated={animated} />
              </span>
            </div>

            {/* Subtitle */}
            <span
              className="text-xs font-bold tracking-[0.2em] uppercase mt-3"
              style={{ color: subColor }}
            >
              community stargazers
            </span>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
