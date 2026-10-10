# Karaoke timings for a clip: when each line of the lyrics is sung (js/karaoke.js burns it in with the laser).
#
# Whisper (faster-whisper, large-v3) listens to the clip and writes down every word it hears with its time;
# the lyrics we already have are then matched to what it heard, word by word, in order, forgiving the
# words it misheard (rap over a loud beat). A line starts at its first matched word and ends at its last;
# lines it did not hear at all get times in between their neighbours, by length.
#
# usage:  python tools/karaoke-align.py <clip.mp4> <lyrics.txt> <out.json> [--model large-v3] [--cpu]
# out:    {"lines": 42, "matched": 0.71, "times": [[12.4, 15.9], [16.0, 19.2], ...]}  one pair per non-empty line
# Needs:  pip install faster-whisper nvidia-cublas-cu12 "nvidia-cudnn-cu12==9.*"  (the GPU libraries; --cpu without)
import difflib
import importlib.util
import json
import os
import re
import sys
import unicodedata


def gpu_libraries():
    """The CUDA libraries come as pip packages; Windows has to be told where their DLLs are."""
    for pkg in ('nvidia.cublas', 'nvidia.cudnn'):
        spec = importlib.util.find_spec(pkg)
        if spec and spec.submodule_search_locations:
            d = os.path.join(list(spec.submodule_search_locations)[0], 'bin')
            if os.path.isdir(d):
                os.add_dll_directory(d)
                os.environ['PATH'] = d + os.pathsep + os.environ.get('PATH', '')


def norm(word):
    """Lower case, no accents, letters and digits only: "Kouře," -> "koure"."""
    w = unicodedata.normalize('NFKD', word.lower())
    w = ''.join(c for c in w if not unicodedata.combining(c))
    return re.sub(r'[^a-z0-9]', '', w)


def similar(a, b):
    if a == b:
        return 1.0
    return difflib.SequenceMatcher(None, a, b).ratio()


def align(lyric, heard):
    """Pairs lyric words with heard words in order (like a diff that forgives typos). Returns {lyric i: heard j}."""
    n, m = len(lyric), len(heard)
    gap = 0.45
    score = [[0.0] * (m + 1) for _ in range(n + 1)]
    move = [[0] * (m + 1) for _ in range(n + 1)]   # 1 = pair, 2 = skip a lyric word, 3 = skip a heard word
    for i in range(1, n + 1):
        score[i][0] = -gap * i
        move[i][0] = 2
    for j in range(1, m + 1):
        score[0][j] = -gap * 0.5 * j            # extra heard words (ad-libs, the other rappers) cost less
        move[0][j] = 3
    for i in range(1, n + 1):
        a = lyric[i - 1]
        for j in range(1, m + 1):
            s = similar(a, heard[j - 1])
            best, how = score[i - 1][j - 1] + (2 * s - 1), 1
            if score[i - 1][j] - gap > best:
                best, how = score[i - 1][j] - gap, 2
            if score[i][j - 1] - gap * 0.5 > best:
                best, how = score[i][j - 1] - gap * 0.5, 3
            score[i][j], move[i][j] = best, how
    pairs, i, j = {}, n, m
    while i > 0 or j > 0:
        how = move[i][j]
        if how == 1:
            if similar(lyric[i - 1], heard[j - 1]) >= 0.6:
                pairs[i - 1] = j - 1
            i, j = i - 1, j - 1
        elif how == 2:
            i -= 1
        else:
            j -= 1
    return pairs


def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    clip, lyrics_file, out = args[0], args[1], args[2]
    model_name = sys.argv[sys.argv.index('--model') + 1] if '--model' in sys.argv else 'large-v3'
    cpu = '--cpu' in sys.argv
    if not cpu:
        gpu_libraries()
    from faster_whisper import WhisperModel

    with open(lyrics_file, encoding='utf-8') as f:
        lines = [l.strip() for l in f.read().replace('\r\n', '\n').split('\n')]
    lines = [l for l in lines if l]
    words, word_line = [], []
    for li, line in enumerate(lines):
        for w in line.split():
            nw = norm(w)
            if nw:
                words.append(nw)
                word_line.append(li)

    model = WhisperModel(model_name, device='cpu' if cpu else 'cuda', compute_type='int8' if cpu else 'float16')
    # the start of the lyrics as a hint: names and slang are spelled the way we write them
    prompt = ' '.join(lines[:6])[:220]
    segments, _ = model.transcribe(clip, language='cs', word_timestamps=True, initial_prompt=prompt,
                                   condition_on_previous_text=False, vad_filter=False, beam_size=5)
    heard = []
    for seg in segments:
        for w in seg.words or []:
            nw = norm(w.word)
            if nw:
                heard.append((nw, w.start, w.end))

    pairs = align(words, [h[0] for h in heard])

    # each line: from its first heard word to its last
    times = [None] * len(lines)
    for wi, hj in sorted(pairs.items()):
        li = word_line[wi]
        s, e = heard[hj][1], heard[hj][2]
        if times[li] is None:
            times[li] = [s, e]
        else:
            times[li][1] = max(times[li][1], e)
    # lines nobody heard: spread them between their neighbours by length
    i = 0
    while i < len(lines):
        if times[i] is not None:
            i += 1
            continue
        j = i
        while j < len(lines) and times[j] is None:
            j += 1
        start = times[i - 1][1] if i > 0 else (times[j][0] - 3.0 * (j - i) if j < len(lines) else 0.0)
        end = times[j][0] if j < len(lines) else start + 3.0 * (j - i)
        start = max(0.0, start)
        total = sum(len(lines[k]) for k in range(i, j)) or 1
        t = start
        for k in range(i, j):
            d = (end - start) * len(lines[k]) / total
            times[k] = [t, t + d]
            t += d
        i = j
    # a line never runs into the next one, and never lasts less than a moment
    for k in range(len(times)):
        if k + 1 < len(times):
            times[k][1] = min(times[k][1], times[k + 1][0])
        times[k][1] = max(times[k][1], times[k][0] + 0.4)
        times[k] = [round(times[k][0], 2), round(times[k][1], 2)]

    matched = round(len(pairs) / max(1, len(words)), 2)
    with open(out, 'w', encoding='utf-8') as f:
        json.dump({'lines': len(lines), 'matched': matched, 'times': times}, f)
    print(f'{os.path.basename(out)}: {len(lines)} lines, {matched:.0%} of the words heard, {len(heard)} words transcribed')


if __name__ == '__main__':
    main()
