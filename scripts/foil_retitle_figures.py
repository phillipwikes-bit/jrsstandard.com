#!/usr/bin/env python3
"""Repaint only the title and subtitle text of two chart PNGs, in place.

WHY REPAINT AND NOT REBUILD. The three visuals in the FOIL manuscript are
raster PNGs, so the chart titles and subtitles are pixels, not text. The
production brief asks for specific title and subtitle wording and at the same
time says not to redesign the visuals, not to reduce visual quality and not to
change any data. Rebuilding the charts would satisfy the wording and violate
the rest: matplotlib is not even installed here, so a rebuild would be a
reimplementation from scratch, which is a redesign by another name.

Repainting changes only the pixels occupied by the text being replaced. Every
bar, axis, gridline, label, legend and footnote is byte-preserved.

THE BANDS ARE MEASURED, NOT GUESSED. Each entry below records the ink rows the
original text occupies, the horizontal centre it is centred on, and an x floor
where another element sits close enough to be clipped. image3's subtitle band
runs into the top of the y-axis label "20.0" at x < 100, so that column range
is excluded from the repaint rather than the band being trimmed and the
descenders left behind.

FONT SIZES ARE CALIBRATED AGAINST THE ORIGINAL STRINGS. Each size was chosen by
rendering the original text and matching its ink width to the measured width,
so the replacement sits at the same optical weight as what it replaces.

    python3 scripts/foil_retitle_figures.py --check
    python3 scripts/foil_retitle_figures.py --apply
"""
import argparse
import os
import sys

from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WORK = os.path.join(ROOT, "research", "foil_production_2026-09-01")
BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
REG = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"

# image, band rows (inclusive), centre x, x floor, font, size, colour, new text
JOBS = [
    {
        "image": "image2.png",
        "what": "subtitle",
        "rows": (26, 44),
        "centre": 537,
        "x_floor": 0,
        "font": REG,
        "size": 16,
        "colour": (110, 120, 140),
        "old": "Ready and Needs work appear across appellate outcomes; "
               "Gap is concentrated in audits",
        "new": "Ready and Needs work appear across case outcomes; "
               "Gap is concentrated in compliance audits",
    },
    {
        "image": "image3.png",
        "what": "title",
        "rows": (0, 20),
        "centre": 439,
        "x_floor": 0,
        "font": BOLD,
        "size": 20,
        "colour": (23, 54, 93),
        "old": "JRS Read Distribution by Publication or Document Type",
        "new": "Documentation Read Distribution by Source Type",
    },
    {
        "image": "image3.png",
        "what": "subtitle",
        "rows": (21, 33),
        "centre": 439,
        # The y-axis label "20.0" begins at x 24 and its glyph tops reach into
        # rows 32-33. Everything left of this floor is left untouched.
        "x_floor": 100,
        "font": REG,
        "size": 12,
        "colour": (110, 120, 140),
        "old": "Counts combine the document-class totals and class-specific "
               "Ready rates reported in Sections 4.3 and 5.4",
        "new": "Distribution of Ready, Needs work, and Gap reads across the "
               "four source classes in the 32-case corpus.",
    },
]


def ink_bbox(img):
    """Bounding box of non-near-white pixels."""
    g = img.convert("L")
    w, h = g.size
    px = g.load()
    xs, ys = [], []
    for y in range(h):
        for x in range(w):
            if px[x, y] < 235:
                xs.append(x)
                ys.append(y)
    if not xs:
        return None
    return (min(xs), min(ys), max(xs), max(ys))


def render(text, font_path, size, colour):
    f = ImageFont.truetype(font_path, size)
    pad = 40
    probe = Image.new("RGB", (3000, 200), "white")
    ImageDraw.Draw(probe).text((pad, pad), text, font=f, fill=colour)
    bb = ink_bbox(probe)
    if bb is None:
        raise SystemExit("[REQUIRED_ENV_PARAM] rendered no ink for %r" % text)
    return probe.crop(bb)


def run(apply_changes):
    problems, notes = [], []
    for job in JOBS:
        path = os.path.join(WORK, job["image"])
        if not os.path.exists(path):
            problems.append("missing %s" % job["image"])
            continue
        im = Image.open(path).convert("RGB")
        w, h = im.size
        r0, r1 = job["rows"]
        if r1 >= h:
            problems.append("%s band %d-%d exceeds height %d"
                            % (job["image"], r0, r1, h))
            continue

        strip = render(job["new"], job["font"], job["size"], job["colour"])
        sw, sh = strip.size
        if sh > (r1 - r0 + 1):
            problems.append("%s %s: new text is %dpx tall, band is %dpx"
                            % (job["image"], job["what"], sh, r1 - r0 + 1))
        left = job["centre"] - sw // 2
        if left < job["x_floor"]:
            problems.append("%s %s: new text would start at x=%d, inside the "
                            "protected margin x<%d"
                            % (job["image"], job["what"], left, job["x_floor"]))
        notes.append("%s %s: %dpx wide, %dpx tall, x %d..%d, rows %d..%d"
                     % (job["image"], job["what"], sw, sh, left, left + sw,
                        r0, r0 + sh))

        if apply_changes and not problems:
            d = ImageDraw.Draw(im)
            d.rectangle([job["x_floor"], r0, w - 1, r1], fill=(255, 255, 255))
            im.paste(strip, (left, r0))
            im.save(path)

    for n in notes:
        print("  " + n)
    if problems:
        print()
        for p in problems:
            print("FAIL  " + p)
        return 1
    print()
    print("APPLIED" if apply_changes else "CHECK ONLY, nothing written")
    return 0


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--apply", action="store_true")
    ap.add_argument("--check", action="store_true")
    a = ap.parse_args()
    if not (a.apply or a.check):
        ap.error("pass --check or --apply")
    return run(a.apply)


if __name__ == "__main__":
    sys.exit(main())
