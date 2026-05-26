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
  // Dummy roadmap entries. Flip status + add real links when they get built.
  {
    slug: 'event-pipeline',
    title: 'Distributed Event Pipeline',
    oneLiner:
      'High-throughput event ingestion pipeline processing millions of events per day across Azure regions, with at-least-once delivery semantics.',
    stack: ['go', 'kafka', 'kubernetes', 'terraform', 'azure'],
    role: 'Backend engineer',
    year: 2025,
    status: 'exploring',
    links: {},
  },
  {
    slug: 'cluster-lifecycle-cli',
    title: 'Cluster Lifecycle CLI',
    oneLiner:
      'Internal command-line tool that spins up, configures, and tears down ephemeral Kubernetes clusters for CI test runs.',
    stack: ['python', 'helm', 'kubernetes', 'azure-devops'],
    role: 'Solo dev',
    year: 2025,
    status: 'exploring',
    links: {},
  },
  {
    slug: 'realtime-metrics',
    title: 'Realtime Metrics Service',
    oneLiner:
      'Backend service exposing realtime metrics over a gRPC streaming API. Building in the open while learning Rust.',
    stack: ['rust', 'grpc', 'postgres', 'aws'],
    role: 'Solo dev · learning project',
    year: 2025,
    status: 'exploring',
    links: {},
  },
];

export const featuredProjects = (count = 3): Project[] => projects.filter((p) => p.featured).slice(0, count);
