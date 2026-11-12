import { expect, test } from 'bun:test';
import {
  buildActivity,
  buildAllOssCards,
  buildOssCards,
  buildOwnRepos,
  buildPortfolioData,
  cardKeyFor,
  cleanTitle,
  dropPrivate,
  eligiblePrs,
} from './transform';
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
  expect(card.moreUrl).toContain('is%3Amerged');
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

const day = (d: number) => `2026-06-${String(d).padStart(2, '0')}T00:00:00Z`;

test('activity: newest first by mergedAt ?? createdAt, <= 2 per card, <= 6 total', () => {
  const config = cfg({
    groups: [{ key: 'kividb', name: 'KiviDB', repos: ['kividbio/kividb-operator', 'kividbio/kividb'] }],
  });
  const op = 'kividbio/kividb-operator';
  const prs = [
    pr({ repo: op, number: 80, mergedAt: day(20) }),
    pr({ repo: op, number: 81, mergedAt: day(21) }),
    pr({ repo: op, number: 82, mergedAt: day(22) }),
    pr({ repo: op, number: 83, mergedAt: day(23) }),
    ...['b', 'c', 'd'].flatMap((o, i) => [
      pr({ repo: `${o}/proj`, mergedAt: day(10 + i * 2) }),
      pr({ repo: `${o}/proj`, mergedAt: day(11 + i * 2) }),
    ]),
  ];
  const { items } = buildActivity(prs, config);
  expect(items).toHaveLength(6);
  expect(items.filter((i) => i.cardKey === 'kividb')).toHaveLength(2);
  const ats = items.map((i) => Date.parse(i.at));
  expect(ats).toEqual([...ats].sort((a, b) => b - a));
  expect(items[0].label).toBe('kividb-operator#83');
});

test('activity: open PRs use createdAt and state "open"; titles are cleaned', () => {
  const prs = [
    pr({ repo: 'acme/widget', mergedAt: day(1) }),
    pr({
      repo: 'acme/widget',
      number: 9,
      title: 'x (#9)',
      state: 'OPEN',
      mergedAt: null,
      createdAt: day(15),
    }),
  ];
  const { items } = buildActivity(prs, cfg());
  const open = items.find((i) => i.state === 'open');
  expect(open).toBeDefined();
  expect(open?.at).toBe(day(15));
  expect(open?.title).toBe('x');
  expect(open?.label).toBe('widget#9');
});

test('activity totals count every qualifying PR, not just the shown rows', () => {
  const prs = [
    ...['a', 'b', 'c'].flatMap((o) => [
      pr({ repo: `${o}/p`, mergedAt: day(1) }),
      pr({ repo: `${o}/p`, mergedAt: day(2) }),
      pr({ repo: `${o}/p`, mergedAt: day(3) }),
    ]),
    pr({ repo: 'a/p', state: 'OPEN', mergedAt: null }),
    pr({ repo: 'b/p', state: 'OPEN', mergedAt: null }),
    pr({ repo: 'e2b-dev/runtime', state: 'OPEN', mergedAt: null }),
  ];
  const a = buildActivity(prs, cfg());
  expect([a.merged, a.open, a.projects]).toEqual([9, 2, 3]);
  expect(a.items.some((i) => i.cardKey === 'e2b-dev/runtime')).toBe(false);
});

test('own repos: public, non-fork, non-archived, owned, with topic; newest push first; override blurb wins', () => {
  const config = cfg({ overrides: { 'lofoneh/kvlite': { blurb: 'override blurb' } } });
  const mk = (name: string, over: Partial<RawRepo> = {}) =>
    repoOf({
      nameWithOwner: `lofoneh/${name}`,
      name,
      url: `https://github.com/lofoneh/${name}`,
      topics: ['portfolio'],
      ...over,
    });
  const repos = [
    mk('kvlite', { description: 'orig', pushedAt: day(1) }),
    mk('notag', { topics: [] }),
    mk('forked', { isFork: true }),
    mk('old', { isArchived: true }),
    mk('priv', { isPrivate: true }),
    mk('theirs', { nameWithOwner: 'acme/theirs' }),
    mk('second', { description: null, pushedAt: day(5) }),
  ];
  const out = buildOwnRepos(repos, config);
  expect(out.map((r) => r.name)).toEqual(['second', 'kvlite']);
  expect(out[1].blurb).toBe('override blurb');
  expect(out[0].blurb).toBe('');
});

test('empty snapshot yields empty sections without throwing', () => {
  const d = buildPortfolioData({ fetchedAt: 'x', pullRequests: [], repos: [] }, cfg());
  expect(d.oss.cards).toEqual([]);
  expect(d.oss.total).toBe(0);
  expect(d.activity).toEqual({ items: [], merged: 0, open: 0, projects: 0 });
  expect(d.ownRepos).toEqual([]);
  expect(d.fetchedAt).toBe('x');
});

test('buildPortfolioData drops private repos first', () => {
  const d = buildPortfolioData(
    {
      fetchedAt: 'x',
      pullRequests: [pr({ repo: 'secret/thing', repoIsPrivate: true })],
      repos: [
        repoOf({ nameWithOwner: 'lofoneh/win-admin', name: 'win-admin', isPrivate: true, topics: ['portfolio'] }),
      ],
    },
    cfg()
  );
  expect(d.oss.total).toBe(0);
  expect(d.ownRepos).toEqual([]);
});
