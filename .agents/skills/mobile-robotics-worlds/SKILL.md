---
name: mobile-robotics-worlds
description: Build and validate educational rovers and mobile robot assemblies using catalog parts and constrained chassis/wheel graphs. Use for six-wheel Mars rover concepts, wheel mounts, sensor payloads and robotics kinematics.
---

# mobile-robotics-worlds

Convert a robot brief into meaningful modular bodies and an inspectable connection graph.

## Trigger and scope

Use only when the request matches the frontmatter description. For unfamiliar source data or safety-critical outputs, state assumptions and do not extrapolate beyond validated capabilities.

## Workflow

1. Extract wheel count, terrain, sensors, steering/suspension/mobility requirements and size limits.
2. Choose exact catalog IDs; separate structural beams, frame, wheels, logical bearings, sensors and optional motors.
3. Generate a graph with explicit port semantics, mark virtual bearings and unsupported actuation.
4. Validate graph and OBB; generate dependent assembly steps and list missing physical subassemblies.
5. Test six-wheel rover counts and independent joint transforms; describe absent rocker-bogie and dynamics honestly.

## Supporting resources

- Before implementation, read [domain contract](references/domain.md).
- Use [input/output template](assets/example.json) as a starting contract, not as measured evidence.
- Run `node .agents/skills/mobile-robotics-worlds/scripts/check.mjs` to verify this bundle.
- For changed production code run `npm test` and `npm run build`.

## Stop conditions

Do not claim verified manufacture, certified building safety, flightworthiness or general physics behavior from nominal geometry, OBB previews or template planning. Report unsupported constraints explicitly.

## Registry V2 capability contract

- Machine-readable plugin manifest: [plugin.json](plugin.json); authoritative skill: this `SKILL.md`.
- Registered capability IDs: `robotics.rover.plan`.
- Runtime execution is strictly allowlisted by `packages/world-runner/index.mjs`; the manifest cannot execute arbitrary commands.
- Shared typed requests and results: `schemas/tool-request.schema.json` and `schemas/tool-result.schema.json`.
- L0/L1/L2 evidence is verified by `packages/validation-engine/index.mjs`, **never by plugin self-report**.

Run the dedicated plugin entrypoint with the indicated arguments:

```bash
node .agents/skills/mobile-robotics-worlds/scripts/plan.mjs --prompt "搭建一辆六轮火星探测车"
```

Executable scripts accept bounded JSON requests and return machine-readable `world-tools/v1` results. Never silently weaken hard requirements, tolerance limits or physics-readiness claims.
