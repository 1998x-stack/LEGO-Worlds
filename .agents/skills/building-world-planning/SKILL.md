---
name: building-world-planning
description: Architect large multi-floor buildings and built environments as domain-separated 3D world systems. Use for building concept scenes, floor graphs, MEP, structural layouts and streaming; not for code-compliant design approval.
---

# building-world-planning

Produce scalable building-world datasets without promising structural or life safety.

## Trigger and scope

Use only when the request matches the frontmatter description. For unfamiliar source data or safety-critical outputs, state assumptions and do not extrapolate beyond validated capabilities.

## Workflow

1. Gather purpose, approximate footprint/floors, occupancy, site and model fidelity.
2. Separate geometry grid, vertical circulation, structure, facade, MEP, interior scenes and fire/egress metadata.
3. Define floor/zone/component IDs and instancing/LOD/streaming contracts; track dimensions in metres.
4. Connect geometry interfaces to future structural load cases and building code evidence.
5. Create a conceptual scene only if the target asset pipeline supports it; otherwise return a requirements-first plan.

## Supporting resources

- Before implementation, read [domain contract](references/domain.md).
- Use [input/output template](assets/example.json) as a starting contract, not as measured evidence.
- Run `node .agents/skills/building-world-planning/scripts/check.mjs` to verify this bundle.
- For changed production code run `npm test` and `npm run build`.

## Stop conditions

Do not claim verified manufacture, certified building safety, flightworthiness or general physics behavior from nominal geometry, OBB previews or template planning. Report unsupported constraints explicitly.
