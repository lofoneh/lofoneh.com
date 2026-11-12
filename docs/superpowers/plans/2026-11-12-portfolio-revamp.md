# Portfolio revamp — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the home page in the approved "terminal dashboard" layout. Open source comes first, and the open-source cards, activity panel and tagged own repos come from GitHub at build time. The rest of the content is brought in line with the 2026 CV.

**Architecture:** A small `src/utils/github/` module fetches public GitHub data once per build: GraphQL, memoised, with an injected `fetch` for tests. A pure transform turns it into view data (cards, activity, own repos). That transform holds all filtering, grouping and privacy rules and is covered by `bun test`. Without a token, local builds use a committed public-only fixture. Vercel and CI builds fail hard if the token is missing or the fetch fails. A daily GitHub Action hits a Vercel deploy hook, and nothing is committed by a bot.

**Tech Stack:** Astro v6 (static), Tailwind v4 (CSS-first tokens in `CustomStyles.astro`), TypeScript 5.9, bun (package manager and `bun test`), GitHub GraphQL API, GitHub Actions, Vercel deploy hooks.

**Spec:** `docs/superpowers/specs/2026-11-12-portfolio-revamp-design.md`. Read §3 (layout), §4 (sync rules) and §5 (content) before any task.

**Branch:** `feat/portfolio-revamp` (already created from `dev`; the spec is committed there).

## Global Constraints

- Static output only (`output: 'static'`). No runtime GitHub calls. No new runtime dependencies: call `https://api.github.com/graphql` with global `fetch`.
- Monochrome tokens only: `ink`, `ink-2`, `ink-3`, `surface`, `surface-2`, `rule`. No accent colour. Status is shown by shape: **filled dot = merged, hollow ring = in review**.
- Fonts: Geist (sans) + Geist Mono (terminal accents), as already loaded.
- Every section works at **360 / 768 / 1280** px with no horizontal scroll. Keep the existing `reveal` / `reveal-up intersect intersect-once` motion and its `prefers-reduced-motion` behaviour.
- **Privacy:** nothing from a private repo may reach the build output. The search query has `is:public` and the transform drops `isPrivate` nodes; both are required. (`lofoneh/win-admin` is private and appears in authenticated searches.)
- Never commit to or push `main`. Commits are one-line messages with **no** `Co-Authored-By` trailer.
- Run only one `bun run build` / `bun run dev` at a time, because concurrent builds race on `dist/`.
- `bun run check` (astro check + ESLint + Prettier) and `bun run build` must pass at the end of every task that touches `src/`.
- Title copy is exactly `DevOps & Backend Engineer`. In mono lowercase contexts it is `devops & backend engineer`.

## Review Focus

1. **Private repo data reaching the page or fixture.** Expected: dropped everywhere. Pinned by `dropPrivate` / `eligiblePrs` tests (Task 1) and a `grep` of `dist/` and the fixture for `win-admin` (Tasks 4, 11).
2. **GitHub returns HTTP 200 with a GraphQL `errors` array (rate limit, bad field).** Expected: the build fails rather than rendering empty sections. Pinned by the `throws on GraphQL errors` test (Task 3).
3. **`GITHUB_TOKEN` missing on Vercel or in CI.** Expected: the build fails and never silently ships fixture data. Pinned by the `resolveSource` tests (Task 4).
4. **Zero qualifying data (new account, everything excluded).** Expected: sections render with empty-state lines and do not crash. Pinned by the `empty snapshot` test (Task 2) and the empty-state markup in Tasks 5–6.
5. **Long labels at 360 px** (`argo-workflows#17289`, long PR titles). Expected: an ellipsis, no horizontal page scroll. Pinned by the manual 360 px check (Task 11).

---

## File structure

**Create**
- `src/utils/github/types.ts`: raw snapshot types, view types and config types
- `src/utils/github/transform.ts`: pure rules (privacy, eligibility, grouping, sorting, activity, own repos)
- `src/utils/github/transform.test.ts`
- `src/utils/github/fetch.ts`: GraphQL client → `GitHubSnapshot`
- `src/utils/github/fetch.test.ts`
- `src/utils/github/source.ts`: decides live vs fixture from env
- `src/utils/github/source.test.ts`
- `src/utils/github/index.ts`: memoised `getPortfolioData()` used by components
- `src/data/github.config.ts`: groups, overrides, exclude list
- `src/data/github.fixture.json`: public-only snapshot for local builds
- `scripts/github-fixture.ts`: regenerates the fixture
- `src/components/ui/SectionBody.astro`: content column aligned under `SectionHeader`'s rail
- `src/components/ui/ActivityPanel.astro`
- `src/components/ui/OssCard.astro`
- `src/components/ui/ProjectCard.astro`
- `src/components/sections/OpenSourceSection.astro`
- `.github/workflows/daily-rebuild.yml`

**Modify**
- `tsconfig.json`, `package.json`, `.github/workflows/actions.yaml`
- `src/components/sections/{AboutSection,ExperienceSection,ProjectsSection,WritingSection,ContactSection}.astro`
- `src/data/experience.ts`, `src/data/projects.ts`
- `src/pages/index.astro`, `src/navigation.ts`, `src/components/common/ScrollSpy.astro`
- `src/config.yaml`, `scripts/build-og.mjs` (and the regenerated `src/assets/images/og-default.png`, `og-source.svg`), `public/resume.pdf`
- `AGENTS.md`; `CLAUDE.md` too, but it is gitignored, so that edit stays local

**Delete** (once nothing imports them, in Task 8)
- `src/components/ui/WorkCard.astro`, `src/components/widgets/WorkList.astro`, `src/data/stack-icons.ts`

**Do not touch:** `src/components/blog/*` (also used by the category and tag pages), `astro.config.ts` icon include lists (harmless if left).

---

### Task 1: Types, config and the OSS-card rules

**Files:**
- Create: `src/utils/github/types.ts`, `src/utils/github/transform.ts`, `src/utils/github/transform.test.ts`, `src/data/github.config.ts`
- Modify: `tsconfig.json` (`"exclude": ["dist/", "**/*.test.ts"]`, so `astro check` doesn't type-check `bun:test` imports), `package.json` (add script `"test": "bun test"`)

**Interfaces:**
- Produces, in `types.ts` (later tasks use these exact names):

```ts
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
export interface GitHubSnapshot { fetchedAt: string; pullRequests: RawPullRequest[]; repos: RawRepo[] }

export interface GitHubGroup { key: string; name: string; repos: string[] }
export interface CardOverride { name?: string; tag?: string; blurb?: string; order?: number }
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

export interface PrLink { label: string; url: string } // '#77' or 'kividb#636'
export interface OssCardData {
  key: string; // group key or 'owner/repo'
  name: string;
  owner: string; // 'kividbio'
  tag: string;
  blurb: string;
  url: string; // first repo's URL
  merged: number;
  open: number;
  prLinks: PrLink[]; // ≤ 3, newest merged first
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
export interface ActivitySummary { items: ActivityItem[]; merged: number; open: number; projects: number }
export interface OwnRepoCard { name: string; blurb: string; language: string | null; url: string; homepageUrl: string | null; pushedAt: string }
export interface PortfolioData {
  fetchedAt: string;
  oss: { cards: OssCardData[]; total: number; allPrsUrl: string };
  activity: ActivitySummary;
  ownRepos: OwnRepoCard[];
}
```

- Produces, in `transform.ts`: `cleanTitle(title: string): string`, `dropPrivate(s: GitHubSnapshot): GitHubSnapshot`, `eligiblePrs(prs: RawPullRequest[], config: GitHubConfig): RawPullRequest[]`, `buildOssCards(prs: RawPullRequest[], config: GitHubConfig): { cards: OssCardData[]; total: number; allPrsUrl: string }`.

- [ ] **Step 1: Write the failing tests** in `transform.test.ts`

Use local factories: `pr(over: Partial<RawPullRequest>)`, which defaults to a public merged PR in `acme/widget` (`createdAt` and `mergedAt` set), and `cfg(over: Partial<GitHubConfig>)`, which defaults to `username: 'lofoneh'`, no groups/overrides/exclude, `maxCards: 6`, `activityRows: 6`, `activityPerCard: 2`. Tests and assertions:

```ts
test('cleanTitle strips a trailing issue ref', () => {
  expect(cleanTitle('Replicated: fence the old master before a failover (#53)')).toBe('Replicated: fence the old master before a failover');
  expect(cleanTitle('fix(promotion): check http failure criteria before success')).toBe('fix(promotion): check http failure criteria before success');
});
test('dropPrivate removes private PRs and repos', () => {
  // snapshot with one PR repoIsPrivate:true (repo 'lofoneh/win-admin') and one RawRepo isPrivate:true
  // → result has neither; public ones survive
});
test('eligiblePrs drops private, closed, draft, own-repo and excluded PRs', () => {
  // inputs: private; state CLOSED; isDraft true; repo 'lofoneh/kvlite'; repo in exclude 'Btk990/Peerly-App';
  // 'acme/widget#7' in exclude; one plain merged and one plain OPEN PR
  // → exactly the plain merged + plain open remain
});
test('groups aggregate counts across their repos', () => {
  // group kividb = ['kividbio/kividb-operator','kividbio/kividb']; operator: 2 merged + 1 open; kividb: 1 merged
  // → one card key 'kividb', name 'KiviDB', owner 'kividbio', merged 3, open 1
});
test('a repo with only open PRs is hidden, but a grouped repo with none merged counts via its group', () => {
  // 'e2b-dev/runtime' only OPEN → no card; group pgrun = pgbot (1 merged) + pggo (1 OPEN) → card open === 1
});
test('pinned card first, then merged desc, then latest merge desc', () => {
  // overrides { kividb: { order: 0 } }; kividb 1 merged; 'a/big' 5 merged; 'b/tie' 2 merged (2026-11-09); 'c/tie' 2 merged (2026-10-07)
  // → keys ['kividb','a/big','b/tie','c/tie']
});
test('prLinks: 3 newest merged, cross-repo PRs prefixed, moreCount and moreUrl', () => {
  // kividb group, operator merged #65 #66 #77 #83, kividb merged #636 (newest)
  // → labels ['kividb#636', '#83', '#77'], moreCount 2,
  //   moreUrl contains 'repo%3Akividbio%2Fkividb-operator' and 'repo%3Akividbio%2Fkividb'
});
test('defaults: name = repo name, tag = language, blurb = latest merged title; overrides win', () => {
  // 'akuity/kargo' language 'Go', newest merged title 'fix(promotion): check http failure criteria before success (#12)'
  // → name 'kargo', tag 'Go', blurb 'latest: fix(promotion): check http failure criteria before success'
  // never equals repoDescription; with overrides {'akuity/kargo': {name:'Kargo', tag:'GitOps', blurb:'X'}} → 'Kargo','GitOps','X'
});
test('cards cap at maxCards while total counts every qualifying card', () => {
  // 8 single-repo cards, maxCards 6 → cards.length 6, total 8;
  // allPrsUrl contains 'is%3Apr' and 'author%3Alofoneh' and '-user%3Alofoneh'
});
```

- [ ] **Step 2: Run the tests and confirm they fail**

Run: `bun test src/utils/github/transform.test.ts`
Expected: FAIL (`transform.ts` exports missing)

- [ ] **Step 3: Implement `types.ts`, then the four `transform.ts` functions**

- A card key is the group key when the repo is in a group, else `owner/repo`.
- The "first repo" is `group.repos[0]` (or the repo itself). PR labels are `#N` for the first repo and `<repo name>#N` for the others.
- `moreUrl` is `https://github.com/search?type=pullrequests&q=` + `encodeURIComponent('is:pr author:<u> ' + repos.map(r => 'repo:' + r).join(' '))`.
- `allPrsUrl` uses `q = is:pr author:<u> is:public -user:<u>`.
- The sort key for "latest" is `Date.parse`.

- [ ] **Step 4: Create `src/data/github.config.ts`**: `export const githubConfig: GitHubConfig` with the values below. The blurbs are drafted from the merged PR titles (spec §4.5); Jeffery reviews them in Task 11.

```ts
username: 'lofoneh', ownRepoTopic: 'portfolio', maxCards: 6, activityRows: 6, activityPerCard: 2,
groups: [
  { key: 'kividb', name: 'KiviDB', repos: ['kividbio/kividb-operator', 'kividbio/kividb'] },
  { key: 'telemetry-dev', name: 'telemetry.dev', repos: ['telemetry-dev/telemetry', 'telemetry-dev/stats', 'telemetry-dev/docs'] },
  { key: 'pgrun', name: 'PGRun', repos: ['pgrundev/pgbot', 'pgrundev/pgterm', 'pgrundev/pggo'] },
],
exclude: ['Btk990/Peerly-App'],
overrides: {
  kividb: { order: 0, tag: 'Go + Rust', blurb: 'Fixed failover data-loss bugs: a force-deleted master no longer loses acknowledged writes.' },
  'argoproj/argo-workflows': { name: 'Argo Workflows', tag: 'CNCF graduated', blurb: "Moved the workflow controller's test fixtures out of Go code into testdata files, and deflaked a realtime metrics test." },
  'telemetry-dev': { tag: 'OpenTelemetry', blurb: 'Traced Anthropic beta.messages and messages.parse, fixed stream-capture and cache-usage accounting, and widened tests for the AI SDK paths.' },
  pgrun: { tag: 'Postgres', blurb: 'Added collation-version and replica-identity findings, and hardened how passwords and SQL comments are scrubbed from connection strings and query text.' },
  'k8sgpt-ai/k8sgpt': { name: 'K8sGPT', tag: 'CNCF sandbox', blurb: 'Fixed analyzer bugs: blocked PodDisruptionBudgets with empty or matchExpressions selectors now get reported, and the OLM analyzers no longer panic on catalogs without an image.' },
  'akuity/kargo': { name: 'Kargo', tag: 'GitOps', blurb: 'The http promotion step checks failure criteria first, so error responses report their real message.' },
  'canonical/k8s-snap': { name: 'Canonical Kubernetes', tag: 'Kubernetes', blurb: 'Removed an orphaned MetalLB chart and guarded the chart update scripts against a failed cd.' },
  'lofoneh/kvlite': { blurb: 'In-memory key-value store: Redis-like protocol over TCP, per-key TTLs, a write-ahead log with crash recovery and snapshot compaction.' },
},
```

- [ ] **Step 5: Run the tests and confirm they pass**

Run: `bun test src/utils/github/transform.test.ts` → all pass. Then `bun run check` → passes.

- [ ] **Step 6: Commit**

```bash
git add tsconfig.json package.json src/utils/github/types.ts src/utils/github/transform.ts src/utils/github/transform.test.ts src/data/github.config.ts
git commit -m "github sync: types, config and open-source card rules"
```

---

### Task 2: Activity, own repos and the assembled view data

**Files:**
- Modify: `src/utils/github/transform.ts`, `src/utils/github/transform.test.ts`

**Interfaces:**
- Consumes: Task 1 types, `eligiblePrs`, `buildOssCards`, `cleanTitle`.
- Produces: `buildActivity(prs: RawPullRequest[], config: GitHubConfig): ActivitySummary`, `buildOwnRepos(repos: RawRepo[], config: GitHubConfig): OwnRepoCard[]`, `buildPortfolioData(snapshot: GitHubSnapshot, config: GitHubConfig): PortfolioData`. `buildPortfolioData` calls `dropPrivate` first.

- [ ] **Step 1: Write the failing tests**

```ts
test('activity: newest first by mergedAt ?? createdAt, ≤ 2 per card, ≤ 6 total', () => {
  // card A: 4 merged PRs (newest overall); cards B, C, D: 2 each, older
  // → items.length 6; count of cardKey A === 2; items sorted by `at` desc;
  //   label of an operator PR === 'kividb-operator#83' (repo name + '#' + number)
});
test('activity: open PRs use createdAt and state "open"; titles are cleaned', () => {});
test('activity totals count every qualifying PR, not just the shown rows', () => {
  // 3 cards, 9 merged + 2 open qualifying, plus 'e2b-dev/runtime' OPEN only
  // → merged 9, open 2, projects 3; no item from e2b-dev/runtime
});
test('own repos: public, non-fork, non-archived, owned, with topic; newest push first; override blurb wins', () => {
  // repos: kvlite (topic portfolio, override blurb), notag (no topic), forked (isFork), old (isArchived), priv (isPrivate)
  // → only kvlite, blurb === override; a second tagged repo with no override uses its description ('' when null)
});
test('empty snapshot yields empty sections without throwing', () => {
  // buildPortfolioData({ fetchedAt: 'x', pullRequests: [], repos: [] }, cfg())
  // → oss.cards [], oss.total 0, activity { items: [], merged: 0, open: 0, projects: 0 }, ownRepos []
});
```

- [ ] **Step 2: Run the tests and confirm the new ones fail**: `bun test src/utils/github/transform.test.ts`

- [ ] **Step 3: Implement the three functions.** Activity only uses PRs whose card qualifies, which is the same rule as `buildOssCards` (reuse it; don't re-derive it). `projects` = the number of qualifying cards before the `maxCards` cap.

- [ ] **Step 4: Run the tests and confirm they pass**: `bun test` → all pass; `bun run check` → passes.

- [ ] **Step 5: Commit**: `git commit -am "github sync: activity feed, own repos and assembled view data"`. The test and transform files are already tracked, so `-am` picks them up.

---

### Task 3: GraphQL fetch client

**Files:**
- Create: `src/utils/github/fetch.ts`, `src/utils/github/fetch.test.ts`

**Interfaces:**
- Consumes: `GitHubSnapshot`, `RawPullRequest`, `RawRepo` (Task 1).
- Produces: `fetchSnapshot(opts: { token: string; username: string; timeoutMs?: number; fetchImpl?: typeof fetch }): Promise<GitHubSnapshot>`. `timeoutMs` defaults to `20000`, with one abort deadline covering all requests. `fetchedAt` is `new Date().toISOString()`.

Queries (POST `https://api.github.com/graphql`, header `Authorization: bearer <token>`, page with `after` until `hasNextPage` is false):

```graphql
query ($q: String!, $after: String) {
  search(query: $q, type: ISSUE, first: 100, after: $after) {
    pageInfo { hasNextPage endCursor }
    nodes { ... on PullRequest { number title url state isDraft createdAt mergedAt
      repository { nameWithOwner url description isPrivate primaryLanguage { name } } } }
  }
}
# $q = "is:pr author:<username> is:public -user:<username>"

query ($login: String!, $after: String) {
  user(login: $login) {
    repositories(first: 100, after: $after, privacy: PUBLIC, isFork: false, ownerAffiliations: OWNER) {
      pageInfo { hasNextPage endCursor }
      nodes { name nameWithOwner description url homepageUrl isPrivate isFork isArchived pushedAt
        primaryLanguage { name } repositoryTopics(first: 20) { nodes { topic { name } } } }
    }
  }
}
```

- [ ] **Step 1: Write the failing tests** with a fake `fetchImpl` that records requests and returns queued JSON bodies:

```ts
test('maps a PR node and a repo node to the snapshot shape', () => {
  // PR node → { repo: 'kividbio/kividb-operator', repoLanguage: 'Go', repoIsPrivate: false, number: 83, state: 'MERGED', ... }
  // repo node → { nameWithOwner: 'lofoneh/kvlite', language: 'Go', topics: ['portfolio'], ... }
});
test('sends a bearer token and an is:public search query', () => {
  // first request: headers.Authorization === 'bearer t0k'; variables.q === 'is:pr author:lofoneh is:public -user:lofoneh'
});
test('follows pageInfo across pages', () => {
  // search page 1 hasNextPage true (endCursor 'c1') then page 2 → pullRequests.length === 2; second call variables.after === 'c1'
});
test('throws on GraphQL errors even with HTTP 200', async () => {
  // body { errors: [{ message: 'API rate limit exceeded' }] } → rejects with /rate limit/
});
test('throws on a non-2xx response', async () => { /* status 502 → rejects with /502/ */ });
test('rejects when the API hangs past timeoutMs', async () => {
  // fetchImpl returns a promise that rejects only when its signal aborts; timeoutMs 50 → rejects with /timed out/i
});
```

- [ ] **Step 2: Run `bun test src/utils/github/fetch.test.ts`** → FAIL.
- [ ] **Step 3: Implement `fetchSnapshot`.** Skip search nodes that are not PRs, which come back as empty objects.
- [ ] **Step 4: Run `bun test`** → all pass; `bun run check` → passes.
- [ ] **Step 5: Commit**: `git add src/utils/github/fetch.ts src/utils/github/fetch.test.ts && git commit -m "github sync: GraphQL fetch client with paging, error and timeout handling"`

---

### Task 4: Live-or-fixture source, memoised loader and fixture

**Files:**
- Create: `src/utils/github/source.ts`, `src/utils/github/source.test.ts`, `src/utils/github/index.ts`, `scripts/github-fixture.ts`, `src/data/github.fixture.json`
- Modify: `package.json` (add `"github:fixture": "bun scripts/github-fixture.ts && prettier -w src/data/github.fixture.json"`)

**Interfaces:**
- Produces: `resolveSource(env: Record<string, string | undefined>): { mode: 'live'; token: string } | { mode: 'fixture' }`.
- Produces: `getPortfolioData(): Promise<PortfolioData>`. Memoised in a module-level promise, so all sections share one fetch. **Every component calls only this.**

- [ ] **Step 1: Write the failing tests** (`source.test.ts`):

```ts
test('a token means live', () => expect(resolveSource({ GITHUB_TOKEN: 'x' })).toEqual({ mode: 'live', token: 'x' }));
test('no token on Vercel production fails', () => expect(() => resolveSource({ VERCEL_ENV: 'production' })).toThrow(/GITHUB_TOKEN/));
test('no token on Vercel preview fails', () => expect(() => resolveSource({ VERCEL_ENV: 'preview' })).toThrow(/GITHUB_TOKEN/));
test('no token in CI fails', () => expect(() => resolveSource({ CI: 'true' })).toThrow(/GITHUB_TOKEN/));
test('no token locally uses the fixture', () => expect(resolveSource({})).toEqual({ mode: 'fixture' }));
```

- [ ] **Step 2: Run `bun test src/utils/github/source.test.ts`** → FAIL.
- [ ] **Step 3: Implement `source.ts` and `index.ts`.**
  - `index.ts`: `resolveSource(process.env)`. Live → `fetchSnapshot({ token, username: githubConfig.username })`. Fixture → `import fixture from '~/data/github.fixture.json'`, cast to `GitHubSnapshot`, and `console.warn('[github] GITHUB_TOKEN not set — using src/data/github.fixture.json (local only)')`.
  - Then `buildPortfolioData(snapshot, githubConfig)` and log `[github] <mode>: <n> PRs, <m> repos, <k> cards`.
  - A live fetch error propagates, so the build fails.
- [ ] **Step 4: Write `scripts/github-fixture.ts`.** It exits 1 with a message if `GITHUB_TOKEN` is unset. Otherwise it calls `fetchSnapshot`, passes the result through `dropPrivate`, and writes `JSON.stringify(snapshot, null, 2) + '\n'` to `src/data/github.fixture.json` with `node:fs`.
- [ ] **Step 5: Generate the fixture**

Run: `GITHUB_TOKEN=$(gh auth token) bun run github:fixture`
Expected: the file is written. Then check:
- `grep -c "win-admin" src/data/github.fixture.json` prints `0`.
- `grep -c '"repo": "kividbio/kividb-operator"' src/data/github.fixture.json` is ≥ 6.
- `grep -c '"repoIsPrivate": true' src/data/github.fixture.json` prints `0`.

- [ ] **Step 6: Run `bun test`** → all pass; `bun run check` → passes.
- [ ] **Step 7: Commit**: `git add package.json scripts/github-fixture.ts src/utils/github/source.ts src/utils/github/source.test.ts src/utils/github/index.ts src/data/github.fixture.json && git commit -m "github sync: live-or-fixture loader, fixture script and public-only fixture"`

---

### Task 5: Split hero with the activity panel

**Files:**
- Create: `src/components/ui/ActivityPanel.astro`
- Modify: `src/components/sections/AboutSection.astro`

**Interfaces:**
- Consumes: `getPortfolioData()` → `.activity: ActivitySummary` (Tasks 2, 4).
- Produces: `ActivityPanel` with props `{ activity: ActivitySummary; class?: string; style?: string }`. `class` and `style` go on the root element, so the hero can apply its `reveal` delay.

- [ ] **Step 1: Build `ActivityPanel.astro`** (spec §3.1):
  - Bordered `bg-surface-2` mono box. The header row reads `~/activity · $ gh pr list --author lofoneh`, with `synced daily` on the right; below `sm`, the header shows only `~/activity`.
  - One `<li>` per item, with columns dot, label and title:
    - The dot is `bg-ink` for merged and `border border-ink-2` (transparent) for open. It is `aria-hidden`, with an `sr-only` state word next to it.
    - The label is a link to the PR (`target="_blank" rel="noopener noreferrer"`).
    - The title is `truncate` and hidden below `sm`. Below `sm`, show `· merged` / `· review` instead.
  - Items at index ≥ 4 get `hidden sm:grid`, so the phone shows 4 rows.
  - Footer: `● merged ○ in review · {merged} merged · {open} in review · {projects} projects`. Below `sm` it shows only `{merged} merged · {open} in review`.
  - Empty state: `[ no activity yet ]`.
- [ ] **Step 2: Rewrite `AboutSection.astro`.**
  - Remove the `SectionIndex` rail. The layout is `grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:items-start`, so the columns stack below `lg`.
  - **Left column:** keep the `$ whoami` typed command, the `h1` (`hi, i'm jeffery 👋`, still the only h1), the `.cmd`/`.caret` styles and the reveal delays. Add the title line under the h1: a mono `text-sm text-ink-2` `<p>` containing `<span>devops &amp; backend engineer</span><span class="hidden sm:inline"> · </span><br class="sm:hidden" /><span>accra, ghana · open to remote</span>`. Then `$ cat about.md` and these three paragraphs (spec §5.1 light edit; Jeffery reviews the wording):

    > i build the parts nobody notices — pipelines, Kubernetes, observability — the unglamorous plumbing that keeps everything people use running. lately that means fixing failover bugs in a Kubernetes database operator, in public, with tests that prove it.
    >
    > day-to-day that's DevOps at Adaptive Computer Solutions, keeping production calm and quietly boring. my degree is in metallurgical engineering from KNUST; software was a back-door entry i taught myself after graduation.
    >
    > these days i'm deep in Go, Rust and Kubernetes operators. in my downtime: movies, anime, Gospel music, and the occasional acoustic guitar.

  - **Right column:** `<ActivityPanel activity={activity} class="reveal" style="--delay:…" />`, revealed after the last paragraph.
- [ ] **Step 3: Verify:** `bun run check` passes. `bun run build` passes; with no token it logs the fixture warning. Then run `bun run dev` and view `/` at 1280 (columns side by side) and 360 (stacked, 4 rows, no horizontal scroll).
- [ ] **Step 4: Commit**: `git add src/components/ui/ActivityPanel.astro src/components/sections/AboutSection.astro && git commit -m "hero: split layout with live GitHub activity panel and title line"`

---

### Task 6: Open-source section, nav and scrollspy

**Files:**
- Create: `src/components/ui/SectionBody.astro`, `src/components/ui/OssCard.astro`, `src/components/sections/OpenSourceSection.astro`
- Modify: `src/pages/index.astro`, `src/navigation.ts`, `src/components/common/ScrollSpy.astro:8`

**Interfaces:**
- Consumes: `getPortfolioData()` → `.oss` (Tasks 1, 4).
- Produces: `SectionBody`, a default-slot wrapper that renders `<div class="grid gap-x-10 md:grid-cols-[6.5rem_minmax(0,1fr)]"><div class="hidden md:block" aria-hidden="true"></div><div><slot /></div></div>`, the same rail as `SectionHeader`. Tasks 7 and 8 use it. Also produces `OssCard`, with props `{ card: OssCardData; class?: string }`.

- [ ] **Step 1: Build `OssCard.astro`** (spec §3.2), using the `WorkCard` chrome (`border border-rule p-6 hover:border-ink transition-colors`):
  - mono meta `{owner} · {tag}`
  - name as a link to `card.url`
  - blurb
  - counts `{merged} merged` plus ` · {open} in review` when `open > 0`
  - PR links (mono, underlined, `target="_blank"`), then `+{moreCount}` linking to `moreUrl` when `moreCount > 0`
- [ ] **Step 2: Build `OpenSourceSection.astro`.** Use the same outer container as the other sections. `SectionHeader index="02" label="open-source" title="Open source."`, with intro `Merged work in Kubernetes, GitOps, observability and Postgres projects.` Then `SectionBody` → `grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3` of `OssCard`s (`reveal-up intersect intersect-once`). Under the grid, `$ ./all-prs →` (style it like `TerminalCTA`, linking to `oss.allPrsUrl`) when `oss.total > oss.cards.length`. Empty state: `[ no merged open-source work yet ]`.
- [ ] **Step 3: Wire it in.**
  - `index.astro`: add `<section id="open-source" class="scroll-mt-20"><OpenSourceSection /></section>` right after `#about`, and set `metadata.title` to `Jeffery Lofoneh Asamani — DevOps & Backend Engineer`.
  - `navigation.ts`: add `{ text: 'Open source', href: '/#open-source' }` after About.
  - `ScrollSpy.astro`: the section list becomes `['about', 'open-source', 'experience', 'projects', 'writing', 'contact']`.
- [ ] **Step 4: Verify:** `bun run check`, then `bun run build`, pass. In `bun run dev`, the cards show KiviDB first. Clicking **Open source** in the header scrolls to `#open-source` and highlights it. The header nav fits at 768 and 1280, and the mobile menu lists Open source.
- [ ] **Step 5: Commit**: `git add src/components/ui/SectionBody.astro src/components/ui/OssCard.astro src/components/sections/OpenSourceSection.astro src/pages/index.astro src/navigation.ts src/components/common/ScrollSpy.astro && git commit -m "open source: GitHub-synced section 02 with nav and scrollspy"`

---

### Task 7: Experience — CV content as a compact timeline

**Files:**
- Modify: `src/data/experience.ts`, `src/components/sections/ExperienceSection.astro`

**Interfaces:**
- Produces (`experience.ts`): `Role` (unchanged), `SkillCategory { label: string; items: string[] }`, `EducationEntry` without `coursework`, and `Certification` (unchanged).

- [ ] **Step 1: Update `experience.ts`.**
  - Role bullets: verbatim from spec §5.2.
  - Education: drop `coursework`.
  - Fix the header comment, so it no longer says "/experience".
  - Skills (chip text, lowercase short forms; spec §5.3):

```ts
{ label: 'Cloud & infrastructure', items: ['aws', 'azure', 'digitalocean', 'terraform', 'ansible'] },
{ label: 'Containers & Kubernetes', items: ['docker', 'kubernetes', 'helm', 'kind', 'controller-runtime', 'traefik'] },
{ label: 'CI/CD & observability', items: ['github actions', 'azure devops', 'prometheus', 'grafana', 'loki', 'tempo', 'opentelemetry', 'uptime kuma'] },
{ label: 'Languages', items: ['go', 'rust', 'python', 'typescript', 'ruby', 'bash', 'powershell'] },
{ label: 'Databases', items: ['postgresql', 'mongodb', 'supabase', 'redis', 'kividb'] },
{ label: 'Frameworks', items: ['react', 'next.js', 'expo', 'django', 'fastapi', 'gin', 'prisma', 'rails'] },
```

- [ ] **Step 2: Rewrite `ExperienceSection.astro`.** Keep `SectionHeader index="03" label="experience" title="Where I've worked."` and its intro and resume link. Then `SectionBody`, containing:
  - **Timeline:** an `<ol>` of rows `grid gap-1 sm:grid-cols-[9rem_minmax(0,1fr)] sm:gap-6 border-b border-rule py-6`.
    - The date column is mono `text-xs text-ink-3`, showing `{start} — {end}` lowercased, with `Present` rendered as `now`.
    - The right column has the title (`font-semibold`), `company · location` (`text-ink-2`) and bullets (`·` markers as today).
  - **Skills:** a `SectionLabel text="skills"`, then a `<dl>` with one row per category. The label is mono uppercase `text-ink-2`; each item is a chip `font-mono text-xs text-ink-2 border border-rule px-2 py-0.5`.
  - **Certs & education:** a `SectionLabel text="certs & education"`, then one `text-sm text-ink-2` line: the cert names joined with ` · `, then ` · BSc Metallurgical Engineering, KNUST (2018–2022)` (built from `education[0]`).
  - Remove the `Icon` / `resolveStackIcon` imports and the `ASCIIRule` separators.
- [ ] **Step 3: Verify:** `bun run check` and `bun run build` pass. At 360, the dates sit above the titles and the chips wrap.
- [ ] **Step 4: Commit**: `git add src/data/experience.ts src/components/sections/ExperienceSection.astro && git commit -m "experience: CV content as compact timeline, text skill chips, one-line certs"`

---

### Task 8: Projects — one grid of synced and hand-written work

**Files:**
- Create: `src/components/ui/ProjectCard.astro`
- Modify: `src/data/projects.ts`, `src/components/sections/ProjectsSection.astro`
- Delete: `src/components/ui/WorkCard.astro`, `src/components/widgets/WorkList.astro`, `src/data/stack-icons.ts`

**Interfaces:**
- Consumes: `getPortfolioData()` → `.ownRepos: OwnRepoCard[]`.
- Produces: `ProjectCard` with props `{ meta: string; name: string; blurb: string; links: { label: 'live' | 'repo'; href: string }[]; class?: string }`. Produces `projects.ts` → `export interface Project { slug: string; title: string; oneLiner: string; meta: string; links: { live?: string } }` and `export const projects: Project[]`.

- [ ] **Step 1: Rewrite `projects.ts`** with the four entries from spec §5.4, in this order. Remove the status/stack/featured fields and `featuredProjects`.

| slug | title | meta | live |
|---|---|---|---|
| giftbanc | GiftBanc | `contract · devops` | https://giftbanc.com |
| win-transport | WIN Transport | `contract · full-stack` | https://wintransportservices.com |
| win-church | WIN Church | `live · multi-tenant` | https://win-admin-alpha.vercel.app |
| iac-studio | IaC Studio | `private` | — |

Each `oneLiner` is the CV sentence from spec §5.4 for that project, trimmed to one sentence.
- [ ] **Step 2: Build `ProjectCard.astro`**, with the same chrome as `OssCard`. Links render as `$ ./live` / `$ ./repo`, the same markup as the old `WorkCard` links.
- [ ] **Step 3: Rewrite `ProjectsSection.astro`.** `SectionHeader index="04" label="projects" title="Things I've built."`, intro `Client work I've shipped, plus my own repos. Tagged ones sync from GitHub.` Then `SectionBody` → a `grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3` holding:
  - own repos first, as `ProjectCard` with meta `github · synced · {language}` (omit the language when it is null), links `repo` and `live` when `homepageUrl` is set
  - then `projects`
  Remove the next-up block.
- [ ] **Step 4: Delete the dead files.** `grep -rn "WorkCard\|WorkList\|stack-icons" src` must print nothing first. Then `git rm src/components/ui/WorkCard.astro src/components/widgets/WorkList.astro src/data/stack-icons.ts`.
- [ ] **Step 5: Verify:** `bun run check` and `bun run build` pass. kvlite only shows once it has the `portfolio` topic (Jeffery's setup step), so with today's fixture the grid holds the four hand-written cards. That is expected.
- [ ] **Step 6: Commit**: `git add -A src/components/ui/ProjectCard.astro src/data/projects.ts src/components/sections/ProjectsSection.astro && git commit -m "projects: one grid of synced repos and hand-written work, drop collage and dead card code"`

---

### Task 9: Writing, contact, metadata, OG image and resume PDF

**Files:**
- Modify: `src/components/sections/WritingSection.astro`, `src/components/sections/ContactSection.astro`, `src/config.yaml` (`metadata.description`), `scripts/build-og.mjs`, `src/assets/images/og-default.png`, `src/assets/images/og-source.svg`, `public/resume.pdf`

- [ ] **Step 1: Restyle `WritingSection.astro`.**
  - `SectionHeader index="05"` with the same title and intro.
  - Replace `BlogList` with its own `<ul>` of rows `grid gap-1 sm:grid-cols-[7rem_minmax(0,1fr)] sm:gap-6 border-b border-rule py-4`.
  - The date column is mono `text-xs text-ink-3` (`getFormattedDate(post.publishDate)`); the title links to `getPermalink(post.permalink, 'post')`.
  - Wrap it in `SectionBody`. Do **not** edit `components/blog/*`.
- [ ] **Step 2: In `ContactSection.astro`**, change the paragraph to `Open to remote DevOps, infrastructure and backend roles.`
- [ ] **Step 3: Change `config.yaml` `metadata.description`** to `DevOps & backend engineer in Accra, Ghana. CI/CD, Kubernetes and observability, plus merged open-source work in Kubernetes, GitOps and Postgres projects.`
- [ ] **Step 4: Regenerate the OG image.** In `scripts/build-og.mjs`, change the tagline `<text>` to `devops &amp; backend engineer · kubernetes, ci/cd, open source.` Then run `bun scripts/build-og.mjs` and view the PNG to check that the line fits inside the 1200 px width.
- [ ] **Step 5: Replace the resume PDF.**
  - Call the Claude Docs `export` tool with `container {"kind":"project","id":"4823eee6-d2b3-4564-9cf6-bb8668e05b6a"}`, `file "fb9690ad-8482"`, `format "pdf"`, `paper "a4"`.
  - Base64-decode the result into `public/resume.pdf`.
  - Check that the file starts with `%PDF` and opens. Read the first page and confirm it shows the 2026 CV.
  - If the export isn't available in the session, **stop and ask Jeffery for the PDF**. Don't keep the old one silently.
- [ ] **Step 6: Verify:** `bun run check` and `bun run build` pass. `/resume.pdf` serves the new file in `bun run preview`.
- [ ] **Step 7: Commit**: `git add src/components/sections/WritingSection.astro src/components/sections/ContactSection.astro src/config.yaml scripts/build-og.mjs src/assets/images/og-default.png src/assets/images/og-source.svg public/resume.pdf && git commit -m "writing and contact restyle, new title in metadata and og image, 2026 resume pdf"`

---

### Task 10: CI token, daily rebuild workflow and docs

**Files:**
- Create: `.github/workflows/daily-rebuild.yml`
- Modify: `.github/workflows/actions.yaml`, `AGENTS.md`, `CLAUDE.md` (local only)

- [ ] **Step 1: Create `.github/workflows/daily-rebuild.yml`**

```yaml
name: Daily rebuild

on:
  schedule:
    - cron: '0 5 * * *' # 05:00 UTC (05:00 Accra)
  workflow_dispatch:

permissions: {}

jobs:
  trigger:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Vercel production rebuild
        env:
          HOOK: ${{ secrets.VERCEL_DEPLOY_HOOK_URL }}
        run: |
          if [ -z "$HOOK" ]; then echo "::error::VERCEL_DEPLOY_HOOK_URL secret is not set"; exit 1; fi
          curl -fsS -X POST "$HOOK"
```

- [ ] **Step 2: In `actions.yaml`**, add `env: { GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }} }` to the `bun run build` step, and add `- run: bun run test` after `bun run check` in the `check` job. Leave the triggers unchanged.
- [ ] **Step 3: Validate the YAML:** `bun -e "const y=require('js-yaml');for (const f of ['.github/workflows/daily-rebuild.yml','.github/workflows/actions.yaml']) y.load(require('fs').readFileSync(f,'utf8'));console.log('ok')"` → `ok`
- [ ] **Step 4: Docs.**
  - `AGENTS.md`: add a short `## GitHub sync` section covering:
    - where the rules live (`src/utils/github/`, `src/data/github.config.ts`)
    - `bun run test`
    - `GITHUB_TOKEN=$(gh auth token) bun run github:fixture`
    - that the fixture is local-only and Vercel/CI fail without a token
    - the `portfolio` topic opt-in
  - Add `bun run test` to its Verification Checklist.
  - `CLAUDE.md` (gitignored, local): change "backend / infra engineer" to "DevOps & backend engineer", and add `bun run test` / `bun run github:fixture` to the commands table.
- [ ] **Step 5: Verify** that `bun run check` passes.
- [ ] **Step 6: Commit**: `git add .github/workflows/daily-rebuild.yml .github/workflows/actions.yaml AGENTS.md && git commit -m "ci: token for build, run tests; daily vercel rebuild via deploy hook; document github sync"`

---

### Task 11: Whole-branch verification and handover

- [ ] **Step 1:** `bun test` → all pass. `bun run check` → passes. `bun run build` with no token → passes, with the fixture warning in the log.
- [ ] **Step 2: Live build:** `GITHUB_TOKEN=$(gh auth token) bun run build` → passes and logs `[github] live: …`. Compare the card counts with `gh api graphql` using the spec §1 query. The merged and in-review totals and the card order must agree: KiviDB first, then by merged count.
- [ ] **Step 3: Privacy check on the output:** `grep -rhoE "win-admin[^\"<' ]*" dist/ | sort -u` must print only `win-admin-alpha.vercel.app` (the WIN Church live link). Any `github.com/lofoneh/win-admin` or `win-admin#…` hit is a leak and blocks handover.
- [ ] **Step 4: Responsive and motion.** Run `bun run preview`, then check `/` at **360, 768 and 1280** in the browser, in dark and light:
  - no horizontal scroll
  - the activity panel shows 4 rows at 360 and 6 at ≥ 640, and long labels truncate
  - the nav highlights each section in turn
  - the mobile menu works
  - with `prefers-reduced-motion: reduce`, everything is visible without animation
- [ ] **Step 5: Hand over to Jeffery for review** (do not push). Include:
  - the copy to review: the about paragraphs (Task 5) and the five drafted blurbs in `github.config.ts` (Argo, telemetry.dev, PGRun, K8sGPT, Canonical Kubernetes)
  - the one-time setup checklist, verbatim from spec §4.7:
    1. Fine-grained PAT (public repos, read-only), added to Vercel as `GITHUB_TOKEN` for Production + Preview. Do this **before** the branch is pushed.
    2. A Vercel deploy hook for `main`, added to GitHub secrets as `VERCEL_DEPLOY_HOOK_URL`.
    3. The `portfolio` topic on `lofoneh/kvlite`.
  - the reminder that the daily schedule only fires once `daily-rebuild.yml` is on `main`, and that GitHub pauses schedules after 60 days with no repo activity
- [ ] **Step 6: After approval:** `git push origin feat/portfolio-revamp`, then `git checkout dev && git merge feat/portfolio-revamp --ff-only && git push origin dev`. **Stop**, because Jeffery merges `dev` into `main`.
