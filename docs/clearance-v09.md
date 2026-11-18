# V0.9 — Nominal Bearing Fit & Bounded Geometry Clearance

**Status:** implemented first-party software checks for selected procedural parts. The new geometry and validators provide reproducible **nominal radial engagement, static triangle-surface candidate checks, and discrete straight-insertion samples**. They do **not** establish measured fits, manufacturing quality, complete solid CSG interference or continuous collision-free motion.

## 1. Testable demonstrator: sleeve bearing, axle and wheel

The new [Constraint Lab](https://1998x-stack.github.io/LEGO-Worlds/#constraints) preset is **Sleeve Bearing & Wheel** (`bearing-wheel`); the natural-language Agent also recognizes `装配一个轴承衬套、转轴和轮组`.

The four visual components are:

| Role | Catalog component | Nominal geometry |
| --- | --- | --- |
| Grounded support | `beam-5` | 5 holes with through-bore diameter 4.9 mm and 7.8 mm depth |
| Hollow bearing | `bearing-sleeve-8mm` (new) | outer diameter 4.68 mm, bore diameter 3.9 mm, width 7.6 mm |
| Cross-shaft | `axle-5` | 3.5 mm maximum arm extent, 40 mm long |
| Wheel | `wheel-medium` | 3.8 mm nominal through-bore, width 8 mm; modeled hub width 8.9 mm |

The graph contains three joints: `sleeve_mount` (fixed), `journal` (shaft/revolute), and `wheel_key` (fixed).

The wheel is connected to a new `axle-seat-front` datum located at **30% of shaft length from its center**. The physical engagement calculation still uses the **actual shaft endpoints**, not a fictitious shaft centered on that connection datum.

This is an **educational sleeve/journal/shaft assembly**. The nominal cylindrical bore and cross-shaped shaft are not a tested engineering bearing design; there are no certified friction, life, materials or fit tolerances.

## 2. Typed interfaces

New native interface kinds:

- `bearing-outer`: male cylindrical outside surface, nominal Ø4.68 mm / axial length 7.6 mm.
- `bearing-bore`: female cylindrical bore, nominal Ø3.9 mm / depth 7.6 mm.
- `technic-hole`: existing female beam through-bore Ø4.9 mm.
- `axle` and `wheel-axis`: existing shaft and nominal wheel-bore datums.

The graph's two connection sites `axle-seat-front` / `axle-seat-back` are **derived geometric datums**, not physical sockets.

`reviewNominalAxialInterfaces` independently checks three-dimensional centerline offset, angular alignment, diametric margin and axial engagement. For the example at rest:

- Beam through-hole versus bearing outer diameter: nominal radial margin **0.11 mm**.
- Bearing bore versus cross-shaft maximum outside width: nominal radial margin **0.20 mm**.
- Wheel through-bore versus cross-shaft: nominal radial margin **0.15 mm**.

These margins come from prototype geometry constants; they are not guaranteed printed/measured clearances. The validator explicitly returns `MEASURED_FIT_NOT_VERIFIED`.

## 3. Static geometry interference inspection

`inspectGraphMeshContacts(graph, poses, catalog)` performs two stages:

1. **Broad phase:** world-space AABBs reject clearly separated parts; directly connected pairs are omitted from general contact screening because intended engagement requires the separate nominal-fit checker.
2. **Bounded narrow phase:** real procedural mesh triangles are transformed to world coordinates, filtered by per-triangle AABBs and tested using 3D separating-axis projections. A capped set of vertex parity rays can flag fully contained candidates.

The output records contact candidates, incomplete resource budgets, candidates resolved as false alarms, and the exact inspection method. It tests at most **6,000 triangles per part** and **60 candidate body pairs**.

An important regression: the legacy OBB check flags `support` versus `axle` as overlapping because the shaft lies inside the beam's broad bounding box. Real geometry inspection finds no intersecting triangle surfaces for their coaxial **through-hole** arrangement, so it can clear this particular OBB false alarm.

The algorithm has known limitations: coplanar contacts, open/non-manifold triangle soups, near-tangent surfaces, enclosed multi-mesh unions and finite-precision sampling may cause false positives or negatives. A **clear-sampled** result does not prove absence of volumetric interference. This is *not* a CAD boolean subtraction or verified continuous collision detector.

## 4. Discrete straight insertion inspection

`inspectInsertionPath(graph, poses, catalog, request)` checks one rigid body translated toward its solved final pose, preserving its solved orientation.

Example request:

```json
{
  "mesh": true,
  "path": {
    "movingBodyId": "axle",
    "installedBodyIds": ["support", "sleeve"],
    "fromOffsetMm": [0, 0, 35],
    "samples": 12
  }
}
```

`installedBodyIds` is the explicit assembly stage: the wheel is not installed when the axle is inserted. Each of 13 discrete poses is tested against every listed installed body using the mesh checker.

- Coaxial shaft insertion through the beam/sleeve produces `sampled-clear` (only the named sampled poses were checked).
- An approach with an X-axis offset can produce `blocked` with sample index, body ID and contact reason.

**A sampled-clear result remains WARN**, not a full motion-path certification: the continuous interval between poses is not checked, and no tool/finger clearance, gravitational stability or swept-volume proof is performed.

## 5. Independent L2 evidence

The existing `packages/validation-engine/index.mjs` now reports:

| Gate | Possible result | Meaning |
| --- | --- | --- |
| `L2.axial-fit` | PASS / FAIL / NOT_RUN | Nominal cylindrical radial/axial/axis checks for recognized connectors |
| `L2.physical-fit` | NOT_RUN | Real tolerance, manufacturing and load testing absent |
| `L2.collision-proxy` | PASS / WARN | Legacy OBB diagnostic, *not* authoritative detailed geometry |
| `L2.mesh-surface` | PASS / WARN / NOT_RUN | Opt-in bounded mesh contact candidates; incomplete scans do not become PASS |
| `L2.insertion-path` | WARN / FAIL / NOT_RUN | Opt-in explicit assembly-stage sampled path |
| `L2.motion-envelope` | NOT_RUN | Complete joint ranges and continuous collision remain unverified |
| `L2.physics` | NOT_RUN | No forces, torque, materials or dynamics |

The independent verifier always recomputes reports from source artifacts. An external Agent cannot claim PASS by setting a JSON field or silently widening tolerance limits.

## 6. CLI and Agent Skill workflow

```bash
npm install
npm test

# Natural-language supported blueprint plus opt-in static mesh checks
npm run world:pipeline -- --prompt "装配一个轴承衬套、转轴和轮组" --mesh

# Full worked example: nominal fit + mesh + explicitly staged insertion
node scripts/inspect-bearing-wheel.mjs

# Intentionally blocked path (exit code 2, with diagnostics)
node scripts/inspect-bearing-wheel.mjs --blocked

# Agent skill execution through the same trusted runner
node .agents/skills/mechanical-constraint-solving/scripts/validate.mjs \
  --request path/to/world-tools-request.json
```

For a saved `world-tools/v1` request to `world.kinematics.validate`, set:

```json
{
  "options": {
    "targetLevel": "L2",
    "clearance": {
      "mesh": true,
      "path": {
        "movingBodyId": "axle",
        "installedBodyIds": ["support", "sleeve"],
        "fromOffsetMm": [0, 0, 35],
        "samples": 12
      }
    }
  }
}
```

The complete envelope must additionally include `protocolVersion`, `operation`, `capability`, `input.worldSpec`, `input.geometry` and `input.assembly` artifacts. The local MCP `world_validate` tool also accepts an optional `clearance` object and delegates to the same verifier.

## 7. Extension to larger worlds

This module proves the first complete path from native connector geometry to independent verification, but it remains **bounded to small procedural assemblies**. The next stage should introduce stable subsystem manifests, local coordinate origins, connector contracts between subsystems, dedicated collision broad-phase indexes (BVH), specialized geometric narrow-phase/CCD, and benchmarks.

Aircraft/building physical requirements must never be sent to the small mechanism solver as if that solver validated structures or flight. They remain requirements-only until domain solvers and qualified evidence are available.

## 8. Relevant files

- `src/brick-system.js`: hollow bearing sleeve geometry.
- `src/catalog.js`: 101st reusable catalog component.
- `src/connection-anchors.js`: bearing interface metadata.
- `src/constraint-graph.js`: nominal bearing-wheel preset and axle-seat datums.
- `packages/clearance-engine/index.mjs`: bounded static geometry and insertion checks.
- `packages/validation-engine/index.mjs`: L2 nominal fit / mesh / sampled path gates.
- `adapters/cli/world.mjs` and `adapters/mcp/server.mjs`: Agent-accessible interfaces.
- `tests/clearance-engine.test.mjs`: positive and negative regression cases.

No real manufacturing certification, external physics benchmark, browser/device manual QA or full CCD is implied by a green software test suite.
