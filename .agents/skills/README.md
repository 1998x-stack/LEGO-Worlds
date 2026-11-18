# 3D-World skills registry

The **canonical** skill source lives here. All 12 skills conform to Agent Skills: each has `SKILL.md`, `references/domain.md`, `scripts/check.mjs`, and `assets/example.json`.

Codex and Pi can automatically discover this directory. Claude Code entrypoints are in `.claude/skills`; human-accessible Codex mirrors are in `.codex/skills`. Pi **also** scans `.pi/skills`, so Pi gets only a uniquely named project router there to avoid duplicate skill names.

Run `npm run test:skills` before adding or modifying a skill.

See `docs/skills-system.md` and `AGENTS.md`.
