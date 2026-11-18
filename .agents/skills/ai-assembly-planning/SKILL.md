---
name: ai-assembly-planning
description: Turn Chinese/English natural-language build requests into catalog BOM, connection graph, joint parameters, ordered assembly steps and solver validation. Use when implementing or auditing the AI assembly Agent; never trust raw model-produced geometry.
---

# ai-assembly-planning

Make generated build plans testable and revalidatable, independent of the language-model proposal.

## Trigger and scope

Use only when the request matches the frontmatter description. For unfamiliar source data or safety-critical outputs, state assumptions and do not extrapolate beyond validated capabilities.

## Workflow

1. Parse user constraints and intent; preserve explicit part counts rather than silently altering them.
2. Select an approved local blueprint or construct a typed proposal under a bounded grammar.
3. Resolve every proposed component ID and port ID against catalog and anchor contracts.
4. Invoke validateConstraintGraph and solveConstraintGraph; reject malformed loops, summarize OBB warnings.
5. Derive BOM and assembly steps from the verified graph, not from untrusted text.
6. Emit provenance, readiness tier, missing physics checks and editable JSON; never auto-publish as certified STL.

## Supporting resources

- Before implementation, read [domain contract](references/domain.md).
- Use [input/output template](assets/example.json) as a starting contract, not as measured evidence.
- Run `node .agents/skills/ai-assembly-planning/scripts/check.mjs` to verify this bundle.
- For changed production code run `npm test` and `npm run build`.

## Stop conditions

Do not claim verified manufacture, certified building safety, flightworthiness or general physics behavior from nominal geometry, OBB previews or template planning. Report unsupported constraints explicitly.

## Registry V2 capability contract

- Machine-readable plugin manifest: [plugin.json](plugin.json); authoritative skill: this `SKILL.md`.
- Registered capability IDs: `world.assembly.plan`, `world.assembly.repair`.
- Runtime execution is strictly allowlisted by `packages/world-runner/index.mjs`; the manifest cannot execute arbitrary commands.
- Shared typed requests and results: `schemas/tool-request.schema.json` and `schemas/tool-result.schema.json`.
- L0/L1/L2 evidence is verified by `packages/validation-engine/index.mjs`, **never by plugin self-report**.

Run the dedicated plugin entrypoint with the indicated arguments:

```bash
node .agents/skills/ai-assembly-planning/scripts/plan.mjs --prompt "搭建一辆六轮火星探测车"
```

Executable scripts accept bounded JSON requests and return machine-readable `world-tools/v1` results. Never silently weaken hard requirements, tolerance limits or physics-readiness claims.
