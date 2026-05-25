/**
 * Projects shown on /work and (the featured subset) on the home page.
 *
 * To add a new project: append an entry below. To feature it on the home
 * page teaser, set `featured: true` — the home page picks the first three
 * featured entries in array order.
 *
 * The placeholder entries below are dummies — replace title / oneLiner /
 * stack / role / year / links with real values when ready. Keep `slug`
 * unique (we'll use it for per-project detail pages later if needed).
 */

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
  links: ProjectLinks;
  featured?: boolean;
}

export const projects: Project[] = [
  {
    slug: 'event-pipeline',
    title: 'Distributed Event Pipeline',
    oneLiner:
      'High-throughput event ingestion pipeline processing millions of events per day across Azure regions, with at-least-once delivery semantics.',
    stack: ['go', 'kafka', 'kubernetes', 'terraform', 'azure'],
    role: 'Backend engineer',
    year: 2025,
    links: {
      // TODO: replace with real URLs (or remove keys if there's nothing to link)
      repo: 'https://github.com/lofoneh',
    },
    featured: true,
  },
  {
    slug: 'cluster-lifecycle-cli',
    title: 'Cluster Lifecycle CLI',
    oneLiner:
      'Internal command-line tool that spins up, configures, and tears down ephemeral Kubernetes clusters for CI test runs.',
    stack: ['python', 'helm', 'kubernetes', 'azure-devops'],
    role: 'Solo dev',
    year: 2024,
    links: {
      // TODO: replace with real URLs
      repo: 'https://github.com/lofoneh',
    },
    featured: true,
  },
  {
    slug: 'realtime-metrics',
    title: 'Realtime Metrics Service',
    oneLiner:
      'Backend service exposing realtime metrics over a gRPC streaming API. Building in the open while learning Rust.',
    stack: ['rust', 'grpc', 'postgres', 'aws'],
    role: 'Solo dev · learning project',
    year: 2025,
    links: {
      // TODO: replace with real URLs
      repo: 'https://github.com/lofoneh',
    },
    featured: true,
  },
];

export const featuredProjects = (count = 3): Project[] => projects.filter((p) => p.featured).slice(0, count);
