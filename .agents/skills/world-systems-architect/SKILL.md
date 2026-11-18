---
name: world-systems-architect
description: Decompose new 3D worlds such as buildings, aircraft, cities or robots into scalable subsystems, physical-domain contracts and validation gates. Use for system architecture and roadmap design; not for creating certified engineering plans.
---

# world-systems-architect

Create an extensible world-system design before writing large physics or scene features.

## Trigger and scope

Use only when the request matches the frontmatter description. For unfamiliar source data or safety-critical outputs, state assumptions and do not extrapolate beyond validated capabilities.

## Workflow

1. Identify world domain, intended audience, scale, time horizon and interactive actions.
2. Partition into geometry, scene graph, mechanical joints, materials, loads, motion, environment, simulation, storage and export subsystems.
3. Define stable interfaces, units, coordinate frames, ID/version policy, fidelity level and provenance.
4. Specify independent subsystem validators and their acceptance evidence; mark unimplemented evidence as pending.
5. Define chunking, LOD, spatial indexes and persistence before lifting existing 20-body constraint-demo limits.

## Supporting resources

- Before implementation, read [domain contract](references/domain.md).
- Use [input/output template](assets/example.json) as a starting contract, not as measured evidence.
- Run `node .agents/skills/world-systems-architect/scripts/check.mjs` to verify this bundle.
- For changed production code run `npm test` and `npm run build`.

## Stop conditions

Do not claim verified manufacture, certified building safety, flightworthiness or general physics behavior from nominal geometry, OBB previews or template planning. Report unsupported constraints explicitly.
