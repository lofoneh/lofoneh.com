# One-page scroll + scrollspy navigation — design

**Date:** 2026-05-31
**Status:** Approved (pending spec review)

## Goal

Turn the multi-route portfolio into a single-page experience. All primary
sections (about, experience, projects, writing) live on the home page and flow
in a natural vertical scroll. The header nav links jump to sections and
smooth-scroll; the nav item for the section currently in view is highlighted
(scrollspy). Individual blog posts keep their own pages.

## Decisions (from brainstorming)

1. **Scroll feel:** natural continuous scroll with scrollspy — *not* full-page
   snap. Flexible section lengths, mobile-friendly, accessible.
2. **Writing section:** shows post *previews* (title, date, reading time,
   excerpt) that link out to the existing per-post pages at `/writing/<slug>`.
   Posts are not inlined — their URLs, comments (Giscus), share buttons, and SEO
   stay intact.
3. **Old routes:** `/experience`, `/projects`, `/writing` redirect to the
   matching home anchor (`/#experience`, etc.). Content is authored once.

## Architecture

### Section components

Extract each current page body into a focused section component so content has
a single source and `index.astro` stays readable:

- `src/components/sections/AboutSection.astro` — terminal boot hero + bio
  (current `index.astro` body).
- `src/components/sections/ExperienceSection.astro` — roles, skills, education,
  certifications, contact CTA (current `experience.astro` body).
- `src/components/sections/ProjectsSection.astro` — shipped/ongoing + next-up
  (current `projects.astro` body).
- `src/components/sections/WritingSection.astro` — post previews linking to
  `/writing/<slug>` (derived from the current blog list/index).

Each component renders the section's existing internal markup unchanged; this is
a move, not a redesign.

### Home page composition

`src/pages/index.astro` composes the four components, each wrapped so it is an
anchor target and clears the sticky header:

```astro
<section id="about" class="scroll-mt-20"><AboutSection /></section>
<section id="experience" class="scroll-mt-20"><ExperienceSection /></section>
<section id="projects" class="scroll-mt-20"><ProjectsSection /></section>
<section id="writing" class="scroll-mt-20"><WritingSection /></section>
```

`scroll-mt-20` (5rem) matches the sticky header height (`h-16` / `md:h-20`,
i.e. 64–80px) so a jumped-to heading is not hidden underneath it.

Because `WritingSection` needs the post list, the data fetch
(`getCollection`/blog helpers currently used by the writing index) moves into
the home page frontmatter (or the section component's frontmatter) and is passed
to `WritingSection`.

### Navigation + scrollspy

- `src/navigation.ts` header links change from route permalinks to in-page
  anchors: `#about`, `#experience`, `#projects`, `#writing`. An **about** link
  is added so every section maps to a nav item. The Resume action is unchanged.
  The logo continues to point to `/` (scrolls to top / about).
- `Header.astro` no longer derives the active link from `currentPath`
  (path-based highlighting is meaningless on one page). Instead, anchors carry a
  stable hook (e.g. `data-nav="experience"`) and a scrollspy script toggles
  `aw-link-active` on the link whose section is in view.
- **Scrollspy script:** a small `is:inline` script using `IntersectionObserver`
  watching the four `<section>` elements. The section nearest the top of the
  viewport (within a top-biased rootMargin, e.g. `-45% 0px -50% 0px`) is "active";
  its matching nav link(s) get `aw-link-active`, all others have it removed.
  Applies to both the desktop nav and the mobile-panel nav. Runs on load and on
  `astro:after-swap` for consistency with the existing script pattern.
- Smooth scrolling and reduced-motion are already handled: `BasicScripts.astro`
  adds `motion-safe:scroll-smooth` to `documentElement`, so click-to-scroll is
  smooth only when motion is allowed.

### Redirects for old routes

Replace the standalone `experience.astro`, `projects.astro`, and the blog list
route's index behavior with redirects to the home anchors. Use Astro's
`redirects` config in `astro.config.ts`:

```ts
redirects: {
  '/experience': '/#experience',
  '/projects': '/#projects',
  '/writing': '/#writing',
}
```

This emits redirects honored by the Vercel static deploy, so existing links,
bookmarks, and sitemap entries do not 404.

**Constraint:** the blog *list* route currently lives at
`src/pages/[...blog]/[...page].astro` and generates the paginated index pages
(`/writing`, `/writing/2`, …) via `getStaticPathsBlogList`. Per-post pages
(`/writing/<slug>`) are produced by a **separate** post route and must remain
untouched. Folding the writing index into the home page means the list route's
index pages are removed so the `/writing` redirect owns that path — the planning
step must verify it edits/removes only the list route, not the post route, and
must confirm nothing else (related-posts widgets, RSS, sitemap) links to a
now-removed `/writing/N` pagination URL. Pagination of the on-home writing list
is out of scope.

### Motion

- `AboutSection` keeps the existing on-load terminal boot animation and
  staggered `.reveal` — it is above the fold.
- `ExperienceSection`, `ProjectsSection`, `WritingSection` switch their entrance
  from on-load `.reveal` delays to **scroll-triggered** reveals using the
  existing `intersect:` utility system (`BasicScripts.astro` Observer). This
  avoids animating off-screen content on load and makes sections animate as the
  reader reaches them. All reveals remain `prefers-reduced-motion` gated.

## Components and responsibilities

| Unit | Does | Depends on |
| --- | --- | --- |
| `AboutSection` | Hero + bio markup | none (self-contained) |
| `ExperienceSection` | Career/skills/education/certs/contact | `~/data/experience`, stack-icons, UI atoms |
| `ProjectsSection` | Project lists | `~/data/projects`, `WorkList` |
| `WritingSection` | Post previews → post pages | blog collection + `~/utils/blog` |
| `index.astro` | Compose sections, fetch blog data | the four section components |
| scrollspy script | Toggle `aw-link-active` by visible section | `IntersectionObserver` |
| `astro.config.ts` redirects | Old route → anchor | Astro `redirects` |

## Edge cases

- **Deep link to `/#experience`:** browser scrolls to the section on load;
  scrollspy lights the matching nav item.
- **Reduced motion:** smooth scroll disabled (existing `motion-safe` gate);
  scrollspy still functions (it toggles a class, not an animation).
- **Mobile menu:** closes on anchor click (already wired in `BasicScripts`).
- **No-JS:** anchors still jump to sections (native `#` behavior); scrollspy
  highlight is the only thing lost, which is non-essential.
- **Contact CTA** at the end of the experience content remains in place.

## Out of scope

- Full-page snap scrolling.
- Inlining post bodies.
- Pagination of the on-home writing list (show latest N).
- Any visual redesign of section internals — this is a structural move.

## Open question (resolve during planning)

- **How many posts** to show in the writing section, and whether to include a
  "see all writing" link. With one post today, show all; design the component to
  cap at a sensible N (e.g. 5) and only render a "see all" link if more exist.
  Since `/writing` now redirects to `/#writing`, a "see all" link is unnecessary
  unless a dedicated archive page is reintroduced later — default to no archive
  link for now.
