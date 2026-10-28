# Automat CatSmash podle pálky z obrázku z Gemini (předělaná předloha automatu na purpurovém pozadí #FF00FF).
# Purpurová se maže venku a ve sklech (vyplňování od okraje a od středu skla a obou okének) a čistá purpurová
# i jinde. Obrázek se pak posune a natáhne tak, aby velké sklo sedělo přesně na sklo hřiště (GLASS), a uloží se
# ve velikosti dnešního automatu 768×1376. Hra ho kreslí NAD hřištěm a okénky s koly (otvory jsou průhledné),
# takže jeho okraje vždycky přikryjí, co je pod ním.
# Výstup: src/main/webapp/kevin/pong/stroje/<pálka>.webp + stroje.json ({pálka: {top: bool}} – má horní okénko?)
#
# Spuštění: python tools/catsmash-stroje.py <složka s obrázky> pálka=soubor [pálka=soubor …]
import json
import os
import sys
from collections import deque

import numpy as np
from PIL import Image, ImageDraw

OUT = os.path.join(os.path.dirname(__file__), '..', 'src', 'main', 'webapp', 'kevin', 'pong', 'stroje')
FW, FH = 768, 1376
GLASS = (138, 316, 492, 741)
WIN_TOP = (128, 191, 513, 79)
WIN_BOT = (123, 1073, 523, 136)


def flood(cand, seeds):
    h, w = cand.shape
    seen = np.zeros_like(cand)
    q = deque()
    for y, x in seeds:
        if 0 <= y < h and 0 <= x < w and cand[y, x] and not seen[y, x]:
            seen[y, x] = True
            q.append((y, x))
    while q:
        y, x = q.popleft()
        for ny, nx in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
            if 0 <= ny < h and 0 <= nx < w and cand[ny, nx] and not seen[ny, nx]:
                seen[ny, nx] = True
                q.append((ny, nx))
    return seen


def center(r):
    return (int(r[1] + r[3] / 2), int(r[0] + r[2] / 2))


def bbox(mask):
    ys, xs = np.nonzero(mask)
    if not len(xs):
        return None
    return (int(xs.min()), int(ys.min()), int(xs.max() - xs.min() + 1), int(ys.max() - ys.min() + 1))


def cut(path):
    im = Image.open(path).convert('RGB').resize((FW, FH), Image.LANCZOS)
    a = np.asarray(im).astype(np.float32)
    h, w, _ = a.shape
    d = np.sqrt((a[..., 0] - 255) ** 2 + a[..., 1] ** 2 + (a[..., 2] - 255) ** 2)
    cand = d < 110
    border = [(y, 0) for y in range(h)] + [(y, w - 1) for y in range(h)] + [(0, x) for x in range(w)] + [(h - 1, x) for x in range(w)]
    glass = flood(cand, [center(GLASS)])
    top = flood(cand, [center(WIN_TOP)])
    bot = flood(cand, [center(WIN_BOT)])
    bg = flood(cand, border) | glass | top | bot | (d < 45)
    near = bg.copy()
    for _ in range(2):
        near = near | np.roll(near, 1, 0) | np.roll(near, -1, 0) | np.roll(near, 1, 1) | np.roll(near, -1, 1)
    alpha = np.ones((h, w), np.float32)
    soft = near & ~bg
    alpha[soft] = np.clip((d[soft] - 60) / 140, 0, 1)
    alpha[bg] = 0
    m = np.array([255, 0, 255], np.float32)
    k = (alpha > 0) & (alpha < 1)
    rgb = a.copy()
    rgb[k] = np.clip((a[k] - (1 - alpha[k, None]) * m) / np.maximum(alpha[k, None], 0.05), 0, 255)
    rgba = Image.fromarray(np.dstack([rgb, alpha * 255]).astype(np.uint8), 'RGBA')
    # velké sklo na sklo hřiště: o 3 body menší otvor, ať rám přesahuje přes okraj hřiště
    g = bbox(glass)
    gx, gy, gw, gh = GLASS[0] + 3, GLASS[1] + 3, GLASS[2] - 6, GLASS[3] - 6
    sx, sy = gw / g[2], gh / g[3]
    big = rgba.resize((round(FW * sx), round(FH * sy)), Image.LANCZOS)
    out = Image.new('RGBA', (FW, FH), (0, 0, 0, 0))
    out.paste(big, (round(gx - g[0] * sx), round(gy - g[1] * sy)), big)
    # vnitřek skla vždycky průhledný (ozdoby nakreslené dovnitř skla, třeba sloupce ekvalizéru, by zakrývaly hřiště)
    hole = Image.new('L', (FW, FH), 255)
    ImageDraw.Draw(hole).rounded_rectangle((GLASS[0] + 5, GLASS[1] + 5, GLASS[0] + GLASS[2] - 5, GLASS[1] + GLASS[3] - 5), radius=12, fill=0)
    # okénka s koly taky (Gemini je někdy nakreslí jako černé sklo nebo je zakryje deskou)
    for x, y, w, h in (WIN_TOP, WIN_BOT):
        ImageDraw.Draw(hole).rounded_rectangle((x + 3, y + 3, x + w - 3, y + h - 3), radius=8, fill=0)
    a = out.getchannel('A')
    out.putalpha(Image.fromarray(np.minimum(np.asarray(a), np.asarray(hole))))
    def moved(r):
        return None if r is None else (round(gx + (r[0] - g[0]) * sx), round(gy + (r[1] - g[1]) * sy), round(r[2] * sx), round(r[3] * sy))
    tb, bb = bbox(top), bbox(bot)
    has_top = tb is not None and tb[3] > 30
    return out, has_top, moved(tb), moved(bb), (round(sx, 3), round(sy, 3))


def main():
    src = sys.argv[1]
    os.makedirs(OUT, exist_ok=True)
    meta_path = os.path.join(OUT, 'stroje.json')
    meta = json.load(open(meta_path, encoding='utf-8')) if os.path.exists(meta_path) else {}
    for arg in sys.argv[2:]:
        pad, name = arg.split('=', 1)
        img, has_top, tb, bb, sc = cut(os.path.join(src, name))
        img.save(os.path.join(OUT, pad + '.webp'), 'WEBP', quality=86, method=6)
        meta[pad] = {'top': has_top}
        print(pad, 'měřítko', sc, 'horní okénko', tb, '(má být', WIN_TOP, ') dolní', bb, '(má být', WIN_BOT, ')',
              os.path.getsize(os.path.join(OUT, pad + '.webp')) // 1024, 'kB')
    with open(meta_path, 'w', encoding='utf-8') as f:
        json.dump(meta, f, ensure_ascii=False, indent=1, sort_keys=True)


if __name__ == '__main__':
    main()
