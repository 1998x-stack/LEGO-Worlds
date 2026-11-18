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
