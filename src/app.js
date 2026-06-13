import { html, render, Icon, useState, useEffect } from './ui.js';
import { auth, store } from './auth.js';
import { Landing } from './views/landing.js';
import { Home } from './views/home.js';
import { PainIdeas } from './views/painIdeas.js';
import { Skills } from './views/skills.js';
import { Stack } from './views/stack.js';
import { PRD } from './views/prd.js';
import { FeedbackModal } from './views/feedback.js';
import { WelcomeTour } from './views/tour.js';
import { SettingsModal } from './views/settings.js';

const NAV = [
  { section: 'Start', items: [{ id: 'home', label: 'Home', icon: 'home' }] },
  { section: 'Find', items: [
    { id: 'pains', label: 'Pain Ideas', icon: 'lightbulb' },
    { id: 'saved', label: 'Saved', icon: 'bookmark' },
  ] },
  { section: 'Build', items: [
    { id: 'skills', label: 'Agent Skills', icon: 'extension' },
    { id: 'stack', label: 'Agent Stack', icon: 'lan' },
    { id: 'prd', label: 'PRD Builder', icon: 'description' },
  ] },
];
const MOBILE_NAV = [
  { id: 'home', label: 'Home', icon: 'home' },
  { id: 'pains', label: 'Ideas', icon: 'lightbulb' },
  { id: 'stack', label: 'Stack', icon: 'lan' },
  { id: 'prd', label: 'PRD', icon: 'description' },
  { id: 'saved', label: 'Saved', icon: 'bookmark' },
];
const APP_VIEWS = new Set(NAV.flatMap((g) => g.items.map((i) => i.id)));
const currentView = () => (location.hash || '').replace(/^#\/?/, '') || 'landing';

function App() {
  const [view, setView] = useState(currentView());
  const [seed, setSeed] = useState(null);
  const [user, setUser] = useState(null);
  const [authAvailable, setAuthAvailable] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    const onHash = () => { setView(currentView()); setNavOpen(false); window.scrollTo(0, 0); };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  useEffect(() => { auth.probe().then(({ available, user }) => { setAuthAvailable(available); setUser(user); }); }, []);
  useEffect(() => {
    if (view !== 'landing' && APP_VIEWS.has(view) && !store.tourSeen()) { setTourOpen(true); store.markTour(); }
  }, [view]);

  const go = (v, payload) => { if (payload) setSeed({ view: v, payload, n: Date.now() }); setNavOpen(false); location.hash = '#/' + v; };

  if (view === 'landing' || !APP_VIEWS.has(view)) {
    if (view !== 'landing') location.hash = '';
    return html`<${Landing} go=${go} />`;
  }

  const Body =
    view === 'home' ? html`<${Home} go=${go} user=${user} />`
    : view === 'pains' ? html`<${PainIdeas} go=${go} seed=${seed} />`
    : view === 'saved' ? html`<${PainIdeas} go=${go} seed=${seed} savedOnly=${true} />`
    : view === 'skills' ? html`<${Skills} go=${go} />`
    : view === 'stack' ? html`<${Stack} go=${go} seed=${seed} />`
    : html`<${PRD} seed=${seed} onAddKey=${() => setSettingsOpen(true)} />`;

  return html`
    <div class="app">
      <div class=${'nav-backdrop' + (navOpen ? ' open' : '')} onClick=${() => setNavOpen(false)} aria-hidden="true"></div>

      <aside class=${'sidebar' + (navOpen ? ' open' : '')} data-theme="dark">
        <div class="sb-brand">
          <a class="sb-brand-link" href="#" onClick=${(e) => { e.preventDefault(); location.hash = ''; }}>
            <span class="logo"><${Icon} name="bolt" /></span>
            <span>Agentic Stack</span>
          </a>
          <button class="sb-close" onClick=${() => setNavOpen(false)} aria-label="Close navigation"><${Icon} name="close" size="20" /></button>
        </div>

        <nav class="sb-nav" data-tour="sidebar-nav">
          ${NAV.map((g) => html`
            <div class="sb-group">
              <div class="sb-sect">${g.section}</div>
              ${g.items.map((n) => html`
                <button class=${'sb-item' + (view === n.id ? ' active' : '')} onClick=${() => go(n.id)}>
                  <${Icon} name=${n.icon} cls=${view === n.id ? 'fill' : ''} /> <span>${n.label}</span>
                </button>`)}
            </div>`)}
        </nav>

        <div class="sb-foot" data-tour="sidebar-footer">
          <button class="sb-link" onClick=${() => { setSettingsOpen(true); setNavOpen(false); }}><${Icon} name="key" size="18" /> API key${store.hasKey() ? ' · set' : ''}</button>
          <button class="sb-link" onClick=${() => go('saved')}><${Icon} name="bookmark" size="18" /> Saved pains</button>
          <button class="sb-link" onClick=${() => { setTourOpen(true); setNavOpen(false); }}><${Icon} name="bolt" size="18" /> Take the tour</button>
          <button class="sb-link" onClick=${() => { setFeedbackOpen(true); setNavOpen(false); }}><${Icon} name="edit" size="18" /> Share feedback</button>
          ${authAvailable
            ? html`<button class="sb-link" onClick=${() => (user ? auth.logout() : auth.login())}><${Icon} name=${user ? 'logout' : 'login'} size="18" /> ${user ? 'Sign out' : 'Sign in to save'}</button>`
            : html`<div class="sb-source sb-source-offline"><${Icon} name="cloud_off" size="16" /> Saved in this browser</div>`}
          <p class="sb-credit">Built by <a href="https://www.linkedin.com/in/mothivenkatesh/" target="_blank" rel="noopener">Mothi</a></p>
        </div>
      </aside>

      <main class="main">
        <div class="mobile-top">
          <button class="hamb" onClick=${() => setNavOpen(true)} aria-label="Open navigation"><${Icon} name="menu" size="20" /></button>
          <span class="mobile-title"><span class="logo-sm"><${Icon} name="bolt" size="18" /></span> Agentic Stack</span>
          <span class="mobile-top-spacer"></span>
        </div>
        ${Body}
      </main>

      <nav class="mobile-bottom-nav" data-theme="dark" aria-label="Primary mobile navigation">
        ${MOBILE_NAV.map((n) => html`
          <button class=${'mb-item' + (view === n.id ? ' active' : '')} onClick=${() => go(n.id)} aria-current=${view === n.id ? 'page' : null}>
            <${Icon} name=${n.icon} cls=${view === n.id ? 'fill' : ''} />
            <span>${n.label}</span>
          </button>`)}
      </nav>

      <${FeedbackModal} open=${feedbackOpen} onClose=${() => setFeedbackOpen(false)} />
      <${WelcomeTour} open=${tourOpen} onClose=${() => setTourOpen(false)} />
      <${SettingsModal} open=${settingsOpen} onClose=${() => setSettingsOpen(false)} />
    </div>`;
}

render(html`<${App} />`, document.getElementById('app'));
