---
name: mechanical-constraint-solving
description: Extend the general rigid-body constraint graph, revolute/shaft/slider/fixed joints, loop closure or numerical kinematics. Use for assembly motion, graph validity, collision and solver performance; not for torque or CAD certification.
---

# mechanical-constraint-solving

Make multiple body connections solvable with explicit convergence and failure results.

## Trigger and scope

Use only when the request matches the frontmatter description. For unfamiliar source data or safety-critical outputs, state assumptions and do not extrapolate beyond validated capabilities.

## Workflow

1. Read src/constraint-graph.js, docs/constraint-graph.md, tests/constraint-graph.test.mjs.
2. Define graph nodes, typed port frames, joints, reference body and allowed degrees of freedom.
3. Propagate spanning-forest transforms, then add cycle residuals and bounded damped least-squares.
4. Validate joint limits, finite input, loop closure tolerance and bounded free variables; reject incompatible loops.
5. Use OBB diagnostics as warnings, not a narrow-phase no-interference proof; cover singular and unsatisfiable cases.

## Supporting resources

- Before implementation, read [domain contract](references/domain.md).
- Use [input/output template](assets/example.json) as a starting contract, not as measured evidence.
- Run `node .agents/skills/mechanical-constraint-solving/scripts/check.mjs` to verify this bundle.
- For changed production code run `npm test` and `npm run build`.

## Stop conditions

Do not claim verified manufacture, certified building safety, flightworthiness or general physics behavior from nominal geometry, OBB previews or template planning. Report unsupported constraints explicitly.

## Registry V2 capability contract

- Machine-readable plugin manifest: [plugin.json](plugin.json); authoritative skill: this `SKILL.md`.
- Registered capability IDs: `world.kinematics.validate`.
- Runtime execution is strictly allowlisted by `packages/world-runner/index.mjs`; the manifest cannot execute arbitrary commands.
- Shared typed requests and results: `schemas/tool-request.schema.json` and `schemas/tool-result.schema.json`.
- L0/L1/L2 evidence is verified by `packages/validation-engine/index.mjs`, **never by plugin self-report**.

Run the dedicated plugin entrypoint with the indicated arguments:

```bash
node .agents/skills/mechanical-constraint-solving/scripts/validate.mjs --request request.json
```

Executable scripts accept bounded JSON requests and return machine-readable `world-tools/v1` results. Never silently weaken hard requirements, tolerance limits or physics-readiness claims.
