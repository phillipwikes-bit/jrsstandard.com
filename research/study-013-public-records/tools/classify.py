#!/usr/bin/env python3
"""Study 013 step 2: rule-based classification under SELECTION_RULE.md.

Labels come only from the EEOC's own ruling words. Writes raw/classified.json.
"""
import json, os, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def norm(t):
    return re.sub(r"\s+", " ", t)


def background(t):
    m = re.search(r"\n\s*BACKGROUND\s*\n(.*?)\n\s*(CONTENTIONS ON APPEAL|STANDARD OF REVIEW|ANALYSIS AND FINDINGS|ANALYSIS|ISSUES? PRESENTED)\s*\n", t, re.S)
    return norm(m.group(1)) if m else ""


def classify(t):
    n = norm(t)
    head = n[:4000]
    tail = n[-6000:]
    r = {}
    r["reconsideration"] = bool(re.search(r"Request No\.|REQUEST FOR RECONSIDERATION", head))
    r["no_hearing_fad"] = bool(re.search(r"did not request a hearing|requested a final (agency )?decision|1614\.110\(b\)", n))
    r["aj_decision"] = bool(re.search(r"1614\.110\(a\)|Administrative Judge \(AJ\) issued|AJ issued a (decision|summary judgment)|final order", n))
    r["dismissal"] = bool(re.search(r"1614\.107|dismiss(ed|al) (of )?(the|Complainant)", head))
    rulings = set(re.findall(r"(?:Commission|we)\s+(AFFIRMS?|VACATES?|REVERSES?|MODIF(?:Y|IES)|REMANDS?)", head + " " + tail))
    r["rulings"] = sorted(rulings)
    r["supp_inv"] = "supplemental investigation" in n.lower()
    r["inadequate"] = bool(re.search(r"inadequate|not (adequately|sufficiently|fully) developed|adequately develop|incomplete record|record is (devoid|insufficient)", n, re.I))
    r["damages_only"] = bool(re.search(r"supplemental investigation (into|on|regarding|concerning|with respect to) (the issue of )?(Complainant.s )?(entitlement to )?compensatory damages", n, re.I))
    aff = any(x.startswith("AFFIRM") for x in rulings)
    vac = any(x.startswith(("VACATE", "REMAND", "REVERSE", "MODIF")) for x in rulings)
    eligible = r["no_hearing_fad"] and not (r["reconsideration"] or r["aj_decision"] or r["dismissal"])
    label, edge = None, False
    if eligible:
        rev = any(x.startswith("REVERSE") for x in rulings)
        if vac and not rev and r["supp_inv"] and r["inadequate"] and not r["damages_only"]:
            label = "GAP"
            edge = aff  # affirmed in part, remanded in part
        elif aff and not vac:
            label = "PASS"
        elif r["damages_only"]:
            label, edge = "PASS", True  # liability decided on the record; remand on damages only
    # Amendment 4: GAP evidence must be the EEOC's own finding, not a party's contention
    m = re.search(r"[^.]{0,200}\b(we find|we conclude|Commission finds|Commission concludes)\b[^.]{0,200}(inadequate|not (adequately|sufficiently|fully) developed|lacks the thoroughness)[^.]{0,250}\.", n, re.I)
    r["evidence"] = m.group(0).strip() if (m and label == "GAP") else ""
    if label == "GAP" and not r["evidence"]:
        label = None
        r["excluded"] = "GAP finding wording not located"
    m2 = re.search(r"[^.]{0,200}Commission\s+AFFIRMS?[^.]{0,200}\.", n)
    if label == "PASS" and m2:
        r["evidence"] = m2.group(0).strip()
    r["eligible"] = eligible
    r["label"] = label
    r["edge"] = edge
    return r


def main():
    data = json.load(open(os.path.join(ROOT, "raw", "candidates.json")))
    out = []
    for c in data["candidates"]:
        p = os.path.join(ROOT, c["text_file"])
        if not os.path.exists(p) or c.get("words", 0) < 200:
            out.append({**c, "label": None, "excluded": "no text"})
            continue
        t = open(p, errors="replace").read()
        r = classify(t)
        bg = background(t)
        out.append({**c, **r, "background_words": len(bg.split())})
    json.dump(out, open(os.path.join(ROOT, "raw", "classified.json"), "w"), indent=1)
    from collections import Counter
    print(Counter((x.get("label"), x.get("edge")) for x in out))
    print("with BACKGROUND >=250 words:", Counter((x.get("label"), x.get("edge")) for x in out if x.get("background_words", 0) >= 250))


if __name__ == "__main__":
    main()
