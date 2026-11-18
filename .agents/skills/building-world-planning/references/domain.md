# building-world-planning — domain notes

Store world-scale coordinates separately from brick mm coordinates; use origin rebasing for large scenes. Building code, seismic/wind loads, egress, accessibility, fire resistance and safety are unresolved until validated by qualified professionals.

## Repository anchors

- Component catalog: `src/catalog.js`
- Procedural geometry: `src/brick-system.js`
- Typed interfaces: `src/connection-anchors.js`
- Constraint graph: `src/constraint-graph.js`
- Prompt-to-graph planner: `src/ai-agent.js`
- System constraints: `AGENTS.md`

## Acceptance

Prove the requested behavior with deterministic tests, state the fidelity tier and document known failure modes. External life-safety/physical approval is never implied by CI success.
