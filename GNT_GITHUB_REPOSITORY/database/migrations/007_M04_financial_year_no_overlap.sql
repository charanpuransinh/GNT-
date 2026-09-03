-- GNT — टास्क #024 हिस्सा B3 (M04 Company Management): financial_year overlap रोकना
-- ⚠️ यह migration "तैनाती के समय" चलानी है (यहाँ इसे चलाया नहीं गया है)।
--
-- तर्क: एक कंपनी के दो financial year कभी भी आपस में तारीख़ों में overlap न करें —
-- नहीं तो एक ही तारीख़ दो FY में गिर सकती है और हिसाब बँट जाता है।
-- Prisma में EXCLUDE constraint नहीं बनता, इसलिए raw SQL।
--
-- daterange '[]' = दोनों किनारे शामिल। इसका मतलब:
--   FY1 = 2026-04-01 .. 2027-03-31 और FY2 = 2027-04-01 .. 2028-03-31 → OK (सटे हुए, overlap नहीं)
--   FY1 = 2026-04-01 .. 2027-03-31 और FY2 = 2026-10-01 .. 2027-09-30 → REJECT (overlap)
--
-- मेल: schema.prisma के financial_year model का comment ("EXCLUDE fy_no_overlap —
-- raw SQL migration में जोड़ना होगा") यहीं पूरा होता है।

CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE financial_year
  ADD CONSTRAINT fy_no_overlap EXCLUDE USING gist (
    company_id WITH =,
    daterange(start_date, end_date, '[]') WITH &&
  );

-- नोट: अगर तालिका में पहले से overlap वाली पंक्तियाँ हों तो यह migration FAIL करेगी
-- (और यही सही है — पहले डेटा साफ़ करना होगा)। नया गलत डेटा अब अंदर जा ही नहीं सकता।
