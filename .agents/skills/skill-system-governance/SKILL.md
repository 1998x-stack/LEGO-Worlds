---
name: skill-system-governance
description: Author, revise and validate reusable Agent Skills for Codex, Claude and Pi in the 3D worlds repository. Use for new skill modules, reference/script/asset contracts and skill metadata maintenance.
---

# skill-system-governance

Keep all skills discoverable, testable, nonduplicated and progressively disclosed.

## Trigger and scope

Use only when the request matches the frontmatter description. For unfamiliar source data or safety-critical outputs, state assumptions and do not extrapolate beyond validated capabilities.

## Workflow

1. Read AGENTS.md and docs/skills-system.md; verify no existing skill already owns the workflow.
2. Create a concise canonical .agents/skills/<name>/SKILL.md with YAML name and description.
3. Place detailed domain knowledge under references/, machine-readable templates under assets/, and deterministic scripts under scripts/.
4. Regenerate .claude and .codex entrypoints using scripts/sync-skill-adapters.mjs; Pi automatically discovers .agents skills and uses one Pi-specific router.
5. Run npm run test:skills and npm test; add a unit test when scripts or contract behavior changes.

## Supporting resources

- Before implementation, read [domain contract](references/domain.md).
- Use [input/output template](assets/example.json) as a starting contract, not as measured evidence.
- Run `node .agents/skills/skill-system-governance/scripts/check.mjs` to verify this bundle.
- For changed production code run `npm test` and `npm run build`.

## Stop conditions

Do not claim verified manufacture, certified building safety, flightworthiness or general physics behavior from nominal geometry, OBB previews or template planning. Report unsupported constraints explicitly.
