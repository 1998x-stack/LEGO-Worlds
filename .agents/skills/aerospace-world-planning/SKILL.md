---
name: aerospace-world-planning
description: Design conceptual aircraft, aerospace vehicles and airport-world systems as modular visual and simulation requirements. Use for aircraft model architecture, subsystems, coordinate frames and readiness reviews; never for airworthiness claims.
---

# aerospace-world-planning

Prepare airframe/propulsion/control subsystem interfaces without fabricating flight-critical validation.

## Trigger and scope

Use only when the request matches the frontmatter description. For unfamiliar source data or safety-critical outputs, state assumptions and do not extrapolate beyond validated capabilities.

## Workflow

1. Classify intended output as display model, game asset, educational simulation or actual flight hardware.
2. Define body axes, span/length, materials, mass budgets, surfaces and hierarchical control-surface joints.
3. Separate aerodynamics, structural/FEM, propulsion, power, avionics, flight controls and environmental models.
4. Require datasets, validated CFD/wind-tunnel evidence and test conditions before model-based flight claims.
5. Return a concept/requirements artifact when aerodynamic/structural solvers are unavailable.

## Supporting resources

- Before implementation, read [domain contract](references/domain.md).
- Use [input/output template](assets/example.json) as a starting contract, not as measured evidence.
- Run `node .agents/skills/aerospace-world-planning/scripts/check.mjs` to verify this bundle.
- For changed production code run `npm test` and `npm run build`.

## Stop conditions

Do not claim verified manufacture, certified building safety, flightworthiness or general physics behavior from nominal geometry, OBB previews or template planning. Report unsupported constraints explicitly.

## Registry V2 capability contract

- Machine-readable plugin manifest: [plugin.json](plugin.json); authoritative skill: this `SKILL.md`.
- Registered capability IDs: `aircraft.requirements.plan`.
- Runtime execution is strictly allowlisted by `packages/world-runner/index.mjs`; the manifest cannot execute arbitrary commands.
- Shared typed requests and results: `schemas/tool-request.schema.json` and `schemas/tool-result.schema.json`.
- L0/L1/L2 evidence is verified by `packages/validation-engine/index.mjs`, **never by plugin self-report**.

Run the dedicated plugin entrypoint with the indicated arguments:

```bash
node .agents/skills/aerospace-world-planning/scripts/plan.mjs --prompt "Design a passenger airplane"
```

Executable scripts accept bounded JSON requests and return machine-readable `world-tools/v1` results. Never silently weaken hard requirements, tolerance limits or physics-readiness claims.
