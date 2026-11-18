# Run log — 2026-11-18 (iteration 2) — branch `agent/local-validation-20261118`

Continuation of the local-validation branch. Base `08c1141` (== `origin/main`).

## 0. Phase 0 — context restore

| Field | Value |
| --- | --- |
| Branch | `agent/local-validation-20261118` |
| Base SHA | `08c1141c8712132e0a05520d5ca246430f09b581` |
| Prior handoff HEAD | `e226a822d9d575609ad8f0f5372ed4b45106f8c3` (matched) |
| Working tree at start | clean |
| `origin/main` | unchanged at `08c1141` (no new remote commits) |
| Env | macOS Darwin 27.3.0 arm64 · Node v26.13.1 · npm 11.20.0 · Chrome 158 headless |

Git state matched the handoff exactly; no reset or protection was needed.

## 1. Phase 1 — PR integration

- Inspected all 8 prior commits: 24 files, only `src/catalog.js`, tests, docs, `index.html`.
  No build artifacts / `node_modules` / lockfile tracked; no secrets or machine paths.
- Re-ran `npm run test:skills` (0), `npm test` (104/104, 0), `npm run build` (0), `git diff --check` (0).
- **Write access confirmed**: `gh` authenticated as `1998x-stack` (scopes `repo`, `workflow`);
  SSH push works.
- Pushed the branch and opened **PR #1**: <https://github.com/1998x-stack/LEGO-Worlds/pull/1>
  (base `main`, state OPEN, mergerable = MERGEABLE).
- CI: `Verify and deploy GitHub Pages` → **verify = success**; `deploy = skipped` (PR runs do not
  deploy). Green runs observed for `e226a82` (24s) and `e207ac5` (16s).
- Pushed no `main` change, no force-push, no merge.

## 2. Phase 2 — nominal fit vs collision messaging (P1-006)

**Root cause.** The Agent plan and UI reported the coarse oriented-box broad-phase overlap as
`REVIEW COLLISIONS` / `OBB WARNINGS`, so a valid bearing assembly looked like a failed fit, and
`validateAgentGraph` never computed the (already-available) nominal coaxial fit.

**Changes**
- `src/ai-agent.js`: computes `reviewNominalAxialInterfaces` from solved poses; replaces the
  5-item checklist with 8 explicitly-graded gates — `schema`, `kinematics`, `nominal-axial-fit`,
  `broad-phase-proxy`, `mesh-contact`, `insertion-path`, `manufacturing-fit`, `dynamics` — each
  with `status` ∈ PASS/FAIL/WARN/NOT_RUN/NOT_APPLICABLE. Adds `collisionSemantics`
  (`kind:'broad-phase-obb-proxy'`, `authoritative:false`) and `nominalFit`. Status becomes
  `kinematic-with-proxy-warnings` / `nominal-fit-interference` / `kinematic-validated-concept`.
- `src/main.js` + `src/styles.css`: UI tag now `KINEMATICS CHECKED · BROAD-PHASE PROXY WARN`,
  metric `OBB PROXY`, a proxy explanation line, and ✓/✕/○ gate rendering.
- `packages/validation-engine/index.mjs`: OBB gate message states it is a broad-phase proxy,
  not a collision/fit conclusion (`{proxyKind, authoritative:false}`).
- `packages/agent-repair/index.mjs`: clearer proxy diagnostic wording.
- `packages/clearance-engine/index.mjs`: a hole-to-hole rôle mismatch (no male/female pair) is
  `NOT_APPLICABLE`, not `FAIL`; L2 counts only evaluated interfaces.

**Regression tests** (`tests/ai-agent.test.mjs`): valid bearing → `nominal-axial-fit` PASS and
proxy `authoritative:false`; oversized sleeve → `FAIL` + `nominal-fit-interference`; hole-to-hole
hinge → `NOT_APPLICABLE`; rover gates verified incl. `NOT_RUN` for mesh/insertion/manufacturing/dynamics.

## 3. Phase 3 — reproducible dependencies

- Generated `package-lock.json` (lockfileVersion 3, 71 packages) from the existing exact-pinned
  `package.json`; **no version bumps**.
- Switched `.github/workflows/pages.yml` from `npm install` to `npm ci`.
- Verified `rm -rf node_modules && npm ci` (20 packages, 2.5s) then full suite + build.
- Added a guard test asserting a valid lockfile exists and CI uses `npm ci` (never `npm install`).

## 4. Phase 4 — LDraw interoperability

- **RFC**: `docs/rfc/ldraw-interop.md` (data model, part/colour mapping, LDU→mm + Y-down→Y-up,
  rotation/dot convention, steps, validation/security, Studio test strategy, failure states,
  non-claims).
- **Importer**: `packages/ldraw-interop/index.mjs` — `parseLdrawLines`, `importLdraw`,
  `LDRAW_PART_MAP`, `LDRAW_COLORS`. Bounded (lines 5000 / bodies 256 / depth 2), rejects
  non-finite and path-traversal input, never executes input or touches the network, reports
  unsupported parts instead of dropping them.
- **TDD**: wrote `tests/ldraw-interop.test.mjs` first → RED (`ERR_MODULE_NOT_FOUND`), then
  implemented → GREEN (8/8). One real bug found by the test: sub-model `STEP` boundaries were not
  reaching the expander (fixed).
- **Fixtures**: only self-authored files under MIT (`tests/fixtures/ldraw/{basic.ldr,stack.mpd}`);
  **no third-party part geometry bundled**.
- **Not claimed**: Studio round-trip/export is `NOT_RUN`.

## 5. Phase 5 — product QA

CLI/agent (all as expected): Mars rover (10 parts/9 joints), bearing-wheel (nominal PASS, 1 OBB
proxy, authoritative false), four-bar (nominal NOT_APPLICABLE), building (unsupported/L0),
blocked insertion (exit 2, `ASSEMBLY_PATH_BLOCKED`), invalid connector (rejected).

Browser (Chrome 158 headless, `vite preview` @4322): 13 build cards; all four labs launch and
render; Agent bearing result shows `KINEMATICS CHECKED · BROAD-PHASE PROXY WARN`, `1 OBB PROXY`,
`Nominal coaxial fit: PASS.`, gates ✓✓✓○○○○○; agent→Constraint Lab opens; agent export downloads
`brick-worlds-agent-plan.json`; **0 console errors**. Evidence:
`docs/handoff/evidence/product-qa-phase5.json`.

`docs/business/pilot-readiness.md` now separates implemented / verified / demoable /
enterprise-gap / quantifiable-gap capabilities and updates the LDraw risk.

## 6. Verification (all commands run this iteration)

| Command | Exit | Result |
| --- | ---: | --- |
| `npm ci --no-audit --no-fund` (clean) | 0 | 20 packages in 2.5s |
| `npm run test:skills` | 0 | 12 skills validated |
| `npm test` | 0 | **116 / 116 pass** (was 104; +12) |
| `npm run build` | 0 | ok |
| `git diff --check` | 0 | clean |
| CLI scenarios (§5) | 0 / 2 | as expected |
| Playwright browser pass | 0 | 0 console errors |
| GitHub Actions `verify` (SHA `e207ac5`) | success | `npm ci` + tests + build in CI |

## 7. Remaining / NOT_RUN

- Studio/LDraw **export and measured round-trip** — `NOT_RUN` (no export; no licensed fixture).
- Measured fit/tolerance/press-fit; continuous CCD; dynamics/torque/mass; structural/energy/code —
  `NOT_RUN`.
- Remote **Pages deploy** — `NOT_RUN` until PR #1 is merged (PR runs skip `deploy`).
- LDraw part coverage — 6 mapped parts, 0 third-party files; a real coverage % is unmeasured.

## 8. Commits (this iteration)

```
8069afb fix(clearance): treat hole-to-hole role mismatch as NOT_APPLICABLE, not FAIL
dd5b7cb fix(agent): separate nominal fit from broad-phase OBB proxy
64c27ae build: add npm lockfile and install with npm ci for reproducibility
e207ac5 feat(ldraw): bounded .ldr/.mpd import path with RFC
92345cf docs(business): add capability tiers and phase-5 QA evidence
```
