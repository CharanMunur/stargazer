# Stargazer Web Client

The official web frontend and studio for **Stargazer**, built with [Astro](https://astro.build), [React](https://react.dev), [Tailwind CSS](https://tailwindcss.com), [Framer Motion](https://www.framer.com/motion/), and [Lenis](https://github.com/darkroomengineering/lenis).

---

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) (recommended) or Node.js 20+

### Installation & Development

```bash
# Install dependencies
bun install

# Start development server
bun dev

# Build for production
bun run build

# Preview production build locally
bun run preview
```

The development server runs at `http://localhost:4321` by default.

---

## Key Routes

- `/` — Homepage featuring the hero showcase, repository star counter, and interactive template gallery.
- `/generate` — Full Studio workspace for real-time card generation, live previewing, and high-res PNG / 60fps MP4 export.
- `/how-to` — Step-by-step guide for creating GitHub Personal Access Tokens and customizing card exports, structured with shadcn-style editorial layout and scrollspy TOC.

---

## Architectural Guidelines

When contributing to this workspace, adhere to the design rules in [`AGENTS.md`](../AGENTS.md):

1. **Pill Geometry**: Interactive elements (inputs, action buttons, segmented controls) must use `rounded-full`.
2. **Animation Pipeline**:
   - Scroll entrance: `<FadeIn>` from `src/components/FadeIn.tsx` using `framer-motion`.
   - Inertia scrolling: `<SmoothScroll />` with Lenis (`lerp: 0.15`).
   - Theme stability: Mutation observers must guard against Lenis scroll classes resetting the active card theme.
3. **Security**: GitHub Personal Access Tokens must remain ephemeral in React memory. Do not persist them to `localStorage` or `sessionStorage`.

---

## License

MIT License. See [LICENSE](../LICENSE) for details.
