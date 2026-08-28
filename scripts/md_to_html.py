#!/usr/bin/env python3
"""Convert a manuscript in Markdown to standalone HTML for PDF rendering.

WHY THIS EXISTS. scripts/render_report_pdf.py wraps its source in <body> and
does no conversion. Handed a .md file it produced a PDF containing literal '#',
'**' and '---' markers with every heading, table and paragraph collapsed into
one block of running text. The FOIL manuscript PDF delivered on 2026-08-27 has
that defect: it was reported as an 11-page paper and it is unformatted source.

No external dependency: markdown, mistune and commonmark are all absent here,
and a manuscript sent to a journal must not depend on a package being present
on the machine that happens to render it next.

SCOPE IS WHAT THE MANUSCRIPTS ACTUALLY USE, verified against
research/FOIL_Article_Draft.md: ATX headings, bold, italic, inline code,
superscript tags already written as HTML, pipe tables, unordered and ordered
lists, horizontal rules, block quotes, and paragraphs. Anything outside that is
passed through rather than mangled.

    python3 scripts/md_to_html.py SOURCE.md OUT.html [--title "Name"]
"""
import html
import io
import os
import re
import sys

CSS = """
body{font-family:Georgia,'Times New Roman',serif;font-size:11.5pt;line-height:1.55;
     color:#111;background:#fff;max-width:44em;margin:0 auto;padding:2.2em 1.6em}
h1{font-size:19pt;line-height:1.25;margin:0 0 .5em;font-weight:600}
h2{font-size:14pt;margin:1.9em 0 .5em;font-weight:600;border-bottom:1px solid #ccc;padding-bottom:.2em}
h3{font-size:12.2pt;margin:1.5em 0 .4em;font-weight:600}
h4{font-size:11.5pt;margin:1.2em 0 .35em;font-weight:600;font-style:italic}
p{margin:0 0 .85em;text-align:justify}
ul,ol{margin:0 0 .9em 1.4em;padding:0}
li{margin:0 0 .3em}
blockquote{margin:0 0 .9em;padding:.1em 0 .1em 1em;border-left:3px solid #bbb;color:#444}
hr{border:0;border-top:1px solid #bbb;margin:1.8em 0}
table{border-collapse:collapse;width:100%;margin:0 0 1.1em;font-size:10.2pt}
th,td{border:1px solid #bbb;padding:5px 8px;text-align:left;vertical-align:top}
th{background:#f0f0f0;font-weight:600}
code{font-family:'DejaVu Sans Mono',Consolas,monospace;font-size:.92em;background:#f4f4f4;padding:1px 3px}
sup{font-size:.72em;vertical-align:super;line-height:0}
strong{font-weight:600}
h1,h2,h3,h4,table,blockquote{page-break-inside:avoid}
h1,h2,h3,h4{page-break-after:avoid}
"""


def inline(text):
    """Inline markup. Order matters: escape first, then re-admit the tags we allow."""
    t = html.escape(text, quote=False)
    # Superscript and subscript are written as literal HTML in these manuscripts
    # (footnote markers), so admit exactly those back.
    t = re.sub(r"&lt;(/?)(sup|sub|b|i|em|strong)&gt;", r"<\1\2>", t)
    t = re.sub(r"`([^`]+)`", r"<code>\1</code>", t)
    t = re.sub(r"\*\*\*(.+?)\*\*\*", r"<strong><em>\1</em></strong>", t)
    t = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", t)
    # Single asterisk italics, but never inside a word (a * used as a footnote
    # marker beside a number must not open an emphasis run).
    t = re.sub(r"(?<![\w*])\*(?!\s)(.+?)(?<!\s)\*(?![\w*])", r"<em>\1</em>", t)
    t = re.sub(r"\[([^\]]+)\]\((https?://[^)\s]+)\)", r'<a href="\2">\1</a>', t)
    t = re.sub(r"(?<![\"'>=])(https?://[^\s<)]+)", r'<a href="\1">\1</a>', t)
    return t


def is_table_row(line):
    return line.strip().startswith("|") and line.strip().endswith("|")


def split_row(line):
    return [c.strip() for c in line.strip().strip("|").split("|")]


def convert(md):
    lines = md.replace("\r\n", "\n").split("\n")
    out = []
    i = 0
    n = len(lines)
    para = []

    def flush():
        if para:
            out.append("<p>" + inline(" ".join(para).strip()) + "</p>")
            para[:] = []

    while i < n:
        line = lines[i]
        stripped = line.strip()

        if not stripped:
            flush()
            i += 1
            continue

        if re.match(r"^(-{3,}|\*{3,}|_{3,})$", stripped):
            flush()
            out.append("<hr>")
            i += 1
            continue

        m = re.match(r"^(#{1,6})\s+(.*)$", stripped)
        if m:
            flush()
            lvl = min(len(m.group(1)), 4)
            out.append("<h%d>%s</h%d>" % (lvl, inline(m.group(2)), lvl))
            i += 1
            continue

        # Pipe table: a header row, an alignment row, then body rows.
        if is_table_row(line) and i + 1 < n and re.match(r"^\|[\s:\-|]+\|$", lines[i + 1].strip()):
            flush()
            head = split_row(line)
            i += 2
            body = []
            while i < n and is_table_row(lines[i]):
                body.append(split_row(lines[i]))
                i += 1
            t = ["<table><thead><tr>"]
            t += ["<th>%s</th>" % inline(c) for c in head]
            t.append("</tr></thead><tbody>")
            for row in body:
                t.append("<tr>" + "".join("<td>%s</td>" % inline(c) for c in row) + "</tr>")
            t.append("</tbody></table>")
            out.append("".join(t))
            continue

        if re.match(r"^>\s?", stripped):
            flush()
            quote = []
            while i < n and lines[i].strip().startswith(">"):
                quote.append(re.sub(r"^>\s?", "", lines[i].strip()))
                i += 1
            out.append("<blockquote>%s</blockquote>" % convert("\n".join(quote)))
            continue

        m = re.match(r"^([-*+])\s+(.*)$", stripped)
        if m:
            flush()
            items = []
            while i < n:
                mm = re.match(r"^([-*+])\s+(.*)$", lines[i].strip())
                if not mm:
                    if lines[i].strip() and lines[i].startswith(("  ", "\t")) and items:
                        items[-1] += " " + lines[i].strip()
                        i += 1
                        continue
                    break
                items.append(mm.group(2))
                i += 1
            out.append("<ul>%s</ul>" % "".join("<li>%s</li>" % inline(x) for x in items))
            continue

        m = re.match(r"^(\d+)[.)]\s+(.*)$", stripped)
        if m:
            flush()
            start = m.group(1)
            items = []
            while i < n:
                mm = re.match(r"^(\d+)[.)]\s+(.*)$", lines[i].strip())
                if not mm:
                    if lines[i].strip() and lines[i].startswith(("  ", "\t")) and items:
                        items[-1] += " " + lines[i].strip()
                        i += 1
                        continue
                    break
                items.append(mm.group(2))
                i += 1
            out.append('<ol start="%s">%s</ol>'
                       % (start, "".join("<li>%s</li>" % inline(x) for x in items)))
            continue

        para.append(stripped)
        i += 1

    flush()
    return "\n".join(out)


def main():
    flags = [a for a in sys.argv[1:] if a.startswith("--")]
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    if len(args) != 2:
        print(__doc__)
        return 2
    src, out = args
    title = ""
    for f in flags:
        if f.startswith("--title="):
            title = f.split("=", 1)[1]
    if "--title" in sys.argv:
        k = sys.argv.index("--title")
        if k + 1 < len(sys.argv) and not sys.argv[k + 1].startswith("--"):
            title = sys.argv[k + 1]
            if title in args:
                args.remove(title)

    md = io.open(src, encoding="utf-8").read()
    if not title:
        m = re.search(r"^#\s+(.+)$", md, re.M)
        title = m.group(1).strip() if m else os.path.basename(src)
    body = convert(md)
    doc = ("<style>%s</style>\n<div class=\"doc\">%s</div>" % (CSS, body))
    io.open(out, "w", encoding="utf-8").write(doc)

    print("%s -> %s" % (os.path.relpath(src), os.path.relpath(out)))
    print("  %d source words, %d HTML bytes" % (len(md.split()), len(doc.encode("utf-8"))))
    for tag in ("h1", "h2", "h3", "table", "p", "li"):
        print("  <%s> %d" % (tag, body.count("<%s" % tag)))
    leaked = re.findall(r"(^|\s)(\*\*|##+|\|\s*---)", body)
    print("  unconverted markers: %d" % len(leaked))
    return 1 if leaked else 0


if __name__ == "__main__":
    sys.exit(main())
