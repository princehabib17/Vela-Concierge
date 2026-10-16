"""Converts rendered PNG layers to WebP for the app: to_webp.py RENDER_DIR [OUT_DIR=public/ring]"""
import os
import sys
from PIL import Image

src = sys.argv[1]
dst = sys.argv[2] if len(sys.argv) > 2 else os.path.join(os.path.dirname(__file__), '..', '..', 'public', 'ring')
total = 0
for layer in sorted(os.listdir(src)):
    for name in sorted(os.listdir(os.path.join(src, layer))):
        if not name.endswith('.png'):
            continue
        out = os.path.join(dst, layer, name[:-4] + '.webp')
        if os.path.exists(out) and os.path.getmtime(out) >= os.path.getmtime(os.path.join(src, layer, name)):
            continue
        os.makedirs(os.path.dirname(out), exist_ok=True)
        im = Image.open(os.path.join(src, layer, name)).convert('RGBA')
        im.save(out, 'WEBP', quality=86, method=5, alpha_quality=90)
        total += os.path.getsize(out)
print('wrote', round(total / 1e6, 1), 'MB')
