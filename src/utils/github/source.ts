import type { GitHubSnapshot } from './types';

export type Source = { mode: 'live'; token: string } | { mode: 'fixture' };

export function resolveSource(env: Record<string, string | undefined>): Source {
  if (env.GITHUB_TOKEN) return { mode: 'live', token: env.GITHUB_TOKEN };
  if (env.VERCEL_ENV || env.CI) {
    throw new Error(
      'GITHUB_TOKEN is not set. Production, preview and CI builds need it (fine-grained token, public repositories, read-only).'
    );
  }
  return { mode: 'fixture' };
}

export function explainFetchError(err: unknown): unknown {
  if (err instanceof Error) {
    const m = /^GitHub GraphQL request failed with HTTP (401|403)$/.exec(err.message);
    if (m) {
      return new Error(
        `GitHub rejected GITHUB_TOKEN (HTTP ${m[1]}) — it may have expired, been revoked, or hit a rate limit. Create a new fine-grained token (public repositories, read-only) and update GITHUB_TOKEN in Vercel.`,
        { cause: err }
      );
    }
  }
  return err;
}

export function assertLiveSnapshot(snapshot: GitHubSnapshot): void {
  if (snapshot.pullRequests.length === 0) {
    throw new Error(
      'The live GitHub fetch returned no PRs; the build is stopped to avoid shipping an empty open-source section.'
    );
  }
}
