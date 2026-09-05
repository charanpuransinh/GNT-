/**
 * M20 — Shipping/logistics cost calculator ki jaanch (shuddh math, DB nahi).
 */
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { M20ShippingCalculatorService } from '../../services/m20-shipping-calculator.service';

const svc = new M20ShippingCalculatorService();

test('M20 shipping: OCEAN — freight = rate/cbm × cbm, saare hisse jude', () => {
  const b = svc.calculate({
    cbm: 10, gross_weight_kg: 500, cargo_value: 100000,
    ocean_rate_per_cbm: 50, port_cha: 2000, insurance_rate_percent: 1,
    inland_freight: 1500, mode: 'OCEAN',
  });
  assert.equal(b.freight, 500);              // 10 × 50
  assert.equal(b.marine_insurance, 1000);    // 100000 × 1%
  assert.equal(b.inland_freight, 1500);
  assert.equal(b.port_cha, 2000);
  assert.equal(b.total_logistics_cost, 5000); // 500+1000+1500+2000
});

test('M20 shipping: AIR — freight = rate/kg × weight', () => {
  const b = svc.calculate({
    cbm: 1, gross_weight_kg: 300, cargo_value: 50000,
    air_rate_per_kg: 20, mode: 'AIR',
  });
  assert.equal(b.freight, 6000); // 300 × 20
});

test('M20 shipping: flat_freight diya ho to rate over-ride ho jata hai', () => {
  const b = svc.calculate({
    cbm: 5, gross_weight_kg: 100, cargo_value: 10000,
    ocean_rate_per_cbm: 100, flat_freight: 777, mode: 'OCEAN',
  });
  assert.equal(b.freight, 777);
});

test('M20 shipping: har paisa 2 decimal par round hota hai', () => {
  const b = svc.calculate({
    cbm: 3.333, gross_weight_kg: 10, cargo_value: 999.99,
    ocean_rate_per_cbm: 12.345, insurance_rate_percent: 1.5, mode: 'OCEAN',
  });
  assert.equal(b.freight, 41.15);              // 3.333 × 12.345 = 41.146... → 41.15
  assert.equal(b.marine_insurance, 15);        // 999.99 × 1.5% = 14.99985 → 15
});

test('M20 shipping: negative value to saaf error', () => {
  assert.throws(
    () => svc.calculate({ cbm: -1, gross_weight_kg: 10, cargo_value: 100, mode: 'OCEAN' }),
    /non-negative/
  );
});
