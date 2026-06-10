// POST /api/prd -> streams a full agent-blueprint-style PRD as markdown.
// Uses Claude (Anthropic SDK). Degrades to { ok:false, reason:"no-llm" } with no key,
// so the client can show a manual fallback and the app stays free to browse.
import Anthropic from '@anthropic-ai/sdk';

const SYSTEM = `You are Agentic Stack's PRD generator. Write a complete, shippable Product Requirements Document for an AI agent, in the agent-blueprint house style.

PRIME DIRECTIVES
- Default to the least autonomy that works: prefer a workflow with one LLM step over an autonomous agent unless the task needs open-ended, model-driven control flow. State which you chose and why.
- Make every requirement falsifiable. Give each a trace ID (REQ-01, REQ-02, ...), a MoSCoW priority, and an acceptance criterion.
- No eval, no PRD: the success-metrics section must contain at least one measurable acceptance criterion and a regression gate.
- Lead each section with the decision, then the rationale, then the requirements.
- Be honest. Never fake certainty; keep an explicit open-questions list. Do not claim "reliable" or "self-learning" unless the eval, reliability, memory, and learning-loop sections are actually filled.
- Budget cost and latency explicitly. Always give a model fallback posture; never hard-code a single provider.

OUTPUT
Return ONLY GitHub-flavored markdown. No preamble, no closing chatter. Start with "# <Agent name> — PRD". Use these sections in order, as level-2 (##) headings, and mark the five differentiators with a ★:
1. Problem, goal, non-goals, users and jobs
2. Why an agent (autonomy level + build mode: workflow vs agent vs hybrid)
3. Agent type and topology (Reasoning vs Operational + category)
4. Architecture and component blueprint (authored context, learned memory, tools, model + gateway, surface)
5. Capabilities, scope and non-goals
6. Tools, integrations and data access (I/O schemas; mark side-effecting tools idempotent; prefer MCP)
7. Memory and context strategy ★ (type: none / working / semantic recall (RAG) / observational; retention; freshness)
8. Success metrics and eval plan ★ (golden dataset, a rubric scored by code not a raw LLM number, thresholds, offline + online evals, a regression gate)
9. Autonomy boundaries and HITL ★ (where the human gate fires; approval vs suspension; tool-level by default)
10. Trust, safety, security and compliance (input/output guardrails, RBAC, secrets, sandboxing, spend caps, audit trail)
11. Reliability, latency and failure handling ★ (retries, timeouts, idempotency, compensation, latency budget, a failure premortem)
12. Model strategy and unit economics (tiered models, fallback chain, token + latency budget, cost-per-task)
13. Observability, ops, rollout and governance (tracing with token/cost, decision-quality metrics, drift detection, runbook, versioning)
14. Self-improvement / learning loop ★ (production traces to datasets to re-eval to a regression gate; what is automated vs human-reviewed)
15. Risks, dependencies and open questions

Tie the content to the user's idea and any provided pain or stack context. Where a default is non-obvious (a model id, a retry policy, a memory type), state the default and a one-line rationale.`;

function getClient(): Anthropic | null {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  return new Anthropic();
}

async function readBody(req: any): Promise<any> {
  if (req.body) return typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  return await new Promise((resolve) => {
    let d = '';
    req.on('data', (c: any) => (d += c));
    req.on('end', () => { try { resolve(d ? JSON.parse(d) : {}); } catch (e) { resolve({}); } });
    req.on('error', () => resolve({}));
  });
}

function buildUserMessage(b: any): string {
  const parts: string[] = [];
  parts.push('Agent idea:\n' + (b.prompt ? String(b.prompt).trim() : '(see source pain below)'));
  const p = b.pain;
  if (p) {
    parts.push(
      '\nSource pain (from idea-box):\n' +
      `- Title: ${p.title || '—'}\n` +
      `- Who hurts: ${p.persona || '—'}\n` +
      `- The pain: ${p.pain_description || '—'}\n` +
      `- Market: ${p.tam_firms ? Number(p.tam_firms).toLocaleString() + ' firms' : 'unknown'}` +
      (p.current_wtp_usd_month ? `, paying ~$${Number(p.current_wtp_usd_month).toLocaleString()}/mo to ${(p.incumbent_tools || []).join(', ') || 'incumbents'}` : '') + '\n' +
      `- Gap incumbents miss: ${p.incumbent_gap || '—'}\n` +
      `- Why now: ${p.why_now || '—'}`
    );
  }
  const s = b.stack;
  if (s && s.layer && s.builder) {
    parts.push(
      '\nChosen stack (from the stack picker):\n' +
      `- Build layer: ${s.layer.name}\n` +
      `- Tool: ${s.builder.name} (${s.builder.oneLiner || ''})\n` +
      (s.model ? `- Model strategy: ${s.model.name}\n` : '') +
      (s.memory ? `- Memory: ${s.memory.name}\n` : '') +
      (s.evalApproach ? `- Eval approach: ${s.evalApproach.name}` : '')
    );
  }
  parts.push('\nWrite the PRD now.');
  return parts.join('\n');
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.statusCode = 405; res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, reason: 'method' })); return;
  }
  const client = getClient();
  if (!client) {
    res.statusCode = 200; res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, reason: 'no-llm' })); return;
  }
  const body = await readBody(req);
  if (!body || !((body.prompt && String(body.prompt).trim()) || body.pain)) {
    res.statusCode = 400; res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, reason: 'empty' })); return;
  }

  const model = process.env.PRD_MODEL || 'claude-opus-4-8';
  const effort = process.env.PRD_EFFORT || 'medium';

  try {
    const stream = client.messages.stream({
      model,
      max_tokens: 8000,
      thinking: { type: 'adaptive' },
      output_config: { effort } as any,
      system: SYSTEM,
      messages: [{ role: 'user', content: buildUserMessage(body) }],
    } as any);

    res.setHeader('content-type', 'text/plain; charset=utf-8');
    res.setHeader('cache-control', 'no-store');
    res.setHeader('x-accel-buffering', 'no');

    for await (const event of stream as any) {
      if (event.type === 'content_block_delta' && event.delta && event.delta.type === 'text_delta') {
        res.write(event.delta.text);
      }
    }
    res.end();
  } catch (e: any) {
    if (!res.headersSent) {
      res.statusCode = 500; res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, reason: 'error', message: String((e && e.message) || e) }));
    } else {
      res.end();
    }
  }
}
