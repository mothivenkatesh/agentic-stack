# Agentic Stack

A free idea browser plus an agent-spec workspace, in one app.

Three jobs in one app:

| Module | What it does | Source |
|---|---|---|
| Pain Ideas | Browse 1,000 validated pain points (a free idea browser) | idea-box |
| Agent Skills | The 18-skill reliable-agent playbook | agent-blueprint |
| Agent Stack | Pick your agent stack from a short Q&A | agentic-workflow-builder-comparison |
| PRD Builder | Describe the agent; Claude streams a full eval-gated PRD | agent-blueprint house style |

## Design

- One UI design system: dark sidebar + light workspace, Zoho Puvi only, and Phosphor icons via Iconify. Landing page follows the same product UI foundations.
- Frontend: Preact + htm via esm.sh, native ES modules, **no build step**.
- Backend: Vercel serverless functions (TypeScript) for auth + persistence.
- Auth: WorkOS AuthKit (passwordless email). DB: Neon Postgres.

## Run it

**Static frontend only (no auth/DB needed to browse):**
```
python -m http.server 5184    # then open http://localhost:5184
```
Everything except sign-in and cross-device save works. Saves use localStorage.

**Full app (auth + DB), with the Vercel CLI:**
```
npm install
cp .env.example .env.local    # fill in WorkOS + Neon (both optional)
vercel dev                    # http://localhost:3000
```

## Evals (the regression gate)

```
npm run eval        # = node evals/run.js — zero dependencies, exits 1 on any failure
```

Run before every commit; nothing ships on a red gate. Five suites:

| Suite | Pins down |
|---|---|
| `data-integrity` | 26 pains files parse; required fields + ranges; unique IDs; ≥1,000 entries; banned-content scan (illegal-in-India); validations resolve to real pains with known verdicts |
| `skills-contract` | exactly 18 skills / 3 layers / orders 1–18; the 4 Differentiator skills by id; cmd format; install commands |
| `stack-wizard` | every possible answer combination through the real `recommend()` (`src/stackLogic.js`) resolves to a defined layer/builder/model/memory/eval; logic's question-ids exist in `stack-rules.json` |
| `ui-consistency` | gradient ban (sole exception `.skel` shimmer; never stacked); Zoho Puvi only with no external Google font loading; every icon name vetted in `ui.js`'s `PHOSPHOR_ICON` map; tour anchors exist; verdict color-maps cover the data; core tokens + html shell |
| `copy-drift` | numbers in copy match data: "18 skills", "1,000 pains", 15 PRD sections with exactly 5 ★ across the outline, the system prompt, and the sample PRD |

When a check legitimately needs to change (e.g. you add a 19th skill), update the data and the copy it points at — the failure message names both sides.

## Graceful degrade

Nothing is required. With no env vars the app is fully usable in public mode (browse + localStorage). Add `ANTHROPIC_API_KEY` to switch on PRD generation; add WorkOS to switch on accounts; add Neon to switch on cross-device saved pains + PRDs. See `.env.example`.

## Deploy

```
vercel --prod
```
Set the env vars in the Vercel project. Run `schema.sql` against your Neon database once.

## Data

`/data` holds the public datasets as JSON (26 `pains-*.json` + `validations-s-tier.json` from idea-box, plus `skills.json` and `stack-rules.json`). Refresh the pains from idea-box when it updates.

MIT. Built on idea-box and agent-blueprint.
