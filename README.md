# BRICK WORLDS

**Build it. Break it. Understand it.**

[中文说明](README.zh-CN.md) · [Architecture](docs/architecture.md) · [Component system](docs/component-system.md) · [100-piece index](docs/parts-index.md) · [Connection anchors](docs/connection-anchors.md) · [Roadmap](docs/roadmap.md)

An independent, open-source 3D brick system explorer. Discover reusable components, inspect original assemblies in 3D, reveal typed connection anchors, explode builds into their constituent parts, and follow step-by-step construction sequences.

> **Unofficial project notice:** This is an independent educational and visualization project. LEGO® is a trademark of the LEGO Group, which does not sponsor, authorize, or endorse this project. This repository uses original procedural geometry and does not distribute LEGO set instructions, logos, minifigure IP, or copied third-party models.

## First release

- **100-piece Component Library** — ten families covering bricks, plates, curves, SNOT connectors, Technic, gears, motion, architecture, nature and special elements.
- **Brick System** — foundational bricks, plates, tiles, slopes, jumpers and connection pieces.
- **Technic Mechanics** — beams, pins, axles, gears, wheels and mechanical assemblies.
- **Modular City** — reusable architectural modules and small urban scenes.
- **Creative Lab** — original showcase builds, beginning with *Clockwork Koi Garden*.

The component library contains exactly 100 coded, parameterized component definitions across ten families. Every featured build is assembled from named, reusable parts. The 3D viewer supports orbit, zoom, exploded-view inspection, part selection and guided assembly steps.

## Run locally

Requirements: Node.js 20+ and npm.

```bash
git clone https://github.com/1998x-stack/LEGO-Worlds.git
cd LEGO-Worlds
npm install
npm run dev
```

## Verify and build

```bash
npm test
npm run build
npm run preview
```

## GitHub Pages

The repository includes a GitHub Actions Pages workflow. It builds the Vite site with the project base path `/LEGO-Worlds/` and deploys the `dist/` artifact on pushes to `main`.

Public URL: https://1998x-stack.github.io/LEGO-Worlds/

If Pages has not been enabled for the repository yet, open **Settings → Pages → Build and deployment → Source** and select **GitHub Actions**. The first successful workflow run will publish the site.

## Design system

- **System dimensions:** 8 mm stud pitch, 9.6 mm brick body height, 3.2 mm plate body height, 4.8 mm nominal stud diameter and 1.7 mm nominal stud height.
- **Coordinate convention:** model source dimensions are authored in millimetres; the viewer converts them to metres for Three.js.
- **Geometry:** original procedural meshes generated from reusable part factories.
- **Assembly contract:** each part has a stable ID, type, colour, transform, assembly step and exploded offset.
- **Rendering:** Three.js with OrbitControls, responsive canvas sizing, bounded pixel ratio and explicit disposal.
- **Hosting:** static GitHub Pages; no backend or secrets required.

Dimensions are educational nominal references, not a guarantee of physical compatibility with genuine LEGO elements. Any 3D-printed interlocking part requires tolerance testing with the target printer, material and mating element.

## Repository map

```text
src/
  catalog.js          # Series, component library and assembly manifests
  brick-system.js     # Reusable procedural part geometry
  connection-anchors.js # Typed anchors, coordinate transforms and compatibility
  viewer.js           # Three.js scene, assembly and exploded-view controls
  main.js             # Gallery, filters, detail panel and interactions
  styles.css          # Responsive Brick Worlds design system
docs/
  architecture.md
  component-system.md
  connection-anchors.md
  roadmap.md
tests/
  catalog.test.mjs
  connection-anchors.test.mjs
.github/workflows/
  pages.yml
```

## Extending the catalog

1. Add a reusable part type or improve an existing factory in `src/brick-system.js`.
2. Add a component entry to `COMPONENTS` in `src/catalog.js` if it belongs in the parts library.
3. Add a model manifest to `MODELS`. Use stable kebab-case IDs, named parts, explicit assembly steps and meaningful exploded offsets.
4. Run `npm test` and `npm run build`.
5. Check the model in the browser at desktop and mobile widths before merging.

Prefer reusable geometry over one-off meshes. A model should explain its construction, not merely look assembled.

## License

MIT. See [LICENSE](LICENSE). Trademark and third-party rights remain with their respective owners.
