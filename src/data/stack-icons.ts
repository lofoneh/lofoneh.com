/**
 * Maps the short slugs used in `projects.ts` (e.g. "go", "k8s") to the
 * Simple Icons name and a human-readable display label.
 *
 * To add a new tech: pick a stable slug to use in project entries, add the
 * Simple Icons name + display label here, and add the icon name to the
 * `simple-icons` include list in astro.config.ts.
 *
 * Unknown slugs degrade gracefully — see `resolveStackIcon` below. A missing
 * mapping renders the slug as-is in mono brackets instead of crashing.
 */

export interface StackIcon {
  /** Iconify name, e.g. "simple-icons:go". `null` means render text fallback. */
  iconName: string | null;
  /** Pretty label for tooltip + screen readers. */
  label: string;
}

const STACK_MAP: Record<string, StackIcon> = {
  // Languages
  go: { iconName: 'simple-icons:go', label: 'Go' },
  golang: { iconName: 'simple-icons:go', label: 'Go' },
  python: { iconName: 'simple-icons:python', label: 'Python' },
  typescript: { iconName: 'simple-icons:typescript', label: 'TypeScript' },
  ts: { iconName: 'simple-icons:typescript', label: 'TypeScript' },
  javascript: { iconName: 'simple-icons:javascript', label: 'JavaScript' },
  js: { iconName: 'simple-icons:javascript', label: 'JavaScript' },
  rust: { iconName: 'simple-icons:rust', label: 'Rust' },

  // Streaming / messaging
  kafka: { iconName: 'simple-icons:apachekafka', label: 'Apache Kafka' },
  apachekafka: { iconName: 'simple-icons:apachekafka', label: 'Apache Kafka' },

  // Orchestration
  kubernetes: { iconName: 'simple-icons:kubernetes', label: 'Kubernetes' },
  k8s: { iconName: 'simple-icons:kubernetes', label: 'Kubernetes' },
  helm: { iconName: 'simple-icons:helm', label: 'Helm' },
  docker: { iconName: 'simple-icons:docker', label: 'Docker' },

  // IaC
  terraform: { iconName: 'simple-icons:terraform', label: 'Terraform' },
  tf: { iconName: 'simple-icons:terraform', label: 'Terraform' },
  pulumi: { iconName: 'simple-icons:pulumi', label: 'Pulumi' },

  // Cloud
  azure: { iconName: 'simple-icons:microsoftazure', label: 'Microsoft Azure' },
  'microsoft-azure': { iconName: 'simple-icons:microsoftazure', label: 'Microsoft Azure' },
  aws: { iconName: 'simple-icons:amazonwebservices', label: 'AWS' },
  gcp: { iconName: 'simple-icons:googlecloud', label: 'Google Cloud' },
  'google-cloud': { iconName: 'simple-icons:googlecloud', label: 'Google Cloud' },

  // VCS & CI
  github: { iconName: 'simple-icons:github', label: 'GitHub' },
  'github-actions': { iconName: 'simple-icons:githubactions', label: 'GitHub Actions' },
  'azure-devops': { iconName: 'simple-icons:azuredevops', label: 'Azure DevOps' },

  // Data
  postgres: { iconName: 'simple-icons:postgresql', label: 'PostgreSQL' },
  postgresql: { iconName: 'simple-icons:postgresql', label: 'PostgreSQL' },
  mysql: { iconName: 'simple-icons:mysql', label: 'MySQL' },
  redis: { iconName: 'simple-icons:redis', label: 'Redis' },
  mongodb: { iconName: 'simple-icons:mongodb', label: 'MongoDB' },
  mongo: { iconName: 'simple-icons:mongodb', label: 'MongoDB' },

  // Protocols & infra
  // gRPC has no Simple Icons logo — intentionally absent so it renders as
  // mono text `[ grpc ]` via the fallback path.
  nginx: { iconName: 'simple-icons:nginx', label: 'NGINX' },
  linux: { iconName: 'simple-icons:linux', label: 'Linux' },

  // Frameworks
  astro: { iconName: 'simple-icons:astro', label: 'Astro' },
};

export function resolveStackIcon(slug: string): StackIcon {
  const normalized = slug.toLowerCase().trim();
  if (STACK_MAP[normalized]) return STACK_MAP[normalized];
  // Fallback: no icon, just show the slug verbatim
  return { iconName: null, label: slug };
}
