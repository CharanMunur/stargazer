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

const termsSections = [
  { id: 'acceptance', title: 'Acceptance of Terms' },
  { id: 'license-grant', title: 'Open-Source License' },
  { id: 'rendered-assets', title: 'Intellectual Property & Exports' },
  { id: 'acceptable-use', title: 'Acceptable Use & API Rules' },
  { id: 'disclaimer', title: 'Disclaimer of Warranties' },
  { id: 'liability', title: 'Limitation of Liability' },
  { id: 'modifications', title: 'Amendments & Inquiries' },
];

export default function TermsPage() {
  const [activeId, setActiveId] = useState<string>('acceptance');

  useEffect(() => {
    const ids = termsSections.map((s) => s.id);

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
              <BreadcrumbPage>Terms of Service</BreadcrumbPage>
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
                Terms of Service
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed font-normal">
                These Terms of Service govern your access to and usage of the Stargazer web application. Please read these terms carefully before generating, rendering, or exporting media assets.
              </p>
            </header>

            <p className="text-base text-foreground font-semibold leading-relaxed pt-2">
              Stargazer is an open-source software project licensed under the MIT License. You retain complete ownership over all media generated through the tool.
            </p>

            <p className="text-base text-foreground/80 leading-7 font-normal">
              By accessing, browsing, or utilizing Stargazer, you confirm that you have read, understood, and agreed to be legally bound by these Terms of Service and all incorporated documents, including our Privacy Policy.
            </p>
          </FadeIn>

          {/* Section 1: Acceptance of Terms */}
          <section id="acceptance" className="scroll-mt-24 pt-6 space-y-6">
            <FadeIn delay={0.05} yOffset={15} duration={0.4}>
              <div className="border-b border-border/40 pb-3">
                <h2 className="text-2xl font-bold tracking-tight text-foreground">
                  Acceptance of Terms
                </h2>
              </div>

              <p className="text-base text-foreground/80 leading-7 font-normal pt-4">
                These Terms of Service constitute a legally binding agreement between you and Stargazer. They govern your use of the application whether accessed via our hosted web domain or compiled locally from source code.
              </p>

              <p className="text-base text-foreground/80 leading-7 font-normal">
                If you do not agree to these terms in their entirety, you must discontinue use of the service immediately.
              </p>
            </FadeIn>
          </section>

          {/* Section 2: Open-Source License Grant */}
          <section id="license-grant" className="scroll-mt-24 pt-6 space-y-6">
            <FadeIn delay={0.05} yOffset={15} duration={0.4}>
              <div className="border-b border-border/40 pb-3">
                <h2 className="text-2xl font-bold tracking-tight text-foreground">
                  Open-Source License
                </h2>
              </div>

              <p className="text-base text-foreground/80 leading-7 font-normal pt-4">
                Stargazer is free, open-source software licensed under the terms of the <strong>MIT License</strong>.
              </p>

              <p className="text-base text-foreground/80 leading-7 font-normal">
                Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files, to deal in the software without restriction, including the rights to use, copy, modify, merge, publish, distribute, sublicense, and sell copies of the software, subject to the condition that the copyright notice and permission notice are preserved in substantial copies.
              </p>
            </FadeIn>
          </section>

          {/* Section 3: Intellectual Property & Exports */}
          <section id="rendered-assets" className="scroll-mt-24 pt-6 space-y-6">
            <FadeIn delay={0.05} yOffset={15} duration={0.4}>
              <div className="border-b border-border/40 pb-3">
                <h2 className="text-2xl font-bold tracking-tight text-foreground">
                  Intellectual Property & Exports
                </h2>
              </div>

              <p className="text-base text-foreground/80 leading-7 font-normal pt-4">
                <strong>User Ownership of Exports:</strong> You retain full copyright, commercial distribution rights, and ownership over all social card graphics (PNG) and animation video files (MP4) generated using Stargazer. Stargazer asserts zero proprietary claim over your rendered media.
              </p>

              <p className="text-base text-foreground/80 leading-7 font-normal">
                <strong>Third-Party Trademarks:</strong> Repository names, organization logos, and contributor avatars retrieved from GitHub remain the intellectual property of their respective owners. You are solely responsible for ensuring that your usage, publication, or commercial distribution of generated graphics complies with applicable trademark, fair use, and copyright laws.
              </p>
            </FadeIn>
          </section>

          {/* Section 4: Acceptable Use */}
          <section id="acceptable-use" className="scroll-mt-24 pt-6 space-y-6">
            <FadeIn delay={0.05} yOffset={15} duration={0.4}>
              <div className="border-b border-border/40 pb-3">
                <h2 className="text-2xl font-bold tracking-tight text-foreground">
                  Acceptable Use & API Rules
                </h2>
              </div>

              <p className="text-base text-foreground/80 leading-7 font-normal pt-4">
                In utilizing Stargazer to interface with GitHub's REST API, you explicitly agree not to:
              </p>

              <ul className="list-disc pl-6 space-y-2 text-base text-foreground/80 leading-7">
                <li>
                  Violate or attempt to circumvent GitHub's Terms of Service, Acceptable Use Policies, or API rate limitations.
                </li>
                <li>
                  Employ automated crawlers, bots, or distributed stress-testing tools that could impair GitHub or Stargazer web hosting infrastructure.
                </li>
                <li>
                  Generate, distribute, or associate rendered content with malicious, defamatory, fraudulent, or unlawful repositories.
                </li>
                <li>
                  Misrepresent or forge repository metadata, star counts, or contributor identities in bad faith.
                </li>
              </ul>
            </FadeIn>
          </section>

          {/* Section 5: Disclaimer of Warranties */}
          <section id="disclaimer" className="scroll-mt-24 pt-6 space-y-6">
            <FadeIn delay={0.05} yOffset={15} duration={0.4}>
              <div className="border-b border-border/40 pb-3">
                <h2 className="text-2xl font-bold tracking-tight text-foreground">
                  Disclaimer of Warranties
                </h2>
              </div>

              <p className="text-base text-foreground/80 leading-7 font-normal pt-4">
                THE SOFTWARE IS PROVIDED &quot;AS IS&quot;, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, ACCURACY, AND NON-INFRINGEMENT.
              </p>

              <p className="text-base text-foreground/80 leading-7 font-normal">
                THE AUTHORS AND MAINTAINERS DO NOT WARRANT THAT THE APPLICATION WILL OPERATE ERROR-FREE, COMPATIBLY WITH ALL HARDWARE ACCELERATION DRIVERS, OR UNINTERRUPTEDLY DURING GITHUB API DOWNTIME OR RATE LIMITING.
              </p>
            </FadeIn>
          </section>

          {/* Section 6: Limitation of Liability */}
          <section id="liability" className="scroll-mt-24 pt-6 space-y-6">
            <FadeIn delay={0.05} yOffset={15} duration={0.4}>
              <div className="border-b border-border/40 pb-3">
                <h2 className="text-2xl font-bold tracking-tight text-foreground">
                  Limitation of Liability
                </h2>
              </div>

              <p className="text-base text-foreground/80 leading-7 font-normal pt-4">
                IN NO EVENT SHALL THE AUTHORS, COPYRIGHT HOLDERS, OR CONTRIBUTORS BE LIABLE FOR ANY CLAIM, DAMAGES, LOSS OF DATA, REPUTATIONAL INJURY, OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT, OR OTHERWISE, ARISING FROM, OUT OF, OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
              </p>

              <p className="text-base text-foreground/80 leading-7 font-normal">
                YOU ASSUME ALL RESPONSIBILITY FOR THE SELECTION, EXECUTION, AND APPLICATION OF EXPORTED ASSETS FOR YOUR SOCIAL MEDIA, PRESENTATIONS, OR MARKETING CAMPAIGNS.
              </p>
            </FadeIn>
          </section>

          {/* Section 7: Modifications & Inquiries */}
          <section id="modifications" className="scroll-mt-24 pt-6 space-y-6">
            <FadeIn delay={0.05} yOffset={15} duration={0.4}>
              <div className="border-b border-border/40 pb-3">
                <h2 className="text-2xl font-bold tracking-tight text-foreground">
                  Amendments & Inquiries
                </h2>
              </div>

              <p className="text-base text-foreground/80 leading-7 font-normal pt-4">
                We reserve the right to revise or update these Terms of Service at our discretion. Any revisions take effect immediately upon being committed to the public repository.
              </p>

              <p className="text-base text-foreground/80 leading-7 font-normal">
                For licensing inquiries or terms clarification, visit{' '}
                <a
                  href="https://charanmunur.in"
                  target="_blank"
                  rel="noreferrer"
                  className="text-foreground underline underline-offset-4 hover:text-primary transition-colors font-medium"
                >
                  charanmunur.in
                </a>{' '}
                or participate in public GitHub repository discussions.
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
                {termsSections.map((section) => {
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
