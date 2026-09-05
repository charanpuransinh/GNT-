/**
 * M20 — Container CBM / packing ki jaanch (shuddh math, DB nahi).
 */
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { calculateItemCBM, calculatePacking, M20ContainerCBMService } from '../../services/m20-container-cbm.service';

test('M20 CBM: item CBM = L×W×H×qty / 1e6', () => {
  assert.equal(calculateItemCBM({ length_cm: 100, width_cm: 100, height_cm: 100, quantity: 2, weight_kg: 10 }), 2);
});

test('M20 CBM: khali list par saaf error', () => {
  assert.throws(() => calculatePacking([]), /At least one/);
});

test('M20 CBM: chhota maal 20FT mein fit hota hai', () => {
  const r = calculatePacking([
    { length_cm: 100, width_cm: 100, height_cm: 100, quantity: 10, weight_kg: 50 }, // 10 cbm, 500 kg
  ]);
  assert.equal(r.container_type, '20FT');
  assert.equal(r.container_count, 1);
  assert.equal(r.total_cbm, 10);
  assert.equal(r.gross_weight_kg, 500);
});

test('M20 CBM: bada maal 40FT mein, weight se count badhta hai', () => {
  // 30 cbm but 60000 kg → 20FT payload (28000) paar → 40FT; 60000 > 26500 → 3 container
  const r = calculatePacking([
    { length_cm: 100, width_cm: 100, height_cm: 100, quantity: 30, weight_kg: 2000 },
  ]);
  assert.equal(r.total_cbm, 30);
  assert.equal(r.gross_weight_kg, 60000);
  assert.equal(r.container_type, '40FT');
  assert.equal(r.container_count, 3); // ceil(60000/26500)=3
});

test('M20 CBM: zero volume → LCL (kisi container mein nahi)', () => {
  const r = calculatePacking([
    { length_cm: 0, width_cm: 100, height_cm: 100, quantity: 1, weight_kg: 10 },
  ]);
  assert.equal(r.container_type, 'LCL');
  assert.equal(r.container_count, 0);
  assert.equal(r.total_cbm, 0);
});

test('M20 CBM: class wrapper bhi wahi packing deta hai', () => {
  const svc = new M20ContainerCBMService();
  const r = svc.calculate([{ length_cm: 100, width_cm: 100, height_cm: 100, quantity: 10, weight_kg: 50 }]);
  assert.equal(r.container_type, '20FT');
});
