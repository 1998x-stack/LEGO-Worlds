# world-systems-architect — domain notes

Start with the current graph solver and its explicit scope. For a building, break into site/floors/structural frames/services; for aircraft, airframe/propulsion/controls/systems; keep authoritative units separate (mm, m, kg, N, s). Never claim one preview graph validates structural safety or flightworthiness.

## Repository anchors

- Component catalog: `src/catalog.js`
- Procedural geometry: `src/brick-system.js`
- Typed interfaces: `src/connection-anchors.js`
- Constraint graph: `src/constraint-graph.js`
- Prompt-to-graph planner: `src/ai-agent.js`
- System constraints: `AGENTS.md`

## Acceptance

Prove the requested behavior with deterministic tests, state the fidelity tier and document known failure modes. External life-safety/physical approval is never implied by CI success.
