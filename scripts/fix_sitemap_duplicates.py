#!/usr/bin/env python3
"""Remove duplicate <url> entries from sitemap.xml.

FINDING (verified 2026-08-22): sitemap.xml declares 67 <loc> values that resolve to 42
distinct files. 25 files carry more than one entry, and 24 of those are byte-identical
duplicate URLs (the same absolute URL listed twice), not extensionless variants.

Canonical tags are present and correct on the affected pages, so the ranking harm is
limited. A duplicated sitemap is still a crawl-budget waste and reads as unmaintained to
anyone auditing the site.

Keeps the FIRST occurrence of each <loc> and preserves its surrounding <url> block intact,
including lastmod, changefreq and priority.

Idempotent. Run with --check to test without writing.

Usage:
    python3 scripts/fix_sitemap_duplicates.py --check
    python3 scripts/fix_sitemap_duplicates.py
"""

import argparse
import os
import re
import subprocess
import sys

URL_BLOCK = re.compile(r'[ \t]*<url>.*?</url>\s*\n', re.S | re.I)
LOC = re.compile(r'<loc>\s*([^<]+?)\s*</loc>', re.I)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--check', action='store_true', help='report without writing')
    args = ap.parse_args()

    root = subprocess.check_output(
        ['git', 'rev-parse', '--show-toplevel'], text=True).strip()
    path = os.path.join(root, 'sitemap.xml')
    if not os.path.exists(path):
        print('FATAL: sitemap.xml not found', file=sys.stderr)
        return 2

    with open(path, encoding='utf-8') as fh:
        body = fh.read()

    blocks = URL_BLOCK.findall(body)
    if not blocks:
        print('FATAL: no <url> blocks parsed. Check the sitemap format before running.',
              file=sys.stderr)
        return 3

    seen, keep, dropped = set(), [], []
    for b in blocks:
        m = LOC.search(b)
        if not m:
            keep.append(b)
            continue
        loc = m.group(1).strip()
        if loc in seen:
            dropped.append(loc)
            continue
        seen.add(loc)
        keep.append(b)

    if not dropped:
        print('PASS  no duplicate <loc> values (%d unique urls)' % len(seen))
        return 0

    if args.check:
        print('WOULD REMOVE %d duplicate <url> block(s), leaving %d unique:'
              % (len(dropped), len(seen)))
        for d in dropped:
            print('  %s' % d)
        print('NOT WRITTEN (--check)')
        return 0

    new = body
    for b in blocks:
        new = new.replace(b, '', 1)
    anchor = '</urlset>'
    if anchor not in new:
        print('FATAL: </urlset> not found; refusing to rewrite', file=sys.stderr)
        return 4
    new = new.replace(anchor, ''.join(keep) + anchor, 1)
    new = re.sub(r'\n{3,}', '\n\n', new)

    after = LOC.findall(new)
    if len(after) != len(seen):
        print('FATAL: post-write count %d != expected %d. Nothing written.'
              % (len(after), len(seen)), file=sys.stderr)
        return 5

    with open(path, 'w', encoding='utf-8') as fh:
        fh.write(new)
    print('WROTE sitemap.xml: %d urls -> %d urls (%d duplicates removed)'
          % (len(blocks), len(seen), len(dropped)))
    print('NOT DEPLOYED. This is a live-site file.')
    return 0


if __name__ == '__main__':
    sys.exit(main())
