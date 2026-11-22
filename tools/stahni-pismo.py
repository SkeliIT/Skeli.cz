# Stáhne písmo z Google Fonts do src/main/webapp/fonts (jen woff2 a jen potřebné znakové sady) a vypíše
# pravidla @font-face s místními adresami. Web pak písma hostuje sám – návštěvník se na Google nepřipojuje (soukromí).
# Použití: python tools/stahni-pismo.py "Bangers" "Comic Neue:wght@400;700" "Caveat:wght@400..700"
# Výstup (@font-face) vlož do CSS, kde se písmo používá (u vzhledů profilu: css/profile-looks.css).
import re
import sys
import urllib.parse
import urllib.request
from pathlib import Path

FONTS = Path(__file__).resolve().parent.parent / 'src/main/webapp/fonts'
SADY = {'latin', 'latin-ext', 'cyrillic', 'cyrillic-ext', 'vietnamese'}   # jazyky webu: cs, en, de, uk, vi
UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36'


def stahni(url):
    return urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': UA}), timeout=30).read()


for rodina in sys.argv[1:]:
    css = stahni('https://fonts.googleapis.com/css2?family=' + urllib.parse.quote(rodina, safe=':;@.,') + '&display=swap').decode()
    jmeno = rodina.split(':')[0]
    slug = jmeno.lower().replace(' ', '-')
    # každý blok: /* sada */ @font-face { … }
    for sada, blok in re.findall(r'/\* ([\w-]+) \*/\s*(@font-face \{.*?\})', css, re.S):
        if sada not in SADY:
            continue
        styl = re.search(r'font-style: (\w+)', blok).group(1)
        vaha = re.search(r'font-weight: ([\d ]+);', blok).group(1).strip()
        url = re.search(r'url\((https://[^)]+\.woff2)\)', blok).group(1)
        rozsah = re.search(r'unicode-range: ([^;]+);', blok).group(1)
        soubor = f'{slug}-{vaha.replace(" ", "-")}{"i" if styl == "italic" else ""}-{sada}.woff2'
        (FONTS / soubor).write_bytes(stahni(url))
        print(f"@font-face {{ font-family: '{jmeno}'; font-style: {styl}; font-weight: {vaha}; font-display: swap; "
              f"src: url(/fonts/{soubor}) format('woff2'); unicode-range: {rozsah}; }}")
