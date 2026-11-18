# Run log — 2026-11-18 — branch `agent/local-validation-20261118`

## 0. Environment and identity

| Item | Value |
| --- | --- |
| Working dir | `LEGO-Worlds` (repo `1998x-stack/LEGO-Worlds`) |
| OS | Darwin 27.3.0 (macOS), arm64 |
| Node | v26.13.1 (repo requires `>=20.19.0`; CI uses 22) |
| npm | 11.20.0 |
| Base SHA | `08c1141c8712132e0a05520d5ca246430f09b581` (== `origin/main` after fetch) |
| Work HEAD after this run | `a74ac2dff94ee0c322e669d013a093cce4de78fd` (4 commits) |
| remoteHeadSha | same as base at fetch time (no divergence) |
| Browser | local Google Chrome 158.0.8127.37, headless=new, SwiftShader (no GPU) |

`git fetch` succeeded; local `HEAD` and `origin/main` were identical at start, so this run
extends the published baseline rather than racing it.

## 1. Baseline (before changes)

All existing gates were green on the untouched baseline:

| Command | Exit | Result |
| --- | ---: | --- |
| `npm run test:skills` | 0 | 12 canonical skills + adapters + Pi router validated |
| `npm test` | 0 | 99 tests / 99 pass / 0 fail |
| `npm run build` | 0 | vite production build ok |
| `npm run world:run -- registry` | 0 | capability registry emitted |
| `npm run world:pipeline -- --prompt "搭建一辆六轮火星探测车"` | 0 | `ok`, 10 bodies / 9 joints, ValidationReport |
| `npm run world:pipeline -- --prompt "装配一个轴承衬套、转轴和轮组" --mesh` | 0 | `ok`, kinematic-concept |
| `npm run world:pipeline -- --prompt "设计一栋10层建筑"` | 0 | `unsupported`, L0 requirements-only (WorldSpec + ValidationReport only) |
| `node scripts/inspect-bearing-wheel.mjs` | 0 | pass 7 / warn 3 / fail 0 / notRun 5 |
| `node scripts/inspect-bearing-wheel.mjs --blocked` | 2 | **expected** `ASSEMBLY_PATH_BLOCKED` counter-example |

There is **no P0 functional failure** on the baseline: build, CLI, MCP stdio, L0–L2 pipeline,
adversarial tests and the V0.9 bearing/insertion gates all behave correctly. The defects found
were data/documentation-consistency and a browser console error.

## 2. Environment hazard discovered (not a repo defect)

Port `4173` (the configured preview port) was already occupied on this machine by a **different
project** (`Mechanical Worlds`) which serves an SPA catch-all. A naive `curl 127.0.0.1:4173/...`
returns `200` with the *wrong* application. Preview was therefore run on `4317`
(`npx vite preview --host 127.0.0.1 --port 4317`). Root `/` correctly 302-redirects to
`/LEGO-Worlds/`, confirming the GitHub Pages base path.

## 3. Defects found and fixed

### D-01 (P1, data + UX) — bearing sleeve registered under a stray 11th family

- **Where**: `src/catalog.js`, component `bearing-sleeve-8mm` (`BW-TC-021`) had
  `"family": "Technic"` while the other 15 Technic parts use `"Technic Structure"`.
- **Impact**: `src/main.js:265` builds the component-browser filter chips from
  `new Set(COMPONENTS.map(c => c.family))`, so a spurious `Technic` chip with a single part
  appeared. `docs/parts-index.md` already listed `BW-TC-021` under **Technic Structure**, and
  `docs/component-system.md` claims "ten families" — the catalog contradicted both.
- **Reproduce (before)**: load `#components`, count family chips → 12 (`All` + 11 families).
- **Fix**: assign the part to `Technic Structure`. Families now = 10.
- **Regression guard**: `tests/catalog.test.mjs` → "component families follow the canonical
  ten-family taxonomy".
- **Verified (after)**: browser chip list is `All` + the 10 documented families.

### D-02 (P2, documentation authenticity) — stale counts

- `AGENTS.md`: "100 procedural component definitions" → **101**.
- `docs/roadmap.md`: "Publish 100 coded … definitions" / "all 100 catalogue components" → **101**;
  "46 procedural geometry factory types" → **47** (counted from the `createPart` switch cases;
  `docs/component-system.md` already said 47).
- **Regression guard**: `tests/docs-consistency.test.mjs` — asserts README/README.zh-CN/AGENTS/
  component-system/parts-index counts match `COMPONENTS.length`, and fails on any stale
  `100 …` component or `46 … geometry` claim.

### D-03 (P2, browser console error) — missing favicon

- `index.html` declared no icon, so the browser requested `/favicon.ico` → `404`
  (one console error on every load; also no tab icon).
- **Fix**: inline `data:image/svg+xml` icon — removes the request entirely, base-path safe.
- **Verified (after)**: browser console error list is empty.
- **Regression guard**: `tests/docs-consistency.test.mjs` → "index.html ships a favicon".

## 4. Verification after changes

| Command | Exit | Result |
| --- | ---: | --- |
| `npm run test:skills` | 0 | 12 skills validated |
| `npm test` | 0 | **104 tests / 104 pass / 0 fail** (was 99; +5) |
| `npm run build` | 0 | ok |
| `git diff --check` | 0 | clean |
| `node scripts/inspect-bearing-wheel.mjs` | 0 | pass 7 / warn 3 / fail 0 |
| `node scripts/inspect-bearing-wheel.mjs --blocked` | 2 | expected block |

Browser (Chrome headless against the production build): WebGL available, 9 sections, 5 canvases,
Agent plan renders 10 parts / 9 joints / 0.000 mm error, Constraint Lab loads all four presets,
mobile `☰` toggles the nav, **0 console errors**.

## 5. Commits

```
a74ac2d fix(ui): add inline favicon to remove console 404
be81d29 docs: correct stale component, family and factory counts
1d49c13 test: guard catalog family taxonomy and public documentation counts
5d6b0d1 fix(catalog): unify Technic parts under one 'Technic Structure' family
```

## 6. Explicitly NOT verified this run (must not be claimed as passing)

- **Measured fit / tolerances / press-fit**, **continuous (CCD) swept collision**, **swept joint
  envelopes**, **rigid-body dynamics, torque, friction, mass** → `NOT_RUN` (unchanged).
- **Building structural/FEM, fire/egress, code compliance** → `UNSUPPORTED` / L0 only.
- **Aircraft aero/flight/propulsion** → `UNSUPPORTED` / L0 only.
- **Studio / LDraw `.ldr` / `.mpd` round-trip** → not implemented; only an RFC sketch exists
  (see `docs/business/pilot-readiness.md`).
- **Remote GitHub Pages deploy** → not run (no push performed this round). Local `vite preview`
  of the production build was verified instead.
- **Real hardware / manufacturing certification** → out of scope.
