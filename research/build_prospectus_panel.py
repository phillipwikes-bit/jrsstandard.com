#!/usr/bin/env python3
"""JRS Panel (Arm A / expert reviewer) prospectus generator.

For JRS-AWARE expert reviewers (V-AI-## codes), where naming JRS and the method
is correct (unlike the neutral Arm B prospectus). Same proven one-page layout as
build_prospectus_armb.py. If a canonical Panel prospectus format exists, send it
and this will be matched to it. Personalize name + location + code.

Usage:  python3 research/build_prospectus_panel.py
"""
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.platypus import (SimpleDocTemplate, Paragraph, Table, TableStyle,
                                ListFlowable, ListItem)
from reportlab.lib.styles import ParagraphStyle

GOLD = colors.Color(122/255, 94/255, 40/255)
INK  = colors.Color(20/255, 20/255, 20/255)
MUT  = colors.Color(95/255, 95/255, 95/255)

TITLE = ParagraphStyle("t", fontName="Times-Bold", fontSize=20, textColor=INK, leading=23, spaceAfter=2)
TAG   = ParagraphStyle("tag", fontName="Times-Italic", fontSize=11, textColor=INK, leading=14, spaceAfter=7)
LBL   = ParagraphStyle("lbl", fontName="Times-Roman", fontSize=11, textColor=INK, leading=16, spaceAfter=1)
NOTE  = ParagraphStyle("note", fontName="Times-Italic", fontSize=10.5, textColor=MUT, leading=15, spaceBefore=3, spaceAfter=5)
BOXH  = ParagraphStyle("boxh", fontName="Times-Bold", fontSize=11, textColor=INK, leading=15, spaceAfter=3)
BOXL  = ParagraphStyle("boxl", fontName="Times-Bold", fontSize=13, textColor=GOLD, leading=16)
H     = ParagraphStyle("h", fontName="Times-Bold", fontSize=11.5, textColor=INK, leading=13, spaceBefore=6, spaceAfter=2)
BODY  = ParagraphStyle("b", fontName="Times-Roman", fontSize=10.5, textColor=INK, leading=13, spaceAfter=2)
LI    = ParagraphStyle("li", fontName="Times-Roman", fontSize=10.5, textColor=INK, leading=13, spaceAfter=2)
SIG   = ParagraphStyle("sig", fontName="Times-Roman", fontSize=11, textColor=INK, leading=15, spaceBefore=6)
FOOT  = ParagraphStyle("foot", fontName="Times-Italic", fontSize=9.5, textColor=MUT, leading=13, alignment=1, spaceBefore=8)


def _num(items):
    return ListFlowable([ListItem(Paragraph(t, LI), leftIndent=14) for t in items],
                        bulletType="1", bulletFormat="%s.", leftIndent=16)

def _bul(items):
    return ListFlowable([ListItem(Paragraph(t, LI), leftIndent=14, value="-") for t in items],
                        bulletType="bullet", start="-", leftIndent=16)


def build(name, location, code, out_path, deadline="within two to three weeks"):
    url = "www.jrsstandard.com/ai-records-pilot.html?code=" + code
    doc = SimpleDocTemplate(out_path, pagesize=letter,
                            leftMargin=0.95*inch, rightMargin=0.95*inch,
                            topMargin=0.65*inch, bottomMargin=0.5*inch,
                            title="JRS AI-Assisted Records Validation Pilot")
    S = []
    S.append(Paragraph("JRS Expert Reviewer Panel", TITLE))
    S.append(Paragraph("The Justification Review Standard: AI-Assisted Records Validation Pilot.", TAG))
    S.append(Paragraph("<b>Prepared for:</b>&nbsp; " + name + " (" + location + ")", LBL))
    S.append(Paragraph("<b>Proposed role:</b>&nbsp; Expert reviewer (your independent professional judgment)", LBL))
    S.append(Paragraph("A note on the invitation: it would be a privilege to have your expertise on the panel. What "
                       "the pilot needs is your independent, experienced judgment on a set of records, applying the "
                       "JRS review to each.", NOTE))

    box = Table([[[Paragraph("Everything is done at one link. About an hour total, and you can stop and resume:", BOXH),
                   Paragraph(url, BOXL)]]], colWidths=[6.1*inch])
    box.setStyle(TableStyle([("BOX", (0,0), (-1,-1), 0.8, GOLD),
                             ("LEFTPADDING",(0,0),(-1,-1),10), ("RIGHTPADDING",(0,0),(-1,-1),10),
                             ("TOPPADDING",(0,0),(-1,-1),6), ("BOTTOMPADDING",(0,0),(-1,-1),6)]))
    S.append(box)

    S.append(Paragraph("PURPOSE", H))
    S.append(Paragraph("The Justification Review Standard (JRS) evaluates whether an AI-assisted record can be "
                       "reconstructed and defended from the record alone. This pilot gathers the independent reads of "
                       "an expert panel, applying JRS to a balanced set of constructed records, to test how reliably "
                       "experienced reviewers agree and how those reads compare with a verified reference.", BODY))

    S.append(Paragraph("WHAT YOU WILL DO (ALL ONLINE)", H))
    S.append(_num([
        "Open your personalized link. Your reviewer code is already filled in, so there is nothing to set up.",
        "You will see 24 short, constructed records.",
        "For each, give your JRS read: can a later reviewer reconstruct how the conclusion was reached from the record itself? Ready, Needs work, or Gap, and whether you would rely on it in a high-stakes, accountable decision. A short codebook is linked on the page for reference.",
        "Click Submit. Your work saves automatically, so you can do a few at a time and come back.",
    ]))

    S.append(Paragraph("SCOPE AND TIMELINE", H))
    S.append(_bul([
        "24 records in total. About one hour of work, at your own pace, with your place saved as you go.",
        "Completing the full set " + deadline + " is ideal.",
    ]))

    S.append(Paragraph("HOW YOUR INPUT IS CAPTURED AND USED", H))
    S.append(Paragraph("Your per-record reads are recorded exactly as you give them and used, in aggregate, for the "
                       "pilot's pre-registered reliability and accuracy analysis and any resulting write-up. Constructed, "
                       "de-identified records only. Nothing internal, confidential, or tied to your firm or clients is "
                       "involved. You take part in a personal capacity, without cost or compensation.", BODY))

    S.append(Paragraph("RECOGNITION, AND WHAT IT IS NOT", H))
    S.append(_bul([
        "Named as a reviewer on the international expert panel, with your consent and your approval of the exact public wording before it appears.",
        "A certificate of completion, and a written recommendation on request.",
        "Acknowledgment reflects participation only. It is not an endorsement or validation of JRS. Any endorsement is entirely your own decision, on your own timeline, and is never assumed or implied by your taking part.",
        "You may withdraw your name before publication.",
    ]))

    S.append(Paragraph("Phillip Wikes<br/>Creator, Justification Review Standard (JRS)<br/>"
                       "info@jrsstandard.com&nbsp;&nbsp;&middot;&nbsp;&nbsp;jrsstandard.com", SIG))
    S.append(Paragraph("© 2026 Phillip Wikes &middot; Justification Review Standard &middot; confidential", FOOT))
    doc.build(S)
    return out_path


REVIEWERS = [
    {"name": "Alexandria Davis", "location": "Toronto, Canada", "code": "V-AI-31",
     "deadline": "by July 31, 2026",
     "out": "/home/user/jrsstandard.com/research/JRS_Panel_Prospectus_Alexandria_Davis.pdf"},
]

if __name__ == "__main__":
    for r in REVIEWERS:
        print("wrote", build(r["name"], r["location"], r["code"], r["out"], r.get("deadline", "within two to three weeks")))
