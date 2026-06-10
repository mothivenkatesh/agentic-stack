// Data loaders for the public datasets in /data. Cached in-memory.
const cache = {};
export async function loadJSON(path) {
  if (cache[path]) return cache[path];
  const r = await fetch(path, { cache: 'no-cache' });
  if (!r.ok) throw new Error('failed to load ' + path);
  const j = await r.json();
  cache[path] = j;
  return j;
}

const PAIN_FILES = [
  'pains-01-repair-home-services', 'pains-02-marketing-gtm-revops', 'pains-03-bharat-india',
  'pains-04-diligence-compliance-legal', 'pains-05-healthcare-medical', 'pains-06-finance-hr-ops-specialty',
  'pains-07-offbeat-niches', 'pains-08-reconciliation-automation-pm', 'pains-09-yc-wedges',
  'pains-10-reddit-threads', 'pains-11-international', 'pains-12-enterprise-it-gaming-climate',
  'pains-13-business-ops-deep', 'pains-14-d2c-ecommerce-deep', 'pains-15-finance-deep',
  'pains-16-supply-chain-logistics', 'pains-17-scientific-pharma-rnd', 'pains-18-specialty-professional-services',
  'pains-19-consumer-prosumer', 'pains-20-ai-native-emerging', 'pains-21-healthcare-adjacent',
  'pains-22-public-sector-govtech', 'pains-23-niche-b2b-longtail', 'pains-24-final-curated',
  'pains-25-mothi-ideas', 'pains-26-yc-service-plays',
];

let _pains = null;
export async function loadPains() {
  if (_pains) return _pains;
  const results = await Promise.all(
    PAIN_FILES.map((f) => loadJSON('data/' + f + '.json').catch(() => []))
  );
  const all = results.flat();
  try {
    const vals = await loadJSON('data/validations-s-tier.json');
    const byId = Object.fromEntries(vals.map((v) => [v.id, v.ai_cofounder_validation]));
    all.forEach((p) => { if (byId[p.id]) p.ai_cofounder_validation = byId[p.id]; });
  } catch (e) {}
  _pains = all;
  return all;
}

export const loadSkills = () => loadJSON('data/skills.json');
export const loadStackRules = () => loadJSON('data/stack-rules.json');
