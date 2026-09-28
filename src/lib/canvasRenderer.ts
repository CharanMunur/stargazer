import type { TemplateData } from '../components/templates/types';
import sampleStargazers from '../data/sampleStargazers.json';

export type TemplateType = 'counter' | 'ticker' | 'orbit' | 'constellation';

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
function loadImage(url: string, timeoutMs = 2000): Promise<HTMLImageElement | null> {
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
  const padding = 12.0; // Reduced padding between avatars for denser constellation

  const tryAdd = (x: number, y: number, size: number): boolean => {
    const r = size / 2.0;

    // Strict collision check against existing points (guarantees NO overlapping)
    for (const p of points) {
      if (Math.hypot(x - p.x, y - p.y) < r + p.size / 2.0 + padding) {
        return false;
      }
    }

    // Depth calculation: subtle, delicate blur (max 1.0px on inner nodes, 0px on outer)
    const distFromCenter = Math.hypot(x - centerX, y - centerY);
    const normDist = Math.min(1.0, Math.max(0.0, (distFromCenter - 230.0) / 600.0));
    const blurAmount = Math.max(0, (1.0 - normDist) * 1.0);
    const blur = blurAmount >= 0.4 ? Number(blurAmount.toFixed(1)) : 0;
    const baseAlpha = Number((0.68 + 0.32 * Math.pow(normDist, 0.8)).toFixed(2));
    const phase = prng() * Math.PI * 2;

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

  // Full-field organic scatter across canvas (including behind main content)
  const targetCount = 100; // Increased avatar count
  let attempts = 0;
  while (points.length < targetCount && attempts < 90000) {
    attempts++;
    const x = -35.0 + prng() * (1600.0 + 70.0);
    const y = -35.0 + prng() * (900.0 + 70.0);
    const size = 84.0 + prng() * 54.0; // Increased avatar sizes (84px - 138px)
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
  if (template === 'counter') {
    avatarUrls = sourceStargazers.slice(0, 16).map((s) => s.avatarUrl).filter(Boolean);
  } else if (template === 'ticker') {
    avatarUrls = sourceStargazers.slice(0, 16).map((s) => s.avatarUrl).filter(Boolean);
  } else if (template === 'orbit') {
    avatarUrls = sourceStargazers.slice(0, 16).map((s) => s.avatarUrl).filter(Boolean);
  } else if (template === 'constellation') {
    // Up to 96 avatars for scatter pool
    avatarUrls = sourceStargazers.slice(0, 96).map((s) => s.avatarUrl).filter(Boolean);
  }

  const [leafImg, ownerImg, ...loadedAvatars] = await Promise.all([
    template === 'counter' ? loadImage('/leaf.svg') : Promise.resolve(null),
    data.ownerAvatarUrl ? loadImage(data.ownerAvatarUrl) : Promise.resolve(null),
    ...avatarUrls.map((u) => loadImage(u, 2000)),
  ]);

  avatarUrls.forEach((url, i) => {
    const img = loadedAvatars[i];
    if (img) avatarImages.set(url, img);
  });

  const constellationPoints =
    template === 'constellation'
      ? generateConstellationPoints(data.repo || 'stargazer', sourceStargazers.length)
      : undefined;

  return { avatarImages, leafImg, ownerImg, constellationPoints };
}

function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

// Exact Go easeOutBack formula (s = 1.25)
function easeOutBack(t: number, s = 1.25): number {
  const tNorm = t - 1.0;
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

function drawYellowStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.save();
  ctx.beginPath();
  const points = 5;
  const step = Math.PI / points;
  for (let i = 0; i < 2 * points; i++) {
    const currR = i % 2 === 0 ? r : r * 0.45;
    const angle = i * step - Math.PI / 2;
    const x = cx + currR * Math.cos(angle);
    const y = cy + currR * Math.sin(angle);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = '#FACC15';
  ctx.fill();
  ctx.strokeStyle = '#EAB308';
  ctx.lineWidth = Math.max(1.2, r * 0.08);
  ctx.stroke();
  ctx.restore();
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
    ctx.arc(cx, cy, r + ringWidth / 2 + 1, 0, Math.PI * 2);
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
    ctx.font = `bold ${Math.round(r * 0.6)}px 'DM Sans', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText((fallbackText || 'U').slice(0, 2).toUpperCase(), cx, cy);
  }
  ctx.restore();
}

// -------------------------------------------------------------
// TEMPLATE 1: COUNTER
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
  ctx.fillStyle = isDark ? '#0F0E10' : '#FFFFFF';
  ctx.fillRect(0, 0, width, height);

  // Easing calculations
  const tTitle = Math.min(1, progress / 0.25);
  const easeTitle = easeOut(tTitle);
  const titleY = 220 + 30 * (1 - easeTitle);

  // Laurels flanking the title
  if (assets.leafImg && easeTitle > 0) {
    ctx.save();
    ctx.globalAlpha = (isDark ? 0.32 : 0.32) * easeTitle;
    const leafW = 140;
    const leafH = 260;
    const titleText = `${data.owner || ''}/${data.repo}`;
    ctx.font = `bold 84px 'DM Sans', sans-serif`;
    const tw = ctx.measureText(titleText).width;
    const leafGap = 45;

    // Left leaf (flipped)
    ctx.save();
    ctx.translate(800 - tw / 2 - leafGap - leafW / 2, titleY - 70);
    ctx.scale(-1, 1);
    ctx.drawImage(assets.leafImg, -leafW / 2, -leafH / 2, leafW, leafH);
    ctx.restore();

    // Right leaf
    ctx.drawImage(assets.leafImg, 800 + tw / 2 + leafGap, titleY - 70 - leafH / 2, leafW, leafH);
    ctx.restore();
  }

  // Subtitle: STARGAZERS · 2026
  if (easeTitle > 0) {
    ctx.save();
    ctx.globalAlpha = easeTitle;
    ctx.fillStyle = isDark ? '#B8AAA3' : '#555555';
    ctx.font = `400 30px 'DM Sans', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    drawSpacedText(ctx, 'STARGAZERS · 2026', 800, titleY - 80, 6);

    // Title: owner/repo
    ctx.fillStyle = isDark ? '#F5EDE7' : '#111111';
    ctx.font = `bold 84px 'DM Sans', sans-serif`;
    ctx.fillText(`${data.owner || ''}/${data.repo}`, 800, titleY);
    ctx.restore();
  }

  // Counters: Stars, Forks, Days
  const tCount = Math.max(0, Math.min(1, (progress - 0.1) / 0.5));
  const easeCount = easeOut(tCount);

  const curStars = Math.round(data.stars * easeCount);
  const curForks = Math.round(data.forks * easeCount);
  const curDays = Math.round(data.days * easeCount);

  if (easeCount > 0) {
    ctx.save();
    ctx.globalAlpha = easeCount;
    ctx.fillStyle = isDark ? '#F5EDE7' : '#111111';
    ctx.font = `400 150px 'DM Sans', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const countY = 410;
    ctx.fillText(curStars.toLocaleString(), 400, countY);
    ctx.fillText(curForks.toLocaleString(), 800, countY);
    ctx.fillText(curDays.toLocaleString(), 1200, countY);

    // Labels: STARS, FORKS, DAYS
    ctx.fillStyle = isDark ? '#8A7E78' : '#888888';
    ctx.font = `400 24px 'DM Sans', sans-serif`;
    drawSpacedText(ctx, 'STARS', 400, countY + 110, 8);
    drawSpacedText(ctx, 'FORKS', 800, countY + 110, 8);
    drawSpacedText(ctx, 'DAYS', 1200, countY + 110, 8);
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

  const avatarSize = 120;
  const gapX = 36;
  const gapY = 26;
  const startX = 800 - (8 * avatarSize + 7 * gapX) / 2 + avatarSize / 2;
  const startY = 620;

  for (let i = 0; i < 16; i++) {
    const startT = (i / 16) * 0.4 + 0.2;
    if (progress < startT) continue;
    const localT = easeOut(Math.min(1, (progress - startT) / 0.25));

    const row = Math.floor(i / 8);
    const col = i % 8;
    const x = startX + col * (avatarSize + gapX);
    const y = startY + row * (avatarSize + gapY);

    const curR = (avatarSize / 2) * localT;
    if (curR < 2) continue;

    const u = filledAvatars[i];
    const img = u.avatarUrl ? assets.avatarImages.get(u.avatarUrl) : undefined;
    const ringCol = ringColors[i % ringColors.length];

    drawCircularAvatar(ctx, img, u.login, x, y, curR, ringCol, 4 * localT);
  }

  // Soft bottom gradient fade
  const grad = ctx.createLinearGradient(0, height - 170, 0, height);
  grad.addColorStop(0, isDark ? 'rgba(15,14,16,0)' : 'rgba(237,236,234,0)');
  grad.addColorStop(1, isDark ? 'rgba(15,14,16,1)' : 'rgba(237,236,234,1)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, height - 170, width, 170);
}

// -------------------------------------------------------------
// TEMPLATE 2: TICKER (MARQUEE) - Faithful to Go ticker.go
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
  ctx.fillStyle = isDark ? '#090809' : '#FFFFFF';
  ctx.fillRect(0, 0, width, height);

  // Top-left header: owner avatar + owner / repo
  const headerX = 95;
  const headerY = 95;

  ctx.save();
  drawCircularAvatar(
    ctx,
    assets.ownerImg || undefined,
    data.owner,
    headerX + 45,
    headerY + 45,
    45,
    isDark ? '#342A27' : '#E2E8F0',
    3
  );

  ctx.font = `400 56px 'DM Sans', sans-serif`;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  const ownerPrefix = data.owner ? `${data.owner} / ` : '';
  ctx.fillStyle = isDark ? '#B8AAA3' : '#64748B';
  ctx.fillText(ownerPrefix, headerX + 115, headerY + 45);
  const ownerW = ctx.measureText(ownerPrefix).width;

  ctx.font = `bold 56px 'DM Sans', sans-serif`;
  ctx.fillStyle = isDark ? '#F5EDE7' : '#000000';
  ctx.fillText(data.repo, headerX + 115 + ownerW, headerY + 45);
  ctx.restore();

  // Moderate readable count of avatars (12 to 14) so motion isn't a dizzying blur
  const allStargazers =
    data.stargazers && data.stargazers.length > 0
      ? data.stargazers
      : sampleStargazers;
  const count = Math.min(14, Math.max(6, allStargazers.length));
  const stargazers = allStargazers.slice(0, count);
  while (stargazers.length < count) {
    stargazers.push(allStargazers[stargazers.length % allStargazers.length]);
  }

  const centerX = 800;
  const tickerY = 420;
  const baseAvatarSize = 160;
  const itemGap = 60;
  const itemWidth = baseAvatarSize + itemGap;

  // Exact Go easeOutBack glide
  const easeT = easeOutBack(progress, 1.25);
  const maxScroll = (count - 1) * itemWidth;
  const scrollOffset = easeT * maxScroll;

  for (let i = 0; i < count; i++) {
    const colX = centerX + i * itemWidth - scrollOffset;
    if (colX < -250 || colX > width + 250) continue;

    const dist = Math.abs(colX - centerX);
    const scale = 1.0 + 0.35 * Math.exp(-Math.pow(dist / 320, 2));
    const curSize = baseAvatarSize * scale;
    const r = curSize / 2;

    const u = stargazers[i];
    const img = u.avatarUrl ? assets.avatarImages.get(u.avatarUrl) : undefined;
    const ringCol = isDark ? '#342A27' : '#E2E8F0';

    drawCircularAvatar(ctx, img, u.login, colX, tickerY, r, ringCol, 3);

    // Star directly under avatar
    const starY = tickerY + r + 26;
    drawYellowStar(ctx, colX, starY, 14 * scale);
  }

  // Left & Right edge gradient fades
  const fadeW = 160;
  const leftGrad = ctx.createLinearGradient(0, tickerY, fadeW, tickerY);
  leftGrad.addColorStop(0, isDark ? 'rgba(9,8,9,1)' : 'rgba(255,255,255,1)');
  leftGrad.addColorStop(1, isDark ? 'rgba(9,8,9,0)' : 'rgba(255,255,255,0)');
  ctx.fillStyle = leftGrad;
  ctx.fillRect(0, tickerY - 160, fadeW, 320);

  const rightGrad = ctx.createLinearGradient(width - fadeW, tickerY, width, tickerY);
  rightGrad.addColorStop(0, isDark ? 'rgba(9,8,9,0)' : 'rgba(255,255,255,0)');
  rightGrad.addColorStop(1, isDark ? 'rgba(9,8,9,1)' : 'rgba(255,255,255,1)');
  ctx.fillStyle = rightGrad;
  ctx.fillRect(width - fadeW, tickerY - 160, fadeW, 320);

  // Bottom-right star count (INCREMENTING WITH PHYSICS)
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
  const counterY = 760;

  ctx.font = `bold 130px 'DM Sans', sans-serif`;
  ctx.fillStyle = isDark ? '#F5EDE7' : '#000000';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(numStr, startX, counterY);

  ctx.font = `400 90px 'DM Sans', sans-serif`;
  ctx.fillStyle = isDark ? '#B8AAA3' : '#64748B';
  ctx.fillText(' stars', startX + wNum, counterY + 8);
  ctx.restore();
}

// -------------------------------------------------------------
// TEMPLATE 3: 3D ORBIT - Fast motion + Elastic bounce-back to center
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
  ctx.fillStyle = isDark ? '#0F0E10' : '#FFFFFF';
  ctx.fillRect(0, 0, width, height);

  // Ambient radial glow
  const glow = ctx.createRadialGradient(800, 430, 50, 800, 430, 550);
  if (isDark) {
    glow.addColorStop(0, 'rgba(232, 116, 67, 0.25)');
    glow.addColorStop(0.6, 'rgba(242, 200, 121, 0.08)');
    glow.addColorStop(1, 'rgba(15, 14, 16, 0)');
  } else {
    glow.addColorStop(0, 'rgba(232, 116, 67, 0.16)');
    glow.addColorStop(0.6, 'rgba(242, 200, 121, 0.05)');
    glow.addColorStop(1, 'rgba(255, 255, 255, 0)');
  }
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);

  // Top-left header: owner avatar + owner / repo
  const headerX = 140;
  const headerY = 140;

  ctx.save();
  drawCircularAvatar(
    ctx,
    assets.ownerImg || undefined,
    data.owner,
    headerX,
    headerY,
    48,
    isDark ? '#342A27' : '#E2E8F0',
    4
  );

  ctx.font = `400 52px 'DM Sans', sans-serif`;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  const ownerPrefix = data.owner ? `${data.owner} / ` : '';
  ctx.fillStyle = isDark ? '#B8AAA3' : '#64748B';
  ctx.fillText(ownerPrefix, headerX + 65, headerY);
  const ownerW = ctx.measureText(ownerPrefix).width;

  ctx.font = `bold 52px 'DM Sans', sans-serif`;
  ctx.fillStyle = isDark ? '#F5EDE7' : '#000000';
  ctx.fillText(data.repo, headerX + 65 + ownerW, headerY);
  ctx.restore();

  // 3D Orbit Carousel Physics:
  // Starts fast, avatars sweep across growing big at center and shrinking to edges,
  // then elastically bounces back and locks the final avatar dead-center!
  const allStargazers =
    data.stargazers && data.stargazers.length > 0
      ? data.stargazers
      : sampleStargazers;
  const count = Math.min(16, Math.max(8, allStargazers.length));
  const stargazers = allStargazers.slice(0, count);
  while (stargazers.length < count) {
    stargazers.push(allStargazers[stargazers.length % allStargazers.length]);
  }

  const centerX = 800.0;
  const centerY = 420.0;
  const baseSize = 160.0;
  const spacing = 240.0;

  // Elastic overshoot & bounce-back formula (s = 1.35)
  const easeT = easeOutBack(progress, 1.35);

  const maxScroll = (count - 1) * spacing;
  const scrollOffset = easeT * maxScroll;

  interface OrbitItem {
    idx: number;
    x: number;
    y: number;
    scale: number;
    dist: number;
    login: string;
    avatarUrl: string;
  }

  const items: OrbitItem[] = [];
  for (let i = 0; i < count; i++) {
    const colX = centerX + i * spacing - scrollOffset;
    if (colX < -300 || colX > width + 300) continue;

    const dist = Math.abs(colX - centerX);
    // Parabolic arc trajectory
    const arcY = centerY - 25.0 * Math.cos(((colX - centerX) / 500.0) * (Math.PI / 2));
    // Scale: big near center (1.35), small at edges (0.70)
    const scale = 0.70 + 0.65 * Math.exp(-Math.pow(dist / 340.0, 2));

    items.push({
      idx: i,
      x: colX,
      y: arcY,
      scale,
      dist,
      login: stargazers[i].login,
      avatarUrl: stargazers[i].avatarUrl,
    });
  }

  // Draw background avatars first, foreground/center avatars last (depth z-sorting)
  items.sort((a, b) => b.dist - a.dist);

  for (const item of items) {
    const curSize = baseSize * item.scale;
    const r = curSize / 2;
    const isCenterFocus = item.dist < 150;

    const img = item.avatarUrl ? assets.avatarImages.get(item.avatarUrl) : undefined;
    const ringCol = isCenterFocus ? '#E87443' : isDark ? '#342A27' : '#E2E8F0';
    const ringW = isCenterFocus ? 5 : 3;

    drawCircularAvatar(ctx, img, item.login, item.x, item.y, r, ringCol, ringW);

    // Gold Star badge centered under avatar
    const starY = item.y + curSize / 2 + 26;
    drawYellowStar(ctx, item.x, starY, 14 * item.scale);
  }

  // Bottom-right star count with primary coral accent (#E87443)
  const counterY = 760;
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

  // Coral bold number (#E87443)
  ctx.font = `bold 130px 'DM Sans', sans-serif`;
  ctx.fillStyle = '#E87443';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(numStr, startX, counterY);

  // " stars" label in contrast text
  ctx.font = `400 90px 'DM Sans', sans-serif`;
  ctx.fillStyle = isDark ? '#F5EDE7' : '#000000';
  ctx.fillText(' stars', startX + wNum, counterY + 8);
  ctx.restore();
}

// -------------------------------------------------------------
// TEMPLATE 4: CONSTELLATION - Instant precalculated scatter
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
  ctx.fillStyle = isDark ? '#090809' : '#FFFFFF';
  ctx.fillRect(0, 0, width, height);

  const allStargazers =
    data.stargazers && data.stargazers.length > 0
      ? data.stargazers
      : sampleStargazers;
  const stargazers = allStargazers.slice(0, 96);
  const points = assets.constellationPoints || [];

  // Draw scatter avatars with gentle twinkle / breathing and depth blur
  for (const pt of points) {
    const twinkle = 0.85 + 0.15 * Math.sin(progress * Math.PI * 4 + pt.phase);
    const alpha = Math.min(1, pt.baseAlpha * twinkle);

    ctx.save();
    ctx.globalAlpha = alpha;
    if (pt.blur > 0.3) {
      ctx.filter = `blur(${pt.blur}px)`;
    } else {
      ctx.filter = 'none';
    }

    const u = stargazers[pt.stargazerIndex % stargazers.length] || { login: 'star', avatarUrl: '' };
    const img = u.avatarUrl ? assets.avatarImages.get(u.avatarUrl) : undefined;
    const r = pt.size / 2;

    drawCircularAvatar(
      ctx,
      img,
      u.login,
      pt.x,
      pt.y,
      r,
      isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
      2
    );
    ctx.filter = 'none';
    ctx.restore();
  }

  // Soft Radial Fade Backdrop behind Main Content
  const centerX = 800;
  ctx.save();
  ctx.translate(centerX, 460);
  ctx.scale(1.3, 0.68);
  const fadeGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, 500);
  if (isDark) {
    fadeGrad.addColorStop(0, 'rgba(15, 14, 16, 1)');
    fadeGrad.addColorStop(0.36, 'rgba(15, 14, 16, 1)');
    fadeGrad.addColorStop(0.52, 'rgba(15, 14, 16, 0.92)');
    fadeGrad.addColorStop(0.76, 'rgba(15, 14, 16, 0.45)');
    fadeGrad.addColorStop(1, 'rgba(15, 14, 16, 0)');
  } else {
    fadeGrad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    fadeGrad.addColorStop(0.36, 'rgba(255, 255, 255, 1)');
    fadeGrad.addColorStop(0.52, 'rgba(255, 255, 255, 0.92)');
    fadeGrad.addColorStop(0.76, 'rgba(255, 255, 255, 0.45)');
    fadeGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
  }
  ctx.fillStyle = fadeGrad;
  ctx.beginPath();
  ctx.arc(0, 0, 500, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Center Content: Stacked Mascot (y=350) + Title (y=470) + Star Count (y=570)
  ctx.save();
  // 1. Center mascot avatar (108px)
  drawCircularAvatar(
    ctx,
    assets.ownerImg || undefined,
    data.owner,
    centerX,
    350,
    54,
    isDark ? '#342A27' : '#E2E8F0',
    3
  );

  // 2. Title: owner / repo
  const repoFullName = data.owner ? `${data.owner}/${data.repo}` : data.repo;
  ctx.font = `bold 72px 'DM Sans', sans-serif`;
  ctx.fillStyle = isDark ? '#F5EDE7' : '#000000';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(repoFullName, centerX, 470);

  // 3. Star count with star icon
  const starCountStr = `${data.stars.toLocaleString()} stars`;
  ctx.font = `bold 64px 'DM Sans', sans-serif`;
  const textW = ctx.measureText(starCountStr).width;
  const starRadius = 24;
  const gap = 16;
  const startX = centerX - (textW + starRadius * 2 + gap) / 2;

  drawYellowStar(ctx, startX + starRadius, 570, starRadius);

  ctx.fillStyle = isDark ? '#A39B95' : '#64748B';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(starCountStr, startX + starRadius * 2 + gap, 570);
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
  if (template === 'counter') {
    renderCounter(ctx, data, theme, progress, assets);
  } else if (template === 'ticker') {
    renderTicker(ctx, data, theme, progress, assets);
  } else if (template === 'orbit') {
    renderOrbit(ctx, data, theme, progress, assets);
  } else if (template === 'constellation') {
    renderConstellation(ctx, data, theme, progress, assets);
  }
}
