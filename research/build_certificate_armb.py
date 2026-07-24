#!/usr/bin/env python3
"""NEUTRAL "Records Review Study" certificate generator for Arm B reviewers.

WHY THIS EXISTS (blind-study guardrail): Arm B / Comparison reviewers (RR-###
codes) participate in a BLIND study. They must NEVER receive the JRS-branded
certificate, the JRS name, the five-condition method, "reconstructability"
language, or the training link. Recognition is NEUTRAL and participation-based,
matching the Boris / Nicholas / Mostafa precedent. Same elegant layout as the
JRS certificate (ivory, gold border), but:
  - masthead is "RECORDS REVIEW STUDY", never JRS.
  - body says "participated as an independent reviewer... completing the review
    of all 24 records", never JRS method / reconstructability / evidentiary
    integrity.
  - signature is "Phillip Wikes / Study Lead", NEVER "Creator, JRS" (that is the
    exact Vanessa/Pavan leak vector).
  - footer carries no JRS mark and no jrsstandard.com domain.
ALWAYS verify completion first: `python3 research/check_completion.py RR-###`.

Usage:  python3 research/build_certificate_armb.py
"""
from reportlab.pdfgen import canvas
from reportlab.pdfbase.pdfmetrics import stringWidth
from reportlab.lib.pagesizes import letter

W, H = letter[1], letter[0]  # 792 x 612 landscape

IVORY   = (0.99, 0.985, 0.975)
GOLD    = (190/255, 148/255, 71/255)
GOLD_DK = (122/255, 94/255, 40/255)
INK     = (18/255, 18/255, 18/255)
MUTED   = (102/255, 102/255, 102/255)
GRAY    = (0.4, 0.4, 0.4)

SIGNER  = "Phillip Wikes"                 # signature (Times-Italic)
SIGN_LN = "Phillip Wikes, Study Lead"     # NEUTRAL: never "Creator, JRS"
FOOTER  = "© 2026 Phillip Wikes   ·   Records Review Study"  # no JRS, no domain


def neutral_body(perspective, source):
    """Neutral participation paragraph. No JRS, no method, no reconstructability.
    `perspective` e.g. 'AI, health-technology, and governance'; `source` e.g.
    'research and consulting on AI operations and governance'."""
    return ("participated as an independent reviewer in the Records Review "
            "Study, completing the review of all 24 records with care, rigor, "
            "and independent judgment. An " + perspective + " perspective, "
            "drawn from " + source + ", enriched the international reviewer panel.")


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

    # NEUTRAL masthead (no JRS). Letter-spaced study name + subtitle rule.
    mast = "RECORDS REVIEW STUDY"
    extra = (300 - stringWidth(mast, "Times-Bold", 20)) / (len(mast) - 1)
    t = c.beginText(396 - 300/2, top(90))
    t.setFont("Times-Bold", 20); t.setCharSpace(extra); t.setFillColorRGB(*GOLD_DK)
    t.textOut(mast); c.drawText(t)

    sub = "INDEPENDENT REVIEWER PANEL"
    extra2 = (150 - stringWidth(sub, "Times-Roman", 9)) / (len(sub) - 1)
    t2 = c.beginText(396 - 150/2, top(108))
    t2.setFont("Times-Roman", 9); t2.setCharSpace(extra2); t2.setFillColorRGB(*MUTED)
    t2.textOut(sub); c.drawText(t2)

    c.setStrokeColorRGB(*GOLD); c.setLineWidth(0.6); c.line(306, top(120), 486, top(120))

    ctext(396, 162, "Certificate of Completion", "Times-Italic", 26, INK)
    ctext(396, 198, "This certifies that", "Times-Roman", 12, MUTED)
    ctext(396, 240, name, "Times-Bold", 30, INK)
    c.setStrokeColorRGB(*GOLD); c.setLineWidth(0.8); c.line(246, top(252), 546, top(252))

    # Body: wrap to <=568pt, center each line, 18pt leading from baseline 282.
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
        ctext(396, 282 + i*18, ln, fnt, fsz, INK)

    c.setStrokeColorRGB(*GRAY); c.setLineWidth(0.6)
    c.line(110, top(516), 300, top(516)); c.line(492, top(516), 682, top(516))
    ctext(205, 510, date, "Times-Roman", 12, INK)
    ctext(205, 530, "Date", "Times-Roman", 10, MUTED)
    ctext(587, 509, SIGNER, "Times-Italic", 30, INK)
    ctext(587, 530, SIGN_LN, "Times-Roman", 10, MUTED)
    ctext(396, 560, FOOTER, "Times-Roman", 8.5, MUTED)

    c.showPage(); c.save()
    return out_path, len(lines)


# Registry of issued NEUTRAL certificates (Arm B). Add a row to issue a new one.
REVIEWERS = [
    {
        "name": "Tuneer Mondal",
        "date": "July 21, 2026",
        "body": neutral_body(
            "AI, health-technology, and governance",
            "research and consulting on AI operations and governance"),
        "out": "/home/user/jrsstandard.com/research/Records_Review_Study_Certificate_Tuneer_Mondal.pdf",
    },
    {
        "name": "Dr. Sharon Licqurish",
        "date": "July 23, 2026",
        "body": neutral_body(
            "AI governance, research, and intellectual-property strategy",
            "senior leadership and applied research in trustworthy AI"),
        "out": "/home/user/jrsstandard.com/research/Records_Review_Study_Certificate_Sharon_Licqurish.pdf",
    },
    {
        "name": "Joseph Mungai",
        "date": "July 24, 2026",
        "body": neutral_body(
            "public-interest technology, AI ethics, and governance",
            "research and practice on technology, governance, and public accountability in Africa"),
        "out": "/home/user/jrsstandard.com/research/Records_Review_Study_Certificate_Joseph_Mungai.pdf",
    },
]

if __name__ == "__main__":
    for r in REVIEWERS:
        path, n = make_certificate(r["name"], r["date"], r["body"], r["out"])
        print("wrote", path, "| body lines:", n)
