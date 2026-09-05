// M16 — order-link sign/verify (pure unit)
import { describe, it, expect, beforeEach } from 'vitest';
import { signOrderLink, verifyOrderLink } from '../../utils/order-link';

const TEST_SECRET = 'unit-test-order-link-secret';

beforeEach(() => {
  process.env.M16_ORDER_LINK_SECRET = TEST_SECRET;
});

describe('M16 order-link (HMAC)', () => {
  it('सही token verify होता है', () => {
    const payload = { c: 'camp-1', p: 'party-1', e: Date.now() + 60000 };
    const token = signOrderLink(payload);
    expect(verifyOrderLink(token)).toEqual(payload);
  });

  it('छेड़ा हुआ token verify नहीं होता', () => {
    const token = signOrderLink({ c: 'camp-1', p: 'party-1', e: Date.now() + 60000 });
    const tampered = token.slice(0, -2) + (token.endsWith('aa') ? 'bb' : 'aa');
    expect(verifyOrderLink(tampered)).toBeNull();
  });

  it('expired token verify नहीं होता', () => {
    const token = signOrderLink({ c: 'camp-1', p: 'party-1', e: Date.now() - 1000 });
    expect(verifyOrderLink(token)).toBeNull();
  });

  it('ग़लत shape वाला token null', () => {
    expect(verifyOrderLink('abc')).toBeNull();
    expect(verifyOrderLink('abc.def.ghi')).toBeNull();
  });

  it('secret न हो तो fail-closed — sign/verify दोनों throw (कोई fallback key नहीं)', () => {
    delete process.env.M16_ORDER_LINK_SECRET;
    expect(() => signOrderLink({ c: 'c', p: 'p', e: Date.now() + 1000 }))
      .toThrow(/M16_ORDER_LINK_SECRET/);
    expect(() => verifyOrderLink('abc.def')).toThrow(/M16_ORDER_LINK_SECRET/);
  });
});
