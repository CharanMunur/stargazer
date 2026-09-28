import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import type { TemplateCardProps } from './types';
import sampleStargazers from '@/data/sampleStargazers.json';

function AnimatedNumber({ value, animated }: { value: number; animated: boolean }) {
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

export const SpotlightCard: React.FC<TemplateCardProps> = ({
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
  const subTextColor = isDark ? '#A1958D' : '#64748B';
  const cardBorderColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';
  const avatarBorderColor = isDark ? '#1C1B1F' : '#FFFFFF';

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

  const repoFullName = data.owner ? `${data.owner}/${data.repo}` : data.repo;
  const stargazersList = data.stargazers && data.stargazers.length > 0 ? data.stargazers : sampleStargazers;
  // Show up to 8 top/recent stargazers in the horizontal fan stack
  const visibleAvatars = stargazersList.slice(0, 8);
  const remainingCount = Math.max(0, data.stars - visibleAvatars.length);

  return (
    <div
      ref={containerRef}
      className={`relative w-full aspect-[16/9] overflow-hidden select-none ${className}`}
      style={{ backgroundColor: bgColor }}
    >
      <div
        className="w-[1600px] h-[900px] absolute top-0 left-0 origin-top-left flex flex-col items-center justify-between p-24"
        style={{
          transform: `scale(${scale})`,
          fontFamily: "'DM Sans', sans-serif",
          backgroundColor: bgColor,
        }}
      >
        {/* Subtle Ambient Radial Light Spotlight */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: isDark
              ? 'radial-gradient(circle 600px at 50% 45%, rgba(255,255,255,0.035) 0%, transparent 80%)'
              : 'radial-gradient(circle 600px at 50% 45%, rgba(0,0,0,0.02) 0%, transparent 80%)',
          }}
        />


        {/* Center Spotlight: Title & Big Star Count */}
        <div className="z-10 flex flex-col items-center text-center my-auto space-y-4 max-w-[1200px]">
          <motion.h1
            initial={animated ? { opacity: 0, y: 20 } : { opacity: 1, y: 0 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: animated ? 0.2 : 0 }}
            className="text-[76px] font-bold tracking-tight leading-tight truncate px-4"
            style={{ color: titleColor }}
          >
            {repoFullName}
          </motion.h1>

          <motion.div
            initial={animated ? { opacity: 0, scale: 0.9 } : { opacity: 1, scale: 1 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: animated ? 0.35 : 0 }}
            className="flex items-center justify-center gap-5 pt-2"
          >
            <Star className="w-20 h-20 fill-amber-400 text-amber-400 stroke-amber-400 shrink-0" />
            <span className="text-[120px] font-bold tracking-tight leading-none" style={{ color: titleColor }}>
              <AnimatedNumber value={data.stars} animated={animated} />
            </span>
            <span className="text-[44px] font-medium self-end mb-3 tracking-wide" style={{ color: subTextColor }}>
              stargazers
            </span>
          </motion.div>
        </div>

        {/* Bottom Horizontal Fan Stack */}
        <motion.div
          initial={animated ? { opacity: 0, y: 20 } : { opacity: 1, y: 0 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: animated ? 0.45 : 0 }}
          className="z-10 flex items-center justify-center gap-4"
        >
          {/* Overlapping Avatar Stack */}
          <div className="flex items-center -space-x-4 pl-4">
            {visibleAvatars.map((u, i) => (
              <motion.div
                key={`${u.login}-${i}`}
                initial={animated ? { opacity: 0, scale: 0.6, x: -10 } : { opacity: 1, scale: 1, x: 0 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                transition={{
                  duration: 0.4,
                  delay: animated ? 0.5 + i * 0.05 : 0,
                  type: 'spring',
                  stiffness: 260,
                  damping: 18,
                }}
                className="relative rounded-full overflow-hidden shadow-lg transition-transform hover:scale-110 hover:z-20 cursor-pointer"
                style={{
                  width: '68px',
                  height: '68px',
                  border: `3px solid ${avatarBorderColor}`,
                }}
              >
                <img
                  src={u.avatarUrl || `https://github.com/${u.login || 'stargazer'}.png?size=140`}
                  alt={u.login}
                  className="w-full h-full object-cover"
                  crossOrigin="anonymous"
                  onError={(e) => {
                    const img = e.target as HTMLImageElement;
                    if (!img.src.includes('identicon')) {
                      img.src = `https://github.com/identicons/${u.login || 'stargazer'}.png`;
                    }
                  }}
                />
              </motion.div>
            ))}
          </div>

          {/* Plus Remaining Pill */}
          {remainingCount > 0 && (
            <div
              className="px-5 py-2.5 rounded-full border text-sm font-semibold tracking-wide shadow-sm"
              style={{
                borderColor: cardBorderColor,
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)',
                color: subTextColor,
              }}
            >
              +{remainingCount.toLocaleString()} others
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};
