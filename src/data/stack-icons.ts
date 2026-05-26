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
  // gRPC has no Simple Icons logo — using a local SVG at src/icons/grpc.svg
  // (astro-icon auto-discovers files in src/icons/ and exposes them under the
  // `local:` collection).
  grpc: { iconName: 'local:grpc', label: 'gRPC' },
  nginx: { iconName: 'simple-icons:nginx', label: 'NGINX' },
  linux: { iconName: 'simple-icons:linux', label: 'Linux' },
  ansible: { iconName: 'simple-icons:ansible', label: 'Ansible' },
  traefik: { iconName: 'simple-icons:traefikproxy', label: 'Traefik' },
  digitalocean: { iconName: 'simple-icons:digitalocean', label: 'DigitalOcean' },
  'digital-ocean': { iconName: 'simple-icons:digitalocean', label: 'DigitalOcean' },

  // Frameworks
  astro: { iconName: 'simple-icons:astro', label: 'Astro' },
  ruby: { iconName: 'simple-icons:ruby', label: 'Ruby' },
  rails: { iconName: 'simple-icons:rubyonrails', label: 'Ruby on Rails' },
  'ruby-on-rails': { iconName: 'simple-icons:rubyonrails', label: 'Ruby on Rails' },
  rubyonrails: { iconName: 'simple-icons:rubyonrails', label: 'Ruby on Rails' },
  nextjs: { iconName: 'simple-icons:nextdotjs', label: 'Next.js' },
  'next.js': { iconName: 'simple-icons:nextdotjs', label: 'Next.js' },
  next: { iconName: 'simple-icons:nextdotjs', label: 'Next.js' },
  react: { iconName: 'simple-icons:react', label: 'React' },
  prisma: { iconName: 'simple-icons:prisma', label: 'Prisma' },
  zod: { iconName: 'simple-icons:zod', label: 'Zod' },
  vercel: { iconName: 'simple-icons:vercel', label: 'Vercel' },
  tailwindcss: { iconName: 'simple-icons:tailwindcss', label: 'Tailwind CSS' },
  tailwind: { iconName: 'simple-icons:tailwindcss', label: 'Tailwind CSS' },
  daisyui: { iconName: 'simple-icons:daisyui', label: 'DaisyUI' },
  django: { iconName: 'local:django', label: 'Django' },
  fastapi: { iconName: 'local:fastapi', label: 'FastAPI' },
  // Gin has no Simple Icons logo and the webp on gin-gonic.com isn't usable
  // as an inline SVG. Falls back to mono text `[ gin ]` until a real SVG is dropped here.
  gin: { iconName: null, label: 'Gin' },
  hotwire: { iconName: 'simple-icons:hotwire', label: 'Hotwire' },
  pundit: { iconName: null, label: 'Pundit' },

  // Observability
  grafana: { iconName: 'simple-icons:grafana', label: 'Grafana' },
  loki: { iconName: 'local:loki', label: 'Loki' },
  tempo: { iconName: 'local:tempo', label: 'Tempo' },
  prometheus: { iconName: 'simple-icons:prometheus', label: 'Prometheus' },
  opentelemetry: { iconName: 'simple-icons:opentelemetry', label: 'OpenTelemetry' },
  otel: { iconName: 'simple-icons:opentelemetry', label: 'OpenTelemetry' },
  'uptime-kuma': { iconName: 'simple-icons:uptimekuma', label: 'Uptime Kuma' },
  uptimekuma: { iconName: 'simple-icons:uptimekuma', label: 'Uptime Kuma' },

  // .NET stack
  csharp: { iconName: 'simple-icons:csharp', label: 'C#' },
  'c#': { iconName: 'simple-icons:csharp', label: 'C#' },
  dotnet: { iconName: 'simple-icons:dotnet', label: '.NET' },
  '.net': { iconName: 'simple-icons:dotnet', label: '.NET' },
};

export function resolveStackIcon(slug: string): StackIcon {
  const normalized = slug.toLowerCase().trim();
  if (STACK_MAP[normalized]) return STACK_MAP[normalized];
  // Fallback: no icon, just show the slug verbatim
  return { iconName: null, label: slug };
}
