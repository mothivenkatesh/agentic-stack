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
    document.body.classList.add('modal-open');
    const id = setTimeout(() => taRef.current && taRef.current.focus(), 50);
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    setStatus('idle'); setErrMsg('');
    return () => { document.body.classList.remove('modal-open'); window.removeEventListener('keydown', onKey); clearTimeout(id); };
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
      <div class="modal modal-sm" role="dialog" aria-modal="true" aria-labelledby="fb-title">
        <div class="modal-head">
          <h2 id="fb-title">Share feedback</h2>
          <button class="modal-x modal-x-inline" onClick=${onClose} aria-label="Close"><${Icon} name="close" size="20" /></button>
        </div>
        ${status === 'sent' ? html`
          <div class="modal-done">
            <div class="dt">Thanks.</div>
            <p class="muted">${ENDPOINT ? 'Got it. I read every one.' : 'Your mail client should have opened. If not, write to ' + FALLBACK_EMAIL + '.'}</p>
            <button class="btn btn-ghost btn-sm" onClick=${onClose}>Close</button>
          </div>`
        : html`
          <form onSubmit=${submit} class="modal-form">
            <input type="text" tabIndex=${-1} autocomplete="off" value=${honeypot} onInput=${(e) => setHoneypot(e.target.value)} class="honeypot" aria-hidden="true" />
            <div class="field">
              <label class="label">What's working? What's broken? What's missing?</label>
              <textarea ref=${taRef} class="input ta-noresize" rows="6" maxlength=${MAX_LEN + 50} value=${body} onInput=${(e) => setBody(e.target.value)} placeholder="Be specific. The page, what you tried, what you expected, what happened."></textarea>
              <div class="fb-count"><span class=${'fb-cap' + (remaining < 0 ? ' over' : '')}>${remaining} chars left</span></div>
            </div>
            <div class="field">
              <label class="label">Email <span class="muted label-opt">— optional, so Mothi can reply</span></label>
              <input class="input" type="email" value=${email} onInput=${(e) => setEmail(e.target.value)} placeholder="you@company.com" />
            </div>
            <div class="muted fb-ctx">Auto-captured: ${ctx.path} · ${ctx.viewport}</div>
            ${errMsg ? html`<div class="banner banner-amber banner-sm"><${Icon} name="warning" size="16" /> <div>${errMsg}</div></div>` : ''}
            <div class="u-end">
              <button type="button" class="btn btn-ghost btn-sm" onClick=${onClose}>Cancel</button>
              <button type="submit" class="btn btn-accent btn-sm" disabled=${status === 'sending' || !body.trim()}>${status === 'sending' ? 'Sending…' : 'Send feedback'}</button>
            </div>
          </form>`}
      </div>
    </div>`;
}
