# AGENTS.md — Brick Worlds engineering contract

## Mission

Build an extensible, source-editable 3D brick system explorer. The product is not a static image gallery: every published build should be made from named reusable components and explain how those components assemble into a whole.

## Project boundaries

- This is an independent educational and visualization project. LEGO® is a trademark of the LEGO Group; the project is not affiliated with, sponsored by, or endorsed by the LEGO Group.
- Do not copy official set instructions, official product renders, third-party meshes, minifigure designs, logos or protected character designs.
- Prefer original procedural geometry, original build concepts and neutral component names.
- Nominal dimensions are for visualization and educational reference. Never claim genuine-part compatibility, manufacturing accuracy or safe load-bearing behavior without physical validation.
- GitHub Pages is static. Do not add assumptions that a Python server, database, private storage service or secret API is available in the browser.

## Architecture and sources of truth

| Concern | Authoritative source |
| --- | --- |
| Series and published builds | `src/catalog.js` |
| Reusable part geometry | `src/brick-system.js` |
| Three.js viewer and assembly state | `src/viewer.js` |
| Gallery, filters and interactions | `src/main.js` |
| Design tokens and responsive UI | `src/styles.css` |
| Build and deploy | `vite.config.js`, `.github/workflows/pages.yml` |
| Public project behavior | `README.md`, `docs/` and tests |

Do not introduce a second catalog format unless a migration and clear ownership are documented.

## Geometry contract

- Source dimensions are authored in millimetres. `viewer.js` converts the complete assembly root to metres once with a 0.001 scale.
- The standard reference grid is 8 mm stud pitch, 9.6 mm brick body height and 3.2 mm plate body height. These are nominal educational references, not tolerance specifications.
- The scene uses +Y up. X/Z are the horizontal plane.
- A part manifest has a stable `id`, human-readable `name`, supported `type`, `pos: [x,y,z]` in mm, `color`, optional `size`, integer `step`, and optional `rotation` / `explode`.
- Part position is the component's local visual centre. Keep this convention consistent.
- `createPart(spec)` must return a named `THREE.Group`; geometry factories must not create renderers, mutate a global scene or read UI state.
- Each build has a stable kebab-case ID, a `parts` array and a `steps` array. Every part's step must be within the build's step count.
- Add a reusable component factory before adding one-off geometry to a build. A build should be a composition of reusable primitives wherever practical.
- Keep material and geometry allocation scoped to each assembly so viewer disposal remains deterministic.

## Adding a build

1. Add a model entry to `MODELS` in `src/catalog.js`.
2. Use a unique model ID and unique part IDs within that model.
3. Assign every part to an assembly step and write meaningful, human-readable part names.
4. Supply useful exploded offsets for complex or tightly packed parts; otherwise the viewer derives a radial offset.
5. Add a component entry to `COMPONENTS` when the part should be discoverable and reusable outside that build.
6. Add or update tests in `tests/catalog.test.mjs`.
7. Run `npm test` and `npm run build`; inspect the actual 3D view at desktop and mobile widths.

## Adding a part type

1. Implement it in `src/brick-system.js` and register it in `createPart`.
2. Add it to the supported-type test.
3. Give it sensible default dimensions and a clear colour/material contract.
4. Confirm it can be disposed and exported by GLTFExporter.
5. Document the geometry and nominal dimensions in `docs/component-system.md`.

## UI and performance rules

- Keep the initial page static and light; only the hero viewer and the currently opened detail viewer should own WebGL contexts.
- Dispose renderers, controls, geometries and materials when a detail modal closes.
- Cap device pixel ratio; never instantiate one renderer per catalog card.
- Use semantic buttons and labels, visible focus states, reduced-motion support and touch-friendly controls.
- Keep the mobile layout functional at 320 px wide.
- Do not add large external assets where procedural geometry is sufficient.

## Release checks

```bash
npm install
npm test
npm run build
npm run preview
```

Do not claim a successful Pages deployment until the GitHub Actions workflow has completed successfully and the public URL has been checked.
