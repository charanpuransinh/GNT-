-- ============================================================================
-- 009 — M10: voucher_allocation (मालिक पूरन सिंह का फ़ैसला, 2026-09-05)
--
--   "हर payment/receipt (पूरा हो या partial) की अलग voucher entry बनेगी।
--    हर voucher उस party के ledger और उस specific bill/invoice से लिंक होगा,
--    ताकि matching और बकाया अमाउंट ट्रैक हो सके।
--    Partial payments allowed हों — एक बिल के against कई vouchers बन सकें
--    जब तक पूरा clear न हो जाए।"
--
-- क्यों ज़रूरी थी: voucher में बिल का कोई कॉलम था ही नहीं, और यह कहीं दर्ज नहीं
-- होता था कि किस voucher ने किस बिल का कितना चुकाया।
-- ============================================================================

CREATE TABLE IF NOT EXISTS voucher_allocation (
  id               TEXT PRIMARY KEY,
  company_id       TEXT NOT NULL,
  voucher_id       TEXT NOT NULL REFERENCES voucher(id) ON DELETE CASCADE,
  party_id         TEXT NOT NULL,
  reference_type   VARCHAR(30) NOT NULL,
  reference_id     TEXT NOT NULL,
  allocated_amount DECIMAL(15,4) NOT NULL,
  created_at       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by       TEXT
);

-- एक voucher एक ही बिल पर दो बार allocate न हो
CREATE UNIQUE INDEX IF NOT EXISTS voucher_allocation_voucher_ref_key
  ON voucher_allocation (voucher_id, reference_type, reference_id);

-- "इस बिल का कितना चुका" — यह सवाल सबसे ज़्यादा पूछा जाएगा
CREATE INDEX IF NOT EXISTS voucher_allocation_ref_idx
  ON voucher_allocation (company_id, reference_type, reference_id);

-- "इस party का कुल बकाया कितना"
CREATE INDEX IF NOT EXISTS voucher_allocation_party_idx
  ON voucher_allocation (company_id, party_id);

-- रकम कभी शून्य या ऋणात्मक न हो — आधा भुगतान भी कम से कम कुछ तो हो
ALTER TABLE voucher_allocation
  DROP CONSTRAINT IF EXISTS voucher_allocation_amount_positive;
ALTER TABLE voucher_allocation
  ADD CONSTRAINT voucher_allocation_amount_positive CHECK (allocated_amount > 0);
