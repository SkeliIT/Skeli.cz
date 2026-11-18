"""Velké míčky CatSmash pro náhled položky (256 px místo 128 px – ve velkém náhledu by se malé rozmazaly).
Stříhá stejně jako tools/catsmash-sprites.py (stejné výřezy, stejné odstranění purpurové), jen do větší velikosti.
Hra je načte jen při otevření náhledu, takže se samotná hra nezpomalí.

Spuštění: python tools/catsmash-micky-velke.py <obrázek1.jpg> <obrázek2.jpg>   (stejné první dva jako u catsmash-sprites.py:
  Skeli.cz-podklady/kevin/reference/Kevin/Gemini_Generated_Image_xjnvs5….jpg, pak …uequgb….jpg)
Výstup: kevin/pong/micky-velke.webp + micky-velke.json
"""
import importlib.util
import json
import os
import sys

import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location('sprites', os.path.join(HERE, 'catsmash-sprites.py'))
sp = importlib.util.module_from_spec(spec)
spec.loader.exec_module(sp)

S = 256


def main():
    srcs = [np.array(Image.open(p).convert('RGB')) for p in sys.argv[1:3]]
    balls, meta = sp.Atlas(S * 7 + 12), {}
    yy, xx = np.mgrid[0:S, 0:S]
    circle = np.clip(S / 2 - 1 - np.sqrt((xx - S / 2 + 0.5) ** 2 + (yy - S / 2 + 0.5) ** 2) + 0.5, 0, 1)
    for img_i, r, c, name in sp.BALLS:
        (y0, y1), (x0, x1) = sp.BALL_ROWS[r], sp.BALL_COLS[c]
        rgba, _ = sp.trim(sp.key(srcs[img_i][y0:y1, x0:x1], name not in sp.KEEP_PINK), 0)
        h, w = rgba.shape[:2]
        side = int(min(h, w) * 0.97)
        cy, cx = h // 2, w // 2
        sq = rgba[cy - side // 2: cy - side // 2 + side, cx - side // 2: cx - side // 2 + side]
        im = np.array(Image.fromarray(sq, 'RGBA').resize((S, S), Image.LANCZOS)).astype(np.float32)
        im[..., 3] = 255 * circle
        meta[name] = balls.add(im.astype(np.uint8))
    h = balls.save(os.path.join(sp.OUT, 'micky-velke.webp'))
    with open(os.path.join(sp.OUT, 'micky-velke.json'), 'w', encoding='utf-8') as f:
        json.dump(meta, f, ensure_ascii=False, separators=(',', ':'))
    print('velké míčky', len(meta), 'list', S * 7 + 12, 'x', h)


if __name__ == '__main__':
    main()
