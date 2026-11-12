# Portfolio revamp: open source first, GitHub-synced — design

**Date:** 2026-11-12 · **Branch:** `feat/portfolio-revamp` (from `dev`) · **Builds on:** [2026-05-24 portfolio redesign](./2026-05-24-portfolio-redesign-design.md), [2026-05-31 one-page scrollspy](./2026-05-31-one-page-scrollspy-design.md)

## 1. Intent

The site is out of date next to Jeffery's 2026 CV ([Claude doc: "Jeffery Asamani — Resume (2026 update)"](https://claude.ai/artifact/9ugBfPKEdE1uUYDgQPZnaV)). The biggest change in the CV is open-source work: merged failover fixes in KiviDB's Kubernetes operator, plus PRs to Argo Workflows, Kargo and telemetry. None of it is on the site.

GitHub shows even more than the CV. As of 2026-11-12, `is:pr author:lofoneh is:public -user:lofoneh` returns 48 merged PRs across 11 upstream projects, excluding one 2024 PR:

| Card (group) | Repos | Merged | Open |
|---|---|---|---|
| Argo Workflows | argoproj/argo-workflows | 13 | 1 |
| telemetry.dev | telemetry-dev/telemetry (8), stats (2), docs (1) | 11 | 1 |
| PGRun | pgrundev/pgbot (7), pgterm (1), pggo (0) | 8 | 2 |
| KiviDB | kividbio/kividb-operator (6), kividb (1) | 7 | 1 |
| k8sgpt | k8sgpt-ai/k8sgpt | 5 | 0 |
| Kargo | akuity/kargo | 2 | 1 |
| Canonical Kubernetes | canonical/k8s-snap | 2 | 0 |
| *(hidden: no merged PR)* | e2b-dev/runtime | 0 | 1 |
| *(excluded)* | Btk990/Peerly-App (2024) | 1 | 0 |

Note: `gh search prs` without `is:public` and a high limit hides most of these behind private win-admin PRs. Always verify with the exact query above.

The revamp does three things:

1. **Open source becomes the headline.** It moves from absent to the first thing a visitor sees, both in the hero and as section 02.
2. **GitHub keeps it current.** Open-source cards, PR counts, an activity feed and Jeffery's own tagged repos come from GitHub at build time. A daily rebuild keeps them fresh with no manual edits.
3. **Content and layout catch up with the CV**, in the approved "terminal dashboard" direction (direction B).

**Audience:** hiring managers for remote platform / infra / DevOps roles. The site should read as evidence: real merged PRs in real infrastructure projects, then the day job, then the things he has built.

**Title:** "DevOps & Backend Engineer", word for word as in the CV, so the site and the resume tell one story.

## 2. Goals, non-goals, anti-goals

**Goals**
- A visitor sees recent, real open-source work above the fold, on desktop and on phone.
- A new merged PR, a newly qualifying upstream repo, or a newly tagged own repo shows up within a day with no edit to this repo.
- Every content fact on the site matches the CV or GitHub.

**Non-goals**
- No runtime (in-browser or serverless) GitHub calls. The site stays `output: 'static'`.
- No accent colour or new visual identity. Keep monochrome, dark-first, Geist + Geist Mono, terminal accents.
- No changes to the blog itself (posts, post pages, RSS) beyond the home-page Writing section's styling.
- No per-project detail pages, CMS, or database.

**Anti-goals (a failure even if it "works")**
- **Private data leaking.** `lofoneh/win-admin` is private, yet an authenticated `gh search prs --author lofoneh` returns its PRs. Nothing from a private repo may ever reach the build output.
- **A bot committing to `main`.** `main` is touched only by Jeffery's own merges.
- **An empty or half-broken production site** because GitHub's API was down or slow.
- **Noise.** Throwaway forks, closed-unmerged PRs and commit spam do not appear.

## 3. Page structure (approved: direction B)

One-page home, in this order. Section ids drive the header nav and ScrollSpy.

| # | id | Section | Source of content |
|---|----|---------|-------------------|
| (hero) | `about` | Split hero: intro left, activity panel right | Copy in component; activity from GitHub |
| 02 | `open-source` | **Open source.** 3-column cards | GitHub + overrides config |
| 03 | `experience` | **Where I've worked.** Compact dated timeline, skills chips, certs + education | `src/data/experience.ts` (CV) |
| 04 | `projects` | **Things I've built.** Two groups: *From GitHub* (auto) and hand-written work | GitHub (topic) + `src/data/projects.ts` |
| 05 | `writing` | **Writing.** Post list | Content collection (unchanged source) |
| — | `contact` | Closing CTA band (unnumbered, as today) | Copy in component |

The hero has no numbered rail. Numbers run 02–05, as approved in the mockup. The header nav gains **Open source** between About and Experience. ScrollSpy's section list becomes `about, open-source, experience, projects, writing, contact`.

Reference mockups (local, untracked): `.superpowers/brainstorm/11752-1794501003/content/full-page-b.html` (approved full page, desktop + phone) and `direction.html` (A/B/C; B chosen). The mockups use the CV's numbers. Real counts come from GitHub (§1). The mockup's two-group Projects section is superseded by §3.4.

### 3.1 Hero (`about`)

- **Left column:** keep the `$ whoami` typed-command animation and `hi, i'm jeffery 👋` h1, the single h1 on the page. Under it, a mono title line: `devops & backend engineer · accra, ghana · open to remote` (on phone it wraps to two lines: title, then place + remote). Then the about copy (§5.1).
- **Right column:** the activity panel (§4.4). Header `~/activity · $ gh pr list --author lofoneh` with `synced daily` on the right. 6 rows on desktop, 4 on phone. Footer legend and totals: `● merged ○ in review · N merged · M in review · K projects`.
- **Phone:** the columns stack, intro first, panel second. Phone rows collapse to `● repo#num · merged|review`, without the title, so they don't truncate into mush.

### 3.2 Open source (`open-source`, 02)

- `SectionHeader` index `02`, label `open-source`, title `Open source.`, intro `Merged work in Kubernetes, GitOps, observability and Postgres projects.`
- Grid: 3 columns from `lg`, 2 at `md`, 1 on phone.
- **Card** (equal weight, approved "what I did + PR links"):
  - meta line (mono, dim): `owner · tag`, e.g. `kividbio · Go + Rust`, `argoproj · CNCF graduated`
  - name, e.g. `KiviDB`
  - "what I did": 1–2 lines. Use the override blurb; otherwise fall back to `latest: <most recent merged PR title>` (cleaned as in §4.4). Never fall back to the repo description: that is the project's tagline, not Jeffery's work.
  - counts: `N merged · M in review` (omit `· M in review` when M = 0)
  - PR links: the 3 most recent merged PRs as `#77`. A cross-repo PR inside a group is prefixed with its repo, e.g. `kividb#636`. Then `+N` when more exist, linking to a GitHub search of Jeffery's PRs in that repo or group.
- Card order (decided): **KiviDB pinned first** (an override `order` value pins a card). The rest sort by merged-PR count, descending; ties go to the most recent merge.
- Cap: 6 cards (two full rows of 3). Beyond that, a `$ ./all-prs →` link to the GitHub search for all of Jeffery's public PRs. With today's data the cards are KiviDB, Argo Workflows, telemetry.dev, PGRun, k8sgpt and Kargo; Canonical Kubernetes falls behind the link (it ties with Kargo on 2 merged, and Kargo merged more recently).

### 3.3 Experience (`experience`, 03)

- `SectionHeader` index `03`, title `Where I've worked.` Keep the intro sentence and the "grab the resume" link.
- **Timeline** (replaces the bordered role cards): each role is a row with a mono date column on the left (`aug 2024 — now`) and role title, company · location and bullets on the right. Hairline rule between rows. On phone, the date sits above the title.
- Role text = the CV, verbatim (§5.2).
- **Skills:** a sub-label `skills`, then one row per CV category: mono uppercase label + text chips (`[ go ]`-style bordered mono chips, as in the mockup). This replaces the icon rows. Categories and items in §5.3.
- **Certs & education:** a sub-label, then one compact line or short list: the four certifications · BSc Metallurgical Engineering, KNUST (2018–2022).

### 3.4 Projects (`projects`, 04)

- `SectionHeader` index `04`, title `Things I've built.`
- **One grid, no sub-groups** (decided; this replaces the mockup's two groups). Jeffery has only one public non-fork repo worth showing today (kvlite), so a separate "From GitHub" group would hold one card.
  - Auto cards first, from tagged own repos (§4.3). Meta `github · synced · <language>`, name, blurb, links `$ ./repo` and `$ ./live` (if the repo has a homepage URL).
  - Then the hand-written cards from `projects.ts`, in this order: GiftBanc, WIN Transport, WIN Church, IaC Studio. Meta like `contract · devops`, name, one-liner, `$ ./live` link. IaC Studio's meta reads `private` and it has no link.
  - Grid: 3 columns from `lg`, 2 at `md`, 1 on phone.
- Remove Collage and the "next up" block.

### 3.5 Writing (05) and Contact

- Writing: `SectionHeader` index `05`. Post rows as `date | title`, hairline separated, restyled to match the timeline. Same data and links as today.
- Contact CTA: same structure. Copy becomes `Open to remote DevOps, infrastructure and backend roles.` The buttons stay `$ ./email-me` and `$ ./resume.pdf`.

### 3.6 Visual rules (unchanged identity)

Tokens from `CustomStyles.astro` only (`ink`, `ink-2`, `ink-3`, `surface`, `surface-2`, `rule`). Activity status uses shape, not colour: a **filled dot = merged**, a **hollow ring = in review**. Keep the existing `reveal` / `reveal-up` motion and `prefers-reduced-motion` behaviour. Every section must work at 360 / 768 / 1280 px with no horizontal scroll. The panel's long repo names truncate with an ellipsis.

## 4. GitHub sync

### 4.1 How it runs (decided)

**Build-time fetch plus a scheduled rebuild. Nothing is committed.**

1. During `astro build`, a data module fetches GitHub data once (a module-level memoised promise shared by all components) and the pages render it statically.
2. `.github/workflows/daily-rebuild.yml`: `schedule` (daily, 05:00 UTC) + `workflow_dispatch`. Its one step `POST`s the Vercel deploy hook URL from secret `VERCEL_DEPLOY_HOOK_URL`. It never checks out code to commit and never pushes.
3. Vercel rebuilds the latest `main` with fresh data.

Rejected options: a bot committing a JSON snapshot (it would write to `main` and leave `dev` behind `main`), a live in-browser fetch (rate limits, empty when GitHub is down), and a serverless/server-island fetch (runtime dependency for daily freshness).

Known limits: there is no git history of data changes; the build logs record what was fetched. GitHub disables scheduled workflows in a public repo after 60 days with no repo activity. The workflow file only starts firing once it is on `main`, which happens when Jeffery merges.

### 4.2 What gets fetched

Use the **GraphQL API** (one or two paged queries) with `GITHUB_TOKEN`:

- **PRs:** search `is:pr author:lofoneh is:public -user:lofoneh` (upstream repos only, never Jeffery's own repos or forks), paged until exhausted. Per PR: repo `owner/name`, repo URL, description, primary language, number, title, URL, state (`MERGED` / `OPEN`; drop `CLOSED` unmerged and drafts), `mergedAt`, `createdAt`, and the repo's `isPrivate` flag.
- **Own repos:** `user(login: "lofoneh") { repositories(privacy: PUBLIC, isFork: false, ownerAffiliations: OWNER) }`: name, description, URL, homepage URL, primary language, `pushedAt`, topics, `isPrivate`, `isArchived`.

**Privacy guard (anti-goal 1):** the token is a fine-grained PAT with *public repositories, read-only* access. In addition, the code (a) puts `is:public` in the query and (b) drops any node whose `isPrivate` is true before it reaches any component. Both guards are required; either alone is not enough.

### 4.3 Rules (decided: opt-in)

- **Grouping first:** by default each upstream repo is its own card. Config groups merge several repos into one card, and counts and PR links aggregate across the group. Seed groups: **KiviDB** = `kividbio/kividb-operator`, `kividbio/kividb`; **telemetry.dev** = `telemetry-dev/telemetry`, `telemetry-dev/stats`, `telemetry-dev/docs`; **PGRun** = `pgrundev/pgbot`, `pgrundev/pgterm`, `pgrundev/pggo`.
- **An upstream card qualifies** when its repo or group has **at least one merged PR**. A repo with only open PRs and no group (today: `e2b-dev/runtime`) stays hidden until a PR merges, and its PRs stay out of the activity panel (§4.4). A grouped repo with no merged PR of its own (pggo) still counts, because its group qualifies.
- **Own repo qualifies** when it is public, not a fork, not archived, and has the topic `portfolio`.
- **Card copy (decided: auto, can override):** the name defaults to the repo name. "What I did" defaults to `latest: <PR title>` (§3.2), never the repo description. The meta tag defaults to the primary language. Any of these can be overridden per repo or group in config. For own repos, the blurb defaults to the repo description, which is fine there because it is his own project.
- **Exclude list** in config: repos (or individual PRs) that should never show. Seed: `Btk990/Peerly-App`.
- **No date floor.** The exclude list covers the one old PR.

### 4.4 Activity panel data

Public PRs from **qualifying** upstream cards only (including grouped repos), state merged or open. Sorted newest first by `mergedAt ?? createdAt`. **At most 2 rows per card** (decided), so the panel shows breadth: today, pure newest-first would be 6 KiviDB rows. Top 6 after that cap (4 shown on phone). The row text is the PR title with a trailing issue ref like ` (#78)` stripped, truncated by CSS. Each row links to the PR. Totals in the footer come from the same filtered set: merged count, open count, qualifying project count.

### 4.5 Overrides config — `src/data/github.config.ts`

Hand-edited, typed. Shape is up to the builder; it must express:

```ts
{
  username: 'lofoneh',
  ownRepoTopic: 'portfolio',
  groups: [
    { key: 'kividb', name: 'KiviDB', repos: ['kividbio/kividb-operator', 'kividbio/kividb'] },
    { key: 'telemetry-dev', name: 'telemetry.dev', repos: ['telemetry-dev/telemetry', 'telemetry-dev/stats', 'telemetry-dev/docs'] },
    { key: 'pgrun', name: 'PGRun', repos: ['pgrundev/pgbot', 'pgrundev/pgterm', 'pgrundev/pggo'] },
  ],
  overrides: {
    // keyed by group key or 'owner/repo'
    kividb: { order: 0, tag: 'Go + Rust', blurb: 'Fixed failover data-loss bugs: a force-deleted master no longer loses acknowledged writes.' },
    'argoproj/argo-workflows': { name: 'Argo Workflows', tag: 'CNCF graduated', blurb: '…' },
    'akuity/kargo': { name: 'Kargo', tag: 'GitOps', blurb: 'The http promotion step checks failure criteria first, so error responses report their real message.' },
    'telemetry-dev': { tag: 'OpenTelemetry', blurb: '…' },
    pgrun: { tag: 'Postgres', blurb: '…' },
    'k8sgpt-ai/k8sgpt': { tag: 'CNCF sandbox', blurb: '…' },
    'canonical/k8s-snap': { name: 'Canonical Kubernetes', blurb: '…' },
    'lofoneh/kvlite': { blurb: 'In-memory key-value store: Redis-like protocol over TCP, per-key TTLs, a write-ahead log with crash recovery and snapshot compaction.' },
  },
  exclude: ['Btk990/Peerly-App'],
}
```

**Blurb seeding:** KiviDB and Kargo blurbs come from the CV. Argo, telemetry.dev, PGRun, k8sgpt and Canonical Kubernetes have more merged work than the CV describes. The builder drafts each of their blurbs from the actual merged PR titles: one factual sentence about what Jeffery changed, no invented impact. Jeffery reviews every blurb on the branch before merge, like the about copy. The kvlite override matters: its GitHub description mentions "AI-powered analytics", which the CV does not claim.

### 4.6 Tokens, environments and failure

| Where | Token | If the fetch fails or the token is missing |
|---|---|---|
| Vercel **production** (`VERCEL_ENV=production`) | Vercel env `GITHUB_TOKEN` (fine-grained PAT, public read-only) | **Fail the build.** Vercel keeps serving the last good deploy. |
| Vercel **preview** | same env var | Fail the build (previews should look like production). |
| GitHub Actions CI (`actions.yaml`) | `secrets.GITHUB_TOKEN` passed as env to `bun run build` | Fail the build. CI triggers stay as they are (push/PR to `main`). Before handing the branch over, the builder runs a local build with a real token (`GITHUB_TOKEN=$(gh auth token) bun run build`) as the with-token check. |
| Local (`bun run dev` / `build` / `check`) | `GITHUB_TOKEN` if set (e.g. `GITHUB_TOKEN=$(gh auth token)`) | No token: log a clear warning and use the committed fixture `src/data/github.fixture.json`. |

The fixture is a trimmed, public-only snapshot shaped like the fetch result, generated by a script (e.g. `bun run github:fixture`). It is regenerated by hand, never by a bot. It exists only so local work and `bun run check` run offline.

Timeouts: a single overall fetch timeout (around 20 s) so a hung API fails fast instead of stalling the build.

### 4.7 One-time manual setup (Jeffery)

1. Create a fine-grained PAT: public repositories, read-only, no other permissions. Add it to Vercel as `GITHUB_TOKEN` (Production + Preview). **Do this before the branch is pushed to origin**, or Vercel's preview build of the branch fails by design.
2. Vercel → Project → Settings → Git → Deploy Hooks: create a hook for branch `main`. Add the URL to GitHub repo secrets as `VERCEL_DEPLOY_HOOK_URL`.
3. Add the `portfolio` topic to `lofoneh/kvlite` (and to any future repo to feature).

The implementation plan must end with this checklist written out for him.

## 5. Content (from the CV)

### 5.1 About copy: light edit

Keep the lowercase voice, the paragraph rhythm and the personal lines. Changes:
- Open with the "parts nobody notices" idea and add the open-source line: *lately that means fixing failover bugs in a Kubernetes database operator, in public, with tests that prove it.*
- Keep the day-job paragraph (DevOps at Adaptive Computer Solutions: CI/CD, Kubernetes, observability).
- Keep the KNUST / self-taught paragraph.
- Replace "at night i'm picking up Ruby on Rails, exploring Pulumi, and getting deeper into LLMs" with the current focus: Rust, Kubernetes operators, open source. Keep the downtime half: movies, anime, Gospel music, acoustic guitar.
- Keep it short enough that the hero's left column doesn't run far below the activity panel on desktop (about 3 short paragraphs).

Jeffery reviews the final wording on the branch.

### 5.2 Experience: `src/data/experience.ts`

Replace role bullets with the CV text:

- **DevOps Engineer**, Adaptive Computer Solutions Ltd, Accra · Aug 2024 – Present
  - Build CI/CD pipelines on Azure DevOps and Azure Kubernetes Service (AKS) that build, test and release applications.
  - Rolled out the LGTM observability stack (Loki, Grafana, Tempo, Prometheus) across production applications, cutting mean incident resolution time by about 50%.
  - Deploy and troubleshoot web and USSD applications built in C#/.NET and React across several environments.
  - Set up and administer PostgreSQL and MongoDB, including configuration, access control and backups.
  - Monitor servers and live endpoints with Uptime Kuma, alerting to Microsoft Teams on downtime.
  - Developing a Go CLI for on-premises CI/CD and operations: it deploys apps, backs up and restores apps and databases, and installs packages offline on air-gapped Linux servers over SSH.
- **DevOps Engineering Intern**, same company · Feb 2024 – Aug 2024
  - Automated health monitoring of 12 Linux and 5 Windows servers with Bash and PowerShell, replacing manual checks.
  - Deployed and configured applications and services in on-premises environments.
- **Independent software development and study** · Nov 2022 – Feb 2024
  - Taught myself programming, cloud and DevOps through hands-on projects, then moved into a professional DevOps role.

Education: drop the `coursework` line (it is not in the CV).

### 5.3 Skills: CV categories

- **Cloud and infrastructure:** AWS (EC2, EKS, ECS, ECR), Azure (AKS, Azure DevOps, Blob Storage), DigitalOcean, Terraform, Ansible
- **Containers and Kubernetes:** Docker, Kubernetes, Helm, kind, Kubernetes operators (controller-runtime), Traefik
- **CI/CD and observability:** GitHub Actions, Azure DevOps, Prometheus, Grafana, Loki, Tempo, OpenTelemetry, Uptime Kuma
- **Languages:** Go, Rust, Python, TypeScript, Ruby, Bash, PowerShell
- **Databases:** PostgreSQL, MongoDB, Supabase, Redis and Redis-compatible stores (KiviDB)
- **Frameworks:** React, Next.js, Expo (React Native), Django, FastAPI, Gin, Prisma, Ruby on Rails

Chips may show the short form (`aws`, `controller-runtime`). Service detail like "(EC2, EKS, ECS, ECR)" can go in a `title` tooltip or be dropped; builder's call.

### 5.4 Hand-written projects: `src/data/projects.ts`

- **GiftBanc**, gift card platform (contract, DevOps): Docker, Ansible, Traefik, GitHub Actions, DigitalOcean. Built and run the CI/CD and hosting for a live e-commerce gift card platform, working with one developer. Live: https://giftbanc.com
- **WIN Transport Services**, bus booking admin portal (contract, full-stack): Next.js, TypeScript, Prisma, Zod, Vercel. Built the admin portal for a live bus-booking platform with one other developer. Live: https://wintransportservices.com
- **WIN Church administration platform** (live): TypeScript, Next.js, Expo (React Native), Supabase, Turborepo. A multi-tenant platform with role-based access, member and group management, and attendance reporting. Live: https://win-admin-alpha.vercel.app. **Replaces the stale Rails/Hotwire entry.** The repo is private, so there is no repo link.
- **IaC Studio**, visual infrastructure as code: Go, Terraform, PostgreSQL, Redis, React. It turns a cloud architecture drawn on a canvas into Terraform for AWS, GCP, Azure or DigitalOcean, runs plan and apply in background workers, and has versioned designs, per-resource cost estimates and live deployment status over WebSocket. It has no public repo or live URL: the card is kept, marked `private`, with no link (decided).
- Remove **Collage**.

### 5.5 Site-wide

- Home page `<title>`: `Jeffery Lofoneh Asamani — DevOps & Backend Engineer`.
- `config.yaml` `metadata.description`: rewrite around DevOps & backend + open-source infra work.
- OG image `src/assets/images/og-default.png`: if it shows the old title, regenerate it with the new one.
- `public/resume.pdf`: replace with a PDF export of the 2026 CV doc (Claude Docs export). If that export isn't possible from the session, stop and ask Jeffery for the PDF.
- `CLAUDE.md` "Project goal": change "backend / infra engineer" to "DevOps & backend engineer". `CLAUDE.md` is gitignored, so this edit stays local and isn't committed. Fix the stale `/experience` / `/projects` mentions in data-file comments.
- `.gitignore`: add `.superpowers/`.

## 6. Constraints

- Astro v6 static output, Tailwind v4 CSS-first, bun, Node ≥ 22.12. No new runtime dependencies for the fetch: use `fetch` against `https://api.github.com/graphql`.
- Branch workflow from `CLAUDE.md`: work on `feat/portfolio-revamp`, merge to `dev` only after Jeffery's review, never push to `main`.
- `bun run check` and `bun run build` must pass, both locally without a token (fixture path) and in CI with a token.
- Responsive at 360 / 768 / 1280.

## 7. Testing

- The fetch → filter → group → sort transform is pure. Put it in its own module (separate from the network call) and cover it with `bun test` (Bun's built-in runner; no new dependency). Cover at least: private-node drop, closed-unmerged and draft drop, qualification (≥1 merged), grouping aggregation, exclude list, activity ordering and truncation to 6, title ref stripping, own-repo topic/fork/archived filter.
- Manual: build with a real token and compare the cards against `gh search prs --author lofoneh` output. Check the three breakpoints. Check `prefers-reduced-motion`.

## 8. Left to the builder

- File and module names and the exact config typing.
- Component breakdown (e.g. `ActivityPanel`, `OssCard`, `Timeline`), and whether `WorkCard` is reused or replaced.
- GraphQL query shape and paging.
- Exact chip styling and the phone nav (the existing header/hamburger stays).
- Whether `stack-icons.ts` / icon include lists shrink now that skills are text chips (keep anything still used by project cards).

## 9. Decisions log

**Jeffery decided:** audience = hiring managers; title "DevOps & Backend Engineer"; open source first, as section 02 right after the hero; equal-weight cards with "what I did" + PR links; direction B (terminal dashboard); scope = content + structure + some redesign; drop Collage; resume PDF exported from the CV doc; about copy = light edit; title in hero + metadata; GitHub auto-updates PR status, new OSS repos, own repos and an activity feed; opt-in by topic; build-time fetch + daily rebuild (no bot commits); auto copy with overrides; pin KiviDB first, auto the rest, group telemetry.dev and PGRun, exclude Peerly-App; activity max 2 per card; Projects as one grid with IaC Studio kept.

**Claude's calls (check these):**
- Card fallback text is `latest: <PR title>`, not the repo description (§3.2, §4.3).
- No date floor; the exclude list handles old PRs.
- Builder drafts the blurbs for Argo, telemetry.dev, PGRun, k8sgpt and Canonical Kubernetes from PR titles; Jeffery reviews them.
- Intro copy for 02 says "Kubernetes, GitOps, observability and Postgres projects".
- CI triggers unchanged; a local with-token build stands in for CI before handover.
- Activity panel shows PR events only, no commits.
- Phone activity rows drop the PR title.
- Experience moves to a compact timeline, skills to text chips.
- Pure transform tested with `bun test`.
- Daily rebuild at 05:00 UTC.
