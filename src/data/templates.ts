import type { TemplateData } from '../components/templates/types';
import sampleStargazers from './sampleStargazers.json';

export interface TemplateMeta {
  id:
    | 'spotlight'
    | 'revolve'
    | 'milestone'
    | 'infinity'
    | 'orbit'
    | 'constellation'
    | 'hyperdrive';
  name: string;
  tag: string;
  description: string;
  /** Whether this template supports static PNG export (false = animation-only, MP4 only) */
  hasImage: boolean;
}

export const templatesData: readonly TemplateMeta[] = [
  {
    id: 'spotlight',
    name: 'Spotlight',
    tag: 'Keynote Editorial',
    description: 'Clean Apple-style keynote layout with display typography and an overlapping avatar stack.',
    hasImage: true,
  },
  {
    id: 'hyperdrive',
    name: 'Hyperdrive',
    tag: 'Light-Speed Jump',
    description: 'Anamorphic light-speed acceleration beams with burst-speed contributor avatars and shockwave rings.',
    hasImage: false,
  },
  {
    id: 'revolve',
    name: 'Revolve',
    tag: 'Concentric Orbits',
    description: 'Multi-ring concentric orbits revolving contributor avatars in opposing directions around live star metrics.',
    hasImage: false,
  },
  {
    id: 'milestone',
    name: 'Milestone',
    tag: 'Laurel Achievement',
    description: 'Symmetrical laurel milestone card with dynamic metric counters and 16-contributor grid.',
    hasImage: true,
  },
  {
    id: 'infinity',
    name: 'Infinity',
    tag: 'Marquee Loop',
    description: 'Continuous horizontal glide marquee with momentum physics and contributor star badges.',
    hasImage: false,
  },
  {
    id: 'orbit',
    name: '3D Orbit',
    tag: '3D WebGL',
    description: 'Multi-ring 3D spherical orbits rotating contributor avatars around your repository core.',
    hasImage: false,
  },
  {
    id: 'constellation',
    name: 'Constellation',
    tag: 'Particle Graph',
    description: 'Dynamic gravity nodes and floating avatars celebrating community stargazers.',
    hasImage: false,
  },
] as const;

export const initialSampleData: TemplateData = {
  owner: 'CharanMunur',
  repo: 'Portfolio',
  stars: 106,
  forks: 22,
  days: 131,
  ownerAvatarUrl: 'https://avatars.githubusercontent.com/u/105436608?v=4',
  stargazers: sampleStargazers,
};
