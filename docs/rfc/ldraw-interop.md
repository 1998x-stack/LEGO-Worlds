# RFC: LDraw (.ldr / .mpd) interoperability

**Status:** Partial — a bounded importer is implemented and tested. **Full BrickLink Studio
round-trip compatibility is NOT implemented and NOT claimed.**
**Scope owner:** LEGO-Worlds / Brick Worlds (independent, unofficial project).

> This RFC is a design + honest capability statement. It bundles **no** third-party part,
> sub-file or library geometry. The only LDraw samples in the repo are hand-authored by this
> project under MIT (`tests/fixtures/ldraw/`). Real Studio conformance remains `NOT_RUN`.

## 1. Why this matters (business context)

BrickLink Studio and the LDraw ecosystem are strong at part libraries, instruction authoring and
rendering. Brick Worlds' complement is **typed interface metadata + an independent
kinematic/clearance validator + an agent-native artifact contract**. Interop would let a reviewer
bring an existing `.ldr`/`.mpd` design in, and then *ask questions* the authoring tools do not
answer (does the graph close? do nominal fits hold? is an insertion path blocked?). It is a
*complement*, not a Studio replacement.

## 2. LDraw data model (as modelled here)

A `.ldr`/`.mpd` file is a **plain-text** list of lines. Relevant line types:

| Type | Meaning | Fields |
| ---: | --- | --- |
| 0 | Meta / comment | `0 FILE <name>`, `0 STEP`, `0 Name:`, `0 Author:`, `0 !LPUB …` |
| 1 | Sub-file / part reference | `1 <colour> x y z a b c d e f g h i <file>` |
| 2 | Line | geometry primitive |
| 3 | Triangle | geometry primitive |
| 4 | Quadrilateral | geometry primitive |
| 5 | Optional line | geometry primitive |

Key properties used by the importer:

- **Line type 1** carries a **colour code**, a translation `(x,y,z)` in LDU, a **3×3 rotation
  matrix** `[[a,b,c],[d,e,f],[g,h,i]]` and a part/sub-file name.
- LDraw applies the matrix in the **row-vector** convention: `p' = p · A + t`.
- `.mpd` is a container of named models introduced by `0 FILE <name>`; a type-1 line may
  reference another model by name (nesting).
- `0 STEP` marks an assembly-step boundary.

## 3. Units and coordinate transform

| Quantity | LDraw (LDU) | Brick Worlds (mm) |
| --- | ---: | ---: |
| Stud pitch | 20 | 8 |
| Brick height | 24 | 9.6 |
| Plate height | 8 | 3.2 |

- **Scale:** `mm = LDU × 0.4` (`LDRAW_MM_PER_LDU`), derived from the 8 mm stud pitch.
- **Axis:** LDraw uses **Y-down**; Brick Worlds uses **+Y up**. The importer applies
  `B = diag(1, −1, −1)` so that `world = S · B · (t + A · p)`, i.e.
  `posMm = [x, −y, −z] × 0.4` and `rotation = B · Aᵀ · B` (a proper rotation; the transpose
  converts LDraw's row-vector matrix to Three.js's column-vector convention).

> **Honesty note:** the axis sign choices beyond Y are a documented *project convention* chosen to
> keep a right-handed Y-up frame. They have **not** been validated against a real Studio export
> (`NOT_RUN`). A vertical-flip bug is exactly the kind of thing a real fixture must catch.

## 4. Part-ID and colour mapping

Mapping is **explicit and bounded** in `packages/ldraw-interop/index.mjs`:

| LDraw part | Catalog id | Catalog code |
| --- | --- | --- |
| `3005.dat` | `brick-1x1` | BW-BR-001 |
| `3004.dat` | `brick-1x2` | BW-BR-002 |
| `3003.dat` | `brick-2x2` | BW-BR-007 |
| `3001.dat` | `brick-2x4` | BW-BR-009 |
| `3020.dat` | `plate-2x4` | BW-PT-006 |
| `3710.dat` | `plate-1x4` | BW-PT-004 |

Part numbers are **public factual identifiers**; no geometry is copied. Colours use a small set of
standard LDraw colour codes with their widely published RGB values (`LDRAW_COLORS`). The full
`LDConfig.ldr` is CCAL-licensed and is **not** bundled. An unmapped colour falls back to a
documented default (`#B4B4B4`) with the code preserved — it is never a silent drop.

## 5. Input validation, security and provenance

- **Never executes input**, never fetches the network, never writes files.
- Numeric fields must be finite and `|v| ≤ 1e6`; otherwise `MALFORMED_REFERENCE`.
- Part/model names must match `^[A-Za-z0-9][A-Za-z0-9_.-]*\.(dat|ldr)$`. Path separators,
  `..`, backslashes and control characters are rejected (`UNSAFE_PART_NAME` / `UNSAFE_MODEL_NAME`).
- Hard budgets: `maxLines` (5000), `maxBodies` (256), `maxDepth` (2). Exceeding a budget yields a
  diagnostic and `status: needs_revision` — never a silent truncation presented as success.
- **Provenance:** any third-party fixture must carry licence evidence before it is committed. This
  RFC ships only self-authored fixtures.

## 6. Conversion status and failure states

`importLdraw(text, catalog, options)` returns:

```jsonc
{
  "status": "ok" | "needs_revision",
  "model": { "name": "...", "components": [{ "catalogId", "code", "colorHex", "posMm", "rotationEuler", "step", ... }] },
  "unsupported": [{ "partId", "step", "reason" }],
  "diagnostics": [{ "code", "severity", "line", "message" }],
  "stats": { "mapped", "unmapped", "expandedSubmodels", ... },
  "capability": { "realGeometry": false, "studioRoundTrip": "not-run", "network": false }
}
```

Diagnostic codes: `MALFORMED_REFERENCE`, `UNSAFE_PART_NAME`, `UNSAFE_MODEL_NAME`,
`UNSUPPORTED_PART`, `MODEL_NOT_FOUND`, `LINE_BUDGET_EXCEEDED`, `BODY_BUDGET_EXCEEDED`,
`DEPTH_BUDGET_EXCEEDED`, `UNKNOWN_LINE_TYPE`.

**Unsupported today:** raw primitives (types 2–5) are not converted to geometry; sub-model
internal `STEP` ordering is flattened to the reference step; BFC/`!LPUB`/`ROTSTEP` meta commands
are ignored; only the six mapped parts resolve.

## 7. BrickLink Studio compatibility testing strategy

Staged, evidence-first — each stage gates the next:

1. **Self-authored fixtures (done).** Hand-written `.ldr` + `.mpd` prove parsing, unit/axis
   conversion, nesting and rejection paths without any licensed data.
2. **Licensed external fixture (next).** Obtain a real Studio `.ldr`/`.mpd` export with written
   provenance/licence note, commit it under `tests/fixtures/ldraw/` **only** with that evidence.
3. **Measured round-trip diff (next).** Import → re-export a Brick Worlds representation → diff
   against the original; record a real number (e.g. `% of line-type-1 references resolved`).
   Until this exists, Studio round-trip stays **`NOT_RUN`**.
4. **Element-ID coverage study.** Estimate how many of a real design's parts map to the catalog;
   publish the number. No "full compatibility" wording before a measured figure exists.

## 8. Non-claims

- Not affiliated with or endorsed by the LEGO Group, BrickLink or the LDraw.org SteerCo.
- No third-party part library is bundled, copied or redistributed.
- Import success is **not** a structural, mechanical-fit, durability or manufacturing claim.
- Full Studio/LDraw round-trip is **not** implemented.

## 9. Implementation references

- `packages/ldraw-interop/index.mjs` — `parseLdrawLines`, `importLdraw`, `LDRAW_PART_MAP`, `LDRAW_COLORS`.
- `tests/ldraw-interop.test.mjs` — positive, negative, budget and nesting cases.
- `tests/fixtures/ldraw/{basic.ldr,stack.mpd}` — self-authored fixtures.
