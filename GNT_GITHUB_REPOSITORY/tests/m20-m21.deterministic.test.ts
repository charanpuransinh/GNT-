/**
 * M20 + M21 — Deterministic suite (मालिक के आदेश पर, 2026-09-03)
 *
 * "Deterministic" का मतलब: वही input → हमेशा वही output। कोई AI, कोई अंदाज़ा,
 * कोई random, कोई घड़ी। इसीलिए यहाँ हर जवाब सटीक (exact) मिलाया जाता है।
 *
 * चलाओ: npm test tests/m20-m21.deterministic.test.ts   (backend/ से)
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateItemCBM,
  calculatePacking,
} from '../backend/src/modules/m20-international-trade/services/m20-container-cbm.service';
import { M20ShippingCalculatorService } from '../backend/src/modules/m20-international-trade/services/m20-shipping-calculator.service';
import { M20CountryTaxRulesService } from '../backend/src/modules/m20-international-trade/services/m20-country-tax-rules.service';
import { senseSheet } from '../backend/src/modules/m21-data-sense';

// ── M20: CBM = L(cm) × W(cm) × H(cm) ÷ 10,00,000 × Quantity ──

test('M20 CBM: 100×100×100 cm × 2 nag = 2.000000 CBM (सटीक)', () => {
  assert.equal(
    calculateItemCBM({ length_cm: 100, width_cm: 100, height_cm: 100, quantity: 2, weight_kg: 10 }),
    2,
  );
});

test('M20 CBM: 120×80×100 cm × 5 nag = 4.8 CBM', () => {
  assert.equal(
    calculateItemCBM({ length_cm: 120, width_cm: 80, height_cm: 100, quantity: 5, weight_kg: 10 }),
    4.8,
  );
});

test('M20 CBM: वही input, दस बार — हर बार वही जवाब (determinism)', () => {
  const item = { length_cm: 123.5, width_cm: 45.25, height_cm: 67, quantity: 3, weight_kg: 12 };
  const first = calculateItemCBM(item);
  for (let i = 0; i < 10; i += 1) assert.equal(calculateItemCBM(item), first);
});

test('M20 CBM: ग़लत नाप पर साफ़ मना — चुपचाप 0 नहीं', () => {
  assert.throws(() => calculateItemCBM({ length_cm: -1, width_cm: 10, height_cm: 10, quantity: 1, weight_kg: 1 }), /length_cm/);
  assert.throws(() => calculateItemCBM({ length_cm: 10, width_cm: NaN, height_cm: 10, quantity: 1, weight_kg: 1 }), /width_cm/);
});

test('M20 container: 2 CBM / 20 kg → 20FT, एक ही container', () => {
  const r = calculatePacking([{ length_cm: 100, width_cm: 100, height_cm: 100, quantity: 2, weight_kg: 10 }]);
  assert.equal(r.container_type, '20FT');
  assert.equal(r.container_count, 1);
  assert.equal(r.total_cbm, 2);
  assert.equal(r.gross_weight_kg, 20);
});

test('M20 container: 20FT से बड़ा भार → 40FT', () => {
  const r = calculatePacking([{ length_cm: 200, width_cm: 200, height_cm: 100, quantity: 10, weight_kg: 50 }]);
  assert.equal(r.total_cbm, 40);
  assert.equal(r.container_type, '40FT');
});

test('M20 container: 40FT से भी ज़्यादा → गिनती बढ़ती है', () => {
  const r = calculatePacking([{ length_cm: 200, width_cm: 200, height_cm: 200, quantity: 15, weight_kg: 20 }]);
  assert.equal(r.total_cbm, 120);
  assert.equal(r.container_type, '40FT');
  assert.equal(r.container_count, 2);
});

// ── M20: logistics और country rules भी deterministic ──

test('M20 logistics: ocean freight का जोड़ सटीक', () => {
  const svc = new M20ShippingCalculatorService();
  const r = svc.calculate({
    cbm: 10, gross_weight_kg: 1000, mode: 'OCEAN',
    ocean_rate_per_cbm: 500, inland_freight: 2000, port_cha: 1500,
    insurance_rate_percent: 1, cargo_value: 100000,
  });
  assert.equal(r.freight, 5000);
  assert.equal(r.marine_insurance, 1000);
  assert.equal(r.total_logistics_cost, 9500);
});

test('M20 country rules: अनजान देश पर अंदाज़ा नहीं — सब शून्य', () => {
  const svc = new M20CountryTaxRulesService([
    { country_code: 'AE', vat_rate: 5, tariff_rate: 0, export_zero_rated: true, lut_exempt: true },
  ]);
  assert.equal(svc.get('ae').vat_rate, 5);
  assert.equal(svc.isZeroRatedExport('AE'), true);
  assert.equal(svc.get('ZZ').vat_rate, 0);
  assert.equal(svc.isZeroRatedExport('ZZ'), false);
});

// ── M21: header पहचान — वही headers, वही जोड़ी, हर बार ──

test('M21 header sensing: party की file पहचानी और M05 को गई', () => {
  const s = senseSheet({ headers: ['Party Name', 'GSTIN', 'Address', 'Opening Balance'], rows: [] });
  assert.equal(s.group, 'party');
  assert.equal(s.ownerModule, 'm05-party-management');
  const pair = Object.fromEntries(s.mappings.map((m) => [m.sourceColumn, m.targetField]));
  assert.deepEqual(pair, {
    'Party Name': 'name',
    GSTIN: 'gstin',
    Address: 'address',
    'Opening Balance': 'openingBalance',
  });
});

test('M21 header sensing: वही headers दस बार — वही नतीजा (determinism)', () => {
  const headers = ['Party Name', 'GSTIN', 'Address', 'Opening Balance'];
  const first = JSON.stringify(senseSheet({ headers, rows: [] }));
  for (let i = 0; i < 10; i += 1) {
    assert.equal(JSON.stringify(senseSheet({ headers, rows: [] })), first);
  }
});
