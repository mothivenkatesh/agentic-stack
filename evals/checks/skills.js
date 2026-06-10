// Skills contract: the library the UI and copy are built around.
export const name = 'skills-contract';

const STAR_SKILLS = ['eval-plan', 'hitl-and-autonomy', 'reliability-and-failure', 'learning-loop'];

export function run(ctx) {
  const r = [];
  const ok = (id, cond, msg) => r.push({ id, ok: !!cond, msg: msg || '' });
  const d = ctx.skillsData;

  ok('layers', JSON.stringify(d.layers.map((l) => l.id).sort()) === JSON.stringify(['gate', 'section', 'spine']),
    'layers must be exactly gate/section/spine');
  ok('count-18', d.skills.length === 18,
    `got ${d.skills.length} — UI copy hardcodes "18" (skills.js hero, install lead, landing FAQ)`);

  const orders = d.skills.map((s) => s.order).sort((a, b) => a - b);
  ok('orders-1-18', JSON.stringify(orders) === JSON.stringify(Array.from({ length: 18 }, (_, i) => i + 1)),
    'orders must be unique 1..18');

  const bad = [];
  const layerIds = new Set(d.layers.map((l) => l.id));
  for (const s of d.skills) {
    if (!layerIds.has(s.layer)) bad.push(`${s.id}: layer ${s.layer}`);
    if (s.cmd !== '/agent-blueprint:' + s.id) bad.push(`${s.id}: cmd mismatch`);
    if (!s.oneLiner || s.oneLiner.length > 110) bad.push(`${s.id}: oneLiner missing/too long`);
    if (typeof s.star !== 'boolean') bad.push(`${s.id}: star not boolean`);
  }
  ok('skill-fields', bad.length === 0, bad.join(' | '));

  const stars = d.skills.filter((s) => s.star).map((s) => s.id).sort();
  ok('differentiators', JSON.stringify(stars) === JSON.stringify([...STAR_SKILLS].sort()),
    `star set drifted: ${stars.join(', ')} (banner copy names these four)`);

  ok('install', Array.isArray(d.install) && d.install.length === 2 && d.install.every((l) => l.includes('agent-blueprint')),
    'install must be the 2 plugin commands');
  ok('repo', /^https:\/\/github\.com\//.test(d.repo), d.repo);
  return r;
}
