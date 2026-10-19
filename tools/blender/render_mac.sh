#!/bin/bash
# Renders every ring layer on this Mac's GPU and refreshes public/ring for the app.
# Run from the repository root:   bash tools/blender/render_mac.sh
# Re-running resumes: frames already rendered are skipped.
set -euo pipefail

BLENDER="${BLENDER:-/Applications/Blender.app/Contents/MacOS/Blender}"
OUT="${OUT:-$HOME/vela-ring-renders}"
FRAMES="${FRAMES:-48}"     # angles per turn (24 = draft)
SIZE="${SIZE:-1200}"       # pixels, square
SAMPLES="${SAMPLES:-256}"  # Cycles samples per frame

[ -x "$BLENDER" ] || { echo "Blender not found at $BLENDER (set BLENDER=/path/to/Blender)"; exit 1; }
python3 -c "import PIL" 2>/dev/null || python3 -m pip install --user pillow

echo "Rendering $FRAMES frames at ${SIZE}px, $SAMPLES samples into $OUT"
"$BLENDER" -b --python-exit-code 1 -P tools/blender/render_layers.py -- \
  "$OUT" --frames "$FRAMES" --size "$SIZE" --samples "$SAMPLES" --gpu

python3 tools/blender/to_webp.py "$OUT" public/ring
echo "Done. Commit public/ring to publish the new renders."
