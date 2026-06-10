// Shared UI primitives. Preact + htm via esm.sh, no build step.
import { h, render } from 'https://esm.sh/preact@10';
import { useState, useEffect, useRef, useMemo, useCallback, useLayoutEffect } from 'https://esm.sh/preact@10/hooks';
import htm from 'https://esm.sh/htm@3';

export const html = htm.bind(h);
export { h, render, useState, useEffect, useRef, useMemo, useCallback, useLayoutEffect };

// Phosphor regular line icons. Existing view names are mapped here so screens stay terse.
const PHOSPHOR_ICON = {
  add: 'plus',
  arrow_back: 'arrow-left',
  arrow_forward: 'arrow-right',
  article: 'article',
  auto_awesome: 'sparkle',
  bolt: 'lightning',
  bookmark: 'bookmark-simple',
  bookmark_border: 'bookmark-simple',
  check: 'check',
  check_circle: 'check-circle',
  chevron_left: 'caret-left',
  chevron_right: 'caret-right',
  circle: 'circle',
  close: 'x',
  cloud_off: 'cloud-slash',
  code: 'code',
  content_copy: 'copy',
  description: 'file-text',
  download: 'download-simple',
  edit: 'pencil-simple',
  error: 'warning',
  expand_more: 'caret-down',
  extension: 'puzzle-piece',
  fact_check: 'clipboard-text',
  front_hand: 'hand-palm',
  home: 'house',
  home_repair_service: 'hammer',
  ink_eraser: 'eraser',
  key: 'key',
  lan: 'tree-structure',
  lightbulb: 'lightbulb',
  link: 'link',
  login: 'sign-in',
  logout: 'sign-out',
  memory: 'brain',
  menu: 'list',
  open_in_new: 'arrow-square-out',
  person: 'user',
  radio_button_checked: 'radio-button',
  radio_button_unchecked: 'circle',
  search: 'magnifying-glass',
  search_off: 'magnifying-glass',
  sell: 'tag',
  shopping_cart: 'shopping-cart',
  stop: 'stop-circle',
  trending_up: 'trend-up',
  verified: 'seal-check',
  warning: 'warning',
};

const phName = (name = '') => PHOSPHOR_ICON[name] || String(name).replace(/_/g, '-');

export const Icon = ({ name, size, cls = '' }) =>
  html`<i class=${['ph', 'ph-' + phName(name), 'ms', size ? 's' + size : '', cls].filter(Boolean).join(' ')} aria-hidden="true"></i>`;

export const clsx = (...a) => a.filter(Boolean).join(' ');

export function copyText(text, el) {
  navigator.clipboard.writeText(text).then(() => {
    if (!el) return;
    const t = el.textContent; el.textContent = 'copied'; setTimeout(() => (el.textContent = t), 1300);
  });
}

export const fmtNum = (n) => (n == null ? '—' : Number(n).toLocaleString());
export const fmtMoney = (n) => (n == null ? '—' : '$' + Number(n).toLocaleString());

// Generic modal with backdrop + Escape close.
export function Modal({ onClose, children, labelledby }) {
  useEffect(() => {
    const k = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', k);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', k); document.body.style.overflow = ''; };
  }, []);
  return html`
    <div class="modal-back" onClick=${(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div class="modal" role="dialog" aria-modal="true" aria-labelledby=${labelledby}>
        <button class="modal-x" onClick=${onClose} aria-label="Close"><${Icon} name="close" size="20" /></button>
        ${children}
      </div>
    </div>`;
}

export const Empty = ({ icon = 'search_off', title, children }) => html`
  <div class="empty"><${Icon} name=${icon} /><b>${title}</b>${children}</div>`;

// Simple page-number pagination.
export function Pager({ page, pages, total, start, end, onGo }) {
  if (pages <= 1) return null;
  const nums = new Set([1, pages, page]);
  if (page > 1) nums.add(page - 1);
  if (page < pages) nums.add(page + 1);
  if (pages <= 7) for (let i = 1; i <= pages; i++) nums.add(i);
  const sorted = [...nums].sort((a, b) => a - b);
  const out = []; let last = 0;
  sorted.forEach((p) => {
    if (last && p - last > 1) out.push(html`<span class="pgbtn" style="border:none;background:none;cursor:default">…</span>`);
    out.push(html`<button class=${clsx('pgbtn', p === page && 'on')} onClick=${() => onGo(p)}>${p}</button>`);
    last = p;
  });
  return html`
    <div class="pager">
      <div class="info">Showing <strong>${start}</strong>–<strong>${end}</strong> of <strong>${total}</strong></div>
      <div class="pgbtns">
        <button class="pgbtn" disabled=${page === 1} onClick=${() => onGo(page - 1)}><${Icon} name="chevron_left" size="18" /></button>
        ${out}
        <button class="pgbtn" disabled=${page === pages} onClick=${() => onGo(page + 1)}><${Icon} name="chevron_right" size="18" /></button>
      </div>
    </div>`;
}
