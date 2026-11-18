# Pi integration

Pi loads the 12 canonical `.agents/skills/<skill>/SKILL.md` bundles in this repo. The one project-specific Pi router under `.pi/skills/pi-world-skills-router` provides cross-skill routing without duplicate names. Do not mirror all canonical skills into `.pi/skills`, because Pi scans both directories and reports collisions. Use `/skill:<canonical-skill-name>` to select a skill explicitly.

No project MCP keys or API credentials are stored here. See `docs/skills-system.md`.
