-- GNT — टास्क #024 हिस्सा C1/C2 (M02 Core Architecture): company_master.code
-- ⚠️ यह migration "तैनाती के समय" चलानी है (यहाँ इसे चलाया नहीं गया है)।
--
-- तर्क (CERT-003 शर्त 1): login की चाबी अब company_master.code है — GSTIN नहीं।
-- GSTIN बदल सकता है और संवेदनशील है; code छोटा, इंसान के लिखने लायक़ पहचान है
-- (जैसे "PURANSTORE")। login contract पहले से "companyCode" कहता था, पर backend
-- गलती से gstin से मिला रहा था (#003 का अनुमान) — अब दोनों मेल खाते हैं।
--
-- क्रम ज़रूरी: पहले column + डेटा भरना, फिर NOT NULL + UNIQUE (नहीं तो constraint
-- खाली/डुप्लिकेट पर फेल हो जाएगा)।

-- 1) column जोड़ो (nullable पहले — पुरानी पंक्तियों के लिए)
ALTER TABLE company_master ADD COLUMN IF NOT EXISTS code VARCHAR(20);

-- 2) पुराने डेटा के लिए code भरो: नाम के पहले 8 अक्षर/अंक, बड़े अक्षरों में।
--    जिन कंपनियों का नाम शुद्ध हिंदी/गैर-अंग्रेज़ी में है उनके लिए वहाँ से कुछ नहीं
--    निकलेगा — उनके लिए gstin के आख़िरी 8 (अगर gstin है) या न हो तो id के पहले 8।
UPDATE company_master
SET code = upper(substr(regexp_replace(name, '[^A-Za-z0-9]', '', 'g'), 1, 8))
WHERE code IS NULL OR code = '';

UPDATE company_master
SET code = upper(substr(regexp_replace(gstin, '[^A-Za-z0-9]', '', 'g'), 1, 8))
WHERE (code IS NULL OR code = '') AND gstin IS NOT NULL;

UPDATE company_master
SET code = substr(replace(id::text, '-', ''), 1, 8)
WHERE code IS NULL OR code = '';

-- 3) अब कड़े नियम लगाओ
ALTER TABLE company_master ALTER COLUMN code SET NOT NULL;
ALTER TABLE company_master ADD CONSTRAINT company_master_code_unique UNIQUE (code);

-- नोट: code अब बदलने योग्य नहीं रहना चाहिए — application layer इसे create के बाद
-- update नहीं होने देगा (onboarding बनते वक़्त यही नियम जाएगा)।
