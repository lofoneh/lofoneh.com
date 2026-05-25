/**
 * About page data — pulled out of the .astro file so it's a single place to
 * edit your stack inventory and "what I'm looking for" list.
 *
 * `stackCategories` drives the ~/stack section on /about: each category gets
 * a label row and a row of icons rendered from src/data/stack-icons.ts.
 * Items flagged `learning: true` get a subtle "(learning)" suffix — keeps
 * the bio honest (matches the design spec's "quietly confident" voice).
 */

export interface StackItem {
  slug: string;
  learning?: boolean;
}

export interface StackCategory {
  label: string;
  items: StackItem[];
}

export const stackCategories: StackCategory[] = [
  {
    label: 'Languages',
    items: [{ slug: 'python' }, { slug: 'go' }, { slug: 'typescript' }, { slug: 'rust', learning: true }],
  },
  {
    label: 'Cloud',
    items: [{ slug: 'azure' }, { slug: 'aws' }],
  },
  {
    label: 'Infrastructure as code',
    items: [{ slug: 'terraform' }, { slug: 'pulumi', learning: true }],
  },
  {
    label: 'Orchestration',
    items: [{ slug: 'kubernetes' }, { slug: 'helm' }, { slug: 'docker' }],
  },
  {
    label: 'CI / CD',
    items: [{ slug: 'github-actions' }, { slug: 'azure-devops' }, { slug: 'github' }],
  },
];

// TODO (phase 8): replace with real items when positioning is settled.
export const lookingFor: string[] = [
  'Backend / infra roles at companies building reliable distributed systems.',
  'Freelance or contract work on data pipelines, internal platforms, or DX tooling.',
  'Open-source collaborations — especially in Go, Rust, or the Kubernetes ecosystem.',
];
