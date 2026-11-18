# Claude Code integration

Claude Code discovers `.claude/skills/<name>/SKILL.md`. These wrappers retain full YAML triggers but delegate to the canonical `.agents/skills/<name>/SKILL.md` for workflows, references, assets and scripts. This avoids maintaining several divergent copies while keeping native skill discovery. Root `CLAUDE.md` points to `AGENTS.md`.
