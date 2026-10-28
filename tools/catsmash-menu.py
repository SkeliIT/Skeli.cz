# Obrázky do menu CatSmash z Gemini (na purpurovém pozadí #FF00FF): logo, Kevinova hlava a tři medailony
# (Jak se hraje, Odznaky, Tabulka). Purpurová se maže od okraje (vyplňování) i čistá purpurová uvnitř (díry v písmenech),
# okraje se odbarví, obrázek se ořízne a zmenší. Výstup: src/main/webapp/kevin/pong/menu/*.webp
#
# Spuštění: python tools/catsmash-menu.py <logo.jpg> <kevin-hlava.jpg> <ikony.jpg>
import os
import sys
from collections import deque

import numpy as np
from PIL import Image

OUT = os.path.join(os.path.dirname(__file__), '..', 'src', 'main', 'webapp', 'kevin', 'pong', 'menu')


def key(im, warm=False):
    """warm=True: předmět nemá žádnou fialovou (logo) – růžovou záři kolem se zbavíme i uvnitř obrázku"""
    a = np.asarray(im.convert('RGB')).astype(np.float32)
    h, w, _ = a.shape
    d = np.sqrt((a[..., 0] - 255) ** 2 + a[..., 1] ** 2 + (a[..., 2] - 255) ** 2)
    cand = d < 120
    seen = np.zeros((h, w), bool)
    q = deque()
    for y in range(h):
        for x in (0, w - 1):
            if cand[y, x] and not seen[y, x]:
                seen[y, x] = True; q.append((y, x))
    for x in range(w):
        for y in (0, h - 1):
            if cand[y, x] and not seen[y, x]:
                seen[y, x] = True; q.append((y, x))
    while q:
        y, x = q.popleft()
        for ny, nx in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
            if 0 <= ny < h and 0 <= nx < w and cand[ny, nx] and not seen[ny, nx]:
                seen[ny, nx] = True; q.append((ny, nx))
    bg = seen | (d < 50)
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
    # zbytky purpurového nádechu na okraji (R i B nad G)
    spill = np.clip(np.minimum(rgb[..., 0], rgb[..., 2]) - rgb[..., 1], 0, None) * near
    rgb[..., 0] -= spill * 0.8; rgb[..., 2] -= spill * 0.8
    if warm:
        tint = rgb[..., 2] - rgb[..., 1]                       # modrá nad zelenou = fialový nádech
        alpha = alpha * np.clip(1 - (tint - 25) / 70, 0, 1)
        rgb[..., 2] = np.minimum(rgb[..., 2], rgb[..., 1] + 25)
    return Image.fromarray(np.dstack([np.clip(rgb, 0, 255), alpha * 255]).astype(np.uint8), 'RGBA')


def save(img, name, width):
    img = img.crop(img.getbbox())
    if img.width > width:
        img = img.resize((width, round(img.height * width / img.width)), Image.LANCZOS)
    path = os.path.join(OUT, name + '.webp')
    img.save(path, 'WEBP', quality=88, method=6)
    print(name, img.size, os.path.getsize(path) // 1024, 'kB')


def main():
    os.makedirs(OUT, exist_ok=True)
    logo, head, icons = (Image.open(p) for p in sys.argv[1:4])
    save(key(logo, warm=True), 'logo', 900)
    save(key(head), 'kevin', 192)
    k = key(icons)
    third = k.width // 3
    for i, name in enumerate(('ikona-jak', 'ikona-odznaky', 'ikona-tabulka')):
        save(k.crop((i * third, 0, (i + 1) * third, k.height)), name, 160)


if __name__ == '__main__':
    main()
