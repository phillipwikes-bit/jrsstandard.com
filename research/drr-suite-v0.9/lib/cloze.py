"""Cloze reconstruction items, frozen from Study 014 (tools/study014.py, cloze_items and cloze_correct), unchanged."""
import re
import anchors_v10 as A


def cloze_items(src):
    sents = re.split(r"(?<=[.!?])\s+(?=[A-Z\"“])", src)
    items = []
    for s in sents:
        m = A.RE_MDY.search(s) or A.RE_MY.search(s)
        if m:
            items.append({"sentence": s.replace(m.group(0), "[MASK]", 1), "type": "date", "answer": sorted(A.dates(m.group(0)))[0]})
        else:
            a = A.RE_ATTR.search(s)
            if a:
                items.append({"sentence": s[:a.start(1)] + "[MASK]" + s[a.end(1):], "type": "attribution", "answer": A._role_norm(a.group(1))})
        if len(items) == 5: break
    return items


def cloze_correct(item, ans):
    if item["type"] == "date":
        return item["answer"] in A.dates(ans)
    return A._role_norm(re.sub(r"[^A-Za-z0-9 ]", "", ans)) == item["answer"]


READER_INSTRUCTION = (
    "Using only the document below, fill each [MASK] in the numbered sentences. Answer with the exact value: a date "
    "(for example March 3, 2018) or a person label (for example S1, RMO2, CW3 or Complainant). If the document does "
    "not state it, answer \"not stated\". Return one answer per sentence, in order.")
