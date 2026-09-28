export type HowToItem = {
  id: string;
  name: string;
  description: string;
  link?: string;
  linkText?: string;
  tag?: string;
};

export type HowToCategory = {
  id: string;
  title: string;
  description: string;
  items: HowToItem[];
};

export const howToData: HowToCategory[] = [
  {
    id: "creating-a-github-pat",
    title: "Creating a GitHub Personal Access Token",
    description:
      "GitHub restricts unauthenticated API calls to 60 requests per hour. Creating a personal access token increases your limit to 5,000 requests/hr so complete stargazer histories load instantly without hitting rate limits.",
    items: [
      {
        id: "open-token-settings",
        name: "Open Token Settings",
        tag: "github.com",
        description:
          "Sign in to GitHub, click your profile avatar in the top right, go to Settings → Developer settings → Personal access tokens → Tokens (classic). Alternatively, use the direct generation link below.",
        link: "https://github.com/settings/tokens/new?description=Stargazer&scopes=public_repo",
        linkText: "Generate Token Page",
      },
      {
        id: "select-classic-token",
        name: "Select Classic Token",
        tag: "Classic Token",
        description:
          "Choose 'Generate new token (classic)'. Classic tokens provide simple public read access without requiring fine-grained repository selections or organization approvals.",
      },
      {
        id: "set-note-and-expiration",
        name: "Set Note & Expiration",
        tag: "Configuration",
        description:
          "In the Note field, give your token a recognizable name (e.g. 'Stargazer'). Choose an expiration period such as 30 days, 90 days, or No expiration based on your preference.",
      },
      {
        id: "select-public-repo-scope",
        name: "Select Public Repo Scope",
        tag: "public_repo",
        description:
          "Under 'Select scopes', check the 'public_repo' checkbox. Stargazer only requires public read access to repository stargazers and avatars—no private repository permissions or write rights are needed.",
      },
      {
        id: "generate-and-copy-token",
        name: "Generate & Copy Token",
        tag: "ghp_...",
        description:
          "Scroll to the bottom of the page and click the green 'Generate token' button. Copy your generated token string immediately—GitHub will never display it again once you navigate away.",
      },
    ],
  },
  {
    id: "customizing-and-exporting",
    title: "Customizing & Exporting Your Card",
    description:
      "Once you have your token, navigate to the Studio to generate your personalized visual assets in real time.",
    items: [
      {
        id: "enter-repo-and-pat",
        name: "Enter Repository & Paste Token",
        tag: "Studio Input",
        description:
          "Enter your target repository in 'owner/repo' format (e.g., 'CharanMunur/stargazer' or 'facebook/react') and paste your copied token into the GitHub PAT field. Your token is stored purely in browser memory for the active session and is never persisted to localStorage or sent to external servers.",
        link: "/generate",
        linkText: "Open Studio",
      },
      {
        id: "fetch-stargazers",
        name: "Fetch Live Stargazers",
        tag: "Real-time API",
        description:
          "Click 'Fetch Stargazers'. The generator connects to GitHub's REST API, streaming real stargazer profiles, usernames, and profile avatars directly onto the live canvas.",
      },
      {
        id: "choose-stargazers-order",
        name: "Choose Stargazers Ordering",
        tag: "Latest · Earliest",
        description:
          "Toggle between 'Latest' to highlight your newest supporters or 'Earliest' to celebrate the original stargazers who supported your project from day one.",
      },
      {
        id: "select-theme-and-template",
        name: "Select Theme & Template",
        tag: "Dark · Light",
        description:
          "Switch between Dark and Light color palettes, or pick from our curated collection of templates (Counter, Ticker, Orbit, Constellation) tailored to different milestone moments.",
      },
      {
        id: "export-png-or-mp4",
        name: "Export PNG or 60fps MP4",
        tag: "Download",
        description:
          "Select 'PNG' for high-resolution static cards or 'MP4' for seamless 60fps looped videos, then click the download button beneath the canvas to render and save directly in your browser.",
      },
    ],
  },
];
