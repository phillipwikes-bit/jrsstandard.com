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


def _article(word):
    """Pick "A" or "An" from the first letter of the perspective. Hardcoding
    "An" produced "An public-interest" and "An data-protection" in earlier
    certificates; the article is chosen rather than assumed."""
    first = word.lstrip().lstrip('"\'(')[:1].lower()
    return "An" if first in "aeiou" else "A"


def neutral_body(perspective, source):
    """Neutral participation paragraph. No JRS, no method, no reconstructability.
    `perspective` e.g. 'AI, health-technology, and governance'; `source` e.g.
    'research and consulting on AI operations and governance'."""
    return ("participated as an independent reviewer in the Records Review "
            "Study, completing the review of all 24 records with care, rigor, "
            "and independent judgment. " + _article(perspective) + " " + perspective +
            " perspective, drawn from " + source +
            ", enriched the international reviewer panel.")


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
    {
        "name": "Adesh Sharma",
        "date": "July 27, 2026",
        "body": neutral_body(
            "enterprise data and AI governance",
            "over fifteen years building governance and risk frameworks across regulated sectors"),
        "out": "/home/user/jrsstandard.com/research/Records_Review_Study_Certificate_Adesh_Sharma.pdf",
    },
    {
        "name": "Donavine Smith",
        "date": "July 28, 2026",
        "body": neutral_body(
            "executive strategy and AI-governance",
            "senior strategy and transformation leadership and frontier AI governance"),
        "out": "/home/user/jrsstandard.com/research/Records_Review_Study_Certificate_Donavine_Smith.pdf",
    },
    {
        "name": "Jean-Luc Adade",
        "date": "July 30, 2026",
        "body": neutral_body(
            "IT-leadership and governance",
            "over a decade of multi-country IT operations, IT governance, and digital transformation across Africa"),
        "out": "/home/user/jrsstandard.com/research/Records_Review_Study_Certificate_Jean-Luc_Adade.pdf",
    },
    {
        "name": "Muhammad Dauda",
        "date": "July 31, 2026",
        "body": neutral_body(
            "program management, sustainability, and governance",
            "program leadership across sustainability and development work with UN-affiliated youth networks and higher education in Nigeria"),
        "out": "/home/user/jrsstandard.com/research/Records_Review_Study_Certificate_Muhammad_Dauda.pdf",
    },
    {
        "name": "Sagarika Banerjee",
        "date": "August 1, 2026",
        "body": neutral_body(
            "AI governance and software quality assurance",
            "leadership in AI management systems and quality assurance, including ISO/IEC 42001 and the NIST AI Risk Management Framework"),
        "out": "/home/user/jrsstandard.com/research/Records_Review_Study_Certificate_Sagarika_Banerjee.pdf",
    },
    # Dates below are the UTC date of the last read in the database, which is the
    # record the certificate rests on.
    {
        "name": "Dr. Eric J. W. Orlowski",
        "date": "August 3, 2026",
        "body": neutral_body(
            "AI-governance, ethnographic, and technology-policy",
            "research at a national AI research institute and doctoral work in social and cultural anthropology"),
        "out": "/home/user/jrsstandard.com/research/Records_Review_Study_Certificate_Eric_Orlowski.pdf",
    },
    {
        "name": "Greg Searle",
        "date": "August 3, 2026",
        "body": neutral_body(
            "AI-governance and model-behaviour research",
            "research on model behaviour alongside a long career in enterprise systems architecture"),
        "out": "/home/user/jrsstandard.com/research/Records_Review_Study_Certificate_Greg_Searle.pdf",
    },
    {
        "name": "MacKenzie McCowan",
        "date": "August 4, 2026",
        "body": neutral_body(
            "AI-governance and academic-appeals",
            "AI governance practice in education technology, doctoral research, and service assessing academic appeals"),
        "out": "/home/user/jrsstandard.com/research/Records_Review_Study_Certificate_MacKenzie_McCowan.pdf",
    },
    {
        "name": "Priyam Dhamankar",
        # Completion date is the UTC date of the last read in the database
        # (2026-08-12T10:33Z), which is the record the certificate rests on.
        # Verified with check_completion.py RR-113, exit 0, before this entry
        # was written.
        "date": "August 12, 2026",
        "body": neutral_body(
            "ethics-and-compliance and investigations",
            "seventeen years of legal, compliance and investigations practice"),
        "out": "/home/user/jrsstandard.com/research/Records_Review_Study_Certificate_Priyam_Dhamankar.pdf",
    },
    {
        "name": "Candid Opris",
        # Completion date is the UTC date of the last read in the database
        # (2026-08-11T18:23Z), which is the record the certificate rests on.
        # All 24 completed in a single sitting. Verified with
        # check_completion.py RR-127, exit 0, before this entry was written.
        "date": "August 11, 2026",
        "body": neutral_body(
            "AI governance and digital-trust",
            "two decades of practice in AI and data governance"),
        "out": "/home/user/jrsstandard.com/research/Records_Review_Study_Certificate_Candid_Opris.pdf",
    },
    {
        "name": "Alexandria Davis",
        # Completion date is the UTC date of the last read in the database
        # (2026-08-11T01:59Z), which is the record the certificate rests on.
        # All 24 completed in a single sitting.
        "date": "August 11, 2026",
        "body": neutral_body(
            "responsible-AI and fairness-in-financial-systems",
            "practice in responsible AI and fairness in financial systems"),
        "out": "/home/user/jrsstandard.com/research/Records_Review_Study_Certificate_Alexandria_Davis.pdf",
    },
    {
        "name": "Wendy Ann Martel",
        # Completion date is the UTC date of the last read in the database
        # (2026-08-07T21:25Z), which is the record the certificate rests on.
        "date": "August 7, 2026",
        "body": neutral_body(
            "data-protection, privacy, and AI-governance",
            "twenty five years of public and private sector practice in data, privacy and AI governance"),
        "out": "/home/user/jrsstandard.com/research/Records_Review_Study_Certificate_Wendy_Ann_Martel.pdf",
    },
]

if __name__ == "__main__":
    for r in REVIEWERS:
        path, n = make_certificate(r["name"], r["date"], r["body"], r["out"])
        print("wrote", path, "| body lines:", n)
