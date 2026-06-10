// A real, complete sample PRD shown in the result panel before the user adds a key.
// Purpose: deliver the "this is what you get" aha without the credential wall.
export const SAMPLE_TITLE = 'Prior-Auth Copilot';
export const SAMPLE_PAIN = 'Medical prior authorization: PDF ping-pong nightmare';

export const SAMPLE_PRD = `# Prior-Auth Copilot — PRD

## 1. Problem, goal, non-goals, users & jobs
**Decision.** Build a copilot that drafts and submits payer prior-authorization (PA) packets for a clinic's billing team and chases each one to a decision.

- **Who hurts:** prior-auth coordinators at specialty clinics (cardiology, oncology, imaging) processing 50–500 PAs/week.
- **The job:** turn an order plus clinical notes into a complete, payer-specific PA packet, submit it, and resolve denials — without a human re-keying the same data into six portals.
- **Goal (12 weeks):** cut median time-to-decision from 3–7 days to under 24h on the top-3 payers; 80% of packets submitted with zero human edits.
- **Non-goals:** clinical decision-making, coding CPT/ICD from scratch, appeals litigation, or asserting medical necessity the physician did not state.

## 2. Why an agent (autonomy level + build mode)
**Decision: hybrid — a deterministic workflow with two bounded LLM steps, not an autonomous agent.** The path (extract → map to payer form → submit → poll → triage) is known; only extraction and denial-triage need a model. Open-ended autonomy against payer portals only adds failure modes. *Rationale: least autonomy that works.*

## 3. Agent type & topology
Operational agent, single-actor with tools. No multi-agent topology — one orchestrator calling typed tools beats a crew here, where every step is auditable and side-effecting.

## 4. Architecture & component blueprint
- **Authored context:** payer rule cards (per-payer required fields, attachment rules, portal quirks), refreshed monthly.
- **Learned memory:** see §7.
- **Tools:** EHR read, payer-portal submit, status poll, fax fallback (§6).
- **Model + gateway:** tiered behind a gateway (§12).
- **Surface:** embedded panel in the coordinator's worklist; every action shows a diff before it fires.

## 5. Capabilities, scope & non-goals
In: packet assembly, field-completeness checks, submit, status polling, denial classification, resubmit with the missing artifact. Out: anything that changes the clinical order; auto-appeal beyond one templated resubmission.

## 6. Tools, integrations & data access
| Tool | I/O | Idempotent? |
|---|---|---|
| \`ehr.fetch_encounter\` | order id → notes, dx, demographics | read-only |
| \`payer.submit_pa\` | packet → confirmation id | **yes** (dedupe key = order id + payer) |
| \`payer.poll_status\` | confirmation id → status | read-only |
| \`fax.send\` | packet → job id | **yes** (idempotency key) |

Prefer MCP servers for EHR + payer connectors. Side-effecting tools carry a dedupe key so a retry never double-submits.

## 7. Memory & context strategy ★
- **Type:** semantic recall over a per-payer "what got approved" store, plus working memory within a single PA.
- **What's stored:** redacted packet → outcome (approved / denied + reason). No PHI in embeddings; keys reference the record, not the content.
- **Freshness:** payer rule cards expire in 30 days and re-verify against a live test submission.

## 8. Success metrics & eval plan ★
- **Golden set:** 200 historical PAs with known outcomes, per payer.
- **Rubric (scored by code, not a raw LLM number):** field-completeness = exact-match on required fields; submission-validity = portal accept/reject; decision-time.
- **Thresholds:** ≥0.95 field-completeness, 0 hallucinated clinical facts (checked against source notes), <24h median decision on top-3 payers.
- **Online:** shadow-mode for 2 weeks (agent drafts, human submits) before any auto-submit.
- **Regression gate:** a release ships only if the golden-set score does not drop and the hallucination count stays at 0.

## 9. Autonomy boundaries & HITL ★
- **Default: human approves every first-time submission per payer**, then graduates to auto-submit once 20 consecutive packets pass with no edit.
- **Hard gate (always human):** any packet asserting medical necessity, any spend over the per-PA cost cap, any payer the agent has never seen.
- Approval is **tool-level** (the \`submit_pa\` call suspends for review with a diff), not a blanket run-level confirm.

## 10. Trust, safety, security & compliance
PHI stays in the BAA-covered EHR boundary; the model sees the minimum necessary, redacted. RBAC by clinic + role. Full audit trail: every fact in the packet links to its source line in the notes. Spend cap per PA and per day.

## 11. Reliability, latency & failure handling ★
- **Retries:** exponential backoff on portal timeouts; **idempotency keys** make resubmits safe.
- **Compensation:** a failed multi-step submit rolls back to "draft, needs human."
- **Latency budget:** 90s to assemble a packet; polling is async.
- **Premortem:** portal HTML changes → contract test per payer fails loudly and routes to fax fallback; the agent never silently drops a PA.

## 12. Model strategy & unit economics
Extraction on a mid-tier model; denial-triage on the strongest tier; classification on the cheapest. Fallback chain across two providers behind the gateway. Budget: ~$0.18 / packet at target volume. Never hard-code one provider.

## 13. Observability, ops, rollout & governance
Trace every PA with token + cost + decision-quality. Drift alert if field-completeness or accept-rate moves >3 points week-over-week. Runbook for "payer portal down." Versioned rule cards and prompts; canary one payer before fleet rollout.

## 14. Self-improvement / learning loop ★
Production denials become labeled training rows: (packet, denial reason) → the missing-artifact rule. Weekly, those rows re-score the golden set; a rule change ships **only if it passes the regression gate**. New rules are human-reviewed before they touch a live submission — nothing self-modifies in the request path.

## 15. Risks, dependencies & open questions
- **Risk:** payers without an API force fax/manual — caps coverage. **Open:** which top payers expose a real submit endpoint?
- **Dependency:** EHR vendor's read API and a signed BAA.
- **Open:** is shadow-mode 2 weeks enough to earn auto-submit trust per payer, or do we need 50 clean packets?`;
