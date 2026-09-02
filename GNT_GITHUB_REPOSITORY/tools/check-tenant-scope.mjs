#!/usr/bin/env node
// टास्क #009 Step 5 — tenant-scope जाँच (repository परत का दूसरा ताला)
//
// क्या करती है:
//   हर repository फाइल में findMany/findFirst/updateMany/deleteMany कॉल ढूँढती है,
//   हर कॉल के असली argument-ब्लॉक (balanced braces) के अंदर देखती है कि
//   company-scope का निशान है या नहीं:
//     company_id | companyId | tenantId | tenant_id
//   और तीन सूचियाँ देती है:
//     A) कहीं कोई scope निशान नहीं  → सबसे ख़तरनाक (cross-tenant read/write का छेद)
//     B) सिर्फ़ tenantId/tenant_id   → scoped है पर नाम अलग (अगले task में जाँच)
//     C) company_id/companyId से scoped → ठीक
//
// यह सिर्फ़ गिनती और सूची देती है — कुछ ठीक नहीं करती (ठीक करना अगले task का काम है)।
//
// सीमाएँ (जान-बूझकर, साफ़ लिखी हैं):
//   - `where` को चर में बनाकर बाद में जोड़ा गया हो (जैसे let where = {}; if (x) where.a=…)
//     तो वो यहाँ दिखेगा नहीं — ऐसे हाथ से देखने होंगे।
//   - `include`/`select` की अंदर की nested queries इस check में नहीं आतीं।
//   - test फाइलें (.test.ts) शामिल नहीं की जातीं।

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve('backend/src/modules');
const METHODS = ['findMany', 'findFirst', 'updateMany', 'deleteMany'];
const COMPANY_MARK = /company_id|companyId/;
const TENANT_MARK = /tenantId|tenant_id/;

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const s = statSync(p);
    if (s.isDirectory()) walk(p, out);
    else if ((p.endsWith('.repository.ts') || /repositories?[/\\]/.test(p)) && !p.endsWith('.test.ts')) out.push(p);
  }
  return out;
}

/** कॉल के '(' से balanced closing ')' तक का टेक्स्ट निकालो (नहीं मिला तो null) */
function callSlice(text, methodIndex) {
  const open = text.indexOf('(', methodIndex);
  if (open < 0) return null;
  let depth = 0;
  for (let i = open; i < text.length; i++) {
    const c = text[i];
    if (c === '(' || c === '{') depth++;
    else if (c === ')' || c === '}') {
      depth--;
      if (depth === 0) return text.slice(open, i + 1);
    }
  }
  return null;
}

const noScope = [];
const tenantOnly = [];
let scopedCount = 0;

const files = walk(ROOT);
for (const file of files) {
  const text = readFileSync(file, 'utf8');
  for (const m of METHODS) {
    const re = new RegExp('\\b' + m + '\\b', 'g');
    let match;
    while ((match = re.exec(text)) !== null) {
      const slice = callSlice(text, match.index);
      if (slice === null) continue;
      const line = text.slice(0, match.index).split('\n').length;
      const rel = file.replace(ROOT + '/', '');
      if (COMPANY_MARK.test(slice)) {
        scopedCount++;
      } else if (TENANT_MARK.test(slice)) {
        tenantOnly.push({ rel, line, method: m });
      } else {
        noScope.push({ rel, line, method: m });
      }
    }
  }
}

const print = (title, list) => {
  console.log(`\n${title} — ${list.length}`);
  for (const r of list) console.log(`  - ${r.rel}:${r.line}  (${r.method})`);
};

console.log(`repository फाइलें जाँची गईं: ${files.length}`);
console.log(`company_id/companyId से scoped: ${scopedCount}`);
print('A) कोई scope निशान नहीं (सबसे ख़तरनाक):', noScope);
print('B) सिर्फ़ tenantId/tenant_id से scoped (नाम अलग, अगले task में जाँच):', tenantOnly);
console.log('\nNOTE: चर में बनाए गए where (let where = {}) इस गिनती में नहीं आते — हाथ से देखना ज़रूरी है।');
