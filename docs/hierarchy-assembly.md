# Hierarchical Assembly & Joint Constraints (V0.5)

The Hierarchy Lab extends LEGO-Worlds from a fixed mechanical beam to **multiple rigid subassemblies connected by revolute or fixed joints**. Each hinged subassembly inherits the motion of its parents. Directed coupling rules can synchronize otherwise separate joints. An automatically generated assembly dependency DAG drives a reversible, piece-by-piece timeline.

**Live route:** https://1998x-stack.github.io/LEGO-Worlds/#assembly

## Implemented

- Deterministic hierarchy evaluator separating local part transforms and subassembly world transforms.
- Parent/child joint records referencing existing hinge-axis connection anchors.
- Angle limits, joint input targets, quaternion alignment and rotation about hinge pivots.
- Nested motion propagation (the Crane has two serial hinges).
- Directed driver/follower coupling edges for mirrored movement (Drawbridge and Observatory).
- Hierarchy and coupling cycle detection, missing anchor/component rejection.
- Parent-first part assembly order, explicit per-step dependencies and reversed disassembly order.
- Interpolated approach offsets for schematic assembly and disassembly animations.
- Lazy-started Three.js viewer with subassembly highlighting/isolation, joint sliders, simulated motor, timeline, anchors and GLB export.
- Versioned JSON export/import that reconstructs trusted published presets, rather than executing imported transforms.

Defaults: maximum 24 subassemblies and 96 parts. The shipped presets are substantially smaller.

## Three acceptance assemblies

### Articulated Crane / 双关节机械吊臂

~~~text
base: foundation beam + base hinge + bushing
└─ boom: hinge + liftarm + distal hinge
   └─ wrist: hinge + wrist beam + clip
~~~

Rotating the boom moves the entire wrist subassembly. Adjusting the wrist only moves its own descendant parts. Both pivots are resolved from hinge-axis connection data.

### Twin Drawbridge / 双叶联动吊桥

~~~text
base: central foundation and two hinge bases
├─ left_deck: hinge + road + rail
└─ right_deck: hinge + road + rail
~~~

The left deck drives the right with a signed ratio of -1. Both panels rise in mirrored directions. The coupling solver rejects angles violating the follower's limits.

### Solar Observatory / 双翼太阳能观测站

~~~text
base: plate, dome, antenna and two hinge axes
├─ left_wing: hinge + panel + tile
└─ right_wing: hinge + panel + tile
~~~

Both wings are separate rigid subassemblies whose hinge rotations are coupled with ratio -1.

## Kinematic coordinate model

Source coordinates are millimetres, XYZ Euler radians, +Y up. The viewer scales the complete assembly root to metres once.

The child rigid-body transform is:

~~~text
W_child =
  W_parent
  × T(parentAnchorPosition)
  × R(parentAnchorAxis, jointAngle)
  × R(alignChildAxisToParentAxis)
  × T(-childAnchorPosition)
~~~

This keeps the parent/child hinge datums coincident while the joint rotates. Every part's local transform is multiplied by its node world transform to obtain a rendered world position and rotation.

The hinge and bearing geometry are **schematic visualization interfaces**. This is not a certified contact or bearing solver.

## Coupled joint constraints

Example:

~~~json
{
  "id": "mirrored_solar_wings",
  "driver": "left_wing",
  "driven": "right_wing",
  "ratio": -1,
  "offsetDeg": 0
}
~~~

Follower angle = driver × ratio + offset. Validation requires that both nodes are revolute joints, a driven joint has at most one driver, all joint inputs are finite, the directed graph has no cycles and derived angles remain inside configured limits.

## Public engine API

- createHierarchyPreset(presetId): get one of the three published examples.
- validateHierarchy(document, catalog): validate IDs, geometry references, parent structure and joint/coupling topology.
- resolveJointAngles(document, inputs): propagate driver angles.
- evaluateHierarchy(document, catalog, inputs): return part world poses and hinge pivot locations.
- createAssemblySequence(document, catalog): generate a deterministic part-level dependency DAG.
- assemblyFrame(document, catalog, inputs, progress): interpolate assembly visibility and poses.
- exportHierarchyRecipe(document, inputs): store a preset and joint configuration.
- importHierarchyRecipe(recipe, catalog): reconstruct and validate a preset and its joint inputs.

The engine is independent of DOM/browser state and is regression-tested under tests/hierarchy-engine.test.mjs.

## Assembly dependency DAG and animation

The sequence visits parent assemblies before their children. Each part step depends on its predecessor in the same assembly and, if applicable, the last step of the parent assembly.

Animation uses a deterministic approach offset and smoothstep interpolation. Forward play moves parts into place in dependency order. Reverse play removes parts in the opposite order. Users may scrub the timeline or select a step directly.

**Safety/accuracy limit:** The paths are demonstration trajectories, not collision-free motion plans. They are not verified against tool access, insertion clearance, support stability or physical interference. A topologically valid step does not imply a physically realizable one.

## JSON export and import

The exported recipe records a schema version, anchor schema version, units, preset identifier, solved joint angles and a read-only operation preview. Import reconstructs the published preset and revalidates its geometry and constraints; external operation arrays are ignored.

GLB exports a **static pose snapshot** without the live hinge constraints. Retain the JSON file when editable motion is important.

## Browser workflow

1. Open the Assembly section and launch the Hierarchy Lab.
2. Select Articulated Crane, Twin Drawbridge or Solar Observatory.
3. Select a subassembly in the tree or by clicking its mesh.
4. Move a driver hinge slider and watch descendant/coupled assemblies respond.
5. Click Joint motion to animate a driver within its limits.
6. Click Disassemble or Reassemble, or scrub the timeline to any build step.
7. Toggle Isolate and Anchors to inspect the selected rigid group and connection datums.
8. Export the validated JSON recipe or a static GLB geometry snapshot.

## Not implemented

- Full dynamics: mass, gravity, force, torque, backlash and friction.
- Narrow-phase collision testing and certified clearance-aware motion paths.
- Independent arbitrary assembly graphs with multiple parents or closed loops.
- Snap-dragging arbitrary articulated subassemblies or automatic joint identification.
- Real bearing tolerances, involute gear contact or print-ready mechanical fit.
- AI assembly planning or natural-language generation.

The next engineering stage is a general constraint solver with multiple joint types, narrow-phase collision checks, measured mating clearances and executable assembly operations.
