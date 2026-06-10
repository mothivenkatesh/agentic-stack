// Stack wizard behavior: run EVERY possible answer combination through the
// real recommend() (src/stackLogic.js). Catches rules-json renames silently
// breaking the wizard (undefined builder/model/memory in the result card).
export const name = 'stack-wizard';

import { recommend } from '../../src/stackLogic.js';

// Question ids the logic branches on — keep in sync with src/stackLogic.js.
const LOGIC_DEPS = ['builder', 'actions', 'bar', 'multi', 'control', 'durability'];

export function run(ctx) {
  const r = [];
  const ok = (id, cond, msg) => r.push({ id, ok: !!cond, msg: msg || '' });
  const rules = ctx.stackRules;

  ok('seven-questions', rules.questions.length === 7, `got ${rules.questions.length}`);

  const qBad = [];
  for (const q of rules.questions) {
    if (!q.id || !q.label || !Array.isArray(q.options) || q.options.length < 2) { qBad.push(`${q.id || '?'}: malformed`); continue; }
    for (const o of q.options) {
      if (o.value == null || !o.label) qBad.push(`${q.id}/${o.value}: missing value/label`);
      if (o.weight && Object.keys(o.weight).some((k) => !['l1', 'l2', 'l3', 'l4'].includes(k))) qBad.push(`${q.id}/${o.value}: bad weight key`);
    }
  }
  ok('question-shape', qBad.length === 0, qBad.join(' | '));

  const qIds = new Set(rules.questions.map((q) => q.id));
  const missingDeps = LOGIC_DEPS.filter((d) => !qIds.has(d));
  ok('logic-deps', missingDeps.length === 0,
    `stackLogic.js branches on question ids that no longer exist: ${missingDeps.join(', ')}`);

  // Full cartesian enumeration.
  let combos = [{}];
  for (const q of rules.questions) {
    const next = [];
    for (const c of combos) for (const o of q.options) next.push({ ...c, [q.id]: o.value });
    combos = next;
    if (combos.length > 50000) { ok('combo-bound', false, 'combinatorial explosion'); return r; }
  }

  const broken = [];
  const buildersSeen = new Set();
  for (const c of combos) {
    let res;
    try { res = recommend(rules, c); } catch (e) { broken.push(`${JSON.stringify(c)} threw ${e.message}`); continue; }
    for (const k of ['layer', 'builder', 'model', 'memory', 'evalApproach']) {
      if (!res[k]) { broken.push(`${JSON.stringify(c)} → ${k} undefined`); break; }
    }
    if (res.builder) buildersSeen.add(res.builder.id);
  }
  ok('all-combos-resolve', broken.length === 0,
    `${broken.length}/${combos.length} combos break: ` + broken.slice(0, 3).join(' | '));
  ok('discriminates', buildersSeen.size >= 5,
    `only ${buildersSeen.size} distinct builders reachable across ${combos.length} combos`);
  return r;
}
