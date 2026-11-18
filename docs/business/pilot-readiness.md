# Brick Worlds — paid-pilot readiness (draft)

> **Status: proposal / unverified metrics.** This document contains *targets and hypotheses*, not
> measured results, customers, prices or purchase intent. Nothing here has been validated with an
> external party. Brick Worlds is an **independent fan project and is not affiliated with, endorsed
> by, or sponsored by the LEGO Group.** No outreach to LEGO, BrickLink or any partner has been
> made or authorized by this document.

Positioning: **Brick Worlds — Agent-Native Assembly Intelligence for Digital Building.** It is
intended to *assist and verify* existing design tools, not to replace BrickLink Studio.

## 1. What can be demonstrated today (provable, from this repo)

Four capabilities that a reviewer can run locally right now:

1. **Agent-native validation pipeline (L0→L1→L2).** A natural-language request becomes a typed
   `WorldSpec`, a rebuilt procedural `GeometryManifest`, an `AssemblyGraph`, and an
   **independently recomputed** `ValidationReport` with PASS/WARN/FAIL/NOT_RUN kept separate.
   Evidence: `npm run world:pipeline -- --prompt "搭建一辆六轮火星探测车"`; `npm test`.
2. **Hard-constraint integrity.** A caller cannot smuggle a reduction of a hard requirement past
   the independent verifier (e.g. wheel count). Evidence:
   `tests/world-platform.test.mjs` "Agent proposal callback cannot smuggle a reduction of hard
   wheel count"; L0 mismatch "cannot be overridden by graph claims".
3. **Nominal mating + bounded clearance evidence, with honest labelling.** Coaxial
   beam/bearing/axle/wheel fits report nominal radial clearance and engagement as a distinct
   `nominal-axial-fit` gate; a coarse oriented-box overlap is labelled a **broad-phase OBB proxy**
   (`authoritative:false`) and never presented as a collision or a failed fit; mesh/CCD/manufacturing
   gates stay `NOT_RUN`.
   Evidence: `node scripts/inspect-bearing-wheel.mjs`, its `--blocked` counter-example, and
   `tests/ai-agent.test.mjs`.
4. **Bounded LDraw `.ldr`/`.mpd` import.** A minimal, safe importer maps standard LDraw part
   references to catalog components with LDU→mm and Y-down→Y-up conversion, bounded nesting and
   hard budgets. It does **not** copy third-party geometry and does **not** claim Studio round-trip.
   Evidence: `packages/ldraw-interop/index.mjs`, `tests/ldraw-interop.test.mjs`,
   `docs/rfc/ldraw-interop.md`.

Four demoable end-to-end cases (all in-repo): the six-wheel Mars rover plan, the
bearing/shaft/wheel nominal-fit example, a four-bar / shaft-drive / linear-carriage constraint
preset in the browser Constraint Lab, and an LDraw import of a self-authored fixture.

**Complementary space with BrickLink Studio / the LDraw ecosystem (hypothesis, not a claim):**
Studio/LDraw are strong at part libraries, instruction authoring and rendering. Brick Worlds
focuses on **typed interface metadata + an independent kinematic/clearance validator + an
agent-native artifact contract**. The plausible complement is "verify and reason about a design",
not "author or replace it".

## 1A. Capability tiers (implemented / verified / demoable / enterprise gaps / quantifiable gaps)

| Tier | Meaning | Contents |
| --- | --- | --- |
| **Implemented** | Code exists in-repo | L0–L2 pipeline; graph solver; nominal-fit + bounded mesh + discrete path gates; Agent plan; CLI; MCP stdio; plugin registry; bounded LDraw import; 116 tests |
| **Verified** | Proven by an executed check in this repo | `npm test` 116/116; `npm run test:skills`; `npm run build`; CLI registry/pipeline; `inspect-bearing-wheel` (+`--blocked`→exit 2); Playwright browser pass (0 console errors); GitHub Actions `verify` job green on the pushed SHA |
| **Demoable** | A reviewer can run it live | Mars rover plan; bearing-wheel nominal fit (PASS) vs broad-phase proxy (WARN); four-bar closure; building request → `unsupported`/L0; blocked insertion → `needs_revision`; LDraw import of a self-authored fixture |
| **Enterprise gaps** | Needed for a paid evaluation, absent today | Full real-part/element-ID dataset; measured tolerances & press-fit; continuous CCD; dynamics/torque/friction/mass; structural/energy/code solvers; multi-agent/on-prem model gateway; SSO/audit; sustained performance on large systems |
| **Quantifiable gaps** | A number we can measure next | see §3 (all currently **unmeasured** — reported as `NOT_RUN`, never as an estimate) |

**Element-ID / LDraw coverage gap (headline):** the LDraw catalogue has thousands of parts; this
repo maps **6** part numbers and ships **0** third-party part files. Any "X% of a real design
imports" figure must be *measured against a licensed fixture*; it is `NOT_RUN` today.

## 2. Five risks blocking a paid evaluation

| # | Risk | Why it blocks | Current evidence |
| --- | --- | --- | --- |
| R1 | **Real-part compatibility** | The catalog is 101 *procedural* parts, not the full real brick inventory; IDs do not map to official element IDs. | `src/catalog.js`; no external element-ID dataset (licensing unresolved) |
| R2 | **Studio / LDraw interoperability** | A bounded **import** exists, but there is **no export**, no measured round-trip diff and only 6 mapped part numbers. | `packages/ldraw-interop/index.mjs`; `docs/rfc/ldraw-interop.md`; round-trip `NOT_RUN` |
| R3 | **Mechanical-validation strength** | Only nominal fits + bounded static mesh + discrete path. No measured tolerance, CCD, dynamics or strength. | `L2.physical-fit = NOT_RUN`, `L2.motion-envelope = NOT_RUN` |
| R4 | **Copyright / trademark / MIT scope** | Part naming, "LEGO"-adjacent wording and third-party asset provenance need review; brand disclaimer must stay. | `LICENSE` (MIT), unofficial fan-project disclaimer; no third-party part data committed |
| R5 | **Data security / deployment** | Evaluation teams may require self-hosting and no external model calls; the client must never hold model API keys or unrestricted shell/HTTP. | `docs/agent-plugin-runtime.md`; runner rejects arbitrary keys; MCP exposes bounded tools only |

## 3. Measurable pilot metrics (targets — to be measured, not invented)

| Metric | Definition | Target (hypothesis) | How measured |
| --- | --- | --- | --- |
| Design-task time | time to reach a validated concept + BOM + steps | not yet measured | paired task timing vs. baseline |
| Hard-constraint retention | % hard requirements preserved end-to-end | not yet measured | validator report diff |
| Connection correctness | % graph edges that pass independent re-validation | not yet measured | `ValidationReport` counts |
| Round-trip correctness | LDraw import→edit→export fidelity | **import verified; round-trip `NOT_RUN`** (no export, no licensed fixture) | fixture + diff after R2 lands |
| LDraw import coverage | % of a real design's part references resolved | **`NOT_RUN`** (6 parts mapped; no licensed fixture) | count resolved references |
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
