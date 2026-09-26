<p align="center">
  <img src="client/public/stargazer.svg" alt="stargazer logo" width="520" align="center" />
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

Stargazer turns your GitHub repository's community milestones into high-resolution cards (1600 × 900) and 60fps MP4 videos. 

The application runs entirely in the browser with zero backend server dependencies required. Community data is fetched directly from the GitHub REST API, animated with Framer Motion, and exported to crystal-clear PNG images or hardware-accelerated MP4 videos.

---

## Templates

### 1. Counter Template
A classical layout designed for milestones, repository anniversaries, and release announcements:
* Symmetrical laurel wreath branches flanking the repository title.
* Dynamic counting animation for Stars, Forks, and Days metrics in DM Sans Regular.
* Structured 2-row grid of 16 stargazers with colored ring borders.
* Subtle bottom gradient fade to ground the card composition.

### 2. Ticker Template (Marquee)
An energetic avatar marquee designed for README headers and dynamic feeds:
* Top-left repository hierarchy header (`owner / repo`) with owner avatar.
* Physics-driven horizontal marquee stream with continuous 60fps looping.
* 5-pointed yellow star anchored directly beneath each community avatar.
* Bottom-right live metric counter readout.

### 3. 3D Orbit Template
A spherical carousel with dynamic depth and radial lighting:
* Curved spherical arc trajectory with depth-sorted z-index layering.
* Dynamic scale magnification (0.7x background up to 1.35x foreground).
* Ambient radial glow centered on the focal gravitational point.
* Primary accent ring on active focus member and star metrics.

### 4. Constellation Template
An organic point-cloud cluster designed for contributor appreciation and showcase banners:
* Centered stacked layout: 100px mascot avatar, repository title, and plain text star count.
* Strict horizontal whitespace ellipse (560px × 240px keep-clear zone) preserving center legibility.
* Deterministic PRNG scatter of 48+ non-overlapping avatars across outer margins and corners.
* Radial Euclidean distance opacity falloff: faint avatars (~0.35 opacity) near the oval boundary, brightening to full opacity (1.0) at the canvas perimeter.

---

## Quick Start

### Prerequisites
* [Bun](https://bun.sh) 1.0+ (or Node.js 20+)

### Run the Studio Locally

```bash
# Clone the repository
git clone https://github.com/CharanMunur/stargazer.git
cd stargazer/client

# Install dependencies
bun install

# Start the local development server
bun dev
```

Open `http://localhost:4321` in your browser.

* Navigate to `/` for the landing page overview and workflow guide.
* Navigate to `/templates` to view the dedicated template documentation and live 60fps previews.
* Navigate to `/generate` to launch the interactive studio (supports deep-linking, e.g. `/generate?generate=ticker`).

---

## Architecture & Export Pipeline

1. **Client-Side Data Fetching**: Stargazer queries GitHub's public API (`https://api.github.com/repos/{owner}/{repo}`) directly from the client. Unauthenticated requests support public repositories; optional Personal Access Tokens (PAT) can be provided to bypass rate limits.
2. **Real-Time 60fps Rendering**: Templates are constructed as pure React components animated via Framer Motion springs, scaled deterministically to a 1600 × 900 virtual canvas.
3. **PNG Image Export**: High-resolution DOM capture executed in milliseconds via the HTML5 Canvas API (`html-to-image`).
4. **MP4 Video Export**: 60fps video encoding executed directly in the browser via WebCodecs `VideoEncoder` and `mp4-muxer` (with standard `MediaRecorder` fallback).

---

## Project Structure

```text
stargazer/
├── client/                              # Modern React + Framer Motion frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── CardGenerator.tsx        # Interactive Studio interface
│   │   │   ├── Hero.tsx                 # Landing page hero showcase
│   │   │   ├── Navbar.tsx               # Fixed header with theme toggle
│   │   │   ├── TemplateDetail.tsx       # Three-column template documentation view
│   │   │   ├── TemplatesSidebar.tsx     # Clean documentation sidebar
│   │   │   ├── templates/               # React + Framer Motion templates
│   │   │   │   ├── ConstellationCard.tsx# Constellation template
│   │   │   │   ├── CounterCard.tsx      # Counter template
│   │   │   │   ├── OrbitCard.tsx        # 3D Orbit template
│   │   │   │   ├── TickerCard.tsx       # Ticker template
│   │   │   │   └── types.ts             # Template TypeScript interfaces
│   │   │   └── ui/                      # Official shadcn/ui components
│   │   ├── lib/
│   │   │   ├── canvasRenderer.ts        # Canvas rendering engine
│   │   │   ├── templatesData.ts         # Centralized template metadata & specs
│   │   │   └── videoExporter.ts         # In-browser MP4 video exporter
│   │   └── pages/
│   │       ├── generate.astro           # Studio route (/generate)
│   │       ├── index.astro              # Landing page (/)
│   │       └── templates/               # Template docs routes (/templates, /templates/[id])
│   └── public/                          # Static assets and DM Sans font files
└── README.md
```

---

## Security & Privacy

* **Zero Server Persistence**: No database, no logging server, and no analytics tracking.
* **In-Memory Token Processing**: GitHub Personal Access Tokens are handled strictly in the user's browser memory and are never transmitted to external servers.

---

## License

MIT License. See [LICENSE](LICENSE) for details.
