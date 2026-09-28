import type { TemplateData } from '../components/templates/types';
import sampleStargazers from '../data/sampleStargazers.json';

export type TemplateType =
  | 'spotlight'
  | 'revolve'
  | 'milestone'
  | 'infinity'
  | 'orbit'
  | 'constellation'
  // legacy aliases kept for backward compat
  | 'counter'
  | 'ticker';

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

    // Depth calculation: organic depth blur behind main content (up to 5.0px)
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
  if (template === 'counter' || template === 'milestone') {
    avatarUrls = sourceStargazers.slice(0, 16).map((s) => s.avatarUrl).filter(Boolean);
  } else if (template === 'ticker' || template === 'infinity') {
    avatarUrls = sourceStargazers.slice(0, 16).map((s) => s.avatarUrl).filter(Boolean);
  } else if (template === 'revolve') {
    avatarUrls = sourceStargazers.slice(0, 55).map((s) => s.avatarUrl).filter(Boolean);
  } else if (template === 'orbit') {
    avatarUrls = sourceStargazers.slice(0, 16).map((s) => s.avatarUrl).filter(Boolean);
  } else if (template === 'constellation') {
    // Up to 96 avatars for scatter pool
    avatarUrls = sourceStargazers.slice(0, 96).map((s) => s.avatarUrl).filter(Boolean);
  } else if (template === 'spotlight') {
    avatarUrls = sourceStargazers.slice(0, 8).map((s) => s.avatarUrl).filter(Boolean);
  }

  const [leafImg, ownerImg, ...loadedAvatars] = await Promise.all([
    (template === 'counter' || template === 'milestone') ? loadImage('/leaf.svg') : Promise.resolve(null),
    data.ownerAvatarUrl ? loadImage(data.ownerAvatarUrl) : Promise.resolve(null),
    ...avatarUrls.map((u) => loadImage(u, 2000)),
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

  // Continuous infinite marquee loop
  const totalWidth = count * itemWidth;
  const scrollOffset = (progress * totalWidth) % totalWidth;

  for (let i = 0; i < count; i++) {
    let colX = centerX + i * itemWidth - scrollOffset;
    if (colX < centerX - totalWidth / 2) colX += totalWidth;
    if (colX > centerX + totalWidth / 2) colX -= totalWidth;

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

  // Bottom-right star count
  const easeCount = 1 - Math.pow(1 - Math.min(1, progress * 1.5), 3);
  const curStars = Math.round(data.stars * easeCount);
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

  // Continuous 3D orbit loop
  const totalWidth = count * spacing;
  const scrollOffset = (progress * totalWidth) % totalWidth;

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
    let colX = centerX + i * spacing - scrollOffset;
    if (colX < centerX - totalWidth / 2) colX += totalWidth;
    if (colX > centerX + totalWidth / 2) colX -= totalWidth;

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
  ctx.fillStyle = isDark ? '#0F0E10' : '#FFFFFF';
  ctx.fillRect(0, 0, width, height);

  const allStargazers =
    data.stargazers && data.stargazers.length > 0
      ? data.stargazers
      : sampleStargazers;
  const stargazers = allStargazers.slice(0, 96);
  const points = assets.constellationPoints || [];

  // Draw scatter avatars popping in one by one organically with depth blur
  for (let idx = 0; idx < points.length; idx++) {
    const pt = points[idx];
    const startP = (idx / (points.length || 1)) * 0.65;
    const fadeProgress = Math.max(0, Math.min(1, (progress - startP) / 0.20));
    if (fadeProgress <= 0) continue;

    const twinkle = 0.85 + 0.15 * Math.sin(progress * Math.PI * 4 + pt.phase);
    const alpha = Math.min(1, pt.baseAlpha * twinkle * fadeProgress);

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
  const backdropAlpha = Math.max(0, Math.min(1, progress * 4));
  ctx.save();
  ctx.globalAlpha = backdropAlpha;
  ctx.translate(centerX, 460);
  ctx.scale(1.84, 1.0);
  const fadeGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, 500);
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
  ctx.arc(0, 0, 500, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Center Content: Stacked Mascot (y=350) + Title (y=470) + Star Count (y=570)
  // 1. Center mascot avatar (108px)
  const mascotAlpha = Math.max(0, Math.min(1, (progress - 0.10) / 0.25));
  if (mascotAlpha > 0) {
    ctx.save();
    ctx.globalAlpha = mascotAlpha;
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
    ctx.restore();
  }

  // 2. Title: owner / repo
  const titleAlpha = Math.max(0, Math.min(1, (progress - 0.20) / 0.25));
  if (titleAlpha > 0) {
    ctx.save();
    ctx.globalAlpha = titleAlpha;
    const repoFullName = data.owner ? `${data.owner}/${data.repo}` : data.repo;
    ctx.font = `bold 72px 'DM Sans', sans-serif`;
    ctx.fillStyle = isDark ? '#F5EDE7' : '#000000';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(repoFullName, centerX, 470);
    ctx.restore();
  }

  // 3. Animated Star count with star icon
  const countAlpha = Math.max(0, Math.min(1, (progress - 0.30) / 0.25));
  if (countAlpha > 0) {
    ctx.save();
    ctx.globalAlpha = countAlpha;
    const countProgress = Math.max(0, Math.min(1, (progress - 0.15) / 0.65));
    const easeCount = 1 - Math.pow(1 - countProgress, 3);
    const curStars = Math.round(1 + easeCount * (data.stars - 1));
    const starCountStr = `${curStars.toLocaleString()} stars`;

    ctx.font = `bold 64px 'DM Sans', sans-serif`;
    const textW = ctx.measureText(starCountStr).width;
    const starRadius = 24;
    const gap = 16;
    const startX = centerX - (textW + starRadius * 2 + gap) / 2;

    drawYellowStar(ctx, startX + starRadius, 570, starRadius);

    ctx.fillStyle = isDark ? 'rgba(245, 237, 231, 0.65)' : '#64748B';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(starCountStr, startX + starRadius * 2 + gap, 570);
    ctx.restore();
  }
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  if (ctx.roundRect) {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
  } else {
    ctx.beginPath();
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
  const ease = easeOut(progress);

  // Background
  ctx.fillStyle = isDark ? '#0F0E10' : '#FFFFFF';
  ctx.fillRect(0, 0, width, height);

  // Radial ambient spotlight
  ctx.save();
  const grad = ctx.createRadialGradient(800, 420, 0, 800, 420, 600);
  if (isDark) {
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.04)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
  } else {
    grad.addColorStop(0, 'rgba(0, 0, 0, 0.025)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();



  // Center Title
  const repoFullName = data.owner ? `${data.owner}/${data.repo}` : data.repo;
  ctx.save();
  ctx.globalAlpha = ease;
  ctx.font = `bold 76px 'DM Sans', sans-serif`;
  ctx.fillStyle = isDark ? '#F5EDE7' : '#050505';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(repoFullName, 800, 320);

  // Big Stargazer Count
  const curStars = Math.round(data.stars * ease);
  const countStr = curStars.toLocaleString();
  ctx.font = `bold 120px 'DM Sans', sans-serif`;
  const countW = ctx.measureText(countStr).width;
  ctx.font = `500 44px 'DM Sans', sans-serif`;
  const labelW = ctx.measureText('stargazers').width;
  const totalGroupW = 75 + countW + 20 + labelW;
  const startX = 800 - totalGroupW / 2;

  // Star
  drawYellowStar(ctx, startX + 35, 470, 36);

  // Number
  ctx.font = `bold 120px 'DM Sans', sans-serif`;
  ctx.fillStyle = isDark ? '#F5EDE7' : '#050505';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(countStr, startX + 85, 465);

  // "stargazers"
  ctx.font = `500 44px 'DM Sans', sans-serif`;
  ctx.fillStyle = isDark ? '#A1958D' : '#64748B';
  ctx.fillText('stargazers', startX + 85 + countW + 20, 485);
  ctx.restore();

  // Bottom Avatar Stack (8 avatars)
  const allStargazers = data.stargazers && data.stargazers.length > 0 ? data.stargazers : sampleStargazers;
  const visible = allStargazers.slice(0, 8);
  const remaining = Math.max(0, data.stars - visible.length);

  ctx.save();
  ctx.globalAlpha = ease;
  const avatarR = 34; // 68px diameter
  const overlap = 22;
  const stackW = (visible.length - 1) * (avatarR * 2 - overlap) + avatarR * 2;
  const stackStartX = remaining > 0 ? 800 - (stackW + 160) / 2 + avatarR : 800 - stackW / 2 + avatarR;
  const stackY = 740;

  for (let i = 0; i < visible.length; i++) {
    const u = visible[i];
    const img = u.avatarUrl ? assets.avatarImages.get(u.avatarUrl) : undefined;
    const ax = stackStartX + i * (avatarR * 2 - overlap);
    const startP = 0.30 + (i / visible.length) * 0.35;
    const itemProgress = Math.max(0, Math.min(1, (progress - startP) / 0.15));
    if (itemProgress <= 0) continue;

    const itemScale = 0.6 + 0.4 * (1 - Math.pow(1 - itemProgress, 3));
    ctx.save();
    ctx.globalAlpha = itemProgress;
    ctx.translate(ax, stackY);
    ctx.scale(itemScale, itemScale);
    drawCircularAvatar(
      ctx,
      img,
      u.login,
      0,
      0,
      avatarR,
      isDark ? '#1C1B1F' : '#FFFFFF',
      4
    );
    ctx.restore();
  }

  if (remaining > 0) {
    const pillStartP = 0.65;
    const pillProgress = Math.max(0, Math.min(1, (progress - pillStartP) / 0.15));
    if (pillProgress > 0) {
      ctx.save();
      ctx.globalAlpha = pillProgress;
      const pillX = stackStartX + visible.length * (avatarR * 2 - overlap) + 15;
      const pillW = 160;
      const pillH = 46;
      drawRoundedRect(ctx, pillX, stackY - pillH / 2, pillW, pillH, 23);
      ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';
      ctx.fill();
      ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.1)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.font = `600 15px 'DM Sans', sans-serif`;
      ctx.fillStyle = isDark ? '#A1958D' : '#64748B';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`+${remaining.toLocaleString()} others`, pillX + pillW / 2, stackY);
      ctx.restore();
    }
  }
  ctx.restore();
}


// ─── Revolve Template ──────────────────────────────────────────────────────────
function renderRevolve(
  ctx: CanvasRenderingContext2D,
  data: TemplateData,
  theme: 'dark' | 'light',
  progress: number,
  assets: PreloadedAssets
) {
  const W = 1600, H = 900;
  const isDark = theme === 'dark';
  const CX = 800, CY = 450;

  // Background
  ctx.fillStyle = isDark ? '#0D0C12' : '#F5F4F1';
  ctx.fillRect(0, 0, W, H);

  // Radial glow
  const grd = ctx.createRadialGradient(CX, CY, 0, CX, CY, 480);
  if (isDark) {
    grd.addColorStop(0,   'rgba(168,85,247,0.28)');
    grd.addColorStop(0.28,'rgba(139,92,246,0.12)');
    grd.addColorStop(1,   'rgba(13,12,18,0)');
  } else {
    grd.addColorStop(0,   'rgba(192,132,252,0.30)');
    grd.addColorStop(0.32,'rgba(221,214,254,0.14)');
    grd.addColorStop(1,   'rgba(245,244,241,0)');
  }
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, W, H);

  // Ring definitions: [count, radius, chipSize, durationSec, clockwise, angleOffsetDeg→rad]
  const rings: [number, number, number, number, boolean, number][] = [
    [5,  310, 70, 26, true,  45   * Math.PI / 180],
    [8,  440, 74, 40, false, 0],
    [11, 570, 78, 56, true,  30   * Math.PI / 180],
    [14, 700, 82, 72, false, 60   * Math.PI / 180],
    [17, 830, 86, 90, true,  22.5 * Math.PI / 180],
  ];

  const totalCycles = 3.5; // matches videoExporter default durationSeconds

  const allStargazers = data.stargazers && data.stargazers.length > 0 ? data.stargazers : sampleStargazers;
  let cursor = 0;

  // Draw ring tracks and avatars per ring (staggered fade-in: ring 0 first, then ring 1, 2, 3, 4)
  for (let ri = 0; ri < rings.length; ri++) {
    const [count, radius, chipSize, dur, clockwise, offset] = rings[ri];
    const ringAlpha = Math.max(0, Math.min(1, (progress - ri * 0.12) / 0.18));
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
    const speed = (totalCycles / dur) * Math.PI * 2;
    const dirSign = clockwise ? 1 : -1;

    for (let i = 0; i < avatars.length; i++) {
      const u = avatars[i];
      const angle = offset + (i / count) * Math.PI * 2 + dirSign * progress * speed;
      const ax = CX + Math.cos(angle) * radius;
      const ay = CY + Math.sin(angle) * radius;
      const half = chipSize / 2;
      const r = chipSize * 0.28;

      ctx.save();

      // Chip background
      ctx.beginPath();
      ctx.moveTo(ax - half + r, ay - half);
      ctx.lineTo(ax + half - r, ay - half);
      ctx.quadraticCurveTo(ax + half, ay - half, ax + half, ay - half + r);
      ctx.lineTo(ax + half, ay + half - r);
      ctx.quadraticCurveTo(ax + half, ay + half, ax + half - r, ay + half);
      ctx.lineTo(ax - half + r, ay + half);
      ctx.quadraticCurveTo(ax - half, ay + half, ax - half, ay + half - r);
      ctx.lineTo(ax - half, ay - half + r);
      ctx.quadraticCurveTo(ax - half, ay - half, ax - half + r, ay - half);
      ctx.closePath();
      ctx.fillStyle = isDark ? 'rgba(22,20,30,0.95)' : 'rgba(255,255,255,0.97)';
      ctx.fill();
      ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.13)' : 'rgba(0,0,0,0.08)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Avatar image or initial
      const img = u.avatarUrl ? assets.avatarImages.get(u.avatarUrl) : undefined;
      const pad = 4;
      const inner = chipSize - pad * 2;
      const ix = ax - half + pad;
      const iy = ay - half + pad;
      const ir = inner * 0.22;

      if (img) {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(ix + ir, iy);
        ctx.lineTo(ix + inner - ir, iy);
        ctx.quadraticCurveTo(ix + inner, iy, ix + inner, iy + ir);
        ctx.lineTo(ix + inner, iy + inner - ir);
        ctx.quadraticCurveTo(ix + inner, iy + inner, ix + inner - ir, iy + inner);
        ctx.lineTo(ix + ir, iy + inner);
        ctx.quadraticCurveTo(ix, iy + inner, ix, iy + inner - ir);
        ctx.lineTo(ix, iy + ir);
        ctx.quadraticCurveTo(ix, iy, ix + ir, iy);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(img, ix, iy, inner, inner);
        ctx.restore();
      } else {
        const initial = (u.login || '?').charAt(0).toUpperCase();
        ctx.font = `700 ${inner * 0.42}px 'DM Sans', sans-serif`;
        ctx.fillStyle = isDark ? '#E2E8F0' : '#475569';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(initial, ax, ay);
      }
      ctx.restore();
    }
    ctx.restore();
  }

  // ── Center Hub ──────────────────────────────────────────────────────
  const ease = Math.min(1, progress * 5);

  // Center halo
  const halo = ctx.createRadialGradient(CX, CY, 0, CX, CY, 110);
  halo.addColorStop(0, isDark ? 'rgba(168,85,247,0.35)' : 'rgba(192,132,252,0.32)');
  halo.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.save();
  ctx.globalAlpha = ease;
  ctx.fillStyle = halo;
  ctx.fillRect(CX - 110, CY - 110, 220, 220);
  ctx.restore();

  // Owner avatar: 160×160 centered
  const avatarSz = 160;
  const avatarHalf = avatarSz / 2;
  const avatarR = 36;
  // Layout: avatar center at CY - 230, repo name at CY - 60, star row at CY + 80
  // Total content height ≈ 160 + 24 + 56 + 18 + 110 = 368px → top at CY-184, bottom at CY+184
  const avatarY = CY - 205;

  ctx.save();
  ctx.globalAlpha = ease;
  ctx.beginPath();
  ctx.moveTo(CX - avatarHalf + avatarR, avatarY - avatarHalf);
  ctx.lineTo(CX + avatarHalf - avatarR, avatarY - avatarHalf);
  ctx.quadraticCurveTo(CX + avatarHalf, avatarY - avatarHalf, CX + avatarHalf, avatarY - avatarHalf + avatarR);
  ctx.lineTo(CX + avatarHalf, avatarY + avatarHalf - avatarR);
  ctx.quadraticCurveTo(CX + avatarHalf, avatarY + avatarHalf, CX + avatarHalf - avatarR, avatarY + avatarHalf);
  ctx.lineTo(CX - avatarHalf + avatarR, avatarY + avatarHalf);
  ctx.quadraticCurveTo(CX - avatarHalf, avatarY + avatarHalf, CX - avatarHalf, avatarY + avatarHalf - avatarR);
  ctx.lineTo(CX - avatarHalf, avatarY - avatarHalf + avatarR);
  ctx.quadraticCurveTo(CX - avatarHalf, avatarY - avatarHalf, CX - avatarHalf + avatarR, avatarY - avatarHalf);
  ctx.closePath();
  ctx.fillStyle = isDark ? 'rgba(255,255,255,0.09)' : '#FFFFFF';
  ctx.fill();
  ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.09)';
  ctx.lineWidth = 2;
  ctx.stroke();

  if (assets.ownerImg) {
    ctx.save();
    const ix = CX - avatarHalf;
    const iy = avatarY - avatarHalf;
    const inner = avatarSz;
    const ir = avatarR;
    ctx.beginPath();
    ctx.moveTo(ix + ir, iy);
    ctx.lineTo(ix + inner - ir, iy);
    ctx.quadraticCurveTo(ix + inner, iy, ix + inner, iy + ir);
    ctx.lineTo(ix + inner, iy + inner - ir);
    ctx.quadraticCurveTo(ix + inner, iy + inner, ix + inner - ir, iy + inner);
    ctx.lineTo(ix + ir, iy + inner);
    ctx.quadraticCurveTo(ix, iy + inner, ix, iy + inner - ir);
    ctx.lineTo(ix, iy + ir);
    ctx.quadraticCurveTo(ix, iy, ix + ir, iy);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(assets.ownerImg, ix, iy, inner, inner);
    ctx.restore();
  }
  ctx.restore();

  // Repo full name — 46px bold
  const repoFullName = data.owner ? `${data.owner}/${data.repo}` : data.repo;
  ctx.save();
  ctx.globalAlpha = ease;
  ctx.font = `800 46px 'DM Sans', sans-serif`;
  ctx.fillStyle = isDark ? '#F5EDE7' : '#0F0E10';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(repoFullName, CX, CY - 50);
  ctx.restore();

  // Star count row — 100px
  const curStars = Math.round(data.stars * Math.min(1, progress * 4));
  const countStr = curStars.toLocaleString();
  ctx.save();
  ctx.globalAlpha = ease;

  ctx.font = `900 100px 'DM Sans', sans-serif`;
  const countW = ctx.measureText(countStr).width;
  const starSz = 76;
  const labelFont = 28;
  const gap = 16;

  ctx.font = `500 ${labelFont}px 'DM Sans', sans-serif`;
  const labelW = ctx.measureText('stars').width;

  const totalW = starSz + gap + countW + gap + labelW;
  const startX = CX - totalW / 2;
  const rowY = CY + 85;

  // Star icon
  drawYellowStar(ctx, startX + starSz / 2, rowY, starSz / 2);

  // Count
  ctx.font = `900 100px 'DM Sans', sans-serif`;
  ctx.fillStyle = isDark ? '#F5EDE7' : '#0F0E10';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(countStr, startX + starSz + gap, rowY - 2);

  // "stars" label
  ctx.font = `500 ${labelFont}px 'DM Sans', sans-serif`;
  ctx.fillStyle = isDark ? '#A1958D' : '#64748B';
  ctx.textBaseline = 'bottom';
  ctx.fillText('stars', startX + starSz + gap + countW + gap, rowY + 50);
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
  if (template === 'counter' || template === 'milestone') {
    renderCounter(ctx, data, theme, progress, assets);
  } else if (template === 'ticker' || template === 'infinity') {
    renderTicker(ctx, data, theme, progress, assets);
  } else if (template === 'revolve') {
    renderRevolve(ctx, data, theme, progress, assets);
  } else if (template === 'orbit') {
    renderOrbit(ctx, data, theme, progress, assets);
  } else if (template === 'constellation') {
    renderConstellation(ctx, data, theme, progress, assets);
  } else if (template === 'spotlight') {
    renderSpotlight(ctx, data, theme, progress, assets);
  }
}
