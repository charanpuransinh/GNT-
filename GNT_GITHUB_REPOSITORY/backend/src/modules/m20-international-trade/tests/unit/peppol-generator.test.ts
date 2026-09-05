/**
 * M20 — Peppol (UBL) invoice generator ki jaanch (shuddh XML generation).
 */
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { M20PeppolGeneratorService } from '../../services/m20-peppol-generator.service';

const svc = new M20PeppolGeneratorService();
const base = {
  invoice_id: 'INV-001',
  issue_date: '2026-09-05',
  supplier_name: 'Acme Exports',
  buyer_name: 'Global Buyer',
  currency: 'USD',
  lines: [{ description: 'Widget', quantity: 2, unit_price: 10.5, tax_rate: 18 }],
};

test('M20 peppol: UBL Invoice XML banta hai (ID/date/currency/parties)', () => {
  const xml = svc.generate(base);
  assert.ok(xml.includes('<Invoice'));
  assert.ok(xml.includes('<cbc:ID>INV-001</cbc:ID>'));
  assert.ok(xml.includes('<cbc:IssueDate>2026-09-05</cbc:IssueDate>'));
  assert.ok(xml.includes('<cbc:DocumentCurrencyCode>USD</cbc:DocumentCurrencyCode>'));
  assert.ok(xml.includes('<cbc:Name>Acme Exports</cbc:Name>'));
  assert.ok(xml.includes('<cbc:Name>Global Buyer</cbc:Name>'));
});

test('M20 peppol: line amount = quantity × unit_price (4 decimal)', () => {
  const xml = svc.generate(base);
  assert.ok(xml.includes('<cbc:LineExtensionAmount currencyID="USD">21.0000</cbc:LineExtensionAmount>'));
});

test('M20 peppol: XML special chars escape hote hain (XSS-safe)', () => {
  const xml = svc.generate({ ...base, buyer_name: 'A & B <Ltd>' });
  assert.ok(xml.includes('A &amp; B &lt;Ltd&gt;'));
});

test('M20 peppol: identity fields khaali → error', () => {
  assert.throws(() => svc.generate({ ...base, invoice_id: '' }), /required/);
  assert.throws(() => svc.generate({ ...base, supplier_name: '' }), /required/);
});

test('M20 peppol: galat currency code → ISO-4217 error', () => {
  assert.throws(() => svc.generate({ ...base, currency: 'US' }), /ISO-4217/);
});

test('M20 peppol: negative line value → error (line number ke saath)', () => {
  assert.throws(
    () => svc.generate({ ...base, lines: [{ description: 'X', quantity: -1, unit_price: 10, tax_rate: 0 }] }),
    /Invalid invoice line 1/
  );
});
