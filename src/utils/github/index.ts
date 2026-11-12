import { githubConfig } from '~/data/github.config';
import fixture from '~/data/github.fixture.json';
import { fetchSnapshot } from './fetch';
import { assertLiveSnapshot, explainFetchError, resolveSource } from './source';
import { buildPortfolioData } from './transform';
import type { GitHubSnapshot, PortfolioData } from './types';

async function load(): Promise<PortfolioData> {
  const source = resolveSource(process.env);
  let snapshot: GitHubSnapshot;
  if (source.mode === 'live') {
    try {
      snapshot = await fetchSnapshot({ token: source.token, username: githubConfig.username });
    } catch (err) {
      throw explainFetchError(err);
    }
    assertLiveSnapshot(snapshot);
  } else {
    console.warn('[github] GITHUB_TOKEN not set — using src/data/github.fixture.json (local only)');
    snapshot = fixture as unknown as GitHubSnapshot;
  }
  const data = buildPortfolioData(snapshot, githubConfig);
  console.log(
    `[github] ${source.mode}: ${snapshot.pullRequests.length} PRs, ${snapshot.repos.length} repos, ${data.oss.cards.length} cards`
  );
  return data;
}

let cached: Promise<PortfolioData> | undefined;

/** Single entry point for components. One shared fetch per build; a rejection fails the build. */
export function getPortfolioData(): Promise<PortfolioData> {
  return (cached ??= load());
}
