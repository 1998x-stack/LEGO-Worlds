# 3D-World skills registry

The **canonical** skill source lives here. All 12 skills conform to Agent Skills: each has `SKILL.md`, `references/domain.md`, `scripts/check.mjs`, and `assets/example.json`.

Codex and Pi can automatically discover this directory. Claude Code entrypoints are in `.claude/skills`; human-accessible Codex mirrors are in `.codex/skills`. Pi **also** scans `.pi/skills`, so Pi gets only a uniquely named project router there to avoid duplicate skill names.

Run `npm run test:skills` before adding or modifying a skill.

See `docs/skills-system.md` and `AGENTS.md`.

## Executable first-party world plugins

Each of the 12 canonical Skills now also includes `plugin.json`: capability ID, readiness, version, dependency DAG, required evidence level and permissions. The authoritative metadata index is `registry.json`; `registry.lock.json` pins SKILL.md and manifest content using Git blob hashes. The lock is an integrity guard, not a publisher signature.

The first-party executable skills provide dedicated `scripts/{plan,build,validate,repair,export}.mjs` as appropriate. They only delegate to the allowlisted `packages/world-runner` and cannot run arbitrary commands declared by plugin JSON. Other Skills remain guidance-only.

```bash
npm run world:run -- registry
npm run world:pipeline -- --prompt "搭建一辆六轮火星探测车"
npm run registry:lock        # update after intentional source changes
npm run test:skills
```

See `docs/agent-plugin-runtime.md` for ToolRequest, schema, CLI and MCP semantics.
