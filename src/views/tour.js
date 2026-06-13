import { html, Icon, useState, useEffect, useLayoutEffect, useRef } from '../ui.js';

// Spotlight-anchored guided tour, ported from india-payments-dashboard WelcomeTour.
const STEPS = [
  { eyebrow: 'Welcome', title: 'The product you keep meaning to build is in here', next: 'Show me',
    body: 'You have lost late nights to idea lists that lead nowhere. This is different. A thousand real pains, with real people, real money, and tools that are failing them right now. Give it sixty seconds and you could walk away with the one.',
    bullets: ['Free to explore. No sign-up, no catch.', 'Back / Next below. Esc whenever you like.'] },
  { eyebrow: 'Build from demand', title: 'Never pour months into something nobody wants again', next: 'I want this',
    body: 'Every screen opens with the truth in a single line: who hurts, how badly, and what they already pay to make it stop. The guessing is over. You are choosing from problems the market has already validated for you.',
    target: '[data-tour="narrative-hero"]', placement: 'bottom' },
  { eyebrow: 'The path', title: 'From a quiet idea to a real spec, before your coffee cools', next: 'Show me the path',
    body: 'Pick a pain. Choose the stack that fits. Watch an eval-gated PRD write itself, ready for you or your team to build. Each step hands its work to the next, so you keep moving instead of stalling out.',
    target: '[data-tour="sidebar-nav"]', placement: 'right' },
  { eyebrow: 'Just start', title: 'You will never feel ready. Click anyway.', next: 'One more thing',
    body: 'These cards open a real example, already loaded and running. One click and you will watch a painful, profitable problem turn into a plan. That small spark is exactly how every product you admire began.',
    target: '[data-tour="templates"]', placement: 'top' },
  { eyebrow: 'Now go build it', title: 'Idea lists never changed a life. Shipped products do.', cta: 'Browse 1,000 pains', go: 'pains',
    body: 'The spec is the easy part. Everything you want is on the other side of actually building it. Pick one pain today, draft the PRD, and put a dent in it this week. Future-you is quietly begging you to start now.',
    bullets: ['Open a pain, pick a stack, write the PRD.', 'Re-open this tour or send feedback any time.'],
    target: '[data-tour="sidebar-footer"]', placement: 'right' },
];

function getRect(sel) {
  if (!sel) return null;
  const el = document.querySelector(sel);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { top: r.top, left: r.left, width: r.width, height: r.height };
}

export function WelcomeTour({ open, onClose }) {
  const [idx, setIdx] = useState(0);
  const [rect, setRect] = useState(null);

  useEffect(() => { if (open) setIdx(0); }, [open]);

  useEffect(() => {
    if (!open) return;
    const step = STEPS[idx];
    if (!step.target) { setRect(null); return; }
    const el = document.querySelector(step.target);
    if (!el) { setRect(null); return; }
    el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
    const id = window.setTimeout(() => setRect(getRect(step.target)), 420);
    return () => window.clearTimeout(id);
  }, [open, idx]);

  useLayoutEffect(() => {
    if (!open) return;
    const step = STEPS[idx];
    if (!step.target) return;
    const tick = () => setRect(getRect(step.target));
    window.addEventListener('resize', tick);
    window.addEventListener('scroll', tick, { capture: true });
    return () => { window.removeEventListener('resize', tick); window.removeEventListener('scroll', tick, { capture: true }); };
  }, [open, idx]);

  useEffect(() => {
    if (!open) return;
    document.body.classList.add('modal-open');
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') setIdx((i) => Math.min(STEPS.length - 1, i + 1));
      if (e.key === 'ArrowLeft') setIdx((i) => Math.max(0, i - 1));
    };
    window.addEventListener('keydown', onKey);
    return () => { document.body.classList.remove('modal-open'); window.removeEventListener('keydown', onKey); };
  }, [open, onClose]);

  if (!open) return null;
  const step = STEPS[idx];
  const isLast = idx === STEPS.length - 1;
  const isFirst = idx === 0;
  const hasTarget = !!step.target && !!rect;

  const TIP_W = 360, GAP = 16;
  let tipStyle = {}, arrowSide = 'top';
  if (hasTarget && rect) {
    const winW = innerWidth, winH = innerHeight;
    const roomBelow = winH - (rect.top + rect.height), roomAbove = rect.top, roomRight = winW - (rect.left + rect.width);
    let place = step.placement || 'auto';
    if (place === 'auto') place = roomBelow > 240 ? 'bottom' : roomAbove > 240 ? 'top' : roomRight > TIP_W + 40 ? 'right' : 'left';
    arrowSide = place === 'bottom' ? 'top' : place === 'top' ? 'bottom' : place === 'right' ? 'left' : 'right';
    if (place === 'bottom') tipStyle = { top: rect.top + rect.height + GAP, left: Math.max(16, Math.min(winW - TIP_W - 16, rect.left + rect.width / 2 - TIP_W / 2)) };
    else if (place === 'top') tipStyle = { bottom: winH - rect.top + GAP, left: Math.max(16, Math.min(winW - TIP_W - 16, rect.left + rect.width / 2 - TIP_W / 2)) };
    else if (place === 'right') tipStyle = { left: rect.left + rect.width + GAP, top: Math.max(16, Math.min(winH - 280, rect.top + rect.height / 2 - 140)) };
    else tipStyle = { right: winW - rect.left + GAP, top: Math.max(16, Math.min(winH - 280, rect.top + rect.height / 2 - 140)) };
  }

  const card = html`
    <div style=${/* one-ui-allow: tooltip position measured from the target rect */ hasTarget ? { position: 'fixed', width: TIP_W + 'px', ...tipStyle } : { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '420px', maxWidth: '90vw' }}>
      ${hasTarget ? html`<span aria-hidden="true" style=${/* one-ui-allow: arrow offset from the computed placement side */ {
        position: 'absolute', width: '12px', height: '12px', background: '#fff', borderTop: '1px solid var(--outline-gray-2)', borderLeft: '1px solid var(--outline-gray-2)', zIndex: -1,
        ...(arrowSide === 'top' ? { top: '-6px', left: '50%', transform: 'translateX(-50%) rotate(45deg)' } : {}),
        ...(arrowSide === 'bottom' ? { bottom: '-6px', left: '50%', transform: 'translateX(-50%) rotate(45deg)' } : {}),
        ...(arrowSide === 'left' ? { left: '-6px', top: '50%', transform: 'translateY(-50%) rotate(45deg)' } : {}),
        ...(arrowSide === 'right' ? { right: '-6px', top: '50%', transform: 'translateY(-50%) rotate(45deg)' } : {}),
      }}></span>` : ''}
      <div class="tour-card">
        <div class="tour-head">
          <div class="u-row-tight">
            <span class="mono tour-step">${idx + 1} / ${STEPS.length}</span>
            <div class="tour-dots">${STEPS.map((_, i) => html`<span style=${/* one-ui-allow: step-dot size + active-step color */ { width: '6px', height: '6px', borderRadius: '50%', background: i === idx ? 'var(--brand)' : i < idx ? 'var(--ink-gray-4)' : 'var(--surface-gray-3)' }}></span>`)}</div>
          </div>
          <button class="modal-x tour-x" onClick=${onClose} aria-label="Close tour"><${Icon} name="close" size="18" /></button>
        </div>
        <div class="tour-body">
          <div class="mono tour-eyebrow">${step.eyebrow}</div>
          <h2 class="tour-title">${step.title}</h2>
          <p class="tour-text">${step.body}</p>
          ${step.bullets ? html`<ul class="tour-bullets">
            ${step.bullets.map((b) => html`<li class="tour-bullet"><span class="tour-bdot"></span><span>${b}</span></li>`)}
          </ul>` : ''}
        </div>
        <div class="tour-foot">
          <button class="btn btn-ghost btn-sm btn-bare" onClick=${onClose}>Skip</button>
          <div class="u-row-tight">
            ${!isFirst ? html`<button class="btn btn-ghost btn-sm" onClick=${() => setIdx((i) => Math.max(0, i - 1))}><${Icon} name="arrow_back" size="16" /> Back</button>` : ''}
            <button class="btn btn-accent btn-sm" onClick=${() => { if (isLast) { onClose(); if (step.go) location.hash = '#/' + step.go; } else setIdx((i) => Math.min(STEPS.length - 1, i + 1)); }}>${isLast ? (step.cta || 'Got it') : (step.next || 'Next')}</button>
          </div>
        </div>
      </div>
    </div>`;

  return html`
    <div class="tour-root" role="dialog" aria-modal="true" aria-labelledby="tour-title">
      ${hasTarget && rect
        ? html`<div aria-hidden="true" onClick=${onClose} style=${/* one-ui-allow: spotlight box measured from the target rect */ { position: 'fixed', top: (rect.top - 6) + 'px', left: (rect.left - 6) + 'px', width: (rect.width + 12) + 'px', height: (rect.height + 12) + 'px', boxShadow: '0 0 0 9999px rgba(15,23,42,.55)', borderRadius: '10px', border: '2px solid var(--brand)', pointerEvents: 'auto', transition: 'all .25s ease' }}></div>`
        : html`<div aria-hidden="true" onClick=${onClose} class="tour-backdrop"></div>`}
      ${card}
    </div>`;
}
