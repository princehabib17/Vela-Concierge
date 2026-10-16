"""Offline mirror of the browser compositor, to judge renders: composite_preview.py LAYERS_DIR OUT.png FRAME [metal] [stone]"""
import sys, os
import numpy as np
from PIL import Image

TINTS = {'yellow': (0.99, 0.84, 0.55), 'white': (0.93, 0.92, 0.90), 'rose': (0.97, 0.70, 0.60), 'platinum': (0.90, 0.91, 0.93)}
STONES = {'diamond': (1, 1, 1), 'ruby': (1.0, 0.18, 0.26), 'sapphire': (0.25, 0.42, 1.0), 'emerald': (0.20, 0.85, 0.50)}
BG = np.array([0.925, 0.925, 0.925])

def load(d, name, f):
    p = os.path.join(d, name, f'{f:02d}.png')
    if not os.path.exists(p):
        return None
    a = np.asarray(Image.open(p).convert('RGBA')).astype(np.float32) / 255.0
    return a

def over(dst, src, tint=None):
    if src is None: return dst
    rgb = src[..., :3] * (np.array(tint) if tint is not None else 1.0)
    a = src[..., 3:4]
    return dst * (1 - a) + rgb * a

def main():
    d, out, f = sys.argv[1], sys.argv[2], int(sys.argv[3])
    metal = sys.argv[4] if len(sys.argv) > 4 else 'yellow'
    stone = sys.argv[5] if len(sys.argv) > 5 else 'diamond'
    cut, setting, band = (sys.argv[6:9] + ['round', 'claw', 'pave'][len(sys.argv[6:9]):])[:3] if len(sys.argv) > 6 else ('round', 'claw', 'pave')
    shadow = load(d, 'shadow', f)
    h, w = (shadow if shadow is not None else load(d, f'stone_{cut}', f)).shape[:2]
    img = np.ones((h, w, 3), np.float32) * BG
    if shadow is not None:
        img = img * (1 - shadow[..., 3:4] * 0.55)
    st = load(d, f'stone_{cut}', f)
    if st is not None:
        t = np.array(STONES[stone])
        tint = np.minimum(1.0, 0.25 + 0.75 * t) if stone != 'diamond' else None
        img = over(img, st, tint if tint is not None else None)
    img = over(img, load(d, f'metal_{cut}_{setting}', f), TINTS[metal])
    if setting == 'halo':
        img = over(img, load(d, f'halo_{cut}', f))
    if band != 'plain':
        img = over(img, load(d, band, f))
    Image.fromarray((np.clip(img, 0, 1) * 255).astype(np.uint8)).save(out)

main()
