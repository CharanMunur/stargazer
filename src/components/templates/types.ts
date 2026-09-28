export interface StargazerUser {
  login: string;
  avatarUrl: string;
}

export interface TemplateData {
  owner: string;
  repo: string;
  stars: number;
  forks: number;
  days: number;
  ownerAvatarUrl?: string;
  stargazers: StargazerUser[];
}

export interface TemplateCardProps {
  data: TemplateData;
  theme?: 'dark' | 'light';
  animated?: boolean;
  className?: string;
}
