import type { TemplateData } from '../components/templates/types';
import sampleStargazers from '../data/sampleStargazers.json';

export type TemplateType =
  | 'spotlight'
  | 'revolve'
  | 'milestone'
  | 'infinity'
  | 'orbit'
  | 'constellation'
  | 'hyperdrive'
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

// Inlined SVG laurel leaf path data matching LaurelLeaf.tsx
const LAUREL_SVG_PATH =
  'M3484 12645 c-12 -8 -24 -12 -27 -9 -3 3 -26 -22 -52 -55 -25 -34 ' +
  '-48 -61 -50 -61 -2 0 2 13 7 28 7 17 8 41 3 58 l-8 29 -17 -39 c-14 -30 -16 ' +
  '-45 -8 -68 9 -26 5 -36 -42 -106 -69 -101 -74 -105 -66 -61 6 36 -9 89 -25 89 ' +
  '-4 0 -11 -20 -14 -44 -5 -33 -3 -50 10 -70 17 -25 16 -27 -35 -111 -29 -47 ' +
  '-55 -85 -57 -85 -2 0 -2 24 2 53 4 40 2 60 -12 86 -26 51 -39 49 -47 -8 -6 ' +
  '-48 7 -101 25 -101 5 0 13 -9 19 -19 8 -15 1 -37 -36 -105 -25 -47 -48 -86 ' +
  '-51 -86 -3 0 -3 22 1 48 3 27 3 62 0 79 -6 33 -48 92 -58 82 -4 -3 -9 -35 -12 ' +
  '-70 -6 -63 -6 -65 30 -107 34 -42 35 -45 22 -75 -43 -100 -62 -137 -68 -137 ' +
  '-5 0 -8 27 -8 60 0 69 -16 115 -52 148 l-26 23 -6 -45 c-11 -72 2 -116 47 ' +
  '-163 l40 -42 -41 -110 c-23 -61 -55 -160 -71 -222 -17 -61 -32 -113 -34 -116 ' +
  '-5 -5 -23 40 -37 92 -18 71 -51 116 -108 148 l-53 30 7 -39 c14 -78 44 -161 ' +
  '66 -182 13 -11 41 -28 63 -38 64 -26 63 -25 49 -116 -7 -46 -16 -109 -19 -142 ' +
  '-4 -32 -10 -54 -15 -50 -4 5 -19 41 -34 81 -37 98 -73 145 -137 177 -29 14 ' +
  '-58 26 -65 26 -25 0 51 -202 89 -238 12 -12 51 -31 87 -44 l65 -23 6 -130 c4 ' +
  '-72 12 -157 18 -189 6 -33 9 -61 7 -63 -6 -6 -51 57 -76 106 -35 70 -114 148 ' +
  '-174 169 -59 22 -126 36 -126 26 0 -4 21 -48 48 -98 76 -145 147 -206 245 ' +
  '-206 15 0 43 -6 61 -14 29 -12 35 -21 46 -67 12 -52 41 -134 74 -212 l17 -38 ' +
  '-28 15 c-15 8 -64 44 -108 80 -43 37 -104 79 -135 94 -49 24 -65 27 -158 26 ' +
  '-56 0 -107 -5 -113 -11 -13 -13 138 -155 215 -202 68 -41 115 -48 195 -27 34 ' +
  '9 79 16 99 16 34 0 39 -4 62 -47 31 -59 123 -199 183 -278 25 -32 44 -61 42 ' +
  '-63 -6 -6 -82 46 -133 92 -66 58 -130 101 -194 131 -43 20 -69 25 -139 25 ' +
  '-100 0 -179 -9 -179 -21 0 -4 51 -53 112 -109 181 -161 265 -194 397 -154 66 ' +
  '19 149 21 166 2 19 -19 188 -268 254 -373 32 -49 66 -103 76 -120 19 -29 19 ' +
  '-30 1 -15 -11 8 -50 52 -88 98 -122 146 -212 221 -304 253 -56 20 -298 48 ' +
  '-310 36 -11 -11 164 -237 250 -322 45 -45 103 -92 131 -105 47 -23 60 -25 207 ' +
  '-25 91 0 161 -4 167 -10 33 -35 339 -621 328 -631 -7 -7 -107 117 -162 201 ' +
  '-143 216 -265 312 -445 349 -100 20 -215 31 -207 20 3 -5 40 -65 82 -134 104 ' +
  '-169 153 -237 225 -308 89 -90 128 -105 285 -113 132 -6 197 -18 227 -41 19 ' +
  '-14 122 -264 188 -453 54 -154 110 -338 105 -343 -10 -10 -103 135 -157 243 ' +
  '-161 322 -275 426 -549 504 -136 38 -149 41 -149 31 0 -4 32 -79 71 -166 102 ' +
  '-232 188 -373 275 -458 60 -58 125 -84 265 -105 141 -21 245 -60 259 -96 28 ' +
  '-73 97 -407 125 -600 20 -139 44 -369 39 -374 -11 -12 -96 201 -124 309 -80 ' +
  '312 -180 484 -345 597 -66 44 -304 167 -312 160 -2 -3 15 -87 37 -188 96 -424 ' +
  '184 -609 331 -696 30 -17 104 -48 165 -68 74 -25 133 -52 180 -84 l69 -47 7 ' +
  '-85 c22 -295 -1 -732 -59 -1099 -16 -97 -18 -102 -24 -65 -13 68 -10 223 7 ' +
  '395 14 137 15 185 6 286 -21 220 -52 306 -167 460 -54 72 -222 254 -234 254 ' +
  '-9 0 -59 -360 -72 -515 -16 -191 4 -393 47 -478 33 -66 99 -139 194 -217 101 ' +
  '-82 146 -130 194 -208 l27 -43 -21 -107 c-48 -244 -128 -533 -217 -788 l-38 ' +
  '-109 -3 109 c-2 81 3 142 22 245 36 200 38 221 37 375 0 231 -29 330 -146 505 ' +
  '-75 113 -211 278 -220 269 -5 -5 -78 -344 -100 -463 -22 -118 -31 -412 -16 ' +
  '-486 23 -110 64 -175 182 -292 127 -127 166 -173 204 -245 l28 -52 -48 -123 ' +
  'c-81 -205 -171 -401 -293 -641 -92 -181 -118 -224 -120 -202 -5 45 27 230 54 ' +
  '309 68 197 113 432 114 590 0 176 -74 363 -246 621 -33 50 -55 74 -58 65 -3 ' +
  '-8 -19 -54 -37 -104 -144 -413 -188 -583 -196 -772 -4 -93 -2 -147 7 -180 22 ' +
  '-82 78 -176 171 -289 84 -101 148 -209 164 -276 8 -30 -1 -48 -143 -283 -141 ' +
  '-234 -409 -631 -419 -621 -7 7 27 158 51 226 13 36 46 128 74 205 83 232 123 ' +
  '476 101 614 -20 130 -114 356 -223 536 l-35 59 -11 -29 c-6 -15 -44 -105 -84 ' +
  '-199 -146 -341 -210 -553 -222 -736 -10 -152 24 -252 142 -415 102 -141 115 ' +
  '-164 143 -242 l29 -77 -91 -121 c-154 -204 -372 -469 -555 -674 l-23 -26 6 40 ' +
  'c13 87 60 227 120 360 106 237 157 414 171 596 8 107 -5 184 -58 339 -41 118 ' +
  '-152 360 -165 359 -9 0 -169 -330 -233 -478 -55 -127 -115 -310 -130 -397 -7 ' +
  '-39 -11 -111 -8 -165 6 -119 31 -183 139 -349 62 -97 87 -146 111 -222 l31 ' +
  '-98 -39 -47 c-61 -75 -652 -664 -832 -829 -309 -283 -339 -308 -422 -353 -114 ' +
  '-61 -150 -94 -150 -138 0 -75 117 -232 186 -249 36 -9 83 26 186 138 51 55 ' +
  '127 127 169 159 224 171 764 712 1094 1096 l79 93 40 -7 c103 -15 194 -47 322 ' +
  '-112 173 -87 236 -105 363 -99 119 6 230 41 416 132 122 60 205 108 468 269 ' +
  'l108 66 -48 21 c-80 36 -303 107 -393 126 -121 25 -254 23 -365 -5 -161 -41 ' +
  '-337 -118 -530 -232 -78 -46 -263 -124 -339 -143 -36 -9 -50 -29 159 230 88 ' +
  '110 198 252 245 316 53 74 92 118 103 118 64 1 185 -38 317 -100 216 -103 305 ' +
  '-118 456 -80 194 49 356 134 776 406 59 38 107 72 108 75 0 9 -118 52 -241 88 ' +
  '-300 86 -463 81 -721 -23 -115 -46 -169 -74 -313 -161 -66 -40 -139 -82 -163 ' +
  '-94 -39 -20 -196 -81 -208 -81 -3 0 15 28 40 62 25 35 108 157 183 272 l138 ' +
  '209 120 -6 c88 -4 143 -13 204 -31 47 -14 122 -31 167 -38 181 -26 355 35 639 ' +
  '225 98 65 446 329 441 334 -9 9 -188 34 -306 42 -187 14 -302 2 -427 -45 -164 ' +
  '-60 -308 -143 -518 -296 -44 -32 -133 -86 -199 -120 -101 -51 -118 -57 -105 ' +
  '-37 44 67 196 333 270 472 l84 159 115 -5 c91 -4 137 -12 220 -37 83 -26 129 ' +
  '-33 220 -37 105 -5 122 -3 195 22 165 55 352 171 657 408 109 85 164 133 156 ' +
  '138 -7 4 -62 15 -123 25 -141 23 -436 26 -510 5 -162 -46 -369 -155 -546 -288 ' +
  '-122 -90 -196 -136 -300 -185 l-77 -36 75 154 c41 85 96 205 122 267 l48 112 ' +
  '49 12 c63 16 125 18 320 8 148 -7 166 -6 230 13 167 51 360 212 693 580 l83 ' +
  '92 -113 0 c-184 0 -369 -26 -472 -67 -55 -22 -177 -95 -252 -152 -33 -24 -132 ' +
  '-115 -220 -201 -157 -153 -316 -282 -300 -244 45 112 132 350 174 475 l52 156 ' +
  '57 18 c40 12 114 19 247 25 213 8 272 22 373 86 65 42 230 200 317 304 94 113 ' +
  '297 382 292 387 -7 6 -197 -16 -291 -33 -95 -18 -226 -58 -281 -87 -120 -61 ' +
  '-284 -208 -430 -387 -96 -117 -261 -287 -271 -278 -2 3 7 42 21 89 29 103 66 ' +
  '254 100 419 15 69 32 128 38 132 37 24 177 58 282 68 144 13 191 24 275 63 82 ' +
  '38 222 176 332 327 77 107 293 449 287 454 -6 5 -216 -41 -289 -62 -103 -30 ' +
  '-217 -79 -268 -114 -123 -85 -275 -255 -407 -456 -75 -115 -215 -273 -215 ' +
  '-243 0 10 4 41 10 70 14 75 48 352 56 456 4 50 11 96 17 103 5 6 6 12 1 12 -5 ' +
  '0 -6 74 -3 167 9 261 -1 506 -32 773 -23 209 -25 190 20 242 23 26 78 72 122 ' +
  '103 151 106 198 173 237 335 27 112 39 227 48 440 l7 174 -39 -31 c-65 -52 ' +
  '-209 -204 -247 -260 -64 -95 -110 -261 -127 -458 -14 -168 -41 -325 -51 -299 ' +
  '-4 10 -19 82 -33 159 -15 77 -38 189 -52 248 -26 108 -26 109 -8 145 11 19 63 ' +
  '82 116 139 141 151 168 220 168 437 0 114 -37 474 -50 489 -8 9 -91 -89 -147 ' +
  '-173 -119 -177 -140 -298 -121 -720 9 -188 16 -195 -67 65 -23 72 -58 173 -77 ' +
  '225 l-36 96 28 59 c15 33 53 92 85 130 116 142 140 235 112 446 -16 116 -87 ' +
  '439 -98 439 -10 0 -130 -208 -155 -269 -52 -129 -55 -279 -10 -518 23 -118 40 ' +
  '-263 32 -263 -2 0 -14 26 -27 58 -12 31 -60 140 -107 242 l-84 184 17 56 c9 ' +
  '30 41 93 71 140 29 47 60 105 69 129 19 56 19 171 -1 269 -15 77 -119 400 ' +
  '-133 415 -10 10 -104 -191 -127 -268 -13 -48 -16 -83 -11 -180 6 -116 13 -152 ' +
  '69 -345 14 -47 28 -110 32 -140 l6 -55 -42 78 c-24 43 -86 153 -139 244 -112 ' +
  '192 -110 181 -36 338 40 86 42 94 41 180 -1 69 -7 107 -27 161 -29 84 -149 ' +
  '344 -158 344 -11 0 -59 -142 -76 -224 -14 -69 -14 -92 -4 -155 14 -82 52 -204 ' +
  '84 -266 22 -45 68 -175 61 -175 -2 0 -37 51 -77 113 -40 61 -115 169 -165 240 ' +
  '-51 70 -92 132 -92 138 0 18 29 66 80 133 60 81 74 127 67 228 -5 81 -56 328 ' +
  '-67 328 -8 0 -84 -133 -105 -184 -28 -66 -30 -167 -6 -303 11 -66 21 -138 21 ' +
  '-158 l0 -37 -72 93 c-40 52 -94 121 -120 154 -26 33 -61 81 -77 107 l-30 48 ' +
  '37 37 c21 21 61 57 89 80 39 32 57 56 72 98 20 54 41 218 41 325 l0 54 -66 ' +
  '-64 c-109 -108 -134 -170 -153 -378 -6 -62 -14 -120 -19 -128 -24 -42 -164 ' +
  '315 -176 448 -2 19 -6 40 -10 47 -14 23 -19 295 -7 401 16 138 41 263 55 272 ' +
  '6 4 36 5 68 1 49 -5 62 -2 100 20 24 14 68 51 98 82 l55 57 -65 -7 c-85 -9 ' +
  '-114 -22 -184 -84 -52 -45 -76 -60 -76 -47 0 2 14 50 31 106 37 127 106 302 ' +
  '122 312 7 4 34 8 60 8 46 0 53 4 110 60 l62 60 -38 0 c-47 0 -86 -20 -143 -72 ' +
  '-24 -22 -44 -37 -44 -32 0 5 19 48 42 96 l41 88 61 0 c57 0 64 3 119 46 31 25 ' +
  '57 50 57 55 0 14 -66 11 -103 -5 -18 -7 -52 -30 -75 -50 -24 -20 -45 -36 -47 ' +
  '-36 -2 0 19 41 47 90 l50 90 44 0 c37 0 51 6 82 35 l37 34 -36 1 c-24 0 -49 ' +
  '-10 -79 -32 l-45 -33 23 35 c12 19 37 58 54 87 31 50 33 51 74 50 30 -1 49 4 ' +
  '61 16 16 16 16 17 -16 17 -18 0 -41 -5 -52 -10 -10 -6 -19 -8 -19 -5 0 3 28 ' +
  '44 62 90 54 75 65 85 92 85 17 0 45 9 61 20 l30 20 -30 0 c-17 0 -40 -7 -51 ' +
  '-15z';

// Load laurel leaf with guaranteed correct color for dark/light themes
async function loadLeafImage(theme: 'dark' | 'light'): Promise<HTMLImageElement | null> {
  const fillColor = theme === 'dark' ? '#FFFFFF' : '#000000';
  const svgString =
    `<svg version="1.0" xmlns="http://www.w3.org/2000/svg" width="640" height="1280" viewBox="0 0 640 1280" preserveAspectRatio="xMidYMid meet">` +
    `<g transform="translate(0, 1280) scale(0.1, -0.1)" fill="${fillColor}" stroke="none">` +
    `<path d="${LAUREL_SVG_PATH}" />` +
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

  const targetCount = 100;
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
  if (template === 'counter' || template === 'milestone') {
    avatarUrls = sourceStargazers.slice(0, 16).map((s) => s.avatarUrl).filter(Boolean);
  } else if (template === 'ticker' || template === 'infinity') {
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
    avatarUrls = sourceStargazers.slice(0, 28).map((s) => s.avatarUrl).filter(Boolean);
  }

  const [leafImg, ownerImg, ...loadedAvatars] = await Promise.all([
    (template === 'counter' || template === 'milestone') ? loadLeafImage(theme) : Promise.resolve(null),
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
  const tCount = Math.max(0, Math.min(1, (progress - 0.1) / 0.35));
  const easeCount = easeOut(tCount);
  const countYOffset = 15 * (1 - easeCount);

  const curStars = Math.round(data.stars * easeCount);
  const curForks = Math.round(data.forks * easeCount);
  const curDays = Math.round(data.days * easeCount);

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
    const startT = 0.20 + (i / 16) * 0.35;
    if (progress < startT) continue;
    const localT = easeOut(Math.min(1, (progress - startT) / 0.20));

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
  const baseAvatarRadius = 80;
  const pitch = 220;
  const totalWidth = count * pitch;
  const scrollOffset = (progress * totalWidth) % totalWidth;

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
  const easeCount = easeOut(Math.min(1, progress * 1.5));
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

  // Ambient radial glow matching OrbitCard.tsx (center 800, 430, radius 550)
  const glow = ctx.createRadialGradient(800, 430, 0, 800, 430, 550);
  if (isDark) {
    glow.addColorStop(0, 'rgba(232, 116, 67, 0.22)');
    glow.addColorStop(0.5, 'rgba(242, 200, 121, 0.08)');
    glow.addColorStop(0.75, 'rgba(15, 14, 16, 0)');
  } else {
    glow.addColorStop(0, 'rgba(232, 116, 67, 0.15)');
    glow.addColorStop(0.5, 'rgba(242, 200, 121, 0.05)');
    glow.addColorStop(0.75, 'rgba(255, 255, 255, 0)');
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

  // Elastic overshoot & bounce back
  const pNorm = Math.min(1.0, progress / 0.70);
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

  const allStargazers =
    data.stargazers && data.stargazers.length > 0
      ? data.stargazers
      : sampleStargazers;
  const points = assets.constellationPoints || [];

  // Draw scatter avatars popping in one by one organically
  for (let idx = 0; idx < points.length; idx++) {
    const pt = points[idx];
    const startP = (idx / (points.length || 1)) * 0.65;
    const fadeProgress = Math.max(0, Math.min(1, (progress - startP) / 0.20));
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
  const backdropAlpha = Math.max(0, Math.min(1, progress * 4));

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
  const pMascot = Math.max(0, Math.min(1, (progress - 0.15) / 0.20));
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
  const pTitle = Math.max(0, Math.min(1, (progress - 0.22) / 0.20));
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
  const pCount = Math.max(0, Math.min(1, (progress - 0.28) / 0.25));
  if (pCount > 0) {
    const easeCount = easeOut(pCount);
    ctx.save();
    ctx.globalAlpha = easeCount;
    const countY = 560 + 15 * (1 - easeCount);
    const curStars = Math.round(1 + easeCount * (data.stars - 1));
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
  const tTitle = Math.max(0, Math.min(1, (progress - 0.05) / 0.20));
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
  const tCount = Math.max(0, Math.min(1, (progress - 0.12) / 0.25));
  if (tCount > 0) {
    const easeCount = easeOut(tCount);
    const countScale = 0.9 + 0.1 * easeCount;
    const curStars = Math.round(data.stars * easeCount);
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
    const startP = 0.20 + (i / visible.length) * 0.25;
    const itemProgress = Math.max(0, Math.min(1, (progress - startP) / 0.15));
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
    const pillStartP = 0.45;
    const pillProgress = Math.max(0, Math.min(1, (progress - pillStartP) / 0.15));
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

  const totalCycles = 3.5;
  const allStargazers =
    data.stargazers && data.stargazers.length > 0 ? data.stargazers : sampleStargazers;

  // Draw ring tracks and avatars
  for (let ri = 0; ri < rings.length; ri++) {
    const [count, radius, chipSize, dur, clockwise, offset] = rings[ri];
    const ringAlpha = Math.max(0, Math.min(1, (progress - ri * 0.08) / 0.15));
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
  const pCenter = Math.min(1, progress / 0.20);
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
  const curStars = Math.round(data.stars * easeCenter);
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

  // 1. Background Fill
  ctx.fillStyle = isDark ? '#05070D' : '#F6F9FD';
  ctx.fillRect(0, 0, width, height);

  // 2. Anamorphic Hyperspace Radial Glow
  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 750);
  if (isDark) {
    grad.addColorStop(0, 'rgba(14, 165, 233, 0.25)');
    grad.addColorStop(0.3, 'rgba(99, 102, 241, 0.12)');
    grad.addColorStop(0.55, 'rgba(245, 158, 11, 0.04)');
    grad.addColorStop(0.75, 'transparent');
  } else {
    grad.addColorStop(0, 'rgba(14, 165, 233, 0.18)');
    grad.addColorStop(0.3, 'rgba(99, 102, 241, 0.08)');
    grad.addColorStop(0.7, 'transparent');
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // 3. 64 Anamorphic Laser Warp Beams
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

    const speed = 0.35 + (i % 5) * 0.06;
    const initialProgress = (i * (1 / beamCount)) % 1;
    const p = (initialProgress + progress * speed * 2.8) % 1;

    const baseLength = 160 + (i % 4) * 80;
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
    alpha *= 0.25 + (i % 3) * 0.18;

    const isGold = i % 8 === 0;
    const isWhite = i % 5 === 0 && !isGold;

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = isGold
      ? '#FACC15'
      : isWhite
      ? (isDark ? '#E0F2FE' : '#0369A1')
      : (isDark ? '#38BDF8' : '#0284C7');
    ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
    ctx.lineWidth = isGold ? 2.5 : isWhite ? 2.0 : 1.5;
    ctx.lineCap = 'round';
    ctx.stroke();
  }
  ctx.restore();

  // 4. Relativistic Shockwave Rings (4 Expanding wavefronts)
  ctx.save();
  const ringCount = 4;
  for (let k = 0; k < ringCount; k++) {
    const ringP = (k / ringCount + progress * 0.22 * 2.8) % 1;
    const r = 70 + Math.pow(ringP, 1.6) * 1050;

    let ringAlpha = 0;
    if (ringP < 0.25) {
      ringAlpha = (ringP / 0.25) * 0.26;
    } else {
      ringAlpha = ((1 - ringP) / 0.75) * 0.26;
    }

    if (ringAlpha > 0.01) {
      ctx.beginPath();
      ctx.ellipse(cx, cy, r * 1.08, r * 0.94, 0, 0, Math.PI * 2);
      ctx.strokeStyle = isDark ? '#38BDF8' : '#0284C7';
      ctx.globalAlpha = ringAlpha;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }
  ctx.restore();

  // 5. Stardust specks (High-velocity particles)
  ctx.save();
  for (let s = 0; s < 36; s++) {
    const sAngle = (s / 36) * Math.PI * 2 + ((s * 23) % 9) * 0.08;
    const sSpeed = 0.5 + (s % 4) * 0.1;
    const sP = ((s * 0.0277) + progress * sSpeed * 2.8) % 1;
    const sDist = 60 + Math.pow(sP, 2.2) * 900;

    const px = cx + Math.cos(sAngle) * sDist;
    const py = cy + Math.sin(sAngle) * sDist;

    let sAlpha = 1;
    if (sP < 0.2) sAlpha = sP / 0.2;
    else if (sP > 0.85) sAlpha = (1 - sP) / 0.15;

    ctx.beginPath();
    ctx.arc(px, py, 1.2 + (s % 2) * 1.0, 0, Math.PI * 2);
    ctx.fillStyle = s % 3 === 0 ? '#FACC15' : isDark ? '#BAE6FD' : '#0284C7';
    ctx.globalAlpha = Math.max(0, Math.min(1, sAlpha * 0.6));
    ctx.fill();
  }
  ctx.restore();

  // 6. Contributor Avatars
  const sourceStargazers =
    data.stargazers && data.stargazers.length > 0 ? data.stargazers : sampleStargazers;

  const count = 28;
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + (i % 5) * 0.12;
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);
    const absCos = Math.abs(cosA);
    const absSin = Math.abs(sinA);

    const hudDist = Math.min(
      absCos > 0.0001 ? 310 / absCos : 9999,
      absSin > 0.0001 ? 170 / absSin : 9999
    );
    const startDist = hudDist * 0.35;

    const edgeDist = Math.min(
      absCos > 0.0001 ? 800 / absCos : 9999,
      absSin > 0.0001 ? 450 / absSin : 9999
    );
    const exitDist = edgeDist + 140;

    const speed = 0.22 + (i % 4) * 0.035;
    const initialProgress = (i * (1 / count)) % 1;
    const p = (initialProgress + progress * speed * 2.8) % 1;

    const dist = startDist + (exitDist - startDist) * Math.pow(p, 2.2);
    const posX = cx + cosA * dist;
    const posY = cy + sinA * dist;

    const scaleVal = 0.38 + Math.pow(p, 1.8) * 1.35;
    let alpha = 1;
    if (p < 0.1) {
      alpha = p / 0.1;
    }

    const r = Math.round(37 * scaleVal);
    const user = sourceStargazers[i % sourceStargazers.length];
    const img = user ? assets.avatarImages.get(user.avatarUrl) : undefined;

    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
    drawCircularAvatar(
      ctx,
      img,
      user?.login || 'U',
      posX,
      posY,
      r,
      isDark ? 'rgba(56, 189, 248, 0.55)' : 'rgba(2, 132, 199, 0.4)',
      2
    );
    ctx.restore();
  }

  // 7. Center Aerospace Cockpit Core HUD
  const ease = easeOut(Math.min(1, progress * 2));
  const hudW = 620;
  const hudH = 340;
  const hudX = cx - hudW / 2;
  const hudY = cy - hudH / 2;

  ctx.save();
  ctx.globalAlpha = ease;

  // Background Card
  drawRoundedRect(ctx, hudX, hudY, hudW, hudH, 32);
  ctx.fillStyle = isDark ? 'rgba(8, 14, 25, 0.88)' : 'rgba(255, 255, 255, 0.92)';
  ctx.fill();
  ctx.strokeStyle = isDark ? 'rgba(56, 189, 248, 0.3)' : 'rgba(2, 132, 199, 0.2)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Owner Mascot Avatar
  if (assets.ownerImg) {
    const avSize = 76;
    const avX = cx - avSize / 2;
    const avY = hudY + 28;
    drawRoundedRect(ctx, avX, avY, avSize, avSize, 18);
    ctx.save();
    ctx.clip();
    ctx.drawImage(assets.ownerImg, avX, avY, avSize, avSize);
    ctx.restore();
    drawRoundedRect(ctx, avX, avY, avSize, avSize, 18);
    ctx.strokeStyle = isDark ? 'rgba(56, 189, 248, 0.4)' : 'rgba(2, 132, 199, 0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // Repo Hierarchy Name
  const repoFullName = data.owner ? `${data.owner}/${data.repo}` : data.repo;
  ctx.font = `bold 32px 'DM Sans', sans-serif`;
  ctx.fillStyle = isDark ? '#FFFFFF' : '#0F172A';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(repoFullName, cx, hudY + 135);

  // Big Star Count
  const curStars = Math.round(data.stars * Math.min(1, progress * 3));
  const countStr = curStars.toLocaleString();
  ctx.font = `900 88px 'DM Sans', sans-serif`;
  const countWidth = ctx.measureText(countStr).width;
  const starR = 34;
  const totalStarGroup = starR * 2 + 18 + countWidth;
  const groupStart = cx - totalStarGroup / 2;

  drawYellowStar(ctx, groupStart + starR, hudY + 215, starR);

  ctx.font = `900 88px 'DM Sans', sans-serif`;
  ctx.fillStyle = isDark ? '#FFFFFF' : '#0F172A';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(countStr, groupStart + starR * 2 + 18, hudY + 215);

  // Subtitle
  ctx.font = `bold 12px 'DM Sans', sans-serif`;
  ctx.fillStyle = isDark ? '#38BDF8' : '#0284C7';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('COMMUNITY STARGAZERS', cx, hudY + 295);

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
  } else if (template === 'hyperdrive') {
    renderHyperdrive(ctx, data, theme, progress, assets);
  }
}

