import React, { useEffect, useRef, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import type { TemplateCardProps } from './types';
import sampleStargazers from '../../data/sampleStargazers.json';

function AnimatedNumber({ value, animated = true }: { value: number; animated?: boolean }) {
  const [displayValue, setDisplayValue] = useState(animated ? 0 : value);

  useEffect(() => {
    if (!animated) {
      setDisplayValue(value);
      return;
    }
    let startTime: number | null = null;
    const duration = 2600; // Slower, dramatic counter entrance (2.6s)
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

const YellowStar: React.FC<{ size?: number }> = ({ size = 76 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="#FACC15"
    stroke="#EAB308"
    strokeWidth="1.1"
    aria-hidden="true"
    style={{ flexShrink: 0 }}
  >
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

// 4 Corner Square Base Angles: Top-Right (45°), Top-Left (135°), Bottom-Left (225°), Bottom-Right (315°)
const CORNER_ANGLES = [
  Math.PI / 4,
  (3 * Math.PI) / 4,
  (5 * Math.PI) / 4,
  (7 * Math.PI) / 4,
];

const R_START = 920; // Expanded outer radius to cover 1600x900 canvas edges
const R_END = 150;   // Meeting point near center
const SWEEP_ANGLE = 1.7 * Math.PI; // 306° curve sweep per arm

export const BlackholeCard: React.FC<TemplateCardProps> = ({
  data,
  theme = 'dark',
  animated = true,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [progress, setProgress] = useState(0);

  const isDark = theme === 'dark';

  const stargazersList = useMemo(() => {
    const list = data?.stargazers?.length ? data.stargazers : sampleStargazers;
    const result = [];
    while (result.length < 48) {
      result.push(...list);
    }
    return result.slice(0, 48);
  }, [data?.stargazers]);

  // Responsive scale guard
  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth;
        if (width > 0) {
          setScale(width / 1600);
        }
      }
    };
    updateScale();
    const observer = new ResizeObserver(updateScale);
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Continuous smooth animation loop
  useEffect(() => {
    if (!animated) return;
    let animFrame: number;
    let startTimestamp: number | null = null;
    const loopDuration = 16000; // 16s cycle

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const elapsed = timestamp - startTimestamp;
      const currentProgress = (elapsed % loopDuration) / loopDuration;
      setProgress(currentProgress);
      animFrame = requestAnimationFrame(step);
    };

    animFrame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animFrame);
  }, [animated]);

  const CX = 800;
  const CY = 450;
  const repoFullName = data.owner ? `${data.owner}/${data.repo}` : data.repo;

  const bgColor = isDark ? '#08080C' : '#FAFAF9';
  const titleColor = isDark ? '#F5EDE7' : '#0F0E10';
  const subColor = isDark ? '#A1958D' : '#64748B';
  const chipBg = isDark ? 'rgba(22, 20, 30, 0.95)' : 'rgba(255, 255, 255, 0.97)';
  const chipBorder = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)';

  // Build 4 curved avatar streams
  const armAvatars = useMemo(() => {
    const arms: Array<Array<{ user: (typeof stargazersList)[0]; idx: number }>> = [[], [], [], []];
    stargazersList.forEach((user, i) => {
      arms[i % 4].push({ user, idx: i });
    });
    return arms;
  }, [stargazersList]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full aspect-[16/9] overflow-hidden select-none ${className}`}
      style={{ backgroundColor: bgColor }}
    >
      <div
        className="absolute top-0 left-0 w-[1600px] h-[900px] origin-top-left"
        style={{ transform: `scale(${scale})` }}
      >
        {/* Radial ambient background glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: isDark
              ? 'radial-gradient(circle at 50% 50%, rgba(234, 179, 8, 0.18) 0%, rgba(168, 85, 247, 0.10) 38%, transparent 68%)'
              : 'radial-gradient(circle at 50% 50%, rgba(250, 204, 21, 0.22) 0%, rgba(221, 214, 254, 0.15) 38%, transparent 68%)',
          }}
        />

        {/* ── 4 Curved Spiral Arms Background Lines (100% Synced with Avatar Flow) ── */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 1600 900"
          aria-hidden="true"
        >
          <g>
            {CORNER_ANGLES.map((baseAngle, armIdx) => {
              const pointsPrimary: string[] = [];
              const pointsSecondary: string[] = [];
              const steps = 90;

              for (let i = 0; i <= steps; i++) {
                const t = 1 - i / steps; // 1 at outer corner, 0 at center
                const r = R_START * t + R_END * (1 - t);
                const angle = baseAngle + (1 - t) * SWEEP_ANGLE;

                const x1 = CX + r * Math.cos(angle);
                const y1 = CY + r * Math.sin(angle);
                pointsPrimary.push(`${i === 0 ? 'M' : 'L'} ${x1.toFixed(1)} ${y1.toFixed(1)}`);

                // Secondary parallel accent curve
                const r2 = (R_START + 75) * t + (R_END + 35) * (1 - t);
                const angle2 = baseAngle + (1 - t) * SWEEP_ANGLE + 0.12;
                const x2 = CX + r2 * Math.cos(angle2);
                const y2 = CY + r2 * Math.sin(angle2);
                pointsSecondary.push(`${i === 0 ? 'M' : 'L'} ${x2.toFixed(1)} ${y2.toFixed(1)}`);
              }

              return (
                <g key={armIdx}>
                  <path
                    d={pointsPrimary.join(' ')}
                    fill="none"
                    stroke={
                      isDark ? 'rgba(234, 179, 8, 0.16)' : 'rgba(234, 179, 8, 0.22)'
                    }
                    strokeWidth="4"
                  />
                  <path
                    d={pointsSecondary.join(' ')}
                    fill="none"
                    stroke={
                      isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)'
                    }
                    strokeWidth="2.5"
                    strokeDasharray="8 8"
                  />
                </g>
              );
            })}
          </g>
        </svg>

        {/* ── 4 Curved Streams of Avatars Meeting at Center ── */}
        {armAvatars.map((armList, armIdx) => {
          const baseAngle = CORNER_ANGLES[armIdx];
          const armCount = armList.length;

          return armList.map(({ user, idx }, itemIdx) => {
            const localOffset = itemIdx / armCount;
            // Progression along the curve from outer corner (1) down to center (0)
            const p = (localOffset + progress) % 1;
            const currentP = 1 - p;

            const r = R_START * currentP + R_END * (1 - currentP);
            const angle = baseAngle + (1 - currentP) * SWEEP_ANGLE;

            const x = CX + r * Math.cos(angle);
            const y = CY + r * Math.sin(angle);

            const chipSize = 68 + 32 * currentP; // 68px inner to 100px outer (Enlarged)
            const chipR = chipSize * 0.28;
            const opacity = Math.sin(currentP * Math.PI); // Fades gracefully at edges

            return (
              <div
                key={`arm${armIdx}-${user.login}-${idx}`}
                style={{
                  position: 'absolute',
                  left: `${x}px`,
                  top: `${y}px`,
                  width: `${chipSize}px`,
                  height: `${chipSize}px`,
                  transform: 'translate(-50%, -50%)',
                  borderRadius: `${chipR}px`,
                  overflow: 'hidden',
                  backgroundColor: chipBg,
                  border: `1.5px solid ${chipBorder}`,
                  boxShadow: isDark
                    ? '0 10px 28px rgba(0,0,0,0.65), 0 3px 8px rgba(0,0,0,0.4)'
                    : '0 10px 24px rgba(0,0,0,0.12), 0 3px 8px rgba(0,0,0,0.06)',
                  opacity: Math.max(0.08, opacity),
                  zIndex: Math.floor(currentP * 10) + 5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 4,
                }}
              >
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.login}
                    crossOrigin="anonymous"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      borderRadius: `${chipR * 0.7}px`,
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: `${chipSize * 0.38}px`,
                      color: titleColor,
                    }}
                  >
                    {user.login.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            );
          });
        })}

        {/* ── Frameless Center Hub (Slower, dramatic loading transition) ── */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ pointerEvents: 'none', zIndex: 40 }}
        >
          <motion.div
            initial={animated ? { scale: 0.75, opacity: 0 } : false}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1.4, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            {/* Owner Avatar */}
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
                  ? '0 20px 60px rgba(0,0,0,0.7), 0 0 50px rgba(234,179,8,0.3)'
                  : '0 20px 60px rgba(0,0,0,0.12), 0 0 50px rgba(234,179,8,0.18)',
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

            {/* Repo Name */}
            <div
              style={{
                fontSize: 46,
                fontWeight: 800,
                letterSpacing: '-0.025em',
                color: titleColor,
                marginBottom: 18,
                lineHeight: 1.1,
              }}
            >
              {repoFullName}
            </div>

            {/* Star Count Row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <YellowStar size={76} />
              <span
                style={{
                  fontSize: 100,
                  fontWeight: 900,
                  letterSpacing: '-0.04em',
                  color: titleColor,
                  lineHeight: 1,
                }}
              >
                <AnimatedNumber value={data.stars} animated={animated} />
              </span>
              <span
                style={{
                  fontSize: 28,
                  fontWeight: 500,
                  color: subColor,
                  alignSelf: 'flex-end',
                  paddingBottom: 12,
                  letterSpacing: '0.01em',
                }}
              >
                stars
              </span>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
