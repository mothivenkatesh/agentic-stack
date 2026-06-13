import { html, Icon, useState } from '../ui.js';

const FEATURES = [
  { ic: 'lightbulb', cls: 'ic-amber', title: 'Pain Ideas', body: '1,000 validated pain points with persona, market size, what they pay today, and the gap. A free idea browser.', to: 'pains' },
  { ic: 'extension', cls: 'ic-violet', title: 'Agent Skills', body: 'The 18-skill reliable-agent playbook: gates that decide, sections that write, a spine that assembles and audits.', to: 'skills' },
  { ic: 'lan', cls: 'ic-blue', title: 'Agent Stack', body: 'Answer seven questions, get a recommended stack: the layer, the tool, the model tier, memory, and eval.', to: 'stack' },
  { ic: 'description', cls: 'ic-green', title: 'PRD Builder', body: 'Describe the agent and Claude generates a full eval-gated PRD, with the five sections generic specs skip. Copy, download, save.', to: 'prd' },
];

const WHY = [
  ['fact_check', 'How will we know it works?', 'eval plan'],
  ['front_hand', 'What can it do without a human?', 'HITL'],
  ['memory', 'What does it remember?', 'memory'],
  ['error', 'How does it fail?', 'premortem'],
  ['trending_up', 'How does it get better?', 'learning loop'],
];

const FAQ = [
  ['Is it really free?', 'Yes. Browsing pains, the skills library, and the stack picker need no account. Sign in only to save pains and PRDs across devices, and that is free too.'],
  ['Where do the ideas come from?', 'The 1,000 pain points come from idea-box: each entry answers who hurts, how big, what they pay now, the gap, and why now, with sources.'],
  ['What is the difference between a skill and the stack picker?', 'The stack picker tells you which tools to build on. The skills walk you through writing the PRD itself. The PRD Builder produces the document.'],
  ['Do I need to use Claude Code?', 'No. The PRD Builder runs in the browser. The 18 skills also run in Claude Code if you want the guided, agent-assisted version.'],
  ['Can I contribute a pain?', 'Yes, idea-box takes contributions on GitHub. Add a real Reddit, forum, or review quote that backs the pain.'],
];

export function Landing({ go }) {
  const [open, setOpen] = useState(0);
  return html`
    <div class="lp">
      <nav class="lp-nav"><div class="in">
        <div class="lp-brand"><span class="logo"><${Icon} name="bolt" /></span> Agentic Stack</div>
        <div class="lp-links">
          <a class="u-clickable" onClick=${() => go('pains')}>Pain Ideas</a>
          <a class="u-clickable" onClick=${() => go('skills')}>Skills</a>
          <a class="u-clickable" onClick=${() => go('stack')}>Stack</a>
          <button class="btn btn-accent btn-sm" onClick=${() => go('home')}>Open the app</button>
        </div>
      </div></nav>

      <header class="lp-wrap lp-hero">
        <div class="lp-eyebrow"><${Icon} name="bolt" /> Free · built on idea-box + agent-blueprint</div>
        <h1>The free stack for building <span class="grad">AI agents.</span></h1>
        <p class="sub">A free idea browser plus a guided agent-spec workflow. Start from a pain with real paying users and turn it into an agent spec that survives production.</p>
        <div class="lp-cta">
          <button class="btn btn-accent btn-lg" onClick=${() => go('pains')}><${Icon} name="search" size="20" /> Browse 1,000 pains</button>
          <button class="btn btn-ghost btn-lg" onClick=${() => go('home')}>Open the dashboard <${Icon} name="arrow_forward" size="18" /></button>
        </div>
      </header>

      <section class="lp-section alt"><div class="lp-wrap">
        <h2 class="lp-h2">Everything between an idea and a shippable spec</h2>
        <p class="lp-p">Four tools, one workflow. Each opens pre-filled from the one before.</p>
        <div class="lp-feats">
          ${FEATURES.map((f) => html`
            <div class="lp-feat u-clickable" onClick=${() => go(f.to)}>
              <div class=${'ic ' + f.cls}><${Icon} name=${f.ic} /></div>
              <h3>${f.title}</h3>
              <p>${f.body}</p>
            </div>`)}
        </div>
      </div></section>

      <section class="lp-section"><div class="lp-wrap">
        <h2 class="lp-h2">Most agents die in the spec, not the model</h2>
        <p class="lp-p">A generic PRD skips the five things that decide whether an agent ships. Agentic Stack makes you answer them.</p>
        <div class="lp-feats lp-why">
          ${WHY.map(([ic, q, tag]) => html`
            <div class="lp-feat">
              <div class="ic ic-blue"><${Icon} name=${ic} /></div>
              <h3 class="lp-h3-sm">${q}</h3>
              <p class="mono lp-tag">${tag}</p>
            </div>`)}
        </div>
      </div></section>

      <section class="lp-section alt"><div class="lp-wrap">
        <div class="lp-quote">
          <p>"Stop reading hundred-startup-ideas listicles. Start from a pain that already has paying users and broken tools, then spec the agent so it does not get scrapped in production."</p>
          <div class="who">The Agentic Stack premise</div>
        </div>
      </div></section>

      <section class="lp-section"><div class="lp-wrap">
        <h2 class="lp-h2">Questions</h2>
        <p class="lp-p"></p>
        <div class="faq">
          ${FAQ.map(([q, a], i) => html`
            <div class=${'faq-item' + (open === i ? ' open' : '')}>
              <button class="faq-q" onClick=${() => setOpen(open === i ? -1 : i)}>${q}<${Icon} name="expand_more" /></button>
              <div class="faq-a">${a}</div>
            </div>`)}
        </div>
      </div></section>

      <section class="lp-section alt"><div class="lp-wrap u-center">
        <h2 class="lp-h2">Pick a pain worth building</h2>
        <p class="lp-p">Free to browse. No account needed to start.</p>
        <div class="lp-cta">
          <button class="btn btn-accent btn-lg" onClick=${() => go('home')}><${Icon} name="bolt" size="20" /> Open Agentic Stack</button>
        </div>
      </div></section>

      <footer class="lp-foot"><div class="lp-wrap">
        <div class="cols">
          <div class="lp-about">
            <div class="logo"><${Icon} name="bolt" /></div>
            <p class="lp-about-p">A free idea browser and agent-spec workflow. Open, built on idea-box and agent-blueprint.</p>
          </div>
          <div><h5>Find</h5>
            <a class="u-clickable" onClick=${() => go('pains')}>Pain Ideas</a>
            <a href="https://github.com/mothivenkatesh/idea-box" target="_blank" rel="noopener">idea-box</a>
          </div>
          <div><h5>Build</h5>
            <a class="u-clickable" onClick=${() => go('skills')}>Agent Skills</a>
            <a class="u-clickable" onClick=${() => go('stack')}>Agent Stack</a>
            <a class="u-clickable" onClick=${() => go('prd')}>PRD Builder</a>
          </div>
          <div><h5>More</h5>
            <a href="https://github.com/mothivenkatesh/agent-blueprint" target="_blank" rel="noopener">agent-blueprint</a>
            <a href="https://github.com/mothivenkatesh" target="_blank" rel="noopener">@mothivenkatesh</a>
          </div>
        </div>
        <div class="credit">Built by Mothi Venkatesh · MIT · Not affiliated with the sources it distills.</div>
      </div></footer>
    </div>`;
}
