import { expect, test } from 'bun:test';
import { explainFetchError, resolveSource } from './source';

test('a token means live', () => expect(resolveSource({ GITHUB_TOKEN: 'x' })).toEqual({ mode: 'live', token: 'x' }));
test('no token on Vercel production fails', () =>
  expect(() => resolveSource({ VERCEL_ENV: 'production' })).toThrow(/GITHUB_TOKEN/));
test('no token on Vercel preview fails', () =>
  expect(() => resolveSource({ VERCEL_ENV: 'preview' })).toThrow(/GITHUB_TOKEN/));
test('no token in CI fails', () => expect(() => resolveSource({ CI: 'true' })).toThrow(/GITHUB_TOKEN/));
test('no token locally uses the fixture', () => expect(resolveSource({})).toEqual({ mode: 'fixture' }));

const http = (s: number) => new Error(`GitHub GraphQL request failed with HTTP ${s}`);
test('401 gets the expired-token hint', () => {
  const out = explainFetchError(http(401)) as Error;
  expect(out.message).toMatch(/rejected GITHUB_TOKEN \(HTTP 401\).*expired or been revoked/);
  expect(out.cause).toBeInstanceOf(Error);
});
test('403 gets the expired-token hint', () =>
  expect((explainFetchError(http(403)) as Error).message).toMatch(/HTTP 403/));
test('502 is unchanged', () => {
  const e = http(502);
  expect(explainFetchError(e)).toBe(e);
});
test('non-Error is unchanged', () => expect(explainFetchError('boom')).toBe('boom'));
