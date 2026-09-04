#!/usr/bin/env python3
"""Detect AI writing fingerprints in a manuscript.

WHY THIS IS NOT A STYLE CHECKER. The risk is specific: an editor at a compliance
trade outlet reads AI-drafted prose all day, and the article's own subject is
AI-assisted documentation. Prose that reads as machine-generated undercuts the
argument by example. This looks for the tells that actually give a model away,
not for general infelicity.

THREE FAMILIES, BECAUSE THEY FAIL DIFFERENTLY.

  LEXICAL   Words and phrases that appear far more often in model output than in
            professional prose. Cheap to find, cheap to fix.
  STRUCTURAL The real tell. Models produce a characteristic rhythm: tricolons,
            "not X, but Y" antithesis, uniform sentence length, and paragraphs
            that all run the same span. A piece can be clean of every banned
            word and still read as generated because of this.
  HOUSE     research/CLAUDE.md section III.7 bans four patterns in this
            codebase's prose. They are checked here too.

THE AUTHOR OF THIS SCRIPT WROTE SOME OF THE PROSE IT AUDITS. The antithesis
count in particular is a construction this assistant overuses, so it is measured
rather than assumed absent.

    python3 scripts/audit_ai_fingerprints.py FILE.md
"""
import io
import os
import re
import statistics
import sys

# (label, pattern, why it reads as generated)
LEXICAL = [
    ("delve", r"\bdelv(e|ing|es)\b", "near-exclusive to model output"),
    ("tapestry", r"\btapestry\b", "same"),
    ("landscape (figurative)", r"\b(evolving|changing|shifting|complex) landscape\b", "stock model metaphor"),
    ("realm", r"\brealm of\b", "stock model metaphor"),
    ("navigate (figurative)", r"\bnavigat(e|ing) the\b", "stock model verb"),
    ("leverage (verb)", r"\bleverag(e|ing)\b", "consultant-model register"),
    ("robust", r"\brobust\b", "model-favoured intensifier"),
    ("seamless", r"\bseamless(ly)?\b", "same"),
    ("underscore", r"\bunderscor(e|es|ing)\b", "same"),
    ("it is important to note", r"important to (note|remember|understand)", "explicit model filler"),
    ("in today's", r"in today's\b", "stock model opener"),
    ("rapidly evolving", r"rapidly (evolving|changing)", "same"),
    ("moreover/furthermore", r"\b(moreover|furthermore)\b", "model connective"),
    ("crucial/pivotal/vital", r"\b(crucial|pivotal|vital)\b", "model intensifier"),
    ("comprehensive/holistic", r"\b(comprehensive|holistic)\b", "same"),
    ("myriad/plethora", r"\b(myriad|plethora)\b", "same"),
    ("testament to", r"testament to\b", "stock model praise"),
    ("serves as a", r"serves as a\b", "model copula padding"),
    ("plays a role", r"plays? an? (key |critical |important )?role", "same"),
    ("at the end of the day", r"at the end of the day", "filler"),
    ("that said", r"\bthat said\b", "model pivot"),
]

HOUSE = [
    ("em dash in prose", r"—", "CLAUDE.md III.7: replace with a colon or parenthetical"),
    ("Designed for [audience]", r"[Dd]esigned for \w+", "CLAUDE.md III.7: AI fingerprint"),
    ("frequently as filler", r"\bfrequently\b", "CLAUDE.md III.7: use 'often' or restructure"),
    ("no policy change required", r"no policy change required", "CLAUDE.md III.7"),
]

# Structural constructions, counted rather than banned. A few are good writing;
# a density of them is the fingerprint.
# COUNTED SENTENCE BY SENTENCE, NOT BY OVERLAPPING REGEX. The first version of
# this section used three patterns whose matches overlapped on the same
# sentences, so a deduplicated print showed 3 where the true count was 6. An
# undercount here is worse than no check: it certifies as clean the one
# construction most likely to give a model away.
STRUCTURAL = [
    ("antithesis: 'not X, but Y'",
     r"\bnot\b[^.,]{3,60},\s+but\b"),
    ("tricolon, three commas then 'and'",
     r"\b\w+,\s+\w+[^.]{0,40},\s+and\s+\w+"),
    ("'not only ... but also'", r"not only\b[^.]{3,80}but also"),
    ("'isn't just ... it's'", r"n't just\b[^.]{3,60}it'?s\b"),
    ("'more than just'", r"more than just\b"),
    ("rhetorical question", r"\?\s"),
    ("colon-led explanation", r":\s+[a-z]"),
]


def sentences(text):
    body = re.sub(r"^#.*$", "", text, flags=re.M)
    body = re.sub(r"[*`_]", "", body)
    return [s.strip() for s in re.split(r"(?<=[.!?])\s+", re.sub(r"\s+", " ", body))
            if len(s.strip()) > 12]


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        return 2
    path = sys.argv[1]
    text = io.open(path, encoding="utf-8").read()
    sents = sentences(text)
    words = len(re.sub(r"[#*`_]", "", text).split())
    findings = []

    print("FILE: %s   %d words, %d sentences" % (os.path.basename(path), words, len(sents)))
    print()
    print("LEXICAL TELLS")
    lex = 0
    for label, pat, why in LEXICAL:
        hits = re.findall(pat, text, re.I)
        if hits:
            lex += len(hits)
            findings.append("%s x%d (%s)" % (label, len(hits), why))
            print("  %-28s %d   %s" % (label, len(hits), why))
    if not lex:
        print("  none of %d patterns present" % len(LEXICAL))
    print()

    print("HOUSE RULES, CLAUDE.md section III.7")
    house = 0
    for label, pat, why in HOUSE:
        hits = re.findall(pat, text)
        print("  %-28s %d   %s" % (label, len(hits), why if hits else ""))
        if hits:
            house += len(hits)
            findings.append("%s x%d" % (label, len(hits)))
    print()

    print("STRUCTURAL RHYTHM, counted not banned")
    # The antithesis is counted over sentence pairs so a single construction is
    # counted once, however many patterns happen to match it.
    anti = 0
    for i, s_ in enumerate(sents):
        split = (re.search(r"\b(is|are|was|were)\s+not\b", s_)
                 and i + 1 < len(sents) and re.match(r"^It is\b", sents[i + 1]))
        same = re.search(r"\bis not\b[^.]{3,90}\.\s*It is\b", s_)
        if split or same:
            anti += 1
    print("  %-34s %2d   %.1f per 1,000 words"
          % ("antithesis: 'not X. It is Y.'", anti, 1000.0 * anti / words))
    if 1000.0 * anti / words > 2.5:
        findings.append("antithesis 'not X. It is Y.' x%d, %.1f per 1,000 words, "
                        "which reads as generated" % (anti, 1000.0 * anti / words))
    neg = sum(1 for s_ in sents
              if re.search(r"\b(is|are|was|were|does|do|may|can)\s+not\b", s_))
    print("  %-34s %2d   %.1f%% of sentences"
          % ("any negation-correction", neg, 100.0 * neg / len(sents)))
    for label, pat in STRUCTURAL:
        hits = re.findall(pat, text)
        per_k = 1000.0 * len(hits) / words if words else 0
        print("  %-34s %2d   %.1f per 1,000 words" % (label, len(hits), per_k))
    print()

    lens = [len(s.split()) for s in sents]
    paras = [p for p in re.split(r"\n\s*\n", re.sub(r"^#.*$", "", text, flags=re.M))
             if len(p.split()) > 12]
    plens = [len(p.split()) for p in paras]
    print("BURSTINESS, the strongest single signal")
    print("  sentence length  mean %.1f  median %d  stdev %.1f  min %d  max %d"
          % (statistics.mean(lens), statistics.median(lens),
             statistics.pstdev(lens), min(lens), max(lens)))
    print("  paragraph length mean %.1f  stdev %.1f  min %d  max %d"
          % (statistics.mean(plens), statistics.pstdev(plens), min(plens), max(plens)))
    cv = statistics.pstdev(lens) / statistics.mean(lens)
    print("  sentence coefficient of variation %.2f" % cv)
    print("     Human professional prose typically runs 0.45 to 0.75. Below 0.40")
    print("     means sentences are too uniform, which is the machine tell that")
    print("     survives every vocabulary fix.")
    if cv < 0.40:
        findings.append("sentence length too uniform, CV %.2f" % cv)
    print()

    print("%d finding(s)" % len(findings))
    for f in findings:
        print("  " + f)
    return 1 if findings else 0


if __name__ == "__main__":
    sys.exit(main())
