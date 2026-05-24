# Portfolio redesign — design spec

**Date:** 2026-05-24
**Owner:** Jeffery Lofoneh Asamani (`jefferyasamani7@gmail.com`)
**Target:** `lofoneh.com`
**Status:** Approved by user; in implementation

## 1. Background

The repo is forked from [AstroWind](https://github.com/arthelokyo/astrowind) by [@arthelokyo](https://github.com/arthelokyo) — a multi-purpose template built for SaaS, marketing, landing pages, and portfolios. We're remodeling it into a single-purpose personal portfolio. Most of the template (≈60% of widgets, ≈70% of routes) is dead weight for this goal and will be removed.

## 2. About the owner

- **Role:** Software engineer — backend / infra specialization.
- **Career stage:** Early-career (0–3 years).
- **Goal of site:** Balanced across (a) landing a full-time SWE role, (b) winning freelance / contract work, (c) building a personal brand. Slight bias toward job-hunt given career stage.
- **Voice:** Quietly confident, first-person. Plainspoken. Backend-engineer-with-taste.

## 3. Information architecture

Five routes. Every nav click goes somewhere worth being.

| Route             | Purpose                                                                                                                                                                              |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/`               | Single-scroll homepage: hero + featured work (3–4 cards) + about teaser + writing teaser + footer CTA.                                                                               |
| `/work`           | Full project list. Each entry: title, one-liner, stack tags, role, year, links (live + repo). Per-project detail pages can be added later for projects that warrant a deep write-up. |
| `/about`          | Long-form bio, headshot, what I'm looking for, current stack, contact links.                                                                                                         |
| `/writing`        | Blog index. Empty-state ready for launch. Reuses existing AstroWind blog pipeline (categories, tags, RSS, reading time).                                                             |
| `/writing/[slug]` | Single post. MDX-capable. Dark-first prose styles.                                                                                                                                   |

**Plus:** `/rss.xml`, `/sitemap-*.xml`, `/404`.

**Removed:** `/services`, `/pricing`, `/contact`, `/privacy`, `/terms`, `/homes/*` (4 pages), `/landing/*` (6 pages).

**Contact** lives in footer + `/about` CTAs (no dedicated `/contact` page). **Resume** is a PDF download (`/resume.pdf` from `public/`) — no HTML resume page.

## 4. Visual system

### Color tokens (replace all `--aw-color-*`)

| Token         | Dark (default) | Light     | Use                                   |
| ------------- | -------------- | --------- | ------------------------------------- |
| `--ink`       | `#fafafa`      | `#0a0a0a` | Body text, headlines                  |
| `--ink-2`     | `#a1a1aa`      | `#52525b` | Secondary text, captions, meta        |
| `--ink-3`     | `#52525b`      | `#a1a1aa` | Tertiary — borders, faint labels      |
| `--surface`   | `#0a0a0a`      | `#fafafa` | Page background                       |
| `--surface-2` | `#171717`      | `#f4f4f5` | Card / inset background (sparing use) |
| `--rule`      | `#27272a`      | `#e4e4e7` | Hairline dividers, focus rings        |

**No accent color.** Monochrome only. Hover = underline / weight shift / `--surface-2` tint. Focus = visible 2px ring in `--ink`.

### Typography

- **Sans (display + body):** Geist Sans — `@fontsource-variable/geist`.
- **Mono (terminal accents, code, labels):** Geist Mono — `@fontsource-variable/geist-mono`.

Type scale (rem): `0.75 / 0.875 / 1 / 1.125 / 1.375 / 1.75 / 2.25 / 3 / 4`. Display sizes reserved for the page hero. Line-height: 1.5 body, 1.1 display, 1.6 prose.

### Spacing & layout

- 4px base unit. Steps: 4 / 8 / 16 / 24 / 32 / 48 / 64 / 96.
- Max content width: 64rem (1024px). Reading width on posts: 38rem (608px).
- Vertical rhythm: 96px between major sections, 48px within.

### Terminal motifs (sparing — flavor, not theme)

- Section labels: `~/work`, `~/writing`, `~/about` in mono uppercase.
- Primary CTAs: `$ ./view-resume`, `$ ./email-me` in mono.
- Single-line ASCII rules `─────` between major sections.
- Hero ID line: `~ jeffery@lofoneh.com` above the name (mono).
- Project tags: `[ go ] [ grpc ] [ kafka ]` in mono.
- Theme toggle: `[dark]` / `[light]` in mono (no icon).

### Motion

Restrained. Intersection fade-in (existing `intersect` variant). 200ms ease-out on hover/focus. No parallax. No scroll-jacking. Respect `prefers-reduced-motion`.

### Imagery

Monochrome project screenshots by default (`filter: grayscale(1)`, lifted on hover). One headshot on `/about`, also grayscale. The grayscale discipline forces strong typography and composition.

## 5. Component decisions

### Keep (restyle, not rebuild)

- `widgets/Header.astro`, `widgets/Footer.astro` (restructure nav/footer; keep theme-toggle + mobile-menu plumbing).
- `widgets/BlogLatestPosts.astro` (restyle; reuse on home for writing teaser).
- `ui/WidgetWrapper.astro`, `ui/Button.astro` (restyle for monochrome/terminal).
- All `components/common/*` except `SplitbeeAnalytics.astro`.
- All `components/blog/*` (restyle for monochrome prose).

### Build new

- `widgets/PortfolioHero.astro` — name + role line + two terminal CTAs.
- `widgets/WorkList.astro` + `ui/WorkCard.astro` — project showcase.
- `widgets/AboutSection.astro` — used on home (teaser) and `/about` (full).
- `ui/SectionLabel.astro` — `~/work`-style mono header.
- `ui/TerminalCTA.astro` — `$ ./action` styled link/button.
- `ui/ASCIIRule.astro` — `─────` divider.

### Delete

**Widgets (19):** `Hero.astro`, `Hero2.astro`, `HeroText.astro`, `Features.astro`, `Features2.astro`, `Features3.astro`, `Pricing.astro`, `Stats.astro`, `Steps.astro`, `Steps2.astro`, `Testimonials.astro`, `Brands.astro`, `FAQs.astro`, `Contact.astro`, `CallToAction.astro`, `Content.astro`, `BlogHighlightedPosts.astro`, `Announcement.astro`, `Note.astro`.

**UI primitives (3):** `Form.astro`, `Headline.astro`, `Timeline.astro`.

**Common (1):** `SplitbeeAnalytics.astro` (consolidate on one analytics provider).

**Pages (15):** `contact.astro`, `pricing.astro`, `services.astro`, `privacy.md`, `terms.md`, `homes/*` (4), `landing/*` (6).

**Content:** all 6 demo posts in `src/data/post/`. Keep one minimal placeholder so blog routes still build until Phase 6.

**Notes:**

- _Testimonials deferred._ Add only when 2+ real, specific quotes exist. Recoverable from git history at any time.
- _Privacy / Terms_ re-added only if we start collecting data that legally requires them.

## 6. Phase plan

| #   | Branch                   | What                                                                                                                                                                                                                                                               | Driver        |
| --- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------- |
| 1   | `chore/strip-template`   | Delete dead widgets/routes/posts/assets. Trim `config.yaml`. Rewrite `navigation.ts`. Stub `index.astro` and `about.astro` so build passes.                                                                                                                        | Claude        |
| 2   | `feat/design-foundation` | Install Geist Sans + Mono. Rewrite `CustomStyles.astro` with monochrome tokens. Update Tailwind `@theme`. Build `SectionLabel`, `TerminalCTA`, `ASCIIRule`. Restyle `Button`, `WidgetWrapper`. Restructure `Header` nav + `[dark]`/`[light]` toggle. Footer shell. | Claude        |
| 3   | `feat/work-page`         | `projects` content collection in `src/data/projects/` (or typed `src/data/projects.ts`). Build `WorkCard` + `WorkList`. Create `/work` route. Seed 3 placeholder projects.                                                                                         | Claude        |
| 4   | `feat/home`              | Build `PortfolioHero`. Rewrite `index.astro` to compose hero + work teaser + about teaser + writing teaser + footer CTA.                                                                                                                                           | Claude        |
| 5   | `feat/about-page`        | Build `AboutSection`. Rewrite `/about` with bio, current stack, what-I'm-looking-for, contact links. Headshot slot wired.                                                                                                                                          | Claude        |
| 6   | `feat/blog-restyle`      | Restyle all 10 blog components. Empty-state for `/writing`. Tune `SinglePost` prose for dark-first reading. Keep RSS + categories + tags + reading time.                                                                                                           | Claude        |
| 7   | `feat/polish`            | Restyle `404`. Dark monochrome OG image template. Favicon. Mobile menu tune. A11y pass: focus rings, skip-link, alt text, keyboard nav, `prefers-reduced-motion`. Lighthouse check.                                                                                | Claude        |
| 8   | `chore/content-fill`     | Real bio, real projects, headshot, `resume.pdf`, optional first post.                                                                                                                                                                                              | User + Claude |
| 9   | `chore/deploy`           | Vercel setup, domain `lofoneh.com`, analytics, preview deploys.                                                                                                                                                                                                    | User + Claude |

**Branch workflow:** each phase ships on its own feature branch off `dev`. After review, the branch is merged into `dev`. The user merges `dev` into `main` themselves.

## 7. Success criteria

- Site shows what Jeffery does in under 10 seconds (recruiter skim test).
- Type, spacing, and monochrome restraint signal taste without flashiness.
- Lighthouse ≥ 95 across Performance / Accessibility / Best Practices / SEO.
- Adding a new project = one file change (data entry), no component edits.
- Adding a blog post = drop a `.md`/`.mdx` in `src/data/post/`, nothing else.
- Site builds clean (`bun run check` + `bun run build`) with zero warnings.

## 8. Out of scope

- Testimonials section (deferred until real quotes exist).
- HTML resume page (PDF download is enough).
- E-commerce, contact form, comment system, multi-language, RTL.
- Per-project case-study pages (deferred; can be added selectively in Phase 8+ if a project deserves it).
- CMS integration (content is in-repo).
