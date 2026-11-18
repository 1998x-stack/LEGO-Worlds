---
name: pi-world-skills-router
description: Help Pi coding agent choose the 3D Worlds canonical domain skill for procedural geometry, constraint graphs, robotics, buildings, aircraft, simulation and agent plans. Use for routing only, not as an alternative implementation of the domain skills.
---

# Pi world skills router

Pi discovers the 12 canonical skills in `.agents/skills/` directly. Do **not** add duplicate copies of them to `.pi/skills`: Pi warns about duplicate skill names.

1. Read `../../../.agents/skills/registry.json` to find the skill matching the task.
2. Read the matching `../../../.agents/skills/<name>/SKILL.md` and supporting references on demand.
3. Run approved scripts from the repository root only, and follow `AGENTS.md` safety/verification boundaries.
4. Use `node scripts/validate-skills.mjs` to verify the skill registry.
