# Snap Builder Lab — V0.3

The Builder Lab is an interactive Three.js proof of concept for **stud-to-socket** construction. It reuses the v1 connection-anchor registry and existing procedural part geometry.

## Implemented in this milestone

- A standalone builder workspace in the GitHub Pages homepage, launched on demand.
- A picker filtered to brick-grid components (bricks, plates, tiles and jumpers).
- Mouse/touch pointer drag previews, selection of placed parts and a fixed 2×6 foundation plate.
- Anchor-pair search with a configurable proximity threshold (13 mm by default).
- Rigid orientation and translation solving for opposed stud/socket face anchors.
- Compensation for the 1.7 mm nominal stud protrusion, so stacked brick bodies meet at their shoulders.
- Conservative box-based overlap detection for the supported brick-grid body types.
- Green (valid), red (body overlap), and amber (unmatched) ghost previews.
- 90° yaw control, ±3.2 mm vertical controls, undo/redo, deletion and reset camera.
- Versioned JSON assembly export/import, with validated part records and recomputed connection edges.
- GLB export of generated geometry (connection graph remains in JSON).
- Unit tests for geometry transforms, fit checks, collisions, serialization and malformed inputs.

## How to use

1. In GitHub Pages, open **Builder** and select **Launch snap builder**.
2. Pick a supported part and click **Add selected part**.
3. Move the pointer over a plate/brick. The ghost searches compatible stud/socket anchors.
4. **Green:** press/release to confirm placement. **Amber:** no candidate within threshold. **Red:** candidate intersects a solid brick body.
5. Select and drag an existing part to move it, or click **Rotate 90°** and the height buttons while previewing.
6. Export a JSON file to preserve part IDs, transforms and the connection graph. Import it later to reconstruct the build.
7. Use **Export GLB** for the visual geometry mesh only.

The initial platform is a fixed 2×6 plate. The builder limits itself to 64 parts to keep the demo responsive.

## Solver anatomy

The solver lives in src/snap-engine.js, with the interactive canvas in src/builder-lab.js.

- getPartAnchors(...) enumerates the local stud/socket interface points.
- worldAnchor(...) transforms a local anchor by its part's current pose.
- findSnapCandidate(...) finds compatible nearby pairs, solves a candidate transform and rejects body overlap.
- solveAnchorAlignment(...) rotates the moving normal opposite to the fixed normal, then translates its anchor to the mating datum (with stud insertion offset).
- bodyCollision(...) conservatively checks whether the **body AABBs** overlap by more than 0.2 mm.
- collectConnections(...) emits graph edges for geometrically coincident, compatible and seated stud/socket pairs.
- serializeBuild(...) and parseBuild(...) create and validate the versioned JSON contract.

The data is authored in millimetres and the Three.js scene scales the entire assembly root to metres once. An anchor's stored stud position is its tip. To seat a stud, the solver shifts the receiving socket inward by the 1.7 mm nominal stud height.

## Assembly JSON contract

~~~json
{
  "schemaVersion": 1,
  "anchorSchemaVersion": 1,
  "units": "mm",
  "parts": [
    {
      "instanceId": "foundation",
      "componentId": "plate-2x6",
      "pos": [0, 1.6, 0],
      "rotation": [0, 0, 0]
    }
  ],
  "connections": []
}
~~~

Imports are validated against the existing catalog, bounded transforms, unique instance IDs, supported types and body overlap. Untrusted imported connections are deliberately ignored and recalculated from the stored poses.

## Current boundaries

**Not a general physical assembly solver.** The v1 snapping workspace commits stud/socket brick-grid joints only. Technic pins, holes, axles, gears, bearings, ball joints and hinges have anchor metadata but are not yet enabled as auto-snap builder targets. Those need interface-specific insertion geometry, rotation degrees of freedom, gear meshing and narrow-phase collision checks.

The body collision check is a conservative axis-aligned bounding-box approximation after rotation. It is not a mesh-level narrow-phase contact solver. Detected fit is nominal and educational; it is not a production tolerance, clutch force or 3D-print compatibility guarantee.

There is no gravity, structural stability simulation, assembly animation, automatic multi-step planning, WebXR, or AI agent in this milestone.

## Recommended next work

1. Add specialized pin-to-hole and axle-to-cross-bore alignment/insertion rules, based on accurate cross-sectional geometry.
2. Add a spatial hash or KD-tree to index available anchors as assemblies grow.
3. Build narrow-phase mesh/capsule collision tests and occupancy flags for snapped interfaces.
4. Store multi-joint constraints, subassemblies and an explicit hierarchical connection graph.
5. Add automated build-sequence generation from the graph, including exploded motion paths.
6. Introduce AI build recipes that emit the same versioned assembly schema and pass the same validators.
