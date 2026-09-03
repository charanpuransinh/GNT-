/**
 * M21 — Data Sense ki jaanch: pehchaan (SENSE), jodi (MAP), aur rang (VALIDATE).
 * Sab kuch DB ke bina — yeh shuddh logic hai.
 */
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { DataSenseService } from '../../services/dataSense.service';
import { senseSheet } from '../../services/sense.engine';

const svc = new DataSenseService();

test('M21: Tally jaisi party file pehchaani jaati hai aur M05 ko jaati hai', () => {
  const s = senseSheet({
    headers: ['Party Name', 'GSTIN', 'Mobile No', 'Address', 'State'],
    rows: [],
  });
  assert.equal(s.group, 'party');
  assert.equal(s.ownerModule, 'm05-party-management');
  assert.ok(s.confidence >= 0.7, `bharosa kam hai: ${s.confidence}`);
  assert.equal(s.mappings.find((m) => m.sourceColumn === 'GSTIN')?.targetField, 'gstin');
  assert.equal(s.mappings.find((m) => m.sourceColumn === 'Mobile No')?.targetField, 'phone');
});

test('M21: item file M06 ko, sales file M08 ko jaati hai', () => {
  const item = senseSheet({ headers: ['Item Name', 'Item Code', 'HSN Code', 'UOM', 'Rate'], rows: [] });
  assert.equal(item.group, 'item');
  assert.equal(item.ownerModule, 'm06-inventory');

  const sales = senseSheet({ headers: ['Invoice No', 'Invoice Date', 'Customer Name', 'Taxable Value', 'GST Amount', 'Grand Total'], rows: [] });
  assert.equal(sales.group, 'sales');
  assert.equal(sales.ownerModule, 'm08-sales');
});

test('M21: galat GSTIN wali panti RED hoti hai, sahi wali GREEN', () => {
  const r = svc.analyze('c1', {
    headers: ['Party Name', 'GSTIN'],
    rows: [
      { 'Party Name': 'Sharma Traders', GSTIN: '27AAPFU0939F1ZV' },
      { 'Party Name': 'Verma Stores', GSTIN: '27AAPFU0939F1Z' },
    ],
  });
  assert.equal(r.verdicts[0].status, 'GREEN');
  assert.equal(r.verdicts[1].status, 'RED');
  assert.match(r.verdicts[1].reasons.join(' '), /GSTIN/);
  assert.equal(r.importable, false);
});

test('M21: zaroori field khaali ho to RED', () => {
  const r = svc.analyze('c1', {
    headers: ['Party Name', 'GSTIN'],
    rows: [{ 'Party Name': '', GSTIN: '27AAPFU0939F1ZV' }],
  });
  assert.equal(r.verdicts[0].status, 'RED');
  assert.match(r.verdicts[0].reasons.join(' '), /name/);
});

test('M21: file ke andar duplicate GSTIN ORANGE ho jata hai', () => {
  const r = svc.analyze('c1', {
    headers: ['Party Name', 'GSTIN'],
    rows: [
      { 'Party Name': 'Sharma Traders', GSTIN: '27AAPFU0939F1ZV' },
      { 'Party Name': 'Sharma Traders Pvt', GSTIN: '27AAPFU0939F1ZV' },
    ],
  });
  assert.equal(r.duplicateGroups.length, 1);
  assert.deepEqual(r.duplicateGroups[0], [1, 2]);
  assert.equal(r.verdicts[0].status, 'ORANGE');
  assert.equal(r.totals.orange, 2);
});

test('M21: bikri ka jod na mile to ORANGE (rok nahi, chetavni)', () => {
  const r = svc.analyze('c1', {
    headers: ['Invoice No', 'Invoice Date', 'Taxable Value', 'GST Amount', 'Grand Total'],
    rows: [{ 'Invoice No': 'INV-1', 'Invoice Date': '01/04/2026', 'Taxable Value': 1000, 'GST Amount': 180, 'Grand Total': 1200 }],
  });
  assert.equal(r.verdicts[0].status, 'ORANGE');
  assert.match(r.verdicts[0].reasons.join(' '), /जोड़ नहीं मिल रहा/);
});

test('M21: bharatiya tareekh dd/mm/yyyy chalti hai, bakwas tareekh RED', () => {
  const ok = svc.analyze('c1', { headers: ['Invoice No', 'Invoice Date'], rows: [{ 'Invoice No': 'A1', 'Invoice Date': '15/08/2026' }] });
  assert.equal(ok.verdicts[0].status, 'GREEN');

  const bad = svc.analyze('c1', { headers: ['Invoice No', 'Invoice Date'], rows: [{ 'Invoice No': 'A1', 'Invoice Date': 'kal subah' }] });
  assert.equal(bad.verdicts[0].status, 'RED');
});

test('M21: HSN 4/6/8 ank hi chalega', () => {
  const r = svc.analyze('c1', {
    headers: ['Item Name', 'HSN Code'],
    rows: [{ 'Item Name': 'Pen', 'HSN Code': '9608' }, { 'Item Name': 'Book', 'HSN Code': '96' }],
  });
  assert.equal(r.verdicts[0].status, 'GREEN');
  assert.equal(r.verdicts[1].status, 'RED');
});

test('M21: bebuniyaad file par andaza nahi lagata — saaf mana karta hai', () => {
  const r = svc.analyze('c1', { headers: ['zzz', 'qqq', 'xyz'], rows: [{ zzz: 1, qqq: 2, xyz: 3 }] });
  assert.equal(r.sense.group, null);
  assert.equal(r.importable, false);
  assert.equal(r.verdicts[0].status, 'RED');
});

test('M21: companyId ke bina kuch nahi chalega (tenant suraksha)', () => {
  assert.throws(() => svc.analyze('', { headers: ['Party Name'], rows: [] }), /companyId/);
});

test('M21: sab theek ho to importable = true', () => {
  const r = svc.analyze('c1', {
    headers: ['Party Name', 'GSTIN', 'Mobile No'],
    rows: [{ 'Party Name': 'Sharma Traders', GSTIN: '27AAPFU0939F1ZV', 'Mobile No': '9876543210' }],
  });
  assert.equal(r.totals.green, 1);
  assert.equal(r.importable, true);
  assert.equal(r.sense.ownerModule, 'm05-party-management');
});
