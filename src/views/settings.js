import { html, Icon, useState } from '../ui.js';
import { store } from '../auth.js';

const MODELS = [
  { id: 'claude-opus-4-8', label: 'Opus 4.8' },
  { id: 'claude-sonnet-4-6', label: 'Sonnet 4.6' },
  { id: 'claude-haiku-4-5', label: 'Haiku 4.5' },
];

export function SettingsModal({ open, onClose }) {
  const [key, setKey] = useState(store.apiKey());
  const [model, setModel] = useState(store.model() || 'claude-opus-4-8');
  const [saved, setSaved] = useState('');
  if (!open) return null;

  const save = () => {
    store.setApiKey(key.trim());
    store.setModel(model);
    setSaved('Saved');
    setTimeout(() => { setSaved(''); onClose(); }, 700);
  };
  const clear = () => { store.setApiKey(''); setKey(''); };

  return html`
    <div class="modal-back" onClick=${(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div class="modal modal-sm" role="dialog" aria-modal="true" aria-labelledby="set-title">
        <div class="modal-head">
          <h2 id="set-title"><${Icon} name="key" size="18" /> API key</h2>
          <button class="modal-x modal-x-inline" onClick=${onClose} aria-label="Close"><${Icon} name="close" size="20" /></button>
        </div>
        <div class="modal-body">
          <p class="muted modal-p">Bring your own Anthropic key to generate PRDs. It is stored only in this browser (localStorage) and used to call Claude directly from your device. It never touches our servers.</p>

          <div class="field">
            <label class="label">Anthropic API key</label>
            <input class="input" type="password" autocomplete="off" spellcheck="false" placeholder="sk-ant-..." value=${key} onInput=${(e) => setKey(e.target.value)} />
            <div class="hint">No key yet? <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener">Create one in the Anthropic Console →</a></div>
          </div>

          <div class="field">
            <label class="label">Model</label>
            <div class="seg">
              ${MODELS.map((m) => html`<button class=${model === m.id ? 'active' : ''} onClick=${() => setModel(m.id)}>${m.label}</button>`)}
            </div>
            <div class="hint">Opus is sharpest; Sonnet and Haiku are cheaper and faster.</div>
          </div>

          <div class="set-actions">
            <button class="btn btn-ghost btn-sm" onClick=${clear}>Clear key</button>
            <span class="spacer"></span>
            ${saved ? html`<span class="pill pill-green"><${Icon} name="check" /> ${saved}</span>` : ''}
            <button class="btn btn-accent btn-sm" onClick=${save}>Save</button>
          </div>
        </div>
      </div>
    </div>`;
}
