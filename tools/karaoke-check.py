# Kontrola karaoke časů všech písní: najde řádky, které se obarvují ve špatnou chvíli.
#
# Bere oddělený hlas (Demucs, mezipaměť z tools/karaoke-align.py: ~/.cache/skeli-karaoke/<id>.vocals16k.npy)
# a pro každý řádek a slovo zkontroluje:
#   TICHO     – v době řádku skoro nezní hlas (řádek je jinde, než se zpívá)
#   NACPANÝ   – řádek je nesmyslně rychlý (moc písmen za vteřinu) – zarovnání ho smáčklo
#   RYCHLÁ SLOVA – víc slov za sebou kratších než 0,07 s
#   NEPOKRYTO – hlas zní dlouho (≥ 5 s) a žádný řádek tam není (refrén / konec chybí nebo je jinde)
# Výsledek: přehled po písních, nejhorší nahoře. Opravy pak přes /admin/karaoke nebo znovu tools/karaoke-align.py.
#
# použití:  python tools/karaoke-check.py <složka s texty <id>.txt> [--karaoke src/main/webapp/karaoke] [--cache dir]
#   (texty = česká slova písně, řádek po řádku, prázdné řádky se přeskočí – stejně jako u karaoke-align.py)
import json
import os
import sys

import numpy as np

RATE = 16000


def option(name, default):
    return sys.argv[sys.argv.index(name) + 1] if name in sys.argv else default


def main():
    texts = sys.argv[1]
    kdir = option('--karaoke', os.path.join(os.path.dirname(__file__), '..', 'src', 'main', 'webapp', 'karaoke'))
    cache = option('--cache', os.path.join(os.path.expanduser('~'), '.cache', 'skeli-karaoke'))
    report = []
    for f in sorted(os.listdir(kdir)):
        if not f.endswith('.json'):
            continue
        yt = f[:-5]
        k = json.load(open(os.path.join(kdir, f), encoding='utf-8'))
        times, words = k.get('times', []), k.get('words', [])
        tf = os.path.join(texts, yt + '.txt')
        lines = [l.strip() for l in open(tf, encoding='utf-8').read().split('\n') if l.strip()] if os.path.exists(tf) else []
        vf = os.path.join(cache, yt + '.vocals16k.npy')
        if not os.path.exists(vf):
            report.append((0, yt, ['  (chybí oddělený hlas v mezipaměti – nejde zkontrolovat)']))
            continue
        voice = np.load(vf).astype(np.float32)
        hop = RATE // 50                                   # 20 ms
        n = len(voice) // hop
        rms = np.sqrt(np.mean(voice[:n * hop].reshape(n, hop) ** 2, axis=1))
        peak = np.percentile(rms, 98) or 1
        voiced = rms > peak * 0.08                         # tady zní hlas
        def frac(a, b):
            i, j = int(a * 50), max(int(a * 50) + 1, int(b * 50))
            seg = voiced[i:j]
            return float(seg.mean()) if len(seg) else 0.0
        issues, score = [], 0
        covered = np.zeros(n, dtype=bool)
        for i, (a, b) in enumerate(times):
            covered[int(a * 50):int(b * 50) + 1] = True
            text = lines[i] if i < len(lines) else '?'
            letters = sum(c.isalpha() for c in text)
            dur = max(0.01, b - a)
            why = []
            vf_ = frac(a, b)
            if vf_ < 0.3:
                why.append('TICHO %d %%' % round(vf_ * 100))
            if letters / dur > 24:
                why.append('NACPANÝ %.0f písmen/s' % (letters / dur))
            w = words[i] if i < len(words) else []
            short = run = 0
            for x in w:
                run = run + 1 if x[1] - x[0] < 0.07 else 0
                short = max(short, run)
            if short >= 3:
                why.append('RYCHLÁ SLOVA ×%d' % short)
            if why:
                score += len(why)
                issues.append('  ř. %2d  %6.1f–%5.1f s  %-34s %s' % (i + 1, a, b, ', '.join(why), text[:60]))
        # hlas, pod kterým není žádný řádek (dlouhé úseky)
        gap = 0
        start = None
        for t in range(n):
            if voiced[t] and not covered[t]:
                if start is None:
                    start = t
                gap = t
            elif start is not None and t - gap > 50:      # úsek skončil (1 s ticha)
                if (gap - start) / 50 >= 5:
                    score += 2
                    issues.append('  NEPOKRYTO %6.1f–%5.1f s  zní hlas %.0f s a žádný řádek tam není' % (start / 50, gap / 50, (gap - start) / 50))
                start = None
        if start is not None and (gap - start) / 50 >= 5:
            score += 2
            issues.append('  NEPOKRYTO %6.1f–%5.1f s  zní hlas a žádný řádek tam není (konec písně)' % (start / 50, gap / 50))
        report.append((score, yt, issues or ['  v pořádku'], len(times), len(lines)))
    report.sort(key=lambda r: -r[0])
    for r in report:
        extra = '' if len(r) < 4 or r[3] == r[4] else '  (POZOR: %d řádků časů, %d řádků textu)' % (r[3], r[4])
        print('%s  body %d%s' % (r[1], r[0], extra))
        print('\n'.join(r[2]))
        print()


if __name__ == '__main__':
    main()
