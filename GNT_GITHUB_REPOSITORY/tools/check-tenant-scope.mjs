#!/usr/bin/env node
// टास्क #009 Step 5 — tenant-scope जाँच (ROUGH SCAFFOLDING)
// हर repository में findMany/findFirst/updateMany/deleteMany खोजता है और बताता है
// किन queries में `company_id` (या companyId) का where नहीं दिखता।
// सिर्फ़ गिनती/सूची देता है — ठीक अगले टास्क में होगा।

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve('backend/src/modules');
const METHODS = ['findMany', 'findFirst', 'updateMany', 'deleteMany'];

function walk(dir) {
  let out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const s = statSync(p);
    if (s.isDirectory()) out = out.concat(walk(p));
    else if (p.endsWith('.repository.ts') || p.includes('repository')) out.push(p);
  }
  return out;
}

const results = [];
for (const file of walk(ROOT)) {
  const text = readFileSync(file, 'utf8');
  for (const m of METHODS) {
    // मोटा-मोटा: method के बाद आने वाले (…ब्लॉक तक) में company_id/companyId ढूँढो
    const re = new RegExp('\\b' + m + '\\b', 'g');
    let match;
    while ((match = re.exec(text)) !== null) {
      const slice = text.slice(match.index, match.index + 1200);
      const hasCompany = /company_id|companyId/.test(slice);
      if (!hasCompany) {
        results.push({ file, method: m, at: text.slice(0, match.index).split('\n').length });
      }
    }
  }
}

console.log(`\n=== tenant-scope जाँच: ${results.length} queries में company_id नहीं मिला ===\n`);
for (const r of results) {
  console.log(`- ${r.file.replace(ROOT + '/', '')}:${r.at}  (${r.method})`);
}
