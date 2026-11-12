import type { GitHubSnapshot, PrState, RawPullRequest, RawRepo } from './types';

const ENDPOINT = 'https://api.github.com/graphql';

const SEARCH_QUERY = `query ($q: String!, $after: String) {
  search(query: $q, type: ISSUE, first: 100, after: $after) {
    pageInfo { hasNextPage endCursor }
    nodes { ... on PullRequest { number title url state isDraft createdAt mergedAt
      repository { nameWithOwner url description isPrivate primaryLanguage { name } } } }
  }
}`;

const REPOS_QUERY = `query ($login: String!, $after: String) {
  user(login: $login) {
    repositories(first: 100, after: $after, privacy: PUBLIC, isFork: false, ownerAffiliations: OWNER) {
      pageInfo { hasNextPage endCursor }
      nodes { name nameWithOwner description url homepageUrl isPrivate isFork isArchived pushedAt
        primaryLanguage { name } repositoryTopics(first: 20) { nodes { topic { name } } } }
    }
  }
}`;

interface PageInfo {
  hasNextPage: boolean;
  endCursor: string | null;
}
interface Connection<T> {
  pageInfo: PageInfo;
  nodes: T[];
}
interface GqlBody<T> {
  data?: T;
  errors?: Array<{ message?: string }>;
}
interface PrNode {
  number: number;
  title: string;
  url: string;
  state: PrState;
  isDraft: boolean;
  createdAt: string;
  mergedAt: string | null;
  repository: {
    nameWithOwner: string;
    url: string;
    description: string | null;
    isPrivate: boolean;
    primaryLanguage: { name: string } | null;
  };
}
interface RepoNode {
  name: string;
  nameWithOwner: string;
  description: string | null;
  url: string;
  homepageUrl: string | null;
  isPrivate: boolean;
  isFork: boolean;
  isArchived: boolean;
  pushedAt: string;
  primaryLanguage: { name: string } | null;
  repositoryTopics: { nodes: Array<{ topic: { name: string } }> };
}

export async function fetchSnapshot(opts: {
  token: string;
  username: string;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
}): Promise<GitHubSnapshot> {
  const { token, username, timeoutMs = 20000, fetchImpl = fetch } = opts;
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  async function gql<T>(query: string, variables: Record<string, unknown>): Promise<T> {
    let res: Response;
    try {
      res = await fetchImpl(ENDPOINT, {
        method: 'POST',
        headers: { Authorization: `bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, variables }),
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(`GitHub GraphQL request failed with HTTP ${res.status}`);
      const body = (await res.json()) as GqlBody<T>;
      if (body.errors?.length) throw new Error(`GitHub GraphQL error: ${body.errors[0].message ?? 'unknown'}`);
      if (!body.data) throw new Error('GitHub GraphQL response had no data');
      return body.data;
    } catch (err) {
      if (timedOut) throw new Error(`GitHub fetch timed out after ${timeoutMs}ms`, { cause: err });
      throw err;
    }
  }

  async function paginate<T, D>(
    query: string,
    vars: Record<string, unknown>,
    pick: (data: D) => Connection<T>
  ): Promise<T[]> {
    const out: T[] = [];
    let after: string | null = null;
    for (;;) {
      const conn = pick(await gql<D>(query, { ...vars, after }));
      out.push(...conn.nodes);
      if (!conn.pageInfo.hasNextPage || !conn.pageInfo.endCursor) break;
      after = conn.pageInfo.endCursor;
    }
    return out;
  }

  try {
    const prNodes = await paginate<Partial<PrNode>, { search: Connection<Partial<PrNode>> }>(
      SEARCH_QUERY,
      { q: `is:pr author:${username} is:public -user:${username}` },
      (d) => d.search
    );
    const repoNodes = await paginate<RepoNode, { user: { repositories: Connection<RepoNode> } }>(
      REPOS_QUERY,
      { login: username },
      (d) => d.user.repositories
    );

    const pullRequests: RawPullRequest[] = prNodes
      .filter((n): n is PrNode => typeof n.number === 'number' && !!n.repository)
      .map((n) => ({
        repo: n.repository.nameWithOwner,
        repoUrl: n.repository.url,
        repoDescription: n.repository.description ?? null,
        repoLanguage: n.repository.primaryLanguage?.name ?? null,
        repoIsPrivate: n.repository.isPrivate,
        number: n.number,
        title: n.title,
        url: n.url,
        state: n.state,
        isDraft: n.isDraft,
        createdAt: n.createdAt,
        mergedAt: n.mergedAt ?? null,
      }));

    const repos: RawRepo[] = repoNodes.map((r) => ({
      nameWithOwner: r.nameWithOwner,
      name: r.name,
      description: r.description ?? null,
      url: r.url,
      homepageUrl: r.homepageUrl ?? null,
      language: r.primaryLanguage?.name ?? null,
      pushedAt: r.pushedAt,
      topics: (r.repositoryTopics?.nodes ?? []).map((t) => t.topic.name),
      isPrivate: r.isPrivate,
      isFork: r.isFork,
      isArchived: r.isArchived,
    }));

    return { fetchedAt: new Date().toISOString(), pullRequests, repos };
  } finally {
    clearTimeout(timer);
  }
}
