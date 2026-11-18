# physics-validation — domain notes

Readiness tiers: concept -> geometry -> kinematic -> physics-tested -> externally reviewed. A static GLB, JSON constraint graph and OBB warning system do not satisfy the last two. Real buildings need code/structural review; aircraft need airworthiness and flight testing.

## Repository anchors

- Component catalog: `src/catalog.js`
- Procedural geometry: `src/brick-system.js`
- Typed interfaces: `src/connection-anchors.js`
- Constraint graph: `src/constraint-graph.js`
- Prompt-to-graph planner: `src/ai-agent.js`
- System constraints: `AGENTS.md`

## Acceptance

Prove the requested behavior with deterministic tests, state the fidelity tier and document known failure modes. External life-safety/physical approval is never implied by CI success.
