import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
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
  blur: number;
  login: string;
  avatarUrl: string;
}

function computeConstellationScatter(
  stargazers: { login: string; avatarUrl: string }[],
  repoFullName: string,
  width = 1600,
  height = 900
): ScatterAvatar[] {
  const rng = createRng(repoFullName || 'stargazer');
  const centerX = 800.0;
  const centerY = 460.0;

  const result: ScatterAvatar[] = [];
  const padding = 12.0; // Reduced padding between avatars for denser constellation

  const tryAdd = (x: number, y: number, size: number): boolean => {
    const r = size / 2.0;

    // Strict collision check against existing avatars (guarantees NO overlapping)
    for (const existing of result) {
      const edist = Math.hypot(x - existing.x, y - existing.y);
      if (edist < r + existing.size / 2.0 + padding) {
        return false;
      }
    }

    // Depth calculation: organic depth blur behind main content (up to 5.0px)
    const distFromCenter = Math.hypot(x - centerX, y - centerY);
    const normDist = Math.min(1.0, Math.max(0.0, (distFromCenter - 200.0) / 600.0));
    const blurAmount = Math.max(0, (1.0 - normDist) * 5.0);
    const blur = blurAmount >= 0.5 ? Number(blurAmount.toFixed(1)) : 0;
    const alpha = Number((0.65 + 0.35 * Math.pow(normDist, 0.8)).toFixed(2));

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
      blur,
      login: user.login,
      avatarUrl: user.avatarUrl,
    });
    return true;
  };

  // Full-field organic scatter across canvas (including behind main content)
  const targetCount = 100; // Increased avatar count
  let attempts = 0;
  while (result.length < targetCount && attempts < 90000) {
    attempts++;
    const x = -35.0 + rng() * (width + 70.0);
    const y = -35.0 + rng() * (height + 70.0);
    const size = 84.0 + rng() * 54.0; // Increased avatar sizes (84px - 138px)
    tryAdd(x, y, size);
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
    const list = data.stargazers && data.stargazers.length > 0 ? data.stargazers : sampleStargazers;
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
        {/* 1. Organic Scatter Avatars popping in one by one */}
        {scatters.map((scat, i) => (
          <motion.div
            key={`${scat.login}-${i}`}
            initial={animated ? { opacity: 0, scale: 0.3 } : { opacity: scat.alpha, scale: 1 }}
            animate={{ opacity: scat.alpha, scale: 1 }}
            transition={{
              duration: 0.4,
              delay: animated ? (i / scatters.length) * 0.7 : 0,
              type: 'spring',
              stiffness: 240,
              damping: 18,
            }}
            className="absolute rounded-full overflow-hidden"
            style={{
              left: `${scat.x}px`,
              top: `${scat.y}px`,
              width: `${scat.size}px`,
              height: `${scat.size}px`,
              transform: 'translate(-50%, -50%)',
              filter: scat.blur > 0 ? `blur(${scat.blur}px)` : undefined,
              border: `2px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.06)'}`,
            }}
          >
            <img
              src={scat.avatarUrl || `https://github.com/${scat.login || 'stargazer'}.png?size=120`}
              alt={scat.login || 'stargazer'}
              className="w-full h-full object-cover rounded-full pointer-events-none select-none"
              loading="lazy"
              crossOrigin="anonymous"
              onError={(e) => {
                const img = e.target as HTMLImageElement;
                if (!img.src.includes('identicon')) {
                  img.src = `https://github.com/identicons/${scat.login || 'stargazer'}.png`;
                } else {
                  img.onerror = null;
                }
              }}
            />
          </motion.div>
        ))}

        {/* 2. Soft Radial Fade & Blur Backdrop behind Main Content */}
        <div
          className="absolute inset-0 pointer-events-none z-15"
          style={{
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            maskImage:
              'radial-gradient(ellipse 920px 500px at 50% 50%, black 20%, rgba(0,0,0,0.85) 45%, rgba(0,0,0,0.4) 70%, transparent 100%)',
            WebkitMaskImage:
              'radial-gradient(ellipse 920px 500px at 50% 50%, black 20%, rgba(0,0,0,0.85) 45%, rgba(0,0,0,0.4) 70%, transparent 100%)',
            background: isDark
              ? 'radial-gradient(ellipse 920px 500px at 50% 50%, rgba(15,14,16,0.98) 0%, rgba(15,14,16,0.92) 25%, rgba(15,14,16,0.75) 50%, rgba(15,14,16,0.35) 75%, rgba(15,14,16,0.08) 90%, rgba(15,14,16,0) 100%)'
              : 'radial-gradient(ellipse 920px 500px at 50% 50%, rgba(255,255,255,0.98) 0%, rgba(255,255,255,0.92) 25%, rgba(255,255,255,0.75) 50%, rgba(255,255,255,0.35) 75%, rgba(255,255,255,0.08) 90%, rgba(255,255,255,0) 100%)',
          }}
        />

        {/* 3. Center Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-20">
          {/* 2a. Owner Mascot Icon */}
          <motion.div
            initial={animated ? { opacity: 0, scale: 0.8 } : { opacity: 1, scale: 1 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: animated ? 0.2 : 0 }}
            className="flex items-center justify-center mb-5"
          >
            <div
              className="w-[108px] h-[108px] rounded-full border-[3px] overflow-hidden flex items-center justify-center bg-neutral-100 dark:bg-neutral-800 shadow-xl"
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
                <span className="text-[38px] font-bold" style={{ color: titleColor }}>
                  {(data.owner || 'C').slice(0, 2).toUpperCase()}
                </span>
              )}
            </div>
          </motion.div>

          {/* 2b. Repo Title */}
          <motion.div
            initial={animated ? { opacity: 0, y: 15 } : { opacity: 1, y: 0 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: animated ? 0.35 : 0 }}
            className="text-center max-w-[1100px] px-8 mb-4"
          >
            <h1
              className="text-[72px] font-bold tracking-tight leading-tight truncate"
              style={{ color: titleColor }}
            >
              {repoFullName}
            </h1>
          </motion.div>

          {/* 2c. Star Count with Star Icon */}
          <motion.div
            initial={animated ? { opacity: 0, y: 15 } : { opacity: 1, y: 0 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: animated ? 0.45 : 0 }}
            className="text-center"
          >
            <div className="flex items-center justify-center gap-3.5">
              <Star className="w-14 h-14 fill-amber-400 text-amber-400 stroke-amber-400 shrink-0 -mt-1" />
              <p
                className="text-[64px] font-bold tracking-tight flex items-baseline gap-3"
                style={{ color: subTextColor }}
              >
                <AnimatedNumber value={data.stars} animated={animated} />
                <span
                  className="text-[44px] font-medium"
                  style={{ color: isDark ? 'rgba(245, 237, 231, 0.65)' : 'rgba(5, 5, 5, 0.55)' }}
                >
                  stars
                </span>
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
