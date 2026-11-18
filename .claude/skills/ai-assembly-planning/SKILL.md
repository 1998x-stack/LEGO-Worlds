---
name: ai-assembly-planning
description: Turn Chinese/English natural-language build requests into catalog BOM, connection graph, joint parameters, ordered assembly steps and solver validation. Use when implementing or auditing the AI assembly Agent; never trust raw model-produced geometry.
---

# ai-assembly-planning — Claude Code entrypoint

This is a thin compatibility entrypoint. The single source of truth is [the canonical skill](../../../.agents/skills/ai-assembly-planning/SKILL.md).

1. Read `../../../.agents/skills/ai-assembly-planning/SKILL.md` fully when this skill is selected.
2. Follow its `references/domain.md` and reuse its `assets/example.json` if needed.
3. Execute supporting scripts from the repository root only after reviewing their source.
4. Honor root `AGENTS.md` and all physical-fidelity and licensing gates.

Do not copy this skill into a divergent provider-specific workflow; edit canonical content and regenerate wrappers.
