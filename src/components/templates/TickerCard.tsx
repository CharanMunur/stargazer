import React, { useEffect, useRef, useState } from 'react';
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

// Exact 5-point star matching Go drawYellowStar
const YellowStar: React.FC<{ className?: string }> = ({ className = 'w-7 h-7' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="#FACC15"
    stroke="#EAB308"
    strokeWidth="1.2"
    className={className}
    aria-hidden="true"
  >
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

export const TickerCard: React.FC<TemplateCardProps> = ({
  data,
  theme = 'light',
  animated = true,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  const isDark = theme === 'dark';
  const bgColor = isDark ? '#0F0E10' : '#FFFFFF';
  const headerSubColor = isDark ? '#B8AAA3' : '#64748B';
  const headerBoldColor = isDark ? '#F5EDE7' : '#000000';
  const avatarRingColor = isDark ? '#342A27' : '#E2E8F0';
  const numberColor = isDark ? '#F5EDE7' : '#000000';
  const labelColor = isDark ? '#B8AAA3' : '#000000';

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

  const count = Math.min(24, Math.max(8, sourceStargazers.length));
  const stargazers = sourceStargazers.slice(0, count);
  while (stargazers.length < count) {
    stargazers.push(sourceStargazers[stargazers.length % sourceStargazers.length]);
  }

  // Replicate list for seamless infinite loop
  const tickerItems = [...stargazers, ...stargazers, ...stargazers];

  return (
    <div
      ref={containerRef}
      className={`relative w-full aspect-[16/9] overflow-hidden select-none ${className}`}
      style={{ backgroundColor: bgColor }}
    >
      {/* 1600x900 Virtual Artboard */}
      <div
        className="w-[1600px] h-[900px] absolute top-0 left-0 origin-top-left"
        style={{
          transform: `scale(${scale})`,
          fontFamily: "'DM Sans', sans-serif",
          backgroundColor: bgColor,
        }}
      >
        {/* 1. Top-Left Header: Owner Avatar (90px) + "owner / repo" (56px) */}
        <div className="absolute left-[95px] top-[95px] flex items-center gap-[22px]">
          {/* Owner Avatar Circle (90px) */}
          <div
            className="w-[90px] h-[90px] rounded-full overflow-hidden flex items-center justify-center shrink-0 border-[3px] bg-neutral-100 dark:bg-neutral-800"
            style={{ borderColor: avatarRingColor }}
          >
            {data.ownerAvatarUrl ? (
              <img
                src={data.ownerAvatarUrl}
                alt={data.owner}
                className="w-full h-full object-cover"
                crossOrigin="anonymous"
              />
            ) : (
              <span className="text-[32px] font-bold" style={{ color: headerBoldColor }}>
                {(data.owner || 'C').slice(0, 2).toUpperCase()}
              </span>
            )}
          </div>

          {/* Repo Title: owner in regular, repo in bold */}
          <div className="text-[56px] leading-tight flex items-center tracking-tight">
            {data.owner && (
              <span className="font-normal" style={{ color: headerSubColor }}>
                {data.owner}&nbsp;/&nbsp;
              </span>
            )}
            <span className="font-bold" style={{ color: headerBoldColor }}>
              {data.repo}
            </span>
          </div>
        </div>

        {/* 2. Center Physics Ticker Marquee (tickerY = 420px) */}
        <div className="absolute left-0 right-0 top-[280px] h-[280px] flex items-center overflow-hidden">
          {/* Snappy, energetic ticker glide */}
          <motion.div
            className="flex items-center gap-[60px] pl-[100px]"
            animate={
              animated
                ? {
                    x: ['0px', `-${stargazers.length * 220}px`],
                  }
                : undefined
            }
            transition={{
              repeat: Infinity,
              ease: 'linear',
              duration: Math.max(6, stargazers.length * 0.8), // fast, snappy glide (matches 2.4s Go momentum)
            }}
          >
            {tickerItems.map((u, i) => (
              <div
                key={`${u.login}-${i}`}
                className="flex flex-col items-center justify-center shrink-0"
                style={{ width: '160px' }}
              >
                {/* 160px Avatar with subtle border ring */}
                <div
                  className="w-[160px] h-[160px] rounded-full overflow-hidden flex items-center justify-center bg-neutral-100 dark:bg-neutral-800 border-[3px]"
                  style={{ borderColor: avatarRingColor }}
                >
                  <img
                    src={u.avatarUrl || `https://github.com/${u.login || 'stargazer'}.png?size=160`}
                    alt={u.login || 'stargazer'}
                    className="w-full h-full object-cover rounded-full pointer-events-none"
                    loading="lazy"
                    crossOrigin="anonymous"
                    onError={(e) => {
                      const img = e.target as HTMLImageElement;
                      if (!img.src.includes('identicon')) {
                        img.src = `https://github.com/identicons/${u.login || 'stargazer'}.png`;
                      } else {
                        img.onerror = null;
                      }
                    }}
                  />
                </div>

                {/* 5-pointed Yellow Star centered directly under avatar at y + 26px */}
                <div className="mt-[26px] flex items-center justify-center">
                  <YellowStar className="w-[30px] h-[30px]" />
                </div>
              </div>
            ))}
          </motion.div>

          {/* Soft Left Edge Fade */}
          <div
            className="absolute left-0 top-0 bottom-0 w-[160px] pointer-events-none z-10"
            style={{
              background: `linear-gradient(to right, ${bgColor} 0%, transparent 100%)`,
            }}
          />

          {/* Soft Right Edge Fade */}
          <div
            className="absolute right-0 top-0 bottom-0 w-[160px] pointer-events-none z-10"
            style={{
              background: `linear-gradient(to left, ${bgColor} 0%, transparent 100%)`,
            }}
          />
        </div>

        {/* 3. Bottom-Right Star Count: "N stars" at counterY = 760px */}
        <motion.div
          initial={animated ? { opacity: 0, y: 20 } : { opacity: 1, y: 0 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
          className="absolute right-[140px] bottom-[80px] flex items-baseline gap-[10px]"
        >
          <span
            className="text-[130px] font-bold leading-none tracking-tight"
            style={{ color: numberColor }}
          >
            <AnimatedNumber value={data.stars} animated={animated} />
          </span>
          <span
            className="text-[90px] font-normal leading-none tracking-normal"
            style={{ color: labelColor }}
          >
            stars
          </span>
        </motion.div>
      </div>
    </div>
  );
};
