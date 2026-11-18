# mobile-robotics-worlds — domain notes

src/ai-agent.js creates a six-wheel rover consisting of crossmember, two beams, six wheel meshes and a sensor dome (10 parts). Wheel joints are virtual shaft axes, not real bearing/axle/suspension geometry. The rover is static/kinematic educational geometry, not a traversable Mars rover.

## Repository anchors

- Component catalog: `src/catalog.js`
- Procedural geometry: `src/brick-system.js`
- Typed interfaces: `src/connection-anchors.js`
- Constraint graph: `src/constraint-graph.js`
- Prompt-to-graph planner: `src/ai-agent.js`
- System constraints: `AGENTS.md`

## Acceptance

Prove the requested behavior with deterministic tests, state the fidelity tier and document known failure modes. External life-safety/physical approval is never implied by CI success.
