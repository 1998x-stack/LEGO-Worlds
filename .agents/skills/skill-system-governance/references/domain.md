# skill-system-governance — domain notes

Canonical skills are under .agents/skills for Codex; .codex/skills are convenient mirrors but not Codex's documented discovery root. Pi discovers .agents/skills and .pi/skills, so do not duplicate skill names in .pi/skills. Claude mirrors are lightweight pointers. Do not commit credentials or install third-party binaries via skill execution.

## Repository anchors

- Component catalog: `src/catalog.js`
- Procedural geometry: `src/brick-system.js`
- Typed interfaces: `src/connection-anchors.js`
- Constraint graph: `src/constraint-graph.js`
- Prompt-to-graph planner: `src/ai-agent.js`
- System constraints: `AGENTS.md`

## Acceptance

Prove the requested behavior with deterministic tests, state the fidelity tier and document known failure modes. External life-safety/physical approval is never implied by CI success.
