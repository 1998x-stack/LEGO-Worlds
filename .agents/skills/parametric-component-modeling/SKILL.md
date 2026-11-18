---
name: parametric-component-modeling
description: Create or refine reusable procedural 3D parts in src/catalog.js and src/brick-system.js. Use for dimensions, meshes, material systems and printable component design; not as a substitute for manufacturing fit testing.
---

# parametric-component-modeling

Create typed, deterministic reusable geometry with explicit dimensional assumptions.

## Trigger and scope

Use only when the request matches the frontmatter description. For unfamiliar source data or safety-critical outputs, state assumptions and do not extrapolate beyond validated capabilities.

## Workflow

1. Search catalog for existing IDs, types, dimensions, naming conventions and geometry factories before adding parts.
2. Propose dimensioned component schema with mm coordinates, stable IDs and family; document tolerances separately.
3. Build meshes deterministically using Three.js and keep the component origin/axes consistent with anchors.
4. Check finite geometry bounds, visible holes and manifold expectations; do not label schematic bores as tested cross sections.
5. Update catalog tests, anchor tests, technical docs and sample gallery; run npm test and npm run build.

## Supporting resources

- Before implementation, read [domain contract](references/domain.md).
- Use [input/output template](assets/example.json) as a starting contract, not as measured evidence.
- Run `node .agents/skills/parametric-component-modeling/scripts/check.mjs` to verify this bundle.
- For changed production code run `npm test` and `npm run build`.

## Stop conditions

Do not claim verified manufacture, certified building safety, flightworthiness or general physics behavior from nominal geometry, OBB previews or template planning. Report unsupported constraints explicitly.

## Registry V2 capability contract

- Machine-readable plugin manifest: [plugin.json](plugin.json); authoritative skill: this `SKILL.md`.
- Registered capability IDs: `world.geometry.build`.
- Runtime execution is strictly allowlisted by `packages/world-runner/index.mjs`; the manifest cannot execute arbitrary commands.
- Shared typed requests and results: `schemas/tool-request.schema.json` and `schemas/tool-result.schema.json`.
- L0/L1/L2 evidence is verified by `packages/validation-engine/index.mjs`, **never by plugin self-report**.

Run the dedicated plugin entrypoint with the indicated arguments:

```bash
node .agents/skills/parametric-component-modeling/scripts/build.mjs --request request.json
```

Executable scripts accept bounded JSON requests and return machine-readable `world-tools/v1` results. Never silently weaken hard requirements, tolerance limits or physics-readiness claims.
