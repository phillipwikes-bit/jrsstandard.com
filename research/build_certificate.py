#!/usr/bin/env python3
"""JRS reviewer Certificate of Completion generator (SINGLE SOURCE OF TRUTH).

Every reviewer certificate MUST be produced by this script. It is a faithful,
measured clone of the certificate that has actually been issued to reviewers
(reference: research/certificate_template_reference.pdf, Kyle McMullan). Do NOT
hand-design a new certificate, change the colors, or switch to a dark theme.
To issue a new one, add an entry to REVIEWERS and run this file.

Template facts (locked, from the reference PDF):
  page 792x612 landscape; ivory bg (0.99,0.985,0.975); double gold border
  (#BE9447, 2.2pt outer / 0.7pt inner); JRS(TM) Times-Bold 30 gold; wordmark
  Times-Roman 9.5 letter-spaced (#7A5E28); "Certificate of Completion"
  Times-Italic 26 ink; name Times-Bold 30 ink + gold underline; body
  Times-Roman 12.5 ink; date + signature blocks with gray rules; footer.

Usage:  python3 research/build_certificate.py
"""
from reportlab.pdfgen import canvas
from reportlab.pdfbase.pdfmetrics import stringWidth
from reportlab.lib.pagesizes import letter

W, H = letter[1], letter[0]  # 792 x 612 landscape

# Locked palette from the issued template. Do not change.
IVORY   = (0.99, 0.985, 0.975)
GOLD    = (190/255, 148/255, 71/255)
GOLD_DK = (122/255, 94/255, 40/255)
INK     = (18/255, 18/255, 18/255)
MUTED   = (102/255, 102/255, 102/255)
GRAY    = (0.4, 0.4, 0.4)

SIGNER  = "Phillip Wikes"          # signature (Times-Italic)
SIGN_LN = "Phillip Wikes, Creator, JRS"
FOOTER  = "© 2026 Phillip Wikes   ·   JRS   ·   jrsstandard.com"


def standard_body(possessive, perspective, source):
    """Build the locked body paragraph. `possessive` is 'His'/'Her'/'Their';
    `perspective` e.g. 'civil-rights and bilingual-intake'; `source` e.g.
    'her work at the Maryland Commission on Civil Rights'."""
    return ("served as a Reviewer on the JRS AI-Assisted Records Validation "
            "Pilot, completing the independent review of all 24 records with "
            "care, rigor, and independent judgment. " + possessive + " " +
            perspective + " perspective, drawn from " + source + ", contributed "
            "to the method by which AI-assisted records are evaluated for "
            "reconstructability and evidentiary integrity.")


def make_certificate(name, date, body, out_path):
    c = canvas.Canvas(out_path, pagesize=(W, H))
    def top(y): return H - y
    def ctext(cx, by, text, font, size, color):
        c.setFillColorRGB(*color); c.setFont(font, size)
        c.drawCentredString(cx, top(by), text)

    c.setFillColorRGB(*IVORY); c.rect(0, 0, W, H, fill=1, stroke=0)

    c.setStrokeColorRGB(*GOLD); c.setLineWidth(2.2)
    c.rect(28, 28, 736, 556, fill=0, stroke=1)
    c.setLineWidth(0.7); c.rect(38, 38, 716, 536, fill=0, stroke=1)

    c.setFillColorRGB(*GOLD); c.setFont("Times-Bold", 30)
    c.drawCentredString(390, top(86), "JRS")
    c.setFont("Times-Bold", 12); c.drawString(415, top(71), "™")

    wm = "JUSTIFICATION REVIEW STANDARD"
    extra = (162 - stringWidth(wm, "Times-Roman", 9.5)) / (len(wm) - 1)
    t = c.beginText(396 - 162/2, top(104))
    t.setFont("Times-Roman", 9.5); t.setCharSpace(extra); t.setFillColorRGB(*GOLD_DK)
    t.textOut(wm); c.drawText(t)

    c.setStrokeColorRGB(*GOLD); c.setLineWidth(0.6); c.line(306, top(116), 486, top(116))

    ctext(396, 158, "Certificate of Completion", "Times-Italic", 26, INK)
    ctext(396, 196, "This certifies that", "Times-Roman", 12, MUTED)
    ctext(396, 238, name, "Times-Bold", 30, INK)
    c.setStrokeColorRGB(*GOLD); c.setLineWidth(0.8); c.line(246, top(250), 546, top(250))

    # Body: wrap to <=568pt, center each line, 18pt leading from baseline 280.
    maxw, fnt, fsz = 568, "Times-Roman", 12.5
    lines, cur = [], ""
    for wd in body.split():
        trial = (cur + " " + wd).strip()
        if stringWidth(trial, fnt, fsz) <= maxw:
            cur = trial
        else:
            lines.append(cur); cur = wd
    if cur: lines.append(cur)
    for i, ln in enumerate(lines):
        ctext(396, 280 + i*18, ln, fnt, fsz, INK)

    c.setStrokeColorRGB(*GRAY); c.setLineWidth(0.6)
    c.line(110, top(516), 300, top(516)); c.line(492, top(516), 682, top(516))
    ctext(205, 510, date, "Times-Roman", 12, INK)
    ctext(205, 530, "Date", "Times-Roman", 10, MUTED)
    ctext(587, 509, SIGNER, "Times-Italic", 30, INK)
    ctext(587, 530, SIGN_LN, "Times-Roman", 10, MUTED)
    ctext(396, 560, FOOTER, "Times-Roman", 8.5, MUTED)

    c.showPage(); c.save()
    return out_path, len(lines)


# Registry of issued certificates. Add a row to issue a new one.
REVIEWERS = [
    {
        "name": "Gabriela Cortez",
        "date": "July 17, 2026",
        "body": standard_body(
            "Her", "civil-rights and bilingual-intake",
            "her work at the Maryland Commission on Civil Rights"),
        "out": "/home/user/jrsstandard.com/research/JRS_Certificate_Gabriela_Cortez.pdf",
    },
]

if __name__ == "__main__":
    for r in REVIEWERS:
        path, n = make_certificate(r["name"], r["date"], r["body"], r["out"])
        print("wrote", path, "| body lines:", n)
