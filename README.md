# Wildling Perch

Interactive, frontend-only classroom prototype for configuring a modular indoor climbing frame.

## Run locally

```bash
npm install
npm run dev
```

Open the local URL shown by Vite. The desktop presentation centers a 430 x 932 mobile interface; viewports below 480px use the full screen.

## Verification

```bash
npm run build
npm run test:e2e
```

The Playwright tests cover the nonblank WebGL scene, room input, recommendation flow, module installation, local persistence, PDF download, language switching, and reduced-motion mode.

## Model handoff

The current product is built from Three.js primitives. Replacement GLB/GLTF files should use meters, Y-up orientation, a bottom-center origin, and named attachment nodes such as `anchor_swing_01`.
