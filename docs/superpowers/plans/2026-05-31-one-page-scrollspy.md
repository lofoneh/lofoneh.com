# One-page scroll + scrollspy navigation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Collapse the multi-route portfolio into a single scrolling page (about → experience → projects → writing) with scrollspy nav highlighting and smooth anchor scrolling, while keeping per-post pages, comments, and SEO intact.

**Architecture:** Each current page body is extracted into a section component and composed onto `index.astro` inside anchored `<section>` wrappers. Header nav links become root-relative hash anchors with a scrollspy `IntersectionObserver` toggling the active class. Old routes redirect to the matching anchor. Lower sections switch from on-load reveals to scroll-triggered reveals built on the project's existing `intersect:` Observer.

**Tech Stack:** Astro v6 (static output), Tailwind CSS v4 (CSS-first), TypeScript, existing IntersectionObserver in `BasicScripts.astro`.

**Verification note (read first):** This repo has **no test runner** (per `CLAUDE.md`). "Verify" in every task means: run `bun run check` (astro check + eslint + prettier — all must pass) and, where noted, `bun run build`. Final manual verification uses `bun run dev` at viewport widths **360 / 768 / 1280** (standing responsive requirement). Run only one `bun run build`/`dev` at a time — concurrent builds race on `dist/` and fail spuriously.

**Spec:** `docs/superpowers/specs/2026-05-31-one-page-scrollspy-design.md`

**Branch:** `feat/one-page-scrollspy` (already created from `dev`; spec already committed here).

---

## File structure

**Create:**
- `src/components/sections/AboutSection.astro` — hero + bio (moved from `index.astro`)
- `src/components/sections/ExperienceSection.astro` — roles/skills/education/certs/contact (moved from `experience.astro`)
- `src/components/sections/ProjectsSection.astro` — project lists (moved from `projects.astro`)
- `src/components/sections/WritingSection.astro` — post previews (new, uses `findLatestPosts` + `BlogList`)
- `src/components/common/ScrollSpy.astro` — scrollspy script

**Modify:**
- `src/assets/styles/tailwind.css` — add `.reveal-up` scroll-reveal rule
- `src/pages/index.astro` — compose the four sections; include `ScrollSpy`
- `src/navigation.ts` — header links → `/#…` anchors (add About)
- `src/components/widgets/Header.astro` — `data-nav-section` hook; drop path-based active
- `src/components/widgets/WorkList.astro` — card reveal class swap
- `src/components/ui/SectionLabel.astro` — (no change needed; already forwards `class`)
- `astro.config.ts` — add `redirects`

**Delete:**
- `src/pages/experience.astro`
- `src/pages/projects.astro`
- `src/pages/[...blog]/[...page].astro` (writing list/index — frees `/writing`)

**Do NOT touch:** `src/pages/[...blog]/index.astro` (post page), `[category]/[...page].astro`, `[tag]/[...page].astro`.

---

## Task 1: Add the `.reveal-up` scroll-reveal utility

**Files:**
- Modify: `src/assets/styles/tailwind.css` (end of file, after the existing `.reveal` block added previously)

The existing `.reveal` animates on load (used by the about hero). `.reveal-up` stays hidden until the project's `IntersectionObserver` (in `BasicScripts.astro`) removes the `no-intersect` attribute when the element scrolls into view. Pairing element classes: `reveal-up intersect intersect-once`.

- [ ] **Step 1: Append the rule**

Add to the end of `src/assets/styles/tailwind.css`:

```css
/* Scroll-triggered reveal. Pair with the `intersect intersect-once` classes so
   BasicScripts' IntersectionObserver toggles `no-intersect` as the element
   enters the viewport. Hidden only when motion is allowed, so reduced-motion
   and no-JS visitors see content immediately. The Observer also assigns a
   staggered transition-delay automatically for grouped elements. */
@media (prefers-reduced-motion: no-preference) {
  .reveal-up {
    opacity: 0;
    transform: translateY(0.5rem);
    transition:
      opacity 0.5s ease-out,
      transform 0.5s ease-out;
  }

  .reveal-up:not([no-intersect]) {
    opacity: 1;
    transform: none;
  }
}
```

- [ ] **Step 2: Verify**

Run: `bun run check`
Expected: astro check 0 errors, eslint clean, prettier clean. (If prettier rewrites the block, run `bun run fix:prettier` then re-run `bun run check`.)

- [ ] **Step 3: Commit**

```bash
git add src/assets/styles/tailwind.css
git commit -m "add reveal-up scroll-triggered reveal utility"
```

---

## Task 2: Extract `AboutSection`

**Files:**
- Create: `src/components/sections/AboutSection.astro`
- Modify (temporarily, finalized in Task 6): leave `src/pages/index.astro` as-is for now

The about content (terminal boot hero + bio + its scoped `<style>`) moves verbatim out of `index.astro`. The `<Layout>` wrapper and page `metadata` stay behind in `index.astro` (handled in Task 6).

- [ ] **Step 1: Create the component**

Create `src/components/sections/AboutSection.astro` containing **only** the markup currently between `<Layout …>` and `</Layout>` in `src/pages/index.astro` (the `<section class="mx-auto max-w-3xl …">…</section>`), PLUS the entire `<style>…</style>` block from the bottom of `index.astro`. The component has **no frontmatter imports** (the hero is self-contained markup). Do not change any inner markup, classes, or the `.reveal`/`.cmd`/`.caret` animations — the about section keeps its on-load boot animation.

The file is:

```astro
---
---

<section class="mx-auto max-w-3xl px-4 pt-8 pb-20 sm:px-6 md:pt-12 md:pb-28 lg:px-8">
  <!-- …entire current hero markup, moved verbatim… -->
</section>

<style>
  /* …entire current <style> block from index.astro, moved verbatim… */
</style>
```

- [ ] **Step 2: Verify it compiles in isolation**

Run: `bun run check:astro`
Expected: 0 errors. (The component is not yet imported anywhere; this just confirms it parses.)

- [ ] **Step 3: Commit**

```bash
git add src/components/sections/AboutSection.astro
git commit -m "extract AboutSection component from home page"
```

---

## Task 3: Extract `ExperienceSection` and switch to scroll reveals

**Files:**
- Create: `src/components/sections/ExperienceSection.astro`
- Source: `src/pages/experience.astro` (will be deleted in Task 8)

Move the experience page's frontmatter imports and body into the component. Replace the **on-load** reveal classes (`reveal` + inline `--delay`) with **scroll-triggered** ones (`reveal-up intersect intersect-once`, no inline delay).

- [ ] **Step 1: Create the component with moved frontmatter**

Create `src/components/sections/ExperienceSection.astro`. Copy the frontmatter from `experience.astro` **except** the `metadata` object and the `Layout` import (those stay in `index.astro`). Keep these imports:

```astro
---
import { Icon } from 'astro-icon/components';

import SectionLabel from '~/components/ui/SectionLabel.astro';
import TerminalCTA from '~/components/ui/TerminalCTA.astro';
import ASCIIRule from '~/components/ui/ASCIIRule.astro';
import { roles, skills, education, certifications } from '~/data/experience';
import { resolveStackIcon } from '~/data/stack-icons';

const resolvedSkills = skills.map((cat) => ({
  label: cat.label,
  items: cat.items.map((it) => ({ slug: it.slug, learning: it.learning ?? false, ...resolveStackIcon(it.slug) })),
}));
---
```

- [ ] **Step 2: Move the body**

Below the frontmatter, paste everything currently between `<Layout metadata={metadata}>` and `</Layout>` in `experience.astro` (the run of `<section>`/`<ASCIIRule />` blocks). Do not include the `<Layout>` tags themselves.

- [ ] **Step 3: Swap the header reveals**

In the moved markup, change the intro header trio. Replace:

```astro
    <SectionLabel text="experience" class="reveal mb-6" />
    <h1 class="reveal mb-4 text-3xl font-bold leading-tight text-ink sm:text-4xl md:text-5xl" style="--delay:0.08s">
      Where I've worked.
    </h1>
    <p class="reveal max-w-2xl text-base text-ink-2 sm:text-lg" style="--delay:0.16s">
```

with:

```astro
    <SectionLabel text="experience" class="reveal-up intersect intersect-once mb-6" />
    <h1 class="reveal-up intersect intersect-once mb-4 text-3xl font-bold leading-tight text-ink sm:text-4xl md:text-5xl">
      Where I've worked.
    </h1>
    <p class="reveal-up intersect intersect-once max-w-2xl text-base text-ink-2 sm:text-lg">
```

- [ ] **Step 4: Swap the role-card reveals**

Replace the role list item opener:

```astro
        roles.map((role, i) => (
          <li
            class="reveal border border-rule p-6 transition-colors hover:border-ink sm:p-8"
            style={`--delay:${0.06 * i}s`}
          >
```

with (drop the index and inline delay — the Observer staggers automatically):

```astro
        roles.map((role) => (
          <li class="reveal-up intersect intersect-once border border-rule p-6 transition-colors hover:border-ink sm:p-8">
```

- [ ] **Step 5: Verify**

Run: `bun run check:astro`
Expected: 0 errors. (Component not yet imported.)

- [ ] **Step 6: Commit**

```bash
git add src/components/sections/ExperienceSection.astro
git commit -m "extract ExperienceSection, switch to scroll-triggered reveals"
```

---

## Task 4: Extract `ProjectsSection` and switch reveals

**Files:**
- Create: `src/components/sections/ProjectsSection.astro`
- Modify: `src/components/widgets/WorkList.astro`
- Source: `src/pages/projects.astro` (deleted in Task 8)

- [ ] **Step 1: Create the component with moved frontmatter**

Create `src/components/sections/ProjectsSection.astro`. Copy `projects.astro` frontmatter except `metadata` and the `Layout` import:

```astro
---
import SectionLabel from '~/components/ui/SectionLabel.astro';
import WorkList from '~/components/widgets/WorkList.astro';
import { projects } from '~/data/projects';

const real = projects.filter((p) => p.status !== 'exploring');
const exploring = projects.filter((p) => p.status === 'exploring');
---
```

- [ ] **Step 2: Move the body**

Paste everything between `<Layout metadata={metadata}>` and `</Layout>` from `projects.astro`.

- [ ] **Step 3: Swap the header reveals**

Replace:

```astro
    <SectionLabel text="projects" class="reveal mb-6" />
    <h1 class="reveal mb-4 text-3xl font-bold leading-tight text-ink sm:text-4xl md:text-5xl" style="--delay:0.08s">
      Things I have built.
    </h1>
    <p class="reveal max-w-2xl text-base text-ink-2 sm:text-lg" style="--delay:0.16s">
```

with:

```astro
    <SectionLabel text="projects" class="reveal-up intersect intersect-once mb-6" />
    <h1 class="reveal-up intersect intersect-once mb-4 text-3xl font-bold leading-tight text-ink sm:text-4xl md:text-5xl">
      Things I have built.
    </h1>
    <p class="reveal-up intersect intersect-once max-w-2xl text-base text-ink-2 sm:text-lg">
```

And replace the next-up header:

```astro
        <SectionLabel text="next-up" class="reveal mb-6" />
        <p class="reveal mb-8 max-w-2xl text-sm text-ink-2 sm:text-base">
```

with:

```astro
        <SectionLabel text="next-up" class="reveal-up intersect intersect-once mb-6" />
        <p class="reveal-up intersect intersect-once mb-8 max-w-2xl text-sm text-ink-2 sm:text-base">
```

- [ ] **Step 4: Swap the card reveal in WorkList**

In `src/components/widgets/WorkList.astro`, replace:

```astro
      {projects.map((project, i) => (
        <WorkCard project={project} class="reveal" style={`--delay:${0.06 * i}s`} />
      ))}
```

with:

```astro
      {projects.map((project) => (
        <WorkCard project={project} class="reveal-up intersect intersect-once" />
      ))}
```

(`WorkCard` still accepts the optional `class`/`style` props — `style` is simply omitted now.)

- [ ] **Step 5: Verify**

Run: `bun run check:astro`
Expected: 0 errors.

- [ ] **Step 6: Commit**

```bash
git add src/components/sections/ProjectsSection.astro src/components/widgets/WorkList.astro
git commit -m "extract ProjectsSection, switch project cards to scroll reveals"
```

---

## Task 5: Create `WritingSection`

**Files:**
- Create: `src/components/sections/WritingSection.astro`
- Reuses: `~/utils/blog` (`findLatestPosts`), `~/components/blog/List.astro` (`BlogList` → `ListItem`), `~/components/ui/SectionLabel.astro`

This is new markup (the old `/writing` index used pagination, which is out of scope). It mirrors the writing index's header style and renders post previews via the existing `BlogList`, which links each title to `/writing/<slug>`.

- [ ] **Step 1: Create the component**

Create `src/components/sections/WritingSection.astro`:

```astro
---
import SectionLabel from '~/components/ui/SectionLabel.astro';
import BlogList from '~/components/blog/List.astro';
import { findLatestPosts } from '~/utils/blog';

// Show the latest posts inline; each links out to its own /writing/<slug> page.
const posts = await findLatestPosts({ count: 5 });
---

<div class="mx-auto max-w-5xl px-4 pt-8 pb-8 sm:px-6 md:pt-12 md:pb-12 lg:px-8">
  <SectionLabel text="writing" class="reveal-up intersect intersect-once mb-6" />
  <h1 class="reveal-up intersect intersect-once mb-4 text-3xl font-bold leading-tight text-ink sm:text-4xl md:text-5xl">
    Writing.
  </h1>
  <p class="reveal-up intersect intersect-once max-w-2xl text-base text-ink-2 sm:text-lg">
    Notes from work — infrastructure, observability, learning out loud.
  </p>
</div>

<div class="mx-auto max-w-5xl px-4 pb-8 sm:px-6 lg:px-8">
  <div class="reveal-up intersect intersect-once">
    <BlogList posts={posts} />
  </div>
</div>
```

- [ ] **Step 2: Verify**

Run: `bun run check:astro`
Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/sections/WritingSection.astro
git commit -m "add WritingSection with post previews"
```

---

## Task 6: Compose the one-page home

**Files:**
- Modify: `src/pages/index.astro` (full rewrite of the body)
- Add (in Task 7 we add ScrollSpy import; here just the sections)

Replace the entire contents of `index.astro` with the section composition. Keep the existing page `metadata`. Each section wrapper carries the anchor `id` and `scroll-mt-20` (clears the sticky header, which is `h-16`/`md:h-20`).

- [ ] **Step 1: Rewrite `index.astro`**

```astro
---
import Layout from '~/layouts/PageLayout.astro';
import AboutSection from '~/components/sections/AboutSection.astro';
import ExperienceSection from '~/components/sections/ExperienceSection.astro';
import ProjectsSection from '~/components/sections/ProjectsSection.astro';
import WritingSection from '~/components/sections/WritingSection.astro';

const metadata = {
  title: 'Jeffery Lofoneh Asamani — Software Engineer',
  ignoreTitleTemplate: true,
};
---

<Layout metadata={metadata}>
  <section id="about" class="scroll-mt-20"><AboutSection /></section>
  <section id="experience" class="scroll-mt-20"><ExperienceSection /></section>
  <section id="projects" class="scroll-mt-20"><ProjectsSection /></section>
  <section id="writing" class="scroll-mt-20"><WritingSection /></section>
</Layout>
```

- [ ] **Step 2: Verify build (sections now wired together)**

Run: `bun run check && bun run build`
Expected: check passes (0/clean/clean); build completes "9 page(s)" → now **7 pages** (home + 404 + post + category/tag indexes; the writing list route is still present at this point, so page count may differ — the exact number is asserted in Task 9 after deletions). Build must exit 0 with no errors.

- [ ] **Step 3: Commit**

```bash
git add src/pages/index.astro
git commit -m "compose one-page home from section components"
```

---

## Task 7: Anchor nav + scrollspy

**Files:**
- Modify: `src/navigation.ts`
- Modify: `src/components/widgets/Header.astro`
- Create: `src/components/common/ScrollSpy.astro`
- Modify: `src/pages/index.astro` (import ScrollSpy)

- [ ] **Step 1: Point nav links at anchors**

Rewrite `src/navigation.ts` `headerData` (root-relative hashes so links also work from post pages). Remove now-unused permalink imports:

```ts
import { getAsset } from './utils/permalinks';

export const headerData = {
  links: [
    { text: 'About', href: '/#about' },
    { text: 'Experience', href: '/#experience' },
    { text: 'Projects', href: '/#projects' },
    { text: 'Writing', href: '/#writing' },
  ],
  actions: [{ text: 'Resume', href: '/resume.pdf', target: '_blank' }],
};
```

Leave `footerData` and its `getAsset('/rss.xml')` usage unchanged.

- [ ] **Step 2: Add scrollspy hook to Header, drop path-based active**

In `src/components/widgets/Header.astro`:

(a) Remove the now-unused `currentPath` line and the `trimSlash` import. Change the import line:

```ts
import { getHomePermalink, trimSlash } from '~/utils/permalinks';
```
to:
```ts
import { getHomePermalink } from '~/utils/permalinks';
```
and delete this line:
```ts
const currentPath = `/${trimSlash(new URL(Astro.url).pathname)}`;
```

(b) In the **desktop** nav `links.map`, replace the `<a>` with a `data-nav-section` hook and remove the `currentPath` active binding:

```astro
              links.map(({ text, href }) => (
                <li>
                  <a
                    class="block px-3 py-2 text-ink-2 transition-colors hover:text-ink"
                    href={href}
                    data-nav-section={href?.startsWith('/#') ? href.slice(2) : undefined}
                  >
                    {text}
                  </a>
                </li>
              ))
```

(c) In the **mobile** panel `links.map`, do the same:

```astro
            links.map(({ text, href }) => (
              <li>
                <a
                  class="block py-3 text-base text-ink-2 transition-colors hover:text-ink"
                  href={href}
                  data-nav-section={href?.startsWith('/#') ? href.slice(2) : undefined}
                >
                  {text}
                </a>
              </li>
            ))
```

- [ ] **Step 3: Create the scrollspy component**

Create `src/components/common/ScrollSpy.astro`:

```astro
<script is:inline>
  (() => {
    function initScrollSpy() {
      const sections = ['about', 'experience', 'projects', 'writing']
        .map((id) => document.getElementById(id))
        .filter(Boolean);
      const links = Array.from(document.querySelectorAll('[data-nav-section]'));
      if (!sections.length || !links.length) return;

      function setActive(id) {
        links.forEach((a) => {
          a.classList.toggle('aw-link-active', a.getAttribute('data-nav-section') === id);
        });
      }

      let current = null;
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) current = entry.target.id;
          });
          if (current) setActive(current);
        },
        // Top-biased band: a section is "active" while it crosses the upper third.
        { rootMargin: '-45% 0px -50% 0px', threshold: 0 }
      );

      sections.forEach((s) => observer.observe(s));
    }

    if (document.readyState !== 'loading') initScrollSpy();
    else document.addEventListener('DOMContentLoaded', initScrollSpy);
    // Re-init after client-side swaps (matches the BasicScripts pattern).
    document.addEventListener('astro:after-swap', initScrollSpy);
  })();
</script>
```

- [ ] **Step 4: Include ScrollSpy on the home page**

In `src/pages/index.astro`, add the import and place the component inside `<Layout>` after the sections:

```astro
import ScrollSpy from '~/components/common/ScrollSpy.astro';
```
```astro
  <section id="writing" class="scroll-mt-20"><WritingSection /></section>
  <ScrollSpy />
</Layout>
```

- [ ] **Step 5: Verify**

Run: `bun run check`
Expected: 0 errors, eslint clean (no unused `trimSlash`/permalink imports), prettier clean.

- [ ] **Step 6: Commit**

```bash
git add src/navigation.ts src/components/widgets/Header.astro src/components/common/ScrollSpy.astro src/pages/index.astro
git commit -m "anchor nav + scrollspy active highlighting"
```

---

## Task 8: Redirect old routes; remove the writing list route

**Files:**
- Modify: `astro.config.ts`
- Delete: `src/pages/experience.astro`, `src/pages/projects.astro`, `src/pages/[...blog]/[...page].astro`

- [ ] **Step 1: Add redirects**

In `astro.config.ts`, add a `redirects` key to the `defineConfig({ … })` object, directly after `output: 'static',`:

```ts
  output: 'static',

  redirects: {
    '/experience': '/#experience',
    '/projects': '/#projects',
    '/writing': '/#writing',
  },
```

- [ ] **Step 2: Delete the superseded routes**

```bash
git rm src/pages/experience.astro src/pages/projects.astro "src/pages/[...blog]/[...page].astro"
```

(Quote the bracketed path so the shell does not glob it.)

- [ ] **Step 3: Verify build and redirect output**

Run: `bun run build`
Expected: exit 0. Then confirm redirect pages were emitted and the old content routes are gone:

Run: `ls dist/experience* dist/projects* dist/writing*`
Expected: a redirect artifact for `/experience` and `/projects` exists (Astro emits an `index.html` with a meta-refresh under each, or a flat `experience.html`), and there is **no** standalone experience/projects content page. `dist/writing/<slug>` (the post) must still exist.

If the build errors that redirects require an adapter (it should not for static output, but as a contingency): remove the `redirects` block from `astro.config.ts` and instead add to `vercel.json`:

```json
  "redirects": [
    { "source": "/experience", "destination": "/#experience" },
    { "source": "/projects", "destination": "/#projects" },
    { "source": "/writing", "destination": "/#writing" }
  ],
```

- [ ] **Step 4: Verify check**

Run: `bun run check`
Expected: 0 errors, eslint + prettier clean.

- [ ] **Step 5: Commit**

```bash
git add astro.config.ts
git commit -m "redirect old section routes to home anchors; drop writing list route"
```

---

## Task 9: Full verification

**Files:** none (verification only)

- [ ] **Step 1: Clean build**

Run: `bun run check && bun run build`
Expected: check 0/clean/clean; build exits 0. Note the page count — it should drop versus the pre-change baseline (writing list/index pages removed; experience/projects content pages replaced by redirect artifacts; the home page now carries all sections).

- [ ] **Step 2: Manual functional check**

Run: `bun run dev`, open `http://localhost:4321`, and confirm:
- Scrolling from top to bottom moves through about → experience → projects → writing.
- The desktop nav item for the section in view gains the active underline (`aw-link-active`); it updates as you scroll.
- Clicking each nav item smooth-scrolls to that section and the heading is not hidden under the sticky header.
- A post title in the writing section opens `/writing/<slug>` (comments/share present on the post page).
- Visiting `http://localhost:4321/experience` lands on the home page at the experience section (redirect → anchor). Same for `/projects` and `/writing`.
- Mobile menu (≤767px): opening it, tapping an anchor closes the menu and scrolls.

- [ ] **Step 3: Responsive check (standing requirement)**

In dev tools, verify layout and scrollspy at **360px, 768px, 1280px**: no horizontal overflow, sections readable, nav usable, reveals fire on scroll.

- [ ] **Step 4: Reduced-motion check**

Enable "Reduce motion" (OS or dev-tools emulation) and reload: content is fully visible (no hidden `.reveal-up` elements), scroll jumps are instant but scrollspy still highlights.

- [ ] **Step 5: Final commit (if any verification fixes were needed)**

```bash
git add -A
git commit -m "fixups from one-page verification"
```

(Skip if nothing changed.)

---

## Self-review notes (author)

- **Spec coverage:** scroll feel (natural + scrollspy) → Tasks 6–7; writing previews link out → Task 5; old routes redirect → Task 8; scroll-mt offset → Task 6; scroll-triggered lower-section reveals → Tasks 1,3,4,5; about hero keeps on-load boot → Task 2; reduced-motion → Tasks 1 & 9.4; post pages untouched → Task 8 (explicit not-to-touch list).
- **Type/name consistency:** `data-nav-section` value = section id, matched in `ScrollSpy` against `getAttribute('data-nav-section')`; section ids `about/experience/projects/writing` are identical in `index.astro`, the `ScrollSpy` array, and the redirect targets. `findLatestPosts({ count })` matches the signature in `src/utils/blog.ts`. `WorkCard` `class`/`style` props already exist.
- **No placeholders:** every code step is concrete.
