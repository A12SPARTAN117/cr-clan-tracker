"""Trims the site's two variable fonts (pip install fonttools brotli; python scripts/trim-fonts.py <dir>).

<dir> holds the per-script woff2 files Google Fonts serves for JetBrains Mono and Space Grotesk
(what next/font/google downloaded into .next/static/media) and the CSS that names them. Each one
is written to src/app/fonts/ with:
  - JetBrains Mono's coding ligatures and fractions dropped (the site shows numbers and names, not
    code): its Latin file goes from 40 KB to 15 KB.
  - JetBrains Mono's weights below 400 dropped; nothing on the site is lighter.
  - hinting dropped (browsers on high-DPI screens ignore it).
Glyph coverage is unchanged, so names in any script render as before.
"""

import io
import re
import sys
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

FAMILIES = {
    'JetBrains Mono': {'slug': 'mono', 'wght': (400, 800), 'features': ['ccmp', 'locl', 'mark', 'mkmk']},
    'Space Grotesk': {'slug': 'sans', 'wght': (300, 700), 'features': ['ccmp', 'locl', 'mark', 'mkmk', 'kern', 'liga', 'tnum', 'pnum', 'case']},
}

# Google's script subsets, recognised by the first code points of their unicode-range.
SUBSETS = [
    ('U+460-52F', 'cyrillic-ext'),
    ('U+301,U+400-45F', 'cyrillic'),
    ('U+370-377', 'greek'),
    ('U+102-103', 'vietnamese'),
    ('U+100-2BA', 'latin-ext'),
    ('U+??', 'latin'),
]


def trim(path: Path, wght, features) -> bytes:
    font = TTFont(path, lazy=False)
    opts = subset.Options()
    opts.flavor = 'woff2'
    opts.layout_features = features
    opts.hinting = False
    opts.desubroutinize = True
    opts.notdef_outline = False
    opts.name_IDs = [1, 2, 3, 4, 6]
    s = subset.Subsetter(opts)
    s.populate(unicodes=set(font.getBestCmap().keys()))
    s.subset(font)
    if 'fvar' in font:
        font = instancer.instantiateVariableFont(font, {'wght': wght})
    font.flavor = 'woff2'
    out = io.BytesIO()
    font.save(out)
    return out.getvalue()


def main(src: Path):
    out_dir = Path(__file__).resolve().parent.parent / 'src' / 'app' / 'fonts'
    out_dir.mkdir(exist_ok=True)
    css = '\n'.join(p.read_text(encoding='utf8') for p in src.glob('*.css'))
    for face in re.findall(r'@font-face\{[^}]*\}', css):
        family = re.search(r'font-family:([^;]+);', face).group(1).strip().strip('"')
        file = re.search(r'url\([^)]*?([^/)]+\.woff2)\)', face)
        rng = re.search(r'unicode-range:([^;}]+)', face)
        if family not in FAMILIES or not file or not rng:
            continue
        name = next((n for prefix, n in SUBSETS if rng.group(1).startswith(prefix)), None)
        if not name:
            sys.exit(f'unknown subset for {family}: {rng.group(1)[:40]}')
        f = FAMILIES[family]
        data = trim(src / file.group(1), f['wght'], f['features'])
        (out_dir / f"{f['slug']}-{name}.woff2").write_bytes(data)
        print(f"{f['slug']}-{name}.woff2 {(src / file.group(1)).stat().st_size} -> {len(data)}  {rng.group(1)}")


if __name__ == '__main__':
    main(Path(sys.argv[1]))
