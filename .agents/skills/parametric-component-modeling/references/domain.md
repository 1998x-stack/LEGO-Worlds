# parametric-component-modeling — domain notes

Use nominal stud pitch 8 mm, brick height 9.6 mm and plate height 3.2 mm only where the current procedural brick system does. Do not assume official LEGO tolerances. Avoid disconnected overlaps for physical export; verify wall thickness/manifold/print orientation separately.

## Repository anchors

- Component catalog: `src/catalog.js`
- Procedural geometry: `src/brick-system.js`
- Typed interfaces: `src/connection-anchors.js`
- Constraint graph: `src/constraint-graph.js`
- Prompt-to-graph planner: `src/ai-agent.js`
- System constraints: `AGENTS.md`

## Acceptance

Prove the requested behavior with deterministic tests, state the fidelity tier and document known failure modes. External life-safety/physical approval is never implied by CI success.
