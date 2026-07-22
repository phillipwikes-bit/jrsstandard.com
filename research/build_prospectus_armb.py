#!/usr/bin/env python3
"""NEUTRAL "Records Review Study" prospectus generator for Arm B candidates.

BLIND-STUDY GUARDRAIL: Arm B candidates get a NEUTRAL one-page overview. NEVER
name JRS, the five-condition method, "reconstructability", or link to the JRS
site content. Personalize name + code only (matches the Jean-Luc / Alex
precedent). The personal reviewer LINK is carried in the accompanying message,
not printed here, to keep the shared PDF domain-light.

Usage:  python3 research/build_prospectus_armb.py
"""
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, HRFlowable
from reportlab.lib.styles import ParagraphStyle

GOLD = colors.Color(122/255, 94/255, 40/255)
INK  = colors.Color(18/255, 18/255, 18/255)
MUT  = colors.Color(90/255, 90/255, 90/255)

TITLE = ParagraphStyle("t", fontName="Times-Bold", fontSize=22, textColor=GOLD,
                       spaceAfter=2, leading=26)
SUB   = ParagraphStyle("s", fontName="Times-Roman", fontSize=11, textColor=MUT,
                       spaceAfter=2, leading=15)
PREP  = ParagraphStyle("p", fontName="Times-Italic", fontSize=12, textColor=INK,
                       spaceAfter=6, leading=16)
H     = ParagraphStyle("h", fontName="Times-Bold", fontSize=12.5, textColor=INK,
                       spaceBefore=12, spaceAfter=4, leading=15)
BODY  = ParagraphStyle("b", fontName="Times-Roman", fontSize=11, textColor=INK,
                       spaceAfter=4, leading=15.5)
FOOT  = ParagraphStyle("f", fontName="Times-Roman", fontSize=9, textColor=MUT,
                       spaceBefore=16, leading=13)


def build(name, code, out_path):
    doc = SimpleDocTemplate(out_path, pagesize=letter,
                            leftMargin=0.9*inch, rightMargin=0.9*inch,
                            topMargin=0.85*inch, bottomMargin=0.7*inch,
                            title="Records Review Study - Overview")
    def rule():
        return HRFlowable(width="100%", thickness=0.8, color=GOLD,
                          spaceBefore=6, spaceAfter=8)
    S = []
    S += [Paragraph("Records Review Study", TITLE),
          Paragraph("Independent Reviewer Panel &middot; Study overview", SUB),
          Paragraph("Prepared for " + name, PREP), rule()]

    S += [Paragraph("About the study", H),
          Paragraph("An independent study in which experienced professionals from "
                    "many countries review a common set of records and give their "
                    "professional judgment. The aim is to understand how "
                    "consistently experienced reviewers assess whether "
                    "administrative and workplace records are adequately supported "
                    "to rely on in a high-stakes, accountable decision.", BODY)]

    S += [Paragraph("What you would do", H),
          Paragraph("Review 24 short records, each about a page. For each one, give "
                    "your professional judgment. Most reviewers finish in about an "
                    "hour, at their own pace, and the tool saves your place if you "
                    "step away.", BODY)]

    S += [Paragraph("What it does not involve", H),
          Paragraph("<b>No payment or honorarium.</b> Participation is entirely "
                    "voluntary.", BODY),
          Paragraph("<b>No confidential, proprietary, or organization-specific "
                    "information.</b> Every record is constructed for the study. You "
                    "never share anything about any organization you work with now "
                    "or have worked with in the past, and there is nothing for you "
                    "to disclose from your side.", BODY)]

    S += [Paragraph("Recognition", H),
          Paragraph("With your consent, and with your approval of the exact wording, "
                    "you are named as a reviewer in any write-up of the study. You "
                    "receive a certificate of completion, a written recommendation "
                    "on request, and a summary of the results.", BODY)]

    S += [Paragraph("Your reviewer access", H),
          Paragraph("Reviewer: <b>" + name + "</b><br/>Reviewer code: <b>" + code +
                    "</b><br/>A personal reviewer link is included in the "
                    "accompanying message. Please use that exact link, as it "
                    "carries your code.", BODY)]

    S += [Paragraph("One request", H),
          Paragraph("Please review each record purely on what is in front of you. "
                    "No preparation is needed, and it works best if you judge the "
                    "records on their own terms.", BODY)]

    S += [rule(),
          Paragraph("Phillip Wikes, Study Lead<br/>"
                    "&copy; 2026 Phillip Wikes &middot; Records Review Study", FOOT)]
    doc.build(S)
    return out_path


CANDIDATES = [
    {"name": "Priyam Dhamankar", "code": "RR-113",
     "out": "/home/user/jrsstandard.com/research/Records_Review_Study_Priyam_Dhamankar.pdf"},
]

if __name__ == "__main__":
    for c in CANDIDATES:
        print("wrote", build(c["name"], c["code"], c["out"]))
