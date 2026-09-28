import type { TemplateData } from '../components/templates/types';
import sampleStargazers from './sampleStargazers.json';

export interface TemplateMeta {
  id: 'counter' | 'ticker' | 'orbit' | 'constellation';
  name: string;
  tag: string;
  description: string;
}

export const templatesData: readonly TemplateMeta[] = [
  {
    id: 'counter',
    name: 'Counter',
    tag: 'Milestone',
    description: 'Symmetrical laurel milestone card with dynamic metric counters and 16-contributor grid.',
  },
  {
    id: 'ticker',
    name: 'Ticker',
    tag: 'Marquee Loop',
    description: 'Continuous horizontal glide marquee with momentum physics and contributor star badges.',
  },
  {
    id: 'orbit',
    name: '3D Orbit',
    tag: '3D WebGL',
    description: 'Multi-ring 3D spherical orbits rotating contributor avatars around your repository core.',
  },
  {
    id: 'constellation',
    name: 'Constellation',
    tag: 'Particle Graph',
    description: 'Dynamic gravity nodes and floating avatars celebrating community stargazers.',
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
