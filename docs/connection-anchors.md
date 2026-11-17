# Connection anchor system

The connection-anchor layer gives each reusable component a versioned set of local connection datums. It is the geometric contract that later snapping, assembly validation and build-agent workflows can consume.

## Scope

This milestone implements:

- Deterministic anchor generation for all 100 catalogue components.
- Local and assembly-space coordinates in millimetres.
- Position, normal, up direction and optional rotational axis.
- Typed interfaces, nominal dimensions, role and accepted counterpart kinds.
- Compatibility checks for interface class, direction and selected nominal dimensions.
- Optional 3D debug markers in the assembly inspector.

It does **not** implement drag snapping, collision detection, physical tolerance validation, gear centre-distance solving or automatic assembly constraints. Those are separate builder milestones.

## Coordinate convention

| Property | Convention |
| --- | --- |
| Unit | millimetres (mm) |
| Part origin | centre of the procedural part's visual body, unless the part factory has a documented directional origin |
| Up | +Y |
| Horizontal plane | X/Z |
| Rotation | Euler radians in XYZ order, matching createPart() |
| Anchor position | local coordinate relative to the part origin |
| Normal | outward-facing direction for face interfaces |
| Axis | undirected line direction for shafts, bores, hinges and rotational interfaces |
| Up vector | secondary orientation vector used to disambiguate connector roll |

getPartAnchors(spec) returns local anchors. getAssemblyAnchors(model) applies each part's Euler rotation and translation and returns assembly-space anchors. The viewer converts the assembly root from millimetres to metres once; anchor generation itself never converts units.

## Anchor record

A generated anchor has this shape:

| Field | Meaning |
| --- | --- |
| id | Stable per-part anchor identifier |
| partId | Owning part ID |
| kind | Typed interface, e.g. stud, technic-hole or hinge-axis |
| role | male, female or neutral |
| position | [x, y, z] in millimetres |
| normal | Normalized outward direction |
| up | Normalized secondary orientation vector |
| axis | Optional normalized axis for rotational or insertion interfaces |
| size | Nominal dimensions such as diameter, pitch, depth, module or opening |
| accepts | Interface kinds allowed by the compatibility registry |
| source | How the anchor was derived |
| confidence | nominal, nominal-interface or schematic |

The schema is versioned with ANCHOR_SCHEMA_VERSION. Persisted build files should store the schema version alongside anchor references rather than relying on array order.

## Supported interface families

| Anchor kind | Typical parts | Compatible counterpart |
| --- | --- | --- |
| stud | Brick tops, plates, jumpers | stud-socket |
| stud-socket | Brick, plate, tile and slope undersides | stud |
| technic-hole | Technic beams and liftarms | pin, axle |
| pin | Connector pins | technic-hole |
| axle | Axles, differential outputs, axle connectors | technic-hole, axle-hole, gear-axis, wheel-axis |
| axle-hole | Bushings | axle |
| gear-axis | Gear and bevel-gear axes | axle |
| gear-mesh | Spur, bevel and worm gear datum | Compatible gear profile and module |
| rack-mesh | Rack gear datum | gear-mesh with perpendicular axes and matching pitch |
| clip / bar | Clip and bar | bar / clip |
| ball / ball-socket | Ball and socket joints | Matching ball/socket pair |
| hinge-axis | Hinges and door hinge datum | hinge-axis |
| wheel-axis | Wheels and track idlers | axle |
| rotary-axis | Turntables and rings | rotary-axis |
| track-joint | Track links | track-joint |
| panel-mount | Wall, window, door, grille and shell surfaces | Opposed panel-mount |
| surface-mount | Brackets, columns, arches and support faces | Opposed surface-mount; spring end |
| decorative-mount | Leaves, flowers, tree branches and rocks | decorative-mount |
| spring-end | Spring endpoints | surface-mount |

## Compatibility checks

checkAnchorCompatibility(a, b, options) returns a structured result with compatible, reason, alignment and, where relevant, dimensionDeltaMm.

The current checks are:

1. Interface-kind pairing through ANCHOR_COMPATIBILITY.
2. Opposed face normals for face-to-face interfaces.
3. Parallel axes for shafts, bores, bars, hinges, gears and rotational datums.
4. Perpendicular axes and approximate circular pitch for rack-and-gear interfaces.
5. Nominal diameter/opening checks for studs, pins, axles, bars and ball joints.
6. Gear tooth-profile and module checks for gear pairs.
7. Same-part-instance rejection.

Angular tolerance defaults to 12 degrees. The default nominal fit tolerance is 0.8 mm. These are software screening tolerances, not manufacturing tolerances or a physical snap-fit guarantee.

Compatibility does not imply that two anchors are already coincident in space. It does not compute the final rigid-body transform, insertion depth, collision-free path, tooth phase, gear centre distance or structural strength.

## Debug visualization

The detail viewer has a **Show anchors** control.

- Blue markers: male interfaces.
- Amber markers: female interfaces.
- Green markers: neutral datums.
- Short line segments: face normals or axial directions.

Anchor helpers are attached to their owning part, so they follow the part during exploded-view movement and build-step visibility. They are not included in GLB exports.

## API

~~~js
import {
  getPartAnchors,
  getAssemblyAnchors,
  checkAnchorCompatibility,
  areAnchorsCompatible
} from './connection-anchors.js';

const local = getPartAnchors(componentSpec);
const assembly = getAssemblyAnchors(model);
const result = checkAnchorCompatibility(anchorA, anchorB);

if (result.compatible) {
  // The interface types and nominal orientation/size checks agree.
  // A future snap solver must still calculate and apply the transform.
}
~~~

## Accuracy and next steps

Stud grids and Technic hole centres are derived from the current procedural geometry dimensions. Some decorative, panel, wheel, ball-joint and transmission anchors are schematic interface datums because their current meshes simplify the real mating geometry. Each anchor exposes confidence so downstream systems can distinguish nominal interfaces from schematic references.

Next milestones:

1. Add a rigid-transform solver that aligns a selected anchor pair.
2. Add a candidate search using spatial indexing and compatibility filters.
3. Add collision and clearance checks before committing a snap.
4. Add persisted connection edges to assembly manifests.
5. Validate critical interfaces against measured physical samples before print-oriented use.
