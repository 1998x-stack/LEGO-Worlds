---
name: connection-interfaces
description: Design or audit mating anchors, holes, studs, shafts, hinge axes, face ports and tolerances in the 3D-world component system. Use when adding connectionProfile data, snap targets or connector semantics.
---

# connection-interfaces

Connect geometry to precise local interface frames without conflating nominal and verified fit.

## Trigger and scope

Use only when the request matches the frontmatter description. For unfamiliar source data or safety-critical outputs, state assumptions and do not extrapolate beyond validated capabilities.

## Workflow

1. Load docs/connection-anchors.md and the actual component geometry factory.
2. Define local frame with position, normal, up and optional axis in millimetres.
3. Add stable typed anchor IDs and counterpart/role/dimension metadata; distinguish native anchors from virtual datums.
4. Apply quaternion transforms consistently in assembly/world coordinates and reject same-instance connections.
5. Add compatibility and physical-measurement tests; mark every unmeasured interface as schematic.

## Supporting resources

- Before implementation, read [domain contract](references/domain.md).
- Use [input/output template](assets/example.json) as a starting contract, not as measured evidence.
- Run `node .agents/skills/connection-interfaces/scripts/check.mjs` to verify this bundle.
- For changed production code run `npm test` and `npm run build`.

## Stop conditions

Do not claim verified manufacture, certified building safety, flightworthiness or general physics behavior from nominal geometry, OBB previews or template planning. Report unsupported constraints explicitly.

## Registry V2 capability contract

- Machine-readable plugin manifest: [plugin.json](plugin.json); authoritative skill: this `SKILL.md`.
- Registered capability IDs: `world.anchors.design`.
- Runtime execution is strictly allowlisted by `packages/world-runner/index.mjs`; the manifest cannot execute arbitrary commands.
- Shared typed requests and results: `schemas/tool-request.schema.json` and `schemas/tool-result.schema.json`.
- L0/L1/L2 evidence is verified by `packages/validation-engine/index.mjs`, **never by plugin self-report**.

**Guidance-only capability:** the registry intentionally marks this workflow non-executable. Its domain references and examples support Agent reasoning, but must not be mistaken for an implemented physical solver. No arbitrary script execution fallback is permitted.
