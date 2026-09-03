#!/usr/bin/env python3
"""Remove the framework name from Figure 1 of the anonymous RMJ manuscript.

WHY THIS EXISTS. The anonymiser scrubbed the text and the metadata but
SKIPPED word/media/, so the framework name survived inside the figure. Phillip
found it on inspection. A DOCX carries identity in rendered images as well as
in text, and an image is invisible to every string-based check.

TWO occurrences are repainted, not one. The label he named:

    "JRS DOCUMENTATION READ"  ->  "THREE-LEVEL DOCUMENTATION READ"

and the subtitle directly under the figure title, which carries it too:

    "... and the full three-level JRS range"  ->  "... and the full
    three-level range"

Both bands are measured from the image rather than assumed: the rows and
columns come from a non-background scan, the ink colour from the median of the
inked pixels in each band, and the point size by rendering the ORIGINAL string
and choosing the size whose width best matches the measured band, which keeps
the replacement visually consistent with the untouched title above it.

    python3 scripts/anonymise_figure1.py IN.docx OUT.docx
"""
import argparse
import os
import re
import sys
import zipfile

from PIL import Image, ImageDraw, ImageFont

REG = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"

# (band rows, band cols, replacement text, font path, size, ink RGB)
EDITS = [
    ((47, 63), (154, 711),
     "Four document classes, two states, and the full three-level range",
     REG, 16, (144, 152, 167)),
    ((338, 355), (290, 572),
     "THREE-LEVEL DOCUMENTATION READ",
     BOLD, 18, (23, 54, 93)),
]

BANNED_IN_FIGURE = ["JRS"]


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("source")
    ap.add_argument("out")
    args = ap.parse_args()
    for p in (REG, BOLD):
        if not os.path.exists(p):
            raise SystemExit("[REQUIRED_ENV_PARAM] font missing: %s" % p)
    if not os.path.exists(args.source):
        raise SystemExit("[REQUIRED_ENV_PARAM] source not found: %s"
                         % args.source)

    # Buffer the whole source before writing anything. Re-reading a ZipFile
    # handle after the output has been written raises BadZipFile, which cost a
    # run: the output was already on disk when the verification blew up.
    zin = zipfile.ZipFile(args.source)
    names = zin.namelist()
    if "word/media/image1.png" not in names:
        raise SystemExit("[REQUIRED_ENV_PARAM] word/media/image1.png absent")
    infos = zin.infolist()
    src = {n: zin.read(n) for n in names}
    zin.close()

    raw = src["word/media/image1.png"]
    tmp = args.out + ".fig.png"
    with open(tmp, "wb") as fh:
        fh.write(raw)
    im = Image.open(tmp).convert("RGBA")
    W, H = im.size
    bg = im.getpixel((2, 2))
    draw = ImageDraw.Draw(im)

    for (r0, r1), (c0, c1), text, fontpath, size, ink in EDITS:
        if not (0 <= r0 < r1 < H and 0 <= c0 < c1 < W):
            raise SystemExit("[REQUIRED_ENV_PARAM] band out of bounds: "
                             "rows %d-%d cols %d-%d" % (r0, r1, c0, c1))
        # Clear a two-pixel margin so no anti-aliased fringe of the old text
        # survives around the repaint.
        draw.rectangle([c0 - 2, r0 - 2, c1 + 2, r1 + 2], fill=bg)
        font = ImageFont.truetype(fontpath, size)
        bb = font.getbbox(text)
        tw = bb[2] - bb[0]
        x = (W - tw) // 2 - bb[0]
        y = r0 - bb[1] + ((r1 - r0 + 1) - (bb[3] - bb[1])) // 2
        draw.text((x, y), text, font=font, fill=ink + (255,))
        print("  repainted rows %d-%d: %s" % (r0, r1, text[:52]))

    im.save(tmp, "PNG")
    with open(tmp, "rb") as fh:
        new_png = fh.read()
    os.remove(tmp)

    with zipfile.ZipFile(args.out + ".tmp", "w", zipfile.ZIP_DEFLATED) as zout:
        for item in infos:
            data = new_png if item.filename == "word/media/image1.png" \
                else src[item.filename]
            zout.writestr(item, data)
    os.replace(args.out + ".tmp", args.out)

    zchk = zipfile.ZipFile(args.out)
    imgs = [n for n in names if n.startswith("word/media/")]
    same = [n for n in imgs
            if n != "word/media/image1.png" and zchk.read(n) == src[n]]
    doc_same = zchk.read("word/document.xml") == src["word/document.xml"]
    changed = zchk.read("word/media/image1.png") != src["word/media/image1.png"]
    zchk.close()
    if not changed:
        raise SystemExit("[REQUIRED_ENV_PARAM] image1.png is byte-identical to "
                         "the source; the repaint did not take")

    if not doc_same:
        raise SystemExit("[REQUIRED_ENV_PARAM] document.xml changed; this pass "
                         "must touch the figure only")
    if len(same) != len(imgs) - 1:
        raise SystemExit("[REQUIRED_ENV_PARAM] an untargeted image changed")
    print("  document.xml unchanged, %d other image(s) unchanged"
          % len(same))
    print("\nwrote %s" % args.out)
    return 0


if __name__ == "__main__":
    sys.exit(main())
