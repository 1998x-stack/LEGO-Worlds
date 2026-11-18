# CURRENT handoff — Brick Worlds / LEGO-Worlds

> Stable entry point. **Read this first.** Machine-readable twin: [`LATEST.json`](LATEST.json).
> Latest run: [`runs/2026-11-18_agent-local-validation-20261118_iter2.md`](runs/2026-11-18_agent-local-validation-20261118_iter2.md).

## 1. Release / branch state

| Field | Value |
| --- | --- |
| Project | `1998x-stack/LEGO-Worlds` (brand: **Brick Worlds**) |
| Base SHA | `08c1141c8712132e0a05520d5ca246430f09b581` (== `origin/main`) |
| Branch | `agent/local-validation-20261118` |
|  Work HEAD (verified, CI-green) | `3ee9d973b8d914c439a01348d78270883a03f33c` |
| PR | **#1 OPEN** → <https://github.com/1998x-stack/LEGO-Worlds/pull/1> (mergeable) |
| CI | `Verify and deploy GitHub Pages` → **verify success**; deploy skipped on PR |
| Executed | 2026-11-18 |
| Env | macOS Darwin 27.3.0 arm64 · Node v26.13.1 · npm 11.20.0 · Chrome 158 headless |

13 commits on top of `08c1141`. This iteration delivered **PR integration**, the **nominal-fit vs
broad-phase-proxy** fix (P1-006), a **reproducible install**, and a **bounded LDraw import path**.

## 2. What this iteration changed

| Commit | Kind | Summary |
| --- | --- | --- |
| `8069afb` | fix | hole-to-hole rôle mismatch → `NOT_APPLICABLE` (was misleading `FAIL`) |
| `dd5b7cb` | fix | Agent plan/UI separate `nominal-axial-fit` from `broad-phase-proxy` |
| `64c27ae` | build | commit `package-lock.json`; CI installs with `npm ci` |
| `e207ac5` | feat | bounded LDraw `.ldr`/`.mpd` import + RFC + self-authored fixtures |
| `92345cf` | docs | business capability tiers + phase-5 QA evidence |

**Design decisions**
- The OBB check remains, but is explicitly non-authoritative; not deleted and not turned into PASS.
- Gate list expanded to 8 with explicit `status`, so `NOT_RUN` never reads as a pass.
- LDraw importer is bounded and never executes input; only 6 part numbers map and no third-party
  geometry is bundled, so "Studio round-trip" stays `NOT_RUN`.
- Lockfile generated from the existing exact-pinned `package.json`; **no version bumps**.

## 3. Commands run (this iteration)

Clean `npm ci` (20 pkgs, 2.5s) · `npm run test:skills` ✅ · `npm test` **116/116** ✅ ·
`npm run build` ✅ · `git diff --check` clean · CLI scenarios ✅ · Playwright browser **0 console
errors** ✅ · CI verify job success on `e207ac5`.

Evidence: [`evidence/product-qa-phase5.json`](evidence/product-qa-phase5.json),
[`evidence/validation-summary.json`](evidence/validation-summary.json),
[`evidence/browser-qa.json`](evidence/browser-qa.json),
[`evidence/visual-qa.md`](evidence/visual-qa.md) + [`evidence/screenshots/`](evidence/screenshots/).

## 4. Capability truth (L0 / L1 / L2)

| Area | State |
| --- | --- |
| L0 WorldSpec / L1 GeometryManifest / L2 AssemblyGraph | supported (concept level) |
| `nominal-axial-fit` | PASS/FAIL as an explicit gate |
| `broad-phase-proxy` (OBB) | WARN, `authoritative:false` — never a collision claim |
| `mesh-contact` / `insertion-path` | opt-in; `NOT_RUN` in plans unless requested |
| `manufacturing-fit` / `dynamics` / CCD / strength | **NOT_RUN** (unchanged) |
| Buildings / aircraft | **L0 requirements-only** |
| LDraw import | bounded `.ldr`/`.mpd`, 6 parts mapped; **round-trip NOT_RUN** |

## 5. Issues

**Fixed this iteration**
- **P1-006** Agent reported a coarse OBB overlap as a collision for a valid bearing fit → `fixed` (`dd5b7cb`).
- **P2-004** no lockfile / CI used `npm install` → `fixed` (`64c27ae`).
- **P2-005** duplicate `## V0.9` roadmap heading → `fixed` (roadmap now `V0.9a`/`V0.9b`/`V0.9c`).

**Open**
- **P1-101** LDraw export + measured round-trip against a licensed fixture — `NOT_RUN` (design in RFC).
- **P2-102** LDraw coverage: only 6 part numbers mapped; no element-ID dataset.
- **P2-007** production JS bundle single chunk 803.89 kB (unchanged).
- **P2-008** small muted captions flagged below WCAG AA by heuristic (candidate, unconfirmed).
- **P3-103** PR #1 not merged → remote Pages deploy unverified.

## 6. Cannot be claimed (guardrails)

Not LEGO-official; no manufacturing/print certification; no structural/seismic/fire/aero/flight
validation; OBB and mesh checks are approximate; discrete path samples do not prove continuous
collision-free motion; LDraw import is bounded and Studio round-trip is unverified. Preserve the
unofficial-fan-project disclaimer and MIT licensing; bundle no third-party part geometry.

## 7. Next round — Top 3

1. **Merge PR #1 and verify the deployed Pages build** on the merged SHA (green `deploy` job +
   live-site console/WebGL check). *Acceptance*: Actions `verify` **and** `deploy` success for the
   merged SHA, live site openable. *Needs*: review/merge authorization.
2. **LDraw export + measured round-trip** on a *licensed* fixture. *Acceptance*: a committed
   provenance note, an import→export diff with a real number, and Studio round-trip flipped from
   `NOT_RUN` only when the number is measured.
3. **Expand LDraw/element-ID mapping** with a provenance-audited layer and publish a coverage
   number for one real design. *Acceptance*: measured `% of references resolved`, no "full
   compatibility" wording before the figure exists.

## 8. Start here

```bash
git checkout agent/local-validation-20261118
npm ci --no-audit --no-fund
npm run test:skills && npm test && npm run build
node scripts/inspect-bearing-wheel.mjs            # exit 0
node scripts/inspect-bearing-wheel.mjs --blocked  # exit 2 (expected)
# browser QA (avoid port 4173 — it may be taken by another local project)
npx vite preview --host 127.0.0.1 --port 4322
```
Then read `LATEST.json`, the iteration-2 run log, and pick Top-3 item 1.
