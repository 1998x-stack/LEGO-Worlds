# Component system — 100-piece reference library

Brick Worlds maintains a catalogue of **100 distinct component definitions** across ten families. A catalogue entry is not a colour swatch: it has a stable ID and part code, a procedural geometry type, nominal dimensions, a family, a connection-profile label and a plain-language purpose.

## Shared reference grid

| Dimension | Nominal value | Role |
| --- | ---: | --- |
| Stud pitch | 8 mm | Centre-to-centre spacing |
| Brick body height | 9.6 mm | Three plate-height units |
| Plate body height | 3.2 mm | One-third brick body height |
| Stud diameter | 4.8 mm | Visual reference |
| Stud height | 1.7 mm | Visual reference |
| Technic hole pitch | 8 mm | Nominal centre spacing in beam examples |

These are simplified educational references. Real elements include geometry details and tolerances not represented by this procedural system.

## The 100 component definitions

| Family | Count | Coverage |
| --- | ---: | --- |
| Bricks | 15 | 1×N, 2×N, wide bricks and round bricks |
| Plates & Tiles | 12 | Plates, smooth tiles and offset jumpers |
| Slopes & Curves | 12 | Slopes, inverted slopes, curved profiles, arches, domes and wedges |
| Connectors & SNOT | 12 | Side-stud brackets, clips, bars, hinges, joints and corner plates |
| Technic Structure | 15 | 3–13 hole beams, liftarms, angle beams, frames, pins, axles and bushings |
| Gears & Transmission | 10 | Spur gears, worm, rack, bevel gear, turntable and differential case |
| Wheels & Motion | 8 | Wheel sizes, tyre styles, hub, track link and track unit |
| Architecture | 8 | Wall, window, door, arch window, roof tile, column, railing and balcony |
| Nature | 4 | Leaf sprig, flower, tree trunk and rock |
| Special | 4 | Spring, transparent shell, light brick and grille panel |
| **Total** | **100** | **Ten reusable families** |

Every component has a stable BW-XX-NNN catalogue code. The current geometry factory exposes 44 component types; many types have parameterized dimensions, so the 100 definitions share a small, testable geometry vocabulary rather than 100 unrelated one-off meshes.

## Component data contract

A component entry contains:

- **id**: stable kebab-case identifier used by builds and links.
- **code**: stable catalogue code, e.g. BW-BR-009.
- **name / zh**: English and Chinese display names.
- **family / series**: library grouping and owning series.
- **type**: registered geometry factory key.
- **size**: type-specific dimensions in millimetres or module counts.
- **sizeLabel / dimensions**: concise UI and reference labels.
- **description**: intended construction role.
- **color**: display material colour.
- **connectionProfile**: a descriptive interface class reserved for the upcoming anchor system.

## Geometry and coordinate conventions

- Source dimensions are authored in millimetres.
- The viewer converts the complete assembly root to metres once.
- The scene uses +Y up; X/Z are the horizontal plane.
- Part positions refer to the local visual centre unless a factory documents a directional origin.
- createPart(spec) returns a named THREE.Group and must not create a renderer or read UI state.
- New component types must be deterministic, finite, non-empty and disposable.

## Connection profiles are not yet snap rules

connectionProfile is catalogue metadata to group likely interfaces (stud grid, Technic hole, axle cross, clip/bar, hinge axis, panel edge or decorative anchor). It does not yet contain per-instance anchor coordinates, collision checks or verified physical compatibility. Those belong to the next connection-anchor milestone.

## Compatibility and 3D printing

This is not a precision replacement-part CAD library. Printed interlocking components need measured compensation for printer, material, orientation, shrinkage, layer height and mating geometry. Do not infer snap fit, clutch power, durability or safety from a visually plausible mesh.