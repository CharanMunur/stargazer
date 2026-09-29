import React, { useEffect, useRef, useState } from 'react';
import type { TemplateCardProps } from './types';
import sampleStargazers from '../../data/sampleStargazers.json';

// 5-point yellow star matching Go drawYellowStar
const YellowStar: React.FC<{ size?: number }> = ({ size = 28 }) => (
  <svg
    viewBox="0 0 24 24"
    fill="#FACC15"
    stroke="#EAB308"
    strokeWidth="1.2"
    style={{ width: `${size}px`, height: `${size}px` }}
    aria-hidden="true"
  >
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

// Exact Go easeOutBack formula with elastic overshoot (s = 1.35)
function easeOutBack(t: number, s = 1.35): number {
  const tNorm = t - 1.0;
  return 1.0 + (s + 1.0) * Math.pow(tNorm, 3) + s * Math.pow(tNorm, 2);
}

export const OrbitCard: React.FC<TemplateCardProps> = ({
  data,
  theme = 'dark',
  animated = true,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [progress, setProgress] = useState(animated ? 0 : 1);

  const isDark = theme === 'dark';
  const bgColor = isDark ? '#0F0E10' : '#FFFFFF';
  const headerSubColor = isDark ? '#B8AAA3' : '#64748B';
  const headerBoldColor = isDark ? '#F5EDE7' : '#000000';
  const avatarRingColor = isDark ? '#342A27' : '#E2E8F0';
  const labelColor = isDark ? '#F5EDE7' : '#000000';
  const primaryAccent = '#E87443';

  // Responsive scale down to fit container width
  useEffect(() => {
    if (!containerRef.current) return;
    const updateScale = () => {
      if (containerRef.current) {
        const width = containerRef.current.clientWidth;
        if (width > 0) {
          const newScale = width / 1600;
          setScale((prev) => (Math.abs(prev - newScale) > 0.001 ? newScale : prev));
        }
      }
    };
    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Fast movement + elastic bounce-back animation loop
  useEffect(() => {
    if (!animated) {
      setProgress(1);
      return;
    }

    let startTime: number | null = null;
    const duration = 2400; // 2.4s fast snappy sweep

    let animId: number;
    const step = (now: number) => {
      if (!startTime) startTime = now;
      const elapsed = now - startTime;
      const p = Math.min(1, elapsed / duration);
      setProgress(p);

      if (p < 1) {
        animId = requestAnimationFrame(step);
      }
    };

    animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, [animated, data]);

  const sourceStargazers =
    data.stargazers && data.stargazers.length > 0
      ? data.stargazers
      : sampleStargazers;

  const count = Math.min(16, Math.max(8, sourceStargazers.length));
  const stargazers = sourceStargazers.slice(0, count);
  while (stargazers.length < count) {
    stargazers.push(sourceStargazers[stargazers.length % sourceStargazers.length]);
  }

  const centerX = 800;
  const centerY = 420;
  const baseSize = 160;
  const spacing = 240;

  // Elastic overshoot & bounce back
  const easeT = easeOutBack(progress, 1.35);
  const maxScroll = (count - 1) * spacing;
  const scrollOffset = easeT * maxScroll;

  // Compute 3D orbit items
  const items = stargazers.map((u, i) => {
    const colX = centerX + i * spacing - scrollOffset;
    const dist = Math.abs(colX - centerX);
    // Parabolic arc trajectory
    const arcY = centerY - 25.0 * Math.cos(((colX - centerX) / 500.0) * (Math.PI / 2));
    // Scale: big near center (1.35), small at edges (0.70)
    const itemScale = 0.70 + 0.65 * Math.exp(-Math.pow(dist / 340.0, 2));
    const isCenterFocus = dist < 150;

    return {
      user: u,
      x: colX,
      y: arcY,
      scale: itemScale,
      dist,
      isCenterFocus,
      zIndex: Math.round(itemScale * 100),
    };
  });

  // Incrementing star count synced with physics
  const calcT = Math.min(1.0, Math.max(0.0, easeT));
  const totalStars = data.stars ?? 0;
  const curStars = totalStars > 0 ? Math.round(1 + calcT * (totalStars - 1)) : 0;

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
        {/* Ambient Radial Glow (matching RevolveCard / other templates) */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: isDark
              ? 'radial-gradient(circle at 50% 48%, rgba(232, 116, 67, 0.18) 0%, rgba(242, 200, 121, 0.07) 30%, transparent 65%)'
              : 'radial-gradient(circle at 50% 48%, rgba(232, 116, 67, 0.14) 0%, rgba(242, 200, 121, 0.05) 30%, transparent 65%)',
          }}
        />

        {/* 1. Top-Left Header: Owner Avatar (90px) + "owner / repo" (52px) */}
        <div className="absolute left-[95px] top-[95px] flex items-center gap-[22px]">
          {/* Owner Avatar Circle (90px) with 4px border */}
          <div
            className="w-[90px] h-[90px] rounded-full overflow-hidden flex items-center justify-center shrink-0 border-[4px] bg-neutral-100 dark:bg-neutral-800"
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
          <div className="text-[52px] leading-tight flex items-center tracking-tight">
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

        {/* 2. 3D Orbit Perspective Carousel (centerY = 420px) */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {items.map((item, i) => {
            if (item.x < -250 || item.x > 1850) return null;
            const curSize = baseSize * item.scale;
            const starSize = 14 * item.scale;

            return (
              <div
                key={`${item.user.login}-${i}`}
                className="absolute flex flex-col items-center justify-center pointer-events-none transform-gpu"
                style={{
                  left: `${item.x}px`,
                  top: `${item.y}px`,
                  width: `${curSize}px`,
                  transform: 'translate3d(-50%, -50%, 0)',
                  backfaceVisibility: 'hidden',
                  zIndex: item.zIndex,
                }}
              >
                {/* Circular Avatar with Dynamic Ring */}
                <div
                  className="rounded-full overflow-hidden flex items-center justify-center bg-neutral-100 dark:bg-neutral-800"
                  style={{
                    width: `${curSize}px`,
                    height: `${curSize}px`,
                    border: item.isCenterFocus
                      ? `5px solid ${primaryAccent}`
                      : `3px solid ${avatarRingColor}`,
                    boxShadow: item.isCenterFocus
                      ? '0 12px 30px rgba(232, 116, 67, 0.35)'
                      : undefined,
                  }}
                >
                  <img
                    src={item.user.avatarUrl || `https://github.com/${item.user.login || 'stargazer'}.png?size=160`}
                    alt={item.user.login || 'stargazer'}
                    className="w-full h-full object-cover rounded-full pointer-events-none"
                    crossOrigin="anonymous"
                    onError={(e) => {
                      const img = e.target as HTMLImageElement;
                      if (!img.src.includes('identicon')) {
                        img.src = `https://github.com/identicons/${item.user.login || 'stargazer'}.png`;
                      } else {
                        img.onerror = null;
                      }
                    }}
                  />
                </div>

                {/* Yellow 5-point star beneath avatar */}
                <div
                  className="flex items-center justify-center"
                  style={{ marginTop: `${Math.max(14, 20 * item.scale)}px` }}
                >
                  <YellowStar size={starSize * 2} />
                </div>
              </div>
            );
          })}

          {/* Left Edge Gradient Fade */}
          <div
            className="absolute left-0 top-[260px] h-[340px] w-[180px] pointer-events-none z-30"
            style={{
              background: `linear-gradient(to right, ${bgColor} 0%, transparent 100%)`,
            }}
          />

          {/* Right Edge Gradient Fade */}
          <div
            className="absolute right-0 top-[260px] h-[340px] w-[180px] pointer-events-none z-30"
            style={{
              background: `linear-gradient(to left, ${bgColor} 0%, transparent 100%)`,
            }}
          />
        </div>

        {/* 3. Bottom-Right Star Count: "N stars" in Primary Coral Accent (#E87443) */}
        <div className="absolute right-[140px] bottom-[80px] flex items-baseline gap-[12px] z-20">
          <span
            className="text-[130px] font-bold leading-none tracking-tight"
            style={{ color: primaryAccent }}
          >
            {curStars.toLocaleString()}
          </span>
          <span
            className="text-[90px] font-normal leading-none tracking-normal"
            style={{ color: labelColor }}
          >
            stars
          </span>
        </div>
      </div>
    </div>
  );
};
