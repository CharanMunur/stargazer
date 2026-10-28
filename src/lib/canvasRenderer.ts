import type { TemplateData } from '../components/templates/types';
import sampleStargazers from '../data/sampleStargazers.json';
import { LAUREL_LEAF_PATHS } from './laurelPaths';

export type TemplateType =
  | 'spotlight'
  | 'revolve'
  | 'milestone'
  | 'infinity'
  | 'orbit'
  | 'constellation'
  | 'hyperdrive'
  | 'blackhole';

export interface ScatterPoint {
  x: number;
  y: number;
  size: number;
  baseAlpha: number;
  blur: number;
  phase: number;
  stargazerIndex: number;
}

export interface PreloadedAssets {
  avatarImages: Map<string, HTMLImageElement>;
  leafImg: HTMLImageElement | null;
  ownerImg: HTMLImageElement | null;
  constellationPoints?: ScatterPoint[];
}

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

// Load single image with CORS and guaranteed timeout protection
function loadImage(url: string, timeoutMs = 2500): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    if (!url) return resolve(null);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    let settled = false;

    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        resolve(null);
      }
    }, timeoutMs);

    img.onload = () => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        resolve(img);
      }
    };
    img.onerror = () => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        resolve(null);
      }
    };
    img.src = url;
  });
}

// Load laurel leaf with guaranteed correct color for dark/light themes
async function loadLeafImage(theme: 'dark' | 'light'): Promise<HTMLImageElement | null> {
  const fillColor = theme === 'dark' ? '#FFFFFF' : '#000000';
  const svgString =
    `<svg version="1.0" xmlns="http://www.w3.org/2000/svg" width="640" height="1280" viewBox="0 0 640 1280" preserveAspectRatio="xMidYMid meet">` +
    `<g transform="translate(0, 1280) scale(0.1, -0.1)" fill="${fillColor}" stroke="none">` +
    `${LAUREL_LEAF_PATHS.map((path) => `<path d="${path}" />`).join('')}` +
    `</g></svg>`;

  try {
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const img = await loadImage(url, 2000);
    URL.revokeObjectURL(url);
    return img;
  } catch {
    return null;
  }
}

// Precompute deterministic non-overlapping scatter points once for Constellation
function generateConstellationPoints(
  repoName: string,
  stargazerCount: number
): ScatterPoint[] {
  let seed = 42;
  for (let i = 0; i < repoName.length; i++) {
    seed = (seed * 31 + repoName.charCodeAt(i)) >>> 0;
  }
  const prng = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };

  const centerX = 800.0;
  const centerY = 460.0;

  const points: ScatterPoint[] = [];
  const padding = 12.0;

  const tryAdd = (x: number, y: number, size: number): boolean => {
    const r = size / 2.0;

    for (const p of points) {
      if (Math.hypot(x - p.x, y - p.y) < r + p.size / 2.0 + padding) {
        return false;
      }
    }

    const distFromCenter = Math.hypot(x - centerX, y - centerY);
    const normDist = Math.min(1.0, Math.max(0.0, (distFromCenter - 200.0) / 600.0));
    const blurAmount = Math.max(0, (1.0 - normDist) * 5.0);
    const blur = blurAmount >= 0.5 ? Number(blurAmount.toFixed(1)) : 0;
    const baseAlpha = Number((0.65 + 0.35 * Math.pow(normDist, 0.8)).toFixed(2));
    const phase = (points.length * 1.5) % (Math.PI * 2);

    points.push({
      x,
      y,
      size,
      baseAlpha,
      blur,
      phase,
      stargazerIndex: points.length % Math.max(1, stargazerCount),
    });
    return true;
  };

  const targetCount = 75;
  let attempts = 0;
  while (points.length < targetCount && attempts < 90000) {
    attempts++;
    const x = -35.0 + prng() * (1600.0 + 70.0);
    const y = -35.0 + prng() * (900.0 + 70.0);
    const size = 84.0 + prng() * 54.0;
    tryAdd(x, y, size);
  }

  return points;
}

// Preload all assets required for deterministic canvas rendering
export async function preloadTemplateAssets(
  template: TemplateType,
  data: TemplateData,
  theme: 'dark' | 'light'
): Promise<PreloadedAssets> {
  if (typeof document !== 'undefined' && document.fonts) {
    try {
      await document.fonts.ready;
    } catch {
      // ignore
    }
  }

  const avatarImages = new Map<string, HTMLImageElement>();

  const sourceStargazers =
    data.stargazers && data.stargazers.length > 0
      ? data.stargazers
      : sampleStargazers;

  let avatarUrls: string[] = [];
  if (template === 'milestone') {
    avatarUrls = sourceStargazers.slice(0, 16).map((s) => s.avatarUrl).filter(Boolean);
  } else if (template === 'infinity') {
    avatarUrls = sourceStargazers.slice(0, 24).map((s) => s.avatarUrl).filter(Boolean);
  } else if (template === 'revolve') {
    avatarUrls = sourceStargazers.slice(0, 55).map((s) => s.avatarUrl).filter(Boolean);
  } else if (template === 'orbit') {
    avatarUrls = sourceStargazers.slice(0, 16).map((s) => s.avatarUrl).filter(Boolean);
  } else if (template === 'constellation') {
    avatarUrls = sourceStargazers.slice(0, 100).map((s) => s.avatarUrl).filter(Boolean);
  } else if (template === 'spotlight') {
    avatarUrls = sourceStargazers.slice(0, 8).map((s) => s.avatarUrl).filter(Boolean);
  } else if (template === 'hyperdrive') {
    avatarUrls = sourceStargazers.slice(0, 36).map((s) => s.avatarUrl).filter(Boolean);
  } else if (template === 'blackhole') {
    avatarUrls = sourceStargazers.slice(0, 48).map((s) => s.avatarUrl).filter(Boolean);
  }

  const [leafImg, ownerImg, ...loadedAvatars] = await Promise.all([
    template === 'milestone' ? loadLeafImage(theme) : Promise.resolve(null),
    data.ownerAvatarUrl ? loadImage(data.ownerAvatarUrl) : Promise.resolve(null),
    ...avatarUrls.map((u) => loadImage(u, 2500)),
  ]);

  avatarUrls.forEach((url, i) => {
    const img = loadedAvatars[i];
    if (img) avatarImages.set(url, img);
  });

  const repoFullName = data.owner ? `${data.owner}/${data.repo}` : data.repo;
  const constellationPoints =
    template === 'constellation'
      ? generateConstellationPoints(repoFullName || 'stargazer', sourceStargazers.length)
      : undefined;

  return { avatarImages, leafImg, ownerImg, constellationPoints };
}

function easeOut(t: number): number {
  return 1 - Math.pow(1 - Math.max(0, Math.min(1, t)), 3);
}

function cubicBezierEase(t: number, x1: number, y1: number, x2: number, y2: number): number {
  const sample = (a1: number, a2: number, p: number) =>
    3 * (1 - p) ** 2 * p * a1 + 3 * (1 - p) * p ** 2 * a2 + p ** 3;
  const target = Math.max(0, Math.min(1, t));
  let low = 0;
  let high = 1;

  for (let i = 0; i < 16; i++) {
    const mid = (low + high) / 2;
    if (sample(x1, x2, mid) < target) low = mid;
    else high = mid;
  }

  return sample(y1, y2, (low + high) / 2);
}

// Exact easeOutBack formula with elastic overshoot
function easeOutBack(t: number, s = 1.35): number {
  const clamped = Math.max(0, Math.min(1, t));
  const tNorm = clamped - 1.0;
  return 1.0 + (s + 1.0) * Math.pow(tNorm, 3) + s * Math.pow(tNorm, 2);
}

function drawSpacedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  spacing: number,
  align: 'center' | 'left' = 'center'
) {
  let totalWidth = 0;
  for (let i = 0; i < text.length; i++) {
    totalWidth += ctx.measureText(text[i]).width + (i < text.length - 1 ? spacing : 0);
  }
  let currX = align === 'center' ? x - totalWidth / 2 : x;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    ctx.fillText(ch, currX, y);
    currX += ctx.measureText(ch).width + spacing;
  }
}

// Exact 5-point star polygon matching SVG & Lucide Star geometry
function drawStar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  fillColor = '#FACC15',
  strokeColor = '#EAB308',
  strokeWidth?: number
) {
  ctx.save();
  ctx.beginPath();
  const points = 5;
  const step = Math.PI / points;
  const innerR = r * 0.485;
  for (let i = 0; i < 2 * points; i++) {
    const currR = i % 2 === 0 ? r : innerR;
    const angle = i * step - Math.PI / 2;
    const x = cx + currR * Math.cos(angle);
    const y = cy + currR * Math.sin(angle);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = fillColor;
  ctx.fill();
  ctx.strokeStyle = strokeColor;
  ctx.lineJoin = 'round';
  ctx.lineWidth = strokeWidth !== undefined ? strokeWidth : Math.max(1.2, r * 0.08);
  ctx.stroke();
  ctx.restore();
}

// Backwards-compat wrapper
function drawYellowStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  drawStar(ctx, cx, cy, r, '#FACC15', '#EAB308');
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  if (typeof (ctx as any).roundRect === 'function') {
    (ctx as any).roundRect(x, y, w, h, r);
  } else {
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }
}

function drawCircularAvatar(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | undefined,
  fallbackText: string,
  cx: number,
  cy: number,
  r: number,
  ringColor?: string,
  ringWidth: number = 0
) {
  ctx.save();
  if (ringColor && ringWidth > 0) {
    ctx.beginPath();
    ctx.arc(cx, cy, r + ringWidth / 2, 0, Math.PI * 2);
    ctx.strokeStyle = ringColor;
    ctx.lineWidth = ringWidth;
    ctx.stroke();
  }

  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();

  if (img && img.naturalWidth > 0) {
    ctx.drawImage(img, cx - r, cy - r, r * 2, r * 2);
  } else {
    ctx.fillStyle = '#2A2A2A';
    ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `bold ${Math.round(r * 0.55)}px 'DM Sans', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText((fallbackText || 'U').slice(0, 2).toUpperCase(), cx, cy);
  }
  ctx.restore();
}

// Draws laurel leaf with soft bottom gradient mask matching LaurelLeaf.tsx
function drawLaurel(
  ctx: CanvasRenderingContext2D,
  leafImg: HTMLImageElement | null,
  x: number,
  y: number,
  w: number,
  h: number,
  flip: boolean,
  alpha: number
) {
  if (!leafImg || alpha <= 0) return;
  const offCanvas = document.createElement('canvas');
  offCanvas.width = w;
  offCanvas.height = h;
  const octx = offCanvas.getContext('2d');
  if (!octx) return;

  if (flip) {
    octx.translate(w, 0);
    octx.scale(-1, 1);
  }
  octx.drawImage(leafImg, 0, 0, w, h);

  // Soft linear-gradient fade matching LaurelLeaf.tsx mask (solid top 55%, transparent at 100%)
  octx.globalCompositeOperation = 'destination-in';
  const maskGrad = octx.createLinearGradient(0, 0, 0, h);
  maskGrad.addColorStop(0, 'rgba(0,0,0,1)');
  maskGrad.addColorStop(0.55, 'rgba(0,0,0,1)');
  maskGrad.addColorStop(1, 'rgba(0,0,0,0)');
  octx.fillStyle = maskGrad;
  octx.fillRect(0, 0, w, h);

  ctx.save();
  ctx.globalAlpha = 0.32 * alpha;
  ctx.drawImage(offCanvas, x, y);
  ctx.restore();
}

// -------------------------------------------------------------
// TEMPLATE 1: MILESTONE (COUNTER) - Precise match with MilestoneCard.tsx
// -------------------------------------------------------------
function renderCounter(
  ctx: CanvasRenderingContext2D,
  data: TemplateData,
  theme: 'dark' | 'light',
  progress: number,
  assets: PreloadedAssets
) {
  const isDark = theme === 'dark';
  const width = 1600;
  const height = 900;

  // Background
  const bgColor = isDark ? '#0F0E10' : '#FFFFFF';
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, width, height);

  // Easing calculations
  const tTitle = Math.min(1, progress / 0.25);
  const easeTitle = easeOut(tTitle);
  const titleYOffset = 20 * (1 - easeTitle);

  // Classical Laurel Leaves flanking the title at x = 100 and x = 1380
  if (assets.leafImg && easeTitle > 0) {
    const leafY = 60 + 15 * (1 - easeTitle);
    drawLaurel(ctx, assets.leafImg, 100, leafY, 120, 250, true, easeTitle);
    drawLaurel(ctx, assets.leafImg, 1380, leafY, 120, 250, false, easeTitle);
  }

  // Subtitle & Title (Centered at x = 800)
  if (easeTitle > 0) {
    ctx.save();
    ctx.globalAlpha = easeTitle;

    // Subtitle: STARGAZERS · 2026
    ctx.fillStyle = isDark ? '#B8AAA3' : '#555555';
    ctx.font = `400 34px 'DM Sans', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    drawSpacedText(ctx, 'STARGAZERS · 2026', 800, 135 + titleYOffset, 7.5);

    // Title: owner/repo
    ctx.fillStyle = isDark ? '#F5EDE7' : '#111111';
    ctx.font = `bold 88px 'DM Sans', sans-serif`;
    const repoTitle = data.owner ? `${data.owner}/${data.repo}` : data.repo;
    ctx.fillText(repoTitle, 800, 225 + titleYOffset);
    ctx.restore();
  }

  // Counters: Stars (400), Forks (800), Days (1200)
  const tSec = progress * 8.0;
  const tCount = Math.max(0, Math.min(1, (tSec - 0.15) / 0.60));
  const easeCount = easeOut(tCount);
  const countYOffset = 15 * (1 - easeCount);

  const numEase = easeOut(Math.min(1.0, tSec / 1.40));
  const curStars = Math.round(data.stars * numEase);
  const curForks = Math.round(data.forks * numEase);
  const curDays = Math.round(data.days * numEase);

  if (easeCount > 0) {
    ctx.save();
    ctx.globalAlpha = easeCount;

    // Big numbers at y = 475
    ctx.fillStyle = isDark ? '#F5EDE7' : '#111111';
    ctx.font = `400 160px 'DM Sans', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const numY = 475 + countYOffset;
    ctx.fillText(curStars.toLocaleString(), 400, numY);
    ctx.fillText(curForks.toLocaleString(), 800, numY);
    ctx.fillText(curDays.toLocaleString(), 1200, numY);

    // Labels: STARS, FORKS, DAYS at y = 575
    ctx.fillStyle = isDark ? '#8A7E78' : '#888888';
    ctx.font = `400 26px 'DM Sans', sans-serif`;
    const labelY = 575 + countYOffset;
    drawSpacedText(ctx, 'STARS', 400, labelY, 9);
    drawSpacedText(ctx, 'FORKS', 800, labelY, 9);
    drawSpacedText(ctx, 'DAYS', 1200, labelY, 9);
    ctx.restore();
  }

  // Avatars (2 rows of 8)
  const allAvatars =
    data.stargazers && data.stargazers.length > 0
      ? data.stargazers
      : sampleStargazers;
  const avatars = allAvatars.slice(0, 16);
  const filledAvatars = [...avatars];
  while (filledAvatars.length < 16) {
    filledAvatars.push(allAvatars[filledAvatars.length % allAvatars.length]);
  }

  // Math matching MilestoneCard.tsx
  // totalGridWidth = 8 * 120 + 7 * 44 = 1268px, gridStartX = (1600 - 1268)/2 = 166px
  const startX = 166 + 60; // 226px center
  const startY = 615 + 60; // 675px center
  const stepX = 120 + 44;  // 164px
  const stepY = 120 + 26;  // 146px

  for (let i = 0; i < 16; i++) {
    const startDelay = 0.25 + i * 0.03;
    if (tSec < startDelay) continue;
    const localT = easeOut(Math.min(1.0, (tSec - startDelay) / 0.40));

    const row = Math.floor(i / 8);
    const col = i % 8;
    const x = startX + col * stepX;
    const y = startY + row * stepY;

    const outerR = 66 * localT;
    const innerR = 57 * localT;
    if (outerR < 2) continue;

    const u = filledAvatars[i];
    const img = u.avatarUrl ? assets.avatarImages.get(u.avatarUrl) : undefined;
    const ringCol = ringColors[i % ringColors.length];

    // Outer ring with background fill
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, outerR, 0, Math.PI * 2);
    ctx.fillStyle = bgColor;
    ctx.fill();
    ctx.lineWidth = 5 * localT;
    ctx.strokeStyle = ringCol;
    ctx.stroke();

    // Inner avatar image
    drawCircularAvatar(ctx, img, u.login, x, y, innerR);
    ctx.restore();
  }

  // Soft bottom gradient fade matching MilestoneCard.tsx
  const grad = ctx.createLinearGradient(0, height - 170, 0, height);
  grad.addColorStop(0, isDark ? 'rgba(15,14,16,0)' : 'rgba(237,236,234,0)');
  grad.addColorStop(1, isDark ? 'rgba(15,14,16,1)' : 'rgba(237,236,234,1)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, height - 170, width, 170);
}

// -------------------------------------------------------------
// TEMPLATE 2: INFINITY (TICKER) - Precise match with TickerCard.tsx
// -------------------------------------------------------------
function renderTicker(
  ctx: CanvasRenderingContext2D,
  data: TemplateData,
  theme: 'dark' | 'light',
  progress: number,
  assets: PreloadedAssets
) {
  const isDark = theme === 'dark';
  const width = 1600;
  const height = 900;

  // Background
  const bgColor = isDark ? '#0F0E10' : '#FFFFFF';
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, width, height);

  // Top-left header: owner avatar (90px) + owner / repo (56px) at (95, 95)
  const headerX = 95;
  const headerY = 95;
  const ringCol = isDark ? '#342A27' : '#E2E8F0';

  ctx.save();
  drawCircularAvatar(
    ctx,
    assets.ownerImg || undefined,
    data.owner,
    headerX + 45,
    headerY + 45,
    45,
    ringCol,
    3
  );

  ctx.font = `400 56px 'DM Sans', sans-serif`;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  const ownerPrefix = data.owner ? `${data.owner} / ` : '';
  ctx.fillStyle = isDark ? '#B8AAA3' : '#64748B';
  ctx.fillText(ownerPrefix, headerX + 112, headerY + 45);
  const ownerW = ctx.measureText(ownerPrefix).width;

  ctx.font = `bold 56px 'DM Sans', sans-serif`;
  ctx.fillStyle = isDark ? '#F5EDE7' : '#000000';
  ctx.fillText(data.repo, headerX + 112 + ownerW, headerY + 45);
  ctx.restore();

  // Marquee list matching TickerCard.tsx
  const sourceStargazers =
    data.stargazers && data.stargazers.length > 0
      ? data.stargazers
      : sampleStargazers;
  const count = Math.min(24, Math.max(8, sourceStargazers.length));
  const stargazers = sourceStargazers.slice(0, count);
  while (stargazers.length < count) {
    stargazers.push(sourceStargazers[stargazers.length % sourceStargazers.length]);
  }

  // Uniform avatar size: 160px diameter (r = 80), gap 60px -> pitch 220px
  const tSec = progress * 8.0;
  const baseAvatarRadius = 80;
  const pitch = 220;
  const totalWidth = count * pitch;
  const marqueeDur = Math.max(6, count * 0.8);
  const scrollOffset = ((tSec / marqueeDur) * totalWidth) % totalWidth;

  // Center Y for avatar = 392, star center Y = 513
  const avatarCenterY = 392;
  const starCenterY = 513;

  for (let i = 0; i < count * 3; i++) {
    const rawX = 100 + i * pitch - scrollOffset;
    if (rawX < -150 || rawX > width + 150) continue;

    const u = stargazers[i % count];
    const img = u.avatarUrl ? assets.avatarImages.get(u.avatarUrl) : undefined;

    drawCircularAvatar(ctx, img, u.login, rawX, avatarCenterY, baseAvatarRadius, ringCol, 3);
    drawStar(ctx, rawX, starCenterY, 15, '#FACC15', '#EAB308', 1.2);
  }

  // Soft Left & Right edge gradient fades across marquee container (y: 280 to 560)
  const fadeW = 160;
  const leftGrad = ctx.createLinearGradient(0, 0, fadeW, 0);
  leftGrad.addColorStop(0, bgColor);
  leftGrad.addColorStop(1, isDark ? 'rgba(15,14,16,0)' : 'rgba(255,255,255,0)');
  ctx.fillStyle = leftGrad;
  ctx.fillRect(0, 280, fadeW, 280);

  const rightGrad = ctx.createLinearGradient(width - fadeW, 0, width, 0);
  rightGrad.addColorStop(0, isDark ? 'rgba(15,14,16,0)' : 'rgba(255,255,255,0)');
  rightGrad.addColorStop(1, bgColor);
  ctx.fillStyle = rightGrad;
  ctx.fillRect(width - fadeW, 280, fadeW, 280);

  // Bottom-Right Star Count matching TickerCard.tsx:
  // right-[140px] bottom-[80px], 130px bold + 90px normal
  const easeCount = easeOut(Math.min(1.0, tSec / 1.20));
  const curStars = Math.round(data.stars * easeCount);
  const numStr = curStars.toLocaleString();

  ctx.save();
  ctx.font = `bold 130px 'DM Sans', sans-serif`;
  const wNum = ctx.measureText(numStr).width;

  ctx.font = `400 90px 'DM Sans', sans-serif`;
  const wLabel = ctx.measureText(' stars').width;

  const totalW = wNum + wLabel;
  const startX = width - 140 - totalW;
  const baselineY = 800;

  ctx.font = `bold 130px 'DM Sans', sans-serif`;
  ctx.fillStyle = isDark ? '#F5EDE7' : '#000000';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(numStr, startX, baselineY);

  ctx.font = `400 90px 'DM Sans', sans-serif`;
  ctx.fillStyle = isDark ? '#B8AAA3' : '#000000';
  ctx.fillText(' stars', startX + wNum, baselineY);
  ctx.restore();
}

// -------------------------------------------------------------
// TEMPLATE 3: 3D ORBIT - Precise match with OrbitCard.tsx
// -------------------------------------------------------------
function renderOrbit(
  ctx: CanvasRenderingContext2D,
  data: TemplateData,
  theme: 'dark' | 'light',
  progress: number,
  assets: PreloadedAssets
) {
  const isDark = theme === 'dark';
  const width = 1600;
  const height = 900;

  // Background
  const bgColor = isDark ? '#0F0E10' : '#FFFFFF';
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, width, height);

  // Ambient radial glow matching OrbitCard.tsx (center 800, 432)
  const glow = ctx.createRadialGradient(800, 432, 0, 800, 432, 580);
  if (isDark) {
    glow.addColorStop(0, 'rgba(232, 116, 67, 0.18)');
    glow.addColorStop(0.3, 'rgba(242, 200, 121, 0.07)');
    glow.addColorStop(0.65, 'rgba(15, 14, 16, 0)');
  } else {
    glow.addColorStop(0, 'rgba(232, 116, 67, 0.14)');
    glow.addColorStop(0.3, 'rgba(242, 200, 121, 0.05)');
    glow.addColorStop(0.65, 'rgba(255, 255, 255, 0)');
  }
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);

  // Top-left header: (95, 95), avatar radius 45, border 4px, title 52px
  const headerX = 95;
  const headerY = 95;
  const avatarRingColor = isDark ? '#342A27' : '#E2E8F0';

  ctx.save();
  drawCircularAvatar(
    ctx,
    assets.ownerImg || undefined,
    data.owner,
    headerX + 45,
    headerY + 45,
    45,
    avatarRingColor,
    4
  );

  ctx.font = `400 52px 'DM Sans', sans-serif`;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  const ownerPrefix = data.owner ? `${data.owner} / ` : '';
  ctx.fillStyle = isDark ? '#B8AAA3' : '#64748B';
  ctx.fillText(ownerPrefix, headerX + 112, headerY + 45);
  const ownerW = ctx.measureText(ownerPrefix).width;

  ctx.font = `bold 52px 'DM Sans', sans-serif`;
  ctx.fillStyle = isDark ? '#F5EDE7' : '#000000';
  ctx.fillText(data.repo, headerX + 112 + ownerW, headerY + 45);
  ctx.restore();

  // 3D Orbit Carousel Physics:
  // Completes snappy sweep and elastic bounce in first ~70% of duration, then settles at rest
  const sourceStargazers =
    data.stargazers && data.stargazers.length > 0
      ? data.stargazers
      : sampleStargazers;
  const count = Math.min(16, Math.max(8, sourceStargazers.length));
  const stargazers = sourceStargazers.slice(0, count);
  while (stargazers.length < count) {
    stargazers.push(sourceStargazers[stargazers.length % sourceStargazers.length]);
  }

  const centerX = 800.0;
  const centerY = 420.0;
  const baseSize = 160.0;
  const spacing = 240.0;

  // Elastic overshoot & bounce back (2.4s sweep matching OrbitCard.tsx)
  const tSec = progress * 8.0;
  const pNorm = Math.min(1.0, tSec / 2.40);
  const easeT = easeOutBack(pNorm, 1.35);
  const maxScroll = (count - 1) * spacing;
  const scrollOffset = easeT * maxScroll;

  interface OrbitItem {
    x: number;
    y: number;
    scale: number;
    dist: number;
    isCenterFocus: boolean;
    login: string;
    avatarUrl: string;
  }

  const items: OrbitItem[] = [];
  for (let i = 0; i < count; i++) {
    const colX = centerX + i * spacing - scrollOffset;
    if (colX < -300 || colX > width + 300) continue;

    const dist = Math.abs(colX - centerX);
    const arcY = centerY - 25.0 * Math.cos(((colX - centerX) / 500.0) * (Math.PI / 2));
    const scale = 0.70 + 0.65 * Math.exp(-Math.pow(dist / 340.0, 2));
    const isCenterFocus = dist < 150;

    items.push({
      x: colX,
      y: arcY,
      scale,
      dist,
      isCenterFocus,
      login: stargazers[i].login,
      avatarUrl: stargazers[i].avatarUrl,
    });
  }

  // Draw background avatars first, foreground/center avatars last
  items.sort((a, b) => b.dist - a.dist);

  for (const item of items) {
    const curSize = baseSize * item.scale;
    const r = curSize / 2;

    const img = item.avatarUrl ? assets.avatarImages.get(item.avatarUrl) : undefined;
    const ringCol = item.isCenterFocus ? '#E87443' : avatarRingColor;
    const ringW = item.isCenterFocus ? 5 : 3;

    if (item.isCenterFocus) {
      ctx.save();
      ctx.shadowColor = 'rgba(232, 116, 67, 0.35)';
      ctx.shadowBlur = 30;
      ctx.shadowOffsetY = 12;
      ctx.beginPath();
      ctx.arc(item.x, item.y, r, 0, Math.PI * 2);
      ctx.fillStyle = bgColor;
      ctx.fill();
      ctx.restore();
    }

    drawCircularAvatar(ctx, img, item.login, item.x, item.y, r, ringCol, ringW);

    // Gold Star badge centered under avatar
    const starRadius = 14 * item.scale;
    const starY = item.y + r + Math.max(14, 20 * item.scale) + starRadius;
    drawStar(ctx, item.x, starY, starRadius, '#FACC15', '#EAB308', 1.2);
  }

  // Edge gradient fades (y: 260 to 600)
  const fadeW = 180;
  const leftGrad = ctx.createLinearGradient(0, 0, fadeW, 0);
  leftGrad.addColorStop(0, bgColor);
  leftGrad.addColorStop(1, isDark ? 'rgba(15,14,16,0)' : 'rgba(255,255,255,0)');
  ctx.fillStyle = leftGrad;
  ctx.fillRect(0, 260, fadeW, 340);

  const rightGrad = ctx.createLinearGradient(width - fadeW, 0, width, 0);
  rightGrad.addColorStop(0, isDark ? 'rgba(15,14,16,0)' : 'rgba(255,255,255,0)');
  rightGrad.addColorStop(1, bgColor);
  ctx.fillStyle = rightGrad;
  ctx.fillRect(width - fadeW, 260, fadeW, 340);

  // Bottom-right star count with primary coral accent (#E87443)
  const calcT = Math.min(1.0, Math.max(0.0, easeT));
  const curStars = Math.round(1 + calcT * (data.stars - 1));
  const numStr = curStars.toLocaleString();

  ctx.save();
  ctx.font = `bold 130px 'DM Sans', sans-serif`;
  const wNum = ctx.measureText(numStr).width;

  ctx.font = `400 90px 'DM Sans', sans-serif`;
  const wLabel = ctx.measureText(' stars').width;

  const totalW = wNum + wLabel;
  const startX = width - 140 - totalW;
  const baselineY = 800;

  ctx.font = `bold 130px 'DM Sans', sans-serif`;
  ctx.fillStyle = '#E87443';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(numStr, startX, baselineY);

  ctx.font = `400 90px 'DM Sans', sans-serif`;
  ctx.fillStyle = isDark ? '#F5EDE7' : '#000000';
  ctx.fillText(' stars', startX + wNum, baselineY);
  ctx.restore();
}

// -------------------------------------------------------------
// TEMPLATE 4: CONSTELLATION - Precise match with ConstellationCard.tsx
// -------------------------------------------------------------
function renderConstellation(
  ctx: CanvasRenderingContext2D,
  data: TemplateData,
  theme: 'dark' | 'light',
  progress: number,
  assets: PreloadedAssets
) {
  const isDark = theme === 'dark';
  const width = 1600;
  const height = 900;

  // Background
  const bgColor = isDark ? '#0F0E10' : '#FFFFFF';
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, width, height);

  const tSec = progress * 8.0;
  const allStargazers =
    data.stargazers && data.stargazers.length > 0
      ? data.stargazers
      : sampleStargazers;
  const points = assets.constellationPoints || [];

  // Draw scatter avatars popping in one by one organically matching ConstellationCard.tsx
  for (let idx = 0; idx < points.length; idx++) {
    const pt = points[idx];
    const startDelay = (idx / (points.length || 1)) * 0.70;
    const fadeProgress = Math.max(0, Math.min(1, (tSec - startDelay) / 0.40));
    if (fadeProgress <= 0) continue;

    const curScale = 0.3 + 0.7 * easeOut(fadeProgress);
    const alpha = pt.baseAlpha * easeOut(fadeProgress);

    ctx.save();
    ctx.globalAlpha = alpha;
    if (pt.blur > 0.3) {
      ctx.filter = `blur(${pt.blur}px)`;
    } else {
      ctx.filter = 'none';
    }

    const u = allStargazers[pt.stargazerIndex % allStargazers.length] || { login: 'star', avatarUrl: '' };
    const img = u.avatarUrl ? assets.avatarImages.get(u.avatarUrl) : undefined;
    const r = (pt.size / 2) * curScale;

    drawCircularAvatar(
      ctx,
      img,
      u.login,
      pt.x,
      pt.y,
      r,
      isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.06)',
      2
    );
    ctx.filter = 'none';
    ctx.restore();
  }

  // Soft Radial Fade Backdrop behind Main Content (ellipse 920px x 500px at 800, 450)
  const centerX = 800;
  const centerY = 450;
  const backdropAlpha = Math.max(0, Math.min(1, tSec / 0.50));

  ctx.save();
  ctx.globalAlpha = backdropAlpha;
  ctx.translate(centerX, centerY);
  ctx.scale(1.84, 1.0);
  const fadeGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, 270);
  if (isDark) {
    fadeGrad.addColorStop(0, 'rgba(15, 14, 16, 0.98)');
    fadeGrad.addColorStop(0.25, 'rgba(15, 14, 16, 0.92)');
    fadeGrad.addColorStop(0.5, 'rgba(15, 14, 16, 0.75)');
    fadeGrad.addColorStop(0.75, 'rgba(15, 14, 16, 0.35)');
    fadeGrad.addColorStop(0.9, 'rgba(15, 14, 16, 0.08)');
    fadeGrad.addColorStop(1, 'rgba(15, 14, 16, 0)');
  } else {
    fadeGrad.addColorStop(0, 'rgba(255, 255, 255, 0.98)');
    fadeGrad.addColorStop(0.25, 'rgba(255, 255, 255, 0.92)');
    fadeGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.75)');
    fadeGrad.addColorStop(0.75, 'rgba(255, 255, 255, 0.35)');
    fadeGrad.addColorStop(0.9, 'rgba(255, 255, 255, 0.08)');
    fadeGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
  }
  ctx.fillStyle = fadeGrad;
  ctx.beginPath();
  ctx.arc(0, 0, 270, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Center Content: Mascot Avatar (362px), Title (468px), Star Count (560px)
  // 1. Center mascot avatar (108px)
  const pMascot = Math.max(0, Math.min(1, (tSec - 0.20) / 0.50));
  if (pMascot > 0) {
    const easeMascot = easeOut(pMascot);
    ctx.save();
    ctx.globalAlpha = easeMascot;
    const mascotScale = 0.8 + 0.2 * easeMascot;
    drawCircularAvatar(
      ctx,
      assets.ownerImg || undefined,
      data.owner,
      centerX,
      362,
      54 * mascotScale,
      isDark ? '#342A27' : '#E2E8F0',
      3
    );
    ctx.restore();
  }

  // 2. Title: owner / repo
  const pTitle = Math.max(0, Math.min(1, (tSec - 0.30) / 0.50));
  if (pTitle > 0) {
    const easeTitle = easeOut(pTitle);
    ctx.save();
    ctx.globalAlpha = easeTitle;
    const titleY = 468 + 15 * (1 - easeTitle);
    const repoFullName = data.owner ? `${data.owner}/${data.repo}` : data.repo;
    ctx.font = `bold 72px 'DM Sans', sans-serif`;
    ctx.fillStyle = isDark ? '#F5EDE7' : '#050505';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(repoFullName, centerX, titleY);
    ctx.restore();
  }

  // 3. Star count with Amber Lucide-style star icon
  const pCount = Math.max(0, Math.min(1, (tSec - 0.40) / 0.50));
  if (pCount > 0) {
    const easeCount = easeOut(pCount);
    ctx.save();
    ctx.globalAlpha = easeCount;
    const countY = 560 + 15 * (1 - easeCount);
    const curStars = Math.round(1 + easeOut(Math.min(1.0, tSec / 1.20)) * (data.stars - 1));
    const starCountStr = curStars.toLocaleString();

    ctx.font = `bold 64px 'DM Sans', sans-serif`;
    const numW = ctx.measureText(starCountStr).width;
    ctx.font = `500 44px 'DM Sans', sans-serif`;
    const labelW = ctx.measureText('stars').width;

    const starRadius = 28; // 56px size matching w-14 h-14
    const starGap = 14;
    const textGap = 12;
    const totalW = starRadius * 2 + starGap + numW + textGap + labelW;
    const startX = centerX - totalW / 2;

    // Amber Star Icon
    drawStar(ctx, startX + starRadius, countY - 2, starRadius, '#FBBF24', '#F59E0B', 1.5);

    // Number
    ctx.font = `bold 64px 'DM Sans', sans-serif`;
    ctx.fillStyle = isDark ? '#B8AAA3' : '#555555';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(starCountStr, startX + starRadius * 2 + starGap, countY + 20);

    // "stars" label
    ctx.font = `500 44px 'DM Sans', sans-serif`;
    ctx.fillStyle = isDark ? 'rgba(245, 237, 231, 0.65)' : 'rgba(5, 5, 5, 0.55)';
    ctx.fillText('stars', startX + starRadius * 2 + starGap + numW + textGap, countY + 20);
    ctx.restore();
  }
}

// -------------------------------------------------------------
// TEMPLATE 5: SPOTLIGHT - Precise match with SpotlightCard.tsx
// -------------------------------------------------------------
function renderSpotlight(
  ctx: CanvasRenderingContext2D,
  data: TemplateData,
  theme: 'dark' | 'light',
  progress: number,
  assets: PreloadedAssets
) {
  const width = 1600;
  const height = 900;
  const isDark = theme === 'dark';

  // Background
  const bgColor = isDark ? '#0F0E10' : '#FFFFFF';
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, width, height);

  // Subtle Ambient Radial Light Spotlight (matching SpotlightCard.tsx)
  ctx.save();
  const grad = ctx.createRadialGradient(800, 405, 0, 800, 405, 480);
  if (isDark) {
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.035)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
  } else {
    grad.addColorStop(0, 'rgba(0, 0, 0, 0.02)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();

  // 1. Center Title at Y = 350
  const tSec = progress * 8.0;
  const tTitle = Math.max(0, Math.min(1, (tSec - 0.20) / 0.55));
  if (tTitle > 0) {
    const easeTitle = easeOut(tTitle);
    const titleY = 350 + 20 * (1 - easeTitle);
    const repoFullName = data.owner ? `${data.owner}/${data.repo}` : data.repo;
    ctx.save();
    ctx.globalAlpha = easeTitle;
    ctx.font = `bold 76px 'DM Sans', sans-serif`;
    ctx.fillStyle = isDark ? '#F5EDE7' : '#050505';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(repoFullName, 800, titleY);
    ctx.restore();
  }

  // 2. Big Star Count at Y = 465
  const tCount = Math.max(0, Math.min(1, (tSec - 0.35) / 0.50));
  if (tCount > 0) {
    const easeCount = easeOut(tCount);
    const countScale = 0.9 + 0.1 * easeCount;
    const numEase = easeOut(Math.min(1.0, tSec / 1.20));
    const curStars = Math.round(data.stars * numEase);
    const countStr = curStars.toLocaleString();

    ctx.save();
    ctx.globalAlpha = easeCount;
    ctx.translate(800, 465);
    ctx.scale(countScale, countScale);

    ctx.font = `bold 120px 'DM Sans', sans-serif`;
    const countW = ctx.measureText(countStr).width;
    ctx.font = `500 44px 'DM Sans', sans-serif`;
    const labelW = ctx.measureText('stargazers').width;

    const starRadius = 40; // 80px size matching w-20 h-20
    const starGap = 20;
    const textGap = 20;
    const totalGroupW = starRadius * 2 + starGap + countW + textGap + labelW;
    const startX = -totalGroupW / 2;

    // Amber Star Icon
    drawStar(ctx, startX + starRadius, -4, starRadius, '#FBBF24', '#F59E0B', 1.8);

    // Number
    ctx.font = `bold 120px 'DM Sans', sans-serif`;
    ctx.fillStyle = isDark ? '#F5EDE7' : '#050505';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(countStr, startX + starRadius * 2 + starGap, 40);

    // "stargazers"
    ctx.font = `500 44px 'DM Sans', sans-serif`;
    ctx.fillStyle = isDark ? '#A1958D' : '#64748B';
    ctx.fillText('stargazers', startX + starRadius * 2 + starGap + countW + textGap, 36);
    ctx.restore();
  }

  // 3. Bottom Avatar Fan Stack at Y = 770
  const allStargazers =
    data.stargazers && data.stargazers.length > 0 ? data.stargazers : sampleStargazers;
  const visible = allStargazers.slice(0, 8);
  const remaining = Math.max(0, data.stars - visible.length);

  const avatarR = 34; // 68px diameter
  const overlap = 16; // -space-x-4
  const step = avatarR * 2 - overlap; // 52px
  const avatarsW = (visible.length - 1) * step + avatarR * 2;

  // Measure remaining pill width
  let pillW = 0;
  const pillH = 40;
  const pillGap = 16;
  if (remaining > 0) {
    ctx.save();
    ctx.font = `600 14px 'DM Sans', sans-serif`;
    pillW = ctx.measureText(`+${remaining.toLocaleString()} others`).width + 40;
    ctx.restore();
  }

  const totalBottomW = avatarsW + (remaining > 0 ? pillGap + pillW : 0);
  const stackStartX = 800 - totalBottomW / 2 + avatarR;
  const stackY = 770;

  for (let i = 0; i < visible.length; i++) {
    const u = visible[i];
    const img = u.avatarUrl ? assets.avatarImages.get(u.avatarUrl) : undefined;
    const ax = stackStartX + i * step;
    const startDelay = 0.50 + i * 0.05;
    const itemProgress = Math.max(0, Math.min(1, (tSec - startDelay) / 0.40));
    if (itemProgress <= 0) continue;

    const easeItem = easeOut(itemProgress);
    const itemScale = 0.6 + 0.4 * easeItem;
    const itemX = ax - 10 * (1 - easeItem);

    ctx.save();
    ctx.globalAlpha = easeItem;
    ctx.translate(itemX, stackY);
    ctx.scale(itemScale, itemScale);

    // Subtle drop shadow matching shadow-lg
    ctx.shadowColor = 'rgba(0, 0, 0, 0.18)';
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 6;

    drawCircularAvatar(
      ctx,
      img,
      u.login,
      0,
      0,
      avatarR,
      isDark ? '#1C1B1F' : '#FFFFFF',
      3
    );
    ctx.restore();
  }

  // Plus Remaining Pill
  if (remaining > 0) {
    const pillStartDelay = 0.50 + visible.length * 0.05;
    const pillProgress = Math.max(0, Math.min(1, (tSec - pillStartDelay) / 0.40));
    if (pillProgress > 0) {
      const easePill = easeOut(pillProgress);
      const pillX = stackStartX + avatarsW - avatarR + pillGap;

      ctx.save();
      ctx.globalAlpha = easePill;
      drawRoundedRect(ctx, pillX, stackY - pillH / 2, pillW, pillH, 20);
      ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)';
      ctx.fill();
      ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.font = `600 14px 'DM Sans', sans-serif`;
      ctx.fillStyle = isDark ? '#A1958D' : '#64748B';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`+${remaining.toLocaleString()} others`, pillX + pillW / 2, stackY);
      ctx.restore();
    }
  }
}

// -------------------------------------------------------------
// TEMPLATE 6: REVOLVE - Precise match with RevolveCard.tsx
// -------------------------------------------------------------
function renderRevolve(
  ctx: CanvasRenderingContext2D,
  data: TemplateData,
  theme: 'dark' | 'light',
  progress: number,
  assets: PreloadedAssets
) {
  const W = 1600;
  const H = 900;
  const isDark = theme === 'dark';
  const CX = 800;
  const CY = 450;

  // Background
  const bgColor = isDark ? '#0D0C12' : '#F5F4F1';
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, W, H);

  // Radial glow matching RevolveCard.tsx
  const grd = ctx.createRadialGradient(CX, CY, 0, CX, CY, 480);
  if (isDark) {
    grd.addColorStop(0, 'rgba(168,85,247,0.28)');
    grd.addColorStop(0.28, 'rgba(139,92,246,0.12)');
    grd.addColorStop(0.60, 'rgba(13,12,18,0)');
  } else {
    grd.addColorStop(0, 'rgba(192,132,252,0.30)');
    grd.addColorStop(0.32, 'rgba(221,214,254,0.14)');
    grd.addColorStop(0.60, 'rgba(245,244,241,0)');
  }
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, W, H);

  // Ring definitions matching RevolveCard.tsx
  // [count, radius, chipSize, durationSec, clockwise, angleOffsetRad]
  const rings: [number, number, number, number, boolean, number][] = [
    [5, 310, 70, 26, true, (45 * Math.PI) / 180],
    [8, 440, 74, 40, false, 0],
    [11, 570, 78, 56, true, (30 * Math.PI) / 180],
    [14, 700, 82, 72, false, (60 * Math.PI) / 180],
    [17, 830, 86, 90, true, (22.5 * Math.PI) / 180],
  ];

  const tSec = progress * 8.0;
  const allStargazers =
    data.stargazers && data.stargazers.length > 0 ? data.stargazers : sampleStargazers;

  // Draw ring tracks and avatars
  for (let ri = 0; ri < rings.length; ri++) {
    const [count, radius, chipSize, dur, clockwise, offset] = rings[ri];
    const ringAlpha = Math.max(0, Math.min(1, (tSec - ri * 0.35) / 0.60));
    if (ringAlpha <= 0) continue;

    ctx.save();
    ctx.globalAlpha = ringAlpha;

    // Track circle
    ctx.beginPath();
    ctx.arc(CX, CY, radius, 0, Math.PI * 2);
    ctx.strokeStyle = isDark
      ? `rgba(255,255,255,${0.12 - ri * 0.015})`
      : `rgba(0,0,0,${0.09 - ri * 0.012})`;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Avatars
    const avatars = allStargazers.slice(
      rings.slice(0, ri).reduce((s, r) => s + r[0], 0),
      rings.slice(0, ri + 1).reduce((s, r) => s + r[0], 0)
    );
    const dirSign = clockwise ? 1 : -1;

    for (let i = 0; i < avatars.length; i++) {
      const u = avatars[i];
      const angle = offset + (i / count) * Math.PI * 2 + dirSign * (tSec / dur) * Math.PI * 2;
      const ax = CX + Math.cos(angle) * radius;
      const ay = CY + Math.sin(angle) * radius;
      const half = chipSize / 2;
      const r = chipSize * 0.28;

      // Chip shadow & background
      ctx.save();
      ctx.shadowColor = isDark ? 'rgba(0,0,0,0.55)' : 'rgba(0,0,0,0.08)';
      ctx.shadowBlur = 20;
      ctx.shadowOffsetY = 6;
      drawRoundedRect(ctx, ax - half, ay - half, chipSize, chipSize, r);
      ctx.fillStyle = isDark ? 'rgba(22,20,30,0.95)' : 'rgba(255,255,255,0.97)';
      ctx.fill();
      ctx.restore();

      // Chip border
      ctx.save();
      drawRoundedRect(ctx, ax - half, ay - half, chipSize, chipSize, r);
      ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.13)' : 'rgba(0,0,0,0.08)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();

      // Chip inner avatar
      const img = u.avatarUrl ? assets.avatarImages.get(u.avatarUrl) : undefined;
      const pad = 4;
      const inner = chipSize - pad * 2;
      const innerR = r * 0.7;
      const ix = ax - half + pad;
      const iy = ay - half + pad;

      ctx.save();
      drawRoundedRect(ctx, ix, iy, inner, inner, innerR);
      ctx.clip();
      if (img && img.naturalWidth > 0) {
        ctx.drawImage(img, ix, iy, inner, inner);
      } else {
        ctx.fillStyle = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.04)';
        ctx.fillRect(ix, iy, inner, inner);
        ctx.fillStyle = isDark ? '#E2E8F0' : '#475569';
        ctx.font = `bold ${Math.round(inner * 0.38)}px 'DM Sans', sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText((u.login || '?').charAt(0).toUpperCase(), ax, ay);
      }
      ctx.restore();
    }
    ctx.restore();
  }

  // Center Hub matching RevolveCard.tsx flex layout
  // Center Y: avatar center at 353.5px, repo name at 478px, star count row at 576px
  const pCenter = Math.min(1.0, tSec / 0.60);
  const easeCenter = easeOut(pCenter);
  const centerScale = 0.8 + 0.2 * easeCenter;

  ctx.save();
  ctx.globalAlpha = easeCenter;
  ctx.translate(CX, CY);
  ctx.scale(centerScale, centerScale);
  ctx.translate(-CX, -CY);

  // Center purple halo
  const halo = ctx.createRadialGradient(CX, CY, 0, CX, CY, 110);
  halo.addColorStop(0, isDark ? 'rgba(168,85,247,0.35)' : 'rgba(192,132,252,0.32)');
  halo.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = halo;
  ctx.fillRect(CX - 110, CY - 110, 220, 220);

  // 1. Owner Avatar: 160x160 with 36px rounded corners at Y = 273.5
  const avatarSz = 160;
  const avatarHalf = avatarSz / 2;
  const avatarR = 36;
  const avatarTop = 273.5;
  const avatarCenterY = avatarTop + avatarHalf; // 353.5

  ctx.save();
  ctx.shadowColor = isDark ? 'rgba(0,0,0,0.65)' : 'rgba(0,0,0,0.12)';
  ctx.shadowBlur = 60;
  ctx.shadowOffsetY = 20;
  drawRoundedRect(ctx, CX - avatarHalf, avatarTop, avatarSz, avatarSz, avatarR);
  ctx.fillStyle = isDark ? 'rgba(255,255,255,0.09)' : '#FFFFFF';
  ctx.fill();
  ctx.restore();

  ctx.save();
  drawRoundedRect(ctx, CX - avatarHalf, avatarTop, avatarSz, avatarSz, avatarR);
  ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.09)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.clip();

  if (assets.ownerImg && assets.ownerImg.naturalWidth > 0) {
    ctx.drawImage(assets.ownerImg, CX - avatarHalf, avatarTop, avatarSz, avatarSz);
  } else {
    ctx.fillStyle = isDark ? '#F5EDE7' : '#0F0E10';
    ctx.font = `bold 60px 'DM Sans', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText((data.repo ? data.repo.charAt(0).toUpperCase() : '★'), CX, avatarCenterY);
  }
  ctx.restore();

  // 2. Repo full name: 46px extrabold, letter-spacing -0.025em at Y = 478
  const repoFullName = data.owner ? `${data.owner}/${data.repo}` : data.repo;
  ctx.save();
  ctx.font = `800 46px 'DM Sans', sans-serif`;
  ctx.fillStyle = isDark ? '#F5EDE7' : '#0F0E10';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(repoFullName, CX, 478);
  ctx.restore();

  // 3. Star count row: Star (76px) + Number (100px) + "stars" (28px) at Y = 576
  const numEase = easeOut(Math.min(1.0, tSec / 1.40));
  const curStars = Math.round(data.stars * numEase);
  const countStr = curStars.toLocaleString();

  ctx.save();
  ctx.font = `900 100px 'DM Sans', sans-serif`;
  const countW = ctx.measureText(countStr).width;
  ctx.font = `500 28px 'DM Sans', sans-serif`;
  const labelW = ctx.measureText('stars').width;

  const starSz = 76;
  const gap = 16;
  const totalW = starSz + gap + countW + gap + labelW;
  const startX = CX - totalW / 2;
  const rowCenterY = 576;

  // Star icon
  drawStar(ctx, startX + starSz / 2, rowCenterY - 4, starSz / 2, '#FACC15', '#EAB308', 1.5);

  // Count
  ctx.font = `900 100px 'DM Sans', sans-serif`;
  ctx.fillStyle = isDark ? '#F5EDE7' : '#0F0E10';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(countStr, startX + starSz + gap, rowCenterY + 34);

  // "stars" label
  ctx.font = `500 28px 'DM Sans', sans-serif`;
  ctx.fillStyle = isDark ? '#A1958D' : '#64748B';
  ctx.fillText('stars', startX + starSz + gap + countW + gap, rowCenterY + 30);
  ctx.restore();

  ctx.restore();
}

// -------------------------------------------------------------
// TEMPLATE: HYPERDRIVE (LIGHT-SPEED JUMP)
// -------------------------------------------------------------
function renderHyperdrive(
  ctx: CanvasRenderingContext2D,
  data: TemplateData,
  theme: 'dark' | 'light',
  progress: number,
  assets: PreloadedAssets
) {
  const isDark = theme === 'dark';
  const width = 1600;
  const height = 900;
  const cx = 800;
  const cy = 450;

  // Hyperdrive duration is 8.0s; convert progress (0..1) to actual elapsed seconds
  const totalDuration = 8.0;
  const timeSec = progress * totalDuration;

  // 1. Background Fill: Obsidian in Dark, Warm Stone in Light matching HyperdriveCard.tsx
  const bgColor = isDark ? '#0D0C12' : '#F5F4F1';
  ctx.fillStyle = bgColor;
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

  // 3. 64 Warp Streak Lines
  ctx.save();
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
    const p = (initialProgress + timeSec * speed) % 1;

    const baseLength = 140 + (i % 4) * 70;
    const length = baseLength * (0.3 + Math.pow(p, 1.4) * 1.5);
    const startDist = 70 + Math.pow(p, 2.0) * (edgeDist - 40);
    const endDist = startDist + length;

    const x1 = cx + cosA * startDist;
    const y1 = cy + sinA * startDist;
    const x2 = cx + cosA * endDist;
    const y2 = cy + sinA * endDist;

    let alpha = 1;
    if (p < 0.15) {
      alpha = p / 0.15;
    } else if (p > 0.8) {
      alpha = (1 - p) / 0.2;
    }
    alpha *= 0.2 + (i % 3) * 0.12;

    const isGold = i % 10 === 0;

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = isGold
      ? '#FACC15'
      : isDark
      ? 'rgba(255, 255, 255, 0.35)'
      : 'rgba(15, 14, 16, 0.22)';
    ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
    ctx.lineWidth = isGold ? 2.0 : 1.2;
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

  // 5. Stardust Specks
  ctx.save();
  for (let s = 0; s < 32; s++) {
    const sAngle = (s / 32) * Math.PI * 2 + ((s * 23) % 9) * 0.08;
    const sSpeed = 0.45 + (s % 4) * 0.08;
    const sP = ((s * (1 / 32)) + timeSec * sSpeed) % 1;
    const sDist = 60 + Math.pow(sP, 2.2) * 880;

    const px = cx + Math.cos(sAngle) * sDist;
    const py = cy + Math.sin(sAngle) * sDist;

    let sAlpha = 1;
    if (sP < 0.2) sAlpha = sP / 0.2;
    else if (sP > 0.85) sAlpha = (1 - sP) / 0.15;

    ctx.beginPath();
    ctx.arc(px, py, 1.0 + (s % 2) * 0.8, 0, Math.PI * 2);
    ctx.fillStyle = s % 4 === 0 ? '#FACC15' : isDark ? '#ffffff' : '#0F0E10';
    ctx.globalAlpha = Math.max(0, Math.min(1, sAlpha * 0.5));
    ctx.fill();
  }
  ctx.restore();

  // 6. Heavy Ambient Glow & Backdrop Fill BEHIND Avatars (zIndex 5)
  ctx.save();
  const backdropGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 450);
  if (isDark) {
    backdropGrad.addColorStop(0, 'rgba(13, 12, 18, 0.85)');
    backdropGrad.addColorStop(0.4, 'rgba(13, 12, 18, 0.80)');
    backdropGrad.addColorStop(0.65, 'rgba(13, 12, 18, 0.45)');
    backdropGrad.addColorStop(0.85, 'rgba(13, 12, 18, 0)');
    backdropGrad.addColorStop(1, 'rgba(13, 12, 18, 0)');
  } else {
    backdropGrad.addColorStop(0, 'rgba(245, 244, 241, 0.88)');
    backdropGrad.addColorStop(0.4, 'rgba(245, 244, 241, 0.83)');
    backdropGrad.addColorStop(0.65, 'rgba(245, 244, 241, 0.48)');
    backdropGrad.addColorStop(0.85, 'rgba(245, 244, 241, 0)');
    backdropGrad.addColorStop(1, 'rgba(245, 244, 241, 0)');
  }
  ctx.fillStyle = backdropGrad;
  ctx.fillRect(cx - 450, cy - 450, 900, 900);

  const centerGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, 480);
  if (isDark) {
    centerGlow.addColorStop(0, 'rgba(250, 204, 21, 0.45)');
    centerGlow.addColorStop(0.35, 'rgba(245, 158, 11, 0.25)');
    centerGlow.addColorStop(0.6, 'rgba(234, 179, 8, 0.08)');
    centerGlow.addColorStop(0.8, 'rgba(0, 0, 0, 0)');
    centerGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  } else {
    centerGlow.addColorStop(0, 'rgba(250, 204, 21, 0.35)');
    centerGlow.addColorStop(0.35, 'rgba(245, 158, 11, 0.18)');
    centerGlow.addColorStop(0.6, 'rgba(234, 179, 8, 0.05)');
    centerGlow.addColorStop(0.8, 'rgba(0, 0, 0, 0)');
    centerGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  }
  ctx.fillStyle = centerGlow;
  ctx.fillRect(cx - 480, cy - 480, 960, 960);
  ctx.restore();

  // 7. 36 Contributor Avatars flying outward (88px chip size, scaled organically)
  const sourceStargazers =
    data.stargazers && data.stargazers.length > 0 ? data.stargazers : sampleStargazers;

  const hash = (i: number, seed: number) => {
    let h = (i * 374761393 + seed * 668265263) ^ 0x5bf03635;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
  };

  const count = 36;
  const avatarsToDraw: {
    posX: number;
    posY: number;
    scaleVal: number;
    alpha: number;
    user: (typeof sourceStargazers)[0];
    p: number;
  }[] = [];

  for (let i = 0; i < count; i++) {
    // 8 directional sectors: 0=E, 1=NE, 2=N, 3=NW, 4=W, 5=SW, 6=S, 7=SE
    const sector = i % 8;
    const sectorAngle = (sector * Math.PI) / 4;
    const angleJitter = (hash(i, 101) - 0.5) * (Math.PI / 6);
    const baseAngle = sectorAngle + angleJitter;

    const startDist = 220 + hash(i, 202) * 100;
    const delay = (i * 0.038) + hash(i, 303) * 0.05;
    const speed = 0.58 + (i % 5) * 0.04;
    const spinDir = i % 2 === 0 ? 1 : -1;
    const chipScale = 0.85 + hash(i, 606) * 0.28;

    const rawP = timeSec * speed - delay;
    if (rawP < 0) continue;

    const p = rawP % 1;

    const currentAngle = baseAngle + (p - 0.5) * 0.22 * spinDir;
    const cosA = Math.cos(currentAngle);
    const sinA = Math.sin(currentAngle);
    const absCos = Math.abs(cosA);
    const absSin = Math.abs(sinA);

    const edgeDist = Math.min(
      absCos > 0.0001 ? 800 / absCos : 9999,
      absSin > 0.0001 ? 450 / absSin : 9999
    );
    const exitDist = edgeDist + 150;

    const distP = 0.20 * p + 0.80 * Math.pow(p, 1.35);
    const dist = startDist + (exitDist - startDist) * distP;
    const posX = cx + cosA * dist;
    const posY = cy + sinA * dist;

    const scaleVal = (0.35 + distP * 1.45) * chipScale;
    const alpha = p < 0.06 ? p / 0.06 : p > 0.88 ? (1 - p) / 0.12 : 1;
    const user = sourceStargazers[i % sourceStargazers.length];

    avatarsToDraw.push({ posX, posY, scaleVal, alpha, user, p });
  }

  // Sort back-to-front so smaller/further avatars draw behind larger/closer ones
  avatarsToDraw.sort((a, b) => a.p - b.p);

  for (let k = 0; k < avatarsToDraw.length; k++) {
    const item = avatarsToDraw[k];
    const size = 88 * item.scaleVal;
    const half = size / 2;
    const cornerR = 16 * item.scaleVal;
    const img = item.user ? assets.avatarImages.get(item.user.avatarUrl) : undefined;
    const x = item.posX - half;
    const y = item.posY - half;

    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, item.alpha));

    // Card shadow matching HyperdriveCard.tsx CSS box-shadow
    ctx.shadowColor = isDark ? 'rgba(0, 0, 0, 0.65)' : 'rgba(0, 0, 0, 0.08)';
    ctx.shadowBlur = (isDark ? 24 : 20) * item.scaleVal;
    ctx.shadowOffsetY = 10 * item.scaleVal;
    ctx.shadowOffsetX = 0;

    // Background fill
    drawRoundedRect(ctx, x, y, size, size, cornerR);
    ctx.fillStyle = isDark ? 'rgba(13, 12, 18, 0.92)' : 'rgba(255, 255, 255, 0.96)';
    ctx.fill();

    // Disable shadow before drawing inner avatar and border
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    // Clip for inner avatar image / fallback
    ctx.save();
    drawRoundedRect(ctx, x, y, size, size, cornerR);
    ctx.clip();
    if (img && img.naturalWidth > 0) {
      ctx.drawImage(img, x, y, size, size);
    } else {
      ctx.fillStyle = isDark ? '#1D1C24' : '#E2E8F0';
      ctx.fillRect(x, y, size, size);
      ctx.fillStyle = isDark ? '#F5EDE7' : '#0F0E10';
      ctx.font = `bold ${Math.round(size * 0.38)}px 'DM Sans', sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText((item.user?.login || 'U').slice(0, 2).toUpperCase(), item.posX, item.posY);
    }
    ctx.restore();

    // Border on top matching 1.5px solid border in HyperdriveCard
    drawRoundedRect(ctx, x, y, size, size, cornerR);
    ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.18)' : 'rgba(15, 14, 16, 0.12)';
    ctx.lineWidth = Math.max(1, 1.5 * item.scaleVal);
    ctx.stroke();

    ctx.restore();
  }

  // 8. Center Hub (Entrance transition over 0.7s, count-up over 1.2s matching HyperdriveCard.tsx)
  const hubP = Math.min(1, timeSec / 0.7);
  const easeHub = 1 - Math.pow(1 - hubP, 3);
  const hubScale = 0.8 + 0.2 * easeHub;
  const hubOpacity = easeHub;

  const countP = Math.min(1, timeSec / 1.2);
  const easeCount = 1 - Math.pow(1 - countP, 3);
  const curStars = Math.round(data.stars * easeCount);
  const countStr = curStars.toLocaleString();

  ctx.save();
  ctx.globalAlpha = hubOpacity;
  ctx.translate(cx, cy);
  ctx.scale(hubScale, hubScale);
  ctx.translate(-cx, -cy);

  // 1. Owner avatar box (160px x 160px squircle, radius 36px at top 273.5)
  const avatarSz = 160;
  const avatarHalf = avatarSz / 2;
  const avatarR = 36;
  const avatarTop = 273.5;
  const avatarCenterY = avatarTop + avatarHalf; // 353.5

  // Golden glow around owner avatar box
  ctx.save();
  ctx.shadowColor = isDark ? 'rgba(250, 204, 21, 0.16)' : 'rgba(250, 204, 21, 0.10)';
  ctx.shadowBlur = 40;
  ctx.shadowOffsetY = 0;
  drawRoundedRect(ctx, cx - avatarHalf, avatarTop, avatarSz, avatarSz, avatarR);
  ctx.fillStyle = isDark ? 'rgba(255,255,255,0.09)' : '#FFFFFF';
  ctx.fill();

  // Dark drop shadow
  ctx.shadowColor = isDark ? 'rgba(0,0,0,0.65)' : 'rgba(0,0,0,0.12)';
  ctx.shadowBlur = 60;
  ctx.shadowOffsetY = 20;
  drawRoundedRect(ctx, cx - avatarHalf, avatarTop, avatarSz, avatarSz, avatarR);
  ctx.fill();
  ctx.restore();

  // Avatar clip & draw
  ctx.save();
  drawRoundedRect(ctx, cx - avatarHalf, avatarTop, avatarSz, avatarSz, avatarR);
  ctx.clip();
  if (assets.ownerImg && assets.ownerImg.naturalWidth > 0) {
    ctx.drawImage(assets.ownerImg, cx - avatarHalf, avatarTop, avatarSz, avatarSz);
  } else {
    ctx.fillStyle = isDark ? '#1D1C24' : '#E2E8F0';
    ctx.fillRect(cx - avatarHalf, avatarTop, avatarSz, avatarSz);
    ctx.fillStyle = isDark ? '#F5EDE7' : '#0F0E10';
    ctx.font = `bold 60px 'DM Sans', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText((data.repo ? data.repo.charAt(0).toUpperCase() : '★'), cx, avatarCenterY);
  }
  ctx.restore();

  // Border on top
  ctx.save();
  drawRoundedRect(ctx, cx - avatarHalf, avatarTop, avatarSz, avatarSz, avatarR);
  ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.09)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();

  // 2. Repo full name: 46px extrabold, letter-spacing -0.025em at Y = 478
  const repoFullName = data.owner ? `${data.owner}/${data.repo}` : data.repo;
  ctx.save();
  ctx.font = `800 46px 'DM Sans', sans-serif`;
  ctx.fillStyle = isDark ? '#F5EDE7' : '#0F0E10';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(repoFullName, cx, 478);
  ctx.restore();

  // 3. Star count row: Star (76px) + Number (100px) + "stars" (28px) at Y = 576
  ctx.save();
  ctx.font = `900 100px 'DM Sans', sans-serif`;
  const countW = ctx.measureText(countStr).width;
  ctx.font = `500 28px 'DM Sans', sans-serif`;
  const labelW = ctx.measureText('stars').width;

  const starSz = 76;
  const gap = 16;
  const totalW = starSz + gap + countW + gap + labelW;
  const startX = cx - totalW / 2;
  const rowCenterY = 576;

  // Star icon
  drawStar(ctx, startX + starSz / 2, rowCenterY - 4, starSz / 2, '#FACC15', '#EAB308', 1.5);

  // Count
  ctx.font = `900 100px 'DM Sans', sans-serif`;
  ctx.fillStyle = isDark ? '#F5EDE7' : '#0F0E10';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(countStr, startX + starSz + gap, rowCenterY + 34);

  // "stars" label
  ctx.font = `500 28px 'DM Sans', sans-serif`;
  ctx.fillStyle = isDark ? '#A1958D' : '#64748B';
  ctx.fillText('stars', startX + starSz + gap + countW + gap, rowCenterY + 30);
  ctx.restore();

  ctx.restore();
}

function renderBlackhole(
  ctx: CanvasRenderingContext2D,
  data: TemplateData,
  theme: 'dark' | 'light',
  progress: number,
  assets: PreloadedAssets
) {
  const isDark = theme === 'dark';
  const CORNER_ANGLES = [
    Math.PI / 4,
    (3 * Math.PI) / 4,
    (5 * Math.PI) / 4,
    (7 * Math.PI) / 4,
  ];
  const R_START = 920;
  const R_END = 150;
  const SWEEP_ANGLE = 1.7 * Math.PI;

  // 1. Background Fill
  ctx.save();
  ctx.fillStyle = isDark ? '#08080C' : '#FAFAF9';
  ctx.fillRect(0, 0, 1600, 900);

  // Radial ambient background glow (Matching DOM 68% circle at 50% 50% spanning out to corners at 920px)
  const glowGrad = ctx.createRadialGradient(800, 450, 0, 800, 450, 920);
  glowGrad.addColorStop(0, isDark ? 'rgba(234, 179, 8, 0.38)' : 'rgba(250, 204, 21, 0.42)');
  glowGrad.addColorStop(0.38, isDark ? 'rgba(168, 85, 247, 0.24)' : 'rgba(221, 214, 254, 0.28)');
  glowGrad.addColorStop(0.68, isDark ? 'rgba(168, 85, 247, 0.10)' : 'rgba(221, 214, 254, 0.12)');
  glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = glowGrad;
  ctx.fillRect(0, 0, 1600, 900);

  // 2. 4 Curved Corner Background Spiral Lines (100% Synced with Avatar Flow)
  ctx.save();
  CORNER_ANGLES.forEach((baseAngle) => {
    ctx.beginPath();
    const steps = 90;
    for (let i = 0; i <= steps; i++) {
      const t = 1 - i / steps; // 1 at outer corner, 0 at center
      const r = R_START * t + R_END * (1 - t);
      const angle = baseAngle + (1 - t) * SWEEP_ANGLE;
      const x = 800 + r * Math.cos(angle);
      const y = 450 + r * Math.sin(angle);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = isDark ? 'rgba(234, 179, 8, 0.16)' : 'rgba(234, 179, 8, 0.22)';
    ctx.lineWidth = 4;
    ctx.setLineDash([]);
    ctx.stroke();

    // Secondary parallel accent curve
    ctx.beginPath();
    for (let i = 0; i <= steps; i++) {
      const t = 1 - i / steps;
      const r = (R_START + 75) * t + (R_END + 35) * (1 - t);
      const angle = baseAngle + (1 - t) * SWEEP_ANGLE + 0.12;
      const x = 800 + r * Math.cos(angle);
      const y = 450 + r * Math.sin(angle);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([8, 8]);
    ctx.stroke();
  });
  ctx.restore();

  // 3. Render 4 Curved Avatar Streams
  const stargazers = data.stargazers?.length ? data.stargazers : sampleStargazers;
  const avatarList: any[] = [];
  while (avatarList.length < 48) {
    avatarList.push(...stargazers);
  }
  const items = avatarList.slice(0, 48);

  // Group into 4 arms
  const armAvatars: Array<Array<{ user: any; idx: number }>> = [[], [], [], []];
  items.forEach((user, i) => {
    armAvatars[i % 4].push({ user, idx: i });
  });

  armAvatars.forEach((armList, armIdx) => {
    const baseAngle = CORNER_ANGLES[armIdx];
    const armCount = armList.length;

    armList.forEach(({ user, idx }, itemIdx) => {
      const localOffset = itemIdx / armCount;
      const p = (localOffset + progress) % 1;
      const currentP = 1 - p;

      const r = R_START * currentP + R_END * (1 - currentP);
      const angle = baseAngle + (1 - currentP) * SWEEP_ANGLE;

      const x = 800 + r * Math.cos(angle);
      const y = 450 + r * Math.sin(angle);

      const chipSize = 68 + 32 * currentP; // 68px inner to 100px outer (Enlarged)
      const opacity = Math.sin(currentP * Math.PI);
      const alpha = Math.max(0.08, opacity);

      const imgKey = user.avatarUrl || user.login || `user-${idx}`;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(x, y);

      const chipR = chipSize * 0.28;
      const img = assets.avatarImages.get(imgKey);

      // Drop shadow
      ctx.shadowColor = isDark ? 'rgba(0, 0, 0, 0.6)' : 'rgba(0, 0, 0, 0.1)';
      ctx.shadowBlur = 16;
      ctx.shadowOffsetY = 6;

      drawRoundedRect(ctx, -chipSize / 2, -chipSize / 2, chipSize, chipSize, chipR);
      ctx.fillStyle = isDark ? 'rgba(22, 20, 30, 0.95)' : 'rgba(255, 255, 255, 0.97)';
      ctx.fill();

      // Reset shadow for clip
      ctx.shadowColor = 'transparent';

      ctx.save();
      drawRoundedRect(ctx, -chipSize / 2, -chipSize / 2, chipSize, chipSize, chipR);
      ctx.clip();

      if (img && img.naturalWidth > 0) {
        ctx.drawImage(img, -chipSize / 2, -chipSize / 2, chipSize, chipSize);
      } else {
        ctx.fillStyle = isDark ? '#2A2736' : '#E2E8F0';
        ctx.fillRect(-chipSize / 2, -chipSize / 2, chipSize, chipSize);
        ctx.fillStyle = isDark ? '#FFFFFF' : '#0F172A';
        ctx.font = `bold ${chipSize * 0.38}px 'DM Sans', sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText((user.login || 'S').charAt(0).toUpperCase(), 0, 0);
      }
      ctx.restore();

      // Border
      drawRoundedRect(ctx, -chipSize / 2, -chipSize / 2, chipSize, chipSize, chipR);
      ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();
    });
  });

  // 4. Render Frameless Center Hub (Matching Revolve Editorial standard)
  const tSec = progress * 16.0;
  const numEase = 1 - Math.pow(1 - Math.min(1.0, tSec / 2.60), 3);
  const countVal = Math.round(data.stars * numEase);
  const countStr = countVal.toLocaleString();
  const repoFullName = data.owner ? `${data.owner}/${data.repo}` : data.repo;
  const titleColor = isDark ? '#F5EDE7' : '#0F0E10';
  const subColor = isDark ? '#A1958D' : '#64748B';

  const cx = 800;
  const avatarSz = 160;
  const avatarTop = 273.5;
  const avatarCenterY = avatarTop + avatarSz / 2;
  const avatarR = 36;

  // Center purple & golden radial halo (Wide spread)
  ctx.save();
  const centerHalo = ctx.createRadialGradient(cx, 450, 0, cx, 450, 480);
  centerHalo.addColorStop(0, isDark ? 'rgba(234, 179, 8, 0.45)' : 'rgba(250, 204, 21, 0.40)');
  centerHalo.addColorStop(0.35, isDark ? 'rgba(168, 85, 247, 0.26)' : 'rgba(192, 132, 252, 0.22)');
  centerHalo.addColorStop(0.70, isDark ? 'rgba(168, 85, 247, 0.10)' : 'rgba(192, 132, 252, 0.08)');
  centerHalo.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = centerHalo;
  ctx.fillRect(cx - 480, 450 - 480, 960, 960);
  ctx.restore();

  // Match BlackholeCard's 250ms delayed, 1.4s center hub entrance.
  const hubProgress = Math.max(0, Math.min(1, (tSec - 0.25) / 1.4));
  const hubEase = cubicBezierEase(hubProgress, 0.16, 1, 0.3, 1);
  const hubScale = 0.75 + 0.25 * hubEase;
  ctx.save();
  ctx.globalAlpha = hubEase;
  ctx.translate(cx, 450);
  ctx.scale(hubScale, hubScale);
  ctx.translate(-cx, -450);

  // Owner Avatar Golden Glow Shadow
  ctx.save();
  ctx.shadowColor = isDark ? 'rgba(234, 179, 8, 0.55)' : 'rgba(234, 179, 8, 0.38)';
  ctx.shadowBlur = 60;
  drawRoundedRect(ctx, cx - avatarSz / 2, avatarTop, avatarSz, avatarSz, avatarR);
  ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.09)' : '#FFFFFF';
  ctx.fill();

  ctx.shadowColor = isDark ? 'rgba(0, 0, 0, 0.75)' : 'rgba(0, 0, 0, 0.15)';
  ctx.shadowBlur = 60;
  ctx.shadowOffsetY = 20;
  drawRoundedRect(ctx, cx - avatarSz / 2, avatarTop, avatarSz, avatarSz, avatarR);
  ctx.fill();
  ctx.restore();

  // Avatar Image Clip
  ctx.save();
  drawRoundedRect(ctx, cx - avatarSz / 2, avatarTop, avatarSz, avatarSz, avatarR);
  ctx.clip();
  if (assets.ownerImg && assets.ownerImg.naturalWidth > 0) {
    ctx.drawImage(assets.ownerImg, cx - avatarSz / 2, avatarTop, avatarSz, avatarSz);
  } else {
    ctx.fillStyle = isDark ? '#1D1C24' : '#E2E8F0';
    ctx.fillRect(cx - avatarSz / 2, avatarTop, avatarSz, avatarSz);
    ctx.fillStyle = titleColor;
    ctx.font = `bold 60px 'DM Sans', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText((data.repo ? data.repo.charAt(0).toUpperCase() : '★'), cx, avatarCenterY);
  }
  ctx.restore();

  // Avatar Border
  ctx.save();
  drawRoundedRect(ctx, cx - avatarSz / 2, avatarTop, avatarSz, avatarSz, avatarR);
  ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.18)' : 'rgba(0, 0, 0, 0.09)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();

  // Repo Full Name
  ctx.save();
  ctx.font = `800 46px 'DM Sans', sans-serif`;
  ctx.fillStyle = titleColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(repoFullName, cx, 478);
  ctx.restore();

  // Star Count Row
  ctx.save();
  ctx.font = `900 100px 'DM Sans', sans-serif`;
  const countW = ctx.measureText(countStr).width;
  ctx.font = `500 28px 'DM Sans', sans-serif`;
  const labelW = ctx.measureText('stars').width;

  const starSz = 76;
  const gap = 16;
  const totalW = starSz + gap + countW + gap + labelW;
  const startX = cx - totalW / 2;
  const rowCenterY = 576;

  drawStar(ctx, startX + starSz / 2, rowCenterY - 4, starSz / 2, '#FACC15', '#EAB308', 1.1);

  ctx.font = `900 100px 'DM Sans', sans-serif`;
  ctx.fillStyle = titleColor;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(countStr, startX + starSz + gap, rowCenterY + 34);

  ctx.font = `500 28px 'DM Sans', sans-serif`;
  ctx.fillStyle = subColor;
  ctx.fillText('stars', startX + starSz + gap + countW + gap, rowCenterY + 30);
  ctx.restore();
  ctx.restore();
}

// Main rendering dispatcher
export function renderTemplateFrame(
  ctx: CanvasRenderingContext2D,
  template: TemplateType,
  data: TemplateData,
  theme: 'dark' | 'light',
  progress: number,
  assets: PreloadedAssets
) {
  if (template === 'milestone') {
    renderCounter(ctx, data, theme, progress, assets);
  } else if (template === 'infinity') {
    renderTicker(ctx, data, theme, progress, assets);
  } else if (template === 'revolve') {
    renderRevolve(ctx, data, theme, progress, assets);
  } else if (template === 'orbit') {
    renderOrbit(ctx, data, theme, progress, assets);
  } else if (template === 'constellation') {
    renderConstellation(ctx, data, theme, progress, assets);
  } else if (template === 'spotlight') {
    renderSpotlight(ctx, data, theme, progress, assets);
  } else if (template === 'hyperdrive') {
    renderHyperdrive(ctx, data, theme, progress, assets);
  } else if (template === 'blackhole') {
    renderBlackhole(ctx, data, theme, progress, assets);
  }
}

