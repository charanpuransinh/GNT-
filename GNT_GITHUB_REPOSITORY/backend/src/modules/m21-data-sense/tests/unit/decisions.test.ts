/**
 * M21 — Malik ke 3 faislon ki jaanch (2026-09-03).
 * Har faisle ke DONO raaste test hote hain — default aur UI toggle.
 */
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { DataSenseService } from '../../services/dataSense.service';
import { DEFAULT_OPTIONS } from '../../types/dataSense.types';

const svc = new DataSenseService();

const twoSameParties = {
  headers: ['Party Name', 'GSTIN'],
  rows: [
    { 'Party Name': 'Sharma Traders', GSTIN: '27AAPFU0939F1ZV' },
    { 'Party Name': 'Sharma Traders Pvt', GSTIN: '27AAPFU0939F1ZV' },
  ],
};

// ── Faisla 1 — duplicate: Review Zone / sakht nishan (Option C) ──

test('Faisla 1: default hi review-zone hai', () => {
  assert.equal(DEFAULT_OPTIONS.duplicatePolicy, 'review-zone');
});

test('Faisla 1: duplicate pantiyan Review Zone mein jaati hain', () => {
  const r = svc.analyze('c1', twoSameParties);
  assert.deepEqual(r.reviewZone, [1, 2]);
  assert.equal(r.verdicts[0].zone, 'review');
  assert.equal(r.verdicts[1].zone, 'review');
});

test('Faisla 1: duplicate ho to file apne-aap import nahi hogi', () => {
  const r = svc.analyze('c1', twoSameParties);
  assert.equal(r.importable, false, 'duplicate rehte hue importable nahi hona chahiye');
});

test('Faisla 1: duplicate kabhi apne-aap nahi chadhti — plan mein hold-for-review', () => {
  const r = svc.analyze('c1', twoSameParties);
  for (const item of r.transferPlan) {
    assert.equal(item.operation, 'hold-for-review');
    assert.match(item.note ?? '', /Review Zone/);
  }
});

// ── Faisla 2 — bina GSTIN wali party: default A, toggle B ──

const noGstinParty = { headers: ['Party Name'], rows: [{ 'Party Name': 'Gupta Kirana' }] };

test('Faisla 2 (default A): bina GSTIN party B2C banti hai aur M05 ko jaati hai', () => {
  const r = svc.analyze('c1', noGstinParty);
  assert.equal(r.options.nonGstinParty, 'b2c-auto-create');
  assert.equal(r.verdicts[0].zone, 'ready');
  assert.equal(r.verdicts[0].status, 'GREEN');
  assert.equal(r.suspenseZone.length, 0);
  assert.equal(r.transferPlan[0].operation, 'create');
  assert.equal(r.transferPlan[0].targetModule, 'm05-party-management');
  assert.match(r.transferPlan[0].note ?? '', /B2C/);
  assert.equal(r.importable, true);
});

test('Faisla 2 (toggle B): suspense-zone chuno to panti ruk jaati hai', () => {
  const r = svc.analyze('c1', noGstinParty, { nonGstinParty: 'suspense-zone' });
  assert.deepEqual(r.suspenseZone, [1]);
  assert.equal(r.verdicts[0].zone, 'suspense');
  assert.equal(r.verdicts[0].status, 'ORANGE');
  assert.equal(r.transferPlan[0].operation, 'hold-for-review');
  assert.equal(r.importable, false);
});

test('Faisla 2: GSTIN wali party par toggle ka koi asar nahi', () => {
  const sheet = { headers: ['Party Name', 'GSTIN'], rows: [{ 'Party Name': 'Sharma', GSTIN: '27AAPFU0939F1ZV' }] };
  for (const opt of ['b2c-auto-create', 'suspense-zone'] as const) {
    const r = svc.analyze('c1', sheet, { nonGstinParty: opt });
    assert.equal(r.verdicts[0].zone, 'ready', `toggle ${opt} par GSTIN wali party rukni nahi chahiye`);
  }
});

// ── Faisla 3 — bank milan: default A (M10 ledger), toggle B (M11 FIFO) ──

const bankReceipt = {
  headers: ['Ledger Name', 'Date', 'Credit', 'Narration'],
  rows: [{ 'Ledger Name': 'Sharma Traders', Date: '01/04/2026', Credit: '25000', Narration: 'NEFT' }],
};

test('Faisla 3 (default A): bank ki rakam seedhe party khate mein — M10', () => {
  const r = svc.analyze('c1', bankReceipt);
  assert.equal(r.options.bankReconciliation, 'direct-ledger-credit');
  assert.equal(r.transferPlan[0].targetModule, 'm10-accounting');
  assert.equal(r.transferPlan[0].operation, 'credit-ledger');
});

test('Faisla 3 (toggle B): FIFO chuno to purane bill se chukta — M11', () => {
  const r = svc.analyze('c1', bankReceipt, { bankReconciliation: 'fifo-invoice-settlement' });
  assert.equal(r.transferPlan[0].targetModule, 'm11-payment');
  assert.equal(r.transferPlan[0].operation, 'settle-invoices-fifo');
});

test('Faisla 3: debit wali panti (bank credit nahi) par asar nahi — wahi M10 accounting', () => {
  const r = svc.analyze('c1', {
    headers: ['Ledger Name', 'Date', 'Debit'],
    rows: [{ 'Ledger Name': 'Rent', Date: '01/04/2026', Debit: '5000' }],
  }, { bankReconciliation: 'fifo-invoice-settlement' });
  assert.equal(r.transferPlan[0].operation, 'create');
  assert.equal(r.transferPlan[0].targetModule, 'm10-accounting');
});

test('Faisla 3: RED panti kabhi transfer nahi hoti, chahe koi bhi toggle ho', () => {
  const r = svc.analyze('c1', {
    headers: ['Ledger Name', 'Date', 'Credit'],
    rows: [{ 'Ledger Name': '', Date: 'kal', Credit: 'pachchees hazaar' }],
  }, { bankReconciliation: 'fifo-invoice-settlement' });
  assert.equal(r.verdicts[0].status, 'RED');
  assert.equal(r.transferPlan[0].operation, 'hold-for-review');
});

test('Faisla: chuni hui settings nateeje ke saath wapas aati hain (audit ke liye)', () => {
  const r = svc.analyze('c1', noGstinParty, { nonGstinParty: 'suspense-zone', bankReconciliation: 'fifo-invoice-settlement' });
  assert.deepEqual(r.options, {
    duplicatePolicy: 'review-zone',
    nonGstinParty: 'suspense-zone',
    bankReconciliation: 'fifo-invoice-settlement',
  });
});
