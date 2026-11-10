"""Ostré náhledy pro karty Diskografie (music.jsp): z každého klipu vybere nejlepší snímek s člověkem,
ořízne ho na výšku 3:4 tak, aby byl člověk uprostřed (ne jen kousek u kraje), zvětší ho Real-ESRGAN
(když je klip v malém rozlišení) a uloží src/main/webapp/img/disco/<youtube id>.webp (600×800).

Dřív karta brala náhled z YouTube 320×180 a roztáhla ho do vysoké karty – rozmazané a uříznuté postavy.

  python tools/disco-nahledy.py --model <yunet.onnx> --esrgan <složka realesrgan> <složka s klipy> […]

Seznam klipů = všechny klipy přiřazené k písni (stejně jako Diskografie); bere se z lokální DB přes mysql.exe
(proměnná MYSQL, výchozí C:/xampp/mysql/bin/mysql.exe). Obličeje hledá YuNet (OpenCV), když v klipu žádný
není, vezme postavu (HOG detektor), a když ani tu, nejostřejší dost světlý snímek a ořízne střed.
"""
import argparse, os, subprocess, sys, tempfile
import cv2
import numpy as np

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
OUT = os.path.join(ROOT, 'src', 'main', 'webapp', 'img', 'disco')
W, H = 600, 800
ALIAS = {'riRijruWINY': 'Skeli - Ganja.mp4'}   # klipy, které nemají id v názvu souboru


def clip_ids():
    mysql = os.environ.get('MYSQL', 'C:/xampp/mysql/bin/mysql.exe')
    out = subprocess.run([mysql, '-uSkeli', '-pskeli', 'skeliweb', '-N', '-e',
                          'SELECT DISTINCT youtube_id FROM videos WHERE song_id IS NOT NULL'],
                         capture_output=True, text=True, check=True).stdout
    return [x.strip() for x in out.splitlines() if x.strip()]


def find_clip(dirs, vid):
    for d in dirs:
        try:
            names = os.listdir(d)
        except OSError:
            continue
        for n in names:
            p = os.path.join(d, n)
            if (n.startswith(vid) or n == ALIAS.get(vid)) and n.endswith('.mp4') and os.path.getsize(p) > 100000:
                return p
    return None


def content_rows(frame):
    """Řádky obrazu bez zapečených černých pruhů nahoře a dole."""
    m = frame.mean(axis=(1, 2))
    rows = np.where(m > 14)[0]
    if len(rows) < frame.shape[0] * 0.4:
        return 0, frame.shape[0]
    return int(rows[0]), int(rows[-1]) + 1


def best_frame(path, det, hog):
    cap = cv2.VideoCapture(path)
    n = int(cap.get(cv2.CAP_PROP_FRAME_COUNT)) or 1
    best = None   # (skóre, snímek, střed x, druh)
    for k in range(60):
        cap.set(cv2.CAP_PROP_POS_FRAMES, int(n * (0.06 + 0.88 * k / 59)))
        ok, f = cap.read()
        if not ok:
            continue
        y0, y1 = content_rows(f)
        f = f[y0:y1]
        h, w = f.shape[:2]
        gray = cv2.cvtColor(f, cv2.COLOR_BGR2GRAY)
        bright = gray.mean()
        if bright < 25 or bright > 225:
            continue
        sharp = cv2.Laplacian(gray, cv2.CV_64F).var()
        sc = 640 / w
        small = cv2.resize(f, (640, int(h * sc)))
        det.setInputSize((small.shape[1], small.shape[0]))
        _, faces = det.detect(small)
        if faces is not None and len(faces):
            # největší obličej; skóre = velikost × jistota × ostrost
            fx, fy, fw, fh, conf = max(((x[0], x[1], x[2], x[3], x[-1]) for x in faces), key=lambda a: a[2] * a[3])
            area = (fw * fh) / (small.shape[0] * small.shape[1])
            x0, y0f = int(fx / sc), int(fy / sc)
            face_sharp = cv2.Laplacian(gray[max(0, y0f):y0f + int(fh / sc), max(0, x0):x0 + int(fw / sc)], cv2.CV_64F).var()
            s = 10 + (area ** 0.6) * conf * min(1.0, face_sharp / 200.0) * 100
            cand = (s, f, (fx + fw / 2) / sc, 'obličej')
        else:
            rects = hog.detectMultiScale(small, winStride=(8, 8))[0] if hog is not None else []
            if len(rects):
                x, y, rw, rh = max(rects, key=lambda r: r[2] * r[3])
                cand = (5 + min(1.0, sharp / 300.0), f, (x + rw / 2) / sc, 'postava')
            else:
                cand = (min(1.0, sharp / 300.0), f, w / 2, 'střed')
        if best is None or cand[0] > best[0]:
            best = cand
    cap.release()
    return best


def upscale(img, esrgan):
    """Real-ESRGAN ×4 (jen když je ořez menší než výsledek), pak přesně na 600×800."""
    if img.shape[0] >= H or not esrgan:
        return cv2.resize(img, (W, H), interpolation=cv2.INTER_AREA)
    with tempfile.TemporaryDirectory() as tmp:
        src, dst = os.path.join(tmp, 'in.png'), os.path.join(tmp, 'out.png')
        cv2.imwrite(src, img)
        subprocess.run([os.path.join(esrgan, 'realesrgan-ncnn-vulkan.exe'), '-i', src, '-o', dst, '-n', 'realesrgan-x4plus',
                        '-m', os.path.join(esrgan, 'models')], capture_output=True, check=True)
        big = cv2.imread(dst)
    return cv2.resize(big, (W, H), interpolation=cv2.INTER_AREA)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--model', required=True)
    ap.add_argument('--esrgan')
    ap.add_argument('--only', help='jen tyhle klipy (čárkou)')
    ap.add_argument('dirs', nargs='+')
    a = ap.parse_args()
    os.makedirs(OUT, exist_ok=True)
    det = cv2.FaceDetectorYN.create(a.model, '', (320, 320), 0.7)
    hog = None   # detektor postav (HOG) jen když ho OpenCV má – verze 5 ho v základu nemá
    if hasattr(cv2, 'HOGDescriptor'):
        hog = cv2.HOGDescriptor()
        hog.setSVMDetector(cv2.HOGDescriptor_getDefaultPeopleDetector())
    ids = a.only.split(',') if a.only else clip_ids()
    missing = []
    for vid in ids:
        path = find_clip(a.dirs, vid)
        if not path:
            missing.append(vid)
            continue
        best = best_frame(path, det, hog)
        if best is None:
            missing.append(vid)
            continue
        _, f, cx, kind = best
        h, w = f.shape[:2]
        cw = int(h * 3 / 4)
        x0 = int(min(max(cx - cw / 2, 0), w - cw))
        crop = f[:, x0:x0 + cw]
        out = upscale(crop, a.esrgan)
        cv2.imwrite(os.path.join(OUT, vid + '.webp'), out, [cv2.IMWRITE_WEBP_QUALITY, 82])
        print(vid, kind, f'{w}x{h}', os.path.getsize(os.path.join(OUT, vid + '.webp')) // 1024, 'kB', flush=True)
    if missing:
        print('chybí klip:', ', '.join(missing))


if __name__ == '__main__':
    sys.exit(main())
