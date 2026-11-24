"""Build the round-2 final manuscript from the editor's edited file.

Usage: python3 -I build_final.py <editor_edited.docx> <out.docx>
Text-level replacements keep the surrounding run formatting; new paragraphs copy
the formatting of a neighbouring paragraph of the same kind.
"""
import copy
import sys

import docx
from docx.opc.constants import RELATIONSHIP_TYPE as RT
from docx.oxml.ns import qn

SRC, OUT = sys.argv[1], sys.argv[2]
d = docx.Document(SRC)
P = list(d.paragraphs)  # indices as in the editor's file


def runs_of(p):
    return [r for r in p._p.iter(qn("w:r")) if r.find(qn("w:t")) is not None]


def rtext(r):
    return "".join(t.text or "" for t in r.findall(qn("w:t")))


def set_rtext(r, s):
    ts = r.findall(qn("w:t"))
    for t in ts[1:]:
        r.remove(t)
    ts[0].text = s
    ts[0].set(qn("xml:space"), "preserve")


def plain_rpr(p):
    for r in runs_of(p):
        if r.getparent().tag != qn("w:hyperlink"):
            rp = r.find(qn("w:rPr"))
            return copy.deepcopy(rp) if rp is not None else None
    return None


def new_run(text, rpr, italic=False, highlight=False):
    r = d.element.makeelement(qn("w:r"), {})
    if rpr is not None:
        rp = copy.deepcopy(rpr)
        for tag in ("w:i", "w:iCs", "w:highlight", "w:rStyle"):
            for e in rp.findall(qn(tag)):
                rp.remove(e)
    else:
        rp = d.element.makeelement(qn("w:rPr"), {})
    if italic:
        rp.append(d.element.makeelement(qn("w:i"), {}))
    if highlight:
        h = d.element.makeelement(qn("w:highlight"), {})
        h.set(qn("w:val"), "yellow")
        rp.append(h)
    r.append(rp)
    t = d.element.makeelement(qn("w:t"), {})
    t.text = text
    t.set(qn("xml:space"), "preserve")
    r.append(t)
    return r


def top_level(el, p):
    while el.getparent() is not p._p:
        el = el.getparent()
    return el


def replace(p, old, new):
    rs = runs_of(p)
    texts = [rtext(r) for r in rs]
    full = "".join(texts)
    assert full.count(old) == 1, (old[:60], full.count(old), full[:120])
    a = full.index(old)
    b = a + len(old)
    pos = 0
    hit = []
    for r, t in zip(rs, texts):
        s, e = pos, pos + len(t)
        if e > a and s < b:
            hit.append((r, s, t))
        pos = e
    r0, s0, t0 = hit[0]
    rl, sl, tl = hit[-1]
    prefix = t0[: a - s0]
    suffix = tl[b - sl:]
    base = plain_rpr(p)
    anchor = top_level(r0, p)
    if r0.getparent().tag == qn("w:hyperlink"):
        # keep the link only if the whole link is outside the replaced span
        pass
    for r, _, _ in hit[1:]:
        r.getparent().remove(r)
    set_rtext(r0, prefix)
    ins = new_run(new, base)
    anchor.addnext(ins)
    if suffix:
        if r0 is rl:
            ins.addnext(new_run(suffix, base))
        else:
            pass  # rl was removed with its text; restore suffix
    if suffix and r0 is not rl:
        ins.addnext(new_run(suffix, base))
    # drop emptied runs and hyperlinks
    if not prefix:
        par = r0.getparent()
        par.remove(r0)
        if par.tag == qn("w:hyperlink") and not "".join(
                x.text or "" for x in par.iter(qn("w:t"))):
            par.getparent().remove(par)
    for h in list(p._p.findall(qn("w:hyperlink"))):
        if not "".join(x.text or "" for x in h.iter(qn("w:t"))):
            p._p.remove(h)


def set_text(p, segments):
    """Replace all content runs of p with segments [(text, italic, highlight)]."""
    base = plain_rpr(p)
    for el in list(p._p):
        if el.tag in (qn("w:r"), qn("w:hyperlink"), qn("w:ins"), qn("w:del"),
                      qn("w:commentRangeStart"), qn("w:commentRangeEnd")):
            p._p.remove(el)
    for seg in segments:
        text, it, hl = (seg + (False, False))[:3] if isinstance(seg, tuple) else (seg, False, False)
        p._p.append(new_run(text, base, it, hl))


def insert_after(anchor_el, like_p, segments):
    newp = copy.deepcopy(like_p._p)
    anchor_el.addnext(newp)
    np_ = docx.text.paragraph.Paragraph(newp, like_p._parent)
    set_text(np_, segments)
    return np_


# ---------- strip editor comments (answered in the response letter) ----------
body = d.element.body
for tag in ("w:commentRangeStart", "w:commentRangeEnd"):
    for e in list(body.iter(qn(tag))):
        e.getparent().remove(e)
for r in list(body.iter(qn("w:r"))):
    if r.find(qn("w:commentReference")) is not None:
        r.getparent().remove(r)
for rid, rel in list(d.part.rels.items()):
    if "comments" in rel.reltype.lower():
        d.part.drop_rel(rid)

# ---------- front matter: degree placeholder ----------
t0 = d.tables[0]
done = False
for row in t0.rows:
    for c in row.cells:
        for p in c.paragraphs:
            if not done and "PGDM" in p.text:
                full = "".join(rtext(r) for r in runs_of(p))
                replace(p, "PGDM", "[ACADEMIC DEGREE]")
                for r in runs_of(p):
                    if "[ACADEMIC DEGREE]" in rtext(r):
                        rp = r.find(qn("w:rPr"))
                        h = d.element.makeelement(qn("w:highlight"), {})
                        h.set(qn("w:val"), "yellow")
                        rp.append(h)
                done = True
assert done

# ---------- Reviewer 1: Introduction ----------
A1 = ("When a decision record does not show the basis for its conclusion, the cost of finding it out does not disappear; it moves. "
      "An employee who is dismissed, a claimant who is refused a benefit or a person named in an investigation must first establish what the decision rested on before any challenge can be made. "
      "Research on administrative burden describes these learning, compliance and psychological costs of dealing with the state and shows that they are distributed unevenly (Moynihan et al., 2015). "
      "Herd and Moynihan (2018) argue that such burdens are often the product of administrative choices rather than unavoidable features of a programme, and Christensen et al. (2020) find that they weigh most on people with fewer cognitive resources to meet them. "
      "An unsupported record is one such choice: it shifts the work of reconstruction from the institution that made the decision to the person affected by it, and to the appeal bodies, auditors and courts that must later rebuild it. "
      "Whether human review catches these records before they are finalised is therefore a question about who bears these costs.")
insert_after(P[6]._p, P[6], [A1])

# ---------- Reviewer 1: Literature Review subsection ----------
A2a = ("Administrative burden research shifts attention from the content of a decision to the costs that people incur in dealing with it. "
       "Moynihan et al. (2015) distinguish learning costs, such as finding out how a decision was reached, compliance costs and psychological costs, and show that these costs can determine whether eligible people obtain what they are entitled to. "
       "Herd and Moynihan (2018) document how such burdens are created and redistributed by administrative practice, and Christensen et al. (2020) show that they fall most heavily on people with fewer cognitive resources. "
       "Decision records are one place where these costs are set. A record that states its evidence and reasoning lowers the learning cost for everyone who later needs to understand the decision; "
       "a record that states only a conclusion raises it, and the person with the most at stake, and often the fewest resources, is the one who must pay it.")
A2b = ("Institutions face a related capacity problem. Organisations that adopt drafting tools to save staff time must still check the output, and smaller bodies may be the least able to do so. "
       "Green (2022) argues that policies requiring human oversight of government algorithms often assume a capacity for meaningful review that the overseers do not have. "
       "Studies of human–AI decision making find that people may give algorithmic advice too much weight or follow it selectively (Alon-Barkat & Busuioc, 2023; Logg et al., 2019). "
       "None of these studies measures whether reviewers recognise an unsupported conclusion in a finished record, which is the precondition the present study tests.")
h = insert_after(P[17]._p, P[15], ["Documentation Quality and the Distribution of Costs"])
pa = insert_after(h._p, P[17], [A2a])
insert_after(pa._p, P[17], [A2b])

# ---------- Editor 7: references from one conference and one author ----------
replace(P[7], "The risks of fluent but unsupported generated text are discussed by Bender et al. (2021) and Ji et al. (2023). Documentation practices for AI systems are examined by Gebru et al. (2021) and Raji et al. (2020).",
        "The risks of fluent but unsupported generated text are discussed by Ji et al. (2023). Documentation practices for AI systems are examined by Gebru et al. (2021) and Mökander et al. (2021).")
replace(P[19], "Cobbe et al. (2021) address the design of systems that can be reviewed after a decision.",
        "Busuioc (2021) argues that accountability for algorithmic decisions depends on whether their basis can be explained to, and examined by, a forum.")
replace(P[20], "Model cards describe a model’s intended applications and performance (Mitchell et al., 2019); datasheets document dataset provenance (Gebru et al., 2021); and internal algorithmic audits examine the system development lifecycle (Raji et al., 2020).",
        "Supplier declarations describe an AI service’s intended uses and performance (Arnold et al., 2019); datasheets document dataset provenance (Gebru et al., 2021); and ethics-based audits examine automated decision-making systems against stated principles (Mökander et al., 2021).")

# ---------- Corpus: point to the item-level analysis ----------
replace(P[42], "The present aggregate results cannot separate those approaches.",
        "The aggregate results cannot separate those approaches; the item-level comparison in the Results examines how far agreement followed these features.")

# ---------- Reviewer 2: third reference check ----------
replace(P[44], "The recorded process differs from the two-check procedure in the protocol.",
        "The recorded process differs from the two-check procedure in the protocol: the three checks were run on 6 July 2026, before any accuracy analysis, and the reason for running a third check was not recorded.")

# ---------- Reviewer 2: 510 rows ----------
replace(P[49], "(510 stored rows, of which 384 are the latest reviewer-by-record classifications)",
        "(510 stored rows: 384 latest reviewer-by-record classifications, 125 earlier submissions replaced by a later answer, and one administrative marker row, which was excluded)")

# ---------- Reviewer 2: automated evaluation removed ----------
replace(P[53], ", the 113 submitted structured-review determinations and the stored results of the repeated automated evaluations were",
        " and the 113 submitted structured-review determinations were")
for idx in (87, 54):
    P[idx]._p.getparent().remove(P[idx]._p)
replace(P[120], ", to perform the automated reference checks and to run the repeated automated evaluations,",
        " and to perform the automated reference checks,")
replace(P[120], "final revisions on 10 November 2026 were drafted with Claude Fable 5.2.",
        "final revisions on 10 November 2026 were drafted with Claude Fable 5.2, and the revisions of 24 November 2026 were drafted with Anthropic Claude (Claude Opus 5.5).")

# ---------- Reviewer 2: single-rated records ----------
replace(P[57], "Those responses cover 15 records, although only 10 were rated by more than one person.",
        "Those responses cover 15 records, although only 10 were rated by more than one person. The five records rated by a single person, all by open-enrolment raters, carry no information about agreement and were excluded from AC1, Fleiss’ kappa and Krippendorff’s alpha; the invited-rater estimates rest on 10 records and 36 determinations, and the open-enrolment estimates on 10 records and 63 determinations.")
replace(P[57], "bootstrap intervals resample records (20,000 resamples).",
        "bootstrap intervals resample records (20,000 resamples). For open-enrolment raters the record bootstrap resampled all 15 records; restricted to the 10 multiply rated records, it gives 0.300 to 0.886.")
replace(P[82], "Open indicates open-enrolment raters.",
        "Open indicates open-enrolment raters. Records with a single rater are excluded from all coefficients: invited, 10 records and 36 determinations; open enrolment, 10 records and 63 of 68 determinations.")

# ---------- Reviewer 2: surface features (Results) ----------
C5 = ("The two classes of record differ in surface features. Eleven of the 12 supported records contain at least one numerical token, and none of the 12 unsupported records does; supported records are also longer (mean 66.4 against 45.3 words). "
      "A rule that classified every record containing a number as supported would therefore have matched the reference on 23 of 24 records (95.8%), and a rule based on length (50 words or more) on 21 of 24 (87.5%), both above the panel’s mean agreement of 83.9%. "
      "Reviewer agreement did not, however, follow these features. Among supported records, item-level agreement was unrelated to the number of numerical tokens (Spearman’s ρ = 0.17) or to length (ρ = 0.02), and the one supported record without a numerical token (R10) was matched by 12 of the 16 reviewers. "
      "Among unsupported records, agreement was weakly related to length (ρ = 0.26). With 12 records per class these correlations are imprecise, and the corpus cannot separate recognition of evidentiary support from recognition of the features that usually accompany it.")
h = insert_after(P[77]._p, P[65], ["Surface Features of the Records"])
insert_after(h._p, P[77], [C5])

# ---------- Reviewer 2: conditions of the panel (Discussion) ----------
C6 = ("The conditions of the panel may have influenced its performance. Reviewers were recruited from the first author’s professional network and offered a certificate, acknowledgement by name and, on request, a professional recommendation; one reviewer was told that co-authorship might be considered. "
      "They knew the set was balanced, could consult the codebook, saw the records in the same order and could resubmit answers. "
      "Knowing the balance may have led reviewers to aim for an even split, and familiarity with the framework may have raised agreement with a reference built on the same framework; both would raise agreement relative to routine practice. "
      "An order or learning effect was not apparent: agreement was 83.9% on both the first 12 and the last 12 records and was unrelated to position (ρ = −0.04). "
      "The professional groups contained three to eight people each, so differences between them are not interpreted.")
insert_after(P[97]._p, P[97], [C6])

# ---------- H1 interpretation and limitations ----------
replace(P[104], "not that reviewers recognised evidentiary support independently of surface cues.",
        "not that reviewers recognised evidentiary support independently of surface cues; a rule based on the presence of a number alone would have matched the reference on 23 of 24 records.")
replace(P[108], "so expectancy, order and learning effects cannot be excluded.",
        "so expectancy and learning effects cannot be excluded, although agreement showed no trend across the fixed order.")

# ---------- Editor 4 and 6: contributions and conflicts ----------
set_text(P[114], [("Conceptualisation: P. W., U. H.; data curation: P. W.; formal analysis: P. W.; investigation: P. W.; methodology: P. W., U. H.; project administration: P. W.; resources: P. W.; validation: U. H.; visualisation: P. W.; writing – original draft: P. W., U. H.; writing – review & editing: P. W., U. H. "
                    "P. W. conceived the review framework and the research questions, constructed the record set, recruited the participants and conducted the analyses. "
                    "U. H. conceived and designed the study’s validation and reliability component: the reference-panel design, the use of Gwet’s AC1 as the primary agreement coefficient with Fleiss’ kappa and Krippendorff’s alpha as secondary measures to address the kappa paradox, and the decision thresholds and analysis plan for H2, recorded on 6 July 2026 before any analysis. "
                    "U. H. wrote the methodological rationale for the reliability analysis on which the Reliability Analysis subsection is based, and critically reviewed and approved the manuscript.",)])
replace(P[116], "are described in the Participants subsection.",
        "are described in the Participants subsection. U. H. declares no conflict of interest. Neither author has further interests to declare.")

# ---------- Editor 5: acknowledgements and consent ----------
NAMES = ["Andres Lage Freire", "Andrey Ekhmenin", "Andrzej Skulski", "Dr. Gabriela Bar", "Dr. Nitin Deshpande",
         "Franciscus C. Schouten", "Gabriela Cortez", "Hekim Colpan", "Jake McDonough", "Nigel Hee", "Olabanji Lawal",
         "Rahul Potdar", "Saurabh Nanda", "Sidharth Borah", "Stacyann Young", "SungSoo In"]
set_text(P[118], [("The authors thank the reviewers and raters who took part in this study and confirmed in writing that they wished to be acknowledged by name: "
                    + "; ".join(NAMES) + ". "
                    "The 24 participant codes belong to 21 people, because three invited raters also served on the detection panel; the 16 people named here are those of the 21 who elected to be named, and the others are not named. Open-enrolment raters took part anonymously. "
                    "Stacyann Young, first author of a separate public-records study, took part as an invited rater in the five-condition reliability exercise and did not take part in the detection panel. "
                    "Generative artificial intelligence tools were used as described in the Statement on the Use of AI Tools; artificial intelligence does not meet the criteria for authorship.",)])
set_text(P[124], [("Ethical approval was not obtained, and no exemption was sought. The authors are independent researchers without an institutional affiliation and therefore without access to an institutional review board or ethics committee. "
                    "The study involved adult professionals giving professional judgements about wholly synthetic records that contain no real person’s data; no sensitive personal data were collected, and results are reported only in aggregate. "
                    "Participation in both exercises was voluntary and unpaid. Each of the 16 detection-panel reviewers and each invited rater was invited individually in writing, by LinkedIn message or, in one case, by email, with a description of the purpose of the study and the task, and took part through a personalised link under a participant code; the corresponding author holds this correspondence. "
                    "Open-enrolment raters responded to a public invitation that described the task and its purpose and took part anonymously; no names or contact details were collected from them. "
                    "Neither data-collection page presented a separate consent form, so written informed consent was not obtained from every participant before participation; agreement to take part was given by taking part after the written invitation. "
                    "After data collection, coded participants were invited to complete an electronic contributor confirmation that recorded separate elections for research use of their contributions and for acknowledgement by name; 18 of the 24 coded participants completed it, and all of them permitted research use. "
                    "The responses of participants who did not complete the confirmation are included on the basis of their participation after the written invitation; they are reported only in aggregate and are not named. "
                    "Every person named in the Acknowledgements elected to be named.",)])

# ---------- References ----------
REF_BY_START = {}
for p in d.paragraphs:
    for key in ("Bender, E. M.", "Cobbe, J.", "Mitchell, M.", "Raji, I. D.", "Ananny, M.", "Buçinca, Z.", "Byrt, T.",
                "Hayward, R. A.", "Mashaw, J. L.", "Logg, J. M.", "Hutchinson, A."):
        if p.text.startswith(key):
            REF_BY_START[key] = p
assert len(REF_BY_START) == 11, REF_BY_START.keys()
model = REF_BY_START["Ananny, M."]
link_rpr = None
for r in model._p.iter(qn("w:r")):
    if r.getparent().tag == qn("w:hyperlink"):
        link_rpr = copy.deepcopy(r.find(qn("w:rPr")))
        break


def add_ref(after_p, segments, url):
    newp = copy.deepcopy(model._p)
    after_p._p.addnext(newp)
    np_ = docx.text.paragraph.Paragraph(newp, model._parent)
    set_text(np_, segments + [(" ", False, False)])
    rid = d.part.relate_to(url, RT.HYPERLINK, is_external=True)
    hl = d.element.makeelement(qn("w:hyperlink"), {})
    hl.set(qn("r:id"), rid)
    r = d.element.makeelement(qn("w:r"), {})
    if link_rpr is not None:
        r.append(copy.deepcopy(link_rpr))
    t = d.element.makeelement(qn("w:t"), {})
    t.text = "[CrossRef]"
    r.append(t)
    hl.append(r)
    newp.append(hl)
    return np_


I = True
add_ref(REF_BY_START["Ananny, M."], [("Arnold, M., Bellamy, R. K. E., Hind, M., Houde, S., Mehta, S., Mojsilović, A., Nair, R., Natesan Ramamurthy, K., Olteanu, A., Piorkowski, D., Reimer, D., Richards, J., Tsay, J., & Varshney, K. R. (2019). FactSheets: Increasing trust in AI services through supplier’s declarations of conformity. ",), ("IBM Journal of Research and Development, 63", I), ("(4/5), 6:1–6:13.",)], "https://doi.org/10.1147/JRD.2019.2942288")
add_ref(REF_BY_START["Buçinca, Z."], [("Busuioc, M. (2021). Accountable artificial intelligence: Holding algorithms to account. ",), ("Public Administration Review, 81", I), ("(5), 825–836.",)], "https://doi.org/10.1111/puar.13293")
add_ref(REF_BY_START["Byrt, T."], [("Christensen, J., Aarøe, L., Baekgaard, M., Herd, P., & Moynihan, D. P. (2020). Human capital and administrative burden: The role of cognitive resources in citizen–state interactions. ",), ("Public Administration Review, 80", I), ("(1), 127–136.",)], "https://doi.org/10.1111/puar.13134")
add_ref(REF_BY_START["Hayward, R. A."], [("Herd, P., & Moynihan, D. P. (2018). ",), ("Administrative burden: Policymaking by other means", I), (". Russell Sage Foundation.",)], "https://doi.org/10.7758/9781610448789")
mk = add_ref(REF_BY_START["Mashaw, J. L."], [("Mökander, J., Morley, J., Taddeo, M., & Floridi, L. (2021). Ethics-based auditing of automated decision-making systems: Nature, scope, and limitations. ",), ("Science and Engineering Ethics, 27", I), ("(4), Article 44.",)], "https://doi.org/10.1007/s11948-021-00319-4")
add_ref(mk, [("Moynihan, D., Herd, P., & Harvey, H. (2015). Administrative burden: Learning, psychological, and compliance costs in citizen–state interactions. ",), ("Journal of Public Administration Research and Theory, 25", I), ("(1), 43–69.",)], "https://doi.org/10.1093/jopart/muu009")
for key in ("Bender, E. M.", "Cobbe, J.", "Mitchell, M.", "Raji, I. D."):
    el = REF_BY_START[key]._p
    el.getparent().remove(el)

# Mashaw link moved
for rid, rel in d.part.rels.items():
    if rel.reltype == RT.HYPERLINK and "yalebooks.yale.edu/9780300034035" in rel.target_ref:
        rel._target = "https://yalebooks.yale.edu/book/9780300034035/bureaucratic-justice/"

d.save(OUT)
print("saved", OUT)
