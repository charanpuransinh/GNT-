/**
 * M20 — Currency exchange (freeze/convert) ki jaanch (shuddh logic).
 */
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { M20CurrencyExchangeService, FXProvider } from '../../services/m20-currency-exchange.service';

const provider = (rate: number): FXProvider => ({ getRate: async () => ({ rate, source: 'test' }) });

test('M20 FX freeze: same currency → identity rate 1 (provider nahi bula)', async () => {
  let called = false;
  const svc = new M20CurrencyExchangeService({ getRate: async () => { called = true; return { rate: 1, source: 'x' }; } });
  const f = await svc.freeze('usd', 'USD');
  assert.equal(f.rate, 1);
  assert.equal(f.source, 'identity');
  assert.equal(called, false);
});

test('M20 FX freeze: 3-letter ISO code enforce hota hai', async () => {
  const svc = new M20CurrencyExchangeService(provider(1));
  await assert.rejects(() => svc.freeze('us', 'INR'), /ISO-4217/);
  await assert.rejects(() => svc.freeze('', 'INR'), /ISO-4217/);
});

test('M20 FX freeze: provider se rate aata hai (uppercase)', async () => {
  const svc = new M20CurrencyExchangeService(provider(83.25));
  const f = await svc.freeze('usd', 'inr');
  assert.equal(f.base_currency, 'USD');
  assert.equal(f.target_currency, 'INR');
  assert.equal(f.rate, 83.25);
});

test('M20 FX freeze: provider galat rate de to error', async () => {
  const svc = new M20CurrencyExchangeService(provider(0));
  await assert.rejects(() => svc.freeze('USD', 'INR'), /invalid FX rate/);
});

test('M20 FX convert: amount × rate, 2 decimal round', () => {
  const svc = new M20CurrencyExchangeService(provider(1));
  const f = { base_currency: 'USD', target_currency: 'INR', rate: 83.25, source: 't', fetched_at: '2026-09-05T00:00:00Z' };
  assert.equal(svc.convert(100, f), 8325);
  assert.equal(svc.convert(1.5, f), 124.88); // 124.875 → 124.88
});

test('M20 FX convert: negative amount → error', () => {
  const svc = new M20CurrencyExchangeService(provider(1));
  const f = { base_currency: 'USD', target_currency: 'INR', rate: 83.25, source: 't', fetched_at: '2026-09-05T00:00:00Z' };
  assert.throws(() => svc.convert(-5, f), /non-negative/);
});
