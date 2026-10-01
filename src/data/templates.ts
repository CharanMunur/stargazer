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
    | 'hyperdrive'
    | 'blackhole';
  name: string;
  isNew?: boolean;
  /** Whether this template supports static PNG export (false = animation-only, MP4 only) */
  hasImage: boolean;
  /** Creator / Author name */
  by: string;
  /** Creator portfolio or website URL */
  url: string;
}

export const templatesData: readonly TemplateMeta[] = [
  {
    id: 'blackhole',
    name: 'Blackhole',
    isNew: true,
    hasImage: true,
    by: 'CharanMunur',
    url: 'https://charanmunur.in',
  },
  {
    id: 'revolve',
    name: 'Revolve',
    isNew: true,
    hasImage: false,
    by: 'CharanMunur',
    url: 'https://charanmunur.in',
  },
  {
    id: 'spotlight',
    name: 'Spotlight',
    isNew: true,
    hasImage: true,
    by: 'CharanMunur',
    url: 'https://charanmunur.in',
  },
  {
    id: 'hyperdrive',
    name: 'Hyperdrive',
    isNew: true,
    hasImage: false,
    by: 'Jeheskiel Sunloy',
    url: 'https://jeheskielsunloy.com/',
  },
  {
    id: 'milestone',
    name: 'Milestone',
    hasImage: true,
    by: 'Dev Chauhan',
    url: 'https://devchauhan.in/',
  },
  {
    id: 'infinity',
    name: 'Infinity',
    hasImage: false,
    by: 'CharanMunur',
    url: 'https://charanmunur.in',
  },
  {
    id: 'orbit',
    name: 'Orbit',
    hasImage: false,
    by: 'Jay Sharma',
    url: 'https://www.radiumcoders.com/',
  },
  {
    id: 'constellation',
    name: 'Constellation',
    hasImage: false,
    by: 'CharanMunur',
    url: 'https://charanmunur.in',
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
