import { html, Icon, Modal, Empty, Pager, useState, useEffect, useRef, useMemo, fmtNum, fmtMoney } from '../ui.js';
import { loadPains } from '../data.js';
import { store } from '../auth.js';

const PAGE = 12;
const WORKFLOW = {
  intake: 'Intake (first contact)', triage_routing: 'Triage and routing',
  extraction_validation: 'Extraction and validation', outbound_followup: 'Outbound and follow-up',
  transactional_action: 'Transactional action', compliance_audit: 'Compliance and audit',
  synthesis_reporting: 'Synthesis and reporting', full_lifecycle: 'Full lifecycle (end to end)',
};
const TAMDIR = {
  'rapidly-growing': 'Growing fast', growing: 'Growing', 'stable-growing': 'Stable, slowly growing',
  stable: 'Stable', 'stable-declining': 'Stable, slowly shrinking', declining: 'Shrinking',
};
const VERDICT_PILL = { 'Strong signal': 'pill-green', 'Conditional pass': 'pill-blue', Fragile: 'pill-amber', Weak: 'pill-red' };
// Clearer, plain-language labels for the investor-grade verdict (data keys above stay for filtering).
const VERDICT_LABEL = { 'Strong signal': 'Strong case', 'Conditional pass': 'Promising', Fragile: 'Risky', Weak: 'Weak case' };
// Verdict is a separate axis from the opportunity score, so render it as a quiet dot-tag, not a competing pill.
const VERDICT_DOT = { 'Strong signal': 'v-green', 'Conditional pass': 'v-blue', Fragile: 'v-amber', Weak: 'v-red' };
const scoreClass = (s) => (s >= 85 ? 'pill-green' : s >= 70 ? 'pill-amber' : 'pill-gray');

// Frappe-styled custom dropdown (native <select> can't be themed).
function FilterSelect({ label, value, options, placeholder, onChange }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const ref = useRef(null);
  useEffect(() => {
    if (!open) { setQ(''); return; }
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey); };
  }, [open]);
  const current = options.find((o) => o.v === value);
  const searchable = options.length > 10;
  const shown = searchable && q.trim() ? options.filter((o) => o.l.toLowerCase().includes(q.trim().toLowerCase())) : options;
  return html`
    <div class="fgroup">
      <span class="ft">${label}</span>
      <div class=${'dd' + (open ? ' open' : '')} ref=${ref}>
        <button type="button" class=${'dd-toggle' + (value ? ' active' : '')} onClick=${() => setOpen((o) => !o)} aria-haspopup="listbox" aria-expanded=${open}>
          <span class="dd-val">${current ? current.l : placeholder}</span>
          <${Icon} name="expand_more" size="18" cls="dd-chev" />
        </button>
        ${open ? html`<div class="dd-menu" role="listbox">
          ${searchable ? html`<input class="dd-search" type="search" placeholder=${'Search ' + label.toLowerCase() + '…'} value=${q} onInput=${(e) => setQ(e.target.value)} autofocus />` : ''}
          ${shown.length ? shown.map((o) => html`
            <button type="button" class=${'dd-opt' + (o.v === value ? ' on' : '')} role="option" aria-selected=${o.v === value} onClick=${() => { onChange(o.v); setOpen(false); }}>
              <span>${o.l}</span>${o.v === value ? html`<${Icon} name="check" size="16" />` : ''}
            </button>`) : html`<div class="dd-empty">No matches</div>`}
        </div>` : ''}
      </div>
    </div>`;
}

export function PainIdeas({ go, seed, savedOnly }) {
  const [all, setAll] = useState(null);
  const [q, setQ] = useState('');
  const [vertical, setVertical] = useState('');
  const [workflow, setWorkflow] = useState('');
  const [sort, setSort] = useState('opportunity_score');
  const [minSev, setMinSev] = useState(0);
  const [verdict, setVerdict] = useState('');
  const [ycFit, setYcFit] = useState('');
  const [page, setPage] = useState(1);
  const [sel, setSel] = useState(null);
  const [favs, setFavs] = useState(store.favs());

  useEffect(() => { loadPains().then(setAll); }, []);
  useEffect(() => {
    if (seed && seed.view === 'pains' && seed.payload) {
      const p = seed.payload;
      if (p.q != null) setQ(p.q);
      if (p.verdict) setVerdict(p.verdict);
      if (p.vertical) setVertical(p.vertical);
      setPage(1);
    }
  }, [seed]);

  const verticals = useMemo(() => (all ? [...new Set(all.map((p) => p.vertical))].sort() : []), [all]);
  const workflows = useMemo(() => (all ? [...new Set(all.map((p) => p.workflow_family).filter(Boolean))].sort() : []), [all]);

  const filtered = useMemo(() => {
    if (!all) return [];
    const ql = q.toLowerCase();
    let out = all.filter((p) => {
      if (savedOnly && !favs.includes(p.id)) return false;
      if (vertical && p.vertical !== vertical) return false;
      if (workflow && p.workflow_family !== workflow) return false;
      if (minSev && (p.pain_severity || 0) < minSev) return false;
      if (verdict === '__validated__' && !p.ai_cofounder_validation) return false;
      if (verdict && verdict !== '__validated__' && p.ai_cofounder_validation?.verdict !== verdict) return false;
      const yc = p.yc_service_fit?.score || 0;
      if (ycFit === '4' && yc < 4) return false;
      if (ycFit === '3plus' && yc < 3) return false;
      if (ql) {
        const hay = [p.title, p.vertical, p.persona, p.pain_description, (p.tags || []).join(' ')].join(' ').toLowerCase();
        if (!hay.includes(ql)) return false;
      }
      return true;
    });
    out.sort((a, b) => (b[sort] || 0) - (a[sort] || 0));
    return out;
  }, [all, q, vertical, workflow, sort, minSev, verdict, ycFit, favs, savedOnly]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE));
  const pg = Math.min(page, pages);
  const slice = filtered.slice((pg - 1) * PAGE, pg * PAGE);
  const activeFilters = [vertical, workflow, verdict, ycFit].filter(Boolean).length + (minSev ? 1 : 0) + (q ? 1 : 0);

  const radio = (val, cur, set, opts) => html`
    <div class="radio">${opts.map(([v, l]) => html`
      <button class=${'' + (cur === v ? 'on' : '')} onClick=${() => { set(v); setPage(1); }}>
        <span>${l}</span><${Icon} name="check" /></button>`)}</div>`;

  return html`
    <div class="view view-wide">
      <div class="page-hero" data-tour="narrative-hero">
        <div>
          <div class="page-kicker">${savedOnly ? 'Saved opportunities' : 'Pain ideas'}</div>
          <h1>${savedOnly ? 'Revisit the markets you marked as worth a closer read.' : 'Browse real operating pain before you build.'}</h1>
          <p>${savedOnly ? 'Saved pains are your deal room: open one to inspect the case, choose a stack, or draft the PRD.' : 'Each entry captures who hurts, what breaks, what they pay, the incumbent gap, and the path to a first wedge.'}</p>
        </div>
        <div class="hero-stats">
          <div class="hero-stat"><b>${all ? fmtNum(savedOnly ? favs.length : all.length) : '...'}</b><span>${savedOnly ? 'saved pains' : 'total pains'}</span></div>
          <div class="hero-stat"><b>${all ? fmtNum(filtered.length) : '...'}</b><span>in this view</span></div>
          <div class="hero-stat"><b>${activeFilters}</b><span>${activeFilters === 1 ? 'active filter' : 'active filters'}</span></div>
        </div>
      </div>
      <div hidden class="banner banner-amber" data-tour="narrative-hero">
        <${Icon} name=${savedOnly ? 'bookmark' : 'lightbulb'} />
        <div>${!all ? 'Loading the idea browser…' : savedOnly ? html`<b>${fmtNum(favs.length)}</b> saved ${favs.length === 1 ? 'pain' : 'pains'}. Open one to validate it or start building.` : html`<b>${fmtNum(all.length)}</b> pain points, each answering who hurts, how big, what they pay, the gap, and why now.`}</div>
      </div>

      <div style="display:flex;gap:10px;align-items:center;margin-bottom:16px;flex-wrap:wrap">
        <div class="search"><${Icon} name="search" />
          <input type="search" placeholder="Search pain, industry, or who hurts…" value=${q}
            onInput=${(e) => { setQ(e.target.value); setPage(1); }} />
        </div>
        <span class="muted" style="font-size:13px"><strong style="color:var(--ink-gray-9)">${fmtNum(filtered.length)}</strong> results</span>
        ${activeFilters ? html`<button class="btn btn-ghost btn-sm" onClick=${() => { setQ(''); setVertical(''); setWorkflow(''); setMinSev(0); setVerdict(''); setYcFit(''); setPage(1); }}><${Icon} name="ink_eraser" size="18" /> Clear</button>` : ''}
      </div>

      <div class="split">
        <aside class="filters">
          <div class="fgroup"><span class="ft">Sort by</span>
            ${radio(sort, sort, setSort, [['opportunity_score', 'Overall score'], ['pain_severity', 'Pain level'], ['tedium_score', 'How repetitive'], ['current_wtp_usd_month', 'What they pay'], ['tam_firms', 'Market size']])}
          </div>
          <${FilterSelect} label="Industry" value=${vertical} placeholder="All industries"
            options=${[{ v: '', l: 'All industries' }, ...verticals.map((v) => ({ v, l: v }))]}
            onChange=${(val) => { setVertical(val); setPage(1); }} />
          <${FilterSelect} label="Type of work" value=${workflow} placeholder="All types"
            options=${[{ v: '', l: 'All types' }, ...workflows.map((w) => ({ v: w, l: WORKFLOW[w] || w }))]}
            onChange=${(val) => { setWorkflow(val); setPage(1); }} />
          <div class="fgroup"><span class="ft">Pain level</span>
            ${radio(String(minSev), String(minSev), (v) => setMinSev(parseInt(v, 10)), [['0', 'Any'], ['7', '7 or higher'], ['8', '8 or higher'], ['9', '9 or higher'], ['10', 'Exactly 10']])}
          </div>
          <div class="fgroup"><span class="ft">Investor check</span>
            ${radio(verdict, verdict, setVerdict, [['', 'All entries'], ['__validated__', 'Top 50 (S-tier)'], ['Strong signal', 'Strong case'], ['Conditional pass', 'Promising'], ['Fragile', 'Risky']])}
          </div>
          <div class="fgroup"><span class="ft">YC service-co fit</span>
            ${radio(ycFit, ycFit, setYcFit, [['', 'All'], ['3plus', '3+ traits'], ['4', '4/4 perfect']])}
          </div>
        </aside>

        <main>
          ${!all ? html`<div class="cards">${Array(6).fill(0).map(() => html`<div class="card"><span class="skel" style="width:60%"></span><span class="skel" style="width:90%;height:16px"></span><span class="skel"></span><span class="skel" style="width:80%"></span></div>`)}</div>`
            : !filtered.length ? html`<${Empty} icon=${savedOnly ? 'bookmark_border' : 'search_off'} title=${savedOnly ? 'No saved pains yet' : 'No matches'}>${savedOnly ? 'Tap the bookmark on any pain to save it here for later.' : 'Try loosening a filter or clearing the search.'}</${Empty}>`
            : html`
              <div class="cards">
                ${slice.map((p) => {
                  const v = p.ai_cofounder_validation;
                  const yc = p.yc_service_fit;
                  return html`
                    <article class="card" tabindex="0" onClick=${() => setSel(p)} onKeyDown=${(e) => { if (e.key === 'Enter') setSel(p); }}>
                      <div class="crow">
                        <span class="ctag">${p.vertical}</span>
                        <span class="spacer"></span>
                        <span class=${'pill ' + scoreClass(p.opportunity_score || 0)} title="Opportunity score">${p.opportunity_score || '?'}</span>
                      </div>
                      <h3>${p.title}</h3>
                      <p class="persona"><${Icon} name="person" /> ${p.persona || '—'}</p>
                      <div class="cfoot">
                        <div class="cmoney">
                          ${p.current_wtp_usd_month
                            ? html`<span class="cmoney-v">$${fmtNum(p.current_wtp_usd_month)}<span class="cmoney-u">/mo</span></span><span class="cmoney-l">they pay today</span>`
                            : html`<span class="cmoney-v">${fmtNum(p.tam_firms)}<span class="cmoney-u"> firms</span></span><span class="cmoney-l">market size</span>`}
                        </div>
                        <span class="spacer"></span>
                        ${v
                          ? html`<span class="cverdict" title="Investor-grade check"><span class=${'vdot ' + (VERDICT_DOT[v.verdict] || '')}></span>${VERDICT_LABEL[v.verdict] || v.verdict}</span>`
                          : (yc && yc.score >= 3 ? html`<span class="cverdict" title="YC service-company fit"><span class="vdot v-violet"></span>YC fit</span>` : '')}
                      </div>
                    </article>`;
                })}
              </div>
              <${Pager} page=${pg} pages=${pages} total=${filtered.length} start=${(pg - 1) * PAGE + 1} end=${Math.min(pg * PAGE, filtered.length)} onGo=${(n) => { setPage(n); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />`}
        </main>
      </div>

      ${sel ? html`<${PainModal} p=${sel} go=${go} onClose=${() => setSel(null)} fav=${favs.includes(sel.id)} onFav=${() => setFavs(store.toggleFav(sel.id))} />` : ''}
    </div>`;
}

function row(label, val) {
  return val == null || val === '' ? '' : html`<tr><th>${label}</th><td>${val}</td></tr>`;
}

function PainModal({ p, go, onClose, fav, onFav }) {
  const v = p.ai_cofounder_validation;
  const chips = (arr) => (arr && arr.length ? html`<div class="chip-row">${arr.map((t) => html`<span class="chip">${t}</span>`)}</div>` : '—');
  const links = (arr) => (arr && arr.length ? arr.map((s) => html`<a href=${s} target="_blank" rel="noopener">${s}</a><br/>`) : '—');
  const risks = Array.isArray(p.kill_risks) ? p.kill_risks : [];
  const prospects = Array.isArray(p.specific_prospects) ? p.specific_prospects : [];
  const quotes = Array.isArray(p.verbatim_quotes) ? p.verbatim_quotes : [];
  const fermi = p.fermi_math_to_50k;
  const isUrl = (u) => /^https?:\/\//i.test(String(u || ''));
  const host = (u) => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch (e) { return u; } };
  const bodyRef = useRef(null);
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow; document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, []);
  const scrollTo = (sec) => {
    const b = document.querySelector('.drawer-body'); if (!b) return;
    const el = b.querySelector('[data-sec="' + sec + '"]'); if (!el) return;
    const top = b.scrollTop + el.getBoundingClientRect().top - b.getBoundingClientRect().top - 8;
    b.scrollTop = top;
  };

  return html`
    <div class="drawer-back" onClick=${(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <aside class="drawer" role="dialog" aria-modal="true" aria-labelledby="pmtitle">
        <div class="drawer-head">
          <div style="min-width:0">
            <div class="eyebrow"><${Icon} name="sell" size="14" /> ${p.vertical}</div>
            <h2 id="pmtitle">${p.title}</h2>
          </div>
          <button class="modal-x" style="position:static" onClick=${onClose} aria-label="Close"><${Icon} name="close" size="20" /></button>
        </div>

        <div class="drawer-body" ref=${bodyRef}>
          ${v ? html`
            <div class=${'memo-verdict ' + ({ 'Strong signal': 't-green', 'Conditional pass': 't-blue', Fragile: 't-amber', Weak: 't-red' }[v.verdict] || 't-blue')}>
              <div class="mv-top">
                <span class="mv-verdict">${VERDICT_LABEL[v.verdict] || v.verdict}</span>
                <span class="spacer"></span>
                ${v.raw_total ? html`<span class="mv-score">Investor read · ${v.raw_total}/${v.max_possible}</span>` : ''}
              </div>
              ${v.verdict_rationale ? html`<p class="mv-reason">${v.verdict_rationale}</p>` : ''}
            </div>` : ''}

          <div class="snap">
            <div class="snapbox"><div class="snap-v">${p.pain_severity || '?'}<span class="snap-u">/10</span></div><div class="snap-l">Pain</div></div>
            <div class="snapbox"><div class="snap-v">${p.current_wtp_usd_month ? '$' + fmtNum(p.current_wtp_usd_month) : '—'}<span class="snap-u">${p.current_wtp_usd_month ? '/mo' : ''}</span></div><div class="snap-l">They pay</div></div>
            <div class="snapbox"><div class="snap-v">${fmtNum(p.tam_firms)}</div><div class="snap-l">Companies</div></div>
            <div class="snapbox"><div class="snap-v">${p.opportunity_score || '?'}<span class="snap-u">/100</span></div><div class="snap-l">Score</div></div>
          </div>

          <div class="dgroup memo-panel memo-opportunity">
            <div class="dlabel"><${Icon} name="lightbulb" size="20" /> The opportunity</div>
            ${p.persona ? html`<div class="mline"><span class="mk">Who</span><span class="mv">${p.persona}</span></div>` : ''}
            ${p.pain_description ? html`<div class="mline mline-strong"><span class="mk">Pain</span><span class="mv">${p.pain_description}</span></div>` : ''}
            ${(p.incumbent_tools && p.incumbent_tools.length) || p.incumbent_gap ? html`<div class="mline"><span class="mk">Gap</span><span class="mv">${p.incumbent_tools && p.incumbent_tools.length ? p.incumbent_tools.join(', ') + ' — ' : ''}${p.incumbent_gap || ''}</span></div>` : ''}
            ${p.santifer_pattern ? html`<div class="mline"><span class="mk">Play</span><span class="mv">${p.santifer_pattern}</span></div>` : ''}
            ${p.why_now ? html`<div class="mline"><span class="mk">Why now</span><span class="mv">${p.why_now}</span></div>` : ''}
            ${p.reference_build ? html`<div class="mline"><span class="mk">Live</span><span class="mv">${isUrl(p.reference_build) ? html`<a href=${p.reference_build} target="_blank" rel="noopener">${host(p.reference_build)}</a>` : p.reference_build}</span></div>` : ''}
          </div>

          ${fermi ? html`<div class="dgroup memo-panel memo-panel-green">
            <div class="dlabel">The math · path to $50k/mo</div>
            <div class="mstats">
              <div><b>${fmtNum(fermi.reachable_som_firms)}</b><span>reachable Y1</span></div>
              <div><b>${fmtMoney(fermi.anchor_price_usd_month)}/mo</b><span>anchor price</span></div>
              <div><b>${fmtNum(fermi.paying_customers_for_50k)}</b><span>customers to $50k</span></div>
              <div><b>${fermi.months_to_50k_at_realistic_pace ? '~' + fermi.months_to_50k_at_realistic_pace + ' mo' : '—'}</b><span>realistic ramp</span></div>
            </div>
            ${fermi.notes ? html`<p class="mnote" title=${fermi.notes}>${fermi.notes}</p>` : ''}
          </div>` : ''}

          ${prospects.length ? html`<div class="dgroup memo-panel">
            <div class="dlabel"><${Icon} name="person" size="20" /> Who to reach now</div>
            ${prospects.map((pr) => html`<div class="mreach" title=${pr.why_reachable || ''}>
              ${pr.url ? html`<a href=${pr.url} target="_blank" rel="noopener">${pr.name}</a>` : html`<b>${pr.name}</b>`}
              <span class="dchip">${(pr.type || '').replace(/_/g, ' ')}</span>
              ${pr.signal_size ? html`<span class="msig">${pr.signal_size}</span>` : ''}
            </div>`)}
          </div>` : ''}

          ${risks.length ? html`<div class="dgroup memo-panel">
            <div class="dlabel"><${Icon} name="warning" size="20" /> What could kill it</div>
            ${risks.map((r) => html`<div class="mrisk" title=${r.current_status || ''}>
              <span class=${'rdot ' + (r.severity || '')}></span>
              <span class="mv">${r.risk}</span>
            </div>`)}
          </div>` : ''}

          ${quotes.length ? html`<div class="dgroup memo-panel">
            <div class="dlabel"><${Icon} name="article" size="20" /> From the field</div>
            ${quotes.map((qq) => html`<blockquote class="mquote">"${qq.quote}"<cite>${[qq.source_label, qq.author_handle, qq.date].filter(Boolean).join(' · ')}${qq.source_url ? html` · <a href=${qq.source_url} target="_blank" rel="noopener">source</a>` : ''}</cite></blockquote>`)}
          </div>` : ''}

          ${(v && v.riskiest_assumptions && v.riskiest_assumptions.length) || (p.sources && p.sources.length) || (p.tags && p.tags.length) ? html`<div class="dgroup memo-panel">
            <div class="dlabel"><${Icon} name="fact_check" size="20" /> Before you commit</div>
            ${v && v.riskiest_assumptions && v.riskiest_assumptions.length ? html`<ul class="mlist">${v.riskiest_assumptions.map((r) => html`<li>${r}</li>`)}</ul>` : ''}
            ${p.sources && p.sources.length ? html`<div class="dsources" style="margin-top:12px">${p.sources.map((s) => html`<a href=${s} target="_blank" rel="noopener"><${Icon} name="link" size="14" /> ${host(s)}</a>`)}</div>` : ''}
            ${p.tags && p.tags.length ? html`<div class="dchips" style="margin-top:10px">${p.tags.map((t) => html`<span class="dchip">${t}</span>`)}</div>` : ''}
          </div>` : ''}
        </div>
        <div class="drawer-foot">
          <button class="btn btn-ghost" onClick=${onFav}><${Icon} name=${fav ? 'bookmark' : 'bookmark_border'} size="18" /> ${fav ? 'Saved' : 'Save'}</button>
          <span class="spacer"></span>
          <button class="btn btn-accent" onClick=${() => { onClose(); go('stack', { pain: p }); }}><${Icon} name="lan" size="18" /> Pick a stack</button>
          <button class="btn btn-primary" onClick=${() => { onClose(); go('prd', { pain: p }); }}><${Icon} name="description" size="18" /> Write a PRD</button>
        </div>
      </aside>
    </div>`;
}
