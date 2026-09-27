import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { LaurelLeaf } from './LaurelLeaf';
import type { TemplateCardProps } from './types';
import sampleStargazers from './sampleStargazers.json';

const ringColors = [
  '#f97316', // orange
  '#a78bfa', // purple
  '#38bdf8', // sky blue
  '#fb7185', // rose
  '#34d399', // emerald
  '#818cf8', // indigo
  '#facc15', // yellow
  '#2dd4bf', // teal
];

function AnimatedNumber({ value, animated = true }: { value: number; animated?: boolean }) {
  const [displayValue, setDisplayValue] = useState(animated ? 0 : value);

  useEffect(() => {
    if (!animated) {
      setDisplayValue(value);
      return;
    }
    let startTime: number | null = null;
    const duration = 1400;

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

export const CounterCard: React.FC<TemplateCardProps> = ({
  data,
  theme = 'light',
  animated = true,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  const isDark = theme === 'dark';
  // Exact Go template colors
  const bgColor = isDark ? '#0F0E10' : '#FFFFFF';
  const titleColor = isDark ? '#F5EDE7' : '#111111';
  const subtitleColor = isDark ? '#B8AAA3' : '#555555';
  const countColor = isDark ? '#F5EDE7' : '#111111';
  const labelColor = isDark ? '#8A7E78' : '#888888';

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

  const sourceStargazers =
    data.stargazers && data.stargazers.length > 0
      ? data.stargazers
      : sampleStargazers;

  const avatars = sourceStargazers.slice(0, 16);
  const filledAvatars = [...avatars];
  while (filledAvatars.length < 16) {
    filledAvatars.push(sourceStargazers[filledAvatars.length % sourceStargazers.length]);
  }

  const repoTitle = data.owner ? `${data.owner}/${data.repo}` : data.repo;

  // Grid math matching Go counter.go
  const avatarSize = 120;
  const gapX = 44;
  const totalGridWidth = 8 * avatarSize + 7 * gapX; // 1268px
  const gridStartX = (1600 - totalGridWidth) / 2; // 166px

  return (
    <div
      ref={containerRef}
      className={`relative w-full aspect-[16/9] overflow-hidden select-none ${className}`}
      style={{ backgroundColor: bgColor }}
    >
      {/* 1600x900 Exact Virtual Canvas */}
      <div
        className="w-[1600px] h-[900px] absolute top-0 left-0 origin-top-left"
        style={{
          transform: `scale(${scale})`,
          fontFamily: "'DM Sans', sans-serif",
          backgroundColor: bgColor,
        }}
      >
        {/* Classical Laurel Leaves (Flanking the title at extreme left and right) */}
        <motion.div
          initial={animated ? { opacity: 0, y: 15 } : { opacity: 1, y: 0 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="absolute left-[100px] top-[60px] pointer-events-none"
        >
          <LaurelLeaf flip theme={theme} className="w-[120px] h-[250px]" />
        </motion.div>

        <motion.div
          initial={animated ? { opacity: 0, y: 15 } : { opacity: 1, y: 0 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="absolute right-[100px] top-[60px] pointer-events-none"
        >
          <LaurelLeaf theme={theme} className="w-[120px] h-[250px]" />
        </motion.div>

        {/* 1. Header: Subtitle + Title (Centered at x = 800) */}
        <motion.div
          initial={animated ? { opacity: 0, y: 20 } : { opacity: 1, y: 0 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="absolute left-0 right-0 top-[90px] flex flex-col items-center text-center"
        >
          <span
            className="text-[34px] font-normal tracking-[0.22em] uppercase mb-4"
            style={{ color: subtitleColor }}
          >
            STARGAZERS · 2026
          </span>
          <h1
            className="text-[88px] font-bold tracking-tight truncate max-w-[1080px] leading-tight"
            style={{ color: titleColor }}
          >
            {repoTitle}
          </h1>
        </motion.div>

        {/* 2. Counters: Stars (400), Forks (800), Days (1200) */}
        <motion.div
          initial={animated ? { opacity: 0, y: 15 } : { opacity: 1, y: 0 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15, ease: 'easeOut' }}
          className="absolute left-0 right-0 top-[350px]"
        >
          {/* Column 1: STARS at x = 400 */}
          <div className="absolute left-[400px] -translate-x-1/2 flex flex-col items-center">
            <span
              className="text-[160px] font-normal tracking-tight leading-none"
              style={{ color: countColor }}
            >
              <AnimatedNumber value={data.stars} animated={animated} />
            </span>
            <span
              className="text-[26px] font-normal tracking-[0.35em] mt-5 uppercase"
              style={{ color: labelColor }}
            >
              STARS
            </span>
          </div>

          {/* Column 2: FORKS at x = 800 */}
          <div className="absolute left-[800px] -translate-x-1/2 flex flex-col items-center">
            <span
              className="text-[160px] font-normal tracking-tight leading-none"
              style={{ color: countColor }}
            >
              <AnimatedNumber value={data.forks} animated={animated} />
            </span>
            <span
              className="text-[26px] font-normal tracking-[0.35em] mt-5 uppercase"
              style={{ color: labelColor }}
            >
              FORKS
            </span>
          </div>

          {/* Column 3: DAYS at x = 1200 */}
          <div className="absolute left-[1200px] -translate-x-1/2 flex flex-col items-center">
            <span
              className="text-[160px] font-normal tracking-tight leading-none"
              style={{ color: countColor }}
            >
              <AnimatedNumber value={data.days} animated={animated} />
            </span>
            <span
              className="text-[26px] font-normal tracking-[0.35em] mt-5 uppercase"
              style={{ color: labelColor }}
            >
              DAYS
            </span>
          </div>
        </motion.div>

        {/* 3. Avatars: 2 rows of 8 avatars with colored rings */}
        <div
          className="absolute"
          style={{
            left: `${gridStartX}px`,
            top: '615px',
            width: `${totalGridWidth}px`,
          }}
        >
          <div className="grid grid-cols-8 gap-x-[44px] gap-y-[26px]">
            {filledAvatars.map((u, i) => {
              const ringColor = ringColors[i % ringColors.length];
              return (
                <motion.div
                  key={`${u.login}-${i}`}
                  initial={animated ? { opacity: 0, scale: 0.3 } : { opacity: 1, scale: 1 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{
                    duration: 0.4,
                    delay: animated ? 0.25 + i * 0.03 : 0,
                    type: 'spring',
                    stiffness: 280,
                    damping: 20,
                  }}
                  className="flex items-center justify-center"
                >
                  {/* Outer Ring with padding gap */}
                  <div
                    className="w-[132px] h-[132px] rounded-full flex items-center justify-center"
                    style={{
                      border: `5px solid ${ringColor}`,
                      backgroundColor: bgColor,
                    }}
                  >
                    {/* Inner Avatar Image (120px) */}
                    <div className="w-[114px] h-[114px] rounded-full overflow-hidden flex items-center justify-center bg-neutral-200 dark:bg-neutral-800">
                      <img
                        src={u.avatarUrl || `https://github.com/${u.login}.png?size=120`}
                        alt={u.login}
                        className="w-full h-full object-cover rounded-full"
                        loading="lazy"
                        crossOrigin="anonymous"
                        onError={(e) => {
                          const img = e.target as HTMLImageElement;
                          if (!img.src.includes('identicon')) {
                            img.src = `https://github.com/identicons/${u.login}.png`;
                          }
                        }}
                      />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* 4. Bottom Linear Gradient Fade (y = 730 to y = 900) */}
        <div
          className="absolute bottom-0 left-0 right-0 h-[170px] pointer-events-none"
          style={{
            background: isDark
              ? 'linear-gradient(to bottom, rgba(15,14,16,0) 0%, rgba(15,14,16,1) 100%)'
              : 'linear-gradient(to bottom, rgba(237,236,234,0) 0%, rgba(237,236,234,1) 100%)',
          }}
        />
      </div>
    </div>
  );
};
