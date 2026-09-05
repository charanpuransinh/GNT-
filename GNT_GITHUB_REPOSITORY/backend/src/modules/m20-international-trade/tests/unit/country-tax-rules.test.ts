/**
 * M20 — Country tax rules ki jaanch (shuddh logic).
 */
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { M20CountryTaxRulesService } from '../../services/m20-country-tax-rules.service';

const rules = [
  { country_code: 'US', vat_rate: 0, tariff_rate: 5, export_zero_rated: false, lut_exempt: false },
  { country_code: 'GB', vat_rate: 20, tariff_rate: 0, export_zero_rated: true, lut_exempt: false },
  { country_code: 'AE', vat_rate: 5, tariff_rate: 0, export_zero_rated: false, lut_exempt: true },
];

test('M20 tax rules: jaane-pehchane code ka rule milta hai', () => {
  const svc = new M20CountryTaxRulesService(rules);
  assert.equal(svc.get('us').vat_rate, 0);
  assert.equal(svc.get('GB').vat_rate, 20);
});

test('M20 tax rules: anjaan code par safe default (0 vat/tariff, zero-rated nahi)', () => {
  const svc = new M20CountryTaxRulesService(rules);
  const d = svc.get('XX');
  assert.equal(d.vat_rate, 0);
  assert.equal(d.tariff_rate, 0);
  assert.equal(d.export_zero_rated, false);
});

test('M20 tax rules: zero-rated export sirf unhin countries ke liye', () => {
  const svc = new M20CountryTaxRulesService(rules);
  assert.equal(svc.isZeroRatedExport('GB'), true);
  assert.equal(svc.isZeroRatedExport('US'), false);
});

test('M20 tax rules: LUT tabhi chalta jab valid + country lut_exempt ho', () => {
  const svc = new M20CountryTaxRulesService(rules);
  assert.equal(svc.checkLUT('AE', true), true);   // valid + exempt
  assert.equal(svc.checkLUT('AE', false), false); // exempt par LUT valid nahi
  assert.equal(svc.checkLUT('GB', true), false);  // valid par GB exempt nahi
});

test('M20 tax rules: destination tax = value × vat%', () => {
  const svc = new M20CountryTaxRulesService(rules);
  assert.equal(svc.calculateDestinationTax('GB', 1000), 200); // 20%
  assert.equal(svc.calculateDestinationTax('US', 1000), 0);   // 0%
});

test('M20 tax rules: negative value → error', () => {
  const svc = new M20CountryTaxRulesService(rules);
  assert.throws(() => svc.calculateDestinationTax('GB', -1), /non-negative/);
});
