---
name: assembly-sequence-animation
description: Generate and review assembly/disassembly step dependency DAGs, exploded paths, and Three.js step animations. Use for instruction generation and subassembly ordering; not for claiming collision-free robot motion.
---

# assembly-sequence-animation

Make reproducible instructional animation plans with explicit dependencies.

## Trigger and scope

Use only when the request matches the frontmatter description. For unfamiliar source data or safety-critical outputs, state assumptions and do not extrapolate beyond validated capabilities.

## Workflow

1. Read src/hierarchy-engine.js and src/ai-agent.js step plan builders.
2. Build a parent-first or graph-spanning dependency plan, including closing edges after both bodies are installed.
3. Define stable step IDs, part names, preconditions, order and illustrative approach vectors.
4. Provide reversible timeline interpolation without changing structural constraint records.
5. For physical assembly, separately plan insertion access, swept collisions, tool clearance and stability.

## Supporting resources

- Before implementation, read [domain contract](references/domain.md).
- Use [input/output template](assets/example.json) as a starting contract, not as measured evidence.
- Run `node .agents/skills/assembly-sequence-animation/scripts/check.mjs` to verify this bundle.
- For changed production code run `npm test` and `npm run build`.

## Stop conditions

Do not claim verified manufacture, certified building safety, flightworthiness or general physics behavior from nominal geometry, OBB previews or template planning. Report unsupported constraints explicitly.

## Registry V2 capability contract

- Machine-readable plugin manifest: [plugin.json](plugin.json); authoritative skill: this `SKILL.md`.
- Registered capability IDs: `world.assembly.animation`.
- Runtime execution is strictly allowlisted by `packages/world-runner/index.mjs`; the manifest cannot execute arbitrary commands.
- Shared typed requests and results: `schemas/tool-request.schema.json` and `schemas/tool-result.schema.json`.
- L0/L1/L2 evidence is verified by `packages/validation-engine/index.mjs`, **never by plugin self-report**.

**Guidance-only capability:** the registry intentionally marks this workflow non-executable. Its domain references and examples support Agent reasoning, but must not be mistaken for an implemented physical solver. No arbitrary script execution fallback is permitted.
