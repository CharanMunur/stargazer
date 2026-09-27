import React, { useEffect, useRef, useState } from 'react';
import { Download, RefreshCw, RotateCcw } from 'lucide-react';
import { CounterCard, TickerCard, OrbitCard, ConstellationCard } from './templates';
import type { TemplateData, StargazerUser } from './templates/types';
import { toPng } from 'html-to-image';
import { exportTemplateToVideo } from '@/lib/videoExporter';
import sampleStargazers from './templates/sampleStargazers.json';
import { Separator } from '@/components/ui/separator';

const initialSampleData: TemplateData = {
  owner: 'CharanMunur',
  repo: 'Portfolio',
  stars: 106,
  forks: 22,
  days: 131,
  ownerAvatarUrl: 'https://avatars.githubusercontent.com/u/105436608?v=4',
  stargazers: sampleStargazers,
};

const templatesMeta = [
  {
    id: 'counter',
    name: 'Counter',
    tag: 'Milestone',
    description: 'Symmetrical laurel milestone card with dynamic metric counters and 16-contributor grid.',
  },
  {
    id: 'ticker',
    name: 'Ticker',
    tag: 'Marquee Loop',
    description: 'Continuous horizontal glide marquee with momentum physics and contributor star badges.',
  },
  {
    id: 'orbit',
    name: '3D Orbit',
    tag: '3D WebGL',
    description: 'Multi-ring 3D spherical orbits rotating contributor avatars around your repository core.',
  },
  {
    id: 'constellation',
    name: 'Constellation',
    tag: 'Particle Graph',
    description: 'Dynamic gravity nodes and glowing constellation lines connecting community stargazers.',
  },
] as const;

type TemplateId = (typeof templatesMeta)[number]['id'];

export default function CardGenerator() {
  const [token, setToken] = useState('');
  const [repo, setRepo] = useState('CharanMunur/Portfolio');
  const [template, setTemplate] = useState<TemplateId>('counter');
  const [format, setFormat] = useState<'png' | 'mp4'>('png');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  const [repoData, setRepoData] = useState<TemplateData>(initialSampleData);
  const [stargazerOrder, setStargazerOrder] = useState<'latest' | 'earliest'>('latest');
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<{ percent: number; text: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [replayNonce, setReplayNonce] = useState(0);

  // Synchronize theme with html class
  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setTheme(isDark ? 'dark' : 'light');
    const observer = new MutationObserver(() => {
      const dark = document.documentElement.classList.contains('dark');
      setTheme(dark ? 'dark' : 'light');
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  // Sync template from URL query param if present
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const qTemplate = (params.get('generate') || params.get('template')) as TemplateId;
      if (['counter', 'ticker', 'orbit', 'constellation'].includes(qTemplate)) {
        setTemplate(qTemplate);
      }
      const savedToken = localStorage.getItem('stargazer-github-token');
      if (savedToken) setToken(savedToken);
    }
  }, []);

  const handleTemplateChange = (newTemplate: TemplateId) => {
    setTemplate(newTemplate);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('generate', newTemplate);
      window.history.replaceState({}, '', url.toString());
    }
  };

  const cardContainerRef = useRef<HTMLDivElement>(null);

  const fetchGitHubData = async (
    targetRepo: string,
    userToken?: string,
    order: 'latest' | 'earliest' = stargazerOrder
  ) => {
    const trimmed = targetRepo.trim();
    if (!trimmed || !trimmed.includes('/')) {
      setError('Please provide a valid repository in owner/repo format (e.g. CharanMunur/stargazer).');
      return;
    }

    const tokenToUse = (userToken || token).trim();
    if (!tokenToUse) {
      setError('A GitHub Personal Access Token (PAT) is required to view and load repository stargazers.');
      return;
    }

    const [owner, repoName] = trimmed.split('/');
    setLoading(true);
    setError(null);

    const authHeader = tokenToUse.startsWith('Bearer ') || tokenToUse.startsWith('token ')
      ? tokenToUse
      : `Bearer ${tokenToUse}`;

    const headers: Record<string, string> = {
      Accept: 'application/vnd.github.v3+json',
      Authorization: authHeader,
    };

    try {
      const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repoName}`, { headers });
      if (!repoRes.ok) {
        if (repoRes.status === 403 || repoRes.status === 429) {
          throw new Error('GitHub API rate limit exceeded. Provide a personal access token.');
        }
        if (repoRes.status === 404) {
          throw new Error(`Repository "${owner}/${repoName}" not found.`);
        }
        throw new Error(`Failed to fetch repository metadata (HTTP ${repoRes.status}).`);
      }
      const repoInfo = await repoRes.json();

      const createdAt = new Date(repoInfo.created_at);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - createdAt.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      const totalStars = repoInfo.stargazers_count || 0;
      let fetchedAvatars: StargazerUser[] = [];

      if (totalStars > 0) {
        let pageToFetch = 1;
        if (order === 'latest') {
          pageToFetch = Math.max(1, Math.ceil(totalStars / 48));
        }

        const starRes = await fetch(
          `https://api.github.com/repos/${owner}/${repoName}/stargazers?per_page=48&page=${pageToFetch}`,
          { credentials: 'omit', headers }
        );

        if (starRes.ok) {
          const rawStars = await starRes.json();
          if (Array.isArray(rawStars)) {
            const list: StargazerUser[] = rawStars
              .filter((s: any) => s && (s.avatar_url || s.login))
              .map((s: any) => ({
                login: s.login || 'stargazer',
                avatarUrl: s.avatar_url || '',
              }));

            if (order === 'latest') {
              fetchedAvatars = list.reverse();
            } else {
              fetchedAvatars = list;
            }
          }
        }
      }

      if (fetchedAvatars.length === 0) {
        fetchedAvatars = sampleStargazers;
      }

      setRepoData({
        owner: repoInfo.owner?.login || owner,
        repo: repoInfo.name || repoName,
        stars: totalStars,
        forks: repoInfo.forks_count || 0,
        days: diffDays,
        ownerAvatarUrl: repoInfo.owner?.avatar_url || '',
        stargazers: fetchedAvatars,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to fetch repository data.');
    } finally {
      setLoading(false);
    }
  };

  const handleOrderChange = (newOrder: 'latest' | 'earliest') => {
    setStargazerOrder(newOrder);
    if (repo && repo.includes('/')) {
      fetchGitHubData(repo, token, newOrder);
    }
  };

  const handleFetchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    fetchGitHubData(repo, token, stargazerOrder);
  };

  const handleExport = async () => {
    if (!cardContainerRef.current) return;
    setError(null);
    setExporting(true);

    const safeFilename = `${(repoData.repo || 'stargazer')}-${template}-${theme}`;

    try {
      if (format === 'png') {
        const dataUrl = await toPng(cardContainerRef.current, {
          width: 1600,
          height: 900,
          pixelRatio: 1,
        });

        const link = document.createElement('a');
        link.download = `${safeFilename}.png`;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        const { blob, filename } = await exportTemplateToVideo({
          template,
          data: repoData,
          theme,
          durationSeconds: 3.5,
          fps: 30,
          width: 1600,
          height: 900,
          onProgress: (p, text) => {
            setExportProgress({ percent: Math.round(p * 100), text });
          },
        });

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = filename;
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setTimeout(() => URL.revokeObjectURL(url), 15000);
      }
    } catch (err: any) {
      setError(`Export failed: ${err.message || err}`);
    } finally {
      setExporting(false);
      setExportProgress(null);
    }
  };

  const currentMeta = templatesMeta.find((t) => t.id === template) || templatesMeta[0];
  const otherTemplates = templatesMeta.filter((t) => t.id !== template);

  return (
    <div className="w-full max-w-6xl mx-auto px-6 py-8 space-y-8">
      {/* 1. Header: Breadcrumbs + Title & Badges */}
      <div className="space-y-3">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-text-base/60">
          <a
            href="/"
            className="px-2.5 py-1 rounded-full bg-text-base/[0.04] hover:bg-text-base/10 text-text-base/70 hover:text-text-base transition-colors"
          >
            Home
          </a>
          <span className="text-text-base/30">/</span>
          <span className="font-semibold text-text-base px-2 py-0.5">{currentMeta.name}</span>
        </nav>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-text-base">
            {currentMeta.name}
          </h1>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-3 py-1 rounded-full bg-text-base/[0.04] text-text-base/70 text-xs font-medium border border-text-base/8">
              {currentMeta.tag}
            </span>
            <span className="px-3 py-1 rounded-full bg-text-base/[0.04] text-text-base/70 text-xs font-medium border border-text-base/8">
              1600 × 900
            </span>
            <span className="px-3 py-1 rounded-full bg-text-base/[0.04] text-text-base/70 text-xs font-medium border border-text-base/8">
              60fps MP4
            </span>
          </div>
        </div>
      </div>

      {/* Main Section: Template Canvas on Left, Controls on Right - Exactly Top-Aligned */}
      <div className="flex flex-col lg:flex-row items-start gap-8 lg:gap-10">
        {/* Left Column: 16:9 Canvas Stage */}
        <div className="flex-1 w-full min-w-0">
          {/* Central Canvas Stage with REDUCED shadow */}
          <div className="w-full aspect-[16/9] rounded-2xl border border-text-base/10 bg-text-base/[0.015] shadow-xs overflow-hidden relative flex items-center justify-center">
            {/* Subtle grid texture background */}
            <div
              className="absolute inset-0 pointer-events-none opacity-40"
              style={{
                backgroundImage:
                  'linear-gradient(to right, var(--border-muted) 1px, transparent 1px), linear-gradient(to bottom, var(--border-muted) 1px, transparent 1px)',
                backgroundSize: '20px 20px',
              }}
            />

            {/* Replay action badge */}
            <button
              type="button"
              onClick={() => setReplayNonce((n) => n + 1)}
              className="absolute top-4 right-4 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-background/80 backdrop-blur-md hover:bg-background text-text-base/70 hover:text-text-base text-xs font-medium border border-text-base/10 transition-colors shadow-2xs cursor-pointer"
              title="Replay animation"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Replay</span>
            </button>

            {/* Live Canvas */}
            <div ref={cardContainerRef} className="w-full aspect-[16/9] relative z-10">
              {template === 'counter' && (
                <CounterCard
                  key={`card-counter-${theme}-${repoData.repo}-${replayNonce}`}
                  data={repoData}
                  theme={theme}
                  animated
                />
              )}
              {template === 'ticker' && (
                <TickerCard
                  key={`card-ticker-${theme}-${repoData.repo}-${replayNonce}`}
                  data={repoData}
                  theme={theme}
                  animated
                />
              )}
              {template === 'orbit' && (
                <OrbitCard
                  key={`card-orbit-${theme}-${repoData.repo}-${replayNonce}`}
                  data={repoData}
                  theme={theme}
                  animated
                />
              )}
              {template === 'constellation' && (
                <ConstellationCard
                  key={`card-constellation-${theme}-${repoData.repo}-${replayNonce}`}
                  data={repoData}
                  theme={theme}
                  animated
                />
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Controls - Exactly Top-Aligned with the Canvas Stage */}
        <div className="w-full lg:w-72 shrink-0 space-y-4">
          {/* Repo & Required PAT Form */}
          <form onSubmit={handleFetchSubmit} className="space-y-3.5">
            {/* Repo Input */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-text-base/50 block">
                Repository
              </label>
              <input
                type="text"
                value={repo}
                onChange={(e) => setRepo(e.target.value)}
                placeholder="owner/repo"
                required
                className="w-full bg-text-base/[0.04] border border-text-base/10 rounded-full px-4 py-2 text-xs text-text-base outline-none focus:border-text-base/30 transition-colors placeholder:text-text-base/35"
              />
            </div>

            {/* Required GitHub PAT Token */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-text-base/50 block">
                  GitHub PAT <span className="text-text-base/35 lowercase font-normal">(required)</span>
                </label>
                <a
                  href="https://github.com/settings/tokens/new?description=Stargazer&scopes=public_repo"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[10px] text-text-base/40 hover:text-text-base transition-colors"
                >
                  Generate ↗
                </a>
              </div>
              <input
                type="password"
                value={token}
                onChange={(e) => {
                  setToken(e.target.value);
                  if (typeof window !== 'undefined') {
                    localStorage.setItem('stargazer-github-token', e.target.value);
                  }
                }}
                placeholder="ghp_... or github_pat_..."
                required
                className="w-full bg-text-base/[0.04] border border-text-base/10 rounded-full px-4 py-2 text-xs text-text-base outline-none focus:border-text-base/30 transition-colors placeholder:text-text-base/35"
              />
            </div>

            {/* Fetch Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-3 rounded-full bg-text-base/10 hover:bg-text-base/15 text-text-base text-xs font-medium transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  <span>Loading stargazers...</span>
                </>
              ) : (
                <span>Fetch Stargazers</span>
              )}
            </button>
          </form>

          {/* Theme Toggle (no bg) */}
          <div className="space-y-1.5 pt-1">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-text-base/50 block">
              Theme
            </label>
            <div className="flex items-center gap-1">
              {(['dark', 'light'] as const).map((th) => (
                <button
                  key={th}
                  type="button"
                  onClick={() => setTheme(th)}
                  className={`py-1 px-2.5 text-xs font-medium transition-colors cursor-pointer ${
                    theme === th
                      ? 'text-text-base font-semibold border-b-2 border-text-base'
                      : 'text-text-base/40 hover:text-text-base'
                  }`}
                >
                  {th.charAt(0).toUpperCase() + th.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Stargazers Order Toggle (no bg) */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-text-base/50 block">
              Stargazers
            </label>
            <div className="flex items-center gap-1">
              {(['latest', 'earliest'] as const).map((ord) => (
                <button
                  key={ord}
                  type="button"
                  onClick={() => handleOrderChange(ord)}
                  className={`py-1 px-2.5 text-xs font-medium transition-colors cursor-pointer ${
                    stargazerOrder === ord
                      ? 'text-text-base font-semibold border-b-2 border-text-base'
                      : 'text-text-base/40 hover:text-text-base'
                  }`}
                >
                  {ord === 'latest' ? 'Latest' : 'Earliest'}
                </button>
              ))}
            </div>
          </div>

          {/* Format Toggle (no bg) */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-text-base/50 block">
              Format
            </label>
            <div className="flex items-center gap-1">
              {(['png', 'mp4'] as const).map((fmt) => (
                <button
                  key={fmt}
                  type="button"
                  onClick={() => setFormat(fmt)}
                  className={`py-1 px-2.5 text-xs font-medium transition-colors cursor-pointer ${
                    format === fmt
                      ? 'text-text-base font-semibold border-b-2 border-text-base'
                      : 'text-text-base/40 hover:text-text-base'
                  }`}
                >
                  {fmt.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Download Action Button */}
          <div className="pt-2">
            <button
              type="button"
              disabled={exporting || loading}
              onClick={handleExport}
              className="w-full py-2.5 px-4 rounded-xl bg-text-base text-background font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-colors shadow-2xs"
            >
              {exporting ? (
                <>
                  <RefreshCw className="mr-2 h-3.5 w-3.5 animate-spin" />
                  <span>
                    {exportProgress
                      ? `${exportProgress.text} (${exportProgress.percent}%)`
                      : 'Exporting...'}
                  </span>
                </>
              ) : (
                <>
                  <Download className="mr-2 h-3.5 w-3.5" />
                  <span>Download {format.toUpperCase()}</span>
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs">
              {error}
            </div>
          )}
        </div>
      </div>

      <Separator className="bg-text-base/8 my-8" />

      {/* 5. Browse other templates (Small cards, 3 in a row) */}
      <section className="space-y-4 pt-2">
        <h2 className="text-lg font-bold tracking-tight text-text-base">
          Browse other templates
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {otherTemplates.map((other) => (
            <button
              key={other.id}
              type="button"
              onClick={() => handleTemplateChange(other.id)}
              className="group rounded-2xl bg-text-base/[0.025] hover:bg-text-base/[0.06] border border-text-base/8 p-2.5 text-left flex flex-col justify-between transition-colors duration-150 cursor-pointer shadow-2xs"
            >
              <div className="w-full aspect-[16/9] rounded-xl overflow-hidden bg-background border border-text-base/8 relative flex items-center justify-center pointer-events-none mb-2.5">
                <div className="w-full h-full relative z-10 pointer-events-none">
                  {other.id === 'counter' && <CounterCard data={initialSampleData} theme={theme} animated={false} />}
                  {other.id === 'ticker' && <TickerCard data={initialSampleData} theme={theme} animated={false} />}
                  {other.id === 'orbit' && <OrbitCard data={initialSampleData} theme={theme} animated={false} />}
                  {other.id === 'constellation' && <ConstellationCard data={initialSampleData} theme={theme} animated={false} />}
                </div>
              </div>
              <div className="flex items-center justify-between gap-1.5 px-1 pb-1">
                <span className="font-semibold text-xs text-text-base">
                  {other.name}
                </span>
                <span className="text-[10px] font-medium text-text-base/50 bg-text-base/5 px-2 py-0.5 rounded-full border border-text-base/5">
                  {other.tag}
                </span>
              </div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
