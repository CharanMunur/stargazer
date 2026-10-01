import React, { useEffect, useState } from 'react';
import { ArrowUpRight } from '@/components/ui/reicon';
import { FadeIn } from '../helpers/FadeIn';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

const tocSections = [
  {
    id: 'creating-pat',
    title: 'Creating a GitHub PAT',
    items: [
      { id: 'open-token-settings', title: 'Open Token Settings' },
      { id: 'select-classic-token', title: 'Select Classic Token' },
      { id: 'set-note-and-expiration', title: 'Set Note & Expiration' },
      { id: 'select-public-repo-scope', title: 'Select public_repo Scope' },
      { id: 'generate-and-copy-token', title: 'Generate & Copy Token' },
    ],
  },
  {
    id: 'customizing-card',
    title: 'Customizing & Exporting',
    items: [
      { id: 'enter-repo-and-pat', title: 'Enter Repository & Token' },
      { id: 'fetch-stargazers', title: 'Fetch Live Stargazers' },
      { id: 'choose-stargazer-order', title: 'Choose Stargazer Order' },
      { id: 'select-theme-and-template', title: 'Select Theme & Template' },
      { id: 'export-png-or-mp4', title: 'Export PNG or 60fps MP4' },
    ],
  },
  {
    id: 'core-principles',
    title: 'Core Principles',
    items: [],
  },
];

export default function HowToPage() {
  const [activeId, setActiveId] = useState<string>('creating-pat');

  useEffect(() => {
    const allIds: string[] = [];
    for (const section of tocSections) {
      allIds.push(section.id);
      for (const item of section.items) {
        allIds.push(item.id);
      }
    }

    const handleScroll = () => {
      const scrollPosition = window.scrollY + 140;

      for (let i = allIds.length - 1; i >= 0; i--) {
        const id = allIds[i];
        const el = document.getElementById(id);
        if (el && el.offsetTop <= scrollPosition) {
          setActiveId(id);
          return;
        }
      }

      if (allIds[0]) {
        setActiveId(allIds[0]);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
      setActiveId(id);
      history.pushState(null, '', `#${id}`);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-6 py-8">
      {/* Breadcrumb Header */}
      <FadeIn delay={0.05} yOffset={10} duration={0.4} className="mb-8">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/generate">Studio</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>How to Generate PAT</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </FadeIn>

      {/* Main Documentation 2-Column Layout */}
      <div className="flex flex-col lg:flex-row items-start gap-12 xl:gap-20">
        {/* Left Column: Clean Editorial Documentation Body */}
        <article className="flex-1 min-w-0 max-w-3xl space-y-6">
          <FadeIn delay={0.1} yOffset={10} duration={0.4}>
            <header className="space-y-3 pb-2">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground">
                How to Generate
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed font-normal">
                Stargazer turns your GitHub stargazers into living art. Generate high-definition cards and 60fps MP4 loops directly in your browser without backend servers.
              </p>
            </header>

            <p className="text-base text-foreground font-semibold leading-relaxed pt-2">
              Your token stays client-side in memory. It is never stored in persistent storage or transmitted to remote servers.
            </p>

            <p className="text-base text-foreground/80 leading-7 font-normal">
              You know how most GitHub card generators work: they use shared server-side API keys that quickly get rate-limited, fail on repositories with thousands of stars, or store your tokens on third-party databases.
            </p>

            <p className="text-base text-foreground/80 leading-7 font-normal">
              Stargazer solves this by fetching stargazer histories <strong>directly from GitHub's REST API</strong> using your personal token in your browser session.
            </p>
          </FadeIn>

          {/* Section 1: Creating a GitHub Personal Access Token */}
          <section id="creating-pat" className="scroll-mt-24 pt-6 space-y-6">
            <FadeIn delay={0.05} yOffset={15} duration={0.4}>
              <div className="border-b border-border/40 pb-3">
                <h2 className="text-2xl font-bold tracking-tight text-foreground">
                  Creating a GitHub PAT
                </h2>
              </div>

              <p className="text-base text-foreground/80 leading-7 font-normal pt-4">
                GitHub limits unauthenticated API requests to <strong>60 requests per hour</strong>. Creating a Personal Access Token increases your rate limit to <strong>5,000 requests per hour</strong>, allowing Stargazer to stream complete stargazer profiles and avatars in real time.
              </p>
            </FadeIn>

            <div className="space-y-8 pt-2">
              <FadeIn id="open-token-settings" delay={0.05} yOffset={15} duration={0.45} className="scroll-mt-24 space-y-2">
                <div className="flex items-center justify-between gap-4">
                  <h3 className="text-lg font-semibold tracking-tight text-foreground">
                    Open Token Settings
                  </h3>
                  <a
                    href="https://github.com/settings/tokens/new?description=Stargazer&scopes=public_repo"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-foreground bg-muted hover:bg-muted/80 h-9 px-4 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer shadow-2xs shrink-0"
                  >
                    <span>Generate Token</span>
                    <ArrowUpRight className="w-4 h-4 shrink-0" />
                  </a>
                </div>
                <p className="text-base text-foreground/80 leading-7 font-normal">
                  Sign in to your GitHub account, click your profile picture in the top-right corner, and go to <strong>Settings → Developer settings → Personal access tokens → Tokens (classic)</strong>. You can also click the shortcut button on the right to open the pre-filled form.
                </p>
              </FadeIn>

              <FadeIn id="select-classic-token" delay={0.05} yOffset={15} duration={0.45} className="scroll-mt-24 space-y-2">
                <h3 className="text-lg font-semibold tracking-tight text-foreground">
                  Select Classic Token
                </h3>
                <p className="text-base text-foreground/80 leading-7 font-normal">
                  Click <strong>Generate new token</strong> and choose <strong>Generate new token (classic)</strong>. Classic tokens provide clean, simple read access without requiring fine-grained repository selections or organization approvals.
                </p>
              </FadeIn>

              <FadeIn id="set-note-and-expiration" delay={0.05} yOffset={15} duration={0.45} className="scroll-mt-24 space-y-2">
                <h3 className="text-lg font-semibold tracking-tight text-foreground">
                  Set Note & Expiration
                </h3>
                <p className="text-base text-foreground/80 leading-7 font-normal">
                  In the <strong>Note</strong> field, enter an identifiable description such as <code className="px-1.5 py-0.5 rounded-md bg-muted text-sm font-mono text-foreground font-normal">Stargazer</code>. Set an expiration date (e.g. 30 days, 90 days, or No expiration) based on your security preference.
                </p>
              </FadeIn>

              <FadeIn id="select-public-repo-scope" delay={0.05} yOffset={15} duration={0.45} className="scroll-mt-24 space-y-2">
                <h3 className="text-lg font-semibold tracking-tight text-foreground">
                  Select public_repo Scope
                </h3>
                <p className="text-base text-foreground/80 leading-7 font-normal">
                  Under <strong>Select scopes</strong>, check the <code className="px-1.5 py-0.5 rounded-md bg-muted text-sm font-mono text-foreground font-normal">public_repo</code> checkbox. Stargazer only requires public read access to repository stargazers and avatars. No private repository access or write permissions are required.
                </p>
              </FadeIn>

              <FadeIn id="generate-and-copy-token" delay={0.05} yOffset={15} duration={0.45} className="scroll-mt-24 space-y-2">
                <h3 className="text-lg font-semibold tracking-tight text-foreground">
                  Generate & Copy Token
                </h3>
                <p className="text-base text-foreground/80 leading-7 font-normal">
                  Scroll to the bottom of the page and click the green <strong>Generate token</strong> button. Copy the generated token string (starts with <code className="px-1.5 py-0.5 rounded-md bg-muted text-sm font-mono text-foreground font-normal">ghp_</code>) immediately. GitHub will never display it again after you leave the page.
                </p>
              </FadeIn>
            </div>
          </section>

          {/* Section 2: Customizing & Exporting */}
          <section id="customizing-card" className="scroll-mt-24 pt-10 space-y-6">
            <FadeIn delay={0.05} yOffset={15} duration={0.4}>
              <div className="border-b border-border/40 pb-3">
                <h2 className="text-2xl font-bold tracking-tight text-foreground">
                  Customizing & Exporting
                </h2>
              </div>

              <p className="text-base text-foreground/80 leading-7 font-normal pt-4">
                Once you have copied your personal access token, head over to the <strong>Studio</strong> to configure your visual milestone card and render high-resolution assets.
              </p>
            </FadeIn>

            <div className="space-y-8 pt-2">
              <FadeIn id="enter-repo-and-pat" delay={0.05} yOffset={15} duration={0.45} className="scroll-mt-24 space-y-2">
                <h3 className="text-lg font-semibold tracking-tight text-foreground">
                  Enter Repository & Token
                </h3>
                <p className="text-base text-foreground/80 leading-7 font-normal">
                  In the Studio sidebar, enter your target repository in <code className="px-1.5 py-0.5 rounded-md bg-muted text-sm font-mono text-foreground font-normal">owner/repo</code> format (e.g. <code className="px-1.5 py-0.5 rounded-md bg-muted text-sm font-mono text-foreground font-normal">CharanMunur/stargazer</code> or <code className="px-1.5 py-0.5 rounded-md bg-muted text-sm font-mono text-foreground font-normal">facebook/react</code>) and paste your token into the GitHub PAT field.
                </p>
              </FadeIn>

              <FadeIn id="fetch-stargazers" delay={0.05} yOffset={15} duration={0.45} className="scroll-mt-24 space-y-2">
                <h3 className="text-lg font-semibold tracking-tight text-foreground">
                  Fetch Live Stargazers
                </h3>
                <p className="text-base text-foreground/80 leading-7 font-normal">
                  Click the <strong>Fetch Stargazers</strong> button. The generator queries GitHub's REST API and populates the 16:9 canvas with real stargazers, avatars, and star counts.
                </p>
              </FadeIn>

              <FadeIn id="choose-stargazer-order" delay={0.05} yOffset={15} duration={0.45} className="scroll-mt-24 space-y-2">
                <h3 className="text-lg font-semibold tracking-tight text-foreground">
                  Choose Stargazer Order
                </h3>
                <p className="text-base text-foreground/80 leading-7 font-normal">
                  Toggle between <strong>Latest</strong> (to spotlight your most recent supporters) or <strong>Earliest</strong> (to celebrate the original contributors who supported your project from day one).
                </p>
              </FadeIn>

              <FadeIn id="select-theme-and-template" delay={0.05} yOffset={15} duration={0.45} className="scroll-mt-24 space-y-2">
                <h3 className="text-lg font-semibold tracking-tight text-foreground">
                  Select Theme & Template
                </h3>
                <p className="text-base text-foreground/80 leading-7 font-normal">
                  Switch between <strong>Dark</strong> and <strong>Light</strong> color palettes. You can also browse and switch between templates: <strong>Revolve</strong> (orbital rings), <strong>Spotlight</strong> (focused highlight), <strong>Hyperdrive</strong> (warp streaks), <strong>Milestone</strong> (laurel counters), <strong>Infinity</strong> (marquee loop), <strong>Orbit</strong> (3D carousel), or <strong>Constellation</strong> (particle gravity graph).
                </p>
              </FadeIn>

              <FadeIn id="export-png-or-mp4" delay={0.05} yOffset={15} duration={0.45} className="scroll-mt-24 space-y-2">
                <h3 className="text-lg font-semibold tracking-tight text-foreground">
                  Export PNG or 60fps MP4
                </h3>
                <p className="text-base text-foreground/80 leading-7 font-normal">
                  Select <strong>PNG</strong> for crisp static milestone cards (1600 × 900) or <strong>MP4</strong> for buttery smooth 60fps looped videos with celebratory audio. Click <strong>Download</strong> beneath the canvas to render and save directly to your computer.
                </p>
              </FadeIn>
            </div>
          </section>

          {/* Section 3: Core Principles */}
          <FadeIn id="core-principles" delay={0.05} yOffset={15} duration={0.4} className="scroll-mt-24 pt-10 space-y-4">
            <div className="border-b border-border/40 pb-3">
              <h2 className="text-2xl font-bold tracking-tight text-foreground">
                Core Principles
              </h2>
            </div>

            <p className="text-base text-foreground/80 leading-7 font-normal">
              Stargazer is built around the following core design principles:
            </p>

            <ul className="list-disc pl-6 space-y-2.5 text-base text-foreground/80 leading-7 font-normal">
              <li>
                <strong>Client-Side Execution:</strong> All API requests, DOM rasterization, and MP4 muxing run entirely in your web browser. No intermediate servers touch your data.
              </li>
              <li>
                <strong>Ephemeral Storage:</strong> Your GitHub personal access token remains strictly in React memory for the active browser session. It is never written to localStorage or transmitted to third parties.
              </li>
              <li>
                <strong>60fps Native Video:</strong> Videos are rendered frame-by-frame at 60fps with WebCodecs hardware acceleration and multiplexed with mp4-muxer.
              </li>
              <li>
                <strong>Zero Rate-Limit Lockout:</strong> By utilizing your personal access token, you unlock GitHub's 5,000 requests/hr quota instead of the unauthenticated 60 requests/hr pool.
              </li>
            </ul>
          </FadeIn>
        </article>

        {/* Right Column: Clean shadcn-Style "On This Page" Sidebar */}
        <aside className="hidden lg:block w-64 shrink-0 sticky top-24 self-start space-y-6">
          <FadeIn delay={0.15} yOffset={10} duration={0.4}>
            <div className="space-y-3">
              <p className="text-sm font-medium text-foreground">
                On This Page
              </p>

              <nav className="space-y-3 text-sm" aria-label="On this page">
                {tocSections.map((section) => {
                  const isSectionActive = activeId === section.id;

                  return (
                    <div key={section.id} className="space-y-1.5">
                      <a
                        href={`#${section.id}`}
                        onClick={(e) => scrollTo(e, section.id)}
                        className={`block transition-colors cursor-pointer ${
                          isSectionActive
                            ? 'text-foreground font-medium'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {section.title}
                      </a>

                      {section.items.length > 0 && (
                        <ul className="pl-3.5 border-l border-border/40 space-y-1">
                          {section.items.map((item) => {
                            const isItemActive = activeId === item.id;
                            return (
                              <li key={item.id}>
                                <a
                                  href={`#${item.id}`}
                                  onClick={(e) => scrollTo(e, item.id)}
                                  className={`block text-xs py-0.5 transition-colors cursor-pointer ${
                                    isItemActive
                                      ? 'text-foreground font-medium'
                                      : 'text-muted-foreground hover:text-foreground'
                                  }`}
                                >
                                  {item.title}
                                </a>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </nav>
            </div>
          </FadeIn>
        </aside>
      </div>
    </div>
  );
}
