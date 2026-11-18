# Architecture

## Product model

Brick Worlds separates reusable geometry, composition data, rendering and presentation.

```text
src/catalog.js
  ├── SERIES
  ├── COMPONENTS
  └── MODELS ───────────────┐
                            v
src/brick-system.js     buildAssembly(model)
  ├── createPart()          |
  ├── primitive factories  v
  └── dimensions        THREE.Group
                            |
                            v
src/connection-anchors.js
  ├── getPartAnchors()
  ├── getAssemblyAnchors()
  ├── compatibility checks
  └── optional debug helpers
                            |
                            v
src/snap-engine.js
  ├── stud/socket rigid alignment
  ├── snap candidate search and collision
  └── versioned assembly JSON
                            |
                            v
src/builder-lab.js     interactive builder
  ├── Three.js drag and ghost previews
  ├── undo/redo and connection edges
  └── JSON import/export
                            |
                            v
src/technic-engine.js
  ├── beam-hole, pin and axle constraints
  ├── keyed wheel/gear mounts
  └── gear-pair ratio and replayable recipes
                            |
                            v
src/mechanics-lab.js
  ├── clickable holes and joint graph
  ├── exploded assembly motion
  └── counter-rotating gear drive
                            |
                            v
src/hierarchy-engine.js
  ├── validated subassembly tree and hinge anchors
  ├── directed angle coupling propagation
  └── generated assembly dependency DAG
                            |
                            v
src/hierarchy-lab.js
  ├── joint sliders, subassembly selection
  ├── reversible piece-by-piece build timeline
  └── preset/pose JSON and static GLB export
                            |
                            v
src/constraint-graph.js
  ├── editable body graph with 4 joint types
  ├── graph spanning forest + loop optimization
  └── OBB collisions and versioned JSON
                            |
                            v
src/constraint-lab.js
  ├── interactive body/port connection editor
  ├── motor targets and live solver diagnostics
  └── static GLB + editable graph export
                            |
                            v
src/viewer.js
  ├── Scene + lights + camera
  ├── OrbitControls
  ├── exploded transforms
  ├── step visibility
  ├── part highlighting
  ├── per-part anchor overlays
  └── GLB export
                            |
                            v
src/main.js  →  gallery / filters / modal / component browser
                            |
                            v
                         Vite dist/
                            |
                            v
                    GitHub Pages (static)
```

## Runtime

The homepage uses one interactive hero viewer. A detail modal mounts a second viewer only while open. The Snap Builder mounts a separate interactive renderer on demand when the user launches the workspace. Closing the modal disposes its animation loop, ResizeObserver, OrbitControls, geometries, materials and WebGL renderer.

The model catalog is plain JavaScript data. Each assembly consists of part manifests with stable IDs, types, transforms, colours and build-step numbers. The geometry factory is deterministic and does not depend on browser state. The connection-anchor layer derives typed local datums from the same part specs, transforms them into assembly coordinates, and provides nominal interface compatibility checks. The viewer can display these datums without including them in exported GLB geometry.

## Coordinate and unit convention

- Authoring units: millimetres.
- Viewer units: metres, by applying a single 0.001 scale to the assembly root.
- Up axis: +Y.
- Ground plane: X/Z.
- Part position: centre of its visual body, in millimetres.
- Rotation: Euler radians, in X/Y/Z order.
- Connection anchors: local part coordinates in millimetres; normals and axes are normalized direction vectors.
- Anchor transforms use the same XYZ Euler rotation and translation as the owning part.

Never scale individual dimensions in the viewer and the assembly root simultaneously. See [connection anchor schema](connection-anchors.md) for the interface contract and current limitations.

## GitHub Pages

Vite's base path is `/LEGO-Worlds/`. The Pages workflow runs tests, builds the static site, uploads `dist/` and deploys it through the GitHub Pages deployment environment. No backend is required.

## Snap Builder

The stud/socket snap solver is independent of the DOM and can be tested under Node.js. The Builder UI creates a separate scene only on user launch and uses a translucent candidate mesh to show ready/blocked/near states. The JSON schema is versioned and stores catalog-based part instances plus computed connection edges. This first implementation deliberately excludes specialized Technic, gear and hinged auto-snap behavior; see [Snap Builder](snap-builder.md).

## Guided Technic assembly

Technic-style mechanical assemblies are handled by `src/technic-engine.js` (independent of the browser) and `src/mechanics-lab.js` (lazy-loaded Three.js scene). The user selects a beam hole, inserts a pin/axle, then mounts a wheel or gear to a compatible shaft. The resulting joint graph contains fixed/revolute constraints and derived spur-gear counter-rotation edges. Mechanism JSON imports are replayed from a validated operation list; untrusted arbitrary edges/poses are not accepted. The gear drive has no force or tooth-contact simulation. See [Technic Mechanics Lab](technic-mechanics.md).

## V0.5 Hierarchical joint and animation layer

The hierarchy engine defines parent-child rigid subassemblies, connected through typed hinge-axis anchors on existing component instances. Joint angles propagate through the tree, while separate directed coupling edges implement mirrored motion subject to validated follower limits and cycle checks. The assembly sequence is generated as a parent-first dependency DAG; its reverse drives schematic disassembly. The browser viewer operates lazily, supports selection/isolation and does not contain the solver. Exported JSON references trusted canonical presets and revalidates motion. See [Hierarchy and Joints](hierarchy-assembly.md) for detailed formulas and physical limitations.

## V0.6 General constraint graph

The multi-connection rigid-body solver does not assume a single parent. Each joint references two independently addressable body-local frames (either native connection anchors or labeled virtual datums). The spanning-forest evaluation propagates poses across any direction of a joint; each extra edge produces a six-dimensional closure residual. A damped finite-difference least-squares search adjusts dependent joint values while preserving controlled targets and limits. Oriented box proxies report overlaps between nonadjacent bodies. The independent `constraint-lab.js` renders the editable 3D workbench; `constraint-graph.js` contains the DOM-free engine and tested versioned JSON schema. See [constraint graph specification](constraint-graph.md). This is not verified physical collision or certified mechanical fitting.

## V0.7 AI assembly planning and multi-provider Skills

The browser's deterministic `src/ai-agent.js` parses supported requests, compiles catalog-based blueprints and sends each generated constraint graph through the existing `validateConstraintGraph` / `solveConstraintGraph` pipeline. BOM and assembly steps are derived from the resulting graph. Import validation discards untrusted BOM, operation history, unverifiable provenance and physical safety claims. The six-wheel rover has ten visualization components and virtual shaft bearings; no real suspension or powertrain is represented.

The engineering instruction layer is intentionally separate from the runtime: root `AGENTS.md`, twelve canonical bundles under `.agents/skills/`, Claude discovery adapters under `.claude/skills/`, Codex mirrors under `.codex/skills/` (Codex officially discovers the canonical .agents path), and a unique Pi-specific router under `.pi/skills/` to avoid duplicate Pi skill names. A Node registry checker and wrapper generator are CI gates. See [skills system](skills-system.md) and [Agent planner](ai-assembly-agent.md).

Future buildings and aircraft require subsystem-level scene partitioning, physics validation, measured material parameters and specialized safety/flight engineering reviews. The current 20-body graph limit must not be treated as a world-scale scene capacity specification.

## V0.8 Agent-Native Plugin Runtime

~~~text
Codex / Claude / Pi agents
        ↓ read SKILL.md and plugin.json
Registry V2: capabilities + dependency DAG + pinned manifest
        ↓ fixed first-party capability dispatch
Tool Runner: plan / build / validate / repair / export
        ├── L0 WorldSpec → traceable requirements and domain subsystems
        ├── L1 GeometryManifest → actual procedural mesh/anchor checks
        ├── L2 AssemblyGraph → constraint solver and OBB diagnostics
        ├── independent ValidationReport, SHA-256 evidence and RepairTrace
        └── authorized JSON bundle export
        ↓
Node CLI / minimal stdio MCP adapter → same trusted engine
~~~

Module boundaries: packages/world-contracts for JSON Schemas and hash lineage; packages/plugin-registry for dependency resolution and lock validation; packages/world-builder for L0/L1 assets; packages/world-domains for building/aircraft requirements-only plans; packages/validation-engine for independent gates; packages/agent-repair for bounded canonical fixes; and packages/world-runner for allowlisted execution. Exports revalidate source artifacts and never trust imported report claims. See [full plugin specification](agent-plugin-runtime.md).

No actual full-world physical engine was added; the building/aircraft adapter currently produces named L0 subsystem requirements without L1/L2 geometry or engineering validation. The local stdio MCP implementation is intentionally restricted and not conformance-certified.

## V0.9 nominal fit and mesh-candidate insertion checks

The `packages/clearance-engine` module reuses the existing catalog, geometry factories and constraint-solver poses. Native bearing-outer / bearing-bore connectors and axle-seat reference datums form a real modeled four-body wheel-bearing example. The L2 independent validator calculates nominal bore/shaft radial and axial engagement; optional bounded mesh triangle SAT + sampled containment reduces static OBB false positives. The optional insertion-path inspector samples one translating rigid body against an explicit list of already-installed parts and returns blocked, incomplete or sampled-clear evidence. It is not CCD or a precise solid CSG kernel. `docs/clearance-v09.md` details assumptions and limitations.
