#!/usr/bin/env python3
"""Exhaustive recursive inventory of the jrsstandard.com repository and website.

Enumerates every tracked file, classifies it, builds the internal link graph from
every HTML page, cross-references against sitemap.xml and robots.txt, identifies
orphaned and unlinked assets, and optionally verifies live reachability.

Usage:
    python3 scripts/site_inventory.py                     # repo-only inventory
    python3 scripts/site_inventory.py --live              # + HTTP status per route
    python3 scripts/site_inventory.py --out FILE.md       # write markdown deliverable

Exit codes:
    0  inventory produced
    2  repository root not found / git unavailable
"""

import argparse
import json
import os
import re
import subprocess
import sys
import urllib.error
import urllib.request
from collections import defaultdict

HOST = 'https://www.jrsstandard.com'

# Surfaces that are unlinked BY DESIGN. CLAUDE.md: "never link them from a public
# page". Appearing in the orphan list would be a false positive, so they are
# classified separately and the reason is carried with them.
INTENTIONALLY_UNLINKED = {
    'programme-status-9872fb93cc94.html':
        'Private owner page. Opaque slug, noindex/nofollow, no analytics tag. CLAUDE.md platform map.',
    'acquisition-9f3c2a7d4b.html':
        'Buyer-facing sale page. Opaque slug, deliberately not in public navigation.',
    'vp-7c1f9a4e8d2b6035.html':
        'Vendor integration preview. Opaque slug.',
    'vp-7c1f9a4e8d2b6035.htm':
        'Vendor integration preview, .htm duplicate of the .html route.',
    '404.html':
        'Error document. Served by the host on 404, never linked.',
}

# Directory trees that are private and NOT deployed to main.
PRIVATE_TREES = ('research/',)

CATEGORY_RULES = [
    ('api/',        'Server-Side Endpoint (Vercel Edge Function)'),
    ('supabase/',   'Database / Edge Function Source'),
    ('scripts/',    'Build, Audit and Guard Script'),
    ('research/',   'Private Research Corpus (NOT DEPLOYED)'),
    ('reference/',  'Reference Library Page'),
    ('reviewer/',   'Reviewer Surface'),
    ('templates/',  'Template'),
    ('content/',    'Content Source'),
    ('.github/',    'CI Workflow'),
    ('.claude/',    'Agent Configuration'),
]

EXT_CATEGORY = {
    '.html': 'Webpage',
    '.htm':  'Webpage',
    '.md':   'Markdown Document',
    '.pdf':  'PDF Document',
    '.docx': 'Word Document',
    '.png':  'Image Asset',
    '.svg':  'Image Asset',
    '.jpg':  'Image Asset',
    '.jpeg': 'Image Asset',
    '.gif':  'Image Asset',
    '.ico':  'Image Asset',
    '.json': 'Data / Config',
    '.xml':  'Metadata / SEO',
    '.txt':  'Metadata / SEO',
    '.sql':  'Database Schema',
    '.js':   'JavaScript',
    '.py':   'Python Script',
    '.sh':   'Shell Script',
    '.yml':  'CI Workflow',
    '.yaml': 'CI Workflow',
    '.css':  'Stylesheet',
}

KEYED_SURFACE_RE = re.compile(
    r'''URLSearchParams|searchParams\.get\s*\(\s*["'](?:k|code|c|key|src)["']''', re.I)

HREF_RE = re.compile(
    r'''(?<![\w.-])(?:href|src|action|srcset|poster|data-href)\s*=\s*["']([^"'>]+)["']''',
    re.I)
# Only meta/link tags that actually carry a URL. Plain `content="width=device-width"`
# and JS `el.textContent = '...'` must never be read as references.
META_URL_RE = re.compile(
    r'''<(?:meta|link)\b[^>]*?(?:property|name|rel)\s*=\s*["'][^"']*'''
    r'''(?:og:image|og:url|twitter:image|canonical|icon|manifest)[^"']*["'][^>]*?'''
    r'''(?:content|href)\s*=\s*["']([^"'>]+)["']''', re.I)
LOC_RE = re.compile(r'<loc>\s*([^<]+?)\s*</loc>', re.I)
TITLE_RE = re.compile(r'<title[^>]*>(.*?)</title>', re.I | re.S)


def git_files(root):
    try:
        out = subprocess.check_output(['git', '-C', root, 'ls-files'], text=True)
    except (subprocess.CalledProcessError, FileNotFoundError):
        return None
    return sorted(p for p in out.splitlines() if p)


def categorize(path):
    for prefix, label in CATEGORY_RULES:
        if path.startswith(prefix):
            ext = os.path.splitext(path)[1].lower()
            if prefix in ('reference/', 'reviewer/') and ext in ('.html', '.htm'):
                return label
            if prefix == 'research/':
                return label
            if ext in EXT_CATEGORY and prefix in ('templates/', 'content/'):
                return label
            return label
    ext = os.path.splitext(path)[1].lower()
    return EXT_CATEGORY.get(ext, 'Other')


def page_title(root, path):
    try:
        with open(os.path.join(root, path), encoding='utf-8', errors='replace') as fh:
            head = fh.read(16384)
    except OSError:
        return ''
    m = TITLE_RE.search(head)
    if not m:
        return ''
    return re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', '', m.group(1))).strip()


def normalize_ref(ref, from_path):
    """Reduce an href/src to a repo-relative path, or None if external/non-routable."""
    ref = ref.strip()
    if not ref:
        return None
    low = ref.lower()
    for scheme in ('http://', 'https://', 'mailto:', 'tel:', 'javascript:', 'data:', '#'):
        if low.startswith(scheme):
            if low.startswith(('http://', 'https://')):
                for h in ('https://www.jrsstandard.com', 'https://jrsstandard.com',
                          'http://www.jrsstandard.com', 'http://jrsstandard.com'):
                    if low.startswith(h.lower()):
                        ref = ref[len(h):] or '/'
                        break
                else:
                    return None
            else:
                return None
    ref = ref.split('#', 1)[0].split('?', 1)[0]
    if not ref:
        return None
    if ref.startswith('/'):
        cand = ref.lstrip('/')
    else:
        cand = os.path.normpath(os.path.join(os.path.dirname(from_path), ref))
    if cand in ('', '.'):
        return 'index.html'
    if cand.endswith('/'):
        cand = cand + 'index.html'
    return cand


def resolve(cand, tracked):
    """Map a normalized reference onto a tracked file, honouring extensionless routes."""
    for probe in (cand, cand + '.html', cand + '.htm',
                  os.path.join(cand, 'index.html')):
        if probe in tracked:
            return probe
    return None


def live_status(url, timeout=12):
    req = urllib.request.Request(url, method='GET',
                                 headers={'User-Agent': 'jrs-inventory/1.0'})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return resp.status
    except urllib.error.HTTPError as exc:
        return exc.code
    except Exception as exc:                                   # noqa: BLE001
        return 'ERR:' + type(exc).__name__


def build(root, do_live):
    tracked = git_files(root)
    if tracked is None:
        print('FATAL: git unavailable or not a repository', file=sys.stderr)
        sys.exit(2)
    tracked_set = set(tracked)

    html = [p for p in tracked if p.lower().endswith(('.html', '.htm'))
            and not p.startswith(PRIVATE_TREES)]

    # ---- link graph -------------------------------------------------------
    inbound = defaultdict(set)
    outbound = defaultdict(set)
    broken = []
    for src in html:
        try:
            with open(os.path.join(root, src), encoding='utf-8', errors='replace') as fh:
                body = fh.read()
        except OSError:
            continue
        for raw in HREF_RE.findall(body) + META_URL_RE.findall(body):
            cand = normalize_ref(raw, src)
            if cand is None:
                continue
            hit = resolve(cand, tracked_set)
            if hit:
                outbound[src].add(hit)
                if hit != src:
                    inbound[hit].add(src)
            elif not cand.startswith('api/') and '.' in os.path.basename(cand):
                broken.append((src, raw))

    # ---- asset references by basename, plus the /api/dl proxy map ----------
    asset_exts = ('.pdf', '.png', '.svg', '.jpg', '.jpeg', '.gif', '.ico', '.json')
    assets = [q for q in tracked
              if os.path.splitext(q)[1].lower() in asset_exts
              and not q.startswith(PRIVATE_TREES)]
    bodies = {}
    for src in html:
        try:
            with open(os.path.join(root, src), encoding='utf-8', errors='replace') as fh:
                bodies[src] = fh.read()
        except OSError:
            bodies[src] = ''
    dl_map = ''
    dl_path = os.path.join(root, 'api', 'dl.js')
    if os.path.exists(dl_path):
        with open(dl_path, encoding='utf-8', errors='replace') as fh:
            dl_map = fh.read()
    served_by_dl = set()
    for a in assets:
        base = os.path.basename(a)
        if base in dl_map:
            served_by_dl.add(a)
            inbound[a].add('api/dl.js')
        for src, body in bodies.items():
            if base in body:
                inbound[a].add(src)

    # ---- sitemap ----------------------------------------------------------
    sitemap_paths = set()
    sitemap_file = os.path.join(root, 'sitemap.xml')
    if os.path.exists(sitemap_file):
        with open(sitemap_file, encoding='utf-8', errors='replace') as fh:
            for loc in LOC_RE.findall(fh.read()):
                cand = normalize_ref(loc, 'sitemap.xml')
                if cand:
                    sitemap_paths.add(resolve(cand, tracked_set) or cand)

    # ---- categorize everything -------------------------------------------
    by_cat = defaultdict(list)
    for p in tracked:
        by_cat[categorize(p)].append(p)

    # ---- orphan analysis --------------------------------------------------
    orphans, by_design, linked, keyed = [], [], [], []
    for p in html:
        base = os.path.basename(p)
        try:
            with open(os.path.join(root, p), encoding='utf-8', errors='replace') as fh:
                src_body = fh.read()
        except OSError:
            src_body = ''
        if base in INTENTIONALLY_UNLINKED or p in INTENTIONALLY_UNLINKED:
            by_design.append(p)
        elif not inbound.get(p) and KEYED_SURFACE_RE.search(src_body):
            keyed.append(p)
        elif inbound.get(p):
            linked.append(p)
        elif p in sitemap_paths:
            orphans.append((p, 'in sitemap.xml, no inbound page link'))
        else:
            orphans.append((p, 'no inbound page link, absent from sitemap.xml'))

    # unreferenced non-HTML deployable assets
    deployable_assets = [
        p for p in tracked
        if not p.startswith(PRIVATE_TREES)
        and not p.startswith(('scripts/', '.github/', '.claude/', 'supabase/', 'api/'))
        and os.path.splitext(p)[1].lower() in ('.pdf', '.png', '.svg', '.json', '.docx')
    ]
    unref_assets = [p for p in deployable_assets
                    if not inbound.get(p) and p not in sitemap_paths]

    live = {}
    exposure = []
    if do_live:
        routes = sorted(set(html) | {'robots.txt', 'sitemap.xml'})
        for p in routes:
            live[p] = live_status(HOST + '/' + p)
        # Internal working documents sitting at the repository root are served as static
        # assets by Vercel if they are present on main. Anything that answers 200 is
        # publicly downloadable whether or not a page links to it.
        internal = [q for q in tracked
                    if '/' not in q
                    and os.path.splitext(q)[1].lower() in ('.md', '.docx', '.json', '.txt')]
        for q in internal:
            st = live_status(HOST + '/' + q)
            if isinstance(st, int) and st < 400:
                exposure.append((q, st))

    return {
        'tracked': tracked, 'html': html, 'by_cat': by_cat, 'inbound': inbound,
        'outbound': outbound, 'broken': broken, 'sitemap': sitemap_paths,
        'orphans': orphans, 'by_design': by_design, 'linked': linked,
        'keyed': keyed,
        'unref_assets': unref_assets, 'live': live, 'root': root,
        'served_by_dl': sorted(served_by_dl), 'exposure': exposure,
    }


def emit(d, out):
    root = d['root']
    w = out.write
    tracked, html, by_cat = d['tracked'], d['html'], d['by_cat']

    def cnt(cat):
        return len(by_cat.get(cat, []))

    pub_html = [p for p in html if '/' not in p]
    ref_html = [p for p in html if p.startswith('reference/')]
    rev_html = [p for p in html if p.startswith('reviewer/')]
    pdfs = [p for p in tracked if p.lower().endswith('.pdf')]
    docx = [p for p in tracked if p.lower().endswith('.docx')]
    imgs = [p for p in tracked if os.path.splitext(p)[1].lower()
            in ('.png', '.svg', '.jpg', '.jpeg', '.gif', '.ico')]
    apis = [p for p in tracked if p.startswith('api/') and p.endswith('.js')]
    sqls = [p for p in tracked if p.endswith('.sql')]
    pys = [p for p in tracked if p.endswith('.py')]
    research = [p for p in tracked if p.startswith('research/')]

    w('# Master Inventory: jrsstandard.com\n\n')
    w('Generated by `scripts/site_inventory.py`. Every figure below is counted from '
      '`git ls-files` at generation time, not carried from a previous document.\n\n')

    w('## 1. Executive Summary\n\n')
    w('| Class | Count |\n|---|---:|\n')
    rows = [
        ('Tracked files, total', len(tracked)),
        ('HTML pages, total (excludes private `research/`)', len(html)),
        ('  - Root-level public and private pages', len(pub_html)),
        ('  - `reference/` library pages', len(ref_html)),
        ('  - `reviewer/` surfaces', len(rev_html)),
        ('Server-side endpoints (`api/*.js`)', len(apis)),
        ('PDF documents', len(pdfs)),
        ('Word documents (.docx)', len(docx)),
        ('Image assets', len(imgs)),
        ('SQL schema files', len(sqls)),
        ('Python scripts', len(pys)),
        ('URLs declared in `sitemap.xml`', len(d['sitemap'])),
        ('Private research files (NOT deployed)', len(research)),
        ('Orphaned HTML pages (no inbound link)', len(d['orphans'])),
        ('Unlinked by design (opaque slug / error doc)', len(d['by_design'])),
        ('Keyed participant surfaces (reached by direct link)', len(d['keyed'])),
        ('Unreferenced deployable assets', len(d['unref_assets'])),
        ('Broken internal references detected', len(d['broken'])),
    ]
    for label, n in rows:
        w('| %s | %d |\n' % (label, n))
    w('\n')

    w('## 2. Webpage and Route Inventory\n\n')

    def page_table(paths, heading):
        w('### %s (%d)\n\n' % (heading, len(paths)))
        w('| Path | `<title>` | Inbound links | In sitemap |\n|---|---|---:|:---:|\n')
        for p in sorted(paths):
            t = page_title(root, p).replace('|', '\\|')
            if len(t) > 78:
                t = t[:75] + '...'
            w('| `%s` | %s | %d | %s |\n' % (
                p, t or '(none)', len(d['inbound'].get(p, ())),
                'yes' if p in d['sitemap'] else 'no'))
        w('\n')

    page_table(pub_html, 'Root-level pages')
    page_table(ref_html, 'Reference library (`reference/`)')
    if rev_html:
        page_table(rev_html, 'Reviewer surfaces (`reviewer/`)')

    w('## 3. Document and Media Asset Inventory\n\n')
    w('### PDF documents (%d)\n\n' % len(pdfs))
    w('| Path | Bytes | Refs | Access path |\n|---|---:|---:|---|\n')
    dl = set(d.get('served_by_dl', ()))
    for p in sorted(pdfs):
        try:
            size = os.path.getsize(os.path.join(root, p))
        except OSError:
            size = 0
        if p.startswith(PRIVATE_TREES):
            how = 'private, not deployed'
        elif p in dl:
            how = '`/api/dl` proxy (`api/dl.js`)'
        elif d['inbound'].get(p):
            how = 'direct static path'
        else:
            how = '**no reference found**'
        w('| `%s` | %d | %d | %s |\n' % (p, size, len(d['inbound'].get(p, ())), how))
    w('\n### Word documents (%d)\n\n' % len(docx))
    for p in sorted(docx):
        w('- `%s`%s\n' % (p, '  **(private, not deployed)**'
                          if p.startswith(PRIVATE_TREES) else ''))
    w('\n### Image assets (%d)\n\n' % len(imgs))
    for p in sorted(imgs):
        w('- `%s` (referenced by %d pages)\n' % (p, len(d['inbound'].get(p, ()))))
    w('\n')

    w('## 4. Structural and Configuration Assets\n\n')
    for cat in ('Metadata / SEO', 'Data / Config', 'Server-Side Endpoint (Vercel Edge Function)',
                'Database Schema', 'Database / Edge Function Source',
                'Build, Audit and Guard Script', 'CI Workflow', 'Agent Configuration',
                'Template', 'Content Source'):
        items = sorted(by_cat.get(cat, []))
        if not items:
            continue
        w('### %s (%d)\n\n' % (cat, len(items)))
        for p in items:
            w('- `%s`\n' % p)
        w('\n')

    w('## 5. Orphaned or Unlinked Assets\n\n')
    w('### 5.1 Unlinked by design (%d) — NOT defects\n\n' % len(d['by_design']))
    w('| Path | Reason |\n|---|---|\n')
    for p in sorted(d['by_design']):
        reason = INTENTIONALLY_UNLINKED.get(os.path.basename(p),
                                            INTENTIONALLY_UNLINKED.get(p, ''))
        w('| `%s` | %s |\n' % (p, reason))
    w('\n### 5.2 Keyed participant surfaces (%d) - reached by a direct emailed link\n\n'
      % len(d['keyed']))
    w('These read a key or participant code from the query string. They have no inbound '
      'navigation link because they are not meant to be browsed to. Not defects.\n\n')
    w('| Path | `<title>` |\n|---|---|\n')
    for p in sorted(d['keyed']):
        w('| `%s` | %s |\n' % (p, page_title(root, p).replace('|', '\\|') or '(none)'))
    w('\n### 5.3 Orphaned pages (%d) - no inbound link from any HTML page\n\n'
      % len(d['orphans']))
    if d['orphans']:
        w('| Path | Finding | In sitemap |\n|---|---|:---:|\n')
        for p, why in sorted(d['orphans']):
            w('| `%s` | %s | %s |\n' % (p, why, 'yes' if p in d['sitemap'] else 'no'))
    else:
        w('None.\n')
    w('\n### 5.4 Unreferenced deployable assets (%d)\n\n' % len(d['unref_assets']))
    if d['unref_assets']:
        for p in sorted(d['unref_assets']):
            w('- `%s`\n' % p)
    else:
        w('None.\n')
    w('\n### 5.5 Broken internal references (%d)\n\n' % len(d['broken']))
    if d['broken']:
        w('| Source page | Reference | \n|---|---|\n')
        for src, raw in sorted(set(d['broken'])):
            w('| `%s` | `%s` |\n' % (src, raw.replace('|', '\\|')))
    else:
        w('None.\n')
    w('\n')

    w('## 6. Private research corpus (%d files, NOT deployed)\n\n' % len(research))
    w('`research/` is deliberately absent from `main`. It is listed here for completeness '
      'of the repository inventory and is not part of the website surface. '
      'File names only; contents include named rosters and are not reproduced.\n\n')
    ext_counts = defaultdict(int)
    for p in research:
        ext_counts[os.path.splitext(p)[1].lower() or '(none)'] += 1
    w('| Extension | Count |\n|---|---:|\n')
    for ext, n in sorted(ext_counts.items(), key=lambda kv: -kv[1]):
        w('| `%s` | %d |\n' % (ext, n))
    w('\n')

    if d['live']:
        w('## 7. Live verification against %s\n\n' % HOST)
        w('| Route | HTTP |\n|---|---:|\n')
        for p, st in sorted(d['live'].items()):
            w('| `/%s` | %s |\n' % (p, st))
        bad = [p for p, st in d['live'].items() if not (isinstance(st, int) and st < 400)]
        w('\n**%d of %d routes returned a non-success status.**\n\n'
          % (len(bad), len(d['live'])))

    if d.get('exposure'):
        w('## 8. Publicly reachable internal documents\n\n')
        w('Root-level documents that are present on `main` and therefore served as static '
          'assets. Each answered a live request. No page links to them; a link is not '
          'required to reach them.\n\n')
        w('| Route | HTTP | Note |\n|---|---:|---|\n')
        for q, st in sorted(d['exposure']):
            note = ('**Contains the opaque slug of the private owner page and the private '
                    'endpoint. Those slugs are the only access control on those surfaces.**'
                    if q == 'CLAUDE.md' else 'Internal working document.')
            w('| `/%s` | %d | %s |\n' % (q, st, note))
        w('\n')
    return


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--live', action='store_true', help='verify each route over HTTPS')
    ap.add_argument('--out', default=None, help='write markdown to this path')
    ap.add_argument('--json', default=None, help='also write raw counts as JSON')
    args = ap.parse_args()

    root = subprocess.check_output(
        ['git', 'rev-parse', '--show-toplevel'], text=True).strip()
    d = build(root, args.live)

    if args.out:
        with open(args.out, 'w', encoding='utf-8') as fh:
            emit(d, fh)
        print('wrote %s' % args.out)
    else:
        emit(d, sys.stdout)

    if args.json:
        with open(args.json, 'w', encoding='utf-8') as fh:
            json.dump({
                'tracked': len(d['tracked']), 'html': len(d['html']),
                'orphans': [p for p, _ in d['orphans']],
                'by_design': d['by_design'],
                'keyed': d['keyed'],
                'unref_assets': d['unref_assets'],
                'broken': d['broken'],
                'sitemap': sorted(d['sitemap']),
                'live': d['live'], 'exposure': d.get('exposure', []),
            }, fh, indent=2)
            print('wrote %s' % args.json)


if __name__ == '__main__':
    main()
