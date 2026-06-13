import { html, Icon, clsx, useState, useEffect, useMemo } from '../ui.js';
import { loadStackRules } from '../data.js';
import { recommend } from '../stackLogic.js';

const NODE_META = {
  builder: {
    type: 'Trigger',
    icon: 'bolt',
    tone: 'input',
    helper: 'Start from the work pattern before choosing tools.',
  },
  actions: {
    type: 'Intent',
    icon: 'fact_check',
    tone: 'input',
    helper: 'Clarify whether the journey reads, writes, or takes action.',
  },
  bar: {
    type: 'Risk',
    icon: 'warning',
    tone: 'branch',
    helper: 'This controls how much guardrail and review the stack needs.',
  },
  multi: {
    type: 'Branch',
    icon: 'lan',
    tone: 'branch',
    helper: 'Decide whether this is one worker, a team, or orchestration.',
  },
  control: {
    type: 'Control',
    icon: 'verified',
    tone: 'function',
    helper: 'Map how deterministic the path needs to be.',
  },
  durability: {
    type: 'State',
    icon: 'memory',
    tone: 'function',
    helper: 'Persistence, retries, and auditability live here.',
  },
  output: {
    type: 'Output',
    icon: 'description',
    tone: 'output',
    helper: 'Shape the handoff into a recommendation and PRD-ready spec.',
  },
};

const fallbackMeta = {
  type: 'Checkpoint',
  icon: 'circle',
  tone: 'neutral',
  helper: 'Answer this checkpoint to keep the journey moving.',
};

const getMeta = (id) => NODE_META[id] || fallbackMeta;

export function Stack({ go, seed }) {
  const [rules, setRules] = useState(null);
  const [a, setA] = useState({});
  const [result, setResult] = useState(null);
  const [pain, setPain] = useState(null);
  const [activeId, setActiveId] = useState(null);

  useEffect(() => { loadStackRules().then(setRules); }, []);
  useEffect(() => { if (seed && seed.view === 'stack' && seed.payload?.pain) setPain(seed.payload.pain); }, [seed]);

  const answered = rules ? Object.keys(a).length : 0;
  const total = rules ? rules.questions.length : 0;
  const done = total > 0 && answered === total;
  const left = total - answered;

  const firstOpen = useMemo(() => {
    if (!rules) return null;
    return rules.questions.find((q) => !a[q.id]) || rules.questions[0] || null;
  }, [rules, a]);
  const activeQuestion = useMemo(() => {
    if (!rules) return null;
    return rules.questions.find((q) => q.id === activeId) || firstOpen;
  }, [rules, activeId, firstOpen]);
  const activeIndex = rules && activeQuestion ? rules.questions.findIndex((q) => q.id === activeQuestion.id) : -1;
  const selectedAnswer = activeQuestion ? activeQuestion.options.find((o) => o.value === a[activeQuestion.id]) : null;

  if (!rules) return html`<div class="view"><div class="banner banner-blue"><${Icon} name="lan" /> Loading the stack picker...</div></div>`;

  const choose = (q, index, value) => {
    const next = { ...a, [q.id]: value };
    setA(next);
    setResult(null);
    const nextQuestion = rules.questions.find((item, i) => i > index && !next[item.id]);
    setActiveId(nextQuestion ? nextQuestion.id : q.id);
  };

  const runRecommendation = () => {
    if (!done) return;
    setResult(recommend(rules, a));
  };

  return html`
    <div class="view view-wide">
      <div class="page-hero builder-hero" data-tour="narrative-hero">
        <div>
          <div class="page-kicker">Stack journey builder</div>
          <h1>${pain ? 'Build the safest stack path for this workflow.' : 'Design the agent journey before picking the tool.'}</h1>
          <p>${pain ? html`Configuring the path for <b>${pain.title}</b>. ` : 'Answer the checkpoints, inspect the flow, then test the recommendation. '}${rules.note}</p>
          <div class="hero-path">
            <span class="ctxchip on"><${Icon} name="verified" /> One UI builder</span>
            <span class="ctxchip"><${Icon} name="fact_check" /> Eval-gated output</span>
            <span class="ctxchip"><${Icon} name="memory" /> Context preserved</span>
          </div>
        </div>
        <div class="hero-stats">
          <div class="hero-stat"><b>${answered}</b><span>answered</span></div>
          <div class="hero-stat"><b>${total}</b><span>nodes</span></div>
          <div class="hero-stat"><b>${done ? 'Ready' : left}</b><span>${done ? 'to recommend' : 'open'}</span></div>
        </div>
      </div>

      <div class="builder-shell" data-tour="stack-builder">
        <aside class="builder-assets" aria-label="Journey assets">
          <div class="builder-panel-title">
            <div class="lead">Domain assets</div>
            <h2>Decision nodes</h2>
            <p>One-click access to the checkpoints that shape the final agent architecture.</p>
          </div>
          <div class="asset-tabs" role="tablist" aria-label="Builder assets">
            <button class="active">Nodes</button>
            <button>Rules</button>
            <button>Tests</button>
          </div>
          <div class="asset-list">
            ${rules.questions.map((q, i) => {
              const meta = getMeta(q.id);
              const isActive = activeQuestion && activeQuestion.id === q.id;
              const isDone = Boolean(a[q.id]);
              return html`
                <button class=${clsx('asset-item', isActive && 'active', isDone && 'done')} onClick=${() => setActiveId(q.id)}>
                  <span class=${clsx('node-glyph', `tone-${meta.tone}`)}><${Icon} name=${meta.icon} /></span>
                  <span class="asset-copy">
                    <b>${meta.type}</b>
                    <span>${i + 1}. ${q.label}</span>
                  </span>
                  <${Icon} name=${isDone ? 'check_circle' : 'circle'} />
                </button>`;
            })}
          </div>
          <div class="builder-trust">
            <${Icon} name="verified" />
            <span>Recommendation stays local to these answers until you write the PRD.</span>
          </div>
        </aside>

        <section class="builder-canvas" aria-label="Architecture journey flow">
          <div class="builder-topline">
            <div>
              <div class="lead">Conversation flow</div>
              <h2>Architecture decision path</h2>
            </div>
            <span class=${clsx('flow-status', done ? 'ready' : 'open')}>
              <${Icon} name=${done ? 'check_circle' : 'warning'} />
              ${done ? 'Flow ready' : `${left} node${left === 1 ? '' : 's'} open`}
            </span>
          </div>

          <div class="steps-bar builder-steps">
            ${rules.questions.map((q, i) => html`<div class=${clsx('stepdot', a[q.id] && 'done', activeIndex === i && 'cur')}></div>`)}
          </div>

          <div class="flow-lane">
            ${rules.questions.map((q, i) => {
              const meta = getMeta(q.id);
              const answer = q.options.find((o) => o.value === a[q.id]);
              const isActive = activeQuestion && activeQuestion.id === q.id;
              const isDone = Boolean(answer);
              return html`
                <button class=${clsx('flow-node', `tone-${meta.tone}`, isActive && 'active', isDone && 'done')} onClick=${() => setActiveId(q.id)}>
                  <span class="flow-node-kicker">
                    <span class="node-index">Q${i + 1}</span>
                    <span>${meta.type}</span>
                  </span>
                  <span class="flow-node-main">
                    <span class="node-icon"><${Icon} name=${meta.icon} /></span>
                    <span class="node-copy">
                      <b>${q.label}</b>
                      <span>${answer ? answer.label : meta.helper}</span>
                    </span>
                  </span>
                  <span class=${clsx('node-status', isDone ? 'ok' : 'warn')}>
                    <${Icon} name=${isDone ? 'check_circle' : 'warning'} />
                    ${isDone ? 'Configured' : 'Needs answer'}
                  </span>
                </button>
                ${i < total - 1 ? html`<div class="flow-link"><${Icon} name="arrow_forward" /></div>` : ''}
              `;
            })}
          </div>
        </section>

        <aside class="builder-inspector" aria-label="Node configuration and testing">
          <div class="builder-panel-title">
            <div class="lead">Configuration and testing</div>
            <h2>${result ? 'Recommended stack' : activeQuestion.label}</h2>
            <p>${result ? 'Review the generated recommendation, then move into PRD writing with the same context.' : getMeta(activeQuestion.id).helper}</p>
          </div>

          ${!result ? html`
            <div class="inspector-section">
              <div class="mini-kv">
                <span>Node type</span><b>${getMeta(activeQuestion.id).type}</b>
                <span>Status</span><b>${selectedAnswer ? 'Configured' : 'Needs answer'}</b>
                <span>Selected</span><b>${selectedAnswer ? selectedAnswer.label : 'None yet'}</b>
              </div>
            </div>

            <div class="option-stack">
              ${activeQuestion.options.map((o) => html`
                <button class=${clsx('opt', a[activeQuestion.id] === o.value && 'on')} onClick=${() => choose(activeQuestion, activeIndex, o.value)}>
                  <${Icon} name=${a[activeQuestion.id] === o.value ? 'radio_button_checked' : 'radio_button_unchecked'} />
                  <span>${o.label}</span>
                </button>`)}
            </div>

            ${activeQuestion.help ? html`<div class="builder-help"><${Icon} name="fact_check" /> ${activeQuestion.help}</div>` : ''}
          ` : html`
            <div class="rec builder-rec">
              <div class="lead">Recommended stack</div>
              <div class="reclayer">
                <span class="pill pill-blue">${result.layer.name}</span>
                <h3>${result.builder.name}</h3>
              </div>
              <p class="rec-copy">${result.builder.oneLiner} <span class="dim">- ${result.builder.license} - ${result.builder.hosting}</span></p>
              <p class="rec-copy">${result.layer.blurb} <a href=${result.builder.url} target="_blank" rel="noopener">${result.builder.name}</a></p>

              <div class="recgrid recgrid-compact">
                <div class="recbox"><div class="rl">Build layer</div><div class="rv">${result.layer.name}</div><div class="rd">${result.layer.whenChoose}</div></div>
                <div class="recbox"><div class="rl">Model</div><div class="rv">${result.model.name}</div><div class="rd">${result.model.desc}</div></div>
                <div class="recbox"><div class="rl">Memory</div><div class="rv">${result.memory.name}</div><div class="rd">${result.memory.desc}</div></div>
                <div class="recbox"><div class="rl">Eval</div><div class="rv">${result.evalApproach.name}</div><div class="rd">${result.evalApproach.desc}</div></div>
              </div>
            </div>
          `}

          <div class="builder-test" aria-label="Builder readiness test">
            <div class="test-head"><${Icon} name="fact_check" /> Live tester</div>
            <div class="test-thread">
              <div class="test-bubble user">Can this workflow ship as a bounded agent?</div>
              <div class="test-bubble system">${done ? 'Yes. The flow has enough context to recommend a layer, builder, model, memory, and eval plan.' : `Not yet. ${left} checkpoint${left === 1 ? '' : 's'} still need answers before the recommendation can run.`}</div>
            </div>
          </div>

          <div class="inspector-actions">
            <button class="btn btn-accent btn-lg btn-block" disabled=${!done} onClick=${runRecommendation}>
              <${Icon} name="auto_awesome" size="20" /> ${result ? 'Refresh recommendation' : 'Recommend my stack'}
            </button>
            ${answered ? html`<button class="btn btn-ghost btn-block" onClick=${() => { setA({}); setResult(null); setActiveId(rules.questions[0].id); }}>Reset journey</button>` : ''}
            ${result ? html`
              <button class="btn btn-primary btn-block" onClick=${() => go('prd', { pain, stack: result })}><${Icon} name="description" size="18" /> Write PRD with this stack</button>
              <a class="btn btn-ghost btn-block" href=${rules.comparisonUrl} target="_blank" rel="noopener"><${Icon} name="open_in_new" size="18" /> Compare all builders</a>
            ` : ''}
          </div>
        </aside>
      </div>
    </div>`;
}
