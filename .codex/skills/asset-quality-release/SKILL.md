---
name: asset-quality-release
description: Review procedural meshes, schema stability, 3D asset performance, tests, documentation and GitHub Pages release readiness. Use for quality gates, asset import or production deployment.
---

# asset-quality-release — Codex reference entrypoint

This is a thin compatibility entrypoint. The single source of truth is [the canonical skill](../../../.agents/skills/asset-quality-release/SKILL.md).

1. Read `../../../.agents/skills/asset-quality-release/SKILL.md` fully when this skill is selected.
2. Follow its `references/domain.md` and reuse its `assets/example.json` if needed.
3. Execute supporting scripts from the repository root only after reviewing their source.
4. Honor root `AGENTS.md` and all physical-fidelity and licensing gates.

Do not copy this skill into a divergent provider-specific workflow; edit canonical content and regenerate wrappers.
