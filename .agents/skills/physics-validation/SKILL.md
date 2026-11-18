---
name: physics-validation
description: Plan and validate the physics readiness of 3D worlds, including materials, structural loads, rigid-body dynamics, collision fidelity, fluid/aero effects and environmental constraints. Use for physical-world claims, never to invent simulation outcomes.
---

# physics-validation

Separate attractive geometric previews from evidence-backed physical simulation.

## Trigger and scope

Use only when the request matches the frontmatter description. For unfamiliar source data or safety-critical outputs, state assumptions and do not extrapolate beyond validated capabilities.

## Workflow

1. State the intended physical question: stress, stability, fatigue, contact, dynamics, airflow or fluids.
2. Specify SI quantities and boundary conditions, material sources, timestep, precision and solver choice.
3. Implement unit and conservation checks first; validate against analytical benchmarks and measured data.
4. Report error budgets, model assumptions, missing meshes/fixtures and nonconverged cases.
5. Gate manufacturing, architecture and flight-critical claims behind qualified external review.

## Supporting resources

- Before implementation, read [domain contract](references/domain.md).
- Use [input/output template](assets/example.json) as a starting contract, not as measured evidence.
- Run `node .agents/skills/physics-validation/scripts/check.mjs` to verify this bundle.
- For changed production code run `npm test` and `npm run build`.

## Stop conditions

Do not claim verified manufacture, certified building safety, flightworthiness or general physics behavior from nominal geometry, OBB previews or template planning. Report unsupported constraints explicitly.

## Registry V2 capability contract

- Machine-readable plugin manifest: [plugin.json](plugin.json); authoritative skill: this `SKILL.md`.
- Registered capability IDs: `world.physics.review`.
- Runtime execution is strictly allowlisted by `packages/world-runner/index.mjs`; the manifest cannot execute arbitrary commands.
- Shared typed requests and results: `schemas/tool-request.schema.json` and `schemas/tool-result.schema.json`.
- L0/L1/L2 evidence is verified by `packages/validation-engine/index.mjs`, **never by plugin self-report**.

**Guidance-only capability:** the registry intentionally marks this workflow non-executable. Its domain references and examples support Agent reasoning, but must not be mistaken for an implemented physical solver. No arbitrary script execution fallback is permitted.
