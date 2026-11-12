import type { GitHubConfig } from '~/utils/github/types';

export const githubConfig: GitHubConfig = {
  username: 'lofoneh',
  ownRepoTopic: 'portfolio',
  maxCards: 6,
  activityRows: 6,
  activityPerCard: 2,
  groups: [
    { key: 'kividb', name: 'KiviDB', repos: ['kividbio/kividb-operator', 'kividbio/kividb'] },
    {
      key: 'telemetry-dev',
      name: 'telemetry.dev',
      repos: ['telemetry-dev/telemetry', 'telemetry-dev/stats', 'telemetry-dev/docs'],
    },
    { key: 'pgrun', name: 'PGRun', repos: ['pgrundev/pgbot', 'pgrundev/pgterm', 'pgrundev/pggo'] },
  ],
  exclude: ['Btk990/Peerly-App'],
  overrides: {
    kividb: {
      order: 0,
      tag: 'Go + Rust',
      blurb: 'Fixed failover data-loss bugs: a force-deleted master no longer loses acknowledged writes.',
    },
    'argoproj/argo-workflows': {
      name: 'Argo Workflows',
      tag: 'CNCF graduated',
      blurb:
        "Moved the workflow controller's test fixtures out of Go code into testdata files, and deflaked a realtime metrics test.",
    },
    'telemetry-dev': {
      tag: 'OpenTelemetry',
      blurb:
        'Traced Anthropic beta.messages and messages.parse, fixed stream-capture and cache-usage accounting, and widened tests for the AI SDK paths.',
    },
    pgrun: {
      tag: 'Postgres',
      blurb:
        'Added collation-version and replica-identity findings, and hardened how passwords and SQL comments are scrubbed from connection strings and query text.',
    },
    'k8sgpt-ai/k8sgpt': {
      name: 'K8sGPT',
      tag: 'CNCF sandbox',
      blurb:
        'Fixed analyzer bugs: blocked PodDisruptionBudgets with empty or matchExpressions selectors now get reported, and the OLM analyzers no longer panic on catalogs without an image.',
    },
    'akuity/kargo': {
      name: 'Kargo',
      tag: 'GitOps',
      blurb: 'The http promotion step checks failure criteria first, so error responses report their real message.',
    },
    'canonical/k8s-snap': {
      name: 'Canonical Kubernetes',
      tag: 'Kubernetes',
      blurb: 'Removed an orphaned MetalLB chart and guarded the chart update scripts against a failed cd.',
    },
    'lofoneh/kvlite': {
      blurb:
        'In-memory key-value store: Redis-like protocol over TCP, per-key TTLs, a write-ahead log with crash recovery and snapshot compaction.',
    },
  },
};
