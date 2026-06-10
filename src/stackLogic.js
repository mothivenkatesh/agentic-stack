// Deterministic stack recommendation. Pure logic, no UI imports —
// the eval suite (evals/checks/stack.js) imports this directly and
// runs every possible answer combination through it.
export function recommend(rules, a) {
  const score = { l1: 0, l2: 0, l3: 0, l4: 0 };
  rules.questions.forEach((q) => {
    const opt = q.options.find((o) => o.value === a[q.id]);
    if (opt && opt.weight) for (const k in opt.weight) score[k] += opt.weight[k];
  });
  const layer = Object.keys(score).sort((x, y) => score[y] - score[x])[0];

  let builderId;
  if (layer === 'l1') builderId = a.builder === 'ops' ? 'activepieces' : 'n8n';
  else if (layer === 'l2') builderId = a.actions === 'no' ? 'dify' : a.bar === 'high' ? 'lyzr' : 'flowise';
  else if (layer === 'l3') builderId = a.multi === 'many' ? 'crewai' : 'langgraph';
  else builderId = a.bar === 'high' ? 'orkes' : 'temporal';

  const modelId = a.bar === 'high' || a.control === 'model' ? 'tiered' : 'lean';
  const memId = a.durability === 'long' ? 'observational' : a.actions === 'no' ? 'semantic' : a.control === 'model' || a.multi === 'many' ? 'working' : 'none';
  const evalId = a.actions === 'yes' ? 'tool' : a.actions === 'no' ? 'faithfulness' : 'task';

  return {
    layer: rules.layers.find((l) => l.id === layer),
    builder: rules.builders.find((b) => b.id === builderId),
    model: rules.modelTiers.find((m) => m.id === modelId),
    memory: rules.memoryTypes.find((m) => m.id === memId),
    evalApproach: rules.evalApproaches.find((e) => e.id === evalId),
    score,
  };
}
