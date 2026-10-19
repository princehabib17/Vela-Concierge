# Ring renders

The 3D configurator shows pre-rendered Blender product shots, composited and animated in the browser
(`src/lib/ringEngine.ts`). Metal and stone colours are tints applied in the browser, so one render set
covers every metal and stone.

1. `python tools/blender/build_ring.py out.glb` builds the parametric ring (needs the `bpy` module, Blender 4.2+).
2. `python tools/blender/render_layers.py OUT_DIR --frames 24 --size 800 --samples 40` renders transparent layers
   (`shadow`, `stone_<cut>`, `metal_<cut>_<setting>`, `halo_<cut>`, `pave`, `eternity`). About two hours on 4 CPU cores.
   Re-render a single layer with `--only metal_emerald_bezel`.
3. `python tools/blender/to_webp.py OUT_DIR` writes `public/ring/<layer>/NN.webp`.
4. `python tools/blender/composite_preview.py OUT_DIR out.png FRAME [metal] [gem] [cut] [setting] [band]` previews a combination offline.

## Rendering on a Mac (recommended)

`bash tools/blender/render_mac.sh` renders every layer on the Mac's GPU (Metal) at 48 angles, 1200px,
256 samples, then rewrites `public/ring` and `public/ring/manifest.json`. Override with
`FRAMES=24 SIZE=800 SAMPLES=64 bash tools/blender/render_mac.sh` for a quick draft. The app reads the
frame count from the manifest, so no code change is needed when the angle count changes.
