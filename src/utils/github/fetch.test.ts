import { expect, test } from 'bun:test';
import { fetchSnapshot } from './fetch';

interface Call {
  url: string;
  headers: Record<string, string>;
  variables: Record<string, unknown>;
}

function fakeFetch(bodies: Array<unknown | { status: number }>) {
  const calls: Call[] = [];
  const queue = [...bodies];
  const impl = (async (url: string, init: RequestInit) => {
    const parsed = JSON.parse(String(init.body));
    calls.push({ url, headers: init.headers as Record<string, string>, variables: parsed.variables });
    const next = queue.shift() as { status?: number } | undefined;
    if (next && typeof next.status === 'number') return new Response('boom', { status: next.status });
    return new Response(JSON.stringify(next), { status: 200 });
  }) as unknown as typeof fetch;
  return { impl, calls };
}

const prNode = {
  number: 83,
  title: 'Add thing',
  url: 'https://github.com/kividbio/kividb-operator/pull/83',
  state: 'MERGED',
  isDraft: false,
  createdAt: '2026-01-01T00:00:00Z',
  mergedAt: '2026-01-02T00:00:00Z',
  repository: {
    nameWithOwner: 'kividbio/kividb-operator',
    url: 'https://github.com/kividbio/kividb-operator',
    description: 'op',
    isPrivate: false,
    primaryLanguage: { name: 'Go' },
  },
};
const repoNode = {
  name: 'kvlite',
  nameWithOwner: 'lofoneh/kvlite',
  description: null,
  url: 'https://github.com/lofoneh/kvlite',
  homepageUrl: null,
  isPrivate: false,
  isFork: false,
  isArchived: false,
  pushedAt: '2026-02-01T00:00:00Z',
  primaryLanguage: { name: 'Go' },
  repositoryTopics: { nodes: [{ topic: { name: 'portfolio' } }] },
};
const search = (nodes: unknown[], next = false, cursor: string | null = null, issueCount?: number) => ({
  data: {
    search: { issueCount: issueCount ?? nodes.length, pageInfo: { hasNextPage: next, endCursor: cursor }, nodes },
  },
});
const repos = (nodes: unknown[]) => ({
  data: { user: { repositories: { pageInfo: { hasNextPage: false, endCursor: null }, nodes } } },
});

test('maps a PR node and a repo node to the snapshot shape', async () => {
  const { impl } = fakeFetch([search([prNode, {}]), repos([repoNode])]);
  const snap = await fetchSnapshot({ token: 't', username: 'lofoneh', fetchImpl: impl });
  expect(snap.pullRequests).toEqual([
    {
      repo: 'kividbio/kividb-operator',
      repoUrl: 'https://github.com/kividbio/kividb-operator',
      repoDescription: 'op',
      repoLanguage: 'Go',
      repoIsPrivate: false,
      number: 83,
      title: 'Add thing',
      url: 'https://github.com/kividbio/kividb-operator/pull/83',
      state: 'MERGED',
      isDraft: false,
      createdAt: '2026-01-01T00:00:00Z',
      mergedAt: '2026-01-02T00:00:00Z',
    },
  ]);
  expect(snap.repos[0]).toEqual({
    nameWithOwner: 'lofoneh/kvlite',
    name: 'kvlite',
    description: null,
    url: 'https://github.com/lofoneh/kvlite',
    homepageUrl: null,
    language: 'Go',
    pushedAt: '2026-02-01T00:00:00Z',
    topics: ['portfolio'],
    isPrivate: false,
    isFork: false,
    isArchived: false,
  });
  expect(typeof snap.fetchedAt).toBe('string');
});

test('sends a bearer token and an is:public search query', async () => {
  const { impl, calls } = fakeFetch([search([]), repos([])]);
  await fetchSnapshot({ token: 't0k', username: 'lofoneh', fetchImpl: impl });
  expect(calls[0].url).toBe('https://api.github.com/graphql');
  expect(calls[0].headers.Authorization).toBe('bearer t0k');
  expect(calls[0].variables.q).toBe('is:pr author:lofoneh is:public -user:lofoneh');
});

test('follows pageInfo across pages', async () => {
  const { impl, calls } = fakeFetch([search([prNode], true, 'c1', 2), search([prNode], false, null, 2), repos([])]);
  const snap = await fetchSnapshot({ token: 't', username: 'lofoneh', fetchImpl: impl });
  expect(snap.pullRequests.length).toBe(2);
  expect(calls[1].variables.after).toBe('c1');
});

test('throws on GraphQL errors even with HTTP 200', async () => {
  const { impl } = fakeFetch([{ errors: [{ message: 'API rate limit exceeded' }] }]);
  await expect(fetchSnapshot({ token: 't', username: 'lofoneh', fetchImpl: impl })).rejects.toThrow(/rate limit/);
});

test('throws on a non-2xx response', async () => {
  const { impl } = fakeFetch([{ status: 502 }]);
  await expect(fetchSnapshot({ token: 't', username: 'lofoneh', fetchImpl: impl })).rejects.toThrow(/502/);
});

test('rejects when the API hangs past timeoutMs', async () => {
  const impl = ((_url: string, init: RequestInit) =>
    new Promise((_res, rej) => {
      init.signal?.addEventListener('abort', () => rej(new DOMException('aborted', 'AbortError')));
    })) as unknown as typeof fetch;
  await expect(fetchSnapshot({ token: 't', username: 'lofoneh', timeoutMs: 50, fetchImpl: impl })).rejects.toThrow(
    /timed out/i
  );
});

test('rejects when the search returns fewer PRs than issueCount', async () => {
  const { impl } = fakeFetch([search([prNode], false, null, 5), repos([])]);
  await expect(fetchSnapshot({ token: 't', username: 'lofoneh', fetchImpl: impl })).rejects.toThrow(/1.*5|5.*1/);
});

test('rejects when hasNextPage is true but endCursor is missing', async () => {
  const { impl } = fakeFetch([search([prNode], true, null, 2), repos([])]);
  await expect(fetchSnapshot({ token: 't', username: 'lofoneh', fetchImpl: impl })).rejects.toThrow(/endCursor/);
});
