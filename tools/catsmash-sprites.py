# Vyřízne pálky a míčky pro CatSmash z obrázků z Gemini (purpurové pozadí #FF00FF, mřížka 2×4 pálek + 2×4 míčků).
# Pálku rozdělí na tělo (horní hrana = plocha, od které se míček odráží) a na to, co pod ní visí (přívěsky),
# aby se přívěsky ve hře mohly houpat. Výstup: kevin/pong/palky.webp + palky.json a micky.webp + micky.json.
#
# Spuštění: python tools/catsmash-sprites.py <obrázek1.jpg> <obrázek2.jpg> <kevinova-pálka.jpg> [--nahled složka]
import json
import os
import sys
from collections import deque

import numpy as np
from PIL import Image

OUT = os.path.join(os.path.dirname(__file__), '..', 'src', 'main', 'webapp', 'kevin', 'pong')

# řádky a sloupce mřížky v obrázku 1024×1024
PAD_ROWS = [(0, 215), (215, 385), (385, 560), (560, 708)]
PAD_COLS = [(0, 512), (512, 1024)]
BALL_ROWS = [(708, 852), (852, 1024)]
BALL_COLS = [(0, 270), (270, 512), (512, 755), (755, 1024)]

# (obrázek, řádek, sloupec, id, pohyb přívěsků): swing = každý přívěsek je samostatné kyvadlo,
# sway = celý spodek se jemně vlní (lístky, tlapky, kapky), rigid = nehýbe se (rampouchy, neon, ekvalizér, kola)
PADDLES = [
    (0, 0, 0, 'vetev', 'sway'), (0, 0, 1, 'led', 'rigid'),
    (0, 1, 0, 'lava', 'sway'), (0, 1, 1, 'retez', 'swing'),
    (0, 2, 0, 'graffiti', 'sway'), (0, 2, 1, 'plys', 'sway'),
    (0, 3, 0, 'neon', 'rigid'), (0, 3, 1, 'ekvalizer', 'rigid'),
    (1, 0, 0, 'jadeit', 'swing'), (1, 0, 1, 'perly', 'sway'),
    (1, 2, 0, 'mince', 'swing'), (1, 2, 1, 'cip', 'swing'),
    (1, 3, 1, 'kola', 'rigid'),
]
# ozubená kola ve Strojovně, která se ve hře točí: střed x, y a poloměr (souřadnice celé pálky), směr točení.
# Kreslí se v pořadí odzadu dopředu; hra vyřízne kruh z celého obrázku pálky (full) a otočí ho.
GEARS = {'kola': [[230, 36, 27, -1], [232, 70, 11, 1], [275, 109, 20, -1], [218, 108, 10, 1], [360, 62, 16, -1], [178, 75, 33, 1]]}
# další obrázky s jedinou pálkou: (index obrázku, výřez x0, y0, x1, y1, id, pohyb); Kevinova pálka (3. obrázek)
SINGLE = [(2, (20, 70, 1250, 530), 'kevin', 'swing')]
BALLS = [
    (0, 0, 0, 'kastan'), (0, 0, 1, 'ledovka'), (0, 0, 2, 'lavak'), (0, 0, 3, 'tlapka'),
    (0, 1, 0, 'sprej'), (0, 1, 1, 'plysak'), (0, 1, 2, 'vir'), (0, 1, 3, 'repro'),
    (1, 0, 0, 'jadeitak'), (1, 0, 1, 'mramor'), (1, 1, 0, 'perla'), (1, 1, 2, 'procesor'), (1, 1, 3, 'hodinky'),
]

BG = np.array([255, 0, 255], dtype=np.float32)
# předměty, které mají vlastní růžovou/fialovou (u nich se purpurový nádech potlačí jen na okraji)
KEEP_PINK = {'neon', 'graffiti', 'sprej', 'vir', 'mince'}


def key(cell, everywhere=True):
    """Průhlednost podle vzdálenosti barvy od purpurové (i v uzavřených mezerách – smyčka řetězu, ozubená kola),
    pak odstranění purpurového nádechu z okrajů. Nakonec zůstane jen předmět a to, co na něm visí (ne cizí křížky)."""
    rgb = cell.astype(np.float32)
    d = np.sqrt(((rgb - BG) ** 2).sum(axis=2))
    a = np.clip((d - 55) / 45, 0, 1)
    am = np.maximum(a, 0.05)[..., None]
    rgb = np.clip((rgb - (1 - am) * BG) / am, 0, 255)          # barva bez příměsi pozadí
    # pás 3 px u průhledných míst: potlačit zbytky purpurové (R i B nad G)
    edge = a < 0.5
    for _ in range(3):
        e = edge.copy()
        e[1:] |= edge[:-1]; e[:-1] |= edge[1:]; e[:, 1:] |= edge[:, :-1]; e[:, :-1] |= edge[:, 1:]
        edge = e
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    spill = np.clip(np.minimum(r, b) - g, 0, None) * (True if everywhere else edge)
    rgb[..., 0] -= spill * 0.85; rgb[..., 2] -= spill * 0.85
    a = a * np.where(edge & (spill > 60), 0.6, 1.0)
    out = np.dstack([np.clip(rgb, 0, 255), a * 255]).astype(np.uint8)
    # jen hlavní předmět + světlé kusy pod ním (černé tahy křížků z vedlejší buňky pryč)
    comps = components(out[..., 3] > 128)
    if not comps:
        return out
    main = max(comps, key=lambda c: c[5])
    keep = np.zeros(a.shape, dtype=bool)
    for c in comps:
        y0, y1, x0, x1, m, size = c
        bright = rgb[m].mean() if size else 0
        near = x1 > main[2] - 4 and x0 < main[3] + 4 and y0 < main[1] + 60 and y1 > main[0] - 4
        if c is main or (near and bright > 45 and size > 25):
            keep |= m
    grow = keep.copy()
    for _ in range(3):                                          # i měkký okraj kolem ponechaných kusů
        g2 = grow.copy()
        g2[1:] |= grow[:-1]; g2[:-1] |= grow[1:]; g2[:, 1:] |= grow[:, :-1]; g2[:, :-1] |= grow[:, 1:]
        grow = g2
    out[..., 3] = np.where(grow, out[..., 3], 0)
    return out


def trim(rgba, pad=1):
    ys, xs = np.nonzero(rgba[..., 3] > 8)
    y0, y1, x0, x1 = max(ys.min() - pad, 0), ys.max() + pad + 1, max(xs.min() - pad, 0), xs.max() + pad + 1
    return rgba[y0:y1, x0:x1], (x0, y0)


def components(mask):
    """Souvislé oblasti masky (8 sousedů), vrací seznam (y0, y1, x0, x1, pole bool)."""
    h, w = mask.shape
    lab = np.zeros((h, w), dtype=np.int32)
    out = []
    n = 0
    for sy, sx in zip(*np.nonzero(mask)):
        if lab[sy, sx]:
            continue
        n += 1
        lab[sy, sx] = n
        q = deque([(sy, sx)])
        pts = []
        while q:
            y, x = q.popleft(); pts.append((y, x))
            for dy in (-1, 0, 1):
                for dx in (-1, 0, 1):
                    ny, nx = y + dy, x + dx
                    if 0 <= ny < h and 0 <= nx < w and mask[ny, nx] and not lab[ny, nx]:
                        lab[ny, nx] = n; q.append((ny, nx))
        ys = [p[0] for p in pts]; xs = [p[1] for p in pts]
        out.append((min(ys), max(ys) + 1, min(xs), max(xs) + 1, lab == n, len(pts)))
    return out


def split_paddle(rgba):
    """Tělo = souvislý pás nejširších řádků shora; vše pod ním jsou přívěsky."""
    op = rgba[..., 3] > 128
    width = op.sum(axis=1)
    full = width >= width.max() * 0.86
    rows = np.nonzero(full)[0]
    top, bottom = rows.min(), rows.min()
    while bottom + 1 < len(full) and full[bottom + 1]:
        bottom += 1
    # zaoblený spodek koncovek patří k tělu: pokračuj, dokud řádek drží aspoň půlku šířky
    while bottom + 1 < len(width) and width[bottom + 1] >= width.max() * 0.5 and bottom - top < 120:
        bottom += 1
    return top, bottom + 1


class Atlas:
    """Jednoduché skládání obrázků do řádků jednoho listu."""

    def __init__(self, width):
        self.w, self.x, self.y, self.row_h, self.items = width, 0, 0, 0, []

    def add(self, img):
        h, w = img.shape[:2]
        if self.x + w > self.w:
            self.x, self.y, self.row_h = 0, self.y + self.row_h + 2, 0
        pos = (self.x, self.y)
        self.items.append((img, pos))
        self.x += w + 2
        self.row_h = max(self.row_h, h)
        return [int(pos[0]), int(pos[1]), int(w), int(h)]

    def save(self, path):
        h = self.y + self.row_h
        sheet = np.zeros((h, self.w, 4), dtype=np.uint8)
        for img, (x, y) in self.items:
            ih, iw = img.shape[:2]
            sheet[y:y + ih, x:x + iw] = img
        Image.fromarray(sheet, 'RGBA').save(path, 'WEBP', quality=88, method=6)
        return h


def main():
    srcs = [np.array(Image.open(p).convert('RGB')) for p in sys.argv[1:4] if not p.startswith('--')]
    preview = sys.argv[sys.argv.index('--nahled') + 1] if '--nahled' in sys.argv else None
    if preview:
        os.makedirs(preview, exist_ok=True)

    atlas, meta = Atlas(1024), {}
    jobs = [(img_i, PAD_ROWS[r], PAD_COLS[c], name, mode) for img_i, r, c, name, mode in PADDLES]
    jobs += [(img_i, (b[1], b[3]), (b[0], b[2]), name, mode) for img_i, b, name, mode in SINGLE if img_i < len(srcs)]
    for img_i, (y0, y1), (x0, x1), name, mode in jobs:
        cell = srcs[img_i][y0:y1, x0:x1]
        if cell.shape[1] > 560:                         # velký samostatný obrázek → stejná velikost jako ostatní pálky
            k = 500 / cell.shape[1]
            cell = np.array(Image.fromarray(cell).resize((500, int(cell.shape[0] * k)), Image.LANCZOS))
        rgba, _ = trim(key(cell, name not in KEEP_PINK))
        top, split = split_paddle(rgba)
        rgba = rgba[top:]
        split -= top
        body = rgba[:split]
        below = rgba[split:].copy()
        entry = {'body': atlas.add(body), 'mode': mode, 'parts': []}
        if mode != 'rigid' and below.shape[0] > 2 and (below[..., 3] > 40).any():
            # prvních pár řádků pod tělem je lem, který by slil všechny přívěsky dohromady → patří k tělu (nehýbe se)
            LIP = 5
            lip, (lx, ly) = trim(below[:LIP], 0) if (below[:LIP, :, 3] > 8).any() else (None, (0, 0))
            if lip is not None:
                entry['parts'].append({'img': atlas.add(lip), 'x': int(lx), 'y': int(ly), 'px': 0.0, 'py': 0.0, 'fixed': True})
            below = below.copy()
            below[:LIP, :, 3] = 0
            groups = []
            for (cy0, cy1, cx0, cx1, m, size) in sorted(components(below[..., 3] > 40), key=lambda c: c[2]):
                if size < 30:
                    continue
                g = groups[-1] if groups else None
                if g and cx0 <= g['x1'] + 4:
                    g['x1'] = max(g['x1'], cx1); g['y0'] = min(g['y0'], cy0); g['y1'] = max(g['y1'], cy1); g['m'] |= m
                else:
                    groups.append({'x0': cx0, 'x1': cx1, 'y0': cy0, 'y1': cy1, 'm': m.copy()})
            if name == 'perly':
                # perly = tuhé korálky (každý zvlášť), šňůrku dokreslí hra přes jejich středy; hloubka smyčky pro kyvadlo
                pts = []
                for g in groups:
                    for (py0, py1, px0, px1, pm, psz) in components(g['m']):
                        if psz > 15 and py1 - py0 > 3:
                            ys, xs = np.nonzero(pm)
                            pts.append([float(xs.mean()), float(ys.mean())])
                pts.sort()
                w = rgba.shape[1]
                entry['cord'] = [[w * 0.15, 0.0]] + pts + [[w * 0.85, 0.0]]
                entry['loopDepth'] = max(p[1] for p in pts)
            if name == 'retez':
                # kovový řetízek visí pevně, houpe se jen tlapka: rozdělit v nejužším místě pod řetízkem
                g = max(groups, key=lambda g: g['m'].sum())
                widths = g['m'].sum(axis=1)
                peak = int(np.argmax(widths))
                cut = next(r for r in range(peak, len(widths)) if 0 < widths[r] < 25)
                chain = {k: v for k, v in g.items()}
                chain['m'] = g['m'].copy(); chain['m'][cut:] = False; chain['fixed'] = True
                paw = {k: v for k, v in g.items()}
                paw['m'] = g['m'].copy(); paw['m'][:cut] = False
                for part in (chain, paw):
                    ys = np.nonzero(part['m'].any(axis=1))[0]
                    part['y0'], part['y1'] = int(ys.min()), int(ys.max()) + 1
                    xs = np.nonzero(part['m'].any(axis=0))[0]
                    part['x1'] = int(xs.max()) + 1
                groups = [x for x in groups if x is not g] + [chain, paw]
            if name == 'mince':
                # klíček bez provázku: provázek je fialovorůžový (modrá nad zelenou), klíček mosazný; nechat největší mosazný kus
                g = max(groups, key=lambda g: g['m'].sum())
                m = g['m']
                col = below[..., :3].astype(int)
                brass = m & (col[..., 2] < col[..., 1] + 12)
                comps = components(brass)
                km = max(comps, key=lambda c: c[5])[4]
                grow = km.copy()
                for _ in range(2):
                    e = grow.copy(); e[1:] |= grow[:-1]; e[:-1] |= grow[1:]; e[:, 1:] |= grow[:, :-1]; e[:, :-1] |= grow[:, 1:]; grow = e
                km = m & grow & ~(m & (col[..., 2] > col[..., 1] + 25))
                ys, xs = np.nonzero(km)
                # osa klíčku (hlavní směr bodů); očko = konec blíž k pálce (menší y)
                c = np.array([xs.mean(), ys.mean()])
                v = np.linalg.svd(np.stack([xs - c[0], ys - c[1]], 1), full_matrices=False)[2][0]
                proj = (xs - c[0]) * v[0] + (ys - c[1]) * v[1]
                e1, e2 = c + v * proj.min(), c + v * proj.max()
                ring, tip = (e1, e2) if e1[1] < e2[1] else (e2, e1)
                g2 = {'m': km, 'x0': int(xs.min()), 'x1': int(xs.max()) + 1, 'y0': int(ys.min()), 'y1': int(ys.max()) + 1,
                      'key': {'ring': ring, 'tip': tip}}
                groups = [x for x in groups if x is not g] + [g2]
            for g in groups:
                g['x0'] = int(np.nonzero(g['m'].any(axis=0))[0].min())
                part = below[g['y0']:g['y1'], g['x0']:g['x1']].copy()
                part[..., 3] = np.where(g['m'][g['y0']:g['y1'], g['x0']:g['x1']], part[..., 3], 0)
                if 'key' in g:
                    # klíček přebarvit podle jasu na mosaz (po vyříznutí z purpurového pozadí byl narůžovělý)
                    lum = part[..., :3].astype(np.float32) @ np.array([0.3, 0.55, 0.15], dtype=np.float32) / 255
                    lum = np.clip((lum - 0.1) / 0.75, 0, 1)[..., None]
                    dark, mid, hi = np.array([58, 36, 4]), np.array([201, 150, 40]), np.array([255, 236, 170])
                    gold = np.where(lum < 0.6, dark + (mid - dark) * (lum / 0.6), mid + (hi - mid) * ((lum - 0.6) / 0.4))
                    part[..., :3] = np.clip(gold, 0, 255).astype(np.uint8)
                top_xs = np.nonzero(g['m'][g['y0']])[0]
                pe = {'img': atlas.add(part), 'x': int(g['x0']), 'y': int(g['y0']), 'px': float(top_xs.mean()), 'py': float(g['y0'])}
                if g['y1'] - g['y0'] <= 8 and g['y0'] <= LIP + 1 or g.get('fixed'):
                    pe['fixed'] = True
                if name in ('lava', 'graffiti') and not pe.get('fixed'):
                    # špička kapky (odtud hra nechá odkapávat) a její barva
                    pm = g['m'][g['y0']:g['y1'], g['x0']:g['x1']] & (part[..., 3] > 150)
                    rows = np.nonzero(pm.any(axis=1))[0]
                    if len(rows):
                        yb = int(rows.max())
                        xs = np.nonzero(pm[max(0, yb - 2):yb + 1].any(axis=0))[0]
                        sel = pm.copy(); sel[:max(0, yb - 8)] = False
                        col = part[..., :3][sel].mean(axis=0)
                        pe['tip'] = [float(g['x0'] + xs.mean()), float(g['y0'] + yb), int(col[0]), int(col[1]), int(col[2])]
                if 'key' in g:
                    # zavěšený na provázku: očko (v souřadnicích výřezu), natočení, aby visel svisle, délka provázku
                    ring, tip = g['key']['ring'], g['key']['tip']
                    pe['mode'] = 'string'
                    pe['ring'] = [float(ring[0] - g['x0']), float(ring[1] - g['y0'])]
                    pe['rot'] = float(np.arctan2(tip[0] - ring[0], tip[1] - ring[1]))
                    pe['scale'] = 0.72
                    pe['cord'] = 20.0
                    pe['px'] = float(ring[0])                         # drobný zbytek spodku těla (chlupy, hrany mincí) – nehýbe se
                entry['parts'].append(pe)
        elif below.shape[0] > 2 and (below[..., 3] > 40).any():
            part, (ox, oy) = trim(below, 0)                    # pevná ozdoba: jeden kus, nehýbe se
            entry['parts'].append({'img': atlas.add(part), 'x': int(ox), 'y': int(oy), 'px': 0.0, 'py': 0.0})
        if name in GEARS:
            entry['full'] = atlas.add(rgba)
            entry['gears'] = GEARS[name]
        entry['w'], entry['h'], entry['split'] = int(rgba.shape[1]), int(rgba.shape[0]), int(split)
        meta[name] = entry
        if preview:
            Image.fromarray(rgba, 'RGBA').save(os.path.join(preview, 'palka-' + name + '.png'))
            Image.fromarray(body, 'RGBA').save(os.path.join(preview, 'telo-' + name + '.png'))
    h = atlas.save(os.path.join(OUT, 'palky.webp'))
    with open(os.path.join(OUT, 'palky.json'), 'w', encoding='utf-8') as f:
        json.dump(meta, f, ensure_ascii=False, separators=(',', ':'))
    print('pálky', len(meta), 'list', 1024, 'x', h)

    S = 128
    balls = Atlas(S * 7 + 12)
    bmeta = {}
    yy, xx = np.mgrid[0:S, 0:S]
    circle = np.clip(S / 2 - 1 - np.sqrt((xx - S / 2 + 0.5) ** 2 + (yy - S / 2 + 0.5) ** 2) + 0.5, 0, 1)
    for img_i, r, c, name in BALLS:
        (y0, y1), (x0, x1) = BALL_ROWS[r], BALL_COLS[c]
        rgba, _ = trim(key(srcs[img_i][y0:y1, x0:x1], name not in KEEP_PINK), 0)
        h, w = rgba.shape[:2]
        side = int(min(h, w) * 0.97)
        cy, cx = h // 2, w // 2
        sq = rgba[cy - side // 2: cy - side // 2 + side, cx - side // 2: cx - side // 2 + side]
        im = np.array(Image.fromarray(sq, 'RGBA').resize((S, S), Image.LANCZOS)).astype(np.float32)
        im[..., 3] = 255 * circle                     # dokonalý kruh (srážka je taky kruh)
        bmeta[name] = balls.add(im.astype(np.uint8))
        if preview:
            Image.fromarray(im.astype(np.uint8), 'RGBA').save(os.path.join(preview, 'micek-' + name + '.png'))
    h = balls.save(os.path.join(OUT, 'micky.webp'))
    with open(os.path.join(OUT, 'micky.json'), 'w', encoding='utf-8') as f:
        json.dump(bmeta, f, ensure_ascii=False, separators=(',', ':'))
    print('míčky', len(bmeta), 'list', S * 7 + 12, 'x', h)


if __name__ == '__main__':
    main()
