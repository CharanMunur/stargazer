# Contributing Guidelines

Thank you for contributing to Stargazer. We welcome pull requests for bug fixes, new features, and animation templates.

---

## Prerequisites & Development Setup

### Prerequisites
- **Bun** (v1.0.0 or higher) or **Node.js** (v18.0.0 or higher)

### Getting Started

1. **Fork the Repository**: First, click **Fork** on `CharanMunur/stargazer` on GitHub.
2. **Clone Your Fork**:
   ```bash
   git clone https://github.com/YOUR_USERNAME/stargazer.git
   cd stargazer
   ```
3. **Install Dependencies & Start Dev Server**:
   ```bash
   bun install
   bun dev
   ```
4. **Branch Off `main`**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

---

## Obtaining a Testing Token

To fetch real stargazer lists during local testing:
1. Go to **GitHub Settings → Developer Settings → Personal Access Tokens → Tokens (classic)**.
2. Generate a token with **no scopes checked** (metadata-only access for public repositories).
3. Paste the token into the Token input field in the local Studio UI (`http://localhost:3000/generate`).
4. **Security Note**: Tokens remain strictly in browser memory and are **never committed** to git or transmitted to any server.

---

## Open an Issue First

For **new animation templates** or **major feature changes**, please **open an issue to discuss your proposal first** before starting development. This ensures alignment on visual style, performance, and architecture so nobody spends days building something that cannot be merged.

---

## Types of Contributions

### 1. Bug Fixes & Feature Enhancements

- **Bug Reports & Fixes**: A good bug report or fix PR must include clear reproduction steps, expected versus actual behavior, and a description of the root cause fix.
- **Type Safety**: Maintain TypeScript definitions in `src/components/templates/types.ts`.
- **Client-Side Privacy**: Stargazer is 100% client-side. User data and tokens must stay in browser memory only.

---

### 2. Creating New Templates & Animations

Template contributions require creating both a **React DOM component** for web preview and a **Canvas 2D renderer** for PNG/MP4 exports with 1:1 visual and timing parity.

#### Requirements:
- **1600×900 Viewport**: All templates target a 1600×900 virtual canvas (16:9 aspect ratio) with responsive scaling.
- **React Preview Card**: `src/components/templates/<TemplateName>Card.tsx`
- **Canvas Renderer**: Add `render<TemplateName>` and asset preloading in `src/lib/canvasRenderer.ts`.
- **Time Parity**: Sync element entrance delays, rotation speeds, and count-up animations 1:1 between DOM and Canvas using elapsed time ($\text{tSec} = \text{progress} \times \text{durationSeconds}$).
- **Template Registration**: Register the template in `src/data/templates.ts` and `src/lib/videoExporter.ts`.

---

## Commit & Pull Request Guidelines

### Commit Message Style
- Use concise, descriptive commit messages in the imperative mood (e.g., `add blackhole template`, `fix orbit rotation speed`).
- **Zero Emojis**: Absolutely no emojis in code, commits, or PR descriptions.

### Verification & PR Submission Checklist
- [ ] Verify the build passes with zero errors using `bun run build`.
- [ ] Test in both **Light** and **Dark** themes.
- [ ] **Template PRs**: Include a screenshot or short video clip showing both the **React DOM preview** and the **exported MP4 video** so visual and speed parity can be verified.
