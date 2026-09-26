import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Download, RefreshCw, RotateCcw } from 'lucide-react';
import { CounterCard, TickerCard, OrbitCard, ConstellationCard } from './templates';
import type { TemplateData, StargazerUser } from './templates/types';
import { toPng } from 'html-to-image';
import { exportTemplateToVideo } from '@/lib/videoExporter';
import sampleStargazers from './templates/sampleStargazers.json';

const initialSampleData: TemplateData = {
  owner: 'CharanMunur',
  repo: 'Portfolio',
  stars: 106,
  forks: 22,
  days: 131,
  ownerAvatarUrl: 'https://avatars.githubusercontent.com/u/105436608?v=4',
  stargazers: sampleStargazers,
};

export default function CardGenerator() {
  const [token, setToken] = useState('');
  const [repo, setRepo] = useState('CharanMunur/Portfolio');
  const [template, setTemplate] = useState<'counter' | 'ticker' | 'orbit' | 'constellation'>('counter');
  const [format, setFormat] = useState<'png' | 'mp4'>('png');
  const [theme, setTheme] = useState<'dark' | 'light'>('light');
  const [showToken, setShowToken] = useState(false);

  const [repoData, setRepoData] = useState<TemplateData>(initialSampleData);
  const [stargazerOrder, setStargazerOrder] = useState<'latest' | 'earliest'>('latest');
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<{ percent: number; text: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Synchronize theme with html class on initial mount
  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setTheme(isDark ? 'dark' : 'light');
  }, []);

  // Sync template from URL query param if present (?generate=ticker or ?template=ticker)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const qTemplate = params.get('generate') || params.get('template');
      if (qTemplate === 'counter' || qTemplate === 'ticker' || qTemplate === 'orbit' || qTemplate === 'constellation') {
        setTemplate(qTemplate);
      }
    }
  }, []);

  const handleTemplateChange = (newTemplate: 'counter' | 'ticker' | 'orbit' | 'constellation') => {
    setTemplate(newTemplate);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('generate', newTemplate);
      window.history.replaceState({}, '', url.toString());
    }
  };

  // Hidden full-size container reference for high-res exports
  const cardContainerRef = useRef<HTMLDivElement>(null);

  // Fetch real GitHub stats with latest/earliest ordering
  const fetchGitHubData = async (
    targetRepo: string,
    userToken?: string,
    order: 'latest' | 'earliest' = stargazerOrder
  ) => {
    const trimmed = targetRepo.trim();
    if (!trimmed || !trimmed.includes('/')) {
      setError('Please provide a valid repository in owner/repo format.');
      return;
    }

    const [owner, repoName] = trimmed.split('/');
    setLoading(true);
    setError(null);

    const headers: Record<string, string> = {
      Accept: 'application/vnd.github.v3+json',
    };
    if (userToken?.trim()) {
      headers.Authorization = `token ${userToken.trim()}`;
    }

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
        ownerAvatarUrl: repoInfo.owner?.avatar_url || 'https://github.com/github.png',
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

  return (
    <div className="flex flex-col lg:flex-row w-full h-full overflow-hidden bg-background text-foreground">
      {/* Left Sidebar Controls */}
      <aside className="w-full lg:w-80 shrink-0 h-full border-r overflow-y-auto p-6 space-y-6">
        <form onSubmit={handleFetchSubmit} className="space-y-6">
          <div className="space-y-1">
            <h2 className="text-base font-semibold tracking-tight">Studio</h2>
            <p className="text-xs text-muted-foreground">
              Configure parameters and export community cards.
            </p>
          </div>

          <Separator />

          {/* Repository Input */}
          <div className="space-y-2">
            <Label htmlFor="repo-input">Repository</Label>
            <div className="flex gap-2">
              <Input
                id="repo-input"
                type="text"
                value={repo}
                onChange={(e) => setRepo(e.target.value)}
                placeholder="owner/repo"
              />
              <Button
                type="submit"
                variant="secondary"
                disabled={loading}
                className="shrink-0"
              >
                {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Fetch'}
              </Button>
            </div>
          </div>

          {/* Access Token (Optional) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="token-input">
                Token <span className="text-muted-foreground font-normal text-xs">(optional)</span>
              </Label>
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {showToken ? 'Hide' : 'Show'}
              </button>
            </div>
            <Input
              id="token-input"
              type={showToken ? 'text' : 'password'}
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="ghp_xxxxxxxxxxxx"
            />
          </div>

          <Separator />

          {/* Stargazers Source Filter */}
          <div className="space-y-2">
            <Label>Community filter</Label>
            <ToggleGroup
              type="single"
              value={stargazerOrder}
              onValueChange={(val) => {
                if (val) handleOrderChange(val as 'latest' | 'earliest');
              }}
              variant="outline"
              className="w-full grid grid-cols-2"
            >
              <ToggleGroupItem value="latest">Latest</ToggleGroupItem>
              <ToggleGroupItem value="earliest">Earliest</ToggleGroupItem>
            </ToggleGroup>
          </div>

          <Separator />

          {/* Template Selection */}
          <div className="space-y-2">
            <Label>Template</Label>
            <ToggleGroup
              type="single"
              value={template}
              onValueChange={(val) => {
                if (val) handleTemplateChange(val as any);
              }}
              variant="outline"
              className="w-full grid grid-cols-2"
            >
              <ToggleGroupItem value="counter">Counter</ToggleGroupItem>
              <ToggleGroupItem value="ticker">Ticker</ToggleGroupItem>
              <ToggleGroupItem value="orbit">3D Orbit</ToggleGroupItem>
              <ToggleGroupItem value="constellation">Constellation</ToggleGroupItem>
            </ToggleGroup>
          </div>

          <Separator />

          {/* Theme Selection */}
          <div className="space-y-2">
            <Label>Card theme</Label>
            <ToggleGroup
              type="single"
              value={theme}
              onValueChange={(val) => {
                if (val) setTheme(val as 'dark' | 'light');
              }}
              variant="outline"
              className="w-full grid grid-cols-2"
            >
              <ToggleGroupItem value="dark">Dark</ToggleGroupItem>
              <ToggleGroupItem value="light">Light</ToggleGroupItem>
            </ToggleGroup>
          </div>

          <Separator />

          {/* Output Format */}
          <div className="space-y-2">
            <Label>Format</Label>
            <ToggleGroup
              type="single"
              value={format}
              onValueChange={(val) => {
                if (val) setFormat(val as 'png' | 'mp4');
              }}
              variant="outline"
              className="w-full grid grid-cols-2"
            >
              <ToggleGroupItem value="png">PNG</ToggleGroupItem>
              <ToggleGroupItem value="mp4">MP4</ToggleGroupItem>
            </ToggleGroup>
          </div>

          {error && (
            <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-xs">
              {error}
            </div>
          )}

          <Separator />

          {/* Single Primary Call to Action */}
          <div className="pt-2">
            <Button
              type="button"
              disabled={exporting || loading}
              onClick={handleExport}
              className="w-full"
            >
              {exporting ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  <span>
                    {exportProgress
                      ? `${exportProgress.text} (${exportProgress.percent}%)`
                      : 'Exporting...'}
                  </span>
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  <span>Download {format.toUpperCase()}</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </aside>

      {/* Right Canvas Preview */}
      <main className="flex-1 h-full bg-background flex flex-col justify-between overflow-hidden">
        {/* Top Preview Bar */}
        <div className="px-6 py-3 border-b flex items-center justify-between shrink-0">
          <span className="text-sm font-medium">Preview</span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setRepoData({ ...repoData })}
          >
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
            <span>Replay</span>
          </Button>
        </div>

        {/* Center Canvas Area */}
        <div className="flex-1 p-6 md:p-8 flex items-center justify-center bg-muted/20 overflow-hidden">
          <div className="w-full max-w-[min(100%,calc((100vh-12rem)*16/9))] aspect-[16/9] rounded-lg border overflow-hidden bg-background shadow-sm flex items-center justify-center">
            <div ref={cardContainerRef} className="w-full aspect-[16/9] relative">
              {template === 'counter' && (
                <CounterCard
                  key={`card-counter-${theme}-${repoData.repo}`}
                  data={repoData}
                  theme={theme}
                  animated
                />
              )}
              {template === 'ticker' && (
                <TickerCard
                  key={`card-ticker-${theme}-${repoData.repo}`}
                  data={repoData}
                  theme={theme}
                  animated
                />
              )}
              {template === 'orbit' && (
                <OrbitCard
                  key={`card-orbit-${theme}-${repoData.repo}`}
                  data={repoData}
                  theme={theme}
                  animated
                />
              )}
              {template === 'constellation' && (
                <ConstellationCard
                  key={`card-constellation-${theme}-${repoData.repo}`}
                  data={repoData}
                  theme={theme}
                  animated
                />
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
