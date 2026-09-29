import React, { useEffect, useRef, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import type { TemplateCardProps } from './types';
import sampleStargazers from '@/data/sampleStargazers.json';

// Gold star matching Stargazer design tokens (76px size matching Revolve)
const YellowStar: React.FC<{ size?: number }> = ({ size = 76 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="#FACC15"
    stroke="#EAB308"
    strokeWidth="1.1"
    aria-hidden="true"
    className="shrink-0 drop-shadow-[0_0_18px_rgba(250,204,21,0.45)]"
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
  baseAngle: number;
  startDist: number;
  delay: number;
  speed: number;
  spinDir: number;
  chipScale: number;
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
  // Monochromatic technical palette matching Revolve: Obsidian in Dark, Warm Stone in Light
  const bgColor = isDark ? '#0D0C12' : '#F5F4F1';
  const titleColor = isDark ? '#F5EDE7' : '#0F0E10';
  const subColor = isDark ? '#A1958D' : '#64748B';

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

  // 36 avatars with staggered launch starting from behind center hub
  const count = 36;
  const avatarItems = useMemo<PrecomputedAvatarItem[]>(() => {
    const items: PrecomputedAvatarItem[] = [];

    const hash = (i: number, seed: number) => {
      let h = (i * 374761393 + seed * 668265263) ^ 0x5bf03635;
      h = Math.imul(h ^ (h >>> 13), 1274126177);
      return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
    };

    for (let i = 0; i < count; i++) {
      // 8 directional sectors: 0=E, 1=NE, 2=N, 3=NW, 4=W, 5=SW, 6=S, 7=SE
      const sector = i % 8;
      const sectorAngle = (sector * Math.PI) / 4;
      const angleJitter = (hash(i, 101) - 0.5) * (Math.PI / 6);
      const baseAngle = sectorAngle + angleJitter;

      // Emergence outside center hub exclusion zone (~250px+ from center)
      const startDist = 220 + hash(i, 202) * 100;
      // Staggered delay so avatars start from behind center hub when animation begins
      const delay = (i * 0.038) + hash(i, 303) * 0.05;
      // Fast hyperdrive speed range (0.58 - 0.74)
      const speed = 0.58 + (i % 5) * 0.04;
      const spinDir = i % 2 === 0 ? 1 : -1;
      const chipScale = 0.85 + hash(i, 606) * 0.28;

      items.push({
        baseAngle,
        startDist,
        delay,
        speed,
        spinDir,
        chipScale,
        stargazerIndex: i % stargazersList.length,
      });
    }
    return items;
  }, [stargazersList.length]);

  // Precompute 64 warp streak lines
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
      const speed = 0.3 + (i % 5) * 0.05;
      const initialProgress = (i * (1 / beamCount)) % 1;
      const baseLength = 140 + (i % 4) * 70;
      const isGold = i % 10 === 0;

      beams.push({
        angle,
        cosA,
        sinA,
        edgeDist,
        speed,
        initialProgress,
        baseLength,
        isGold,
        strokeWidth: isGold ? 2.0 : 1.2,
        alphaMultiplier: 0.2 + (i % 3) * 0.12,
      });
    }
    return beams;
  }, []);

  // Precompute 32 high-velocity particles
  const stardust = useMemo(() => {
    const dust = [];
    for (let s = 0; s < 32; s++) {
      const angle = (s / 32) * Math.PI * 2 + ((s * 23) % 9) * 0.08;
      const speed = 0.45 + (s % 4) * 0.08;
      const initialProgress = (s * (1 / 32)) % 1;
      const radius = 1.0 + (s % 2) * 0.8;
      const isGold = s % 4 === 0;
      dust.push({ angle, speed, initialProgress, radius, isGold });
    }
    return dust;
  }, []);

  // Hardware-accelerated 60/120fps canvas background animation
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
      // 1. Solid Canvas Background matching Revolve (#0D0C12 in Dark, #F5F4F1 in Light)
      ctx.fillStyle = isDark ? '#0D0C12' : '#F5F4F1';
      ctx.fillRect(0, 0, width, height);

      // 2. Continuous Radial Glow (Smooth falloff, zero sharp edges)
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 750);
      if (isDark) {
        grad.addColorStop(0, 'rgba(255, 255, 255, 0.06)');
        grad.addColorStop(0.35, 'rgba(250, 204, 21, 0.02)');
        grad.addColorStop(0.75, 'transparent');
      } else {
        grad.addColorStop(0, 'rgba(0, 0, 0, 0.04)');
        grad.addColorStop(0.35, 'rgba(250, 204, 21, 0.02)');
        grad.addColorStop(0.75, 'transparent');
      }
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // 3. Warp Streak Lines
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
          : isDark
          ? 'rgba(255, 255, 255, 0.35)'
          : 'rgba(15, 14, 16, 0.22)';
        ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
        ctx.lineWidth = b.strokeWidth;
        ctx.lineCap = 'round';
        ctx.stroke();
      }
      ctx.restore();

      // 4. Expanding Wavefront Rings
      ctx.save();
      const ringCount = 3;
      for (let k = 0; k < ringCount; k++) {
        const ringP = (k / ringCount + timeSec * 0.18) % 1;
        const r = 70 + Math.pow(ringP, 1.6) * 1000;

        let ringAlpha = 0;
        if (ringP < 0.25) {
          ringAlpha = (ringP / 0.25) * 0.15;
        } else {
          ringAlpha = ((1 - ringP) / 0.75) * 0.15;
        }

        if (ringAlpha > 0.01) {
          ctx.beginPath();
          ctx.ellipse(cx, cy, r * 1.05, r * 0.95, 0, 0, Math.PI * 2);
          ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.18)' : 'rgba(15, 14, 16, 0.10)';
          ctx.globalAlpha = ringAlpha;
          ctx.lineWidth = 1.0;
          ctx.stroke();
        }
      }
      ctx.restore();

      // 5. Stardust specks
      ctx.save();
      for (let s = 0; s < stardust.length; s++) {
        const d = stardust[s];
        const sP = (d.initialProgress + timeSec * d.speed) % 1;
        const sDist = 60 + Math.pow(sP, 2.2) * 880;

        const px = cx + Math.cos(d.angle) * sDist;
        const py = cy + Math.sin(d.angle) * sDist;

        let sAlpha = 1;
        if (sP < 0.2) sAlpha = sP / 0.2;
        else if (sP > 0.85) sAlpha = (1 - sP) / 0.15;

        ctx.beginPath();
        ctx.arc(px, py, d.radius, 0, Math.PI * 2);
        ctx.fillStyle = d.isGold ? '#FACC15' : isDark ? '#ffffff' : '#0F0E10';
        ctx.globalAlpha = Math.max(0, Math.min(1, sAlpha * 0.5));
        ctx.fill();
      }
      ctx.restore();

      // 6. Direct DOM transform updates for 36 Contributor Avatars (staggered launch from center hub)
      for (let i = 0; i < avatarItems.length; i++) {
        const el = avatarRefs.current[i];
        if (!el) continue;
        const item = avatarItems[i];
        const rawP = timeSec * item.speed - item.delay;

        if (rawP < 0) {
          el.style.opacity = '0';
          el.style.transform = `translate3d(800px, 450px, 0) translate(-50%, -50%) scale(0.2)`;
          continue;
        }

        const p = rawP % 1;

        // Organic subtle curved hyperdrive arc trajectory
        const currentAngle = item.baseAngle + (p - 0.5) * 0.22 * item.spinDir;
        const cosA = Math.cos(currentAngle);
        const sinA = Math.sin(currentAngle);
        const absCos = Math.abs(cosA);
        const absSin = Math.abs(sinA);

        // Screen edge boundary distance for current angle
        const edgeDist = Math.min(
          absCos > 0.0001 ? 800 / absCos : 9999,
          absSin > 0.0001 ? 450 / absSin : 9999
        );
        const exitDist = edgeDist + 150;

        const distP = 0.20 * p + 0.80 * Math.pow(p, 1.35);
        const dist = item.startDist + (exitDist - item.startDist) * distP;
        const posX = cx + cosA * dist;
        const posY = cy + sinA * dist;

        const scaleVal = (0.35 + distP * 1.45) * item.chipScale;
        const alpha = p < 0.06 ? p / 0.06 : p > 0.88 ? (1 - p) / 0.12 : 1;

        el.style.transform = `translate3d(${posX.toFixed(2)}px, ${posY.toFixed(2)}px, 0) translate(-50%, -50%) scale(${scaleVal.toFixed(3)})`;
        el.style.opacity = `${alpha.toFixed(3)}`;
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
        {/* Hardware-Accelerated Hyperdrive Canvas */}
        <canvas
          ref={canvasRef}
          width={1600}
          height={900}
          className="absolute inset-0 pointer-events-none"
        />

        {/* Heavy Ambient Glow & Backdrop Blur BEHIND Avatars (zIndex 5) */}
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{ zIndex: 5 }}
        >
          {/* Heavy Backdrop blur disc — large enough to fully cover center hub area */}
          <div
            className="absolute rounded-full pointer-events-none backdrop-blur-3xl"
            style={{
              width: 900,
              height: 900,
              opacity: 0.95,
              backgroundColor: isDark ? 'rgba(13, 12, 18, 0.85)' : 'rgba(245, 244, 241, 0.88)',
              maskImage: 'radial-gradient(circle, rgba(0,0,0,1) 0%, rgba(0,0,0,0.95) 40%, rgba(0,0,0,0.6) 65%, rgba(0,0,0,0) 85%)',
              WebkitMaskImage: 'radial-gradient(circle, rgba(0,0,0,1) 0%, rgba(0,0,0,0.95) 40%, rgba(0,0,0,0.6) 65%, rgba(0,0,0,0) 85%)',
            }}
          />

          {/* Rich Yellow Radial Glow — strong hyperdrive energy */}
          <div
            className="absolute rounded-full pointer-events-none blur-3xl"
            style={{
              width: 960,
              height: 960,
              opacity: 0.85,
              background: isDark
                ? 'radial-gradient(circle, rgba(250, 204, 21, 0.65) 0%, rgba(245, 158, 11, 0.40) 35%, rgba(234, 179, 8, 0.15) 60%, rgba(0, 0, 0, 0) 80%)'
                : 'radial-gradient(circle, rgba(250, 204, 21, 0.55) 0%, rgba(245, 158, 11, 0.30) 35%, rgba(234, 179, 8, 0.10) 60%, rgba(0, 0, 0, 0) 80%)',
            }}
          />
        </div>

        {/* 36 Contributor Avatars flying outward (88px chip size, zIndex 10) */}
        {avatarItems.map((item, idx) => {
          const user = stargazersList[item.stargazerIndex] || { login: 'user', avatarUrl: '' };
          const chipSize = 88;

          return (
            <div
              key={idx}
              ref={(el) => {
                avatarRefs.current[idx] = el;
              }}
              className="absolute pointer-events-none flex items-center justify-center rounded-2xl will-change-transform overflow-hidden"
              style={{
                left: 0,
                top: 0,
                width: chipSize,
                height: chipSize,
                transform: 'translate3d(800px, 450px, 0) translate(-50%, -50%) scale(0.4)',
                opacity: 0,
                backgroundColor: isDark ? 'rgba(13, 12, 18, 0.92)' : 'rgba(255, 255, 255, 0.96)',
                border: isDark
                  ? '1.5px solid rgba(255, 255, 255, 0.18)'
                  : '1.5px solid rgba(15, 14, 16, 0.12)',
                boxShadow: isDark
                  ? '0 10px 24px rgba(0, 0, 0, 0.65)'
                  : '0 10px 20px rgba(0, 0, 0, 0.08)',
                zIndex: 10,
              }}
            >
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.login}
                  className="w-full h-full object-cover rounded-[18px]"
                  crossOrigin="anonymous"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-bold text-base uppercase text-muted-foreground">
                  {user.login.slice(0, 2)}
                </div>
              )}
            </div>
          );
        })}

        {/* ── Center Hub (zIndex 40) ── */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ pointerEvents: 'none', zIndex: 40 }}
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
                  ? '0 20px 60px rgba(0,0,0,0.65), 0 0 50px rgba(250,204,21,0.25)'
                  : '0 20px 60px rgba(0,0,0,0.12), 0 0 50px rgba(250,204,21,0.15)',
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

            {/* Star count */}
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
