import { html, Icon, useState, useEffect, fmtNum } from '../ui.js';
import { store } from '../auth.js';
import { loadPains } from '../data.js';

const ACTIONS = [
  { ic: 'lightbulb', cls: 'ic-amber', title: 'Browse the pains', body: 'Filter by industry, severity, what they pay.', view: 'pains', payload: {} },
  { ic: 'lan', cls: 'ic-blue', title: 'Pick your stack', body: '7 questions. Get the layer, builder, and eval call.', view: 'stack', payload: {} },
  { ic: 'description', cls: 'ic-green', title: 'Draft the PRD', body: 'Describe the agent. Get an eval-gated spec.', view: 'prd', payload: {} },
  { ic: 'extension', cls: 'ic-violet', title: 'Steal the playbook', body: '18 Claude Code skills. Install once.', view: 'skills', payload: null },
];

// Verdict palette — same flat colors as the pain cards' dot-tags.
const SEGS = [
  { k: 'Strong signal', l: 'Strong case', c: '#1F9D55' },
  { k: 'Conditional pass', l: 'Promising', c: '#0289F7' },
  { k: 'Fragile', l: 'Risky', c: '#D98A00' },
  { k: 'Weak', l: 'Weak case', c: '#E0533D' },
];

export function Home({ go, user }) {
  const [pains, setPains] = useState(null);
  useEffect(() => { loadPains().then(setPains).catch(() => setPains([])); }, []);
  const drafts = store.prds();
  const favs = store.favs();

  let stats = null;
  if (pains && pains.length) {
    const byVert = {};
    const mix = {};
    const wtps = [];
    let validated = 0;
    for (const p of pains) {
      if (p.vertical) byVert[p.vertical] = (byVert[p.vertical] || 0) + 1;
      if (p.ai_cofounder_validation) { validated++; const v = p.ai_cofounder_validation.verdict; mix[v] = (mix[v] || 0) + 1; }
      if (p.current_wtp_usd_month) wtps.push(p.current_wtp_usd_month);
    }
    const top = Object.entries(byVert).sort((a, b) => b[1] - a[1]).slice(0, 6);
    wtps.sort((a, b) => a - b);
    stats = {
      total: pains.length,
      top,
      maxTop: top.length ? top[0][1] : 1,
      validated,
      mix,
      medianWtp: wtps.length ? wtps[Math.floor(wtps.length / 2)] : 0,
    };
  }

  const skel = html`<div class="home-skel">${Array(5).fill(0).map(() => html`<span class="skel skel-h13"></span>`)}</div>`;

  return html`
    <div class="view view-wide">
      <div class="page-hero" data-tour="narrative-hero">
        <div>
          <div class="page-kicker">${user ? 'Welcome back' : 'Home'}</div>
          <h1>Find a pain worth building.</h1>
          <p>Real pains with the who, the money, and the gap documented. Pick one, pick a stack, ship the spec.</p>
          <div class="hero-path">
            <button class="ctxchip on" onClick=${() => go('pains')}><${Icon} name="search" size="20" /> Find pain</button>
            <button class="ctxchip" onClick=${() => go('stack')}><${Icon} name="lan" size="20" /> Pick stack</button>
            <button class="ctxchip" onClick=${() => go('prd')}><${Icon} name="description" size="20" /> Write PRD</button>
          </div>
        </div>
        <div class="hero-stats">
          <div class="hero-stat"><b>${stats ? fmtNum(stats.total) : '…'}</b><span>pains</span></div>
          <div class="hero-stat"><b>${stats ? stats.validated : '…'}</b><span>investor-checked</span></div>
          <div class="hero-stat"><b>18</b><span>skills</span></div>
        </div>
      </div>

      ${(favs.length || drafts.length) ? html`
        <div class="sect-head"><h2>Jump back in</h2></div>
        <div class="home-cols mb-26">
          ${favs.length ? html`
            <button class="cont" onClick=${() => go('saved')}>
              <span class="cic ic-amber"><${Icon} name="bookmark" /></span>
              <span class="ctxt"><b>${favs.length} saved ${favs.length === 1 ? 'pain' : 'pains'}</b><span>Your shortlist. Open the deal room.</span></span>
              <${Icon} name="arrow_forward" size="18" />
            </button>` : ''}
          ${drafts.slice(0, 2).map((d) => html`
            <button class="cont" onClick=${() => go('prd', { draftId: d.id })}>
              <span class="cic ic-green"><${Icon} name="description" /></span>
              <span class="ctxt"><b>${d.title || 'Untitled PRD'}</b><span>PRD draft in this browser. Keep going.</span></span>
              <${Icon} name="arrow_forward" size="18" />
            </button>`)}
        </div>` : ''}

      <div class="sect-head"><h2>The dataset at a glance</h2><span class="count">${stats ? 'live from ' + fmtNum(stats.total) + ' entries' : 'loading…'}</span></div>
      <div class="home-cols mb-28">
        <div class="viz-card">
          <div class="viz-head"><b>Where the pain concentrates</b><span>top industries</span></div>
          ${!stats ? skel : stats.top.map(([name, count], i) => html`
            <button class="bar-row" onClick=${() => go('pains', { vertical: name })} title=${'Open ' + name + ' in the browser'}>
              <span class="rankn">${i + 1}</span>
              <span class="bar-label">${name}</span>
              <span class="bar-track"><span class="bar-fill" style=${/* one-ui-allow: bar width is data-driven (count / max) */ { width: Math.max(6, Math.round((count / stats.maxTop) * 100)) + '%' }}></span></span>
              <span class="bar-count">${count}</span>
            </button>`)}
          ${stats ? html`<p class="viz-foot">Click an industry to filter the browser.</p>` : ''}
        </div>

        <div class="viz-card">
          <div class="viz-head"><b>The investor-checked ${stats ? stats.validated : ''}</b><span>verdict mix</span></div>
          ${!stats ? skel : html`
            <div class="vsplit">
              ${SEGS.filter((s) => stats.mix[s.k]).map((s) => html`<span style=${/* one-ui-allow: segment size + verdict color from data */ { flex: stats.mix[s.k], background: s.c }} title=${s.l + ': ' + stats.mix[s.k]}></span>`)}
            </div>
            <div class="vlegend">
              ${SEGS.map((s) => html`<span class="vleg"><span class="vdot" style=${/* one-ui-allow: verdict dot color from data */ { background: s.c }}></span>${s.l} <b>${stats.mix[s.k] || 0}</b></span>`)}
            </div>
            <div class="viz-stat"><b>$${fmtNum(stats.medianWtp)}/mo</b><span>median spend on the problem today</span></div>
            <button class="btn btn-accent btn-sm" onClick=${() => go('pains', { verdict: '__validated__' })}>See all ${stats.validated}</button>`}
        </div>
      </div>

      <div class="sect-head"><h2>Start in one click</h2><span class="count">${ACTIONS.length} paths</span></div>
      <div class="home-grid" data-tour="templates">
        ${ACTIONS.map((t) => html`
          <button class="tmpl" onClick=${() => go(t.view, t.payload)}>
            <div class=${'ic ' + t.cls}><${Icon} name=${t.ic} /></div>
            <h3>${t.title} <${Icon} name="arrow_forward" /></h3>
            <p>${t.body}</p>
          </button>`)}
      </div>
    </div>`;
}
