import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import type { TemplateCardProps } from './types';

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

// Deterministic PRNG seeded by repository name
function createRng(seedString: string) {
  let seed = 42;
  for (let i = 0; i < seedString.length; i++) {
    seed = (seed * 31 + seedString.charCodeAt(i)) >>> 0;
  }
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

interface ScatterAvatar {
  x: number;
  y: number;
  size: number;
  alpha: number;
  login: string;
  avatarUrl: string;
}

// Exactly mirrors Go constellation.go generateConstellationScatter
function computeConstellationScatter(
  stargazers: { login: string; avatarUrl: string }[],
  repoFullName: string,
  width = 1600,
  height = 900
): ScatterAvatar[] {
  const rng = createRng(repoFullName || 'stargazer');
  const centerX = width / 2.0; // 800.0
  const centerY = height / 2.0; // 450.0

  // Exact Go radii
  const rx = 560.0;
  const ry = 240.0;
  const maxDEll = Math.sqrt(Math.pow(centerX / rx, 2) + Math.pow(centerY / ry, 2)); // ~2.23

  // Go limit is 50 avatars
  const targetCount = 48;
  const result: ScatterAvatar[] = [];
  const maxAttempts = 90000;
  let attempts = 0;

  while (result.length < targetCount && attempts < maxAttempts) {
    attempts++;
    const margin = 50.0;
    const x = margin + rng() * (width - 2 * margin);
    const y = margin + rng() * (height - 2 * margin);

    const dx = (x - centerX) / rx;
    const dy = (y - centerY) / ry;
    const dEll = Math.sqrt(dx * dx + dy * dy);

    // 1. Must be outside the central whitespace ellipse
    if (dEll < 1.0) continue;

    // 2. Corner and outer density bias
    const uDist = (dEll - 1.0) / (maxDEll - 1.0);
    const prob = 0.25 + 0.75 * Math.pow(uDist, 0.6);
    if (rng() > prob) continue;

    // 3. Avatar size variation (78px to 120px)
    const size = 78.0 + rng() * 42.0;

    // 4. Overlap rejection check (prevent touching avatars)
    const padding = 20.0;
    let overlapping = false;
    for (const existing of result) {
      const edx = x - existing.x;
      const edy = y - existing.y;
      const edist = Math.sqrt(edx * edx + edy * edy);
      const minGap = size / 2.0 + existing.size / 2.0 + padding;
      if (edist < minGap) {
        overlapping = true;
        break;
      }
    }
    if (overlapping) continue;

    // 5. Opacity falloff: 0.35 at boundary -> 1.0 at outer canvas corners
    const uOpacity = Math.min(1.0, Math.max(0.0, uDist));
    const alpha = 0.35 + 0.65 * Math.pow(uOpacity, 1.1);

    const userIdx = result.length % (stargazers.length || 1);
    const user = (stargazers && stargazers[userIdx]) || {
      login: `user${result.length + 1}`,
      avatarUrl: '',
    };

    result.push({
      x,
      y,
      size,
      alpha,
      login: user.login,
      avatarUrl: user.avatarUrl,
    });
  }

  return result;
}

export const ConstellationCard: React.FC<TemplateCardProps> = ({
  data,
  theme = 'light',
  animated = true,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  const isDark = theme === 'dark';
  const bgColor = isDark ? '#0F0E10' : '#FFFFFF';
  const titleColor = isDark ? '#F5EDE7' : '#050505';
  const subTextColor = isDark ? '#B8AAA3' : '#555555';
  const avatarBorderColor = isDark ? '#342A27' : '#E2E8F0';

  // Responsive scale down to fit container width
  useEffect(() => {
    if (!containerRef.current) return;
    const updateScale = () => {
      if (containerRef.current) {
        const width = containerRef.current.clientWidth;
        setScale(width / 1600);
      }
    };
    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const repoFullName = data.owner ? `${data.owner}/${data.repo}` : data.repo;

  // Memoize constellation scatter layout
  const scatters = useMemo(() => {
    const list = data.stargazers && data.stargazers.length > 0 ? data.stargazers : [];
    return computeConstellationScatter(list, repoFullName);
  }, [repoFullName, data.stargazers]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full aspect-[16/9] overflow-hidden select-none ${className}`}
      style={{ backgroundColor: bgColor }}
    >
      {/* 1600x900 Virtual Canvas */}
      <div
        className="w-[1600px] h-[900px] absolute top-0 left-0 origin-top-left"
        style={{
          transform: `scale(${scale})`,
          fontFamily: "'DM Sans', sans-serif",
          backgroundColor: bgColor,
        }}
      >
        {/* 1. Organic Scatter Avatars outside the whitespace oval */}
        {scatters.map((scat, i) => (
          <motion.div
            key={`${scat.login}-${i}`}
            initial={animated ? { opacity: 0, scale: 0.5 } : { opacity: scat.alpha, scale: 1 }}
            animate={{ opacity: scat.alpha, scale: 1 }}
            transition={{
              duration: 0.45,
              delay: animated ? (i / scatters.length) * 0.4 : 0,
              type: 'spring',
              stiffness: 260,
              damping: 18,
            }}
            className="absolute rounded-full overflow-hidden"
            style={{
              left: `${scat.x}px`,
              top: `${scat.y}px`,
              width: `${scat.size}px`,
              height: `${scat.size}px`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            {scat.avatarUrl ? (
              <img
                src={scat.avatarUrl}
                alt={scat.login}
                className="w-full h-full object-cover rounded-full pointer-events-none select-none"
                loading="lazy"
                crossOrigin="anonymous"
              />
            ) : (
              <div className="w-full h-full rounded-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center">
                <span
                  className="font-bold text-neutral-600 dark:text-neutral-300 uppercase"
                  style={{ fontSize: `${scat.size * 0.35}px` }}
                >
                  {scat.login.slice(0, 2)}
                </span>
              </div>
            )}
          </motion.div>
        ))}

        {/* 2. Center Content: Exactly matching Go constellation.go lines 290-348 */}
        {/* Stacked Mascot Icon (y=340) + Title (y=460) + Plain Text Star Count (y=540) */}
        <div className="absolute inset-0 pointer-events-none">
          {/* 2a. Owner Mascot Icon at y = 340 (centerY - 110) */}
          <div className="absolute left-[800px] top-[340px] -translate-x-1/2 -translate-y-1/2">
            <div
              className="w-[100px] h-[100px] rounded-full border-[3px] overflow-hidden flex items-center justify-center bg-neutral-100 dark:bg-neutral-800"
              style={{ borderColor: avatarBorderColor }}
            >
              {data.ownerAvatarUrl ? (
                <img
                  src={data.ownerAvatarUrl}
                  alt={data.owner}
                  className="w-full h-full object-cover rounded-full"
                  crossOrigin="anonymous"
                />
              ) : (
                <span className="text-[36px] font-bold" style={{ color: titleColor }}>
                  {(data.owner || 'C').slice(0, 2).toUpperCase()}
                </span>
              )}
            </div>
          </div>

          {/* 2b. Repo Title at y = 460 (centerY + 10) */}
          <div className="absolute left-[800px] top-[460px] -translate-x-1/2 -translate-y-1/2 text-center max-w-[1000px] px-8">
            <h1
              className="text-[72px] font-bold tracking-tight leading-tight truncate"
              style={{ color: titleColor }}
            >
              {repoFullName}
            </h1>
          </div>

          {/* 2c. Plain Text Star Count at y = 540 (centerY + 90) */}
          <div className="absolute left-[800px] top-[540px] -translate-x-1/2 -translate-y-1/2 text-center">
            <p
              className="text-[44px] font-normal tracking-normal"
              style={{ color: subTextColor }}
            >
              <AnimatedNumber value={data.stars} animated={animated} /> stars
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
