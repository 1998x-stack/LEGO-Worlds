# Visual QA evidence — 2026-11-18

Captured with Playwright (1.65.1) driving local **Google Chrome 158** (headless=new, SwiftShader)
against the production build served by `vite preview` at `http://127.0.0.1:4321/LEGO-Worlds/`.

## Important honesty caveat

The agent model used for this run **cannot display images** — Pi reports
"Current model does not support images". The screenshots below were therefore **not judged by
human/model eyes**. Instead they were analysed **programmatically** (PIL pixel statistics) and
cross-checked with live DOM/console/network assertions. Treat the images as *machine-captured
evidence*, not as a verified aesthetic review. A human should still open them.

## What was captured

| File | View |
| --- | --- |
| `home-hero.jpg` | hero / 3D stage, 1440 px |
| `agent-rover.jpg` | `#agent` after `搭建一辆六轮火星探测车` |
| `agent-bearing.jpg` | `#agent` after `装配一个轴承衬套、转轴和轮组` |
| `agent-to-constraints.jpg` | agent graph loaded into the Constraint Lab |
| `builder-lab.jpg` / `mechanics-lab.jpg` / `assembly-lab.jpg` / `constraints-lab.jpg` | each lab after its Launch button |
| `mobile-home.jpg` | 390 px iPhone-class viewport (2× DPR) |

## Objective results

- **Page errors / console errors: 0** across all captures (the former `/favicon.ico` 404 is gone).
- **WebGL rendered, not blank:** all five canvases produced non-uniform pixels —
  hero `lum_mean 232.7 / std 28.8 / 326 sampled colours`; builder `std 11.4`; mechanics `std 10.8`;
  assembly `std 24.7`; constraints `std 23.1`. A blank/unpainted canvas would be `std ≈ 0`.
- **Layout:** `documentElement.scrollWidth − clientWidth = 0` at 1440 px **and** 390 px → no
  horizontal overflow; no element wider than the viewport.
- **Mobile:** the `☰` button is visible and toggles `.main-nav.nav-open`.
- **Fonts:** 20 web-font faces loaded (`document.fonts.status = "loaded"`).
- **Labs:** clicking each Launch button mounts a visible canvas and renders geometry.

## Minor observation (needs human confirmation) — P2

An automated WCAG contrast heuristic flagged a class of **very small muted captions**
(7–9 px, e.g. the series taglines and uppercase eyebrow labels) at roughly **2.6–3.6:1** on light
backgrounds, below the AA normal-text threshold (4.5:1). The primary CTAs are fine
(dark `#18262D` on yellow `#FFCF00`, ≈ 11:1). The heuristic can mis-read translucent layers, so
this is **reported as a candidate, not a confirmed failure** — it needs a human look and, if
accepted, is a design decision rather than a functional bug.

## How to re-run

```bash
npm run build
npx vite preview --host 127.0.0.1 --port 4321
# drive with Playwright channel:'chrome', headless, args: --use-angle=swiftshader
```
