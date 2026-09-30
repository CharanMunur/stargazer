import React, { useEffect, useState } from 'react';
import { FadeIn } from '../helpers/FadeIn';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

const privacySections = [
  { id: 'overview', title: 'Overview & Architecture' },
  { id: 'token-handling', title: 'GitHub Token Security' },
  { id: 'local-storage', title: 'Local Browser Storage' },
  { id: 'third-party-api', title: 'Third-Party Services' },
  { id: 'data-rights', title: 'Data Rights (GDPR & CCPA)' },
  { id: 'security-audit', title: 'Security & Auditability' },
  { id: 'policy-updates', title: 'Amendments & Inquiries' },
];

export default function PrivacyPage() {
  const [activeId, setActiveId] = useState<string>('overview');

  useEffect(() => {
    const ids = privacySections.map((s) => s.id);

    const handleScroll = () => {
      const scrollPosition = window.scrollY + 140;

      for (let i = ids.length - 1; i >= 0; i--) {
        const id = ids[i];
        const el = document.getElementById(id);
        if (el && el.offsetTop <= scrollPosition) {
          setActiveId(id);
          return;
        }
      }

      if (ids[0]) {
        setActiveId(ids[0]);
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
              <BreadcrumbPage>Privacy Policy</BreadcrumbPage>
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
                Privacy Policy
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed font-normal">
                Stargazer is an open-source visual rendering utility engineered with a strict zero-telemetry, client-side architectural model. This document details our data handling practices and security safeguards.
              </p>
            </header>

            <p className="text-base text-foreground font-semibold leading-relaxed pt-2">
              Stargazer operates entirely within your local browser runtime. We do not operate remote servers, tracking databases, or telemetry services.
            </p>

            <p className="text-base text-foreground/80 leading-7 font-normal">
              All graphic generation, SVG composition, canvas rasterization, and MP4 video encoding execute locally on your device via client-side Web APIs and WebAssembly routines. No user-generated social cards, repository graphics, or video streams are ever transmitted to or stored on external servers.
            </p>
          </FadeIn>

          {/* Section 1: Overview & Architecture */}
          <section id="overview" className="scroll-mt-24 pt-6 space-y-6">
            <FadeIn delay={0.05} yOffset={15} duration={0.4}>
              <div className="border-b border-border/40 pb-3">
                <h2 className="text-2xl font-bold tracking-tight text-foreground">
                  Overview & Architecture
                </h2>
              </div>

              <p className="text-base text-foreground/80 leading-7 font-normal pt-4">
                Unlike conventional web applications, Stargazer does not maintain an application server, central database, or remote middleware to process, harvest, or log user activities.
              </p>

              <p className="text-base text-foreground/80 leading-7 font-normal">
                We do not collect, store, sell, lease, or transmit personal data, IP addresses, browsing histories, or user identifiers to any centralized database or third-party service provider.
              </p>
            </FadeIn>
          </section>

          {/* Section 2: GitHub Token Security */}
          <section id="token-handling" className="scroll-mt-24 pt-6 space-y-6">
            <FadeIn delay={0.05} yOffset={15} duration={0.4}>
              <div className="border-b border-border/40 pb-3">
                <h2 className="text-2xl font-bold tracking-tight text-foreground">
                  GitHub Token Security
                </h2>
              </div>

              <p className="text-base text-foreground/80 leading-7 font-normal pt-4">
                To retrieve repository star histories and public user profile avatars, Stargazer provides an interface for users to supply an optional GitHub Personal Access Token (PAT). This token serves solely to elevate API rate limits from GitHub's unauthenticated threshold (60 requests per hour) to the authenticated threshold (5,000 requests per hour).
              </p>

              <ul className="list-disc pl-6 space-y-2 text-base text-foreground/80 leading-7">
                <li>
                  <strong>Memory-Only Lifecycle:</strong> The token resides exclusively in volatile browser application memory (React runtime state) during your active session.
                </li>
                <li>
                  <strong>Zero Remote Persistence:</strong> Your token is never logged, stored in remote databases, written to disk, or relayed through proxies.
                </li>
                <li>
                  <strong>No Persistent Storage:</strong> Stargazer deliberately avoids writing tokens to <code>localStorage</code>, <code>sessionStorage</code>, or browser cookies. Closing, reloading, or navigating away from the page immediately purges the token from memory.
                </li>
                <li>
                  <strong>Encrypted Direct Transmission:</strong> All requests bearing your token are dispatched directly from your browser to GitHub's official REST API endpoint (<code>https://api.github.com</code>) via secure Transport Layer Security (TLS/HTTPS).
                </li>
              </ul>
            </FadeIn>
          </section>

          {/* Section 3: Local Browser Storage */}
          <section id="local-storage" className="scroll-mt-24 pt-6 space-y-6">
            <FadeIn delay={0.05} yOffset={15} duration={0.4}>
              <div className="border-b border-border/40 pb-3">
                <h2 className="text-2xl font-bold tracking-tight text-foreground">
                  Local Browser Storage
                </h2>
              </div>

              <p className="text-base text-foreground/80 leading-7 font-normal pt-4">
                Stargazer does not utilize tracking cookies, advertising identifiers, cross-site beacons, or behavioral monitoring scripts.
              </p>

              <p className="text-base text-foreground/80 leading-7 font-normal">
                Browser <code>localStorage</code> is used strictly for storing a single non-identifiable user interface preference: <code>stargazer-theme</code> (storing either <code>&quot;dark&quot;</code> or <code>&quot;light&quot;</code>) to preserve your preferred color scheme across sessions.
              </p>
            </FadeIn>
          </section>

          {/* Section 4: Third-Party Services */}
          <section id="third-party-api" className="scroll-mt-24 pt-6 space-y-6">
            <FadeIn delay={0.05} yOffset={15} duration={0.4}>
              <div className="border-b border-border/40 pb-3">
                <h2 className="text-2xl font-bold tracking-tight text-foreground">
                  Third-Party Services
                </h2>
              </div>

              <p className="text-base text-foreground/80 leading-7 font-normal pt-4">
                When fetching public stargazers, your browser establishes direct network connections with GitHub, Inc. infrastructure. Any data exchanged between your browser and GitHub is governed by the{' '}
                <a
                  href="https://docs.github.com/en/site-policy/privacy-policies/github-privacy-statement"
                  target="_blank"
                  rel="noreferrer"
                  className="text-foreground underline underline-offset-4 hover:text-primary transition-colors font-medium"
                >
                  GitHub Privacy Statement
                </a>.
              </p>

              <p className="text-base text-foreground/80 leading-7 font-normal">
                Public avatar images displayed within generated templates are streamed directly from GitHub's avatar Content Delivery Network (<code>avatars.githubusercontent.com</code>) without intermediate caching or third-party redirection.
              </p>
            </FadeIn>
          </section>

          {/* Section 5: Data Rights */}
          <section id="data-rights" className="scroll-mt-24 pt-6 space-y-6">
            <FadeIn delay={0.05} yOffset={15} duration={0.4}>
              <div className="border-b border-border/40 pb-3">
                <h2 className="text-2xl font-bold tracking-tight text-foreground">
                  Data Rights (GDPR & CCPA)
                </h2>
              </div>

              <p className="text-base text-foreground/80 leading-7 font-normal pt-4">
                Under international privacy frameworks, including the European Union General Data Protection Regulation (GDPR) and California Consumer Privacy Act (CCPA), individuals maintain specific rights regarding their personal data, including access, rectification, portability, and erasure.
              </p>

              <p className="text-base text-foreground/80 leading-7 font-normal">
                Because Stargazer does not collect, store, retain, or monetize personal information, Stargazer does not maintain user identity profiles or remote datasets from which records could be extracted or deleted. All operations remain entirely self-contained on your local machine.
              </p>
            </FadeIn>
          </section>

          {/* Section 6: Security & Auditability */}
          <section id="security-audit" className="scroll-mt-24 pt-6 space-y-6">
            <FadeIn delay={0.05} yOffset={15} duration={0.4}>
              <div className="border-b border-border/40 pb-3">
                <h2 className="text-2xl font-bold tracking-tight text-foreground">
                  Security & Auditability
                </h2>
              </div>

              <p className="text-base text-foreground/80 leading-7 font-normal pt-4">
                Transparency is fundamental to our security model. The complete source code of Stargazer is licensed under the MIT License and openly published on GitHub.
              </p>

              <p className="text-base text-foreground/80 leading-7 font-normal">
                Users and security professionals are encouraged to inspect our network calls, audit memory handling, or build and run the application independently in local development environments.
              </p>
            </FadeIn>
          </section>

          {/* Section 7: Amendments & Inquiries */}
          <section id="policy-updates" className="scroll-mt-24 pt-6 space-y-6">
            <FadeIn delay={0.05} yOffset={15} duration={0.4}>
              <div className="border-b border-border/40 pb-3">
                <h2 className="text-2xl font-bold tracking-tight text-foreground">
                  Amendments & Inquiries
                </h2>
              </div>

              <p className="text-base text-foreground/80 leading-7 font-normal pt-4">
                We may periodically revise this Privacy Policy to reflect technical enhancements or regulatory updates. Any modifications will be documented with an updated revision date and published directly to the repository.
              </p>

              <p className="text-base text-foreground/80 leading-7 font-normal">
                For privacy inquiries or technical clarification, you may contact the maintainer via{' '}
                <a
                  href="https://charanmunur.in"
                  target="_blank"
                  rel="noreferrer"
                  className="text-foreground underline underline-offset-4 hover:text-primary transition-colors font-medium"
                >
                  charanmunur.in
                </a>{' '}
                or file a public issue on GitHub.
              </p>
            </FadeIn>
          </section>
        </article>

        {/* Right Column: Clean "On This Page" Sidebar matching HowToPage */}
        <aside className="hidden lg:block w-64 shrink-0 sticky top-24 self-start space-y-6">
          <FadeIn delay={0.15} yOffset={10} duration={0.4}>
            <div className="space-y-3">
              <p className="text-sm font-medium text-foreground">
                On This Page
              </p>

              <nav className="space-y-3 text-sm" aria-label="On this page">
                {privacySections.map((section) => {
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
