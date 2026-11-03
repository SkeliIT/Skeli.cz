# Rámečky šampionů měsíce (zlatý / stříbrný / bronzový, z Gemini na purpurovém pozadí #FF00FF) → průhledné WebP
# img/frames/champ1–3.webp. Vyřízne purpurovou i z otvoru uprostřed, ořízne na čtverec se středem otvoru a vypíše,
# jak velký je otvor (podíl šířky obrázku) – podle toho je v components.css nastavená velikost rámečku kolem fotky.
#
# Spuštění: python tools/catsmash-champ-frames.py <zlatý.jpg> <stříbrný.jpg> <bronzový.jpg>
import os
import sys

import numpy as np
from PIL import Image

OUT = os.path.join(os.path.dirname(__file__), '..', 'src', 'main', 'webapp', 'img', 'frames')
BG = np.array([255, 0, 255], np.float32)
SIZE = 400                                   # profil 116 px × ~1,7 × 2 (ostré i na telefonu s hustým displejem)


def key(img):
    """Průhlednost podle vzdálenosti barvy od purpurové, pak odstranění purpurového nádechu z okrajů."""
    rgb = np.asarray(img.convert('RGB')).astype(np.float32)
    d = np.sqrt(((rgb - BG) ** 2).sum(axis=2))
    a = np.clip((d - 70) / 45, 0, 1)
    am = np.maximum(a, 0.05)[..., None]
    rgb = np.clip((rgb - (1 - am) * BG) / am, 0, 255)
    # purpurový nádech (R i B nad G) pryč všude – zlato a bronz mají modrou pod zelenou, takže se jich to netkne,
    # stříbro je šedé, takže zmizí jen růžový lem na zubech
    spill = np.minimum(rgb[..., 0], rgb[..., 2]) - rgb[..., 1]
    fix = spill > 0
    rgb[fix, 0] -= spill[fix]
    rgb[fix, 2] -= spill[fix]
    return np.dstack([np.clip(rgb, 0, 255), a * 255]).astype(np.uint8), a


def main(paths):
    os.makedirs(OUT, exist_ok=True)
    for n, p in enumerate(paths, 1):
        rgba, a = key(Image.open(p))
        h, w = a.shape
        ys, xs = np.nonzero(a > 0.5)
        cx, cy = (xs.min() + xs.max()) / 2, (ys.min() + ys.max()) / 2
        # otvor: od středu doleva / doprava / nahoru po první neprůhledný pixel
        row, col = a[int(cy)], a[:, int(cx)]
        left = int(cx) - np.argmax(row[int(cx)::-1] > 0.5)
        right = int(cx) + np.argmax(row[int(cx):] > 0.5)
        top = int(cy) - np.argmax(col[int(cy)::-1] > 0.5)
        hole_cx, hole_r = (left + right) / 2, (right - left) / 2
        hole_cy = top + hole_r
        # čtverec se středem v otvoru, aby se do něj vešel celý rámeček i s medailí
        half = max(hole_cx - xs.min(), xs.max() - hole_cx, hole_cy - ys.min(), ys.max() - hole_cy) + 4
        box = (int(hole_cx - half), int(hole_cy - half), int(hole_cx + half), int(hole_cy + half))
        out = Image.fromarray(rgba, 'RGBA').crop(box).resize((SIZE, SIZE), Image.LANCZOS)
        dst = os.path.join(OUT, f'champ{n}.webp')
        out.save(dst, 'WEBP', quality=88, method=6)
        print(f'champ{n}: otvor {2 * hole_r / (2 * half):.3f} šířky, {os.path.getsize(dst) // 1024} kB')


if __name__ == '__main__':
    main(sys.argv[1:4])
