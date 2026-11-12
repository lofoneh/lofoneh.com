import type {
  ActivityItem,
  ActivitySummary,
  GitHubConfig,
  GitHubSnapshot,
  OssCardData,
  OwnRepoCard,
  PortfolioData,
  RawPullRequest,
  RawRepo,
} from './types';

const SEARCH_URL = 'https://github.com/search?type=pullrequests&q=';

const byMergedDesc = (a: RawPullRequest, b: RawPullRequest) =>
  Date.parse(b.mergedAt ?? '') - Date.parse(a.mergedAt ?? '');

/** Strip a trailing "(#123)" issue/PR reference from a title. */
export function cleanTitle(title: string): string {
  return title.replace(/\s*\(#\d+\)\s*$/, '').trim();
}

/** Remove anything that belongs to a private repo. */
export function dropPrivate(s: GitHubSnapshot): GitHubSnapshot {
  return {
    ...s,
    pullRequests: s.pullRequests.filter((p) => !p.repoIsPrivate),
    repos: s.repos.filter((r) => !r.isPrivate),
  };
}

/** Public, non-draft, open or merged PRs to repos the user does not own and has not excluded. */
export function eligiblePrs(prs: RawPullRequest[], config: GitHubConfig): RawPullRequest[] {
  const own = config.username.toLowerCase();
  return prs.filter((p) => {
    if (p.repoIsPrivate || p.state === 'CLOSED' || p.isDraft) return false;
    if (p.repo.split('/')[0].toLowerCase() === own) return false;
    if (config.exclude.includes(p.repo) || config.exclude.includes(`${p.repo}#${p.number}`)) return false;
    return true;
  });
}

/** Group key when the repo belongs to a group, else 'owner/repo'. */
export function cardKeyFor(repo: string, config: GitHubConfig): string {
  return config.groups.find((g) => g.repos.includes(repo))?.key ?? repo;
}

/** Every qualifying card (at least one merged PR), fully sorted, not capped. */
export function buildAllOssCards(prs: RawPullRequest[], config: GitHubConfig): OssCardData[] {
  const buckets = new Map<string, RawPullRequest[]>();
  for (const p of eligiblePrs(prs, config)) {
    const key = cardKeyFor(p.repo, config);
    const list = buckets.get(key);
    if (list) list.push(p);
    else buckets.set(key, [p]);
  }

  const cards: OssCardData[] = [];
  for (const [key, list] of buckets) {
    const merged = list.filter((p) => p.state === 'MERGED').sort(byMergedDesc);
    if (merged.length === 0) continue;

    const group = config.groups.find((g) => g.key === key);
    const repos = group ? group.repos : [key];
    const firstRepo = repos[0];
    const override = config.overrides[key] ?? {};
    const latest = merged[0];

    const prLinks = merged.slice(0, 3).map((p) => ({
      label: p.repo === firstRepo ? `#${p.number}` : `${p.repo.split('/')[1]}#${p.number}`,
      url: p.url,
    }));

    cards.push({
      key,
      name: override.name ?? group?.name ?? firstRepo.split('/')[1],
      owner: firstRepo.split('/')[0],
      tag: override.tag ?? latest.repoLanguage ?? '',
      blurb: override.blurb ?? `latest: ${cleanTitle(latest.title)}`,
      url: `https://github.com/${firstRepo}`,
      merged: merged.length,
      open: list.filter((p) => p.state === 'OPEN').length,
      prLinks,
      moreCount: merged.length - prLinks.length,
      moreUrl:
        SEARCH_URL + encodeURIComponent(`is:pr author:${config.username} ${repos.map((r) => `repo:${r}`).join(' ')}`),
      latestMergedAt: latest.mergedAt ?? '',
    });
  }

  return cards.sort((a, b) => {
    const ao = config.overrides[a.key]?.order ?? Infinity;
    const bo = config.overrides[b.key]?.order ?? Infinity;
    if (ao !== bo) return ao - bo;
    if (a.merged !== b.merged) return b.merged - a.merged;
    return Date.parse(b.latestMergedAt) - Date.parse(a.latestMergedAt);
  });
}

export function buildOssCards(
  prs: RawPullRequest[],
  config: GitHubConfig
): { cards: OssCardData[]; total: number; allPrsUrl: string } {
  const all = buildAllOssCards(prs, config);
  const u = config.username;
  return {
    cards: all.slice(0, config.maxCards),
    total: all.length,
    allPrsUrl: SEARCH_URL + encodeURIComponent(`is:pr author:${u} is:public -user:${u}`),
  };
}

/** Recent contribution feed: newest first, capped per card and overall; totals cover every qualifying PR. */
export function buildActivity(prs: RawPullRequest[], config: GitHubConfig): ActivitySummary {
  const keys = new Set(buildAllOssCards(prs, config).map((c) => c.key));
  const qualifying = eligiblePrs(prs, config).filter((p) => keys.has(cardKeyFor(p.repo, config)));

  const all: ActivityItem[] = qualifying.map((p) => ({
    cardKey: cardKeyFor(p.repo, config),
    label: `${p.repo.split('/')[1]}#${p.number}`,
    title: cleanTitle(p.title),
    url: p.url,
    state: p.state === 'MERGED' ? 'merged' : 'open',
    at: p.mergedAt ?? p.createdAt,
  }));
  all.sort((a, b) => Date.parse(b.at) - Date.parse(a.at));

  const perCard = new Map<string, number>();
  const items: ActivityItem[] = [];
  for (const it of all) {
    if (items.length >= config.activityRows) break;
    const n = perCard.get(it.cardKey) ?? 0;
    if (n >= config.activityPerCard) continue;
    perCard.set(it.cardKey, n + 1);
    items.push(it);
  }

  return {
    items,
    merged: qualifying.filter((p) => p.state === 'MERGED').length,
    open: qualifying.filter((p) => p.state === 'OPEN').length,
    projects: keys.size,
  };
}

/** Public, non-fork, non-archived repos owned by the user that carry the portfolio topic. */
export function buildOwnRepos(repos: RawRepo[], config: GitHubConfig): OwnRepoCard[] {
  const me = config.username.toLowerCase();
  return repos
    .filter(
      (r) =>
        !r.isPrivate &&
        !r.isFork &&
        !r.isArchived &&
        r.nameWithOwner.split('/')[0].toLowerCase() === me &&
        r.topics.includes(config.ownRepoTopic)
    )
    .sort((a, b) => Date.parse(b.pushedAt) - Date.parse(a.pushedAt))
    .map((r) => ({
      name: r.name,
      blurb: config.overrides[r.nameWithOwner]?.blurb ?? r.description ?? '',
      language: r.language,
      url: r.url,
      homepageUrl: r.homepageUrl,
      pushedAt: r.pushedAt,
    }));
}

export function buildPortfolioData(snapshot: GitHubSnapshot, config: GitHubConfig): PortfolioData {
  const s = dropPrivate(snapshot);
  return {
    fetchedAt: s.fetchedAt,
    oss: buildOssCards(s.pullRequests, config),
    activity: buildActivity(s.pullRequests, config),
    ownRepos: buildOwnRepos(s.repos, config),
  };
}
