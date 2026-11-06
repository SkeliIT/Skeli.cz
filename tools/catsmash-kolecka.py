# Tematická kolečka k automatům CatSmash z obrázků z Gemini (na purpurovém pozadí #FF00FF, viz prompty ve Skeli.cz-podklady/navrhy/catsmash-kolecka).
# Z každého obrázku vyřízne velké, střední a malé kolo, táhlo a píst a uloží je do src/main/webapp/kevin/pong/kolecka/:
#   <automat>-1.webp (velké), -2.webp (střední), -3.webp (malé), -rod.webp (táhlo), -piston.webp (píst)
# Kola jsou vystředěná podle obrysu, ať se ve hře netočí do šišky. Hra si je načte jen pro vybraný automat (hra.js loadWheels).
#
# Spuštění: python tools/catsmash-kolecka.py <složka s obrázky> automat=soubor [automat=soubor …] [--prehled soubor.png]
import os
import sys

import numpy as np
from PIL import Image

OUT = os.path.join(os.path.dirname(__file__), '..', 'src', 'main', 'webapp', 'kevin', 'pong', 'kolecka')
GEAR_SIZE = 256
ROD_W = 360
PISTON_W = 240
MIN_AREA = 1200


def key(path):
    # průhlednost podle vzdálenosti od purpurové, na okraji odečte purpurovou z barvy, ať nezůstane lem
    a = np.asarray(Image.open(path).convert('RGB')).astype(np.float32)
    d = np.sqrt((a[..., 0] - 255) ** 2 + a[..., 1] ** 2 + (a[..., 2] - 255) ** 2)
    alpha = np.clip((d - 90) / 90, 0, 1)
    m = np.array([255, 0, 255], np.float32)
    k = (alpha > 0) & (alpha < 1)
    rgb = a.copy()
    rgb[k] = np.clip((a[k] - (1 - alpha[k, None]) * m) / np.maximum(alpha[k, None], 0.05), 0, 255)
    # zbytek purpurového nádechu na okrajích
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    tint = (r > g + 30) & (b > g + 30) & (alpha < 1)
    rgb[..., 0] = np.where(tint, g + 10, r)
    rgb[..., 2] = np.where(tint, g + 10, b)
    return np.dstack([rgb, alpha * 255]).astype(np.uint8)


def components(mask):
    # spojené oblasti (kolo, táhlo, píst); hledá se ve zmenšeném obrázku, stačí to na rámečky
    step = 2
    m = mask[::step, ::step]
    h, w = m.shape
    seen = np.zeros_like(m)
    out = []
    for y0 in range(h):
        for x0 in np.nonzero(m[y0] & ~seen[y0])[0]:
            if seen[y0, x0]:
                continue
            stack = [(y0, x0)]
            seen[y0, x0] = True
            area = 0
            xa, xb, ya, yb = x0, x0, y0, y0
            while stack:
                y, x = stack.pop()
                area += 1
                xa, xb, ya, yb = min(xa, x), max(xb, x), min(ya, y), max(yb, y)
                for ny, nx in ((y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)):
                    if 0 <= ny < h and 0 <= nx < w and m[ny, nx] and not seen[ny, nx]:
                        seen[ny, nx] = True
                        stack.append((ny, nx))
            if area * step * step >= MIN_AREA:
                out.append((int(xa) * step, int(ya) * step, (int(xb) - int(xa) + 1) * step, (int(yb) - int(ya) + 1) * step))
    return out


def split(path):
    rgba = key(path)
    boxes = components(rgba[..., 3] > 128)
    gears, long_ = [], []
    for b in boxes:
        (gears if max(b[2], b[3]) / min(b[2], b[3]) < 1.25 else long_).append(b)
    gears.sort(key=lambda b: -b[2])
    long_.sort(key=lambda b: -b[2])
    if len(gears) < 3 or len(long_) < 1:
        raise SystemExit('%s: čekal jsem 3 kola a táhlo, našel jsem %d kol a %d podlouhlých kusů' % (path, len(gears), len(long_)))
    # obrázky občas mají kol nebo táhel víc: největší tři kola, nejdelší = táhlo, nejkratší podlouhlý = píst
    rod = long_[0]
    piston = long_[-1] if len(long_) > 1 else None
    if piston is None and len(gears) > 3:
        piston = gears[3]
    return Image.fromarray(rgba, 'RGBA'), gears[:3], rod, piston


def crop(im, b, pad=2):
    return im.crop((max(0, b[0] - pad), max(0, b[1] - pad), b[0] + b[2] + pad, b[1] + b[3] + pad))


def gear_image(im, b):
    # čtverec kolem středu obrysu; stejná šířka i výška, ať je kolo kulaté
    c = crop(im, b, 0).resize((GEAR_SIZE - 4, GEAR_SIZE - 4), Image.LANCZOS)
    out = Image.new('RGBA', (GEAR_SIZE, GEAR_SIZE), (0, 0, 0, 0))
    out.paste(c, (2, 2))
    return out


def fit_width(c, w):
    return c.resize((w, max(1, round(c.height * w / c.width))), Image.LANCZOS)


def main():
    args = sys.argv[1:]
    prehled = None
    if '--prehled' in args:
        i = args.index('--prehled')
        prehled = args[i + 1]
        del args[i:i + 2]
    src = args[0]
    os.makedirs(OUT, exist_ok=True)
    rows = []
    for arg in args[1:]:
        pad, name = arg.split('=', 1)
        im, gears, rod, piston = split(os.path.join(src, name))
        parts = [gear_image(im, g) for g in gears] + [fit_width(crop(im, rod), ROD_W)]
        parts.append(fit_width(crop(im, piston), PISTON_W) if piston else None)
        for suffix, part in zip(('1', '2', '3', 'rod', 'piston'), parts):
            if part is not None:
                part.save(os.path.join(OUT, pad + '-' + suffix + '.webp'), 'WEBP', quality=86, method=6)
        print(pad, 'kola', [g[2] for g in gears], 'táhlo', rod[2:], 'píst', piston[2:] if piston else None)
        rows.append((pad, parts))
    if prehled:
        sheet = Image.new('RGB', (1000, 150 * len(rows)), (40, 30, 44))
        for y, (pad, parts) in enumerate(rows):
            x = 4
            for part in parts:
                if part is None:
                    continue
                t = part.copy()
                t.thumbnail((240 if part.width > part.height * 1.3 else 144, 144))
                sheet.paste(t, (x, y * 150 + 3), t)
                x += t.width + 8
        sheet.save(prehled)


if __name__ == '__main__':
    main()
