import { html, Icon, useState, useEffect, useMemo } from '../ui.js';
import { loadStackRules } from '../data.js';
import { recommend } from '../stackLogic.js';

export function Stack({ go, seed }) {
  const [rules, setRules] = useState(null);
  const [a, setA] = useState({});
  const [result, setResult] = useState(null);
  const [pain, setPain] = useState(null);

  useEffect(() => { loadStackRules().then(setRules); }, []);
  useEffect(() => { if (seed && seed.view === 'stack' && seed.payload?.pain) setPain(seed.payload.pain); }, [seed]);

  const answered = rules ? Object.keys(a).length : 0;
  const total = rules ? rules.questions.length : 0;
  const done = total > 0 && answered === total;

  if (!rules) return html`<div class="view"><div class="banner banner-blue"><${Icon} name="lan" /> Loading the stack picker…</div></div>`;

  return html`
    <div class="view">
      <div class="page-hero" data-tour="narrative-hero">
        <div>
          <div class="page-kicker">Stack picker</div>
          <h1>${pain ? 'Choose the simplest stack that can survive this workflow.' : 'Match the agent architecture to the job, not the hype.'}</h1>
          <p>${pain ? html`Picking a stack for <b>${pain.title}</b>. ` : 'Answer seven questions. Choose by layer first, then the tool. '}${rules.note}</p>
        </div>
        <div class="hero-stats">
          <div class="hero-stat"><b>${answered}</b><span>answered</span></div>
          <div class="hero-stat"><b>${total}</b><span>questions</span></div>
          <div class="hero-stat"><b>${done ? 'Ready' : total - answered}</b><span>${done ? 'to recommend' : 'left'}</span></div>
        </div>
      </div>

      <div class="wizard">
        <div class="steps-bar">
          ${rules.questions.map((q, i) => html`<div class=${'stepdot' + (a[q.id] ? ' done' : answered === i ? ' cur' : '')}></div>`)}
        </div>

        ${rules.questions.map((q, i) => html`
          <div class="qcard">
            <div class="qn">Q${i + 1} of ${total}</div>
            <h3>${q.label}</h3>
            ${q.help ? html`<div class="qh">${q.help}</div>` : ''}
            <div class="opts">
              ${q.options.map((o) => html`
                <button class=${'opt' + (a[q.id] === o.value ? ' on' : '')} onClick=${() => { setA({ ...a, [q.id]: o.value }); setResult(null); }}>
                  <${Icon} name=${a[q.id] === o.value ? 'radio_button_checked' : 'radio_button_unchecked'} />
                  <span>${o.label}</span>
                </button>`)}
            </div>
          </div>`)}

        <div style="display:flex;gap:10px;align-items:center;margin:6px 0 20px">
          <button class="btn btn-accent btn-lg" disabled=${!done} onClick=${() => setResult(recommend(rules, a))}>
            <${Icon} name="auto_awesome" size="20" /> Recommend my stack
          </button>
          ${!done ? html`<span class="muted" style="font-size:13px">${total - answered} question${total - answered === 1 ? '' : 's'} left</span>` : ''}
          ${answered ? html`<button class="btn btn-ghost" onClick=${() => { setA({}); setResult(null); }}>Reset</button>` : ''}
        </div>

        ${result ? html`
          <div class="rec">
            <div class="lead">Recommended stack</div>
            <div class="reclayer">
              <span class="pill pill-blue">${result.layer.name}</span>
              <h3 style="font-size:20px">${result.builder.name}</h3>
            </div>
            <p class="muted" style="font-size:13.5px;margin-bottom:4px">${result.builder.oneLiner} <span class="dim">· ${result.builder.license} · ${result.builder.hosting}</span></p>
            <p style="font-size:13.5px;color:var(--ink-gray-7)">${result.layer.blurb} <a href=${result.builder.url} target="_blank" rel="noopener">${result.builder.name} →</a></p>

            <div class="recgrid">
              <div class="recbox"><div class="rl">Build layer</div><div class="rv">${result.layer.name}</div><div class="rd">${result.layer.whenChoose}</div></div>
              <div class="recbox"><div class="rl">Model strategy</div><div class="rv">${result.model.name}</div><div class="rd">${result.model.desc}</div></div>
              <div class="recbox"><div class="rl">Memory</div><div class="rv">${result.memory.name}</div><div class="rd">${result.memory.desc}</div></div>
              <div class="recbox"><div class="rl">Eval</div><div class="rv">${result.evalApproach.name}</div><div class="rd">${result.evalApproach.desc}</div></div>
            </div>

            <p class="muted" style="font-size:12px;margin-top:14px">Grounded in the agent-blueprint defaults: <span class="mono">agent-vs-workflow</span>, <span class="mono">model-and-cost</span>, <span class="mono">memory-spec</span>, <span class="mono">eval-plan</span>. <a onClick=${() => go('skills')} style="cursor:pointer">See the skills →</a></p>

            <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:16px;padding-top:16px;border-top:1px solid var(--outline-gray-1)">
              <button class="btn btn-primary" onClick=${() => go('prd', { pain, stack: result })}><${Icon} name="description" size="18" /> Write the PRD with this stack</button>
              <a class="btn btn-ghost" href=${rules.comparisonUrl} target="_blank" rel="noopener"><${Icon} name="open_in_new" size="18" /> Compare all 9 builders</a>
            </div>
          </div>` : ''}
      </div>
    </div>`;
}
