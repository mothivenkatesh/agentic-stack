// Agentic Stack eval suite — the regression gate this app preaches.
// Zero dependencies. Run: node evals/run.js  (exit 1 on any failure)
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import * as dataChecks from './checks/data.js';
import * as skillsChecks from './checks/skills.js';
import * as stackChecks from './checks/stack.js';
import * as uiChecks from './checks/ui.js';
import * as copyChecks from './checks/copy.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const fileCache = new Map();
const read = (rel) => {
  if (!fileCache.has(rel)) fileCache.set(rel, readFileSync(join(root, rel), 'utf8'));
  return fileCache.get(rel);
};
const json = (rel) => JSON.parse(read(rel));

// The pains manifest lives in src/data.js — parse it so the eval follows the app.
function painFiles() {
  const m = read('src/data.js').match(/const PAIN_FILES = \[([\s\S]*?)\];/);
  if (!m) throw new Error('PAIN_FILES manifest not found in src/data.js');
  return [...m[1].matchAll(/'([^']+)'/g)].map((x) => x[1]);
}

function srcFiles() {
  const out = [];
  const walk = (rel) => {
    for (const e of readdirSync(join(root, rel), { withFileTypes: true })) {
      const r = rel + '/' + e.name;
      if (e.isDirectory()) walk(r);
      else if (/\.(js|css)$/.test(e.name)) out.push({ rel: r, text: read(r) });
    }
  };
  walk('src');
  out.push({ rel: 'index.html', text: read('index.html') });
  return out;
}

async function main() {
  const ctx = { root, read, json, exists: (rel) => existsSync(join(root, rel)) };
  ctx.painFiles = painFiles();
  ctx.pains = [];
  ctx.painParseErrors = [];
  for (const f of ctx.painFiles) {
    try {
      const arr = json('data/' + f + '.json');
      if (!Array.isArray(arr)) throw new Error('not an array');
      arr.forEach((p) => ctx.pains.push({ ...p, __file: f }));
    } catch (e) { ctx.painParseErrors.push(f + ': ' + e.message); }
  }
  ctx.validations = json('data/validations-s-tier.json');
  ctx.skillsData = json('data/skills.json');
  ctx.stackRules = json('data/stack-rules.json');
  ctx.src = srcFiles();
  ctx.file = (rel) => ctx.src.find((f) => f.rel === rel)?.text ?? read(rel);

  const suites = [dataChecks, skillsChecks, stackChecks, uiChecks, copyChecks];
  let pass = 0, fail = 0;
  const failures = [];
  for (const s of suites) {
    const results = await s.run(ctx);
    const sp = results.filter((r) => r.ok).length;
    const sf = results.length - sp;
    pass += sp; fail += sf;
    console.log(`${sf ? '✗' : '✓'} ${s.name.padEnd(18)} ${sp}/${results.length} passed`);
    results.filter((r) => !r.ok).forEach((r) => failures.push({ suite: s.name, ...r }));
  }
  if (failures.length) {
    console.log('\nFAILURES');
    for (const f of failures) console.log(`  [${f.suite}] ${f.id}: ${f.msg}`);
  }
  console.log(`\n${fail ? 'GATE: FAIL' : 'GATE: PASS'} — ${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
}

main().catch((e) => { console.error('eval harness crashed:', e); process.exit(2); });
