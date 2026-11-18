# BRICK WORLDS

**Build it. Break it. Understand it.**

[中文说明](README.zh-CN.md) · [Architecture](docs/architecture.md) · [Component system](docs/component-system.md) · [101-piece index](docs/parts-index.md) · [Connection anchors](docs/connection-anchors.md) · [Snap Builder](docs/snap-builder.md) · [Technic Mechanics](docs/technic-mechanics.md) · [Hierarchy & Joints](docs/hierarchy-assembly.md) · [Constraint Graph](docs/constraint-graph.md) · [AI Assembly Agent](docs/ai-assembly-agent.md) · [Skills](docs/skills-system.md) · [Plugin Runtime](docs/agent-plugin-runtime.md) · [Clearance V0.9](docs/clearance-v09.md) · [Physical World Architecture](docs/physical-world-architecture.md) · [Roadmap](docs/roadmap.md)

An independent, open-source 3D brick system explorer. Discover reusable components, inspect original assemblies in 3D, reveal typed connection anchors, explode builds into their constituent parts, follow step-by-step construction sequences, and design small stud-grid builds in the Snap Builder Lab.

> **Unofficial project notice:** This is an independent educational and visualization project. LEGO® is a trademark of the LEGO Group, which does not sponsor, authorize, or endorse this project. This repository uses original procedural geometry and does not distribute LEGO set instructions, logos, minifigure IP, or copied third-party models.

## V0.9 — Nominal Bearing Fit and Insertion Verification

The [Assembly Agent](https://1998x-stack.github.io/LEGO-Worlds/#agent) now recognizes **"装配一个轴承衬套、转轴和轮组"**, and the [Constraint Lab](https://1998x-stack.github.io/LEGO-Worlds/#constraints) offers a new **Sleeve Bearing & Wheel** preset. This adds a modeled hollow sleeve (101st catalog component), native coaxial connector semantics and a reproducible four-body shaft/wheel assembly. Independent L2 validation can now check nominal fit, actual procedural mesh contact candidates and an explicitly staged **sampled** insertion path.

```bash
npm run world:pipeline -- --prompt "装配一个轴承衬套、转轴和轮组" --mesh
node scripts/inspect-bearing-wheel.mjs
node scripts/inspect-bearing-wheel.mjs --blocked
```

The mesh-based static check resolves a known false-positive OBB overlap between an axle and the beam through-hole. **This is not exact CSG, continuous collision detection, measured manufacturing tolerance, structural strength or dynamics validation.** Read the [V0.9 geometric inspection specification](docs/clearance-v09.md).

## Agent-Native World Plugin Runtime (V0.8)

This repository now has a **real first-party Agent Skills execution layer**, not just portable prompt instructions. All **12 canonical Skills** have versioned `plugin.json` capability manifests. Registry V2 resolves plugin dependencies, declares execution readiness and least-privilege permissions, and locks canonical sources. See the [full runtime specification](docs/agent-plugin-runtime.md).

L0 `WorldSpec` captures traceable requirements; L1 `GeometryManifest` records **rebuilt Three.js component geometry bounds and connector datums**; L2 `AssemblyGraph` is checked by the real constraint solver. A separate validator produces content-addressed reports, and a bounded repair loop can normalize safe identifiers without removing hard requirements or relaxing solver limits.

```bash
npm install
npm run test:skills
npm test
npm run build

# Discover all 12 Skills and runnable capabilities
npm run world:run -- registry

# Native Agent workflow: NL request → L0 → L1 → L2
npm run world:pipeline -- --prompt "搭建一辆六轮火星探测车"

# Building/aircraft plans stop at L0 subsystem requirements
npm run world:pipeline -- --prompt "设计一栋10层建筑"

# Optional local MCP stdio adapter (no new LLM backend required)
npm run world:mcp
```

Codex, Claude and Pi can call the same [CLI](adapters/cli/world.mjs), [MCP tools](adapters/mcp/server.mjs), or executable skill scripts. The runtime **never executes a command from an untrusted plugin manifest**, does not permit arbitrary network/subprocess actions, and writes exported JSON only with explicit workspace authorization. Eight first-party Skills currently provide runnable capability entrypoints; the remaining domain workflows are deliberately marked **guidance-only**. The MCP stdio adapter supports a limited set of local tools and has not undergone full interoperability certification.

[Registry V2](.agents/skills/registry.json) · [L0/L1/L2 contracts](schemas/) · [Runner](packages/world-runner/index.mjs) · [Independent validator](packages/validation-engine/index.mjs) · [Bounded repair](packages/agent-repair/index.mjs)

## AI Assembly Agent & cross-platform Skills (V0.7)

**[Open the AI Assembly Agent](https://1998x-stack.github.io/LEGO-Worlds/#agent)**. Enter `搭建一辆六轮火星探测车` to generate a verified conceptual assembly: **10 catalog components, 9 connection graph edges, a structured BOM and ordered build steps**. The plan is checked by the existing constraint solver and simplified OBB collision diagnostics, then can be exported as JSON or opened in the interactive [Constraint Lab](https://1998x-stack.github.io/LEGO-Worlds/#constraints).

The planner currently uses deterministic language matching and approved blueprints — **not an open-ended LLM service**. Supported examples include the six-wheel rover, four-bar linkage, linear carriage, and shaft drive. Buildings and aircraft trigger requirements-first responses rather than unverified physical claims.

To scale into complex world systems, we added **12 canonical Agent Skills** with `SKILL.md`, `references/`, `scripts/`, `assets/`, supported by [AGENTS.md](AGENTS.md), [Codex](.codex/README.md), [Pi](.pi/README.md), and [Claude](.claude/README.md) adapters. See [Skills architecture](docs/skills-system.md).

```bash
npm install
npm run agent:plan -- "搭建一辆六轮火星探测车" > rover-plan.json
npm run agent:validate -- rover-plan.json
npm run test:skills
npm test
npm run build
```

[AI Agent specification](docs/ai-assembly-agent.md) · [Canonical skills](.agents/skills/README.md)

## General Constraint Graph Lab (V0.6)

**[Launch the General Constraint Lab](https://1998x-stack.github.io/LEGO-Worlds/#constraints)**. This release moves beyond strict parent/child assemblies and supports an editable **multi-connection rigid-body graph**. Add bodies from the component catalog, choose two connection datums and create **fixed, hinge, coaxial shaft or linear slider** joints. A damped numerical solver handles simple closed loops and reports incompatible constraints instead of silently violating them.

The lab ships three runnable examples — **Four-Bar Linkage**, **Linear Carriage**, and **Shaft Drive** — with motor controls, joint sliders, visible connection markers, oriented-box collision warnings, live residuals, undo/redo and JSON/GLB export. Only the JSON retains the editable constraints; GLB is a static pose snapshot. Virtual connection datums are schematic and are not proof of physical fit. Read [General Constraint Graph specification](docs/constraint-graph.md).

## Hierarchical Joint & Assembly Lab (V0.5)

**[Launch the Assembly Lab](https://1998x-stack.github.io/LEGO-Worlds/#assembly)** to explore parent-child rigid subassemblies and hinge constraints. This release includes three original demos: **Articulated Crane**, **Twin Drawbridge**, and **Solar Observatory**. Select subassemblies, drive hinge angles, inspect mirrored couplings, show connection anchors, isolate moving branches and play a dependency-based piece-by-piece disassembly/reassembly timeline. Save/reopen the versioned joint recipe or export the current static GLB pose.

The solver propagates 3D rigid transforms through a validated parent tree. Animation trajectories are **schematic, not collision-planned**, and the joint motion is kinematic rather than physical. See [Hierarchy & Joint System](docs/hierarchy-assembly.md).

## Technic Mechanics Lab (V0.4)

**[Open the Mechanics Lab on GitHub Pages](https://1998x-stack.github.io/LEGO-Worlds/#mechanics)**. Assemble pins and cross axles into 8 mm spaced Technic beam holes, mount wheels and spur gears on the axes, inspect a joint/gear-mesh graph, and animate assembly and counter-rotating gear drive. Three ready-made demonstrations include Dual Gear Drive, Wheel & Axle, and Pin Fixture. Save a constrained, replayable JSON build recipe or export GLB geometry.

This is a **guided** mechanical experiment with explicit target-hole selection rather than free-form 6-DOF drag snapping. The drive is kinematic, not a real torque or tooth-contact simulation. See [Technic mechanics specification](docs/technic-mechanics.md).

## Snap Builder Lab (V0.3)

The homepage includes an interactive **Snap Builder** that launches on demand. Choose a brick, plate, tile or jumper, drag it near studs, rotate in 90° increments, preview valid and blocked positions, undo/redo changes, and save or import a versioned assembly JSON file. Geometry can also be exported as GLB. The demo includes a fixed 2×6 foundation plate.

Snapping is intentionally limited to the stud/socket interfaces of grid components. More complex Technic, gear and hinged connections still require specialized constraints and collision checks. See [Snap Builder documentation](docs/snap-builder.md).

## First release

- **101-piece Component Library** — ten families covering bricks, plates, curves, SNOT connectors, Technic, gears, motion, architecture, nature and special elements.
- **Brick System** — foundational bricks, plates, tiles, slopes, jumpers and connection pieces.
- **Technic Mechanics** — beams, pins, axles, gears, wheels and mechanical assemblies.
- **Modular City** — reusable architectural modules and small urban scenes.
- **Creative Lab** — original showcase builds, beginning with *Clockwork Koi Garden*.

The component library contains 101 coded, parameterized component definitions across ten families. Every featured build is assembled from named, reusable parts. The 3D viewer supports orbit, zoom, exploded-view inspection, part selection and guided assembly steps.

## Run locally

Requirements: Node.js 20+ and npm.

```bash
git clone https://github.com/1998x-stack/LEGO-Worlds.git
cd LEGO-Worlds
npm install
npm run dev
```

## Verify and build

```bash
npm test
npm run build
npm run preview
```

## GitHub Pages

The repository includes a GitHub Actions Pages workflow. It builds the Vite site with the project base path `/LEGO-Worlds/` and deploys the `dist/` artifact on pushes to `main`.

Public URL: https://1998x-stack.github.io/LEGO-Worlds/

If Pages has not been enabled for the repository yet, open **Settings → Pages → Build and deployment → Source** and select **GitHub Actions**. The first successful workflow run will publish the site.

## Design system

- **System dimensions:** 8 mm stud pitch, 9.6 mm brick body height, 3.2 mm plate body height, 4.8 mm nominal stud diameter and 1.7 mm nominal stud height.
- **Coordinate convention:** model source dimensions are authored in millimetres; the viewer converts them to metres for Three.js.
- **Geometry:** original procedural meshes generated from reusable part factories.
- **Assembly contract:** each part has a stable ID, type, colour, transform, assembly step and exploded offset.
- **Rendering:** Three.js with OrbitControls, responsive canvas sizing, bounded pixel ratio and explicit disposal.
- **Hosting:** static GitHub Pages; no backend or secrets required.

Dimensions are educational nominal references, not a guarantee of physical compatibility with genuine LEGO elements. Any 3D-printed interlocking part requires tolerance testing with the target printer, material and mating element.

## Repository map

```text
src/
  catalog.js          # Series, component library and assembly manifests
  brick-system.js     # Reusable procedural part geometry
  connection-anchors.js # Typed anchors, coordinate transforms and compatibility
  snap-engine.js       # Rigid stud/socket solver, overlap checks and JSON schema
  technic-engine.js    # Beam pin/axle joints, keyed mounts and gear ratios
  hierarchy-engine.js # Joint tree, angle propagation and assembly steps
  constraint-graph.js # Multi-connection graph, closure solver and OBB checks
  ai-agent.js        # NL intent → BOM → graph → steps → validation
  constraint-lab.js   # Editable kinematic graph, motors and diagnostics
  hierarchy-lab.js    # Interactive hierarchy/hinge animation inspector
  mechanics-lab.js     # Interactive mechanical assembly and drive animation
  builder-lab.js       # Drag/rotate/preview interactive Three.js builder
  viewer.js           # Three.js scene, assembly and exploded-view controls
  main.js             # Gallery, filters, detail panel and interactions
  styles.css          # Responsive Brick Worlds design system
docs/
  architecture.md
  component-system.md
  connection-anchors.md
  snap-builder.md
  technic-mechanics.md
  hierarchy-assembly.md
  constraint-graph.md
  ai-assembly-agent.md
  skills-system.md
  roadmap.md
tests/
  catalog.test.mjs
  connection-anchors.test.mjs
  snap-engine.test.mjs
  technic-engine.test.mjs
  hierarchy-engine.test.mjs
  constraint-graph.test.mjs
  ai-agent.test.mjs
.agents/skills/        # 12 canonical Agent Skills
.codex/skills/         # Codex reference mirrors
.claude/skills/        # Claude Code entrypoints
.pi/skills/            # Unique Pi project router
scripts/               # Skills validation, adapter sync, Agent CLI
AGENTS.md              # Durable agent engineering conventions
.github/workflows/
  pages.yml
```

## Extending the catalog

1. Add a reusable part type or improve an existing factory in `src/brick-system.js`.
2. Add a component entry to `COMPONENTS` in `src/catalog.js` if it belongs in the parts library.
3. Add a model manifest to `MODELS`. Use stable kebab-case IDs, named parts, explicit assembly steps and meaningful exploded offsets.
4. Run `npm test` and `npm run build`.
5. Check the model in the browser at desktop and mobile widths before merging.

Prefer reusable geometry over one-off meshes. A model should explain its construction, not merely look assembled.

## License

MIT. See [LICENSE](LICENSE). Trademark and third-party rights remain with their respective owners.
