# lofoneh.com

My personal portfolio, built with Astro and Tailwind CSS. Adapted from the excellent [AstroWind](https://github.com/arthelokyo/astrowind) template by [@arthelokyo](https://github.com/arthelokyo).

## Tech stack

- **[Astro](https://astro.build/)** v6 — static site generator
- **[Tailwind CSS](https://tailwindcss.com/)** v4 — utility-first styling (CSS-first config)
- **TypeScript** — strict-typed components and utilities
- **MDX** — Markdown with embedded components for blog posts
- **[Bun](https://bun.sh/)** — package manager and runtime
- **Sharp** + **Unpic** — image optimization (local + CDN)

## Run it locally

Requires **Node.js ≥ 22.12.0** and **[Bun](https://bun.sh/)**.

```bash
git clone https://github.com/lofoneh/lofoneh.com.git
cd lofoneh.com
bun install
bun run dev
```

Then open <http://localhost:4321>.

| Command           | Purpose                                |
| ----------------- | -------------------------------------- |
| `bun run dev`     | Start the dev server                   |
| `bun run build`   | Build the production site to `./dist/` |
| `bun run preview` | Preview the production build locally   |
| `bun run check`   | Run `astro check` + ESLint + Prettier  |
| `bun run fix`     | Auto-fix lint and formatting issues    |

## Fork and make it your own

1. Click **Fork** on this repo, or fork [AstroWind](https://github.com/arthelokyo/astrowind) directly if you'd rather start from the upstream template.
2. Clone your fork and run `bun install`.
3. Update `src/config.yaml` — site name, URL, SEO metadata, analytics, blog routing.
4. Edit content in `src/data/post/` (blog posts), `src/pages/` (top-level pages), and `src/components/CustomStyles.astro` (colors and fonts).
5. Replace assets in `src/assets/` and `public/`.

See [AGENTS.md](./AGENTS.md) for the architecture overview (virtual config module, Tailwind v4 setup, content collections, image pipeline).

## Deploy

### Vercel (recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Flofoneh%2Flofoneh.com)

Vercel auto-detects Astro, builds with `bun run build`, and serves from a global edge network. The free tier covers personal-portfolio traffic comfortably, and preview deployments on every PR make iterating painless. Point a custom domain at the project under **Settings → Domains**.

### PandaStack (alternative)

[![Deploy to PandaStack](https://dashboard.pandastack.io/deploy-button.svg)](https://dashboard.pandastack.io/deploy?repo=lofoneh/lofoneh.com&type=static&buildCmd=npm+run+build&outputDir=dist)

Static build, output directory `dist`, build command `npm run build`. PandaStack's build container ships Node + npm but not Bun, so the deploy uses `npm run build` (which calls the same `astro build` script under the hood — no Bun required at build time). PandaStack does **not** read `.nvmrc`, so set the Node version to **22** in the project's dashboard settings (or an env var `NODE_VERSION=22`) — Astro 6 requires Node ≥ 22.12.0. If you're updating an existing project rather than deploying fresh, also change its build command from any Bun-based value to `npm run build` in the dashboard, since the deploy button only sets that for new projects.

## Credits

Template by **[@arthelokyo](https://github.com/arthelokyo)** — [AstroWind](https://github.com/arthelokyo/astrowind), the most-starred and forked Astro theme of 2022–2025. This repo is a personal adaptation; the design and structural foundations are theirs.

## License

MIT — see [LICENSE.md](./LICENSE.md).
