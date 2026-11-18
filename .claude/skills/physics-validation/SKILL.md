---
name: physics-validation
description: Plan and validate the physics readiness of 3D worlds, including materials, structural loads, rigid-body dynamics, collision fidelity, fluid/aero effects and environmental constraints. Use for physical-world claims, never to invent simulation outcomes.
---

# physics-validation — Claude Code entrypoint

This is a thin compatibility entrypoint. The single source of truth is [the canonical skill](../../../.agents/skills/physics-validation/SKILL.md).

1. Read `../../../.agents/skills/physics-validation/SKILL.md` fully when this skill is selected.
2. Follow its `references/domain.md` and reuse its `assets/example.json` if needed.
3. Execute supporting scripts from the repository root only after reviewing their source.
4. Honor root `AGENTS.md` and all physical-fidelity and licensing gates.

Do not copy this skill into a divergent provider-specific workflow; edit canonical content and regenerate wrappers.
