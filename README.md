<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="public/stargazer-dark.svg">
    <img src="public/stargazer-light.svg" alt="Stargazer" width="460" align="center" />
  </picture>
</p>

<p align="center">
  <strong>Celebrate your GitHub milestones with cinematic social cards and 60fps MP4 loops.</strong>
</p>

<p align="center">
  <a href="https://github.com/CharanMunur/stargazer/stargazers"><img src="https://img.shields.io/github/stars/CharanMunur/stargazer?style=flat-square&color=FACC15" alt="GitHub stars" /></a>
  <a href="https://github.com/CharanMunur/stargazer/blob/master/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue?style=flat-square" alt="License" /></a>
  <img src="https://img.shields.io/badge/100%25-Client--Side-emerald?style=flat-square" alt="Client Side" />
  <img src="https://img.shields.io/badge/60fps-WebCodecs%20MP4-purple?style=flat-square" alt="60fps MP4" />
</p>

---

## Why Stargazer?

You just crossed 100, 1k, or 10k stars on your open-source project. Taking a static screenshot of your repo header is boring.

Stargazer turns your real stargazers and contributors into animated celebration videos and crisp 1600×900 cards ready to share on X/Twitter, LinkedIn, or Discord.

- **60fps In-Browser Video Export**: Hardware-accelerated MP4 loops baked right in your browser via WebCodecs. No cloud queues, no rendering servers.
- **100% Client-Side & Private**: Your GitHub tokens never leave browser memory. Zero tracking, zero databases.
- **Live Real-Time Previews**: Instant feedback as you customize repositories, contributors, and themes.
- **Curated Canvas Aesthetics**: High-speed warp streaks, orbital choreography, laurel achievement grids, and particle clusters.

---

## Quick Start

Run Stargazer locally:

```bash
# Clone the repository
git clone https://github.com/CharanMunur/stargazer.git
cd stargazer

# Install dependencies
bun install

# Start development server
bun dev
```

Visit [http://localhost:4321](http://localhost:4321) to explore or launch the studio at [http://localhost:4321/generate](http://localhost:4321/generate).

---

## Built With

- **[Astro](https://astro.build)** + **[React](https://react.dev)** – Static shell with interactive islands.
- **[Tailwind CSS](https://tailwindcss.com)** – Design system tokens and styling.
- **[Framer Motion](https://www.framer.com/motion/)** – Kinetic transitions and spring physics.
- **[HTML5 Canvas](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)** + **[mp4-muxer](https://github.com/Vanilagy/mp4-muxer)** – Zero-backend 60fps MP4 video encoding via WebCodecs.
- **[Lenis](https://github.com/darkroomengineering/lenis)** – Smooth inertia scrolling.

---

## Contributing

Pull requests are welcome. Feel free to open an issue or submit a PR for new canvas animations, layout ideas, or improvements.

1. Fork the repo and create your branch (`git checkout -b feature/cool-animation`).
2. Add your changes.
3. Open a Pull Request.

---

## License

[MIT](LICENSE) © [Charan Munur](https://github.com/CharanMunur)
