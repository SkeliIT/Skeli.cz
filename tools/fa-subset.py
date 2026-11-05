#!/usr/bin/env python3
# Zmenší písma ikon Font Awesome jen na ikony, které web opravdu používá (z 295 kB na pár desítek).
# Web pak při první návštěvě stahuje o hodně méně, hlavně na telefonu.
#
# Přidal jsi novou ikonu a test IconFontTest hlásí, že chybí? Spusť z kořene projektu:
#     pip install fonttools brotli
#     python tools/fa-subset.py
# Plná písma (.ttf) zůstávají v repozitáři, z nich se .woff2 vždy znovu vyrobí.
import pathlib
import re
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
FA = ROOT / "src/main/webapp/vendor/fontawesome"
LIST = FA / "subset-icons.txt"
EXT = {".jsp", ".jspf", ".tag", ".js", ".mjs", ".java", ".css", ".json", ".properties", ".html", ".xml"}
SKIP = re.compile(r"[\\/](vendor|uploads|eq|karaoke)[\\/]")
# ikony skládané za běhu („fa-“ + podmínka), v kódu nejsou celým jménem
DYNAMIC = {"fa-check", "fa-hand-pointer", "fa-play", "fa-heart", "fa-thumbs-up", "fa-thumbs-down"}


def used_tokens():
    tokens = set(DYNAMIC)
    for f in (ROOT / "src/main").rglob("*"):
        if f.suffix in EXT and f.is_file() and not SKIP.search(str(f)):
            tokens.update(re.findall(r"\bfa-[a-z0-9-]+", f.read_text("utf-8", errors="ignore")))
    return tokens


def name_to_codepoint():
    css = (FA / "css/all.min.css").read_text("utf-8")
    out = {}
    for selectors, cp in re.findall(r'((?:\.fa-[a-z0-9-]+(?::before|:after)?,?)+)\{(?:content|--fa):"\\([0-9a-f]+)"', css):
        for name in re.findall(r"\.fa-([a-z0-9-]+)", selectors):
            out["fa-" + name] = cp
    return out


def main():
    names = name_to_codepoint()
    used = sorted(t for t in used_tokens() if t in names)
    cps = {names[t] for t in used}
    # ikony přímo v CSS: content: "\f023"
    for f in (ROOT / "src/main/webapp/css").glob("*.css"):
        cps.update(re.findall(r'content:\s*"\\(f[0-9a-f]{3})"', f.read_text("utf-8")))
    cps = sorted(cps)
    LIST.write_text("\n".join(cps) + "\n", "utf-8", newline="\n")
    for font in ("fa-solid-900", "fa-brands-400", "fa-regular-400"):
        src, dst = FA / f"webfonts/{font}.ttf", FA / f"webfonts/{font}.woff2"
        subprocess.check_call([sys.executable, "-m", "fontTools.subset", str(src), "--unicodes=" + ",".join(cps),
                               "--flavor=woff2", "--layout-features=*", "--no-hinting", f"--output-file={dst}"])
        print(f"{font}: {dst.stat().st_size} B")
    print(f"ikon: {len(used)}, znaků: {len(cps)}")


if __name__ == "__main__":
    main()
