# General Constraint Graph & Closed-Loop Assembly — V0.6

The General Constraint Graph Lab turns the previous parent-only hierarchy into an **editable rigid-body graph**. A body can participate in several connections; cycles are allowed, optimized numerically and rejected when no consistent closure can be found. The lab handles **fixed, hinge, shaft and linear slider** kinematic constraints.

**Interactive demo:** https://1998x-stack.github.io/LEGO-Worlds/#constraints

## What shipped

1. A graph of bodies with validated part IDs, catalog component references, nominal local coordinate frames and optional grounded reference bodies.
2. Graph editing: add independent bodies; select body A/B, connection port A/B and joint kind; create/delete connections and delete bodies.
3. Fixed, hinge/revolute, coaxial shaft and one-axis prismatic joints.
4. A directed-free spanning-forest solver: propagate poses from each grounded or disconnected root in either direction across any joint edge.
5. Genuine **closed-loop checking and free-joint numerical optimization** when extra edges create cycles.
6. Grounded pose constraints, joint limits, active motor targets and free dependent joints.
7. Oriented bounding box (OBB/SAT) intersection warnings between nonadjacent bodies.
8. Three presets: four-bar loop, linear carriage and wheel/shaft drive.
9. Three.js joint markers and body highlighting, motor demo, joint target sliders, diagnostics, undo/redo and JSON/GLB export.
10. A bounded, schema-validated import path that rejects malformed data or inconsistent closed-loop geometry.

**This is a kinematic assembly-graph solver, not a general-purpose dynamics or certified interference engine.**

## Coordinate system and representation

The solver uses millimetres, right-handed XYZ Euler orientations and +Y up. The Three.js assembly root converts millimetres to metres once.

A body is a rigid component instance:

~~~json
{
  "id": "crank",
  "componentId": "beam-5",
  "grounded": false,
  "pos": [0, 0, 0],
  "rotation": [0, 0, 0]
}
~~~

The body pose serves as a reference for grounded/disconnected components. A connected moving body obtains its pose from the graph constraints, rather than an independently authored absolute transform.

A connection is an edge:

~~~json
{
  "id": "drive",
  "kind": "hinge",
  "a": {"bodyId": "ground", "portId": "technic-hole:0"},
  "b": {"bodyId": "crank", "portId": "technic-hole:0"},
  "value": 90,
  "limits": [25, 145],
  "controlled": true
}
~~~

Joint values use degrees for hinge/shaft and **millimetres** for slider. Fixed joints have value 0 and limits [0,0].

## Ports and compatibility

Each body exposes a stable set of connection ports via graphPorts():

- Native axial datums from the existing component-anchor system, such as technic-hole:0, hinge-axis:0, gear-axis:0 and wheel-axis:0.
- Virtual assembly datums: center-z, center-x, top-z, bottom-z, front-z, back-z, left-z and right-z.

Virtual datums are explicit **engineering placement references**. They do not imply a manufactured socket, cross bore, guide rail, bearing, stud interface or tested mating clearance. Connecting two arbitrary virtual datums creates a geometric constraint, not a physically verified joint.

Body geometry uses the existing procedural asset catalog. The solver uses an independent, conservative rectangular collision proxy rather than assuming a material-perfect mesh fit.

## Joint transform

For a joint between body A and body B:

~~~text
World(B) = World(A) × LocalPort(A) × Motion(joint,q) × inverse(LocalPort(B))
~~~

Motion is:

- fixed: identity matrix
- hinge: rotation about the port-local +Z axis by q degrees
- shaft: same revolute kinematics, representing a coaxial drive
- slider: translation along port-local +Z by q millimetres

The algorithm traverses the undirected graph, beginning with grounded bodies, and computes a spanning forest. Backwards traversal uses the inverse relative transform, so no parent-only restriction applies.

## Closed-loop optimization

A graph with N bodies, E joints and C connected components has E − N + C independent topology cycles.

Extra constraints not chosen in the spanning forest become **closure equations**. For each such edge:

~~~text
Expected(B) = World(A) × JointRelativeTransform
Delta       = inverse(Expected(B)) × Actual(B)
Residual    = [translation delta in mm,
               14 mm/rad × rotation log-vector]
~~~

All residuals are combined into a vector. Joint values marked controlled are held at the requested motor target; **free revolute and slider joints** are adjusted to reduce loop mismatch.

A damped least-squares / Levenberg-style iteration computes a finite-difference Jacobian, solves the normal equations and accepts only improving steps, respecting joint limits. The default closure tolerance is 0.7 mm in the weighted six-dimensional residual.

When a graph cannot close, the solver returns closure-incompatible and a residual. Editing actions that introduce such a graph are rejected instead of silently distorting parts.

The algorithm handles simple and moderate constrained motion, including the supplied planar four-bar mechanism. It is **not guaranteed** to find every valid 3D mechanism configuration, particularly singular mechanisms, highly nonlinear loops or branch changes. It does not solve force equilibrium.

## Collision checks

For every pair of *nonadjacent* bodies, the engine constructs an oriented rectangular proxy from catalog nominal dimensions and tests OBB intersection using Three.js SAT geometry.

Connected neighbors are ignored in this proxy pass because their intended coaxial joint contact, insertion overlap or shared attachment plane must be checked with interface-specific geometry rather than a coarse box.

A collision warning means two simplified solid proxies overlap. The absence of a warning does **not** establish noninterference of detailed meshes, shafts, nuts, pins, flexing components or gear teeth. There is no CCD (continuous collision detection) or swept path planning.

## Three run-ready acceptance examples

### Four-Bar Linkage / 四连杆闭环机构

~~~text
            coupler (beam-7)
         o──────────────────o
         │                  │
  crank  │                  │ rocker
 (beam-5)│                  │ (beam-5)
         │                  │
         o──────────────────o
             ground (beam-7)
~~~

Four hinge edges connect four bodies, producing one closed graph cycle. The lower-left hinge is a controlled driver. The other three hinge values are numerically optimized so the top and bottom link distances close. The mechanism visibly moves as the driver changes angle.

### Linear Carriage / 滑轨与移动平台

A fixed long rail, a linear slider (controlled in millimetres) and a payload platform connected by a rigid attachment. Adjust the slider target to translate the whole supported subassembly along the X guide.

### Shaft Drive / 转轴与轮组

A supported revolute shaft relation connects the base beam to a rotor. A fixed keyed edge carries a wheel in the same angular frame. Changing the shaft angle rotates the wheel assembly.

## Browser workflow

1. Open **Constraints** and click **Open constraint lab**.
2. Select a preset and click **Load**, or start from an existing graph.
3. Click an existing body in 3D to select it. Add a new catalog body from the component picker.
4. Under **Connect interfaces**, pick Body A, Port A, Body B, Port B and joint kind; optionally mark the new joint as a controlled drive.
5. Click **Connect**. A consistent connection is added; a contradictory closed loop is rejected with its residual.
6. Drive a movable joint with its slider, or click **Run motor** to animate the active driver.
7. Read the diagnostic panel for loop count, closure residual, solver iterations and proxy collision pairs.
8. Delete a connection, remove a body, undo/redo edits or export/import the versioned graph.
9. Export GLB to obtain a **static pose snapshot**.

## JSON interchange and security

Exported payload:

~~~json
{
  "schemaVersion": 1,
  "units": "mm",
  "graph": {
    "id": "four-bar",
    "bodies": [],
    "joints": []
  }
}
~~~

The example above illustrates the wrapper only; actual exports include all bodies and joints.

Imports are bounded (maximum 20 bodies, 32 joint edges), validate component and port references, unique IDs, finite transforms, valid joint types and limits, and re-run the loop solver. JSON is data, not executable instructions. External arbitrary geometry scripts, function callbacks or textures are not evaluated.

## Files and tests

- src/constraint-graph.js — deterministic solver, graph editor helpers, validation, OBB diagnostics, import/export.
- src/constraint-lab.js — Three.js workspace, graph editing and motor preview.
- tests/constraint-graph.test.mjs — closed-loop numerical convergence, slider motion, shaft propagation, additional edges, collision diagnostics and import safety.

## Next steps / limitations

This prototype deliberately does not implement:

- Measured tolerance, shaft engagement depth and actual connector strength checks.
- Convex-hull or mesh-triangle narrow-phase intersections; CCD for motion paths.
- General loop closure with arbitrarily many high-dimensional joints and guaranteed convergence.
- Gravity, motor torque, load, friction, gear backlash and flexible elements.
- Automatic placement suggestions or AI-generated assembly graph topology.

Recommended future work: **connector-specific geometric narrow phase, graph-based assembly operation planning with collision-free paths, and an AI agent that emits versioned constrained build manifests**.
