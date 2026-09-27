# Design & Architecture Rules for Stargazer

These rules govern the UI/UX design language, component architecture, animations, and security patterns for the Stargazer project.

---

## 1. Pill & Rounded Geometry System

- **Full Pill Geometry**: All interactive inputs, buttons, segmented tabs, and status badges MUST use `rounded-full`.
  - Input fields: `rounded-full bg-text-base/[0.04] border border-text-base/10 px-4 py-2.5 text-sm`
  - Action buttons (Download, Fetch Stargazers, Open in Studio): `rounded-full bg-text-base text-background hover:bg-text-base/90 font-semibold shadow-2xs`
  - Segmented control tracks and tab buttons: `rounded-full` tracks and `rounded-full` active/inactive buttons.
- **Card Framing**:
  - Main template cards: `rounded-3xl` outer container with `rounded-2xl` inner 16:9 canvas frame.
  - Secondary/sidebar template cards: `rounded-2xl` outer container with `rounded-xl` inner canvas frame.

---

## 2. Typography & Hierarchy

- **No All-Caps Headings**: Sidebar control headings must never use `uppercase tracking-wider`. Always capitalize only the first letter (`text-sm font-medium text-text-base/70`).
- **Font Sizing**: Ensure comfortable, legible typography:
  - Breadcrumbs: `text-sm text-text-base/60` with pill links (`Home / Studio / {Page}`)
  - Section headings: `text-base sm:text-lg font-bold tracking-tight text-text-base`
  - Body text: `text-base text-text-base/80 leading-7`
- **Documentation Style**: Documentation pages (e.g. `/how-to`) must follow the **shadcn/ui documentation design language**:
  - Clean editorial headings (`h2` at `text-2xl font-bold tracking-tight text-foreground border-b border-border/40 pb-3`, `h3` at `text-lg font-semibold tracking-tight text-foreground`).
  - Inline monospace code chips: `<code className="px-1.5 py-0.5 rounded-md bg-muted text-sm font-mono text-foreground font-normal">`.
  - Unordered bullet principles with bold leading labels.

---

## 3. Navigation & Table of Contents (TOC)

- **Sticky Right Sidebar**: Documentation pages must feature an understated "On This Page" sidebar within the standard `max-w-6xl` container (`w-64 shrink-0 sticky top-24 self-start`).
- **Live Scrollspy**: Automatically track scroll position and highlight the active section and sub-step (`text-foreground font-medium` for active items, `text-muted-foreground/70 hover:text-foreground` for inactive items).
- **Smooth Navigation**: Anchor links must scroll smoothly into view with appropriate top offset (`scroll-mt-24` / `scroll-mt-28`).
- **No Clutter**: Do not add unnecessary promo cards, banners, or decorative boxes to the TOC sidebar.

---

## 4. Animation & Scrolling Architecture

All page and component animations follow a 4-layer architecture:
1. **Scroll & Entrance Animations (`framer-motion`)**:
   - Use `<FadeIn>` with `whileInView="visible"` and `viewport={{ once: true, margin: '-40px' }}`.
   - Headers and controls animate first with subtle offsets (`yOffset={10}, duration={0.4}`).
   - Grid cards and step items cascade smoothly with dynamic delays (`delay={0.15 + idx * 0.05}`).
2. **Smooth Inertia Scrolling (`lenis`)**:
   - Initialized via `<SmoothScroll client:load />` with `lerp: 0.15` and `wheelMultiplier: 1.2` over a `requestAnimationFrame` loop.
3. **CSS Keyframe Animations**:
   - Keyframes configured in Tailwind for `marquee-left`, `marquee-right`, `dot-flicker`, and `accordion-down`/`accordion-up`.
4. **Scroll Restoration**:
   - Route and popstate navigation must reset window scroll to `(0, 0)` so newly mounted pages play their top-to-bottom entrance animations.

---

## 5. Theme State & Lenis Protection

- **Card Export Theme Isolation**: The generator's Theme tab is an export property for the card being designed. Once a user clicks `Dark` or `Light`, that selection is locked (`userCustomizedTheme.current = true`).
- **Scroll Class Mutation Protection**: `MutationObserver` instances on `document.documentElement` MUST verify `currentDark !== lastDark`. They must NEVER trigger state changes when Lenis modifies scrolling classes (`lenis-scrolling`, `lenis-smooth`).

---

## 6. Privacy & Ephemeral Session Storage

- **Zero LocalStorage for Tokens**: GitHub Personal Access Tokens and repository inputs must never be saved to `localStorage` or `sessionStorage`.
- **In-Memory Only**: Tokens must remain purely in client-side React state for the active browser session.
- **Client-Side Execution**: All GitHub API queries, DOM image rasterization, and MP4 encoding run directly in the user's browser without intermediate backend servers.

---

## 7. Studio Layout & Synchronization

- **Top & Bottom Alignment**: The Studio layout (`/generate`) must maintain synchronized top and bottom bounds between the left column (Canvas Stage + Download button) and the right column (Configuration controls) using `lg:items-stretch` and `flex flex-col justify-between`.
- **Download Action Placement**: The primary Download button is positioned directly beneath the 16:9 canvas stage at full width.
- **Fetch Stargazers Button**: Styled as a solid primary pill (`rounded-full bg-text-base text-background hover:bg-text-base/90`) with an inline refresh spinner icon.

---

## 8. Commit & Constraint Requirements

- **Iconography**: Rely strictly on `lucide-react` for UI icons. Never install or reference external unapproved icon libraries.
- **Git Ignore**: Ensure `design.md` remains in `.gitignore`.
