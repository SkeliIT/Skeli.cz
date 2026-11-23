# Náhledový obrázek premiéry pro sociální sítě (og:image stránky /premiera), jeden pro každý jazyk.
# Vezme úvodní obrázek klipu a dole přidá pruh: PREMIÉRA, den a čas, skeli.cz.
# Sociální sítě si obrázek pamatují, proto je na něm pevné datum, ne „za 3 dny“.
# Použití: python tools/premiera-og.py "<obrázek klipu>" <slug písně>
#   → src/main/webapp/img/premiera/og-<slug>-{cs,en,de,uk,vi}.jpg (načte je web/site/PremiereServlet)
import sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

W, H = 1280, 720
PISMO = r"C:\Windows\Fonts\bahnschrift.ttf"   # umí češtinu, azbuku i vietnamštinu
CERVENA = (200, 30, 36)                          # červená z nápisu ODEJÍT na obrázku

# štítek, den a čas, poznámka k času (mimo Česko je potřeba říct, v jakém pásmu)
TEXTY = {
    "cs": ("PREMIÉRA", "ČTVRTEK 26. 11. · 19:00", ""),
    "en": ("PREMIERE", "THURSDAY 26 NOV · 19:00", "CET"),
    "de": ("PREMIERE", "DONNERSTAG 26. 11. · 19:00", "MEZ"),
    "uk": ("ПРЕМ'ЄРА", "ЧЕТВЕР 26. 11. · 19:00", "CET"),
    "vi": ("CÔNG CHIẾU", "THỨ NĂM 26/11 · 19:00", "CET"),
}


def pismo(velikost, rez):
    f = ImageFont.truetype(PISMO, velikost)
    f.set_variation_by_name(rez)
    return f


def udelej(zdroj, lang, cil):
    stitek, kdy, pasmo = TEXTY[lang]
    img = Image.open(zdroj).convert("RGB")
    # oříznout na 16:9 a zmenšit
    sw, sh = img.size
    if sw / sh > W / H:
        nw = int(sh * W / H); img = img.crop(((sw - nw) // 2, 0, (sw - nw) // 2 + nw, sh))
    else:
        nh = int(sw * H / W); img = img.crop((0, 0, sw, nh))
    img = img.resize((W, H), Image.LANCZOS)

    # tmavý přechod dole, aby text byl čitelný i na světlé části fotky
    stin = Image.new("L", (W, H), 0)
    d = ImageDraw.Draw(stin)
    od = 470
    for y in range(od, H):
        d.line([(0, y), (W, y)], fill=int(235 * min(1, (y - od) / (H - od - 40)) ** 1.3))
    img = Image.composite(Image.new("RGB", (W, H), (0, 0, 0)), img, stin)

    d = ImageDraw.Draw(img)
    x, spodek = 56, 676          # Facebook ořízne nahoře i dole ~25 px, text drží nad tím
    f_kdy = pismo(76, "Bold Condensed")
    f_stitek = pismo(30, "Bold")
    f_web = pismo(34, "SemiBold")

    # den a čas
    bb = d.textbbox((0, 0), kdy, font=f_kdy)
    y_kdy = spodek - (bb[3] - bb[1]) - bb[1]
    d.text((x, y_kdy), kdy, font=f_kdy, fill=(245, 245, 245))
    konec = x + d.textlength(kdy, font=f_kdy)
    if pasmo:
        d.text((konec + 14, spodek - 4), pasmo, font=f_web, fill=(190, 190, 190), anchor="ls")

    # červený štítek nad tím
    sb = d.textbbox((0, 0), stitek, font=f_stitek)
    pad_x, pad_y = 14, 8
    sh_ = sb[3] - sb[1]
    y_st = y_kdy + bb[1] - 18 - sh_ - 2 * pad_y
    d.rectangle([x, y_st, x + (sb[2] - sb[0]) + 2 * pad_x, y_st + sh_ + 2 * pad_y], fill=CERVENA)
    d.text((x + pad_x - sb[0], y_st + pad_y - sb[1]), stitek, font=f_stitek, fill=(255, 255, 255))

    # adresa vpravo dole
    d.text((W - 56, spodek - 4), "skeli.cz", font=f_web, fill=(225, 225, 225), anchor="rs")

    cil.parent.mkdir(parents=True, exist_ok=True)
    img.save(cil, "JPEG", quality=86, optimize=True, progressive=True)
    print(cil, cil.stat().st_size // 1024, "kB")


if __name__ == "__main__":
    zdroj, slug = sys.argv[1], sys.argv[2]
    ven = Path(__file__).resolve().parent.parent / "src/main/webapp/img/premiera"
    for lang in TEXTY:
        udelej(zdroj, lang, ven / f"og-{slug}-{lang}.jpg")
