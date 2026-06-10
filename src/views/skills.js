import { html, Icon, copyText, useState, useEffect } from '../ui.js';
import { loadSkills } from '../data.js';

export function Skills({ go }) {
  const [d, setD] = useState(null);
  useEffect(() => { loadSkills().then(setD); }, []);
  if (!d) return html`<div class="view view-wide"><div class="page-hero"><div><div class="page-kicker">Agent skills</div><h1>Loading the playbook…</h1></div></div></div>`;

  const installText = d.install.join('\n');
  return html`
    <div class="view view-wide">
      <div class="page-hero" data-tour="narrative-hero">
        <div>
          <div class="page-kicker">Agent skills · free</div>
          <h1>Turn an idea into an agent spec that ships.</h1>
          <p>18 skills for Claude Code. Install once, run them in order. They force the calls generic specs skip — the 5 that decide whether an agent survives production.</p>
        </div>
        <div class="hero-stats">
          <div class="hero-stat"><b>18</b><span>skills</span></div>
          <div class="hero-stat"><b>${d.layers.length}</b><span>layers</span></div>
          <div class="hero-stat"><b>5</b><span>make-or-break</span></div>
        </div>
      </div>

      <div class="glass-card" style="padding:18px;margin-bottom:24px;display:grid;grid-template-columns:1fr auto;gap:16px;align-items:center">
        <div style="min-width:0">
          <div class="lead" style="margin-bottom:8px">Add all 18 to Claude Code</div>
          <div class="codeblock"><span class="copybtn" onClick=${(e) => copyText(installText, e.target)}>copy</span>${d.install.map((l) => html`<div><span class="pr">$</span> ${l}</div>`)}</div>
          <p class="muted" style="font-size:12px;margin:10px 0 0">Free · open-source · ~30s · no config. Then run <span class="kbd">/agent-blueprint:agent-prd</span> to start a spec.</p>
        </div>
        <a class="btn btn-ghost" href=${d.repo} target="_blank" rel="noopener"><${Icon} name="open_in_new" size="18" /> View repo</a>
      </div>

      ${d.layers.map((layer) => {
        const skills = d.skills.filter((s) => s.layer === layer.id).sort((a, b) => a.order - b.order);
        return html`
          <div class="skill-layer">
            <div class="sect-head"><h2>${layer.name}</h2><span class="count">${layer.tagline}</span></div>
            <p class="muted" style="font-size:13px;margin:-6px 0 14px;max-width:680px">${layer.desc}</p>
            <div class="skill-grid">
              ${skills.map((s) => html`
                <div class=${'scard' + (s.star ? ' star' : '')}>
                  <div class="sh">
                    <h4>${s.name}</h4>
                    ${s.star ? html`<span class="pill pill-amber" title="One of the 5 sections generic specs skip">Differentiator</span>` : ''}
                  </div>
                  <div class="one" title=${s.decides}>${s.oneLiner}</div>
                  <button class="cmd" onClick=${(e) => copyText(s.cmd, e.currentTarget.querySelector('.cmd-txt'))} title="Copy command">
                    <span class="cmd-txt">${s.cmd}</span><${Icon} name="content_copy" size="14" />
                  </button>
                </div>`)}
            </div>
          </div>`;
      })}

      <div class="glass-card" style="padding:20px;text-align:center">
        <p style="font-size:15px;font-weight:600;margin-bottom:4px">Found your pain? Spec it.</p>
        <p class="muted" style="font-size:13.5px;margin-bottom:14px">Pick a stack, draft the PRD. Both run on these skills.</p>
        <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap">
          <button class="btn btn-accent" onClick=${() => go('stack')}><${Icon} name="lan" size="18" /> Pick a stack</button>
          <button class="btn btn-primary" onClick=${() => go('prd')}><${Icon} name="description" size="18" /> Write a PRD</button>
        </div>
      </div>
    </div>`;
}
