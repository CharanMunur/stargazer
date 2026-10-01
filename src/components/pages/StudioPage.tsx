import React, { useEffect, useRef, useState } from 'react';
import { Download, RefreshCw, RotateCcw, Sun, Moon } from 'lucide-react';
import {
  MilestoneCard,
  InfinityCard,
  OrbitCard,
  ConstellationCard,
  SpotlightCard,
  RevolveCard,
  HyperdriveCard,
  BlackholeCard,
} from '../templates';
import type { TemplateData, StargazerUser } from '../templates/types';
import { exportTemplateToVideo, exportTemplateToImage, getDefaultDurationForTemplate } from '@/lib/videoExporter';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { FadeIn } from '../helpers/FadeIn';
import { Badge } from '@/components/ui/badge';
import { templatesData, initialSampleData, type TemplateMeta } from '@/data/templates';
import sampleStargazers from '@/data/sampleStargazers.json';

type TemplateId = TemplateMeta['id'];

export default function StudioPage() {
  const [token, setToken] = useState('');
  const [repo, setRepo] = useState('CharanMunur/Portfolio');
  const [template, setTemplate] = useState<TemplateId>('spotlight');
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
      const qTemplate = (params.get('template') || params.get('generate')) as TemplateId;
      if (templatesData.some((t) => t.id === qTemplate)) {
        setTemplate(qTemplate);
        // Auto-switch to MP4 if the template doesn't support PNG
        const meta = templatesData.find((t) => t.id === qTemplate);
        if (meta && !meta.hasImage) {
          setFormat('mp4');
        }
      }
    }
  }, []);

  const handleTemplateChange = (newTemplate: TemplateId) => {
    setTemplate(newTemplate);
    // Auto-switch to MP4 if the new template doesn't support PNG
    const meta = templatesData.find((t) => t.id === newTemplate);
    if (meta && !meta.hasImage) {
      setFormat('mp4');
    }
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('template', newTemplate);
      url.searchParams.delete('generate');
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
        setExportProgress({ percent: 30, text: 'Rendering 1600x900 image...' });
        const dataUrl = await exportTemplateToImage({
          template,
          data: repoData,
          theme,
          width: 1600,
          height: 900,
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
          durationSeconds: getDefaultDurationForTemplate(template),
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
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{currentMeta.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="pt-1 flex items-baseline gap-3">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
            {currentMeta.name}
          </h1>
          <span className="text-sm sm:text-base text-muted-foreground font-medium">
            by{" "}
            <a
              href={currentMeta.url}
              target="_blank"
              rel="noreferrer"
              className="hover:underline text-foreground font-semibold transition-colors"
            >
              {currentMeta.by}
            </a>
          </span>
        </div>
      </FadeIn>

      {/* Main Section: Template Canvas on Left, Controls on Right - Top & Bottom Aligned */}
      <FadeIn delay={0.1} yOffset={15} duration={0.45} className="w-full">
        <div className="flex flex-col lg:flex-row lg:items-stretch items-start gap-6 lg:gap-8">
        {/* Left Column: 16:9 Canvas Stage & Download Action Button */}
        <div className="flex-1 w-full min-w-0 flex flex-col justify-between gap-3.5">
          {/* Central Canvas Stage */}
          <div className="w-full aspect-[16/9] rounded-2xl border border-border bg-card shadow-xs overflow-hidden relative flex items-center justify-center">
            {/* Subtle grid texture background */}
            <div
              className="absolute inset-0 pointer-events-none opacity-40"
              style={{
                backgroundImage:
                  'linear-gradient(to right, var(--border) 1px, transparent 1px), linear-gradient(to bottom, var(--border) 1px, transparent 1px)',
                backgroundSize: '20px 20px',
              }}
            />

            {/* Replay action badge */}
            <button
              type="button"
              onClick={() => setReplayNonce((n) => n + 1)}
              className="absolute top-4 right-4 z-20 h-8.5 px-3.5 rounded-full bg-background/80 backdrop-blur-md hover:bg-background text-muted-foreground hover:text-foreground text-xs font-medium border border-border/80 transition-colors shadow-2xs cursor-pointer flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0"
              title="Replay animation"
            >
              <RotateCcw className="w-3.5 h-3.5 shrink-0" />
              <span>Replay</span>
            </button>

            {/* Live Canvas */}
            <div ref={cardContainerRef} className="w-full aspect-[16/9] relative z-10">
              {template === 'milestone' && (
                <MilestoneCard
                  key={`card-milestone-${theme}-${repoData.repo}-${replayNonce}`}
                  data={repoData}
                  theme={theme}
                  animated
                />
              )}
              {template === 'infinity' && (
                <InfinityCard
                  key={`card-infinity-${theme}-${repoData.repo}-${replayNonce}`}
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
              {template === 'spotlight' && (
                <SpotlightCard
                  key={`card-spotlight-${theme}-${repoData.repo}-${replayNonce}`}
                  data={repoData}
                  theme={theme}
                  animated
                />
              )}
              {template === 'revolve' && (
                <RevolveCard
                  key={`card-revolve-${theme}-${repoData.repo}-${replayNonce}`}
                  data={repoData}
                  theme={theme}
                  animated
                />
              )}
              {template === 'hyperdrive' && (
                <HyperdriveCard
                  key={`card-hyperdrive-${theme}-${repoData.repo}-${replayNonce}`}
                  data={repoData}
                  theme={theme}
                  animated
                />
              )}
              {template === 'blackhole' && (
                <BlackholeCard
                  key={`card-blackhole-${theme}-${repoData.repo}-${replayNonce}`}
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
            className="w-full h-12 py-3 px-6 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold text-sm sm:text-base flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50 transition-all shadow-2xs active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0"
          >
            {exporting ? (
              <>
                <RefreshCw className="mr-2 h-4.5 w-4.5 animate-spin shrink-0" />
                <span>
                  {exportProgress
                    ? `${exportProgress.text} (${exportProgress.percent}%)`
                    : 'Exporting...'}
                </span>
              </>
            ) : (
              <>
                <Download className="mr-2 h-4.5 w-4.5 shrink-0" />
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
              <label className="text-sm font-medium text-foreground block">
                Repository
              </label>
              <input
                type="text"
                value={repo}
                onChange={(e) => setRepo(e.target.value)}
                required
                className="w-full h-11 bg-muted/40 hover:bg-muted/60 border border-border hover:border-border/80 focus:border-ring rounded-full px-4.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:bg-background transition-all shadow-2xs"
              />
            </div>

            {/* Required GitHub PAT Token */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground block">
                  GitHub PAT <span className="text-xs text-muted-foreground font-normal">(required)</span>
                </label>
                <a
                  href="/how-to"
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors underline-offset-4 hover:underline"
                >
                  How to generate?
                </a>
              </div>
              <input
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                required
                className="w-full h-11 bg-muted/40 hover:bg-muted/60 border border-border hover:border-border/80 focus:border-ring rounded-full px-4.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:bg-background transition-all shadow-2xs"
              />
            </div>

            {/* Fetch Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 px-5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-semibold transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 shadow-2xs active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
                  <span>Loading stargazers...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 shrink-0" />
                  <span>Fetch Stargazers</span>
                </>
              )}
            </button>
          </form>

          {/* Options: Theme, Stargazers, Format */}
          <div className="space-y-3.5 min-w-0">
            {/* Theme Toggle (Segmented Pill) */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground block">
                Theme
              </label>
              <Tabs
                value={theme}
                onValueChange={(val) => {
                  userCustomizedTheme.current = true;
                  setTheme(val as 'dark' | 'light');
                }}
              >
                <TabsList>
                  <TabsTrigger value="dark" className="flex items-center justify-center gap-1.5 sm:gap-2">
                    <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                    <span className="truncate">Dark</span>
                  </TabsTrigger>
                  <TabsTrigger value="light" className="flex items-center justify-center gap-1.5 sm:gap-2">
                    <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                    <span className="truncate">Light</span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Stargazers Order Toggle (Segmented Pill) */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground block">
                Stargazers
              </label>
              <Tabs
                value={stargazerOrder}
                onValueChange={(val) => handleOrderChange(val as 'latest' | 'earliest')}
              >
                <TabsList>
                  <TabsTrigger value="latest">Latest</TabsTrigger>
                  <TabsTrigger value="earliest">Earliest</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Format Toggle (Segmented Pill) */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground block">
                Format
              </label>
              <Tabs
                value={format}
                onValueChange={(val) => setFormat(val as 'png' | 'mp4')}
              >
                <TabsList>
                  <TabsTrigger
                    value="png"
                    disabled={!currentMeta.hasImage}
                    title={!currentMeta.hasImage ? 'This template is animation-only (MP4)' : undefined}
                  >
                    PNG
                  </TabsTrigger>
                  <TabsTrigger value="mp4">
                    MP4
                  </TabsTrigger>
                </TabsList>
              </Tabs>
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

      <Separator className="bg-border my-6" />

      {/* 5. Browse other templates (Small cards, 3 in a row) */}
      <FadeIn delay={0.2} yOffset={15} duration={0.45}>
        <section className="space-y-3 pt-1">
          <h2 className="text-base sm:text-lg font-bold tracking-tight text-foreground">
            Browse other templates
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {otherTemplates.map((other, idx) => (
              <FadeIn key={other.id} delay={0.25 + idx * 0.05} yOffset={15}>
                <BrowseTemplateCard
                  template={other}
                  theme={theme}
                  onClick={() => handleTemplateChange(other.id)}
                />
              </FadeIn>
            ))}
          </div>
        </section>
      </FadeIn>
    </div>
  );
}

function BrowseTemplateCard({
  template,
  theme,
  onClick,
}: {
  template: (typeof templatesData)[number];
  theme: 'dark' | 'light';
  onClick: () => void;
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group rounded-3xl bg-card hover:bg-muted/40 border border-border/80 hover:border-border p-2.5 text-left flex flex-col justify-between transition-colors duration-200 cursor-pointer shadow-2xs hover:shadow-xs w-full text-card-foreground"
    >
      <div className="w-full aspect-[16/9] rounded-2xl overflow-hidden bg-background border border-border/70 relative flex items-center justify-center pointer-events-none mb-2 isolate">
        {template.isNew && (
          <div className="absolute top-2.5 right-2.5 z-20">
            <Badge variant="orange">
              NEW
            </Badge>
          </div>
        )}
        <div className="w-full h-full relative z-10 pointer-events-none">
          {template.id === 'spotlight' && <SpotlightCard data={initialSampleData} theme={theme} animated={isHovered} />}
          {template.id === 'revolve' && <RevolveCard data={initialSampleData} theme={theme} animated={isHovered} />}
          {template.id === 'milestone' && <MilestoneCard data={initialSampleData} theme={theme} animated={isHovered} />}
          {template.id === 'infinity' && <InfinityCard data={initialSampleData} theme={theme} animated={isHovered} />}
          {template.id === 'orbit' && <OrbitCard data={initialSampleData} theme={theme} animated={isHovered} />}
          {template.id === 'constellation' && <ConstellationCard data={initialSampleData} theme={theme} animated={isHovered} />}
          {template.id === 'hyperdrive' && <HyperdriveCard data={initialSampleData} theme={theme} animated={isHovered} />}
          {template.id === 'blackhole' && <BlackholeCard data={initialSampleData} theme={theme} animated={isHovered} />}
        </div>
      </div>
      <div className="flex items-baseline justify-between gap-1.5 px-1 py-1 min-w-0">
        <span className="font-bold text-sm text-foreground shrink-0">
          {template.name}
        </span>
        <span className="text-xs text-muted-foreground font-medium truncate">
          by {template.by}
        </span>
      </div>
    </button>
  );
}

