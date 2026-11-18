# ai-assembly-planning — domain notes

Use src/ai-agent.js createAssemblyPlan and validateGeneratedPlan. The browser planner is deterministic/template grounded and does NOT call a general LLM. A future provider may propose candidates, but all proposals must pass the same offline validator before display or storage.

## Repository anchors

- Component catalog: `src/catalog.js`
- Procedural geometry: `src/brick-system.js`
- Typed interfaces: `src/connection-anchors.js`
- Constraint graph: `src/constraint-graph.js`
- Prompt-to-graph planner: `src/ai-agent.js`
- System constraints: `AGENTS.md`

## Acceptance

Prove the requested behavior with deterministic tests, state the fidelity tier and document known failure modes. External life-safety/physical approval is never implied by CI success.
