# BRICK WORLDS

**Build it. Break it. Understand it.**

[中文说明](README.zh-CN.md) · [Architecture](docs/architecture.md) · [Component system](docs/component-system.md) · [100-piece index](docs/parts-index.md) · [Connection anchors](docs/connection-anchors.md) · [Snap Builder](docs/snap-builder.md) · [Technic Mechanics](docs/technic-mechanics.md) · [Hierarchy & Joints](docs/hierarchy-assembly.md) · [Roadmap](docs/roadmap.md)

An independent, open-source 3D brick system explorer. Discover reusable components, inspect original assemblies in 3D, reveal typed connection anchors, explode builds into their constituent parts, follow step-by-step construction sequences, and design small stud-grid builds in the Snap Builder Lab.

> **Unofficial project notice:** This is an independent educational and visualization project. LEGO® is a trademark of the LEGO Group, which does not sponsor, authorize, or endorse this project. This repository uses original procedural geometry and does not distribute LEGO set instructions, logos, minifigure IP, or copied third-party models.

## Hierarchical Joint & Assembly Lab (V0.5)

**[Launch the Assembly Lab](https://1998x-stack.github.io/LEGO-Worlds/#assembly)** to explore parent-child rigid subassemblies and hinge constraints. This release includes three original demos: **Articulated Crane**, **Twin Drawbridge**, and **Solar Observatory**. Select subassemblies, drive hinge angles, inspect mirrored couplings, show connection anchors, isolate moving branches and play a dependency-based piece-by-piece disassembly/reassembly timeline. Save/reopen the versioned joint recipe or export the current static GLB pose.

The solver propagates 3D rigid transforms through a validated parent tree. Animation trajectories are **schematic, not collision-planned**, and the joint motion is kinematic rather than physical. See [Hierarchy & Joint System](docs/hierarchy-assembly.md).

## Technic Mechanics Lab (V0.4)

**[Open the Mechanics Lab on GitHub Pages](https://1998x-stack.github.io/LEGO-Worlds/#mechanics)**. Assemble pins and cross axles into 8 mm spaced Technic beam holes, mount wheels and spur gears on the axes, inspect a joint/gear-mesh graph, and animate assembly and counter-rotating gear drive. Three ready-made demonstrations include Dual Gear Drive, Wheel & Axle, and Pin Fixture. Save a constrained, replayable JSON build recipe or export GLB geometry.

This is a **guided** mechanical experiment with explicit target-hole selection rather than free-form 6-DOF drag snapping. The drive is kinematic, not a real torque or tooth-contact simulation. See [Technic mechanics specification](docs/technic-mechanics.md).

## Snap Builder Lab (V0.3)

The homepage includes an interactive **Snap Builder** that launches on demand. Choose a brick, plate, tile or jumper, drag it near studs, rotate in 90° increments, preview valid and blocked positions, undo/redo changes, and save or import a versioned assembly JSON file. Geometry can also be exported as GLB. The demo includes a fixed 2×6 foundation plate.

Snapping is intentionally limited to the stud/socket interfaces of grid components. More complex Technic, gear and hinged connections still require specialized constraints and collision checks. See [Snap Builder documentation](docs/snap-builder.md).

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
  snap-engine.js       # Rigid stud/socket solver, overlap checks and JSON schema
  technic-engine.js    # Beam pin/axle joints, keyed mounts and gear ratios
  hierarchy-engine.js # Joint tree, angle propagation and assembly steps
  hierarchy-lab.js    # Interactive hierarchy/hinge animation inspector
  mechanics-lab.js     # Interactive mechanical assembly and drive animation
  builder-lab.js       # Drag/rotate/preview interactive Three.js builder
  viewer.js           # Three.js scene, assembly and exploded-view controls
  main.js             # Gallery, filters, detail panel and interactions
  styles.css          # Responsive Brick Worlds design system
docs/
  architecture.md
  component-system.md
  connection-anchors.md
  snap-builder.md
  technic-mechanics.md
  hierarchy-assembly.md
  roadmap.md
tests/
  catalog.test.mjs
  connection-anchors.test.mjs
  snap-engine.test.mjs
  technic-engine.test.mjs
  hierarchy-engine.test.mjs
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
