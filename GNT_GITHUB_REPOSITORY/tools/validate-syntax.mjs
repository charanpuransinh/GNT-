import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const root = path.resolve('.');
let bad = 0, total = 0;

function walk(d) {
  for (const n of fs.readdirSync(d)) {
    const p = path.join(d, n);
    const st = fs.statSync(p);
    if (st.isDirectory()) {
      walk(p);
    } else if (/\.(ts|tsx)$/.test(n)) {
      total++;
      const s = fs.readFileSync(p, 'utf8');
      const sf = ts.createSourceFile(
        p,
        s,
        ts.ScriptTarget.Latest,
        true,
        n.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS
      );
      const diags = sf.parseDiagnostics;
      if (diags.length) {
        bad += diags.length;
        console.error(p, diags.map(d => d.messageText));
      }
    }
  }
}

walk(path.join(root, 'backend/src'));
walk(path.join(root, 'frontend/src'));

if (bad) {
  console.error(`Syntax failures: ${bad}/${total}`);
  process.exit(1);
}
console.log(`Syntax PASS: ${total} TypeScript/TSX files`);
