# Ověření (a oprava) karaoke časů podle toho, co je opravdu slyšet.
#
# 1. Whisper (faster-whisper large-v3) přepíše oddělený hlas (mezipaměť z tools/karaoke-align.py:
#    ~/.cache/skeli-karaoke/<id>.vocals16k.npy) i s časem každého slova.
# 2. Náš text se na přepis přiloží slovo po slově V POŘADÍ (zarovnání sekvencí s tolerancí překlepů), takže
#    opakovaný refrén se chytí na správné opakování – na tom karaoke-align.py občas uklouzne (Machine gun:
#    refrén posunutý o jedno opakování, konec nacpaný do dvou vteřin).
# 3. Řádek, jehož začátek se od přepisu liší o víc než --tol s (výchozí 1,2 s), se nahlásí; s --write se do
#    --out zapíšou opravené časy (řádky s málo slyšenými slovy zůstanou po staru a jsou označené „?“).
#
# použití:  python tools/karaoke-verify.py <složka s texty <id>.txt> [id …] [--out dir] [--write] [--tol 1.2]
# Potřebuje: faster-whisper (venv C:\Users\skele\kw), do PATH ...\kw\Lib\site-packages\torch\lib (cublas pro GPU).
import difflib
import json
import os
import re
import sys
import unicodedata

import numpy as np

RATE = 16000


def option(name, default):
    return sys.argv[sys.argv.index(name) + 1] if name in sys.argv else default


def norm(w):
    w = unicodedata.normalize('NFKD', w.lower())
    w = ''.join(c for c in w if not unicodedata.combining(c))
    return re.sub(r'[^a-z0-9]', '', w)


def sim(a, b):
    if not a or not b:
        return -1.0
    if a == b:
        return 2.0
    r = difflib.SequenceMatcher(None, a, b).ratio()
    return 1.0 if r >= 0.72 else -1.0


def align(ours, heard):
    """Needleman–Wunsch: nejlepší pořadí párů (i v našem textu, j v přepisu); vrací {i: j}."""
    n, m, gap = len(ours), len(heard), -0.6
    S = np.zeros((n + 1, m + 1), dtype=np.float32)
    B = np.zeros((n + 1, m + 1), dtype=np.int8)        # 0 = pár, 1 = vynech náš, 2 = vynech slyšený
    S[1:, 0] = gap * np.arange(1, n + 1); B[1:, 0] = 1
    S[0, 1:] = gap * np.arange(1, m + 1); B[0, 1:] = 2
    for i in range(1, n + 1):
        for j in range(1, m + 1):
            p = S[i - 1, j - 1] + sim(ours[i - 1], heard[j - 1])
            u = S[i - 1, j] + gap
            l = S[i, j - 1] + gap
            if p >= u and p >= l:
                S[i, j], B[i, j] = p, 0
            elif u >= l:
                S[i, j], B[i, j] = u, 1
            else:
                S[i, j], B[i, j] = l, 2
    pairs, i, j = {}, n, m
    while i > 0 or j > 0:
        b = B[i, j]
        if i > 0 and j > 0 and b == 0:
            if sim(ours[i - 1], heard[j - 1]) > 0:
                pairs[i - 1] = j - 1
            i, j = i - 1, j - 1
        elif i > 0 and (j == 0 or b == 1):
            i -= 1
        else:
            j -= 1
    return pairs


def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    texts, only = args[0], set(args[1:])
    for o in ('--out', '--tol'):
        if o in sys.argv:
            v = sys.argv[sys.argv.index(o) + 1]
            only.discard(v)
    root = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
    kdir = os.path.join(root, 'src', 'main', 'webapp', 'karaoke')
    cache = os.path.join(os.path.expanduser('~'), '.cache', 'skeli-karaoke')
    out = option('--out', os.path.join(root, 'target', 'karaoke-verify'))
    tol = float(option('--tol', '1.2'))
    write = '--write' in sys.argv
    os.makedirs(out, exist_ok=True)
    from faster_whisper import WhisperModel
    model = WhisperModel('large-v3', device='cuda', compute_type='float16')
    for f in sorted(os.listdir(kdir)):
        yt = f[:-5]
        if not f.endswith('.json') or (only and yt not in only):
            continue
        vf, tf = os.path.join(cache, yt + '.vocals16k.npy'), os.path.join(texts, yt + '.txt')
        if not os.path.exists(vf) or not os.path.exists(tf):
            print(yt, '– chybí hlas nebo text, přeskočeno\n')
            continue
        k = json.load(open(os.path.join(kdir, f), encoding='utf-8'))
        lines = [l.strip() for l in open(tf, encoding='utf-8').read().split('\n') if l.strip()]
        if len(lines) != len(k['times']):
            print(yt, '– POZOR: %d řádků textu, %d řádků časů – přeskočeno\n' % (len(lines), len(k['times'])))
            continue
        voice = np.load(vf).astype(np.float32)
        segs, _ = model.transcribe(voice, language='cs', word_timestamps=True, beam_size=5, temperature=0, condition_on_previous_text=False)
        heard = [(norm(w.word), w.start, w.end) for s in segs for w in (s.words or []) if norm(w.word)]
        ours, owner = [], []
        for li, line in enumerate(lines):
            for w in line.split():
                if norm(w):
                    ours.append(norm(w)); owner.append(li)
        pairs = align(ours, [h[0] for h in heard])
        new_times, new_words, report, heardl = [], [], [], []
        idx = 0
        for li, line in enumerate(lines):
            ws = [w for w in line.split()]
            got, wt = 0, []
            for w in ws:
                if norm(w):
                    j = pairs.get(idx)
                    wt.append(None if j is None else [round(heard[j][1], 2), round(heard[j][2], 2)])
                    got += j is not None
                    idx += 1
                else:
                    wt.append(None)
            n = max(1, sum(1 for w in ws if norm(w)))
            old = k['times'][li]
            # starý čas zjevně špatný? (nacpaný řádek, v tichu)
            letters = sum(c.isalpha() for c in line)
            o_bad = letters / max(0.01, old[1] - old[0]) > 24
            if not o_bad:
                hop0 = RATE // 50; i0, i1 = int(old[0] * 50), max(int(old[0] * 50) + 1, int(old[1] * 50))
                seg0 = voice[i0 * hop0:i1 * hop0]
                o_bad = len(seg0) > 0 and float(np.sqrt(np.mean(seg0 ** 2))) < 0.02 * (float(np.max(np.abs(voice))) or 1)
            # Whisperu věřit jen když slyšel skoro celý řádek, nebo když je starý čas zjevně špatný
            if got / n >= 0.8 or (o_bad and got / n >= 0.4):
                # chybějící slova rozložit mezi sousední slyšená
                known = [i for i, x in enumerate(wt) if x]
                a, b = wt[known[0]][0], wt[known[-1]][1]
                for i, x in enumerate(wt):
                    if x is None:
                        prev = max([p for p in known if p < i], default=None)
                        nxt = min([p for p in known if p > i], default=None)
                        s = wt[prev][1] if prev is not None else a
                        e = wt[nxt][0] if nxt is not None else b
                        wt[i] = [round(s, 2), round(max(s + 0.05, e), 2)]
                new_times.append([a, b]); new_words.append(wt); heardl.append(True)
                if abs(a - old[0]) > tol or abs(b - old[1]) > tol + 1:
                    report.append('  ř. %2d  bylo %6.1f–%5.1f  slyšet %6.1f–%5.1f  (%d/%d slov)  %s' % (li + 1, old[0], old[1], a, b, got, n, line[:55]))
            else:
                new_times.append(list(old)); new_words.append(k['words'][li] if li < len(k.get('words', [])) else []); heardl.append(False)
                report.append('  ř. %2d  ?  málo slyšených slov (%d/%d) – nechávám %5.1f–%5.1f  %s' % (li + 1, got, n, old[0], old[1], line[:55]))
        # Řádky, které Whisper neslyšel a mají zjevně špatný čas (nacpaný, v tichu, přes souseda): přesunout do nejbližšího
        # úseku, kde zní hlas a není tam žádný řádek (Machine gun: třetí refrén byl nacpaný za druhý, hlas zněl v 57–60 s).
        hop = RATE // 50
        nfr = len(voice) // hop
        rms = np.sqrt(np.mean(voice[:nfr * hop].reshape(nfr, hop) ** 2, axis=1))
        voiced = rms > (np.percentile(rms, 98) or 1) * 0.08
        def vfrac(a, b):
            seg = voiced[int(a * 50):max(int(a * 50) + 1, int(b * 50))]
            return float(seg.mean()) if len(seg) else 0.0
        for li in range(len(lines)):
            if heardl[li]:
                continue
            a, b = new_times[li]
            prev_end = new_times[li - 1][1] if li > 0 else 0.0
            next_start = next((new_times[x][0] for x in range(li + 1, len(lines)) if heardl[x]), len(voice) / RATE)
            letters = sum(c.isalpha() for c in lines[li])
            bad = letters / max(0.01, b - a) > 24 or vfrac(a, b) < 0.3 or a < prev_end - 0.3
            if not bad:
                continue
            covered = np.zeros(nfr, dtype=bool)
            for x, (ta, tb) in enumerate(new_times):
                if x != li:
                    covered[int(ta * 50):int(tb * 50) + 1] = True
            free = voiced & ~covered
            lo, hi = int((prev_end + 0.05) * 50), int(max(prev_end + 0.1, next_start - 0.05) * 50)
            segs2, st = [], None
            for t in range(lo, min(hi, nfr)):
                if free[t] and st is None:
                    st = t
                if (not free[t] or t == min(hi, nfr) - 1) and st is not None:
                    if t - st >= 25:                       # aspoň půl vteřiny hlasu
                        segs2.append((st, t))
                    st = None
            if not segs2:
                continue
            # spojit úseky s mezerou < 0,6 s (jeden řádek se zpívá s nádechy)
            sa, sb = segs2[0]
            for x, y in segs2[1:]:
                if x - sb <= 30:
                    sb = y
                else:
                    break
            a, b = round(sa / 50, 2), round(sb / 50, 2)
            ws = lines[li].split()
            tot = sum(max(1, sum(c.isalpha() for c in w)) for w in ws)
            t, wt = a, []
            for w in ws:
                d = (b - a) * max(1, sum(c.isalpha() for c in w)) / tot
                wt.append([round(t, 2), round(t + d * 0.92, 2)]); t += d
            new_times[li], new_words[li] = [a, b], wt
            report.append('  ř. %2d  PŘESUNUTO do hlasu %6.1f–%5.1f (bylo %5.1f–%5.1f)  %s' % (li + 1, a, b, k['times'][li][0], k['times'][li][1], lines[li][:50]))
        print('%s  %d řádků, odchylek %d' % (yt, len(lines), sum(1 for r in report if '?' not in r[:12])))
        print('\n'.join(report) or '  v pořádku')
        print()
        if write:
            # časy musí jít po sobě: případný překryv srovnat
            for i in range(1, len(new_times)):
                if new_times[i][0] < new_times[i - 1][1]:
                    new_times[i - 1][1] = max(new_times[i - 1][0] + 0.1, new_times[i][0] - 0.02)
            k2 = dict(k); k2['times'] = new_times; k2['words'] = new_words
            json.dump(k2, open(os.path.join(out, f), 'w', encoding='utf-8'), ensure_ascii=False)


if __name__ == '__main__':
    main()
