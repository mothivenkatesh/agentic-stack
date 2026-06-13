// UI consistency: the design rules that keep the surface coherent.
// 1. Gradients are banned (flat fills) — sole exception: the .skel loading shimmer.
// 2. Fonts: Geist (UI) + Geist Mono (labels) + Instrument Serif (landing display only).
// 3. Icons: Phosphor regular; every icon name used must be vetted in ui.js's PHOSPHOR_ICON map.
// 4. Tour targets must exist; verdict color-maps must cover the data's verdict set.
export const name = 'ui-consistency';

const VERDICTS = ['Strong signal', 'Conditional pass', 'Fragile', 'Weak'];
const CORE_TOKENS = ['--brand:', '--surface-white:', '--ink-gray-9:', '--outline-gray-2:', '--r-lg:', '--sh-1:', '--font:', '--mono:'];

export function run(ctx) {
  const r = [];
  const ok = (id, cond, msg) => r.push({ id, ok: !!cond, msg: msg || '' });
  const css = ctx.file('src/styles.css');
  const htmlShell = ctx.file('index.html');
  const appShell = ctx.file('src/app.js');
  const stackView = ctx.file('src/views/stack.js');
  const jsFiles = ctx.src.filter((f) => f.rel.endsWith('.js'));

  // -- gradients --------------------------------------------------------
  const cssRules = css.split('}');
  const offenders = [];
  const stacked = [];
  for (const rule of cssRules) {
    if (!rule.includes('gradient(')) continue;
    const selector = rule.slice(0, rule.indexOf('{')).trim().replace(/\s+/g, ' ');
    if (!selector.includes('.skel')) offenders.push(selector || '(unknown)');
    const grads = (rule.match(/gradient\(/g) || []).length;
    if (grads > 1) stacked.push(selector || '(unknown)');
  }
  ok('gradient-whitelist', offenders.length === 0, 'decorative gradient on: ' + offenders.join(' ; '));
  ok('no-stacked-gradients', stacked.length === 0, 'two+ gradients on: ' + stacked.join(' ; '));
  const jsGrad = jsFiles.filter((f) => /gradient\(/.test(f.text)).map((f) => f.rel);
  ok('no-js-gradients', jsGrad.length === 0, jsGrad.join(', '));

  // -- fonts ------------------------------------------------------------
  const usesOneUiFont = css.includes('--font:var(--ds-font-sans)') && /--ds-font-sans:[^;]*'Geist/.test(css);
  ok('font-geist', usesOneUiFont || css.includes("--font:'Geist'"), '--font must use the One UI Geist stack');
  ok('font-mono', css.includes("--mono:'Geist Mono'"), '--mono must lead with Geist Mono');
  const badFonts = [...css.matchAll(/font-family:([^;}]+)/g)]
    .map((m) => m[1].trim())
    .filter((v) => !/^(var\(--font\)|var\(--mono\)|inherit|'Instrument Serif')/.test(v));
  ok('font-family-discipline', badFonts.length === 0, 'unsanctioned font-family: ' + badFonts.join(' | '));
  ok('html-fonts-link', /fonts\.googleapis\.com\/css2\?[^"]*Geist/.test(htmlShell) && htmlShell.includes('Instrument+Serif'),
    'index.html must load Geist + Instrument Serif');

  // -- icons ------------------------------------------------------------
  ok('html-phosphor', htmlShell.includes('phosphor-icons'), 'index.html must load the Phosphor stylesheet');
  ok('html-no-material', !htmlShell.includes('Material+Symbols'), 'Material Symbols link should be gone (Phosphor era)');
  const uiSrc = ctx.file('src/ui.js');
  const mapBlock = (uiSrc.match(/const PHOSPHOR_ICON = \{([\s\S]*?)\n\};/) || [])[1] || '';
  const mapped = new Set([...mapBlock.matchAll(/^\s*([a-z0-9_]+):/gm)].map((m) => m[1]));
  ok('icon-map-exists', mapped.size > 20, `parsed only ${mapped.size} mapped icons from ui.js`);
  const used = new Set();
  for (const f of jsFiles) {
    if (f.rel === 'src/ui.js') continue;
    for (const m of f.text.matchAll(/name="([a-z0-9_]+)"/g)) used.add(m[1]);
    for (const m of f.text.matchAll(/\b(?:icon|ic): '([a-z0-9_]+)'/g)) used.add(m[1]);
    for (const m of f.text.matchAll(/name=\$\{[^}]*\?\s*'([a-z0-9_]+)'\s*:\s*'([a-z0-9_]+)'/g)) { used.add(m[1]); used.add(m[2]); }
  }
  for (const m of uiSrc.matchAll(/icon = '([a-z0-9_]+)'/g)) used.add(m[1]);
  const unmapped = [...used].filter((n) => !mapped.has(n));
  ok('icons-vetted', unmapped.length === 0,
    'icon names used but not in PHOSPHOR_ICON map (unvetted glyphs): ' + unmapped.join(', '));

  // -- tour anchors -----------------------------------------------------
  const tour = ctx.file('src/views/tour.js');
  const targets = [...tour.matchAll(/data-tour="([a-z-]+)"/g)].map((m) => m[1]);
  const everywhere = ctx.src.map((f) => f.text).join('\n');
  const missing = [...new Set(targets)].filter((t) => {
    const re = new RegExp('data-tour="' + t + '"', 'g');
    return (everywhere.match(re) || []).length < 2; // 1 = only the tour's own reference
  });
  ok('tour-targets-exist', missing.length === 0, 'tour points at missing anchors: ' + missing.join(', '));

  // -- verdict maps -----------------------------------------------------
  const painsView = ctx.file('src/views/painIdeas.js');
  const home = ctx.file('src/views/home.js');
  const notInPains = VERDICTS.filter((v) => !painsView.includes(v));
  const notInHome = VERDICTS.filter((v) => !home.includes("'" + v + "'"));
  ok('verdicts-painIdeas', notInPains.length === 0, 'painIdeas.js misses verdict(s): ' + notInPains.join(', '));
  ok('verdicts-home', notInHome.length === 0, 'home.js SEGS misses verdict(s): ' + notInHome.join(', '));

  // -- shell + tokens ---------------------------------------------------
  ok('html-shell', htmlShell.includes('name="viewport"') && htmlShell.includes('#00AA45') && /type="module" src="src\/app\.js"/.test(htmlShell),
    'index.html shell drifted (viewport / theme-color / module script)');
  const missingTokens = CORE_TOKENS.filter((t) => !css.includes(t));
  ok('core-tokens', missingTokens.length === 0, 'styles.css missing tokens: ' + missingTokens.join(' '));

  // -- One UI mobile + builder standards -------------------------------
  ok('mobile-bottom-nav',
    appShell.includes('mobile-bottom-nav') &&
    css.includes('.mobile-bottom-nav') &&
    css.includes('env(safe-area-inset-bottom)') &&
    css.includes('.mb-item{min-height:52px'),
    'mobile app shell must expose a safe-area aware dark bottom nav with large tap targets');
  ok('stack-builder-three-pane',
    stackView.includes('builder-shell') &&
    stackView.includes('builder-assets') &&
    stackView.includes('builder-canvas') &&
    stackView.includes('builder-inspector') &&
    css.includes('grid-template-columns:260px minmax(0,1fr) 330px'),
    'stack picker must keep assets, flow canvas, and configuration/testing visible');
  ok('stack-builder-testing',
    stackView.includes('Configuration and testing') &&
    stackView.includes('Live tester') &&
    stackView.includes('node-status') &&
    stackView.includes('flow-status'),
    'builder must expose testing, node status, and flow status');
  ok('touched-surfaces-no-inline-style',
    !/\bstyle=/.test(appShell) && !/\bstyle=/.test(stackView),
    'app shell and stack builder should use classes instead of structural inline CSS');
  return r;
}
