/**
 * Projects shown on /projects.
 *
 * Pick a `status`:
 *   - 'shipped'   : built, in production / available
 *   - 'ongoing'   : currently being built
 *   - 'exploring' : on the roadmap, haven't started yet (a "next up" tag)
 *
 * Keep `slug` unique — used for per-project detail pages later if needed.
 */

export type ProjectStatus = 'shipped' | 'ongoing' | 'exploring';

export interface ProjectLinks {
  live?: string;
  repo?: string;
  docs?: string;
}

export interface Project {
  slug: string;
  title: string;
  oneLiner: string;
  stack: string[];
  role: string;
  year: number;
  status: ProjectStatus;
  links: ProjectLinks;
  featured?: boolean;
}

export const projects: Project[] = [
  // ─── Real ─── (shipped / ongoing) ───
  {
    slug: 'giftbanc',
    title: 'GiftBanc — Gift Card Platform',
    oneLiner:
      'CI/CD and hosting infrastructure for a live e-commerce gift card platform — containerised deployments, automated provisioning, and an edge proxy.',
    stack: ['docker', 'ansible', 'traefik', 'github-actions', 'digitalocean'],
    role: 'DevOps engineer (contract)',
    year: 2025,
    status: 'shipped',
    links: {
      live: 'https://giftbanc.com/',
    },
    featured: true,
  },
  {
    slug: 'win-transport',
    title: 'WIN Transport Services — Bus Booking Admin Portal',
    oneLiner: 'Admin portal for a live bus-booking platform, built alongside another developer.',
    stack: ['nextjs', 'typescript', 'prisma', 'zod', 'vercel'],
    role: 'Full-stack engineer (contract)',
    year: 2025,
    status: 'shipped',
    links: {
      live: 'https://wintransportservices.com/',
    },
    featured: true,
  },
  {
    slug: 'win-church',
    title: 'WIN Church Administration App',
    oneLiner:
      'Multi-tenant church administration platform — role-based access, member and group management, attendance, and pastoral-insight reporting.',
    stack: ['rails', 'hotwire', 'tailwindcss', 'daisyui', 'postgresql'],
    role: 'Solo dev',
    year: 2025,
    status: 'ongoing',
    links: {},
    featured: true,
  },
  // ─── Exploring / next up ───
  {
    slug: 'devops-paas',
    title: 'DevOps PaaS',
    oneLiner:
      'A push-to-deploy platform for African builders — managed CI/CD, container orchestration, observability, and databases in one opinionated stack. In planning with a small founding team.',
    stack: ['go', 'kubernetes', 'terraform', 'postgresql', 'docker'],
    role: 'Co-founder · infra lead',
    year: 2026,
    status: 'exploring',
    links: {},
  },
];

export const featuredProjects = (count = 3): Project[] => projects.filter((p) => p.featured).slice(0, count);
