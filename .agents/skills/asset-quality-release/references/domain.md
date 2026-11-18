# asset-quality-release — domain notes

The pipeline uses Vite and Node tests. GitHub Actions success is not proof of manual WebGL/browser acceptance. JSON graph schemas are versioned and imported input must be validated. Include GLB size/LOD budgets before releasing city/building-scale assets.

## Repository anchors

- Component catalog: `src/catalog.js`
- Procedural geometry: `src/brick-system.js`
- Typed interfaces: `src/connection-anchors.js`
- Constraint graph: `src/constraint-graph.js`
- Prompt-to-graph planner: `src/ai-agent.js`
- System constraints: `AGENTS.md`

## Acceptance

Prove the requested behavior with deterministic tests, state the fidelity tier and document known failure modes. External life-safety/physical approval is never implied by CI success.
