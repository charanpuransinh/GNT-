-- ============================================================================
-- 010 — M05: party_ledger_view (blueprint §7.5 / §8.1 में लिखा है, बना कभी नहीं था)
--
-- blueprint (GNT_ADVANCED_SOFTWARE_BLUEPRINT_V2, §8.1 Canonical Entity Ownership):
--     M05 (Party)
--       +-- party_master        [Customer/Supplier - CANONICAL]
--       +-- party_ledger_view   [Running balance]
--
-- जाँचने पर यह view database में मौजूद ही नहीं था। यह ठीक वही चीज़ है जो मालिक के
-- हार्ड रूल को पूरा करती है: "हर party का ledger, बैलेंस, transaction history पूरी
-- तरह अपने आप में self-contained रहेगा।"
--
-- ⚠️ cast क्यों लगे हैं: `ledger.party_id` और `ledger.company_id` **text** हैं, जबकि
-- `party_master.id`/`company_id` **uuid** हैं। इसी बेमेल की वजह से इन दोनों के बीच
-- foreign key बन ही नहीं सकता — यानी ledger में कोई भी बेमानी party_id डाल दे तो
-- database उसे रोकेगा नहीं। यह अलग से दर्ज है; यहाँ फ़िलहाल cast से काम चलाया गया है।
-- ============================================================================

CREATE OR REPLACE VIEW party_ledger_view AS
SELECT
  p.id                                   AS party_id,
  p.company_id                           AS company_id,
  p.name                                 AS party_name,
  p.party_type                           AS party_type,
  p.is_active                            AS is_active,
  -- dr = हमें लेना है (+), cr = हमें देना है (−)
  (CASE WHEN p.opening_type = 'cr' THEN -p.opening_balance ELSE p.opening_balance END)
    + COALESCE(l.total_debit, 0)
    - COALESCE(l.total_credit, 0)        AS balance,
  COALESCE(l.total_debit, 0)             AS total_debit,
  COALESCE(l.total_credit, 0)            AS total_credit,
  COALESCE(l.entry_count, 0)             AS entry_count,
  l.last_transaction_date                AS last_transaction_date
FROM party_master p
LEFT JOIN (
  SELECT
    company_id,
    party_id,
    SUM(debit_amount)     AS total_debit,
    SUM(credit_amount)    AS total_credit,
    COUNT(*)              AS entry_count,
    MAX(transaction_date) AS last_transaction_date
  FROM ledger
  WHERE party_id IS NOT NULL
  GROUP BY company_id, party_id
) l
  ON  l.party_id::uuid   = p.id
  AND l.company_id::uuid = p.company_id;

COMMENT ON VIEW party_ledger_view IS
  'blueprint §8.1 — हर party का अपना running balance। हर पंक्ति सिर्फ़ एक party की है; दो parties का डेटा कभी एक पंक्ति में नहीं मिलता (मालिक का हार्ड रूल, 2026-09-05)।';
