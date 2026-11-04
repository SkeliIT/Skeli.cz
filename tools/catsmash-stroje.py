# Automat CatSmash podle pálky z obrázku z Gemini (předělaná předloha automatu na purpurovém pozadí #FF00FF).
# Purpurová se maže venku a ve sklech (vyplňování od okraje a od středu skla a obou okének) a čistá purpurová
# i jinde. Obrázek se pak posune a natáhne tak, aby velké sklo sedělo přesně na sklo hřiště (GLASS), a uloží se
# ve velikosti dnešního automatu 768×1376. Hra ho kreslí NAD hřištěm a okénky s koly (otvory jsou průhledné),
# takže jeho okraje vždycky přikryjí, co je pod ním.
# Okénko se vyřízne podle obrázku: co přes něj vede (řetěz, lístky, tlapka), zůstane nad koly. Natvrdo se řízne jen tam,
# kde Gemini okénko nenakreslilo (černé sklo, deska).
# Výstup: src/main/webapp/kevin/pong/stroje/<pálka>.webp + stroje.json ({pálka: {top: bool, win: [horní, dolní]}});
# okénka z win patří do MECH_WIN v js/catsmash/data.js (plátno s koly je o kousek větší než otvor, okraj je přikryje).
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


def seeds_in(r):
    # několik bodů přes okénko: řetěz nebo ozdoba může otvor rozdělit na víc částí
    return [(int(r[1] + r[3] * fy), int(r[0] + r[2] * fx)) for fy in (0.3, 0.5, 0.7) for fx in (0.08, 0.2, 0.35, 0.5, 0.65, 0.8, 0.92)]


# automaty, které mají růžovou ve výzdobě: okraje se nečistí
KEEP_PINK = {'neon', 'graffiti'}
WIN_MARGIN = 5
# automaty, které okénko nakreslily jako černé sklo nebo panel: otvor přesně podle jejich rámu (x, y, šířka, výška v originále;
# klíč 0 = horní okénko, 1 = dolní)
FRAME_HOLES = {'ekvalizer': {0: (122, 196, 525, 75), 1: (120, 1090, 527, 129)}, 'kola': {1: (122, 1090, 530, 138)}}


def clean_fringe(out):
    # fialový lem po vyříznutí z fialového pozadí: pixely u průhledných míst přebarví na tmavý kov
    a = np.asarray(out).astype(np.int16)
    r, g, b, al = a[..., 0], a[..., 1], a[..., 2], a[..., 3]
    near = al < 20
    for _ in range(4):
        near = near | np.roll(near, 1, 0) | np.roll(near, -1, 0) | np.roll(near, 1, 1) | np.roll(near, -1, 1)
    fr = near & (r > g + 14) & (b > g + 14)
    a = a.copy()
    val = np.minimum(np.minimum(r, b), g + 8)
    a[..., 0] = np.where(fr, val, r)
    a[..., 2] = np.where(fr, np.minimum(b, g), b)
    return Image.fromarray(a.astype(np.uint8), 'RGBA')


def bbox(mask):
    ys, xs = np.nonzero(mask)
    if not len(xs):
        return None
    return (int(xs.min()), int(ys.min()), int(xs.max() - xs.min() + 1), int(ys.max() - ys.min() + 1))


def cut(path, pad=''):
    im = Image.open(path).convert('RGB').resize((FW, FH), Image.LANCZOS)
    a = np.asarray(im).astype(np.float32)
    h, w, _ = a.shape
    d = np.sqrt((a[..., 0] - 255) ** 2 + a[..., 1] ** 2 + (a[..., 2] - 255) ** 2)
    cand = d < 110
    border = [(y, 0) for y in range(h)] + [(y, w - 1) for y in range(h)] + [(0, x) for x in range(w)] + [(h - 1, x) for x in range(w)]
    glass = flood(cand, [center(GLASS)])
    top = flood(cand, seeds_in(WIN_TOP))
    bot = flood(cand, seeds_in(WIN_BOT))
    # automaty bez růžové výzdoby: pryč i každá purpurová, která zbyla třeba v okách řetězu
    bg = flood(cand, border) | glass | top | bot | (d < (45 if pad in KEEP_PINK else 110))
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
    # okénko, které v obrázku není (černé sklo, deska), se vyřízne natvrdo; nakreslené zůstává i s tím, co vede přes něj
    own = [m.sum() > 0.5 * r[2] * r[3] for m, r in ((top, WIN_TOP), (bot, WIN_BOT))]
    def moved(r):
        return None if r is None else (round(gx + (r[0] - g[0]) * sx), round(gy + (r[1] - g[1]) * sy), round(r[2] * sx), round(r[3] * sy))
    forced = {}
    for n, (r, mine) in enumerate(zip((WIN_TOP, WIN_BOT), own)):
        if not mine:
            art = FRAME_HOLES.get(pad, {}).get(n)
            x, y, w, h = moved(art) if art else (r[0] + 3, r[1] + 3, r[2] - 6, r[3] - 6)
            forced[n] = (x, y, w, h)
            ImageDraw.Draw(hole).rounded_rectangle((x, y, x + w, y + h), radius=8, fill=0)
    a = out.getchannel('A')
    out.putalpha(Image.fromarray(np.minimum(np.asarray(a), np.asarray(hole))))
    if pad not in KEEP_PINK:
        out = clean_fringe(out)
    tb, bb = bbox(top), bbox(bot)
    has_top = tb is not None and tb[3] > 30
    win = []
    for n, box in enumerate((moved(tb), moved(bb))):
        x, y, w, h = forced[n] if n in forced else box
        win.append([x - WIN_MARGIN, y - WIN_MARGIN, w + 2 * WIN_MARGIN, h + 2 * WIN_MARGIN])
    return out, has_top, win, own, (round(sx, 3), round(sy, 3))


def klasik():
    # klasický automat: rám kevin/pong/ram.webp s otvory, ať kolečka leží pod ním jako u ostatních
    im = Image.open(os.path.join(OUT, '..', 'ram.webp')).convert('RGBA')
    hole = Image.new('L', (FW, FH), 255)
    d = ImageDraw.Draw(hole)
    d.rounded_rectangle((GLASS[0] + 5, GLASS[1] + 5, GLASS[0] + GLASS[2] - 5, GLASS[1] + GLASS[3] - 5), radius=12, fill=0)
    win = []
    for x, y, w, h in (WIN_TOP, WIN_BOT):
        d.rounded_rectangle((x + 2, y + 2, x + w - 2, y + h - 2), radius=9, fill=0)
        win.append([x - WIN_MARGIN, y - WIN_MARGIN, w + 2 * WIN_MARGIN, h + 2 * WIN_MARGIN])
    im.putalpha(Image.fromarray(np.minimum(np.asarray(im.getchannel('A')), np.asarray(hole))))
    return im, True, win, [True, True], (1, 1)


def main():
    src = sys.argv[1]
    os.makedirs(OUT, exist_ok=True)
    meta_path = os.path.join(OUT, 'stroje.json')
    meta = json.load(open(meta_path, encoding='utf-8')) if os.path.exists(meta_path) else {}
    for arg in sys.argv[2:]:
        pad, name = arg.split('=', 1)
        img, has_top, win, own, sc = klasik() if pad == 'klasik' else cut(os.path.join(src, name), pad)
        img.save(os.path.join(OUT, pad + '.webp'), 'WEBP', quality=86, method=6)
        meta[pad] = {'top': has_top, 'win': win}
        print(pad, 'měřítko', sc, 'okénka', win, 'z obrázku', own, os.path.getsize(os.path.join(OUT, pad + '.webp')) // 1024, 'kB')
    with open(meta_path, 'w', encoding='utf-8') as f:
        json.dump(meta, f, ensure_ascii=False, indent=1, sort_keys=True)


if __name__ == '__main__':
    main()
