# Agent-Native Plugin Runtime — Registry V2 / L0-L2

**Implementation status:** Available for the built-in first-party capabilities listed below. This is a software-verifiable concept/kinematic platform, not a manufacturing, structural engineering or airworthiness approval system.

## 1. Design principles

1. **Agent Skills are the workflow layer**, not an unrestricted code execution mechanism. Each of the 12 canonical Skill folders owns SKILL.md, references, assets, scripts, and a plugin.json manifest.
2. **Registry V2 describes capability discovery, graph dependencies, permissions and execution readiness.** Guidance-only skills must not be reported as executable.
3. **The Runner is the only execution boundary.** It maps a fixed allowlist of capabilities to built-in TypeScript/JavaScript functionality; it never evaluates a path/command taken from untrusted JSON.
4. **L0/L1/L2 each have independent validation.** An agent may propose or repair geometry, but cannot change the validation rules or fabricate pass evidence.
5. **Every artifact is content-addressed** using SHA-256 over normalized JSON and has an explicit lineage to its source artifacts.
6. **All exports are revalidated.** Any purported validation report included in an input is ignored and replaced with a freshly computed report.

## 2. Files and architecture

~~~text
AGENTS.md
.agents/skills/registry.json              # Registry V2
.agents/skills/registry.lock.json         # Git blob content hashes, version pins
.agents/skills/<id>/SKILL.md              # Agent Skills standard
.agents/skills/<id>/plugin.json           # World plugin extension
.agents/skills/<id>/references/
.agents/skills/<id>/scripts/{check,plan,build,...}.mjs
.agents/skills/<id>/assets/
schemas/
  plugin-manifest.schema.json
  world-spec.schema.json                  # L0
  geometry-manifest.schema.json           # L1
  assembly-graph.schema.json              # L2
  validation-report.schema.json
  repair-trace.schema.json
  world-artifact.schema.json
  tool-request.schema.json
  tool-result.schema.json
packages/
  world-contracts/index.mjs               # AJV JSON Schema and content hash
  plugin-registry/index.mjs               # discovery, deps, readiness, lock
  world-builder/index.mjs                 # real procedural bounds/anchors
  world-domains/index.mjs                 # L0 building and aircraft systems
  validation-engine/index.mjs             # independent L0/L1/L2 checks
  agent-repair/index.mjs                  # bounded, conservative repair
  world-runner/index.mjs                  # tool operations and export permissions
adapters/
  cli/world.mjs
  mcp/server.mjs
~~~

The existing src/brick-system.js, src/connection-anchors.js, src/constraint-graph.js and src/ai-agent.js remain the engine. There is no replacement or duplicate mechanical solver.

## 3. Registry V2

Every plugin manifest declares:

- ID and semantic version;
- canonical skill path and owning domain;
- capability IDs, operation types, required L-level, produced artifact kind and readiness;
- dependencies resolved as an acyclic plugin DAG;
- execution mode: builtin or guidance-only;
- limited filesystem permissions, no network or subprocess permission;
- validation gates per L-level and shared request/result Schema.

The registry loader checks metadata consistency, unique IDs, capability duplicates, safe dependency paths and cycles. Lock entries pin the blob SHA-1 of plugin.json and canonical SKILL.md and pin the global registry. These are reproducibility/integrity checks **within the repository**, not cryptographic publisher signatures. A trusted repository owner could update both a file and its lock.

Current core runnable capabilities:

| Capability | Operation | Level | Implementation |
| --- | --- | --- | --- |
| world.assembly.plan | plan | L0 | Natural language / local blueprint |
| robotics.rover.plan | plan | L0 | Supported educational rover |
| world.requirements.plan | plan | L0 | Requirements compiler |
| building.requirements.plan | plan | L0 | Requirements and 6 building subsystems |
| aircraft.requirements.plan | plan | L0 | Requirements and 6 aircraft subsystems |
| world.geometry.build | build | L1 | Rebuild procedural geometry and anchor ports |
| world.kinematics.validate | validate | L2 | Independent L0–L2 verification |
| world.assembly.repair | repair | L2 | Bounded safe canonicalization and diagnostics |
| world.artifact.export | export | L0+ | Revalidate, emit JSON bundle |

Connection authoring, full dynamics, physics review and animation guidance skills without a runner implementation remain **guidance-only**. They cannot be called as if they were real solvers.

## 4. Tool Execution Contract

The canonical machine input is:

~~~json
{
  "protocolVersion": "world-tools/v1",
  "operation": "plan",
  "capability": "world.assembly.plan",
  "input": {"prompt": "搭建一辆六轮火星探测车"},
  "options": {"targetLevel": "L2"}
}
~~~

Operations:

- **plan** → a typed, content-addressed L0 WorldSpec and, for known intents, a catalog-backed assembly proposal.
- **build** → L1 GeometryManifest with actual procedural mesh bounding boxes, component instances, solved rest poses and anchor IDs; and an L2 **candidate** AssemblyGraph. Candidates do not self-certify.
- **validate** → L0 hard requirement checks, L1 geometry reconstruction/anchor comparisons, L2 graph and kinematic closure checks plus OBB proxy warnings.
- **repair** → only unambiguous casing/encoding normalization by default; optional external Agent candidate callback must pass every validation gate. Hard user constraints are preserved; max 5 repairs.
- **export** → recomputes validation and returns a versioned JSON bundle. A file is written only with an explicit workspace and allow-write authorization, relative .json path, no symlink traversal and no overwrites.
- **pipeline** → convenience orchestration of plan, build and validate; this is not a separate unreviewed execution capability.

The shared result distinguishes **ok / needs_revision / unsupported / failed** and includes structured diagnostics, output artifacts and supporting data.

## 5. L0 WorldSpec

Checks:

- Schema version, requirement property/type, immutable original intent and source.
- Hard wheel count against actual graph wheel instances (no silent 6→4 changes).
- Duplicate and malformed requirement rejection.
- Building/aircraft floor data and separate L0 subsystem plans.
- Unresolved requirements remain explicit WARN and never imply L1/L2 readiness.

Building subsystem requirements: site, architecture, structure, services (MEP), life safety, operations. Aircraft: airframe, propulsion, flight controls, aerodynamics, landing gear, avionics. All are requirements-only until domain solvers exist.

## 6. L1 GeometryManifest

L1 build calls the existing procedural Three.js component factory in Node, constructs real geometry, records bounds and named interface ports, and disposes temporary geometries/materials. Its independent validator **rebuilds the geometry** and checks the claimed bounds against the generated mesh and anchors.

Current achieved evidence covers finite procedural geometry and nominal anchor port references. L1 does **not** assert mesh watertightness, manufacturing tolerances, browser GPU rendering, exporter reliability or material strength. Such checks are NOT_RUN.

## 7. L2 AssemblyGraph

L2 validation runs the existing multi-body constraint graph:

- Current limits: 20 bodies, 32 joint edges, 12 free closure variables.
- Fixed, revolute hinge, coaxial shaft and linear prismatic joint types.
- Closed-loop numerical solver with bounded iteration count and exact port IDs.
- A **weighted** closure residual combining translation and scaled angular error; not a physical millimetre tolerance guarantee.
- OBB overlap warnings on nonadjacent body pairs. Connected neighbors, swept motion and narrow-phase mesh contacts are not covered.
- One initial configuration is checked; full motion-space correctness is NOT_RUN.

The report retains explicit PASS/WARN/FAIL/NOT_RUN/NOT_APPLICABLE values.

## 8. Agent Repair Loop

The repair loop is bounded, replayable and has an audit trail.

~~~text
candidate -> independent diagnostics
          -> if valid: stop
          -> if unsafe/unrepairable: return needs_revision
          -> else apply one unambiguous canonicalization or Agent-proposed JSON edit
          -> preserve hard requirements / source data
          -> independent diagnostics again
          -> stop after at most 5 repair rounds
~~~

Automatically safe repairs include exact case normalization of component/port names and numeric-string encoding. The loop **never** deletes required wheels, changes joint topology, relaxes joint limits, changes tolerance thresholds or invents new structural/flight evidence.

Output RepairTrace records hashes for each candidate, diagnostics, attempted repair and final outcome. A future Agent can inspect the trace and propose a new candidate while the deterministic verifier remains authoritative.

## 9. Running from Codex / Claude / Pi

No new LLM backend is needed. Existing coding Agents load the canonical SKILL.md, then call the scripts or shared CLI through their authorized execution mechanisms.

~~~bash
npm install
npm run test:skills
npm test
npm run build

# Discover capabilities, execution readiness and deps
npm run world:run -- registry

# Single plan operation
npm run world:run -- plan --prompt "搭建一辆六轮火星探测车"

# End-to-end L0 → L1 → L2 (stdout JSON)
npm run world:pipeline -- --prompt "搭建一辆六轮火星探测车"

# Requirements-only: no invented building physics/airworthiness
npm run world:pipeline -- --prompt "设计一栋10层建筑"

# Pin source manifests after an intentional plugin/Skill change
npm run registry:lock
~~~

Direct canonical Skill entrypoints:

~~~bash
node .agents/skills/ai-assembly-planning/scripts/plan.mjs --prompt "搭建一辆六轮火星探测车"
node .agents/skills/building-world-planning/scripts/plan.mjs --prompt "设计一栋10层建筑"
~~~

For build/validate/repair/export, put a world-tools/v1 request in request.json and invoke the appropriate Skill script with --request request.json.

## 10. MCP stdio adapter

Run the minimal local JSON-RPC tool adapter:

~~~bash
npm run world:mcp
# equivalent: node adapters/mcp/server.mjs
~~~

Configure your coding Agent's MCP client to launch Node with the absolute repository path to adapters/mcp/server.mjs. Do not proxy the user's entire filesystem into an HTTP server.

Exposed tools:
- world_registry
- world_plan
- world_build
- world_validate
- world_repair
- world_export
- world_pipeline

The stdio adapter supports the 2025-11-25 initialization/tool envelopes and the 2026-07-28 stateless tool envelope flavor for its bounded tool operations. It is a minimal project-specific MCP adapter, **not a fully conformance-certified MCP SDK/server**. The export MCP tool returns JSON only and cannot write files.

MCP exposes the same trusted runner; it cannot elevate plugin permissions, execute arbitrary shell commands, access network APIs or cause files to be published.

## 11. Verification gates and known limits

CI must run schema/registry lock verification, unit and adversarial tests, CLI/MCP stdio smoke tests, and the original Vite production build. Browser WebGL acceptance still requires a separate browser/device check.

This release supports L0–L2 **selected software capabilities**, not real-world structural, aerodynamic, force, torque, friction, rock terrain or manufacturing physics. A green CI run proves tested code paths, not physical correctness.

Future: optional external provider proposals are strictly data, checked by the same runner; domain physics solvers and full collision paths must be implemented and benchmarked before higher verification tiers can be claimed.
