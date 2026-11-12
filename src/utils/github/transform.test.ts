import { expect, test } from 'bun:test';
import { buildAllOssCards, buildOssCards, cardKeyFor, cleanTitle, dropPrivate, eligiblePrs } from './transform';
import type { GitHubConfig, GitHubSnapshot, RawPullRequest, RawRepo } from './types';

let seq = 0;
function pr(over: Partial<RawPullRequest> = {}): RawPullRequest {
  seq += 1;
  const repo = over.repo ?? 'acme/widget';
  return {
    repo,
    repoUrl: `https://github.com/${repo}`,
    repoDescription: null,
    repoLanguage: null,
    repoIsPrivate: false,
    number: seq,
    title: `change ${seq}`,
    url: `https://github.com/${repo}/pull/${over.number ?? seq}`,
    state: 'MERGED',
    isDraft: false,
    createdAt: '2026-05-01T00:00:00Z',
    mergedAt: '2026-05-02T00:00:00Z',
    ...over,
  };
}
function cfg(over: Partial<GitHubConfig> = {}): GitHubConfig {
  return {
    username: 'lofoneh',
    ownRepoTopic: 'portfolio',
    groups: [],
    overrides: {},
    exclude: [],
    maxCards: 6,
    activityRows: 6,
    activityPerCard: 2,
    ...over,
  };
}
function repoOf(over: Partial<RawRepo> = {}): RawRepo {
  return {
    nameWithOwner: 'acme/widget',
    name: 'widget',
    description: null,
    url: 'https://github.com/acme/widget',
    homepageUrl: null,
    language: null,
    pushedAt: '2026-05-01T00:00:00Z',
    topics: [],
    isPrivate: false,
    isFork: false,
    isArchived: false,
    ...over,
  };
}

test('cleanTitle strips a trailing issue ref', () => {
  expect(cleanTitle('Replicated: fence the old master before a failover (#53)')).toBe(
    'Replicated: fence the old master before a failover'
  );
  expect(cleanTitle('fix(promotion): check http failure criteria before success')).toBe(
    'fix(promotion): check http failure criteria before success'
  );
});

test('dropPrivate removes private PRs and repos', () => {
  const snap: GitHubSnapshot = {
    fetchedAt: '2026-05-01T00:00:00Z',
    pullRequests: [pr({ repo: 'lofoneh/win-admin', repoIsPrivate: true }), pr({ repo: 'acme/widget' })],
    repos: [
      repoOf({ nameWithOwner: 'lofoneh/win-admin', name: 'win-admin', isPrivate: true }),
      repoOf({ nameWithOwner: 'acme/widget' }),
    ],
  };
  const out = dropPrivate(snap);
  expect(out.pullRequests.map((p) => p.repo)).toEqual(['acme/widget']);
  expect(out.repos.map((r) => r.nameWithOwner)).toEqual(['acme/widget']);
  expect(out.fetchedAt).toBe(snap.fetchedAt);
});

test('eligiblePrs drops private, closed, draft, own-repo and excluded PRs', () => {
  const keepMerged = pr({ repo: 'acme/widget', number: 1000 });
  const keepOpen = pr({ repo: 'acme/widget', number: 1001, state: 'OPEN', mergedAt: null });
  const input = [
    pr({ repo: 'lofoneh/win-admin', repoIsPrivate: true }),
    pr({ state: 'CLOSED', mergedAt: null }),
    pr({ isDraft: true, state: 'OPEN', mergedAt: null }),
    pr({ repo: 'lofoneh/kvlite' }),
    pr({ repo: 'Btk990/Peerly-App' }),
    pr({ repo: 'acme/widget', number: 7 }),
    keepMerged,
    keepOpen,
  ];
  const out = eligiblePrs(input, cfg({ exclude: ['Btk990/Peerly-App', 'acme/widget#7'] }));
  expect(out).toEqual([keepMerged, keepOpen]);
});

test('groups aggregate counts across their repos', () => {
  const config = cfg({
    groups: [{ key: 'kividb', name: 'KiviDB', repos: ['kividbio/kividb-operator', 'kividbio/kividb'] }],
  });
  const prs = [
    pr({ repo: 'kividbio/kividb-operator' }),
    pr({ repo: 'kividbio/kividb-operator' }),
    pr({ repo: 'kividbio/kividb-operator', state: 'OPEN', mergedAt: null }),
    pr({ repo: 'kividbio/kividb' }),
  ];
  const { cards, total } = buildOssCards(prs, config);
  expect(total).toBe(1);
  expect(cards).toHaveLength(1);
  expect(cards[0]).toMatchObject({ key: 'kividb', name: 'KiviDB', owner: 'kividbio', merged: 3, open: 1 });
});

test('a repo with only open PRs is hidden, but a grouped repo with none merged counts via its group', () => {
  const config = cfg({
    groups: [{ key: 'pgrun', name: 'PGRun', repos: ['pgrundev/pgbot', 'pgrundev/pggo'] }],
  });
  const prs = [
    pr({ repo: 'e2b-dev/runtime', state: 'OPEN', mergedAt: null }),
    pr({ repo: 'pgrundev/pgbot' }),
    pr({ repo: 'pgrundev/pggo', state: 'OPEN', mergedAt: null }),
  ];
  const { cards } = buildOssCards(prs, config);
  expect(cards.map((c) => c.key)).toEqual(['pgrun']);
  expect(cards[0].open).toBe(1);
});

test('pinned card first, then merged desc, then latest merge desc', () => {
  const config = cfg({
    groups: [{ key: 'kividb', name: 'KiviDB', repos: ['kividbio/kividb'] }],
    overrides: { kividb: { order: 0 } },
  });
  const merged = (repo: string, n: number, at: string) => Array.from({ length: n }, () => pr({ repo, mergedAt: at }));
  const prs = [
    ...merged('c/tie', 2, '2026-10-07T00:00:00Z'),
    ...merged('b/tie', 2, '2026-11-09T00:00:00Z'),
    ...merged('a/big', 5, '2026-01-01T00:00:00Z'),
    ...merged('kividbio/kividb', 1, '2026-01-01T00:00:00Z'),
  ];
  expect(buildOssCards(prs, config).cards.map((c) => c.key)).toEqual(['kividb', 'a/big', 'b/tie', 'c/tie']);
});

test('prLinks: 3 newest merged, cross-repo PRs prefixed, moreCount and moreUrl', () => {
  const config = cfg({
    groups: [{ key: 'kividb', name: 'KiviDB', repos: ['kividbio/kividb-operator', 'kividbio/kividb'] }],
  });
  const op = 'kividbio/kividb-operator';
  const m = (repo: string, number: number, mergedAt: string) =>
    pr({ repo, number, mergedAt, url: `https://github.com/${repo}/pull/${number}` });
  const prs = [
    m(op, 65, '2026-05-01T00:00:00Z'),
    m(op, 66, '2026-05-02T00:00:00Z'),
    m(op, 77, '2026-05-03T00:00:00Z'),
    m(op, 83, '2026-05-04T00:00:00Z'),
    m('kividbio/kividb', 636, '2026-05-05T00:00:00Z'),
  ];
  const card = buildOssCards(prs, config).cards[0];
  expect(card.prLinks.map((l) => l.label)).toEqual(['kividb#636', '#83', '#77']);
  expect(card.prLinks[0].url).toBe('https://github.com/kividbio/kividb/pull/636');
  expect(card.moreCount).toBe(2);
  expect(card.moreUrl).toContain('repo%3Akividbio%2Fkividb-operator');
  expect(card.moreUrl).toContain('repo%3Akividbio%2Fkividb');
  expect(card.latestMergedAt).toBe('2026-05-05T00:00:00Z');
});

test('defaults: name = repo name, tag = language, blurb = latest merged title; overrides win', () => {
  const prs = [
    pr({
      repo: 'akuity/kargo',
      repoLanguage: 'Go',
      repoDescription: 'Kargo repo description',
      title: 'fix(promotion): check http failure criteria before success (#12)',
    }),
  ];
  const card = buildOssCards(prs, cfg()).cards[0];
  expect(card.name).toBe('kargo');
  expect(card.tag).toBe('Go');
  expect(card.blurb).toBe('latest: fix(promotion): check http failure criteria before success');
  expect(card.blurb).not.toContain('Kargo repo description');

  const over = buildOssCards(prs, cfg({ overrides: { 'akuity/kargo': { name: 'Kargo', tag: 'GitOps', blurb: 'X' } } }))
    .cards[0];
  expect([over.name, over.tag, over.blurb]).toEqual(['Kargo', 'GitOps', 'X']);
});

test('cards cap at maxCards while total counts every qualifying card', () => {
  const prs = Array.from({ length: 8 }, (_, i) => pr({ repo: `org${i}/proj${i}` }));
  const out = buildOssCards(prs, cfg({ maxCards: 6 }));
  expect(out.cards).toHaveLength(6);
  expect(out.total).toBe(8);
  expect(out.allPrsUrl).toContain('is%3Apr');
  expect(out.allPrsUrl).toContain('author%3Alofoneh');
  expect(out.allPrsUrl).toContain('-user%3Alofoneh');
  expect(buildAllOssCards(prs, cfg({ maxCards: 6 }))).toHaveLength(8);
});

test('cardKeyFor returns the group key for grouped repos, else owner/repo', () => {
  const config = cfg({ groups: [{ key: 'kividb', name: 'KiviDB', repos: ['kividbio/kividb'] }] });
  expect(cardKeyFor('kividbio/kividb', config)).toBe('kividb');
  expect(cardKeyFor('akuity/kargo', config)).toBe('akuity/kargo');
});
