export interface TemplateInfo {
  id: 'counter' | 'ticker' | 'orbit' | 'constellation';
  name: string;
  summary: string;
  description: string;
  specs: {
    resolution: string;
    aspectRatio: string;
    framerate: string;
    capacity: string;
    physics: string;
    exportFormats: string;
  };
  useCases: string[];
}

export const templatesList: TemplateInfo[] = [
  {
    id: 'counter',
    name: 'Counter',
    summary: 'Symmetrical laurel milestone card displaying numeric counts for stars, forks, and days alongside a 16-avatar grid.',
    description:
      'The Counter template organizes repository metrics into a classical symmetrical composition. You can track stars, forks, and active repository days with linear counting transitions, flanked by twin laurel branches and an organized grid of sixteen recent stargazers.',
    specs: {
      resolution: '1600 × 900',
      aspectRatio: '16:9',
      framerate: '60 fps',
      capacity: '16 contributors',
      physics: 'Linear metric counter interpolation',
      exportFormats: 'PNG, MP4',
    },
    useCases: [
      'Repository milestone announcements (1k, 5k, 10k stars)',
      'Project anniversary and release notes graphics',
      'README hero header banners',
    ],
  },
  {
    id: 'ticker',
    name: 'Ticker',
    summary: 'Horizontal continuous marquee stream with contributor avatars and under-avatar star badges.',
    description:
      'The Ticker template arranges contributor avatars along a continuous horizontal track. You can display a stream of community members with momentum-based deceleration, center avatar scale magnification, and anchored five-pointed star badges.',
    specs: {
      resolution: '1600 × 900',
      aspectRatio: '16:9',
      framerate: '60 fps',
      capacity: '48 contributors',
      physics: 'Continuous horizontal glide with easeOutBack',
      exportFormats: 'PNG, MP4',
    },
    useCases: [
      'Continuous community activity showcase reels',
      'Documentation header feeds and release summaries',
      'Community milestone video clips for social feeds',
    ],
  },
  {
    id: 'orbit',
    name: '3D Orbit',
    summary: 'Spherical perspective arc with depth scaling, radial lighting, and elastic focal lock-in.',
    description:
      'The 3D Orbit template projects contributor avatars along a curved spherical trajectory. You can highlight contributors using dynamic perspective scaling that expands avatars from the horizon to the center focus point, illuminated by ambient radial lighting.',
    specs: {
      resolution: '1600 × 900',
      aspectRatio: '16:9',
      framerate: '60 fps',
      capacity: '24 contributors',
      physics: 'Parabolic dome trajectory with elastic snap',
      exportFormats: 'PNG, MP4',
    },
    useCases: [
      'Project launch videos and feature trailers',
      'High-energy community celebration clips',
      'Highlighting active contributors with focal spotlighting',
    ],
  },
  {
    id: 'constellation',
    name: 'Constellation',
    summary: 'Deterministic point-cloud scatter orbiting an elliptical central whitespace boundary.',
    description:
      'The Constellation template distributes contributor avatars in an organic scatter cloud. You can present large communities around a protected elliptical whitespace zone that frames the repository mascot, name, and total star count.',
    specs: {
      resolution: '1600 × 900',
      aspectRatio: '16:9',
      framerate: '60 fps',
      capacity: '48+ contributors',
      physics: 'Radial Euclidean distance opacity falloff',
      exportFormats: 'PNG, MP4',
    },
    useCases: [
      'Repositories with large contributor communities (1,000+ stars)',
      'Minimalist community appreciation banners',
      'High-resolution wallpapers and social media cards',
    ],
  },
];

export const templatesMap = new Map<string, TemplateInfo>(
  templatesList.map((tmpl) => [tmpl.id, tmpl])
);
