-- GNT — टास्क #014 (M19 Audit Trail): audit_log को APPEND-ONLY बनाना
-- ⚠️ यह migration "तैनाती के समय" चलानी है (यहाँ इसे चलाया नहीं गया है)।
-- <app_user> को असल app DB user नाम से बदलें (जो application connect करता है)।
--
-- तर्क: audit trail छेड़छाड़-मुक्त होनी चाहिए। कोड में पहले से कोई update/delete नहीं है
-- (AuditRepository.deleteAuditLog/updateAuditLog ILLEGAL_OPERATION फेंकते हैं),
-- और यह migration DB level पर भी app user से UPDATE/DELETE छीन लेती है।

REVOKE UPDATE, DELETE ON audit_log FROM <app_user>;

-- नोट: SELECT + INSERT बने रहते हैं (सिर्फ पढ़ना + जोड़ना)।
