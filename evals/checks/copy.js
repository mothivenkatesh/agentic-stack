// Copy drift: numbers stated in UI copy must match the data they describe.
export const name = 'copy-drift';

export function run(ctx) {
  const r = [];
  const ok = (id, cond, msg) => r.push({ id, ok: !!cond, msg: msg || '' });

  // "18 skills" claims (skills.js hero + install lead, landing FAQ)
  const skillsView = ctx.file('src/views/skills.js');
  ok('skills-18-copy', ctx.skillsData.skills.length === 18 && skillsView.includes('18 skills') && skillsView.includes('Add all 18'),
    `skills.json has ${ctx.skillsData.skills.length}; copy hardcodes 18 in skills.js/landing.js`);

  // "1,000 pains" claims (landing hero + FAQ, tour CTA, index.html meta)
  const claimFiles = ['src/views/landing.js', 'src/views/tour.js', 'index.html'].filter((f) => ctx.file(f).includes('1,000'));
  ok('thousand-claims', ctx.pains.length >= 1000, `copy in ${claimFiles.join(', ')} claims 1,000 but data has ${ctx.pains.length}`);

  // PRD section contract: 15 sections, 5 starred — in the outline, the prompt, and the sample.
  const prd = ctx.file('src/views/prd.js');
  const sectionsBlock = (prd.match(/const SECTIONS = \[([\s\S]*?)\];/) || [])[1] || '';
  const sectionEntries = [...sectionsBlock.matchAll(/'[^']+'/g)].map((m) => m[0]);
  ok('prd-sections-15', sectionEntries.length === 15, `SECTIONS has ${sectionEntries.length}`);
  ok('prd-sections-5-star', sectionEntries.filter((s) => s.includes('★')).length === 5,
    `SECTIONS stars ${sectionEntries.filter((s) => s.includes('★')).length}/15 — contract is 5`);

  const prompt = ctx.file('src/prdPrompt.js');
  ok('prompt-15', prompt.includes('15.'), 'prdPrompt SYSTEM must list 15 numbered sections');
  const promptStars = (prompt.match(/★/g) || []).length;
  ok('prompt-5-star', promptStars === 6, // 5 section lines + 1 in the instruction sentence
    `prdPrompt has ${promptStars} ★ (5 section markers + 1 instruction expected)`);

  const sample = ctx.file('src/sampleprd.js');
  const sampleHeads = sample.match(/^## /gm) || [];
  ok('sample-15-sections', sampleHeads.length === 15, `sample PRD has ${sampleHeads.length} sections`);
  const sampleStarHeads = (sample.match(/^## .*★/gm) || []).length;
  ok('sample-5-star', sampleStarHeads === 5, `sample PRD stars ${sampleStarHeads} headings — contract is 5`);

  // 4 differentiator skills + memory = "the 5" copy in skills hero.
  ok('the-5-copy', skillsView.includes('the 5'), 'skills hero should reference "the 5" make-or-break sections');
  return r;
}
