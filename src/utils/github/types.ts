export type PrState = 'MERGED' | 'OPEN' | 'CLOSED';
export interface RawPullRequest {
  repo: string; // 'owner/name'
  repoUrl: string;
  repoDescription: string | null;
  repoLanguage: string | null;
  repoIsPrivate: boolean;
  number: number;
  title: string;
  url: string;
  state: PrState;
  isDraft: boolean;
  createdAt: string; // ISO
  mergedAt: string | null; // ISO
}
export interface RawRepo {
  nameWithOwner: string;
  name: string;
  description: string | null;
  url: string;
  homepageUrl: string | null;
  language: string | null;
  pushedAt: string;
  topics: string[];
  isPrivate: boolean;
  isFork: boolean;
  isArchived: boolean;
}
export interface GitHubSnapshot {
  fetchedAt: string;
  pullRequests: RawPullRequest[];
  repos: RawRepo[];
}

export interface GitHubGroup {
  key: string;
  name: string;
  repos: string[];
}
export interface CardOverride {
  name?: string;
  tag?: string;
  blurb?: string;
  order?: number;
}
export interface GitHubConfig {
  username: string;
  ownRepoTopic: string;
  groups: GitHubGroup[];
  overrides: Record<string, CardOverride>; // key: group key or 'owner/repo'
  exclude: string[]; // 'owner/repo' or 'owner/repo#123'
  maxCards: number; // 6
  activityRows: number; // 6
  activityPerCard: number; // 2
}

export interface PrLink {
  label: string; // '#77' or 'kividb#636'
  url: string;
}
export interface OssCardData {
  key: string; // group key or 'owner/repo'
  name: string;
  owner: string; // 'kividbio'
  tag: string;
  blurb: string;
  url: string; // first repo's URL
  merged: number;
  open: number;
  prLinks: PrLink[]; // <= 3, newest merged first
  moreCount: number; // merged - prLinks.length
  moreUrl: string;
  latestMergedAt: string;
}
export interface ActivityItem {
  cardKey: string;
  label: string; // 'kividb-operator#83'
  title: string; // cleaned
  url: string;
  state: 'merged' | 'open';
  at: string; // mergedAt ?? createdAt
}
export interface ActivitySummary {
  items: ActivityItem[];
  merged: number;
  open: number;
  projects: number;
}
export interface OwnRepoCard {
  name: string;
  blurb: string;
  language: string | null;
  url: string;
  homepageUrl: string | null;
  pushedAt: string;
}
export interface PortfolioData {
  fetchedAt: string;
  oss: { cards: OssCardData[]; total: number; allPrsUrl: string };
  activity: ActivitySummary;
  ownRepos: OwnRepoCard[];
}
