#!/usr/bin/env python3
"""Records Review Study prospectus generator (Arm B) - CANONICAL format.

Faithful clone of the issued prospectus (reference: Jean-Luc Adade, RR-110).
The canonical post-agreement prospectus DOES name "Creator, Justification
Review Standard (JRS)" and frames the study as "AI-assisted records"; the
method blind for the no-JRS arm is preserved on the review page and by the
"do not research the project first" instruction, not by hiding JRS here.
Personalize name + location + code only. To issue one, add a CANDIDATES row.

Usage:  python3 research/build_prospectus_armb.py
"""
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer, Table,
                                TableStyle, ListFlowable, ListItem)
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
    url = "www.jrsstandard.com/ai-records-arm-b.html?code=" + code
    doc = SimpleDocTemplate(out_path, pagesize=letter,
                            leftMargin=0.95*inch, rightMargin=0.95*inch,
                            topMargin=0.65*inch, bottomMargin=0.5*inch,
                            title="Records Review Study")
    S = []
    S.append(Paragraph("Records Review Study", TITLE))
    S.append(Paragraph("A study of how experienced professionals judge AI-assisted records, read on their own.", TAG))
    S.append(Paragraph("<b>Prepared for:</b>&nbsp; " + name + " (" + location + ")", LBL))
    S.append(Paragraph("<b>Proposed role:</b>&nbsp; Independent reviewer (your own professional judgment)", LBL))
    S.append(Paragraph("A note on the invitation: it would be a privilege to have you take part. What this study "
                       "needs is exactly your independent, experienced judgment on a set of records, nothing more. "
                       "There is no method to learn and no material to study beforehand.", NOTE))

    box = Table([[[Paragraph("Everything is done at one link. About an hour total, and you can stop and resume:", BOXH),
                   Paragraph(url, BOXL)]]], colWidths=[6.1*inch])
    box.setStyle(TableStyle([("BOX", (0,0), (-1,-1), 0.8, GOLD),
                             ("LEFTPADDING",(0,0),(-1,-1),10), ("RIGHTPADDING",(0,0),(-1,-1),10),
                             ("TOPPADDING",(0,0),(-1,-1),6), ("BOTTOMPADDING",(0,0),(-1,-1),6)]))
    S.append(box)

    S.append(Paragraph("PURPOSE", H))
    S.append(Paragraph("This study looks at how experienced professionals evaluate AI-assisted records. As AI is used "
                       "to draft more records, some read as complete and professional while others may not be fully "
                       "supported by what is on the page. We are gathering the independent judgments of experienced "
                       "reviewers on a balanced set of such records.", BODY))

    S.append(Paragraph("WHAT YOU WILL DO (ALL ONLINE)", H))
    S.append(_num([
        "Open your personalized link. Your participant code is already filled in, so there is nothing to set up.",
        "You will see 24 short records, unlabeled and in random order.",
        "For each record, give your judgment as prompted on the page, based on the record alone.",
        "Click Submit. Your work saves automatically, so you can do a few at a time and come back. Nothing to download, nothing to email.",
    ]))

    S.append(Paragraph("PLEASE USE YOUR OWN JUDGMENT", H))
    S.append(Paragraph("There is nothing to prepare and nothing to read in advance. Your own unaided professional "
                       "read of each record is exactly what the study is measuring, so please complete it directly "
                       "rather than researching the project first. Judge the record itself, not the topic and not "
                       "whether the underlying decision was right.", BODY))

    S.append(Paragraph("SCOPE AND TIMELINE", H))
    S.append(_bul([
        "24 records in total. About one hour of work. A first batch of six takes about fifteen to twenty minutes; the full set is roughly an hour.",
        "Completing the full set " + deadline + " is ideal.",
    ]))

    S.append(Paragraph("CONFIDENTIALITY AND USE", H))
    S.append(Paragraph("Constructed, de-identified records only. Nothing internal or confidential, and nothing tied "
                       "to your firm or clients. You take part in a personal capacity, without cost or compensation. "
                       "Your responses are recorded exactly as given and used, in aggregate, for the study's analysis "
                       "and any resulting write-up.", BODY))

    S.append(Paragraph("RECOGNITION AND ACKNOWLEDGMENT", H))
    S.append(_bul([
        "A named contributor role on the project, credited as a reviewer (with your consent).",
        "A certificate of contribution, issued after your completion is confirmed.",
        "A written LinkedIn recommendation describing your contribution, on request.",
        "Featured by name among the international panel of professionals in any publication or write-up, with your permission.",
    ]))

    S.append(Paragraph("Phillip Wikes<br/>Creator, Justification Review Standard (JRS)<br/>"
                       "info@jrsstandard.com&nbsp;&nbsp;&middot;&nbsp;&nbsp;jrsstandard.com", SIG))
    S.append(Paragraph("© 2026 Phillip Wikes &middot; Records Review Study &middot; confidential", FOOT))
    doc.build(S)
    return out_path


CANDIDATES = [
    {"name": "Priyam Dhamankar", "location": "India", "code": "RR-113",
     "out": "/home/user/jrsstandard.com/research/Records_Review_Study_Priyam_Dhamankar.pdf"},
    {"name": "MacKenzie McCowan", "location": "Australia, Sydney", "code": "RR-114",
     "deadline": "by July 31, 2026",
     "out": "/home/user/jrsstandard.com/research/Records_Review_Study_MacKenzie_McCowan.pdf"},
    {"name": "Amir Mahdi Moosavi", "location": "Iran, Hamedan", "code": "RR-115",
     "deadline": "by July 31, 2026",
     "out": "/home/user/jrsstandard.com/research/Records_Review_Study_Amir_Mahdi_Moosavi.pdf"},
    {"name": "Dr. Eric J. W. Orlowski", "location": "Singapore", "code": "RR-116",
     "deadline": "by July 31, 2026",
     "out": "/home/user/jrsstandard.com/research/Records_Review_Study_Eric_Orlowski.pdf"},
    {"name": "Alexandria Davis", "location": "Toronto, Canada", "code": "RR-117",
     "deadline": "by July 31, 2026",
     "out": "/home/user/jrsstandard.com/research/Records_Review_Study_Alexandria_Davis.pdf"},
    {"name": "Fedilia (Faye) Sum", "location": "Canada, Markham", "code": "RR-118",
     "deadline": "by July 31, 2026",
     "out": "/home/user/jrsstandard.com/research/Records_Review_Study_Faye_Sum.pdf"},
    {"name": "Kebuya Nelson R", "location": "Canada, Toronto", "code": "RR-119",
     "deadline": "by July 31, 2026",
     "out": "/home/user/jrsstandard.com/research/Records_Review_Study_Kebuya_Nelson.pdf"},
    {"name": "Madeline Browne", "location": "Australia, Sydney", "code": "RR-120",
     "deadline": "by July 31, 2026",
     "out": "/home/user/jrsstandard.com/research/Records_Review_Study_Madeline_Browne.pdf"},
    {"name": "Dr Sharon Licqurish", "location": "Australia, Melbourne", "code": "RR-121",
     "deadline": "by July 31, 2026",
     "out": "/home/user/jrsstandard.com/research/Records_Review_Study_Sharon_Licqurish.pdf"},
    {"name": "Reshma Devi", "location": "Australia", "code": "RR-122",
     "deadline": "by July 31, 2026",
     "out": "/home/user/jrsstandard.com/research/Records_Review_Study_Reshma_Devi.pdf"},
    {"name": "Greg Searle", "location": "Australia, Brisbane", "code": "RR-123",
     "deadline": "by July 31, 2026",
     "out": "/home/user/jrsstandard.com/research/Records_Review_Study_Greg_Searle.pdf"},
    {"name": "Adesh Sharma", "location": "Australia, Melbourne", "code": "RR-124",
     "deadline": "by July 31, 2026",
     "out": "/home/user/jrsstandard.com/research/Records_Review_Study_Adesh_Sharma.pdf"},
    {"name": "Muhammad Dauda", "location": "Nigeria", "code": "RR-125",
     "deadline": "by July 31, 2026",
     "out": "/home/user/jrsstandard.com/research/Records_Review_Study_Muhammad_Dauda.pdf"},
]

if __name__ == "__main__":
    for c in CANDIDATES:
        print("wrote", build(c["name"], c["location"], c["code"], c["out"], c.get("deadline", "within two to three weeks")))
