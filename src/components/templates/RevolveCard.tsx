import React, { useEffect, useRef, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import type { TemplateCardProps } from './types';
import sampleStargazers from '../../data/sampleStargazers.json';

function AnimatedNumber({ value, animated = true }: { value: number; animated?: boolean }) {
  const [displayValue, setDisplayValue] = useState(animated ? 0 : value);

  useEffect(() => {
    if (!animated) { setDisplayValue(value); return; }
    let startTime: number | null = null;
    const duration = 1400;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(value * ease));
      if (progress < 1) requestAnimationFrame(step);
    };
    const id = requestAnimationFrame(step);
    return () => cancelAnimationFrame(id);
  }, [value, animated]);

  return <>{displayValue.toLocaleString()}</>;
}

const YellowStar: React.FC<{ size?: number }> = ({ size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24"
    fill="#FACC15" stroke="#EAB308" strokeWidth="1.1" aria-hidden="true"
    style={{ flexShrink: 0 }}>
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

// Ring definitions — chipSize ascends outward, inner ring boosted
// [count, radius, chipSize, durationSec, clockwise, offsetDeg]
const RINGS = [
  { count: 5,  radius: 310, chipSize: 70, duration: 26, clockwise: true,  offsetDeg: 45  },
  { count: 8,  radius: 440, chipSize: 74, duration: 40, clockwise: false, offsetDeg: 0   },
  { count: 11, radius: 570, chipSize: 78, duration: 56, clockwise: true,  offsetDeg: 30  },
  { count: 14, radius: 700, chipSize: 82, duration: 72, clockwise: false, offsetDeg: 60  },
  { count: 17, radius: 830, chipSize: 86, duration: 90, clockwise: true,  offsetDeg: 22.5 },
] as const;

interface AvatarChipProps {
  login: string;
  avatarUrl?: string;
  isDark: boolean;
  chipSize: number;
  animName: string;
  duration: number;
  animated: boolean;
  startDeg: number;
  radius: number;
}

const AvatarChip: React.FC<AvatarChipProps> = ({
  login, avatarUrl, isDark, chipSize, animName, duration, animated, startDeg, radius,
}) => {
  const [imgError, setImgError] = useState(false);
  const r = chipSize * 0.28;

  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: chipSize,
        height: chipSize,
        borderRadius: r,
        overflow: 'hidden',
        backgroundColor: isDark ? 'rgba(22,20,30,0.95)' : 'rgba(255,255,255,0.97)',
        border: isDark ? '1.5px solid rgba(255,255,255,0.13)' : '1.5px solid rgba(0,0,0,0.08)',
        boxShadow: isDark
          ? '0 6px 20px rgba(0,0,0,0.55), 0 1px 4px rgba(0,0,0,0.35)'
          : '0 6px 20px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)',
        transform: `rotate(${startDeg}deg) translateX(${radius}px) rotate(${-startDeg}deg) translate(-50%, -50%)`,
        animationName: animated ? animName : 'none',
        animationDuration: `${duration}s`,
        animationTimingFunction: 'linear',
        animationIterationCount: 'infinite',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 4,
      }}
    >
      {avatarUrl && !imgError ? (
        <img
          src={avatarUrl}
          alt={login}
          onError={() => setImgError(true)}
          crossOrigin="anonymous"
          style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: r * 0.7 }}
        />
      ) : (
        <div style={{
          width: '100%',
          height: '100%',
          borderRadius: r * 0.7,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.04)',
          color: isDark ? '#E2E8F0' : '#475569',
          fontWeight: 700,
          fontSize: chipSize * 0.36,
        }}>
          {(login || '?').charAt(0).toUpperCase()}
        </div>
      )}
    </div>
  );
};


export const RevolveCard: React.FC<TemplateCardProps> = ({
  data,
  theme = 'light',
  animated = true,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  const isDark = theme === 'dark';
  const bgColor = isDark ? '#0D0C12' : '#F5F4F1';
  const titleColor = isDark ? '#F5EDE7' : '#0F0E10';
  const subColor = isDark ? '#A1958D' : '#64748B';

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver(entries => {
      for (const e of entries) setScale(e.contentRect.width / 1600);
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const stargazersList = data.stargazers && data.stargazers.length > 0
    ? data.stargazers : sampleStargazers;

  const CX = 800, CY = 450;
  const repoFullName = data.owner ? `${data.owner}/${data.repo}` : data.repo;

  // Build slices per ring
  let cursor = 0;
  const ringAvatars = RINGS.map(ring => {
    const slice = stargazersList.slice(cursor, cursor + ring.count);
    cursor += ring.count;
    return slice;
  });

  // Generate CSS keyframes — one per chip — using the trick:
  // transform: rotate(θ) translateX(r) rotate(-θ)
  // As θ animates from start → start±360, the chip orbits while staying perfectly upright.
  const keyframeCSS = useMemo(() => {
    // rv-fade: pure opacity fade-in used by both ring tracks and avatar chips
    let css = `@keyframes rv-fade{from{opacity:0}to{opacity:1}}`;
    RINGS.forEach((ring, ri) => {
      const dir = ring.clockwise ? 1 : -1;
      const avatars = stargazersList.slice(
        RINGS.slice(0, ri).reduce((s, r) => s + r.count, 0),
        RINGS.slice(0, ri + 1).reduce((s, r) => s + r.count, 0),
      );
      avatars.forEach((_, i) => {
        const startDeg = ring.offsetDeg + (i / ring.count) * 360;
        const endDeg = startDeg + dir * 360;
        const name = `rv-r${ri}-${i}`;
        css += `@keyframes ${name}{`
          + `from{transform:rotate(${startDeg}deg) translateX(${ring.radius}px) rotate(${-startDeg}deg) translate(-50%, -50%)}`
          + `to{transform:rotate(${endDeg}deg) translateX(${ring.radius}px) rotate(${-endDeg}deg) translate(-50%, -50%)}`
          + `}`;
      });
    });
    return css;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative w-full aspect-[16/9] overflow-hidden select-none ${className}`}
      style={{ backgroundColor: bgColor }}
    >
      {/* Inject keyframe styles */}
      <style dangerouslySetInnerHTML={{ __html: keyframeCSS }} />

      <div
        className="absolute top-0 left-0 w-[1600px] h-[900px] origin-top-left"
        style={{ transform: `scale(${scale})` }}
      >
        {/* Radial glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: isDark
              ? 'radial-gradient(circle at 50% 50%, rgba(168,85,247,0.28) 0%, rgba(139,92,246,0.12) 28%, transparent 60%)'
              : 'radial-gradient(circle at 50% 50%, rgba(192,132,252,0.30) 0%, rgba(221,214,254,0.14) 32%, transparent 60%)',
          }}
        />

        {/* ── Orbit rings ── */}
        <div className="absolute inset-0 pointer-events-none">
          {RINGS.map((ring, ri) => {
            const delay = animated ? `${ri * 0.35}s` : '0s';
            const appearStyle: React.CSSProperties = animated ? {
              animationName: 'rv-fade',
              animationDuration: '0.6s',
              animationDelay: delay,
              animationTimingFunction: 'ease-out',
              animationFillMode: 'both',
            } : {};

            return (
              <div key={ri} style={appearStyle}>
                {/* Track circle */}
                <div
                  className="absolute rounded-full"
                  style={{
                    width: ring.radius * 2,
                    height: ring.radius * 2,
                    left: CX - ring.radius,
                    top: CY - ring.radius,
                    border: isDark
                      ? `1.5px solid rgba(255,255,255,${0.12 - ri * 0.015})`
                      : `1.5px solid rgba(0,0,0,${0.09 - ri * 0.012})`,
                  }}
                />

                {/* Avatar chips */}
                {ringAvatars[ri].map((u, i) => {
                  const startDeg = ring.offsetDeg + (i / ring.count) * 360;
                  const name = `rv-r${ri}-${i}`;
                  return (
                    <div
                      key={`r${ri}-${u.login}-${i}`}
                      style={{ position: 'absolute', left: CX, top: CY, width: 0, height: 0 }}
                    >
                      <AvatarChip
                        login={u.login}
                        avatarUrl={u.avatarUrl}
                        isDark={isDark}
                        chipSize={ring.chipSize}
                        animName={name}
                        duration={ring.duration}
                        animated={animated}
                        startDeg={startDeg}
                        radius={ring.radius}
                      />
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* ── Center Hub ── */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ pointerEvents: 'none' }}
        >
          <motion.div
            initial={animated ? { scale: 0.8, opacity: 0 } : false}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            {/* Owner avatar */}
            <div
              style={{
                width: 160,
                height: 160,
                borderRadius: 36,
                overflow: 'hidden',
                marginBottom: 24,
                backgroundColor: isDark ? 'rgba(255,255,255,0.09)' : '#FFFFFF',
                border: isDark ? '2px solid rgba(255,255,255,0.18)' : '2px solid rgba(0,0,0,0.09)',
                boxShadow: isDark
                  ? '0 20px 60px rgba(0,0,0,0.65), 0 0 50px rgba(168,85,247,0.35)'
                  : '0 20px 60px rgba(0,0,0,0.12), 0 0 50px rgba(168,85,247,0.20)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {data.ownerAvatarUrl ? (
                <img
                  src={data.ownerAvatarUrl}
                  alt={data.owner}
                  crossOrigin="anonymous"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <span style={{ fontSize: 60, fontWeight: 800, color: titleColor }}>
                  {data.repo ? data.repo.charAt(0).toUpperCase() : '★'}
                </span>
              )}
            </div>

            {/* Repo name */}
            <div style={{
              fontSize: 46,
              fontWeight: 800,
              letterSpacing: '-0.025em',
              color: titleColor,
              marginBottom: 18,
              lineHeight: 1.1,
            }}>
              {repoFullName}
            </div>

            {/* Star count */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <YellowStar size={76} />
              <span style={{
                fontSize: 100,
                fontWeight: 900,
                letterSpacing: '-0.04em',
                color: titleColor,
                lineHeight: 1,
              }}>
                <AnimatedNumber value={data.stars} animated={animated} />
              </span>
              <span style={{
                fontSize: 28,
                fontWeight: 500,
                color: subColor,
                alignSelf: 'flex-end',
                paddingBottom: 12,
                letterSpacing: '0.01em',
              }}>
                stars
              </span>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
