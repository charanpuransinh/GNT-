// M18 — IntegrationService.validateApiKey ki jaanch (cache + rate-limit + expiry)
import { test, expect } from 'vitest';
import crypto from 'crypto';
import { IntegrationService } from '../../services/integration.service';

const hashOf = (key: string) => crypto.createHash('sha256').update(key).digest('hex');

function makeSvc(fn: (hash: string) => Promise<any>) {
  const repo = { findApiKeyByHash: fn };
  return new IntegrationService(repo as any, {} as any, {} as any);
}

test('valid key (not expired) → valid + permissions', async () => {
  const key = 'gnt_abc';
  const svc = makeSvc(async (h) => (h === hashOf(key) ? { id: '1', permissions: ['read'], expires_at: null } : null));
  const r = await svc.validateApiKey(key);
  expect(r.valid).toBe(true);
  expect(r.permissions).toEqual(['read']);
});

test('galat key → invalid', async () => {
  const svc = makeSvc(async () => null);
  const r = await svc.validateApiKey('gnt_bad');
  expect(r.valid).toBe(false);
});

test('expired key → invalid (access nahi)', async () => {
  const key = 'gnt_exp';
  const svc = makeSvc(async (h) => (h === hashOf(key) ? { id: '1', permissions: [], expires_at: new Date(Date.now() - 1000) } : null));
  const r = await svc.validateApiKey(key);
  expect(r.valid).toBe(false);
});

test('cache: valid key dobara → DB dobara nahi bula', async () => {
  const key = 'gnt_cache';
  let calls = 0;
  const svc = makeSvc(async (h) => {
    calls++;
    return h === hashOf(key) ? { id: '1', permissions: ['read'], expires_at: null } : null;
  });

  await svc.validateApiKey(key);
  await svc.validateApiKey(key);
  expect(calls).toBe(1); // cache hit — sirf pehli baar DB
});

test('rate-limit: 10 se zyada invalid attempts block ho jate hain', async () => {
  const prefix = 'gnt_flood';
  let calls = 0;
  const svc = makeSvc(async () => {
    calls++;
    return null;
  });

  // pehli 10 attempts DB jaate hain
  for (let i = 0; i < 10; i++) {
    await svc.validateApiKey(`${prefix}_${i}`);
  }
  expect(calls).toBe(10);

  // 11th attempt rate-limit se block — DB nahi bula
  const r = await svc.validateApiKey(`${prefix}_11`);
  expect(r.valid).toBe(false);
  expect(calls).toBe(10);
});
