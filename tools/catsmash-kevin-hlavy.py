"""Kevinovy hlavy pro přepínač obtížnosti v menu CatSmash (varianta B).

Všichni tři Kevinové musí vypadat stejně: kulatý výřez, stejné šedé pozadí, bez zlatého rámečku (kroužek kolem
kreslí CSS). Normální = vnitřek dnešního medailonu kevin/pong/menu/kevin.webp, Lehká a Naštvaný = obrázky
z Gemini na purpurovém pozadí (#FF00FF), purpurová se nahradí šedou z medailonu (měkký okraj srsti, bez
růžového lemu).

Spuštění (Python s Pillow, např. venv C:/Users/skele/kw):
  python tools/catsmash-kevin-hlavy.py <kevin.webp> <lehka.jpg> <nastvany.jpg> <výstupní složka>
Výstup: kevin-1.webp (Lehká), kevin-2.webp (Normální), kevin-3.webp (Naštvaný), 192 × 192 px.
"""
import math
import sys

from PIL import Image, ImageDraw, ImageFilter

SIZE = 192


def inner_circle(med):
    """Střed a poloměr vnitřku medailonu: z okraje dovnitř přes zlatý rámeček, dokud je zlatý (zrzavá srst uvnitř
    se se zlatem plete, proto se jde zvenku); ze 36 směrů prostřední hodnota."""
    w, h = med.size
    cx, cy = w / 2, h / 2
    px = med.convert('RGBA').load()
    found = []
    for k in range(36):
        a = 2 * math.pi * k / 36
        seen = False
        for r in range(int(min(w, h) / 2) - 1, int(min(w, h) * 0.25), -1):
            red, g, b, al = px[int(cx + math.cos(a) * r), int(cy + math.sin(a) * r)]
            gold = al > 200 and red > 120 and red - b > 50
            if gold:
                seen = True
            elif seen:
                found.append(r)
                break
    found.sort()
    return cx, cy, found[len(found) // 2] - 3


def round_mask(size):
    """Kulatá maska s vyhlazeným okrajem (kreslí se 4× větší a zmenší)."""
    big = Image.new('L', (size * 4, size * 4), 0)
    ImageDraw.Draw(big).ellipse((0, 0, size * 4 - 1, size * 4 - 1), fill=255)
    return big.resize((size, size), Image.LANCZOS)


def background(med, circle):
    """Šedé pozadí z medailonu: barva kousek pod horním okrajem vnitřku (vlevo, kde není kočka) – svislý přechod."""
    cx, cy, r = circle
    rgb = med.convert('RGB')
    # šedá z okraje vnitřku: ze 48 míst v horní půlce to nejšedivější (nejmenší rozdíl barev, ne tmavé)
    pts = [rgb.getpixel((int(cx + math.cos(a) * r * 0.9), int(cy + math.sin(a) * r * 0.9)))
           for a in (math.pi + math.pi * k / 47 for k in range(48))]
    top = min((p for p in pts if sum(p) > 300), key=lambda p: max(p) - min(p))
    bottom = tuple(int(c * 0.82) for c in top)                       # dolů o kousek tmavší
    bg = Image.new('RGB', (SIZE, SIZE))
    d = ImageDraw.Draw(bg)
    for y in range(SIZE):
        t = y / (SIZE - 1)
        d.line([(0, y), (SIZE, y)], fill=tuple(int(top[i] + (bottom[i] - top[i]) * t) for i in range(3)))
    return bg


def unmagenta(img, bg):
    """Purpurové pozadí pryč: čím víc je pixel purpurový, tím víc prosvítá pozadí; z polopropustných okrajů
    (srst, kouř) se purpurová odečte, ať nezůstane růžový lem."""
    src = img.convert('RGB')
    w, h = src.size
    out = Image.new('RGB', (w, h))
    sp, bp, op = src.load(), bg.load(), out.load()
    for y in range(h):
        for x in range(w):
            r, g, b = sp[x, y]
            key = max(0.0, min(1.0, (min(r, b) - g - 30) / 130))      # 0 = kočka, 1 = čistá purpurová
            if key >= 0.999:
                op[x, y] = bp[x, y]
                continue
            # odečíst podíl purpurové (255, 0, 255) a smíchat s pozadím
            fr = (r - key * 255) / (1 - key)
            fg_ = g / (1 - key)
            fb = (b - key * 255) / (1 - key)
            fr, fg_, fb = (max(0, min(255, v)) for v in (fr, fg_, fb))
            if key > 0.02:                                            # zbytek růžové na okraji srsti/kouře pryč
                fb = min(fb, max(fg_, fr * 0.55))
                fr = min(fr, fg_ * 1.25 + 40)
            br, bgc, bb = bp[x, y]
            op[x, y] = (int(fr * (1 - key) + br * key), int(fg_ * (1 - key) + bgc * key), int(fb * (1 - key) + bb * key))
    return out


def main():
    med_path, easy_path, angry_path, out_dir = sys.argv[1:5]
    med = Image.open(med_path).convert('RGBA')
    circle = inner_circle(med)
    cx, cy, r = circle
    mask = round_mask(SIZE)

    # Normální: vnitřek medailonu
    normal = med.crop((int(cx - r), int(cy - r), int(cx + r), int(cy + r))).resize((SIZE, SIZE), Image.LANCZOS)
    bg = background(med, circle)

    def save(img, name):
        o = img.convert('RGBA')
        o.putalpha(mask)
        o.save(out_dir + '/' + name, 'WEBP', quality=88, method=6)
        print(name, o.size)

    save(normal, 'kevin-2.webp')
    # Lehká a Naštvaný: čtverec kolem hlavy (stejný záběr jako medailon: uši nahoře, mikina dole), purpurová pryč
    for path, name in ((easy_path, 'kevin-1.webp'), (angry_path, 'kevin-3.webp')):
        g = Image.open(path).convert('RGB')
        w, h = g.size
        side = int(min(w, h) * 0.98)
        x0, y0 = (w - side) // 2, h - side
        head = g.crop((x0, y0, x0 + side, y0 + side)).resize((SIZE, SIZE), Image.LANCZOS)
        save(unmagenta(head, bg).filter(ImageFilter.SHARPEN), name)


if __name__ == '__main__':
    main()
