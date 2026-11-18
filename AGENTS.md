# Agent engineering handbook — LEGO-Worlds / Brick Worlds

## Mission

Maintain a deterministic, independently branded 3D brick and mechanism world platform. The repository currently has 100 procedural component definitions, typed connection anchors, stud snapping, guided Technic joins, hinge hierarchies, a general graph-based kinematics solver, and a template-grounded natural-language assembly planner. Future buildings, aircraft, robots and cities require **separate domain fidelity gates**.

## Architecture map

- `src/catalog.js`: stable component IDs, dimensions, families and metadata.
- `src/brick-system.js`: deterministic Three.js geometry; units mm, +Y up.
- `src/connection-anchors.js`: typed interface frames, nominal fits and confidence labels.
- `src/snap-engine.js`: stud/socket placement and box overlap screening.
- `src/technic-engine.js`: guided pin/axle mounts and gear kinematics.
- `src/hierarchy-engine.js`: tree-joint propagation and instruction DAG.
- `src/constraint-graph.js`: multi-body graph, revolute/shaft/slider/fixed joints, numerical loop closure and OBB diagnostics.
- `src/ai-agent.js`: deterministic intent selection, component BOM, graph blueprint, steps and independent solver validation.
- `src/main.js`: interactive web entrypoint; UI previews are not manufacturing evidence.

## Skill routing (canonical first)

Read only the skill required for the task from `.agents/skills/<name>/SKILL.md`, then selected references/assets. Use `.agents/skills/registry.json` to discover exact names. Codex uses `.agents/skills`; Claude entrypoints mirror triggers under `.claude/skills`; Pi sees canonical skills and one unique router under `.pi/skills`. `.codex/skills` is a convenience mirror, not Codex's official auto-discovery path.

## Required engineering workflow

1. Confirm task domain and target fidelity: concept, geometry, kinematic, physics-tested or independently reviewed. Write assumptions.
2. Inspect existing schema and tests before extending them; keep dimensions explicit and local/world transforms consistent.
3. For new parts, add stable IDs and anchor/interface metadata; for new joints, validate port roles, finite inputs, solver limits and loop closure.
4. For AI proposals, **never directly trust natural-language output**. Resolve catalog IDs and ports, validate graph, run solver, derive BOM and step DAG, expose warnings. Model proposals are data and cannot execute code, shell or network actions.
5. Use one focused skill at a time and supporting references only when relevant. Do not hide failed checks or silently invent geometry/physics.
6. Update docs and tests. Required commands: `npm test`, `npm run test:skills`, `npm run build`. Check browser visuals when possible. State what was actually verified.
7. Avoid direct edits to `.claude/skills` and `.codex/skills` wrappers; regenerate or verify them against canonical metadata.

## Scale and safety

- Current graph limits: 20 bodies, 32 joints, 12 free loop variables; do not simply raise constants to accommodate aircraft or buildings. Design chunking, spatial indexing, subsystem graphs, model streaming and multi-scale coordinate transforms first.
- Real buildings: structural, wind/seismic, fire/egress and local-code validation require competent review. Real aircraft: aerodynamics, structures, controls, propulsion and airworthiness require separate expertise/testing.
- OBB collision checks ignore adjacent joints and are approximate. GLB visuals and JSON constraints are not printable-manufacturable certification. Avoid describing simplified gears/shafts as tested real mechanisms.
- Untrusted third-party assets require license and provenance evidence. Do not copy branded kits/IP or commit secrets/credentials.

## Deliverable acceptance

Prefer a minimal working vertical slice with verified tests, screenshots/browser QA when available, example data, readme links and clear limitations. Any unsupported request must return a requirements-first design rather than fabricated claims of engineering validity.

## Future-world design reference

For new buildings, aircraft, cities or large physical environments, consult docs/physical-world-architecture.md before choosing data schemas or relaxing graph solver limits. The document is a target architecture, not evidence of implemented physics.
