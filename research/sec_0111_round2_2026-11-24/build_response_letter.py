"""Build the round-2 response letter .docx from its plain-text source.

Usage: python3 -I build_response_letter.py <response.txt> <out.docx>
The text itself quotes confidential peer review and is kept outside the repository.
Lines starting '#' are part headings, '##' item headings, '- ' bullets.
"""
import datetime
import sys

import docx
from docx.shared import Pt

src, out = sys.argv[1:3]
d = docx.Document()
st = d.styles["Normal"]
st.font.name = "Cambria"
st.font.size = Pt(11)
first = True
for ln in open(src, encoding="utf-8").read().split("\n"):
    if not ln.strip():
        continue
    if first:
        r = d.add_paragraph().add_run(ln); r.bold = True; r.font.size = Pt(13); first = False
    elif ln.startswith("##"):
        d.add_paragraph().add_run(ln.lstrip("#").strip()).bold = True
    elif ln.startswith("#"):
        r = d.add_paragraph().add_run(ln.lstrip("#").strip()); r.bold = True; r.font.size = Pt(12)
    elif ln.startswith("- "):
        d.add_paragraph(ln[2:], style="List Bullet")
    else:
        d.add_paragraph(ln)
c = d.core_properties
now = datetime.datetime.now(datetime.timezone.utc).replace(microsecond=0)
c.author = c.last_modified_by = "Phillip Wikes"
c.comments = ""
c.title = "SEC-0111-2026 Response to Editor and Reviewers"
c.created = c.modified = now
c.revision = 1
d.save(out)
print("saved", out)
