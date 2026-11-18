# Architecture

## Product model

Brick Worlds separates reusable geometry, composition data, rendering and presentation.

```text
src/catalog.js
  ├── SERIES
  ├── COMPONENTS
  └── MODELS ───────────────┐
                            v
src/brick-system.js     buildAssembly(model)
  ├── createPart()          |
  ├── primitive factories  v
  └── dimensions        THREE.Group
                            |
                            v
src/connection-anchors.js
  ├── getPartAnchors()
  ├── getAssemblyAnchors()
  ├── compatibility checks
  └── optional debug helpers
                            |
                            v
src/snap-engine.js
  ├── stud/socket rigid alignment
  ├── snap candidate search and collision
  └── versioned assembly JSON
                            |
                            v
src/builder-lab.js     interactive builder
  ├── Three.js drag and ghost previews
  ├── undo/redo and connection edges
  └── JSON import/export
                            |
                            v
src/viewer.js
  ├── Scene + lights + camera
  ├── OrbitControls
  ├── exploded transforms
  ├── step visibility
  ├── part highlighting
  ├── per-part anchor overlays
  └── GLB export
                            |
                            v
src/main.js  →  gallery / filters / modal / component browser
                            |
                            v
                         Vite dist/
                            |
                            v
                    GitHub Pages (static)
```

## Runtime

The homepage uses one interactive hero viewer. A detail modal mounts a second viewer only while open. The Snap Builder mounts a separate interactive renderer on demand when the user launches the workspace. Closing the modal disposes its animation loop, ResizeObserver, OrbitControls, geometries, materials and WebGL renderer.

The model catalog is plain JavaScript data. Each assembly consists of part manifests with stable IDs, types, transforms, colours and build-step numbers. The geometry factory is deterministic and does not depend on browser state. The connection-anchor layer derives typed local datums from the same part specs, transforms them into assembly coordinates, and provides nominal interface compatibility checks. The viewer can display these datums without including them in exported GLB geometry.

## Coordinate and unit convention

- Authoring units: millimetres.
- Viewer units: metres, by applying a single 0.001 scale to the assembly root.
- Up axis: +Y.
- Ground plane: X/Z.
- Part position: centre of its visual body, in millimetres.
- Rotation: Euler radians, in X/Y/Z order.
- Connection anchors: local part coordinates in millimetres; normals and axes are normalized direction vectors.
- Anchor transforms use the same XYZ Euler rotation and translation as the owning part.

Never scale individual dimensions in the viewer and the assembly root simultaneously. See [connection anchor schema](connection-anchors.md) for the interface contract and current limitations.

## GitHub Pages

Vite's base path is `/LEGO-Worlds/`. The Pages workflow runs tests, builds the static site, uploads `dist/` and deploys it through the GitHub Pages deployment environment. No backend is required.

## Snap Builder

The stud/socket snap solver is independent of the DOM and can be tested under Node.js. The Builder UI creates a separate scene only on user launch and uses a translucent candidate mesh to show ready/blocked/near states. The JSON schema is versioned and stores catalog-based part instances plus computed connection edges. This first implementation deliberately excludes specialized Technic, gear and hinged auto-snap behavior; see [Snap Builder](snap-builder.md).
