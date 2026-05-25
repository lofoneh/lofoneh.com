/**
 * Projects shown on /projects and (the featured subset) on the home page.
 *
 * To add a new project: append an entry below. Pick a `status`:
 *   - 'shipped'   : built, in production / available
 *   - 'ongoing'   : currently being built
 *   - 'exploring' : on the roadmap, haven't started yet (acts as a "next up" tag)
 *
 * To surface a project on the home page teaser, set `featured: true`.
 * Keep `slug` unique — we'll use it for per-project detail pages later if needed.
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
  {
    slug: 'bitafrica-gift-card',
    title: 'BitAfrica Gift Card Platform',
    oneLiner:
      'Deployment infrastructure for an e-commerce gift card platform — CI/CD pipeline, containerised stack, edge proxy.',
    stack: ['docker', 'github-actions', 'digitalocean', 'traefik', 'ansible'],
    role: 'DevOps engineer',
    year: 2025,
    status: 'ongoing',
    links: {
      live: 'https://giftbanc.com/',
    },
    featured: true,
  },
  // ─── Exploring / next up ───
  // Dummy projects kept as roadmap teasers. Will become real entries (and flip
  // `status` + add real links) as they get built.
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
