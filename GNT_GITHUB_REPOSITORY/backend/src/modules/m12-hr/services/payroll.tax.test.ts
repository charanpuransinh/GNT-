// M12 — TDS tax calculation ki jaanch (standard Indian new-regime slabs, progressive + 4% cess)
import { test, expect } from 'vitest';
import { PayrollService } from './payroll.service';

test('₹20k/month (annual 2.4L) → 0 tax (₹4L limit ke neeche)', () => {
  expect(PayrollService.calculateTax(20000)).toBe(0);
});

test('₹50k/month (annual 6L) → sirf ₹2L par 5% + 4% cess = ₹866.67/month', () => {
  // annual tax = 200000 * 5% = 10000; + 4% cess = 10400; /12 = 866.67
  expect(PayrollService.calculateTax(50000)).toBe(866.67);
});

test('₹1L/month (annual 12L) → progressive 5%+10% slabs + cess', () => {
  // 4L @0 + 4L @5% = 20000 + 4L @10% = 40000 → 60000; cess 4% → 62400; /12 = 5200
  expect(PayrollService.calculateTax(100000)).toBe(5200);
});

test('₹3L/month (annual 36L) → top 30% slab lagta hai', () => {
  // 4L@0 + 4L@5 + 4L@10 + 4L@15 + 4L@20 + 4L@25 + 12L@30 = 660000; cess → 686400; /12 = 57200
  expect(PayrollService.calculateTax(300000)).toBe(57200);
});

test('placeholder (₹50k flat) wala bug nahi raha — ₹35k/month 30% me nahi girta', () => {
  // pahle: annual 4.2L > 2L → flat 30% = ₹10500/month (galat)
  // ab: 4.2L → 0.2L @5% = 1000 + cess = 1040 / 12 = 86.67
  expect(PayrollService.calculateTax(35000)).toBe(86.67);
});
