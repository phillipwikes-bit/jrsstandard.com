#!/usr/bin/env python3
"""Markdown to Word (.docx) for the research drafts.

This environment has no pandoc, and the LibreOffice HTML import filter is not
available, so the .docx is written directly as WordprocessingML in a zip. It
covers the constructs these drafts use: ATX headings, pipe tables, bullet and
numbered lists, bold, italics, inline code, links (rendered as plain text), and
horizontal rules. US Letter, Times New Roman 12pt.

Usage: python3 research/md_to_docx.py <file.md> [more.md ...]
"""
import os, re, sys, zipfile
from xml.sax.saxutils import escape

W = ('xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" '
     'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"')

# HYPERLINKS. Added 2026-08-28. The builder previously flattened [text](url) to
# "text (url)", printing the bare URL into the prose, which is precisely what a
# trade outlet asking for in-text links does not want. Links are now real
# w:hyperlink elements: the reader sees the instrument name and clicks it.
#
# Each link needs a relationship in word/_rels/document.xml.rels, so they are
# collected during the run and the rels part is written from what was collected
# rather than from a fixed string.
_LINKS = []


def _link_id(url):
    for i, u in enumerate(_LINKS):
        if u == url:
            return 'rIdL%d' % (i + 1)
    _LINKS.append(url)
    return 'rIdL%d' % len(_LINKS)

def runs(text):
    """Inline markdown to a list of <w:r> strings."""
    out, tokens = [], re.split(
        r'(\[[^\]]+\]\([^)]+\)|\*\*.+?\*\*|(?<!\*)\*(?!\*).+?(?<!\*)\*(?!\*)|`.+?`|<sup>.+?</sup>)',
        text)
    for tok in tokens:
        if not tok:
            continue
        b = i = c = sup = False
        m = re.match(r'^\[([^\]]+)\]\(([^)]+)\)$', tok)
        if m:
            label, url = m.group(1), m.group(2)
            # The label may itself carry emphasis, as a case name does.
            inner = runs(label)
            inner = inner.replace('<w:r>', '<w:r><w:rPr><w:rStyle w:val="Hyperlink"/></w:rPr>', 1) \
                if '<w:rPr>' not in inner.split('<w:t')[0] else \
                inner.replace('<w:rPr>', '<w:rPr><w:rStyle w:val="Hyperlink"/>', 1)
            out.append('<w:hyperlink r:id="%s">%s</w:hyperlink>' % (_link_id(url), inner))
            continue
        if tok.startswith('<sup>') and tok.endswith('</sup>'):
            tok, sup = tok[5:-6], True
        elif tok.startswith('**') and tok.endswith('**') and len(tok) > 4:
            tok, b = tok[2:-2], True
        elif tok.startswith('*') and tok.endswith('*') and len(tok) > 2:
            tok, i = tok[1:-1], True
        elif tok.startswith('`') and tok.endswith('`') and len(tok) > 2:
            tok, c = tok[1:-1], True
        props = ''
        if b: props += '<w:b/>'
        if i: props += '<w:i/>'
        if c: props += '<w:rFonts w:ascii="Consolas" w:hAnsi="Consolas"/>'
        if sup: props += '<w:vertAlign w:val="superscript"/>'
        rpr = f'<w:rPr>{props}</w:rPr>' if props else ''
        out.append(f'<w:r>{rpr}<w:t xml:space="preserve">{escape(tok)}</w:t></w:r>')
    return ''.join(out) or '<w:r><w:t/></w:r>'

def para(text, style=None, spacing=True):
    ppr = '<w:pPr>'
    if style: ppr += f'<w:pStyle w:val="{style}"/>'
    if spacing: ppr += '<w:spacing w:after="140"/>'
    ppr += '</w:pPr>'
    return f'<w:p>{ppr}{runs(text)}</w:p>'

# Numbered lists restart per block. _NUM_STATE holds the id of the block currently being
# emitted; new_numbered_block() advances it. Bullets always use numId 1.
_NUM_STATE = {'next': 2, 'current': 2, 'ids': [2]}

def new_numbered_block():
    _NUM_STATE['next'] += 1
    _NUM_STATE['current'] = _NUM_STATE['next']
    _NUM_STATE['ids'].append(_NUM_STATE['current'])

def bullet(text, numbered=False):
    nid = _NUM_STATE['current'] if numbered else 1
    return ('<w:p><w:pPr><w:numPr><w:ilvl w:val="0"/>'
            f'<w:numId w:val="{nid}"/></w:numPr>'
            '<w:spacing w:after="60"/></w:pPr>' + runs(text) + '</w:p>')

def table(rows):
    head, body = rows[0], rows[1:]
    n = max(len(r) for r in rows)
    width = 9360
    col = width // n
    grid = ''.join(f'<w:gridCol w:w="{col}"/>' for _ in range(n))
    def cell(txt, hdr):
        shd = '<w:shd w:val="clear" w:color="auto" w:fill="EEEEEE"/>' if hdr else ''
        return (f'<w:tc><w:tcPr><w:tcW w:w="{col}" w:type="dxa"/>{shd}</w:tcPr>'
                f'<w:p><w:pPr><w:spacing w:after="0"/></w:pPr>{runs(txt)}</w:p></w:tc>')
    out = ['<w:tbl><w:tblPr><w:tblStyle w:val="TableGrid"/>'
           f'<w:tblW w:w="{width}" w:type="dxa"/>'
           '<w:tblBorders>' + ''.join(
               f'<w:{e} w:val="single" w:sz="4" w:space="0" w:color="999999"/>'
               for e in ('top','left','bottom','right','insideH','insideV')) +
           '</w:tblBorders></w:tblPr>'
           f'<w:tblGrid>{grid}</w:tblGrid>']
    for r in [head] + body:
        r = (r + [''] * n)[:n]
        out.append('<w:tr>' + ''.join(cell(c, r is head) for c in r) + '</w:tr>')
    out.append('</w:tbl>' + para('', spacing=False))
    return ''.join(out)

def convert(md):
    body, i, lines = [], 0, md.split('\n')
    while i < len(lines):
        ln = lines[i]
        if re.match(r'^\s*\|.*\|\s*$', ln) and i + 1 < len(lines) and re.match(r'^\s*\|[\s:\-|]+\|\s*$', lines[i+1]):
            rows = []
            while i < len(lines) and re.match(r'^\s*\|.*\|\s*$', lines[i]):
                if not re.match(r'^\s*\|[\s:\-|]+\|\s*$', lines[i]):
                    rows.append([c.strip() for c in lines[i].strip().strip('|').split('|')])
                i += 1
            body.append(table(rows)); continue
        m = re.match(r'^(#{1,4})\s+(.*)$', ln)
        if m:
            body.append(para(m.group(2), style=f'Heading{len(m.group(1))}')); i += 1; continue
        if re.match(r'^\s*[-*]\s+', ln):
            while i < len(lines) and re.match(r'^\s*[-*]\s+', lines[i]):
                body.append(bullet(re.sub(r'^\s*[-*]\s+', '', lines[i]))); i += 1
            continue
        if re.match(r'^\s*\d+\.\s+', ln):
            new_numbered_block()
            while i < len(lines) and re.match(r'^\s*\d+\.\s+', lines[i]):
                body.append(bullet(re.sub(r'^\s*\d+\.\s+', '', lines[i]), numbered=True)); i += 1
            continue
        if re.match(r'^\s*(---|___|\*\*\*)\s*$', ln):
            body.append('<w:p><w:pPr><w:pBdr><w:bottom w:val="single" w:sz="6" w:space="1" w:color="AAAAAA"/></w:pBdr></w:pPr></w:p>')
            i += 1; continue
        if ln.strip():
            # Join the wrapped continuation lines of this paragraph. A blank line, a
            # heading, a list item, a table row or a rule ends it.
            buf = [ln.strip()]
            i += 1
            while i < len(lines):
                nxt = lines[i]
                if (not nxt.strip()
                        or re.match(r'^\s*\|.*\|\s*$', nxt)
                        or re.match(r'^#{1,4}\s+', nxt)
                        or re.match(r'^\s*[-*]\s+', nxt)
                        or re.match(r'^\s*\d+\.\s+', nxt)
                        or re.match(r'^\s*(---|___|\*\*\*)\s*$', nxt)):
                    break
                buf.append(nxt.strip())
                i += 1
            body.append(para(' '.join(buf)))
            continue
        i += 1
    sect = ('<w:sectPr><w:pgSz w:w="12240" w:h="15840"/>'
            '<w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/></w:sectPr>')
    return (f'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document {W}><w:body>'
            + ''.join(body) + sect + '</w:body></w:document>')

STYLES = f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles {W}><w:style w:type="character" w:styleId="Hyperlink"><w:name w:val="Hyperlink"/><w:rPr><w:color w:val="0563C1"/><w:u w:val="single"/></w:rPr></w:style>
<w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/></w:rPr></w:rPrDefault></w:docDefaults>
<w:style w:type="paragraph" w:styleId="Normal" w:default="1"><w:name w:val="Normal"/></w:style>
<w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:pPr><w:outlineLvl w:val="0"/><w:spacing w:before="240" w:after="120"/></w:pPr><w:rPr><w:b/><w:sz w:val="36"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:basedOn w:val="Normal"/><w:pPr><w:outlineLvl w:val="1"/><w:spacing w:before="220" w:after="110"/></w:pPr><w:rPr><w:b/><w:sz w:val="28"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Heading3"><w:name w:val="heading 3"/><w:basedOn w:val="Normal"/><w:pPr><w:outlineLvl w:val="2"/><w:spacing w:before="200" w:after="100"/></w:pPr><w:rPr><w:b/><w:sz w:val="26"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Heading4"><w:name w:val="heading 4"/><w:basedOn w:val="Normal"/><w:pPr><w:outlineLvl w:val="3"/></w:pPr><w:rPr><w:b/><w:i/></w:rPr></w:style>
<w:style w:type="table" w:styleId="TableGrid"><w:name w:val="Table Grid"/></w:style>
</w:styles>'''

NUMBERING = f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:numbering {W}>
<w:abstractNum w:abstractNumId="0"><w:lvl w:ilvl="0"><w:numFmt w:val="bullet"/><w:lvlText w:val="&#8226;"/><w:pPr><w:ind w:left="720" w:hanging="360"/></w:pPr></w:lvl></w:abstractNum>
<w:abstractNum w:abstractNumId="1"><w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="decimal"/><w:lvlText w:val="%1."/><w:pPr><w:ind w:left="720" w:hanging="360"/></w:pPr></w:lvl></w:abstractNum>
<w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num>
__NUMS__
</w:numbering>'''

CT = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
<Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/>
</Types>'''

RELS = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>'''

DRELS = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering" Target="numbering.xml"/></Relationships>'''

def build(src):
    out = os.path.splitext(src)[0] + '.docx'
    doc = convert(open(src, encoding='utf-8').read())
    with zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED) as z:
        z.writestr('[Content_Types].xml', CT)
        z.writestr('_rels/.rels', RELS)
        z.writestr('word/document.xml', doc)
        z.writestr('word/styles.xml', STYLES)
        nums = ''.join('<w:num w:numId="%d"><w:abstractNumId w:val="1"/></w:num>' % n
                       for n in _NUM_STATE['ids'])
        z.writestr('word/numbering.xml', NUMBERING.replace('__NUMS__', nums))
        rels = ''.join(
            '<Relationship Id="rIdL%d" '
            'Type="http://schemas.openxmlformats.org/officeDocument/2006/'
            'relationships/hyperlink" Target="%s" TargetMode="External"/>'
            % (i + 1, u.replace('&', '&amp;')) for i, u in enumerate(_LINKS))
        z.writestr('word/_rels/document.xml.rels',
                   DRELS.replace('</Relationships>', rels + '</Relationships>'))
    return out

if __name__ == '__main__':
    for f in sys.argv[1:]:
        print('wrote', build(f))
