import React, { useEffect, useRef, useState } from 'react';
import { Download, RefreshCw, RotateCcw, Sun, Moon } from 'lucide-react';
import { CounterCard, TickerCard, OrbitCard, ConstellationCard } from '../templates';
import type { TemplateData, StargazerUser } from '../templates/types';
import { toPng } from 'html-to-image';
import { exportTemplateToVideo } from '@/lib/videoExporter';
import { Separator } from '@/components/ui/separator';
import { FadeIn } from '../helpers/FadeIn';
import { templatesData, initialSampleData, type TemplateMeta } from '@/data/templates';
import sampleStargazers from '@/data/sampleStargazers.json';

type TemplateId = TemplateMeta['id'];

export default function StudioPage() {
  const [token, setToken] = useState('');
  const [repo, setRepo] = useState('CharanMunur/Portfolio');
  const [template, setTemplate] = useState<TemplateId>('counter');
  const [format, setFormat] = useState<'png' | 'mp4'>('png');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const userCustomizedTheme = useRef(false);

  const [repoData, setRepoData] = useState<TemplateData>(initialSampleData);
  const [stargazerOrder, setStargazerOrder] = useState<'latest' | 'earliest'>('latest');
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<{ percent: number; text: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [replayNonce, setReplayNonce] = useState(0);

  // Synchronize initial theme with html class, but respect user manual selection and ignore scroll class mutations
  useEffect(() => {
    let lastDark = document.documentElement.classList.contains('dark');
    setTheme(lastDark ? 'dark' : 'light');

    const observer = new MutationObserver(() => {
      const currentDark = document.documentElement.classList.contains('dark');
      // Only trigger if the actual 'dark' class changed, avoiding Lenis scrolling class updates
      if (currentDark !== lastDark) {
        lastDark = currentDark;
        if (!userCustomizedTheme.current) {
          setTheme(currentDark ? 'dark' : 'light');
        }
      }
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
        if (order === 'latest') {
          const lastPage = Math.max(1, Math.ceil(totalStars / 48));
          const starRes = await fetch(
            `https://api.github.com/repos/${owner}/${repoName}/stargazers?per_page=48&page=${lastPage}`,
            { credentials: 'omit', headers }
          );

          if (starRes.ok) {
            const rawStars = await starRes.json();
            let allStars: any[] = Array.isArray(rawStars) ? rawStars : [];

            // If the last page has fewer than 48 stars and there is a previous page, backfill with previous page
            if (lastPage > 1 && allStars.length < 48) {
              try {
                const prevRes = await fetch(
                  `https://api.github.com/repos/${owner}/${repoName}/stargazers?per_page=48&page=${lastPage - 1}`,
                  { credentials: 'omit', headers }
                );
                if (prevRes.ok) {
                  const prevStars = await prevRes.json();
                  if (Array.isArray(prevStars)) {
                    allStars = [...prevStars, ...allStars];
                  }
                }
              } catch (_) {}
            }

            const list: StargazerUser[] = allStars
              .filter((s: any) => s && (s.avatar_url || s.login))
              .map((s: any) => ({
                login: s.login || 'stargazer',
                avatarUrl: s.avatar_url || '',
              }));

            // reverse() puts the newest stars first; slice up to 48
            fetchedAvatars = list.reverse().slice(0, 48);
          }
        } else {
          // earliest: fetch page 1
          const starRes = await fetch(
            `https://api.github.com/repos/${owner}/${repoName}/stargazers?per_page=48&page=1`,
            { credentials: 'omit', headers }
          );

          if (starRes.ok) {
            const rawStars = await starRes.json();
            if (Array.isArray(rawStars)) {
              fetchedAvatars = rawStars
                .filter((s: any) => s && (s.avatar_url || s.login))
                .map((s: any) => ({
                  login: s.login || 'stargazer',
                  avatarUrl: s.avatar_url || '',
                }))
                .slice(0, 48);
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
    if (token.trim() && repo && repo.includes('/')) {
      fetchGitHubData(repo, token, newOrder);
    } else {
      // Re-order active stargazers immediately in memory
      setRepoData((prev) => ({
        ...prev,
        stargazers: [...(prev.stargazers || sampleStargazers)].reverse(),
      }));
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

  const currentMeta = templatesData.find((t) => t.id === template) || templatesData[0];
  const otherTemplates = templatesData.filter((t) => t.id !== template);

  return (
    <div className="w-full max-w-6xl mx-auto px-6 py-8 space-y-8">
      {/* 1. Header: Breadcrumbs + Title & Badges */}
      <FadeIn delay={0.05} yOffset={10} duration={0.4} className="space-y-3">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-text-base/60">
          <a
            href="/"
            className="px-3 py-1 rounded-full bg-text-base/[0.04] hover:bg-text-base/10 text-text-base/70 hover:text-text-base transition-colors"
          >
            Home
          </a>
          <span className="text-text-base/30">/</span>
          <span className="font-semibold text-text-base px-1.5 py-0.5">{currentMeta.name}</span>
        </nav>

        <div className="pt-1">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-text-base">
            {currentMeta.name}
          </h1>
        </div>
      </FadeIn>

      {/* Main Section: Template Canvas on Left, Controls on Right - Top & Bottom Aligned */}
      <FadeIn delay={0.1} yOffset={15} duration={0.45} className="w-full">
        <div className="flex flex-col lg:flex-row lg:items-stretch items-start gap-6 lg:gap-8">
        {/* Left Column: 16:9 Canvas Stage & Download Action Button */}
        <div className="flex-1 w-full min-w-0 flex flex-col justify-between gap-3.5">
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

          {/* Download Action Button Under Template */}
          <button
            type="button"
            disabled={exporting || loading}
            onClick={handleExport}
            className="w-full py-3.5 px-6 rounded-full bg-text-base text-background font-semibold text-sm sm:text-base flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50 transition-colors shadow-xs"
          >
            {exporting ? (
              <>
                <RefreshCw className="mr-2 h-4.5 w-4.5 animate-spin" />
                <span>
                  {exportProgress
                    ? `${exportProgress.text} (${exportProgress.percent}%)`
                    : 'Exporting...'}
                </span>
              </>
            ) : (
              <>
                <Download className="mr-2 h-4.5 w-4.5" />
                <span>Download {format.toUpperCase()}</span>
              </>
            )}
          </button>
        </div>

        {/* Right Column: Controls - Top and Bottom Aligned with Template Canvas and Download Button */}
        <div className="w-full lg:w-80 shrink-0 flex flex-col justify-between gap-4">
          {/* Repo & Required PAT Form */}
          <form onSubmit={handleFetchSubmit} className="space-y-3.5">
            {/* Repo Input */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-text-base/70 block">
                Repository
              </label>
              <input
                type="text"
                value={repo}
                onChange={(e) => setRepo(e.target.value)}
                required
                className="w-full bg-text-base/[0.04] hover:bg-text-base/[0.06] border border-text-base/10 rounded-full px-4 py-2.5 text-sm text-text-base outline-none focus:border-text-base/30 focus:bg-background transition-colors"
              />
            </div>

            {/* Required GitHub PAT Token */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-text-base/70 block">
                  GitHub PAT <span className="text-xs text-text-base/40 font-normal">(required)</span>
                </label>
                <a
                  href="/how-to"
                  className="text-xs text-text-base/45 hover:text-text-base transition-colors"
                >
                  How to generate?
                </a>
              </div>
              <input
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                required
                className="w-full bg-text-base/[0.04] hover:bg-text-base/[0.06] border border-text-base/10 rounded-full px-4 py-2.5 text-sm text-text-base outline-none focus:border-text-base/30 focus:bg-background transition-colors"
              />
            </div>

            {/* Fetch Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-full bg-text-base text-background hover:bg-text-base/90 text-sm font-semibold transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 shadow-2xs active:scale-[0.99]"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Loading stargazers...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Fetch Stargazers</span>
                </>
              )}
            </button>
          </form>

          {/* Options: Theme, Stargazers, Format */}
          <div className="space-y-3.5">
            {/* Theme Toggle (Segmented Pill) */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-text-base/70 block">
                Theme
              </label>
              <div className="grid grid-cols-2 p-1 rounded-full bg-text-base/[0.04] border border-text-base/8 gap-1">
                {(['dark', 'light'] as const).map((th) => (
                  <button
                    key={th}
                    type="button"
                    onClick={() => {
                      userCustomizedTheme.current = true;
                      setTheme(th);
                    }}
                    className={`flex items-center justify-center gap-2 py-2 px-3 text-sm rounded-full transition-all cursor-pointer ${
                      theme === th
                        ? 'bg-background text-text-base font-semibold shadow-2xs border border-text-base/10'
                        : 'text-text-base/50 hover:text-text-base hover:bg-text-base/[0.02]'
                    }`}
                  >
                    {th === 'dark' ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
                    <span>{th.charAt(0).toUpperCase() + th.slice(1)}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Stargazers Order Toggle (Segmented Pill) */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-text-base/70 block">
                Stargazers
              </label>
              <div className="grid grid-cols-2 p-1 rounded-full bg-text-base/[0.04] border border-text-base/8 gap-1">
                {(['latest', 'earliest'] as const).map((ord) => (
                  <button
                    key={ord}
                    type="button"
                    onClick={() => handleOrderChange(ord)}
                    className={`py-2 px-3 text-sm rounded-full text-center transition-all cursor-pointer ${
                      stargazerOrder === ord
                        ? 'bg-background text-text-base font-semibold shadow-2xs border border-text-base/10'
                        : 'text-text-base/50 hover:text-text-base hover:bg-text-base/[0.02]'
                    }`}
                  >
                    {ord === 'latest' ? 'Latest' : 'Earliest'}
                  </button>
                ))}
              </div>
            </div>

            {/* Format Toggle (Segmented Pill) */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-text-base/70 block">
                Format
              </label>
              <div className="grid grid-cols-2 p-1 rounded-full bg-text-base/[0.04] border border-text-base/8 gap-1">
                {(['png', 'mp4'] as const).map((fmt) => (
                  <button
                    key={fmt}
                    type="button"
                    onClick={() => setFormat(fmt)}
                    className={`py-2 px-3 text-sm rounded-full text-center transition-all cursor-pointer ${
                      format === fmt
                        ? 'bg-background text-text-base font-semibold shadow-2xs border border-text-base/10'
                        : 'text-text-base/50 hover:text-text-base hover:bg-text-base/[0.02]'
                    }`}
                  >
                    {fmt.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs">
                {error}
              </div>
            )}
          </div>
        </div>
      </div>
      </FadeIn>

      <Separator className="bg-text-base/8 my-6" />

      {/* 5. Browse other templates (Small cards, 3 in a row) */}
      <FadeIn delay={0.2} yOffset={15} duration={0.45}>
        <section className="space-y-3 pt-1">
          <h2 className="text-base sm:text-lg font-bold tracking-tight text-text-base">
            Browse other templates
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {otherTemplates.map((other, idx) => (
              <FadeIn key={other.id} delay={0.25 + idx * 0.05} yOffset={15}>
                <button
                  type="button"
                  onClick={() => handleTemplateChange(other.id)}
                  className="group rounded-2xl bg-text-base/[0.025] hover:bg-text-base/[0.06] border border-text-base/8 p-2 text-left flex flex-col justify-between transition-colors duration-150 cursor-pointer shadow-2xs w-full"
                >
                  <div className="w-full aspect-[16/9] rounded-xl overflow-hidden bg-background border border-text-base/8 relative flex items-center justify-center pointer-events-none mb-2">
                    <div className="w-full h-full relative z-10 pointer-events-none">
                      {other.id === 'counter' && <CounterCard data={initialSampleData} theme={theme} animated={false} />}
                      {other.id === 'ticker' && <TickerCard data={initialSampleData} theme={theme} animated={false} />}
                      {other.id === 'orbit' && <OrbitCard data={initialSampleData} theme={theme} animated={false} />}
                      {other.id === 'constellation' && <ConstellationCard data={initialSampleData} theme={theme} animated={false} />}
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-1.5 px-1 py-1">
                    <span className="font-bold text-sm text-text-base">
                      {other.name}
                    </span>
                    <span className="text-[11px] font-semibold text-text-base/60 bg-text-base/5 px-2.5 py-0.5 rounded-full border border-text-base/8">
                      {other.tag}
                    </span>
                  </div>
                </button>
              </FadeIn>
            ))}
          </div>
        </section>
      </FadeIn>
    </div>
  );
}
