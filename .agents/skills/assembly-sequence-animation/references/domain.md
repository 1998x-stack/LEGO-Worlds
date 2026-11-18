# assembly-sequence-animation — domain notes

Current exploded animation offsets are schematic. Dependencies are ordering constraints, not collision-free trajectories. Closed-loop final joint edges should be listed after the supporting body nodes. GLB snapshots do not preserve interactive motion semantics.

## Repository anchors

- Component catalog: `src/catalog.js`
- Procedural geometry: `src/brick-system.js`
- Typed interfaces: `src/connection-anchors.js`
- Constraint graph: `src/constraint-graph.js`
- Prompt-to-graph planner: `src/ai-agent.js`
- System constraints: `AGENTS.md`

## Acceptance

Prove the requested behavior with deterministic tests, state the fidelity tier and document known failure modes. External life-safety/physical approval is never implied by CI success.
