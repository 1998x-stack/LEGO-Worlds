# Natural-language Assembly Agent — verified local blueprint pipeline

## Status and honesty

Current implementation: **template-grounded deterministic planner with a natural-language entrypoint**, not an LLM-enabled general CAD generation service. It handles the following intents: six-wheel Mars rover concept, four-bar mechanism, linear carriage, and shaft drive. Building/aircraft requests become requirements-first plans with no fabricated 3D graph or safety certification.

## Pipeline

```text
Natural language (Chinese / English)
  -> intent and explicit-count parser
  -> approved bounded blueprint
  -> stable catalog component IDs and ports
  -> graph joints and limits
  -> validateConstraintGraph + solveConstraintGraph
  -> OBB collision diagnostics
  -> derived BOM and parent-first assembly-step DAG
  -> versioned JSON + optional live Three.js graph inspector
```

The six-wheel example compiles ten visual component instances (crossmember plate, two 13-hole longitudinal beams, six wheel meshes and one sensor dome) and nine graph edges. The six wheel joints are **virtual coaxial bearings**; real axles, rocker-bogie suspension, motors, power, control, dynamics and Mars terrain tests are absent. The joint graph does not certify printable tolerances or mechanical stability.

## API

- `interpretBuildRequest(prompt)`: bounded heuristic intent extraction.
- `createSixWheelRoverGraph()`: stable original concept blueprint.
- `createAssemblyPlan(prompt, COMPONENTS)`: graph, BOM, steps, validation gates and provenance.
- `validateAgentGraph(graph, COMPONENTS)`: catalog/joint checks, numerical kinematics, proxy collision and explicit pending physics gates.
- `validateGeneratedPlan(document, COMPONENTS)`: rebuild BOM/steps and rerun solver; do **not** trust imported verification claims.

## CLI

```bash
npm install
npm run agent:plan -- "搭建一辆六轮火星探测车" > rover-plan.json
node scripts/agent-validate.mjs rover-plan.json
npm test
npm run build
```

The browser route `/#agent` provides prompt examples, plan generation, metrics, BOM, graph, ordered steps and validation gates. An approved plan can be loaded into the existing `/#constraints` lab for interactive rotation/inspection.

## Future model-proposal adapter boundary

`validateExternalGraphProposal(proposal, COMPONENTS)` accepts an untrusted structured graph proposal (or `{graph, prompt}`) and rebuilds catalog references, component quantities, assembly steps, solver diagnostics and physical-fidelity claims. It explicitly replaces the original generator provenance and never trusts external certification fields. It has no network/LLM dependency; when a real provider is added later, keep credentials server-side.

```bash
node scripts/agent-validate.mjs --proposal proposal.json
```

## Versioning and trust

Every plan includes `schemaVersion`, `generator`, `request`, `status`, graph/BOM/steps, `verification` and an explicit `capability` map. The graph is always validated with its current catalog and solver. The client contains no API key; any future model-generated proposal must be treated as untrusted data, normalized to a schema, resource bounded, and checked before rendering/export.

## Scaling roadmap

1. Add a JSON Schema validator for model outputs and explicit unsupported-constraints feedback.
2. Introduce a controlled, server-side LLM plan-proposal adapter with quota, provenance and no direct filesystem/network execution.
3. Add assembly path collision checks, stable-support and kinematic feasibility feedback.
4. Add subassembly hierarchies and large-world pagination/LOD for buildings and aircraft.
5. Add discipline-specific physics validation layers (structural, wind, aero, controls, terrain interaction) backed by reliable measurements.

**Never treat a visual graph, a successful unit test or a static GLB export as manufacturing, structural or flight safety evidence.**
