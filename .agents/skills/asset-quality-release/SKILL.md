---
name: asset-quality-release
description: Review procedural meshes, schema stability, 3D asset performance, tests, documentation and GitHub Pages release readiness. Use for quality gates, asset import or production deployment.
---

# asset-quality-release

Maintain stable public assets and reproducible releases.

## Trigger and scope

Use only when the request matches the frontmatter description. For unfamiliar source data or safety-critical outputs, state assumptions and do not extrapolate beyond validated capabilities.

## Workflow

1. Run npm test, npm run test:skills and npm run build before every release.
2. Verify catalog IDs, anchor frames, JSON schema versions, geometry bounds and GLB export behavior.
3. Document licensing/provenance for every third-party asset, including textures; avoid trademark/IP copying.
4. Check Page base path /LEGO-Worlds/ and responsive rendering; use browser inspection when available.
5. Report which checks ran, which did not, and physical/print limitations.

## Supporting resources

- Before implementation, read [domain contract](references/domain.md).
- Use [input/output template](assets/example.json) as a starting contract, not as measured evidence.
- Run `node .agents/skills/asset-quality-release/scripts/check.mjs` to verify this bundle.
- For changed production code run `npm test` and `npm run build`.

## Stop conditions

Do not claim verified manufacture, certified building safety, flightworthiness or general physics behavior from nominal geometry, OBB previews or template planning. Report unsupported constraints explicitly.
