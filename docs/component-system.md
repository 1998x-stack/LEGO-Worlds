# Component system and nominal dimensions

## Shared reference grid

| Dimension | Nominal value | Role |
| --- | ---: | --- |
| Stud pitch | 8 mm | Centre-to-centre spacing |
| Brick body height | 9.6 mm | Three plate-height units |
| Plate body height | 3.2 mm | One-third brick body height |
| Stud diameter | 4.8 mm | Visual reference |
| Stud height | 1.7 mm | Visual reference |

These values are a simplified educational reference. Real elements include geometry details and tolerances not represented by this first procedural system.

## Component families

### System bricks
- Brick: full-height body with top studs.
- Plate: one-third-height body with top studs.
- Tile: smooth top surface without studs.
- Jumper: plate with a single centred stud.
- Slope: wedge profile for angled surfaces.

### Technic-inspired mechanics
- Beam: extruded structural profile with circular holes.
- Pin: connector cylinder.
- Axle: shaft cylinder.
- Gear: radial teeth, hub and axle opening.
- Wheel: tyre and rim assembly.

### Modular architecture and scene parts
- Panel: wall or surface module.
- Window: frame and translucent glazing.
- Door: leaf, glazing and handle.
- Leaf: organic scene detail.
- Ring, dome, cylinder and sphere: reusable decorative primitives.

## Manifest example

```js
{
  id: 'sample-brick-red',
  name: 'Red 2 × 4 brick',
  type: 'brick',
  size: [2, 4],
  pos: [0, 9.7, 0],
  color: '#d71920',
  step: 1,
  explode: [0, 18, 0]
}
```

- `size` is type-specific: brick/plate use stud counts; beam uses hole count; gear uses radius, tooth count and thickness; wheel uses radius and width.
- `pos` is the part body centre, not the lower contact plane.
- `step` determines when a part appears in the guided build sequence.
- `explode` is an optional millimetre offset used at 100% exploded view.

## Compatibility and 3D printing

This repository is not a precision replacement-part CAD library. A printed interlocking element needs measured compensation for the printer, material, orientation, shrinkage, layer height and target mating element. Do not infer snap fit, clutch power, durability or safety from a visually plausible mesh.
