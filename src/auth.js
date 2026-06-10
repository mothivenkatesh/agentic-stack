// Client auth + local persistence. Auth degrades gracefully: if the API is
// absent (pure static host, no WorkOS), me() returns null and the app stays public.
const API = location.protocol === 'file:' ? 'http://localhost:3000' : '';

export const auth = {
  async me() {
    try {
      const r = await fetch(API + '/api/me', { credentials: 'include' });
      if (!r.ok) return null;
      const j = await r.json();
      return j && j.user ? j.user : null;
    } catch (e) { return null; }
  },
  login() { location.href = API + '/api/auth/login?return=' + encodeURIComponent(location.href); },
  logout() { location.href = API + '/api/auth/logout'; },
  // Distinguish "no backend" (static host, /api/me 404s) from "backend present, not signed in".
  async probe() {
    try {
      const r = await fetch(API + '/api/me', { credentials: 'include' });
      if (r.status === 404) return { available: false, user: null };
      if (!r.ok) return { available: true, user: null };
      const j = await r.json();
      return { available: true, user: j && j.user ? j.user : null };
    } catch (e) { return { available: false, user: null }; }
  },
};

// localStorage persistence. Works with no backend; the DB sync is a phase-2 swap.
const read = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } };
const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };

export const store = {
  favs: () => read('af_favs', []),
  isFav(id) { return this.favs().includes(id); },
  toggleFav(id) {
    const f = new Set(read('af_favs', []));
    f.has(id) ? f.delete(id) : f.add(id);
    write('af_favs', [...f]);
    return [...f];
  },
  prds: () => read('af_prds', []),
  savePRD(p) {
    const all = read('af_prds', []);
    const i = all.findIndex((x) => x.id === p.id);
    if (i >= 0) all[i] = p; else all.unshift(p);
    write('af_prds', all);
    return all;
  },
  deletePRD(id) { const all = read('af_prds', []).filter((x) => x.id !== id); write('af_prds', all); return all; },
  tourSeen() { return read('af_tour', false); },
  markTour() { write('af_tour', true); },
  apiKey() { return read('af_key', '') || ''; },
  setApiKey(k) { write('af_key', k || ''); },
  hasKey() { return !!(read('af_key', '') || ''); },
  model() { return read('af_model', '') || ''; },
  setModel(m) { write('af_model', m || ''); },
};
