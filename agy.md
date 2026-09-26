# Stargazer Studio — System Architecture, Progress & Core Principles

## Overview
**Stargazer Studio** is a high-performance 2D/3D card and GIF rendering engine for GitHub repository stargazers and stats. It features a Go backend engine (`server/`) and an Astro + React + Tailwind CSS frontend (`client/`).

---

## 1. Accomplishments & What's Done

### Backend Rendering Engine (`server/`)
* **Go HTTP API Server** (`server/cmd/api/main.go`): Exposes REST endpoint `POST /api/generate` with zero database overhead, zero token logging, and zero server caching.
* **4 Distinct Animation & Static Templates** (`server/internal/render/templates/`):
  1. **Counter Template** (`counter`): Laurel wreath grid with metric interpolation physics.
  2. **Marquee Ticker Template** (`ticker`): Endless avatar ticker marquee with physics cubic deceleration and center avatar scaling pop.
  3. **3D Orbit Template** (`orbit`): 3D spherical point cloud rotation with depth scaling.
  4. **Constellation Template** (`constellation`): Rebuilt layout according to exact specification:
     - Organic avatar distribution (78px–120px diameter range) loosely clustered in outer areas and corners, thinning toward center.
     - Horizontal whitespace ellipse (keep-clear zone) preventing any avatar overlap around centered mascot logo, `username / repo` title, and star count.
     - True radial Euclidean distance opacity falloff: faint avatars (~0.35 opacity) near the oval perimeter, gradually brightening up to full opacity (1.0) near corner and edge bounds.

### Frontend & UI (`client/`)
* **Aceternity Resizable Navbar**: Animated sticky navbar (`resizable-navbar.tsx` + `NavbarDemo.tsx`) featuring raw SVG logo (`stargazer-logo.svg`) without any text beside it, background box wrapper, or border box.
* **Official shadcn/ui Component Suite**: Configured with `components.json` and standard components (`Button`, `Input`, `Label`, `Card`, `Badge`).
* **Minimalist `/generate` Dashboard**: Responsive 2-column layout (Control sidebar + Canvas preview output window) free of clutter, badges, or unnecessary status bars.

---

## 2. Core Design Principles & Development Rules

### Rule 1: Zero UI Clutter & Simple Architecture
* Remove all unnecessary dashboard elements (status badges like `Status: Idle`, canvas resolution specs, version tags like `stargazer v1.0`, or repo presets).
* Keep the interface simple, beautiful, organized, and focused on control inputs and live preview.

### Rule 2: Icon-Free `/generate` Route
* **No icons** (Lucide, Tabler, or inline SVG icons) on the `/generate` Studio page.
* All controls, buttons, toggles, error boxes, and preview states must rely exclusively on clean, readable text.

### Rule 3: Use shadcn Components As-Is
* Standard shadcn UI components (`Button`, `Input`, `Label`, `Card`, `Badge`) must be used as-is without overriding default sizes, colors, or variants with custom inline utility styles.
* Rely on standard props (`variant="default"`, `variant="secondary"`, `variant="outline"`, `size="sm"`, `size="lg"`).

### Rule 4: Capitalized First Letter (Title Case) Standard
* Single-word UI labels and action buttons must strictly use Capitalized First Letter format (e.g. `Repository`, `GitHub Token`, `Template`, `Background`, `Format`, `Generate Card`, `Preview`, `Download`, `Copy Link`).
* Do **NOT** use `uppercase` CSS transforms (`text-transform: uppercase`) or full-caps text anywhere in the UI.

### Rule 5: Pure Dark & Light Color Tones
* Provide background theme toggles restricted to pure Black (`#0F0E10`) and White (`#FFFFFF`) or their natural color tones.
* Do not display profile names in card headers or tag overlays unless part of the center repository title string (`owner / repo`).

### Rule 6: Zero Overlap Guarantee & Raw SVG Logo
* Page headers and hero section elements must have proper vertical top padding (`pt-32 sm:pt-40 md:pt-48`) and relaxed text line-height (`leading-[1.2]`) so sticky navbars never overlap or obscure hero title text.
* The navbar logo must use the raw SVG vector (`stargazer-logo.svg`) directly without any enclosing border, wrapper box, or adjacent brand text.

### Rule 7: Zero Token Persistence & Privacy
* GitHub Personal Access Tokens are processed strictly in-memory per HTTP request.
* Absolutely no database persistence, no token logging, no telemetry, and no disk caching of authentication credentials.

### Rule 8: Zero Emojis in Documentation
* Documentation files like `README.md` must not contain emojis.
* Centered logo, techstack list with shield badges, and technical "How It Works" descriptions are placed cleanly at the top of documentation.

---

## 3. Project Directory Map

```
stargazer/
├── agy.md                           # System architecture, progress & core principles
├── client/                          # Astro + React + Tailwind CSS frontend
│   ├── components.json              # shadcn UI CLI configuration
│   ├── public/
│   │   └── stargazer-logo.svg       # Raw brand logo SVG
│   ├── src/
│   │   ├── components/
│   │   │   ├── CardGenerator.tsx    # Studio dashboard component (shadcn, icon-free)
│   │   │   ├── NavbarDemo.tsx       # Landing page resizable navbar wrapper
│   │   │   └── ui/                  # shadcn & Aceternity UI components
│   │   │       ├── badge.tsx
│   │   │       ├── button.tsx
│   │   │       ├── card.tsx
│   │   │       ├── input.tsx
│   │   │       ├── label.tsx
│   │   │       └── resizable-navbar.tsx
│   │   ├── pages/
│   │   │   ├── generate.astro       # Studio route (/generate)
│   │   │   └── index.astro          # Landing page (/)
│   │   └── styles/
│   │       └── globals.css          # Global CSS & Tailwind imports
└── server/                          # Go backend render engine
    ├── cmd/api/main.go              # HTTP API entrypoint (POST /api/generate)
    └── internal/
        ├── github/client.go         # GitHub API client & stargazer fetcher
        └── render/
            ├── engine.go            # Template registry & dispatch
            └── templates/           # Render templates
                ├── constellation.go # Organic scatter constellation template
                ├── counter.go       # Laurel wreath counter grid template
                ├── orbit.go         # 3D spherical orbit template
                ├── ticker.go        # Physics marquee ticker template
                └── utils.go         # Shared graphics drawing helpers
```
