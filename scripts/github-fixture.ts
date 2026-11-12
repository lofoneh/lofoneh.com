import { writeFileSync } from 'node:fs';
import { githubConfig } from '../src/data/github.config';
import { fetchSnapshot } from '../src/utils/github/fetch';
import { dropPrivate } from '../src/utils/github/transform';

const token = process.env.GITHUB_TOKEN;
if (!token) {
  console.error('GITHUB_TOKEN is not set. Run: GITHUB_TOKEN=$(gh auth token) bun run github:fixture');
  process.exit(1);
}

const snapshot = dropPrivate(await fetchSnapshot({ token, username: githubConfig.username }));
writeFileSync(new URL('../src/data/github.fixture.json', import.meta.url), JSON.stringify(snapshot, null, 2) + '\n');
console.log(`Wrote fixture: ${snapshot.pullRequests.length} PRs, ${snapshot.repos.length} repos`);
