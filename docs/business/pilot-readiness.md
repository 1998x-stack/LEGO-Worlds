# Brick Worlds — paid-pilot readiness (draft)

> **Status: proposal / unverified metrics.** This document contains *targets and hypotheses*, not
> measured results, customers, prices or purchase intent. Nothing here has been validated with an
> external party. Brick Worlds is an **independent fan project and is not affiliated with, endorsed
> by, or sponsored by the LEGO Group.** No outreach to LEGO, BrickLink or any partner has been
> made or authorized by this document.

Positioning: **Brick Worlds — Agent-Native Assembly Intelligence for Digital Building.** It is
intended to *assist and verify* existing design tools, not to replace BrickLink Studio.

## 1. What can be demonstrated today (provable, from this repo)

Three capabilities that a reviewer can run locally right now:

1. **Agent-native validation pipeline (L0→L1→L2).** A natural-language request becomes a typed
   `WorldSpec`, a rebuilt procedural `GeometryManifest`, an `AssemblyGraph`, and an
   **independently recomputed** `ValidationReport` with PASS/WARN/FAIL/NOT_RUN kept separate.
   Evidence: `npm run world:pipeline -- --prompt "搭建一辆六轮火星探测车"`; `npm test`.
2. **Hard-constraint integrity.** A caller cannot smuggle a reduction of a hard requirement past
   the independent verifier (e.g. wheel count). Evidence:
   `tests/world-platform.test.mjs` "Agent proposal callback cannot smuggle a reduction of hard
   wheel count"; L0 mismatch "cannot be overridden by graph claims".
3. **Nominal mating + bounded clearance evidence.** Coaxial beam/bearing/axle/wheel fits with
   nominal radial clearance, engagement length, a bounded static mesh candidate scan that avoids
   the OBB axle-in-hole false positive, and a **discrete** installed-stage insertion check.
   Evidence: `node scripts/inspect-bearing-wheel.mjs` and its `--blocked` counter-example.

Three demoable end-to-end cases (all in-repo): the six-wheel Mars rover plan, the
bearing/shaft/wheel nominal-fit example, and a four-bar / shaft-drive / linear-carriage constraint
preset in the browser Constraint Lab.

**Complementary space with BrickLink Studio / the LDraw ecosystem (hypothesis, not a claim):**
Studio/LDraw are strong at part libraries, instruction authoring and rendering. Brick Worlds
focuses on **typed interface metadata + an independent kinematic/clearance validator + an
agent-native artifact contract**. The plausible complement is "verify and reason about a design",
not "author or replace it".

## 2. Five risks blocking a paid evaluation

| # | Risk | Why it blocks | Current evidence |
| --- | --- | --- | --- |
| R1 | **Real-part compatibility** | The catalog is 101 *procedural* parts, not the full real brick inventory; IDs do not map to official element IDs. | `src/catalog.js`; no external element-ID dataset (licensing unresolved) |
| R2 | **Studio / LDraw interoperability** | No `.ldr`/`.mpd` import/export exists; no round-trip diff has been measured. | not implemented (see §4) |
| R3 | **Mechanical-validation strength** | Only nominal fits + bounded static mesh + discrete path. No measured tolerance, CCD, dynamics or strength. | `L2.physical-fit = NOT_RUN`, `L2.motion-envelope = NOT_RUN` |
| R4 | **Copyright / trademark / MIT scope** | Part naming, "LEGO"-adjacent wording and third-party asset provenance need review; brand disclaimer must stay. | `LICENSE` (MIT), unofficial fan-project disclaimer; no third-party part data committed |
| R5 | **Data security / deployment** | Evaluation teams may require self-hosting and no external model calls; the client must never hold model API keys or unrestricted shell/HTTP. | `docs/agent-plugin-runtime.md`; runner rejects arbitrary keys; MCP exposes bounded tools only |

## 3. Measurable pilot metrics (targets — to be measured, not invented)

| Metric | Definition | Target (hypothesis) | How measured |
| --- | --- | --- | --- |
| Design-task time | time to reach a validated concept + BOM + steps | not yet measured | paired task timing vs. baseline |
| Hard-constraint retention | % hard requirements preserved end-to-end | not yet measured | validator report diff |
| Connection correctness | % graph edges that pass independent re-validation | not yet measured | `ValidationReport` counts |
| Round-trip correctness | Studio/LDraw import→edit→export fidelity | **blocked** (R2) | diff after R2 lands |
| Build reproducibility | % of steps a human reproduces without ambiguity | not yet measured (human study) | observed re-build |
| Diagnostic understandability | % of failures a user resolves from the message alone | not yet measured | user study |

**No ROI, pricing, conversion or satisfaction numbers are asserted.** Any figure must come from a
real, recorded experiment.

## 4. Suggested 6–8 week paid pilot (scope draft)

- **Customer provides:** a licensed part set and its element-ID mapping; 3–5 real designs for
  verification; an acceptance reviewer; optional on-prem constraint (no external model calls).
- **We deliver:** (a) a provenance-audited part/ID mapping layer; (b) a *measured* LDraw `.ldr`
  import→edit→export round-trip with a published diff; (c) validator evidence on the customer's
  designs with PASS/WARN/FAIL/NOT_RUN kept separate; (d) an evaluation report that states limits
  explicitly (no manufacturing/structural/flight certification).
- **Acceptance:** each metric in §3 either produces a real number or remains `NOT_RUN`.
- **Explicit limits:** concept-level kinematics and clearance only; no structural, seismic, fire,
  aerodynamic or flight validity; engineering and safety sign-off remain the customer's.
- **Out of scope:** any claim of LEGO affiliation; shipping branded/IP assets; certification.

## 5. Compliance and non-actions

- Preserve the **unofficial, non-affiliated** disclaimer everywhere.
- Do **not** copy branded kits, logos, part art or third-party datasets; audit every dependency
  and asset for licence and provenance before shipping or demoing.
- Do **not** contact LEGO employees, procurement inboxes, press or partner channels from this
  workstream without explicit written authorization from the project owner.
- No secrets, credentials or customer-proprietary data are committed.
