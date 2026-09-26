<p align="center">
  <img src="client/public/stargazer-logo.svg" alt="stargazer logo" width="520" align="center" />
</p>

<p align="center">
  <strong>Built with Go 2D Engine, Astro, React, Tailwind CSS, shadcn/ui</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Go-00ADD8?style=for-the-badge&logo=go&logoColor=white" alt="Go" />
  <img src="https://img.shields.io/badge/Astro-BC52EE?style=for-the-badge&logo=astro&logoColor=white" alt="Astro" />
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/shadcn%2Fui-000000?style=for-the-badge&logo=shadcnui&logoColor=white" alt="shadcn/ui" />
</p>

---

## How It Works

stargazer generates customized GitHub repository stargazer cards and animated GIFs for README profiles.

### Architecture Overview

1. **Frontend Request**: The Astro + React web interface collects the repository name (`owner/repo`), GitHub Personal Access Token (PAT), template design, background style, and desired output format (PNG or GIF).
2. **Backend API Execution**: The request is submitted to the Go backend API server (`server/cmd/api`).
3. **Stargazer Data & Avatar Fetching**: The backend uses the GitHub REST API client (`internal/github`) to fetch the list of stargazers for the specified repository and concurrently downloads their profile avatars.
4. **2D Graphics Rendering Engine**: The Go 2D rendering package (`internal/render`) computes layout positions and renders pixel-perfect graphics using vector mathematics:
   - **Constellation Template**: Dynamically scatters avatars outward from the canvas center. An oval whitespace keep-clear zone preserves legibility around the central title, repo name, mascot, and star count. Radial opacity falloff computes Euclidean distance from center to corners, smoothly fading avatars near the whitespace boundary while keeping corner avatars vivid.
   - **Ticker / Marquee Template**: Computes seamless horizontal scrolling of avatar rows and counter badges frame-by-frame.
   - **Counter Template**: Renders avatar grid layouts with repo statistics.
5. **GIF Animation & Palette Quantization**: For GIF exports, the engine renders individual frames, applies color palette quantization, and encodes a high-efficiency animated GIF stream.
6. **Direct Binary Delivery**: The output image stream (`image/png` or `image/gif`) is returned to the client browser for live preview and direct download.

---

## Repository Architecture

```text
stargazer/
├── client/              # Astro + React + Tailwind CSS + shadcn frontend
│   ├── src/
│   │   ├── components/  # React CardGenerator component & UI elements
│   │   ├── pages/       # Astro index page
│   │   └── styles/      # Global Tailwind styles
│   ├── astro.config.mjs
│   └── package.json
├── server/              # Go API Server & 2D Rendering Engine
│   ├── cmd/api/         # HTTP API Server entrypoint
│   ├── internal/
│   │   ├── github/      # GitHub REST API Stargazers client
│   │   └── render/      # Template engines & graphics utils
│   └── assets/          # Fonts & SVG vectors
└── README.md
```

---

## Quick Start

### 1. Run the Backend API (`server/`)

Prerequisites: Go 1.22+

```bash
cd server
go run ./cmd/api
```

The server listens on `http://localhost:8080`.

### 2. Run the Frontend (`client/`)

Prerequisites: Bun 1.0+ (or Node.js 20+)

```bash
cd client
bun install
bun run dev
```

Open `http://localhost:3000` in your browser.

---

## HTTP API Contract

### `POST /api/generate`

Generates a stargazer image or animation card.

#### Request Body (JSON)

```json
{
  "token": "ghp_your_github_personal_access_token",
  "repo": "owner/repository",
  "template": "constellation",
  "format": "png"
}
```

#### Parameters

| Field | Type | Options | Description |
| :--- | :--- | :--- | :--- |
| `token` | `string` | *(Required)* | GitHub Personal Access Token (PAT) with `read:user` or public access. |
| `repo` | `string` | *(Required)* | Repository path in `owner/repo` format. |
| `template` | `string` | `"counter"` \| `"ticker"` \| `"orbit"` \| `"constellation"` | Design template type. Defaults to `"counter"`. |
| `format` | `string` | `"png"` \| `"gif"` | Export format. Defaults to `"png"`. |

#### Responses

- **200 OK**: Binary image stream (`image/png` or `image/gif`).
- **400 Bad Request**: Missing required parameters.
- **401 Unauthorized**: Invalid or expired GitHub token.
- **404 Not Found**: Repository not found.
- **429 Too Many Requests**: GitHub API rate limit reached.

---

## Security & Privacy

- **No Data Persistence**: The server contains no database layer.
- **Zero Token Logging**: Tokens are passed directly to GitHub API request headers in memory and discarded immediately after rendering.
