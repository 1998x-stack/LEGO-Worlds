# Cross-agent Skills architecture for evolving physical worlds

## Locations and source-of-truth policy

- **Codex** discovers `.agents/skills/<name>/SKILL.md`. The requested `.codex/` contains convenience discovery mirrors and instructions, **not** an alternative official discovery path.
- **Claude Code** discovers `.claude/skills/<name>/SKILL.md` wrappers, which keep only canonical YAML metadata and link to authoritative content.
- **Pi** already discovers the canonical `.agents/skills`; the unique `.pi/skills/pi-world-skills-router` provides project selection guidance without duplicate names.
- Root `AGENTS.md` defines persistent coding/verification rules, while `CLAUDE.md` bridges Claude's context.
- **Required filename is uppercase `SKILL.md`**; lowercase `skill.md` is not portable across these clients.

## First twelve canonical workflows

| Skill | Responsibility | Physical status |
| --- | --- | --- |
| [world-systems-architect](../.agents/skills/world-systems-architect/SKILL.md) | Create an extensible world-system design before writing large physics or scene features. | Requires explicit validation |
| [parametric-component-modeling](../.agents/skills/parametric-component-modeling/SKILL.md) | Create typed, deterministic reusable geometry with explicit dimensional assumptions. | Requires explicit validation |
| [connection-interfaces](../.agents/skills/connection-interfaces/SKILL.md) | Connect geometry to precise local interface frames without conflating nominal and verified fit. | Requires explicit validation |
| [mechanical-constraint-solving](../.agents/skills/mechanical-constraint-solving/SKILL.md) | Make multiple body connections solvable with explicit convergence and failure results. | Requires explicit validation |
| [physics-validation](../.agents/skills/physics-validation/SKILL.md) | Separate attractive geometric previews from evidence-backed physical simulation. | Requires explicit validation |
| [building-world-planning](../.agents/skills/building-world-planning/SKILL.md) | Produce scalable building-world datasets without promising structural or life safety. | Requires explicit validation |
| [aerospace-world-planning](../.agents/skills/aerospace-world-planning/SKILL.md) | Prepare airframe/propulsion/control subsystem interfaces without fabricating flight-critical validation. | Requires explicit validation |
| [mobile-robotics-worlds](../.agents/skills/mobile-robotics-worlds/SKILL.md) | Convert a robot brief into meaningful modular bodies and an inspectable connection graph. | Requires explicit validation |
| [ai-assembly-planning](../.agents/skills/ai-assembly-planning/SKILL.md) | Make generated build plans testable and revalidatable, independent of the language-model proposal. | Requires explicit validation |
| [assembly-sequence-animation](../.agents/skills/assembly-sequence-animation/SKILL.md) | Make reproducible instructional animation plans with explicit dependencies. | Requires explicit validation |
| [asset-quality-release](../.agents/skills/asset-quality-release/SKILL.md) | Maintain stable public assets and reproducible releases. | Requires explicit validation |
| [skill-system-governance](../.agents/skills/skill-system-governance/SKILL.md) | Keep all skills discoverable, testable, nonduplicated and progressively disclosed. | Requires explicit validation |

Every canonical bundle has a short YAML-routed `SKILL.md`, `references/domain.md`, `assets/example.json`, and runnable `scripts/check.mjs`. This is progressive disclosure: readers load only the selected skill and relevant support files, rather than embedding all world-system instructions in every prompt.

## Growing beyond the prototype

When adding a house or high-rise, split by floors/zones/services and manage **m-based site coordinates** separately from the current **mm-based brick/part geometry**. Store structural load cases and building-code check evidence outside the visual scene graph. For an aircraft, separate flight-surface kinematics from aerodynamic, propulsion, controls and structural evidence. Avoid increasing current prototype solver caps (20 bodies, 32 joints, 12 free loop variables) as a substitute for modular scene partitions and scalable graph solvers.

## Skill governance

1. Choose an existing skill by trigger, not by vendor. Extend its canonical domain reference only for its own scope.
2. If no workflow fits, add a new directory and registry entry; provide a useful example contract, verification script, and tests.
3. Keep `.claude`/`.codex` wrapper metadata equal to canonical YAML fields. Do not copy domain instructions into provider wrappers.
4. Use `npm run test:skills`, `npm test`, and `npm run build` as CI gates. Preview WebGL interactions independently when practical.
5. Require explicit evidence tier: concept, geometry, kinematic, physics-tested or externally reviewed.

## Interfaces for future model-driven agents

The current `src/ai-agent.js` is an offline, deterministic and template-grounded baseline. A future LLM adapter may **propose** a JSON graph but never gets to bypass catalog-ID resolution, the graph solver, BOM/step derivation or domain safety gates. Keep model/API credentials server-side and never place them into the GitHub Pages client.

## Future large-world design

For buildings, aircraft, robotics, multiscale units and independently validated physics evidence, read [Physical World Architecture](physical-world-architecture.md). This is a staged design document, not a claim that full physics solvers already exist.

## Registry V2 and executable tool contract

This repository now includes [Agent-Native Plugin Runtime](agent-plugin-runtime.md) with a versioned plugin.json in all 12 canonical skills, pinned sources in registry.lock.json and strongly typed L0/L1/L2 artifacts under schemas/. Unlike SKILL.md instructions, these machine-readable extensions define exact capabilities, dependency DAG, execution readiness, permissions and validator contracts. Eight first-party skills currently have executable entrypoints routed through an allowlisted Node runner; guidance-only skills cannot invoke arbitrary tools.

For native Agent use, run `npm run world:run -- registry` to inspect capabilities; `npm run world:pipeline -- --prompt "搭建一辆六轮火星探测车"` to compile and independently validate; or `npm run world:mcp` to expose the restricted local MCP tool set. No second LLM backend is required.
