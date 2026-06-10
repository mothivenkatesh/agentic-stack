import { html, Icon, useState, useEffect, useRef } from '../ui.js';

// Ported from india-payments-dashboard. Swap ENDPOINT for Formspree/Web3Forms when ready.
const ENDPOINT = null;
const FALLBACK_EMAIL = 'mothi.venkatesh@cashfree.com';
const MAX_LEN = 2000;

export function FeedbackModal({ open, onClose }) {
  const [body, setBody] = useState('');
  const [email, setEmail] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [status, setStatus] = useState('idle');
  const [errMsg, setErrMsg] = useState('');
  const taRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const id = setTimeout(() => taRef.current && taRef.current.focus(), 50);
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    setStatus('idle'); setErrMsg('');
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey); clearTimeout(id); };
  }, [open]);

  if (!open) return null;

  const ctx = {
    path: location.hash || location.pathname,
    viewport: `${window.innerWidth}×${window.innerHeight}`,
    when: new Date().toISOString(),
  };
  const remaining = MAX_LEN - body.length;

  async function submit(e) {
    e.preventDefault();
    if (honeypot) return;
    const trimmed = body.trim();
    if (!trimmed) { setErrMsg('Feedback is empty.'); return; }
    if (trimmed.length > MAX_LEN) { setErrMsg(`Keep it under ${MAX_LEN} characters.`); return; }
    setStatus('sending'); setErrMsg('');
    const payload = { message: trimmed, email: email.trim() || null, ...ctx, app: 'agentic-stack' };
    if (ENDPOINT) {
      try {
        const r = await fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(payload) });
        if (!r.ok) throw new Error('HTTP ' + r.status);
        setStatus('sent'); setBody(''); setEmail('');
      } catch (err) { setStatus('error'); setErrMsg(err && err.message ? err.message : 'Network error.'); }
      return;
    }
    const subject = `Agentic Stack feedback · ${ctx.path}`;
    const lines = [trimmed, '', '---', `Page: ${ctx.path}`, `Viewport: ${ctx.viewport}`, `When: ${ctx.when}`, email ? `From: ${email}` : ''].filter(Boolean).join('\n');
    location.href = `mailto:${FALLBACK_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines)}`;
    setStatus('sent');
  }

  return html`
    <div class="modal-back" onClick=${(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div class="modal" style="max-width:520px;padding:0" role="dialog" aria-modal="true" aria-labelledby="fb-title">
        <div style="display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid var(--outline-gray-1)">
          <h2 id="fb-title" style="font-size:15px;font-weight:600;margin:0">Share feedback</h2>
          <button class="modal-x" style="position:static" onClick=${onClose} aria-label="Close"><${Icon} name="close" size="20" /></button>
        </div>
        ${status === 'sent' ? html`
          <div style="padding:32px 20px;text-align:center">
            <div style="font-size:14px;font-weight:600;margin-bottom:4px">Thanks.</div>
            <p class="muted" style="font-size:12.5px;margin-bottom:18px">${ENDPOINT ? 'Got it. I read every one.' : 'Your mail client should have opened. If not, write to ' + FALLBACK_EMAIL + '.'}</p>
            <button class="btn btn-ghost btn-sm" onClick=${onClose}>Close</button>
          </div>`
        : html`
          <form onSubmit=${submit} style="padding:20px;display:flex;flex-direction:column;gap:14px">
            <input type="text" tabIndex=${-1} autocomplete="off" value=${honeypot} onInput=${(e) => setHoneypot(e.target.value)} style="position:absolute;left:-9999px;width:1px;height:1px" aria-hidden="true" />
            <div class="field" style="margin:0">
              <label class="label">What's working? What's broken? What's missing?</label>
              <textarea ref=${taRef} class="input" rows="6" maxlength=${MAX_LEN + 50} value=${body} onInput=${(e) => setBody(e.target.value)} placeholder="Be specific. The page, what you tried, what you expected, what happened." style="resize:none"></textarea>
              <div style="text-align:right;margin-top:4px"><span class=${'text-2xs ' + (remaining < 0 ? '' : '')} style=${'font-size:11px;color:' + (remaining < 0 ? 'var(--ink-red-3)' : 'var(--ink-gray-5)')}>${remaining} chars left</span></div>
            </div>
            <div class="field" style="margin:0">
              <label class="label">Email <span class="muted" style="font-weight:400">— optional, so Mothi can reply</span></label>
              <input class="input" type="email" value=${email} onInput=${(e) => setEmail(e.target.value)} placeholder="you@company.com" />
            </div>
            <div class="muted" style="font-size:11px;font-style:italic">Auto-captured: ${ctx.path} · ${ctx.viewport}</div>
            ${errMsg ? html`<div class="banner banner-amber" style="font-size:12px;padding:8px 12px;margin:0"><${Icon} name="warning" size="16" /> <div>${errMsg}</div></div>` : ''}
            <div style="display:flex;justify-content:flex-end;gap:8px">
              <button type="button" class="btn btn-ghost btn-sm" onClick=${onClose}>Cancel</button>
              <button type="submit" class="btn btn-accent btn-sm" disabled=${status === 'sending' || !body.trim()}>${status === 'sending' ? 'Sending…' : 'Send feedback'}</button>
            </div>
          </form>`}
      </div>
    </div>`;
}
