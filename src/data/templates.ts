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
  isNew?: boolean;
  /** Whether this template supports static PNG export (false = animation-only, MP4 only) */
  hasImage: boolean;
}

export const templatesData: readonly TemplateMeta[] = [
  {
    id: 'revolve',
    name: 'Revolve',
    isNew: true,
    hasImage: false,
  },
  {
    id: 'spotlight',
    name: 'Spotlight',
    isNew: true,
    hasImage: true,
  },
  {
    id: 'hyperdrive',
    name: 'Hyperdrive',
    isNew: true,
    hasImage: false,
  },
  {
    id: 'milestone',
    name: 'Milestone',
    hasImage: true,
  },
  {
    id: 'infinity',
    name: 'Infinity',
    hasImage: false,
  },
  {
    id: 'orbit',
    name: 'Orbit',
    hasImage: false,
  },
  {
    id: 'constellation',
    name: 'Constellation',
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
