import { html, Icon, copyText, useState, useEffect, useRef } from '../ui.js';
import { store } from '../auth.js';
import { marked } from 'https://esm.sh/marked@14';
import { SYSTEM, buildUserMessage } from '../prdPrompt.js';
import { SAMPLE_PRD, SAMPLE_PAIN } from '../sampleprd.js';

const API = location.protocol === 'file:' ? 'http://localhost:3000' : '';

// Server path: streams from /api/prd (when deployed with ANTHROPIC_API_KEY).
async function genServer(payload, signal, onText) {
  const res = await fetch(API + '/api/prd', { method: 'POST', headers: { 'content-type': 'application/json' }, signal, body: JSON.stringify(payload) });
  const ct = res.headers.get('content-type') || '';
  if (!res.ok || ct.includes('application/json')) {
    let reason = 'no-llm';
    try { const j = await res.json(); reason = j.reason || reason; } catch (e) {}
    throw new Error(reason === 'no-llm' ? 'no-llm' : 'Server error (' + reason + ')');
  }
  const reader = res.body.getReader(); const dec = new TextDecoder(); let acc = '';
  for (;;) { const { done, value } = await reader.read(); if (done) break; acc += dec.decode(value, { stream: true }); onText(acc); }
}

// BYOK path: calls Anthropic directly from the browser with the user's key.
async function genBrowser(key, payload, signal, onText) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST', signal,
    headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
    body: JSON.stringify({ model: store.model() || 'claude-opus-4-8', max_tokens: 8000, stream: true, thinking: { type: 'adaptive' }, output_config: { effort: 'medium' }, system: SYSTEM, messages: [{ role: 'user', content: buildUserMessage(payload) }] }),
  });
  if (!res.ok) {
    let msg = 'Request failed (' + res.status + ')';
    try { const j = await res.json(); if (j && j.error && j.error.message) msg = j.error.message; } catch (e) {}
    if (res.status === 401) msg = 'Your Anthropic API key was rejected. Update it in API key settings.';
    throw new Error(msg);
  }
  const reader = res.body.getReader(); const dec = new TextDecoder(); let buf = '', acc = '';
  for (;;) {
    const { done, value } = await reader.read(); if (done) break;
    buf += dec.decode(value, { stream: true });
    const blocks = buf.split('\n\n'); buf = blocks.pop();
    for (const block of blocks) {
      let data = null;
      for (const ln of block.split('\n')) { if (ln.startsWith('data:')) data = ln.slice(5).trim(); }
      if (!data || data === '[DONE]') continue;
      try { const j = JSON.parse(data); if (j.type === 'content_block_delta' && j.delta && j.delta.type === 'text_delta') { acc += j.delta.text; onText(acc); } } catch (e) {}
    }
  }
}

// The 15 sections the generator produces (also the no-key fallback outline).
const SECTIONS = [
  'Problem, goal, non-goals, users', 'Why an agent (autonomy + build mode)',
  'Agent type & topology', 'Architecture & component blueprint', 'Capabilities, scope & non-goals',
  'Tools, integrations & data access', 'Memory & context strategy ★', 'Success metrics & eval plan ★',
  'Autonomy boundaries & HITL ★', 'Trust, safety, security & compliance', 'Reliability, latency & failure ★',
  'Model strategy & unit economics', 'Observability, ops & rollout', 'Self-improvement / learning loop ★',
  'Risks, dependencies & open questions',
];

function seedPrompt(p) {
  if (!p) return '';
  return [
    `Build an agent for: ${p.title}.`,
    p.persona ? `Who hurts: ${p.persona}.` : '',
    p.pain_description ? `The pain: ${p.pain_description}` : '',
    p.incumbent_gap ? `What today's tools miss: ${p.incumbent_gap}` : '',
  ].filter(Boolean).join('\n');
}

export function PRD({ seed, onAddKey }) {
  const [pain, setPain] = useState(null);
  const [stack, setStack] = useState(null);
  const [usePain, setUsePain] = useState(true);
  const [useStack, setUseStack] = useState(true);
  const [title, setTitle] = useState('');
  const [prompt, setPrompt] = useState('');
  const [md, setMd] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState('');
  const [noKey, setNoKey] = useState(false);
  const [raw, setRaw] = useState(false);
  const [saved, setSaved] = useState('');
  const abortRef = useRef(null);
  const resultRef = useRef(null);

  useEffect(() => {
    if (!seed || seed.view !== 'prd') return;
    const p = seed.payload || {};
    if (p.draftId) {
      const d = store.prds().find((x) => x.id === p.draftId);
      if (d) { setMd(d.markdown || ''); setTitle(d.title || ''); setDone(true); return; }
    }
    if (p.pain) { setPain(p.pain); setTitle((p.pain.title || '') + ' agent'); setPrompt(seedPrompt(p.pain)); }
    if (p.stack) setStack(p.stack);
  }, [seed]);

  async function generate() {
    setBusy(true); setErr(''); setNoKey(false); setDone(false); setMd(''); setRaw(false);
    const ctrl = new AbortController(); abortRef.current = ctrl;
    setTimeout(() => { try { if (window.innerWidth < 920 && resultRef.current) resultRef.current.scrollIntoView({ block: 'start' }); } catch (e) {} }, 60);
    const payload = { prompt, title, pain: usePain ? pain : null, stack: useStack ? stack : null };
    const key = store.apiKey();
    try {
      if (key) await genBrowser(key, payload, ctrl.signal, setMd);
      else await genServer(payload, ctrl.signal, setMd);
      setDone(true);
    } catch (e) {
      if (e && e.name === 'AbortError') { /* user stopped */ }
      else if (e && e.message === 'no-llm') setNoKey(true);
      else setErr((e && e.message) || 'Generation failed.');
    } finally {
      setBusy(false); abortRef.current = null;
    }
  }
  function stop() { if (abortRef.current) abortRef.current.abort(); setBusy(false); }
  function save() {
    if (!md) return;
    const id = 'prd_' + Math.abs(hashStr((title || '') + md.length + md.slice(0, 40))).toString(36);
    store.savePRD({ id, title: title || 'Untitled PRD', painId: pain ? pain.id : null, markdown: md, data: { prompt } });
    setSaved('Saved locally'); setTimeout(() => setSaved(''), 1600);
  }
  function download() {
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = (title || 'agent-prd').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-prd.md';
    a.click(); URL.revokeObjectURL(url);
  }

  const canGen = !busy && (prompt.trim() || (usePain && pain));

  return html`
    <div class="view">
      <div class="page-hero" data-tour="narrative-hero">
        <div>
          <div class="page-kicker">PRD builder</div>
          <h1>Turn the opportunity into an eval-gated agent PRD.</h1>
          <p>Describe the agent, include the pain and stack context when available, then generate the sections that usually decide whether an agent ships.</p>
        </div>
        <div class="hero-stats">
          <div class="hero-stat"><b>${pain ? 'Pain' : 'Open'}</b><span>context</span></div>
          <div class="hero-stat"><b>${stack ? 'Stack' : 'Any'}</b><span>architecture</span></div>
          <div class="hero-stat"><b>${md ? 'Draft' : 'Sample'}</b><span>preview</span></div>
        </div>
      </div>

      <div class="prd-split">
        <!-- prompt box -->
        <div class="prd-form-col">
          <div class="field">
            <label class="label">Agent name</label>
            <input class="input" placeholder="e.g. Repair-shop quote-to-invoice agent" value=${title} onInput=${(e) => setTitle(e.target.value)} />
          </div>
          <div class="field">
            <label class="label">Describe what the agent should do</label>
            <textarea class="input input-tall" placeholder="Who it's for, the job it does, the systems it touches, and what 'done' looks like…" value=${prompt} onInput=${(e) => setPrompt(e.target.value)}></textarea>
            <div class="hint">The more concrete the pain and the workflow, the sharper the PRD.</div>
          </div>

          ${(pain || stack) ? html`
            <div class="field">
              <label class="label">Context to include</label>
              <div class="prd-row">
                ${pain ? html`<button class=${'ctxchip' + (usePain ? ' on' : '')} onClick=${() => setUsePain(!usePain)}><${Icon} name=${usePain ? 'check_circle' : 'circle'} /> ${pain.id} · ${pain.title.slice(0, 28)}</button>` : ''}
                ${stack ? html`<button class=${'ctxchip' + (useStack ? ' on' : '')} onClick=${() => setUseStack(!useStack)}><${Icon} name=${useStack ? 'check_circle' : 'circle'} /> Stack: ${stack.builder.name}</button>` : ''}
              </div>
            </div>` : ''}

          <div class="prd-actions">
            ${busy
              ? html`<button class="btn btn-ghost" onClick=${stop}><${Icon} name="stop" size="18" /> Stop</button>`
              : html`<button class="btn btn-accent btn-lg" disabled=${!canGen} onClick=${generate}><${Icon} name="auto_awesome" size="20" /> ${md ? 'Regenerate' : 'Generate PRD'}</button>`}
            ${busy ? html`<span class="muted prd-busy">Generating…</span>` : ''}
          </div>
          ${err ? html`<div class="banner banner-amber mt-14"><${Icon} name="warning" /> <div>${err}</div></div>` : ''}
        </div>

        <!-- result -->
        <div class="prd-result-col" ref=${resultRef}>
          ${md ? html`
            <div class="prd-resulthead">
              <div class="seg">
                <button class=${!raw ? 'active' : ''} onClick=${() => setRaw(false)}><${Icon} name="article" size="18" /> Rendered</button>
                <button class=${raw ? 'active' : ''} onClick=${() => setRaw(true)}><${Icon} name="code" size="18" /> Markdown</button>
              </div>
              <span class="spacer"></span>
              <button class="btn btn-ghost btn-sm" onClick=${save}><${Icon} name="bookmark" size="18" /> Save</button>
              <button class="btn btn-ghost btn-sm" onClick=${() => copyText(md)}><${Icon} name="content_copy" size="18" /> Copy</button>
              <button class="btn btn-accent btn-sm" disabled=${!done} onClick=${download}><${Icon} name="download" size="18" /> Download</button>
              ${saved ? html`<span class="pill pill-green"><${Icon} name="check" /> ${saved}</span>` : ''}
            </div>
            <div class="prd-result">
              ${raw
                ? html`<pre class="prose prd-md">${md}</pre>`
                : html`<div class=${'prose' + (busy ? ' prd-cursor' : '')} dangerouslySetInnerHTML=${{ __html: marked.parse(md) }}></div>`}
            </div>`
          : html`
            ${noKey ? html`<div class="banner banner-amber mb-12"><${Icon} name="key" /><div>Add your Anthropic key to generate your own. It stays in your browser and goes straight to Claude. Here is a real sample meanwhile.</div></div>` : ''}
            <div class="sample-head">
              <span class="pill pill-amber">Sample</span>
              <span class="muted prd-samplenote">A real PRD this tool wrote for <b>${SAMPLE_PAIN}</b>. Yours appears here when you hit Generate.</span>
              ${!store.hasKey() ? html`<button class="btn btn-accent btn-sm" onClick=${onAddKey}><${Icon} name="key" size="18" /> Add your key</button>` : ''}
            </div>
            <div class="prd-result">
              <div class="prose" dangerouslySetInnerHTML=${{ __html: marked.parse(SAMPLE_PRD) }}></div>
            </div>`}
        </div>
      </div>
    </div>`;
}

function hashStr(s) { let h = 0; for (let i = 0; i < s.length; i++) { h = (h << 5) - h + s.charCodeAt(i); h |= 0; } return h; }
