# Physical World Architecture: Buildings, Aircraft, Robots

**Status: future-system design.** The existing code supports procedural components, typed anchors, limited mechanism graphs, OBB collision warnings and template-grounded planning. This document does not describe a completed physics engine or certified design tool.

## 1. Fidelity ladder and evidence

| Level | Capability | Evidence needed |
| --- | --- | --- |
| 0 | Requirements | Constraints, units, context, assumptions |
| 1 | Visual geometry | Bounded meshes, stable IDs, material metadata |
| 2 | Kinematic assembly | Joint ports, loop closure, motion limits |
| 3 | Physical interference | Mesh-level narrow phase, swept collision, tolerance |
| 4 | Physics simulation | Validated materials, forces, contacts, benchmarks, error bars |
| 5 | Engineering review | Applicable standards, traceable tests, qualified approval |

Current LEGO-Worlds reaches Level 2 in selected examples. OBB warnings are approximate and not Level 3.

## 2. Layered architecture

A future large world is not one giant Three.js group. Use independent modules:

1. Requirement compiler: named entities, constraints, assumptions and provenance.
2. Semantic world model: sites, structures, systems, subsystems and stable instance IDs.
3. Asset library: procedural geometry, external licensed files, material and scale metadata.
4. Interface graph: coordinate frames, connector types, kinematic and structural links.
5. Kinematics: local subassembly solvers with explicit closure residuals.
6. Collision: broad phase spatial indexing, then accurate narrow phase and continuous collision detection.
7. Physics: interchangeable rigid-body, structural, fluids/aero, terrain and thermal solvers.
8. Simulation state: checkpoints, events, error estimates and repeatable experiments.
9. Rendering: instancing, streaming, LOD, occlusion and origin rebasing.
10. Validation and evidence: software tests, physical benchmarks and domain review.

Keep physical truth in typed data and validated solver output, not the renderer or AI response.

## 3. Units, frames, and scaling

The current component model uses millimetres, +Y up and right-handed coordinates. World-scale building and aerospace coordinates should use metres, kilograms, seconds and newtons where appropriate. A subsystem manifest must explicitly specify conversion to the global frame and versioned units.

Never increase current demonstration solver limits (20 bodies, 32 joints, 12 closed-loop free variables) to handle a whole building or aircraft. Instead partition geometry and constraints into floors, rooms, structural bays, wings, propulsion modules, landing gear, or rover bogies, with independently validated interfaces and hierarchical composition.

A future WorldManifest should carry: schemaVersion, worldId, domain, units/frame, subsystem references, asset index, solver adapters, readiness status, evidence references and conservative safety flags. This is a proposed contract, not a currently implemented JSON importer.

## 4. Building systems

Partition a building into site and terrain; floor/space layout; architectural envelope; beams/columns/slabs; plumbing/HVAC/electrical; elevators; occupancy; and fire/egress. Define spatial references, room interfaces, load cases, materials and code references separately. Safety requires seismic/wind/structural tests, accessibility/egress checks and jurisdiction-specific expert review. Rendered facades alone prove none of these.

## 5. Aircraft systems

Partition aircraft into airframe, propulsion and energy, wing/tail/control surfaces, avionics, flight controls, landing gear, dynamics and aeroelastic effects. Each subsystem needs mass/inertia, operating conditions, coordinate convention, boundary conditions and evidence. Actual flight capability requires validated aerodynamic/structural testing and applicable airworthiness review. A low-poly visualization is not flight-ready engineering.

## 6. Robotic vehicles and Mars rover

The V0.7 demonstration is a ten-body concept: crossmember chassis, two longitudinal beams, six procedural wheels and a sensor dome. Nine graph edges provide nominal joints and a deterministic assembly plan. Wheel bearings are virtual placement constraints. Missing: axles, suspension, rocker-bogie kinematics, motors, torque, ground contact, wheel slip, power, navigation and tested material strength.

Future rover work should add real subsystems one at a time, with benchmark cases and explicit fidelity tier rather than claiming a complete vehicle from the model.

## 7. Safe AI assembly architecture

The AI language model, if connected in the future, may PROPOSE but must not VALIDATE its own engineering output.

- Parse natural language and preserve explicit quantities.
- Route to an approved blueprint or a bounded structured proposal.
- Resolve every component/connector ID against trusted catalogs.
- Run independent graph validation and numerical constraint solving.
- Recompute BOM, assembly ordering, collisions and evidence tiers from trusted inputs.
- Return requirements-only when domain physics is not implemented.
- Never embed model API keys into static GitHub Pages source.
- Treat imports as untrusted data; discard fabricated certification or test claims.

A future provider can use the existing validateExternalGraphProposal function in src/ai-agent.js as its bounded validation handoff, but does not currently have a live LLM backend.

## 8. Deployment and verification

Required software gates are npm test, npm run test:skills, and npm run build. For large worlds add deterministic GLB review, geometry tolerances, BVH performance limits, physics benchmark suites, GPU memory budgets and browser/device smoke tests. External domain approval remains separate from code CI.

## 9. Phased implementation

- V0.8: versioned WorldManifest, subsystem/adapters registry, scene partitions and more complete asset provenance.
- V0.9: mesh-level collision/CCD, placement and disassembly access planning.
- V1.0: calibrated physics adapters and domain-specific benchmark reporting.
- V1.x: optional LLM proposal services, scalable storage, streaming, and expert review integrations.

See docs/skills-system.md, docs/ai-assembly-agent.md, docs/constraint-graph.md, and AGENTS.md for the current usable modules and constraints.
