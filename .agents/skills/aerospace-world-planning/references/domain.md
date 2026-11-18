# aerospace-world-planning — domain notes

This project currently does not provide CFD, FEA, aeroelasticity, propulsion verification or flight safety certification. Flight-capable design requires qualified engineering and regulatory processes. World coordinates in m, loads in N and aerodynamic conditions must be explicit.

## Repository anchors

- Component catalog: `src/catalog.js`
- Procedural geometry: `src/brick-system.js`
- Typed interfaces: `src/connection-anchors.js`
- Constraint graph: `src/constraint-graph.js`
- Prompt-to-graph planner: `src/ai-agent.js`
- System constraints: `AGENTS.md`

## Acceptance

Prove the requested behavior with deterministic tests, state the fidelity tier and document known failure modes. External life-safety/physical approval is never implied by CI success.
