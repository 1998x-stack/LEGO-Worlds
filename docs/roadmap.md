# Roadmap

## V0.1 — Foundation
- [x] Three core series: Brick System, Technic Mechanics and Modular City.
- [x] Reusable procedural component factories.
- [x] Assembly manifests with named parts and build steps.
- [x] Interactive Three.js viewer, orbit/zoom, exploded view and part highlighting.
- [x] Original Creative Lab showcase: Clockwork Koi Garden.
- [x] Responsive, colour-themed GitHub Pages site and CI deployment workflow.

## V0.2 — Assembly depth
- [x] Publish 100 coded, parameterized component definitions across ten families.
- [x] Add 46 procedural geometry factory types and geometry regression coverage.
- [x] Add per-instance connection anchor coordinates and typed compatibility rules for all 100 catalogue components.
- [x] Add optional 3D anchor overlays to the assembly inspector.
- [x] Implement rigid stud/socket alignment, snap candidates and conservative brick-body collision checks.
- [ ] Add animated assembly transitions and per-part isolation.
- [ ] Add assembly BOM export (JSON/CSV).
- [ ] Add model thumbnails generated from the same source manifests.

## V0.3 — Builder
- [x] Drag-and-drop standard brick-grid parts onto compatible stud/socket interfaces.
- [x] Snap candidates, alignment previews and conservative box collision warnings.
- [x] Save and restore custom assemblies as versioned JSON with recalculated connection edges.
- [x] Undo/redo, 90-degree rotation, vertical adjustment and GLB export.
- [x] Add guided Technic beam-hole, pin, axle, keyed gear/wheel mounting and live joint graph.
- [x] Add matching spur-gear kinematic counter-rotation and mechanical assemble/disassemble animation.
- [ ] Add full free-form Technic dragging, arbitrary hinges and narrow-phase collision checks.
- [ ] Shareable build URLs using versioned catalog IDs.

## V0.4 — Technic assembly
- [x] Correct gear/wheel visual bores and replace round axle visuals with a keyed cross profile.
- [x] Publish the guided Mechanics Lab with three playable presets and canonical JSON recipe replay.
- [ ] Add genuine gear tooth contact, physical bearings and flexible mechanical constraints.
- [x] Add multiple articulated subassemblies with revolute hinge pivots and hierarchical transform propagation.

## V0.5 — Hierarchy, hinge constraints and assembly animations
- [x] Create validated parent-child rigid subassembly trees with hinge-axis connector references.
- [x] Propagate arbitrary-depth hinge transforms and directed joint couplings.
- [x] Validate coupling DAG cycles, follower limits and anchor references.
- [x] Generate parent-first part assembly dependencies and play reverse disassembly steps.
- [x] Add an interactive 3D hierarchy inspector with joint sliders, motor demo, isolate and timeline.
- [x] Ship three original presets with versioned joint recipe export/import.
- [x] Introduce graph-based multiple connections and numerical simple closed-loop closure in V0.6.
- [ ] Add mesh narrow-phase and continuous collision-aware assembly motion planning; true dynamics remain future work.

## V0.6 — General constraint graphs and closed-loop motion
- [x] Add editable rigid-body graph with fixed, hinge, shaft and prismatic slider joints.
- [x] Use native connection anchor and virtual reference-port frames for arbitrary graph edges.
- [x] Solve multi-connection closed loops using damped least-squares joint optimization.
- [x] Reject invalid cycles, unsupported references, impossible loop closures and malformed imported graph files.
- [x] Detect approximate collisions using oriented bounding boxes, excluding directly connected bodies.
- [x] Add Four-Bar Linkage, Linear Carriage and Shaft Drive presets with live motor preview and diagnostics.
- [x] Integrate graph editor, body/port selectors, import/export and undo/redo into GitHub Pages.
- [ ] Add connector-specific physical fit, geometric mesh narrow-phase and CCD.
- [ ] Add generalized loop-closure branch finding and dynamic torque/friction models.

## V0.7 — Physical-world Skills and natural-language Assembly Agent
- [x] Add AGENTS.md and 12 canonical domain Skills, each with SKILL.md, references, scripts and assets.
- [x] Integrate Codex, Claude and Pi entrypoints without Pi duplicate-name collisions.
- [x] Add skill registry validation, adapter synchronization and npm/CI verification.
- [x] Implement deterministic Chinese/English natural-language request routing and approved assembly blueprints.
- [x] Generate a conceptual six-wheel Mars rover with ten parts, nine connections, BOM and step dependencies.
- [x] Reuse existing kinematics and OBB collision validation with explicit pending physical gates.
- [x] Display the plan in the browser, export JSON and load the graph into the Three.js Constraint Lab.
- [x] Return requirements-only responses for unsupported structural building and flight-critical aircraft requests.
- [ ] Add model-backed plan proposals behind a server-side permission/validation boundary.
- [ ] Add rover suspension, actual wheel axle geometries, motors and terrain-dynamics checks.

## V0.8 — Asset pipeline
- [ ] Generate deterministic GLB and WebP previews in CI.
- [ ] Add geometry and bounding-box regression tests.
- [ ] Add optional LOD and mesh optimization.
- [ ] Add an import contract for reviewed third-party assets with per-asset licensing evidence.

## V1 — Open construction platform
- [ ] Searchable, versioned component database.
- [ ] Public assembly schema and documented connection graph.
- [x] Versioned, template-grounded agent recipes and independent validation; unconstrained LLM generation is still planned.
- [ ] Optional print-oriented export with explicit fit and safety disclaimers.
