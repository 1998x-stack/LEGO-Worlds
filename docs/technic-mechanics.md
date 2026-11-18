# Technic Mechanics Lab — guided mechanical assembly (V0.4)

This release extends LEGO-Worlds from stud/socket construction to **guided Technic-style joint assembly**. The interactive Mechanics Lab mounts beam holes, pins, axles, gears and wheels using their procedural connection anchors, and animates **kinematic** gear rotation. The project is an original, unofficial educational visualization.

## User workflow

Open the homepage's **Mechanics** section and click **Open mechanics lab**.

- Start from one of three ready-made demonstrations: **Dual Gear Drive**, **Wheel & Axle**, or **Pin Fixture**.
- Click a beam hole (its centre has a transparent raycast target) or use the hole dropdown.
- Choose a connector pin or cross axle and **Install into hole**.
- Choose an installed axle, select a gear or wheel and **Mount to axle**.
- View the live connection graph, animate **Disassemble** / **Assemble**, show anchor coordinates or run **Drive**.
- Undo or redo edits, remove the last assembly step and export GLB or a versioned assembly JSON recipe.
- Import a previous mechanism recipe; imported arbitrary transforms and edges are ignored and reconstructed from validated connection steps.

## Supported connection rules

| Pair | Supported operation | Joint |
| --- | --- | --- |
| Beam technic-hole + friction pin | Centre the 12 mm pin coaxially in a through-hole | Fixed (conceptual) |
| Beam technic-hole + smooth pin | Centre the pin coaxially | Revolute (conceptual) |
| Beam technic-hole + axle | Centre the axle coaxially | Revolute bearing |
| Axle + gear central bore | Place gear on positive-Z side of the beam, with axial clearance | Fixed/keyed to axle |
| Axle + wheel hub central bore | Place wheel on positive-Z side of the beam, with axial clearance | Fixed/keyed to axle |
| Two separate aligned spur gears | Match pitch-circle centre distance and approximate tooth module | Counter-rotation relation |

A beam hole can hold only one shaft/pin. A shaft holds one mounted wheel or gear in this preview. Axle length must cover the beam and attached accessory. Non-meshed radial intersections between mounted accessories are rejected.

src/technic-engine.js contains the deterministic, DOM-free rules:

- createMechanism(catalog, beamId)
- availableHoles(state)
- mountShaft(state, catalog, args)
- mountAccessory(state, catalog, args)
- meshedGearPairs(state)
- mechanismGraph(state)
- mechanismAngles(state, inputAngleRadians)
- exportMechanism(state) and replayMechanism(catalog, document)

src/mechanics-lab.js owns the lazy-loaded Three.js scene, hole selection, controls, exploded positions, kinematic drive and cleanup.

## Geometric corrections

Earlier versions used visual discs or solid cylinders to represent the gear centre and wheel hubs. That would have made passing an axle through them impossible. This milestone modifies those meshes to include **genuine open axial bores** and replaces the "cross axle" cylinder with a simplified extruded cross-shaped profile.

The bore datum is now nominally 3.8 mm and the cross axle spans 3.5 mm across its profile. The hole sizes and meshes are **schematic**; real keyed profile/cross-tolerance, friction, engagement strength and interlocking are not certified.

## Kinematic graph

For two spur gears with matching simplified module and separated by their nominal summed pitch radii:

~~~text
shaft_A (input angle theta)
  | fixed key
gear_A (zA teeth)
  | gear mesh, reversed direction
gear_B (zB teeth)
  | fixed key
shaft_B (output angle theta * -zA/zB)
~~~

In **Dual Gear Drive**, both gears have 16 nominal teeth and are mounted in beam holes 16 mm apart, giving a **−1:1** angular relation. Rotation is an animated kinematic transform, **not** a true gear tooth engagement simulator. No torque, backlash, load path, angular acceleration or physical bearing friction is computed.

Only supported gear pairs produce mesh edges, derived from the actual assembly position. The joint graph records axes, anchor IDs, joint types and nominal gear ratios.

## Assembly file format

A mechanism JSON file is a **recipe**, not a trusted mesh or executable input:

~~~json
{
  "schemaVersion": 1,
  "anchorSchemaVersion": 1,
  "units": "mm",
  "baseBeamId": "beam-5",
  "steps": [
    {"operation":"shaft","componentId":"axle-3","holeIndex":1,"instanceId":"axle_left"},
    {"operation":"shaft","componentId":"axle-3","holeIndex":3,"instanceId":"axle_right"},
    {"operation":"accessory","componentId":"gear-16t","shaftInstanceId":"axle_left","instanceId":"drive_gear"},
    {"operation":"accessory","componentId":"gear-16t","shaftInstanceId":"axle_right","instanceId":"driven_gear"}
  ],
  "driveShaftId": "axle_left",
  "parts": [],
  "connections": []
}
~~~

Export includes computed parts and connections. Import reconstructs those arrays from the constrained steps rather than trusting input transforms/edges, and enforces unique part IDs, valid catalogue parts, available beam holes, shaft lengths, and clearance limits. The demo is limited to 32 parts.

## Current boundaries

- This is **guided assembly** with target-hole selection and explicit mount actions; it does not offer free-form 6-DOF mouse dragging of Technic pieces.
- Pins and shafts are centred in their host holes. A full insertion-depth/cross-section/contact manifold solver is not implemented.
- Collision checks are specific to occupied holes, axial lengths and mounted accessory radial envelopes. **Mesh-level narrow-phase collision**, arbitrary joint assemblies and load stability are not implemented.
- The current gears use schematic straight tooth boxes, nominal pitch circles and animation-only phase. The displayed mesh is not a manufactured involute gear.
- The beam is a fixed reference. Chains of beams, hinged articulated assemblies, differential gear physics, universal joints and coupling several free subassemblies remain for later work.
- GLB exports contain visual geometry but not live motor/constraint semantics; retain the JSON to preserve the connection graph.

## Suggested next step

Add independent subassemblies, true pin/axle insertion constraints, explicit revolute-joint state, gear phase/contact checks and collision narrow phase. Then feed the joint graph into step-by-step animation and a controlled AI model-building agent.
