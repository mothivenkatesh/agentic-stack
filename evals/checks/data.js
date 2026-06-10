// Data integrity: the 26 pains files + validations are the product. Garbage here = broken UI.
export const name = 'data-integrity';

const VERDICTS = ['Strong signal', 'Conditional pass', 'Fragile', 'Weak'];
const BANNED_IDS = ['PAIN-0022', 'PAIN-0023', 'PAIN-0921']; // firearms + cannabis, removed 2026-06-08 (illegal in India)
const BANNED_RX = /\b(firearms?|gun\s?(shop|store|range|dealer)s?|cannabis|marijuana|dispensar(y|ies)|thc)\b/i;

export function run(ctx) {
  const r = [];
  const ok = (id, cond, msg) => r.push({ id, ok: !!cond, msg: msg || '' });

  ok('files-parse', ctx.painParseErrors.length === 0, ctx.painParseErrors.join(' | '));
  ok('total-pains', ctx.pains.length >= 1000, `expected >=1000, got ${ctx.pains.length} (UI copy claims "1,000 pains")`);

  const bad = [];
  const seen = new Map();
  const dupes = [];
  for (const p of ctx.pains) {
    const where = `${p.id || '?'} (${p.__file})`;
    if (!/^PAIN-\d{4}$/.test(p.id || '')) { bad.push(`${where}: bad id`); continue; }
    if (seen.has(p.id)) dupes.push(`${p.id} in ${seen.get(p.id)} + ${p.__file}`);
    seen.set(p.id, p.__file);
    if (!p.title || typeof p.title !== 'string') bad.push(`${where}: missing title`);
    if (!p.vertical) bad.push(`${where}: missing vertical`);
    if (!p.persona) bad.push(`${where}: missing persona`);
    if (!p.pain_description) bad.push(`${where}: missing pain_description`);
    if (!(Number.isFinite(p.pain_severity) && p.pain_severity >= 1 && p.pain_severity <= 10)) bad.push(`${where}: pain_severity ${p.pain_severity}`);
    if (!(Number.isFinite(p.opportunity_score) && p.opportunity_score >= 1 && p.opportunity_score <= 100)) bad.push(`${where}: opportunity_score ${p.opportunity_score}`);
    if (p.current_wtp_usd_month != null && !(Number.isFinite(p.current_wtp_usd_month) && p.current_wtp_usd_month >= 0)) bad.push(`${where}: bad wtp`);
    if (p.tam_firms != null && !(Number.isFinite(p.tam_firms) && p.tam_firms > 0)) bad.push(`${where}: bad tam_firms`);
    if (p.sources != null && (!Array.isArray(p.sources) || p.sources.some((s) => !/^https?:\/\//.test(s)))) bad.push(`${where}: bad sources`);
    if (p.tags != null && !Array.isArray(p.tags)) bad.push(`${where}: bad tags`);
  }
  ok('pain-fields', bad.length === 0, bad.slice(0, 12).join(' | ') + (bad.length > 12 ? ` … +${bad.length - 12} more` : ''));
  ok('pain-ids-unique', dupes.length === 0, dupes.slice(0, 8).join(' | '));

  const bannedHits = ctx.pains.filter((p) =>
    BANNED_IDS.includes(p.id) ||
    BANNED_RX.test([p.title, p.vertical, p.pain_description, (p.tags || []).join(' ')].join(' ')));
  ok('banned-content', bannedHits.length === 0, 'illegal-in-India content: ' + bannedHits.map((p) => p.id).join(', '));

  const ids = new Set(ctx.pains.map((p) => p.id));
  const vBad = [];
  for (const v of ctx.validations) {
    if (!ids.has(v.id)) vBad.push(`${v.id}: no matching pain`);
    const a = v.ai_cofounder_validation || {};
    if (!VERDICTS.includes(a.verdict)) vBad.push(`${v.id}: verdict "${a.verdict}"`);
    if (a.raw_total != null && a.max_possible != null && a.raw_total > a.max_possible) vBad.push(`${v.id}: raw_total > max`);
  }
  ok('validations-resolve', vBad.length === 0, vBad.slice(0, 8).join(' | '));
  ok('validations-count', ctx.validations.length >= 40, `expected >=40 validated pains, got ${ctx.validations.length}`);
  return r;
}
