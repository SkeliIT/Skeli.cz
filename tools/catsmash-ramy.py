# Vyřízne rámečky hřiště CatSmash z obrázků z Gemini (rámeček na purpurovém pozadí #FF00FF).
# Purpurová se maže jen tam, kam se dá dojít od okraje obrázku nebo od středu (vyplňování), takže
# fialový neon na samotném rámečku zůstane. Změří vnitřní otvor rámečku – hra pak otvor položí přesně
# na sklo hřiště a rámeček leží na zlaté liště kolem něj.
# Výstup: src/main/webapp/kevin/pong/ramy/<pálka>.webp (oříznutý na rámeček) + ramy.json ({pálka: {size: [w, h],
# slice: [nahoře, vpravo, dole, vlevo]}} = tloušťka pásu až k otvoru; hra ho kreslí jako CSS border-image).
#
# Spuštění: python tools/catsmash-ramy.py <složka s obrázky> pálka=soubor [pálka=soubor …]
import json
import os
import sys
from collections import deque

import numpy as np
from PIL import Image

OUT = os.path.join(os.path.dirname(__file__), '..', 'src', 'main', 'webapp', 'kevin', 'pong', 'ramy')
WIDTH = 600          # šířka výsledného obrázku (sklo je na obrazovce kolem 300–500 px)


def flood(cand, seeds):
    """Všechny body kandidátní masky dosažitelné ze seeds (4-sousedství)."""
    h, w = cand.shape
    seen = np.zeros_like(cand)
    q = deque()
    for y, x in seeds:
        if cand[y, x] and not seen[y, x]:
            seen[y, x] = True
            q.append((y, x))
    while q:
        y, x = q.popleft()
        for ny, nx in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
            if 0 <= ny < h and 0 <= nx < w and cand[ny, nx] and not seen[ny, nx]:
                seen[ny, nx] = True
                q.append((ny, nx))
    return seen


def cut(path, keep_magenta=False):
    im = Image.open(path).convert('RGB')
    im = im.resize((WIDTH, round(im.height * WIDTH / im.width)), Image.LANCZOS)
    a = np.asarray(im).astype(np.float32)
    h, w, _ = a.shape
    d = np.sqrt((a[..., 0] - 255) ** 2 + a[..., 1] ** 2 + (a[..., 2] - 255) ** 2)
    cand = d < 110
    border = [(y, 0) for y in range(h)] + [(y, w - 1) for y in range(h)] + [(0, x) for x in range(w)] + [(h - 1, x) for x in range(w)]
    outside = flood(cand, border)
    inside = flood(cand, [(h // 2, w // 2)])
    bg = outside | inside
    # čistá purpurová uzavřená uvnitř rámečku (mezi lištami) taky pryč – kromě rámečků, které mají fialový neon
    if not keep_magenta:
        bg = bg | (d < 45)
    # měkký okraj: body těsně u pozadí dostanou průhlednost podle toho, jak moc jsou ještě fialové
    near = bg.copy()
    for _ in range(2):
        near = near | np.roll(near, 1, 0) | np.roll(near, -1, 0) | np.roll(near, 1, 1) | np.roll(near, -1, 1)
    alpha = np.ones((h, w), np.float32)
    soft = near & ~bg
    alpha[soft] = np.clip((d[soft] - 60) / 140, 0, 1)
    alpha[bg] = 0
    # odbarvení: z poloprůhledných okrajů odečíst fialovou, ať kolem rámečku nesvítí růžový lem
    m = np.array([255, 0, 255], np.float32)
    k = (alpha > 0) & (alpha < 1)
    rgb = a.copy()
    rgb[k] = np.clip((a[k] - (1 - alpha[k, None]) * m) / np.maximum(alpha[k, None], 0.05), 0, 255)
    ys, xs = np.nonzero(inside)
    hole = [int(xs.min()), int(ys.min()), int(xs.max() - xs.min() + 1), int(ys.max() - ys.min() + 1)]
    # oříznout na samotný rámeček; slice = jak daleko je od okrajů výřezu otvor (pro CSS border-image)
    oy, ox = np.nonzero(alpha > 0.05)
    x0, y0, x1, y1 = int(ox.min()), int(oy.min()), int(ox.max()) + 1, int(oy.max()) + 1
    out = np.dstack([rgb, alpha * 255]).astype(np.uint8)[y0:y1, x0:x1]
    slice_ = [hole[1] - y0, x1 - (hole[0] + hole[2]), y1 - (hole[1] + hole[3]), hole[0] - x0]
    return Image.fromarray(out, 'RGBA'), [x1 - x0, y1 - y0], slice_


def main():
    src = sys.argv[1]
    os.makedirs(OUT, exist_ok=True)
    meta_path = os.path.join(OUT, 'ramy.json')
    meta = json.load(open(meta_path, encoding='utf-8')) if os.path.exists(meta_path) else {}
    for arg in sys.argv[2:]:
        pad, name = arg.split('=', 1)
        img, size, sl = cut(os.path.join(src, name), keep_magenta=pad == 'neon')
        img.save(os.path.join(OUT, pad + '.webp'), 'WEBP', quality=86, method=6)
        meta[pad] = {'size': size, 'slice': sl}
        print(pad, size, sl, os.path.getsize(os.path.join(OUT, pad + '.webp')) // 1024, 'kB')
    with open(meta_path, 'w', encoding='utf-8') as f:
        json.dump(meta, f, ensure_ascii=False, indent=1, sort_keys=True)


if __name__ == '__main__':
    main()
