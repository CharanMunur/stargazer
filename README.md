<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="public/stargazer-dark.svg">
    <img src="public/stargazer-light.svg" alt="stargazer logo" width="520" align="center" />
  </picture>
</p>

<p align="center">
  <strong>Open-Source GitHub Stargazer Cards & 60fps MP4 Videos</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/Framer_Motion-0055FF?style=for-the-badge&logo=framer&logoColor=white" alt="Framer Motion" />
  <img src="https://img.shields.io/badge/Astro-BC52EE?style=for-the-badge&logo=astro&logoColor=white" alt="Astro" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/shadcn%2Fui-000000?style=for-the-badge&logo=shadcnui&logoColor=white" alt="shadcn/ui" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
</p>

---

## Overview

Stargazer turns your GitHub repository's community milestones into high-resolution cards (1600 × 900) and 60fps MP4 videos directly in the browser. 

The application runs entirely client-side with zero backend server dependencies. Community data is fetched directly from the GitHub REST API, animated with Framer Motion, and exported to crystal-clear PNG images or hardware-accelerated MP4 videos.

---

## Features & Design Highlights

* **Unified Design Token System**: Complete visual hierarchy consistency across pages—breadcrumbs, input fields, template preview cards, and segmented pills share uniform geometry, borders, and hover states.
* **Theme-Aware Branding**: Automatically switches between `stargazer-dark.svg` (Obsidian mode) and `stargazer-light.svg` (Warm stone mode) dynamically.
* **4-Layer Animation Pipeline**:
  * **Staggered Entrance**: Framer Motion `<FadeIn>` wraps cards, sections, and headers with subtle offsets and dynamic delays.
  * **Smooth Inertia Scrolling**: Powered by Lenis with continuous RAF loop (`lerp: 0.15`), giving smooth deceleration without blocking native touch scrolling.
  * **Tailwind & CSS Keyframes**: High-performance keyframe animations for marquee streams (`marquee-left`, `marquee-right`) and particle motion.
  * **Scroll Restoration**: Seamless route and navigation transitions resetting window scroll to `(0, 0)`.
* **Deterministic Dual-Renderer Parity**:
  * **DOM Live Previews**: Interactive React components rendered in-browser during customization.
  * **Off-Screen Canvas Engine**: HTML5 Canvas renderer (`canvasRenderer.ts`) generating 1:1 pixel-identical 1600 × 900 PNG downloads and 60fps MP4 video loops.
* **Editorial Documentation**: Built-in `/how-to` guide structured after shadcn/ui documentation with a sticky "On This Page" table of contents and live scrollspy.
* **Ephemeral Security**: Zero token caching in `localStorage`. Personal Access Tokens (PAT) remain strictly in ephemeral React memory for the active browser session.

---

## Templates

### 1. Spotlight (Keynote Editorial)
Clean Apple-style keynote layout with display typography:
* Large repo title and star count display.
* Overlapping avatar fan stack featuring contributor profiles.
* Clean theme adaptation for Dark and Light palettes.

### 2. Revolve (Concentric Orbits)
Multi-ring orbital choreography:
* Concentric orbit rings revolving contributor avatars in opposing directions around live star metrics.
* Center hub spotlighting repository avatar and milestone star counter.
* Dynamic orbital physics synced between live DOM preview and video export.

### 3. Milestone (Laurel Achievement)
A classical layout designed for milestones, repository anniversaries, and release announcements:
* Symmetrical laurel wreath branches flanking the repository title.
* Metric counters for Stars, Forks, and Days metrics in DM Sans.
* Structured 2-row grid of 16 stargazers with theme-aware laurel colors.
* Soft gradient mask for depth grounding.

### 4. Infinity (Marquee Loop)
An energetic avatar marquee designed for README headers and dynamic feeds:
* Top-left repository hierarchy header (`owner / repo`) with owner avatar.
* Horizontal marquee stream with uniform 160px spacing and continuous 60fps looping.
* Contributor avatars with star badges.
* Bottom-right live metric counter readout.

### 5. 3D Orbit
A spherical carousel with dynamic depth and radial lighting:
* Curved spherical arc trajectory with depth-sorted z-index layering.
* Dynamic scale magnification (0.7x background up to 1.35x foreground).
* Ambient radial glow centered on the focal gravitational point.

### 6. Constellation (Particle Graph)
An organic particle cluster designed for contributor appreciation:
* Centered stacked layout: owner mascot avatar, repository title, and live star count.
* Full-field organic scatter of contributor avatars across the canvas.
* Central glow vignette maintaining 100% readability.
* Natural fade-in entrance motion.

---

## Quick Start

### Prerequisites
* [Bun](https://bun.sh) 1.0+ (or Node.js 20+)

### Run the Studio Locally

```bash
# Clone the repository
git clone https://github.com/CharanMunur/stargazer.git
cd stargazer

# Install dependencies
bun install

# Start the local development server
bun dev
```

Open `http://localhost:4321` (or `http://localhost:3000`) in your browser.

* Navigate to `/` for the landing page overview and template showcase.
* Navigate to `/how-to` for the step-by-step PAT guide and export walkthrough.
* Navigate to `/generate` to launch the interactive studio (supports deep-linking, e.g. `/generate?template=revolve`).

---

## Architecture & Export Pipeline

1. **Client-Side Data Fetching**: Stargazer queries GitHub's public API (`https://api.github.com/repos/{owner}/{repo}`) directly from the client. Unauthenticated requests support public repositories; optional Personal Access Tokens (PAT) can be provided to bypass rate limits.
2. **Real-Time 60fps Rendering**: Templates are constructed as pure React components animated via Framer Motion springs, scaled deterministically to a 1600 × 900 virtual canvas.
3. **PNG Image Export**: High-resolution 1600 × 900 rendering executed directly in-browser via the HTML5 Canvas API (`canvasRenderer.ts`).
4. **MP4 Video Export**: 60fps video encoding executed directly in the browser via WebCodecs `VideoEncoder` and `mp4-muxer` (with standard `MediaRecorder` fallback).

---

## Project Structure

```text
stargazer/
├── public/                              # Static assets, stargazer-dark.svg, stargazer-light.svg, and fonts
├── src/
│   ├── components/
│   │   ├── helpers/                     # Cross-cutting UX & animation helpers
│   │   │   ├── FadeIn.tsx               # Viewport-aware entrance animation wrapper
│   │   │   └── SmoothScroll.tsx         # Lenis smooth inertia scrolling
│   │   ├── pages/                       # Dedicated page coordinator components
│   │   │   ├── HomePage.tsx             # Landing page & template showcase
│   │   │   ├── StudioPage.tsx           # Interactive studio & card/video generator
│   │   │   └── HowToPage.tsx            # Step-by-step guide with live scrollspy TOC
│   │   ├── templates/                   # React + Framer Motion canvas templates
│   │   │   ├── SpotlightCard.tsx        # Spotlight template
│   │   │   ├── RevolveCard.tsx          # Revolve template
│   │   │   ├── MilestoneCard.tsx        # Milestone template (re-exports CounterCard)
│   │   │   ├── TickerCard.tsx           # Infinity template (re-exports TickerCard)
│   │   │   ├── OrbitCard.tsx            # 3D Orbit template
│   │   │   ├── ConstellationCard.tsx    # Constellation template
│   │   │   └── types.ts                 # Template TypeScript interfaces
│   │   ├── ui/                          # Headless & UI primitives
│   │   ├── Footer.astro                 # Global footer component
│   │   ├── GitHubStars.tsx              # Real-time repository star badge
│   │   └── ThemeToggle.tsx              # Theme switcher with observer protection
│   ├── data/                            # Sovereign data domain
│   │   ├── howToData.ts                 # Structured documentation content
│   │   ├── sampleStargazers.json        # Contributor sample dataset
│   │   └── templates.ts                 # Template specifications & sample data
│   ├── lib/                             # Core utilities & export engines
│   │   ├── canvasRenderer.ts            # Deterministic 1600x900 canvas rendering engine
│   │   ├── utils.ts                     # Class merging utility (clsx + tailwind-merge)
│   │   └── videoExporter.ts             # In-browser MP4 video exporter
│   ├── pages/                           # Route entry points
│   │   ├── generate.astro               # Studio route (/generate)
│   │   ├── how-to.astro                 # How-to guide route (/how-to)
│   │   └── index.astro                  # Landing page (/)
│   └── styles/
│       └── globals.css                  # Global styles & design token engine
├── astro.config.mjs                     # Astro build configuration
├── components.json                      # Component CLI configuration
├── package.json                         # Project dependencies & scripts
├── tailwind.config.mjs                  # Tailwind configuration
├── tsconfig.json                        # TypeScript configuration & path aliases
└── README.md
```

---

## Security & Privacy

* **Zero Server Persistence**: No database, no logging server, and no analytics tracking.
* **In-Memory Token Processing**: GitHub Personal Access Tokens are handled strictly in the user's browser memory and are never saved to `localStorage` or transmitted to external servers.

---

## License

MIT License. See [LICENSE](LICENSE) for details.
