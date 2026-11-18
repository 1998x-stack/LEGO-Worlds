# Nominal bearing & mesh clearance workflow (V0.9)

Before claiming any mechanical fit, read [V0.9 clearance and insertion checks](../../../../docs/clearance-v09.md).

The supported educational prototype combines `beam-5`, `bearing-sleeve-8mm`, `axle-5` and `wheel-medium`. It tests physically generated bores and three nominal fits, then opt-in static mesh contact candidates and a discrete insertion path. Keep **real tolerance, CCD, load, torque and bearing life NOT_RUN**.

Read the connector ports via `graphPorts`, reuse the existing graph solver and `packages/clearance-engine/index.mjs`. Do not guess a manufacturing press fit from nominal dimensions. Never weaken shaft clearance or remove a required constraint simply to silence a validator.
