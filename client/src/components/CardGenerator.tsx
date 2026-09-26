import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function CardGenerator() {
  const [token, setToken] = useState('');
  const [repo, setRepo] = useState('charanmunur/portfolio');
  const [template, setTemplate] = useState<'counter' | 'ticker' | 'orbit' | 'constellation'>('counter');
  const [format, setFormat] = useState<'png' | 'gif'>('png');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [showToken, setShowToken] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultFilename, setResultFilename] = useState<string>('stargazer-card.png');
  const [copied, setCopied] = useState(false);

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);

    const trimmedRepo = repo.trim();
    if (!trimmedRepo || !trimmedRepo.includes('/')) {
      setError('Please enter a valid repository in owner/repo format (e.g. charanmunur/portfolio).');
      return;
    }

    if (!token.trim()) {
      setError('GitHub Personal Access Token is required.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('http://localhost:8080/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: token.trim(),
          repo: trimmedRepo,
          template,
          format,
          theme,
        }),
      });

      if (!response.ok) {
        let errorMsg = `Server error (${response.status})`;
        try {
          const errData = await response.json();
          if (errData.error) errorMsg = errData.error;
        } catch {
          // fallback
        }
        throw new Error(errorMsg);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setResultUrl(url);

      const safeRepoName = trimmedRepo.replace('/', '-');
      setResultFilename(`${safeRepoName}-${template}-${theme}.${format}`);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!resultUrl) return;
    navigator.clipboard.writeText(resultUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col lg:flex-row w-full min-h-[calc(100vh-65px)] bg-background text-foreground">
      {/* LEFT SIDEBAR CONTROLS */}
      <aside className="w-full lg:w-[380px] xl:w-[400px] shrink-0 border-r p-6 space-y-6 overflow-y-auto">
        <form onSubmit={handleGenerate} className="space-y-6">
          {/* Header */}
          <div className="border-b pb-3">
            <h2 className="text-base font-bold">Configuration</h2>
          </div>

          {/* Repository */}
          <div className="space-y-2">
            <Label htmlFor="repo-input">Repository</Label>
            <Input
              id="repo-input"
              type="text"
              value={repo}
              onChange={(e) => setRepo(e.target.value)}
              placeholder="owner/repository"
            />
          </div>

          {/* Access Token */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="token-input">GitHub Token</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowToken(!showToken)}
                className="h-auto p-0"
              >
                {showToken ? 'Hide' : 'Show'}
              </Button>
            </div>
            <Input
              id="token-input"
              type={showToken ? 'text' : 'password'}
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxx"
            />
          </div>

          {/* Template */}
          <div className="space-y-2">
            <Label>Template</Label>
            <div className="grid grid-cols-4 gap-1.5">
              <Button
                type="button"
                variant={template === 'counter' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTemplate('counter')}
              >
                Counter
              </Button>
              <Button
                type="button"
                variant={template === 'ticker' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTemplate('ticker')}
              >
                Marquee
              </Button>
              <Button
                type="button"
                variant={template === 'orbit' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTemplate('orbit')}
              >
                3D Orbit
              </Button>
              <Button
                type="button"
                variant={template === 'constellation' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTemplate('constellation')}
              >
                Constellation
              </Button>
            </div>
          </div>

          {/* Background Theme */}
          <div className="space-y-2">
            <Label>Background</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={theme === 'dark' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTheme('dark')}
              >
                Black
              </Button>
              <Button
                type="button"
                variant={theme === 'light' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTheme('light')}
              >
                White
              </Button>
            </div>
          </div>

          {/* Format */}
          <div className="space-y-2">
            <Label>Format</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={format === 'png' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFormat('png')}
              >
                PNG
              </Button>
              <Button
                type="button"
                variant={format === 'gif' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFormat('gif')}
              >
                GIF
              </Button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3.5 rounded-lg bg-destructive/15 border border-destructive text-destructive text-xs font-medium">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={loading}
            size="lg"
            className="w-full font-bold"
          >
            {loading ? 'Generating...' : 'Generate Card'}
          </Button>
        </form>
      </aside>

      {/* RIGHT CANVAS OUTPUT */}
      <main className="flex-1 bg-background flex flex-col justify-between overflow-hidden relative min-h-[500px]">
        {/* Output Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold">Preview</h2>
            {format && <Badge variant="secondary">{format.toUpperCase()}</Badge>}
          </div>

          {resultUrl && (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleCopy}
              >
                {copied ? 'Copied' : 'Copy Link'}
              </Button>

              <a href={resultUrl} download={resultFilename}>
                <Button type="button" variant="default" size="sm">
                  Download {format.toUpperCase()}
                </Button>
              </a>
            </div>
          )}
        </div>

        {/* Center Canvas */}
        <div className="flex-1 p-8 flex items-center justify-center relative overflow-auto">
          {loading ? (
            <Card className="p-8 text-center space-y-2">
              <CardTitle className="text-sm font-semibold animate-pulse">Rendering Stargazer Card...</CardTitle>
              <p className="text-xs text-muted-foreground">Fetching GitHub stargazers & generating frames</p>
            </Card>
          ) : resultUrl ? (
            <Card className="relative group max-w-full max-h-full flex items-center justify-center p-2">
              <CardContent className="p-0">
                <img
                  src={resultUrl}
                  alt="Generated Stargazer Output"
                  className="max-w-full max-h-[calc(100vh-180px)] h-auto rounded-lg object-contain"
                />
              </CardContent>
              <a
                href={resultUrl}
                target="_blank"
                rel="noreferrer"
                className="absolute top-5 right-5 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Button variant="outline" size="sm">
                  Full Screen
                </Button>
              </a>
            </Card>
          ) : (
            <Card className="p-8 text-center space-y-2 max-w-sm">
              <CardHeader className="p-0 space-y-1">
                <CardTitle className="text-sm font-semibold">No Card Generated</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <p className="text-xs text-muted-foreground">
                  Enter your repository and access token, then click <strong>Generate Card</strong>.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
