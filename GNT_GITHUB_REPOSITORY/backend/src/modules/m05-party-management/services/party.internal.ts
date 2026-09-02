// ============================================================================
// M05 PARTY MANAGEMENT — Internal (module के अंदर का हिसाब-किताब, public नहीं)
// ============================================================================

import { CreditCheckResult, Party } from '../types/party.types';

/**
 * उधार-सीमा की जाँच: opening_balance + चल बकाया (outstanding) बनाम credit_limit।
 * डिज़ाइन फ़ैसला: बकाया party table में store नहीं — M10 से गिनकर आता है।
 * अभी M10 का ledger तैयार नहीं, इसलिए यहाँ सिर्फ़ opening_balance गिना जाता है
 * और outstanding शून्य माना जाता है (TODO(#016) — नक़ली आँकड़े नहीं)।
 */
export function checkCreditLimitInternal(
  party: Party,
  outstandingFromLedger: number,
  new_amount: number,
): CreditCheckResult {
  const limit = Number(party.credit_limit) || 0;
  const opening = party.opening_type === 'cr' ? -Number(party.opening_balance) : Number(party.opening_balance);
  const used = opening + outstandingFromLedger;
  const available = limit > 0 ? limit - used : 0;

  if (limit <= 0) {
    // limit 0 = कोई सीमा नहीं (असीमित उधार)
    return { allowed: true, limit: 0, used, available: 0 };
  }

  const allowed = used + new_amount <= limit;
  return {
    allowed,
    limit,
    used,
    available,
    reason: allowed ? undefined : `Credit limit exceeded (limit ${limit}, used ${used})`,
  };
}

/**
 * बकाये की उम्र (aging) — M10 से गिनकर आएगा।
 * अभी ख़ाली — झूठे आँकड़े गढ़ना मना (समीक्षक AI का नियम)।
 */
export function emptyAging(party_id: string) {
  return {
    party_id,
    not_due: 0,
    due_1_30: 0,
    due_31_60: 0,
    due_61_90: 0,
    due_over_90: 0,
    total: 0,
  };
}
