# mechanical-constraint-solving — domain notes

Current solver limits: <=20 bodies, <=32 edges, <=12 free joint variables for closed loops, <=90 iterations. Units are degrees for rotational joints, mm for slider. OBB excludes direct neighbors: that omission must be explicit in reports.

## Repository anchors

- Component catalog: `src/catalog.js`
- Procedural geometry: `src/brick-system.js`
- Typed interfaces: `src/connection-anchors.js`
- Constraint graph: `src/constraint-graph.js`
- Prompt-to-graph planner: `src/ai-agent.js`
- System constraints: `AGENTS.md`

## Acceptance

Prove the requested behavior with deterministic tests, state the fidelity tier and document known failure modes. External life-safety/physical approval is never implied by CI success.
