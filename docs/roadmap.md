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
- [ ] Support Technic pin/axle/hinge/gear specialized constraint solvers and narrow-phase collision checks.
- [ ] Shareable build URLs using versioned catalog IDs.

## V0.4 — Asset pipeline
- [ ] Generate deterministic GLB and WebP previews in CI.
- [ ] Add geometry and bounding-box regression tests.
- [ ] Add optional LOD and mesh optimization.
- [ ] Add an import contract for reviewed third-party assets with per-asset licensing evidence.

## V1 — Open construction platform
- [ ] Searchable, versioned component database.
- [ ] Public assembly schema and documented connection graph.
- [ ] AI-agent-friendly build recipes and validation.
- [ ] Optional print-oriented export with explicit fit and safety disclaimers.
