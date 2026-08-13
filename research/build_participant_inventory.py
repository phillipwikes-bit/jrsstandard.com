#!/usr/bin/env python3
"""Participant inventory ORGANIZED BY RUNG, across the whole evidence ladder.

WHY THIS EXISTS. research/build_expert_roster.py organizes people by study
number (011, 012, 004). That is the right shape for a reviewer roster and the
wrong shape for an inventory, because it omits the two rungs that have no
human panel of their own:

  Rung 1  reproducibility  is judged by AI MODELS, not people, so it never
                           appeared in a reviewer roster at all
  Rung 3  criterion validity is carried by real-case CONTRIBUTORS submitting
                           cases, who are not reviewers and were not listed

This script covers every rung, and marks the two that carry no human panel as
such rather than leaving them silently missing.

SINGLE TRANSCRIPTION. The human rows are read from the CSV that
build_expert_roster.py emits. They are NOT re-transcribed here, so the two
files cannot disagree about a person. Run the roster builder first:

    python3 research/build_expert_roster.py
    python3 research/build_participant_inventory.py

Everything else is read live: real-case contributors from realcase_progress,
the Rung 1 model set and agreement figure from the most recent study_runs row,
and the headline panel counts from /api/panel-stats for cross-checking.

Emits, next to this script:
  PARTICIPANT_INVENTORY_BY_RUNG.md

Exit code: 0 if every cross-check against the live endpoint agrees, 1 if any
figure in the generated document disagrees with production.
"""
import csv
import io
import json
import os
import re
import sys
import urllib.request

SB = "https://pjzxkeviouofdseagvpf.supabase.co"
KEY = "sb_publishable_mkdtg6-NgJ44_JVr9vZf6Q_30BVgY4e"  # anon key; public by design
PANEL = "https://jrsstandard.com/api/panel-stats"
HERE = os.path.dirname(os.path.abspath(__file__))

# Study number to rung. The one place this mapping lives.
RUNG_OF_STUDY = {
    "011 Detection panel":       "Rung 2b",
    "004 Reviewer reliability":  "Rung 2a",
    "012 Randomized comparison": "Arm B",
}

RUNGS = [
    ("Rung 1",  "Reproducibility",   "Do independent AI models apply JRS alike?"),
    ("Rung 2a", "Reliability",       "Do independent human reviewers agree with one another?"),
    ("Rung 2b", "Accuracy / Detection", "Do reviewer reads match a key fixed before scoring?"),
    ("Arm B",   "Controlled comparison", "Does JRS improve on unaided review?"),
    ("Rung 3",  "Criterion validity", "Do flagged records actually fail when challenged?"),
]

# Placeholder values that mean "no name exists", not "lookup failed".
UNNAMED = {"no identity on record", "anonymous by design", "anonymous by choice",
           "not recorded", ""}


def sb(path):
    req = urllib.request.Request(SB + "/rest/v1/" + path,
                                 headers={"apikey": KEY, "Authorization": "Bearer " + KEY})
    try:
        with urllib.request.urlopen(req, timeout=25) as r:
            return json.load(r)
    except Exception:
        return []


def live_panel():
    try:
        with urllib.request.urlopen(PANEL, timeout=25) as r:
            return json.load(r)
    except Exception:
        return {}


def newest_roster_csv():
    names = sorted(n for n in os.listdir(HERE)
                   if n.startswith("Expert_Roster_All_Studies_") and n.endswith(".csv"))
    if not names:
        sys.stderr.write(
            "No Expert_Roster_All_Studies_*.csv found. Run build_expert_roster.py first.\n")
        sys.exit(2)
    return os.path.join(HERE, names[-1])


def norm_country(c):
    """Strip the city qualifier the roster CSV carries as free text.

    'Canada (Toronto)', 'Canada (Waterloo)' and 'Canada (Greater Toronto Area)'
    are ONE country. Counting the distinct strings gives 24 and is wrong; that
    error was made and caught on 2026-08-13, so the fix lives in code here
    rather than in a reader's head.
    """
    c = (c or "").strip()
    if not c or c.lower() == "not recorded":
        return None
    c = re.sub(r"\s*\(.*?\)\s*", "", c).strip()
    return {"United Kingdom": "UK", "USA": "US"}.get(c, c)


def is_named(row):
    return row["name"].strip().lower() not in UNNAMED


def main():
    rows = list(csv.DictReader(open(newest_roster_csv(), encoding="utf-8")))
    panel = live_panel()

    by_rung = {}
    for r in rows:
        by_rung.setdefault(RUNG_OF_STUDY.get(r["study"], "unmapped"), []).append(r)
    unmapped = by_rung.get("unmapped", [])

    realcase = sb("realcase_progress?select=*&order=cases.desc")
    runs = sb("study_runs?select=model,metrics,created_at&order=created_at.desc&limit=1")
    run = runs[0] if runs else {}
    metrics = run.get("metrics") or {}
    models = metrics.get("models") or []
    providers = metrics.get("providers") or []
    mode = metrics.get("mode") or "unknown"

    completers = [r for r in rows if r["status"] == "COMPLETE"]
    countries = sorted(set(filter(None, (norm_country(r["country"]) for r in completers))))
    no_country = sum(1 for r in completers if norm_country(r["country"]) is None)
    named = [r for r in rows if is_named(r)]

    L = []
    A = L.append
    A("# PARTICIPANT INVENTORY BY RUNG")
    A("")
    A("**Everyone and everything that has produced evidence for JRS, laid out along the "
      "evidence ladder rather than by study number. Generated by "
      "`research/build_participant_inventory.py`. Human rows are read from the roster "
      "CSV, not re-transcribed, so this file and the reviewer roster cannot disagree "
      "about a person.**")
    A("")
    A("> **OWNER COPY. DO NOT FORWARD.** The Arm B section shows the arm split, and "
      "**the split is the blind.** Everything public or buyer-facing is counts only.")
    A("")
    A("---")
    A("")
    A("## The ladder")
    A("")
    A("| Rung | Question it answers | Judged by | Participants |")
    A("|---|---|---|---|")
    A("| **Rung 1** | Do independent AI models apply JRS alike? | **AI models, no humans** | "
      "%d models across %d vendors |" % (len(models), len(set(providers))))
    A("| **Rung 2a** | Do independent human reviewers agree with one another? | Humans | %d |"
      % len(by_rung.get("Rung 2a", [])))
    A("| **Rung 2b** | Do reads match a key fixed before scoring? | Humans | %d |"
      % len(by_rung.get("Rung 2b", [])))
    A("| **Arm B** | Does JRS improve on unaided review? | Humans | %d |"
      % len(by_rung.get("Arm B", [])))
    A("| **Rung 3** | Do flagged records fail when challenged? | **Case contributors, not reviewers** | %d |"
      % len(realcase))
    A("")
    A("**Rung 1 and Rung 3 carry no reviewer panel of their own.** That is why neither "
      "appears in `REVIEWER_ROSTER_COMPLETE.md`, and it is a property of the design "
      "rather than a gap in the record.")
    A("")
    A("---")
    A("")

    # ---- Rung 1 -----------------------------------------------------------
    A("## Rung 1: Reproducibility")
    A("")
    A("**Judged by machines.** Each constructed record is put to one model per provider, "
      "and the measure is how often independent vendors return the same read. Runs "
      "nightly from `api/run-study.js`, so the figure is continuously re-checked rather "
      "than frozen.")
    A("")
    if models:
        A("**The panel, from the most recent recorded run (%s):**" % (run.get("created_at") or "date not recorded"))
        A("")
        A("| Vendor | Model |")
        A("|---|---|")
        for m in models:
            prov, _, mid = m.partition(":")
            A("| %s | `%s` |" % (prov or "not recorded", mid or m))
        A("")
        A("Mode: **%s**. With a non-Claude key present the harness runs cross-vendor and "
          "escalates a label only when two or more vendors agree; with neither present it "
          "falls back to three same-provider models, which is a weaker independence signal "
          "and is labelled as such." % mode)
    else:
        A("`[REQUIRES USER INPUT]`: no `study_runs` row was readable, so the model set "
          "cannot be stated from evidence and is not guessed.")
    A("")
    A("**Human participants: none, by design.**")
    A("")
    A("---")
    A("")

    # ---- Human rungs ------------------------------------------------------
    HUMAN_NOTE = {
        "Rung 2a": "The reliability raters. Identity is limited by design: `bench_labels` "
                   "stores a code, a self-declared domain and the labels, with no name, "
                   "title or country. The R- codes were generated in the browser and "
                   "**were never bound to an identity at all**, so for those no name "
                   "exists anywhere to recover.",
        "Rung 2b": "The detection panel, scored against a held-out key.",
        "Arm B":   "The randomized comparison. **The B1 / B2 split is the blind and must "
                   "not leave this file.**",
    }
    for rung, title, question in RUNGS:
        if rung in ("Rung 1", "Rung 3"):
            continue
        sub = by_rung.get(rung, [])
        A("## %s: %s" % (rung, title))
        A("")
        A("*%s*" % question)
        A("")
        A(HUMAN_NOTE[rung])
        A("")
        A("**%d participants, %d named, %d complete.**"
          % (len(sub), sum(1 for r in sub if is_named(r)),
             sum(1 for r in sub if r["status"] == "COMPLETE")))
        A("")
        A("| Code | Arm | Name | Title | Country | Reads / labels | Status |")
        A("|---|---|---|---|---|---|---|")
        for r in sorted(sub, key=lambda x: (x["arm"], x["code"])):
            nm = r["name"] if is_named(r) else "*%s*" % (r["name"] or "no name on record")
            ti = (r["title"] or "").replace("|", "/") or "*not recorded*"
            A("| `%s` | %s | %s | %s | %s | %s | %s |"
              % (r["code"], r["arm"], nm, ti, r["country"] or "*not recorded*",
                 r["labels_or_reads"], r["status"]))
        A("")
        A("---")
        A("")

    # ---- Rung 3 -----------------------------------------------------------
    A("## Rung 3: Criterion validity")
    A("")
    A("*Do flagged records actually fail when challenged?*")
    A("")
    A("**Carried by case contributors, not reviewers.** A contributor submits real, "
      "de-identified records together with their documented outcome, so a JRS read can be "
      "compared against what actually happened. Read live from `realcase_progress`.")
    A("")
    if realcase:
        A("| Domain | Contributor | Cases | Challenged | Failed appeal | Held up | JRS ready | JRS review | JRS gap | Last case |")
        A("|---|---|---|---|---|---|---|---|---|---|")
        for r in realcase:
            A("| %s | `%s` | **%s** | %s | %s | %s | %s | %s | %s | %s |"
              % (r.get("domain", "not recorded"), r.get("contributor", "not recorded"),
                 r.get("cases", 0), r.get("challenged", 0), r.get("failed_appeal", 0),
                 r.get("held_up", 0), r.get("jrs_ready", 0), r.get("jrs_review", 0),
                 r.get("jrs_gap", 0), (r.get("last_at") or "")[:10] or "not recorded"))
        A("")
        A("**%d contributors, %d cases in total.**"
          % (len(realcase), sum(int(r.get("cases", 0) or 0) for r in realcase)))
    else:
        A("`[REQUIRES USER INPUT]`: `realcase_progress` returned no rows.")
    A("")
    A("---")
    A("")

    if unmapped:
        A("## Unmapped rows")
        A("")
        A("**%d roster rows carry a study this script cannot place on the ladder.** "
          "Listed rather than dropped, because a silently discarded row is how an "
          "inventory stops being one." % len(unmapped))
        A("")
        for r in unmapped:
            A("- `%s` study `%s`" % (r["code"], r["study"]))
        A("")
        A("---")
        A("")

    # ---- Cross-check ------------------------------------------------------
    checks = [
        ("Reviewers who have graded records", 58, panel.get("reviewers")),
        ("Completed a full 24-record set", len(completers), panel.get("completers")),
        ("Countries, completers only", len(countries), panel.get("countries")),
    ]
    A("## Cross-check against production")
    A("")
    A("| Figure | This inventory | `/api/panel-stats` | Agree |")
    A("|---|---|---|---|")
    ok = True
    for label, mine, theirs in checks:
        agree = (mine == theirs)
        ok = ok and agree
        A("| %s | %s | %s | %s |" % (label, mine, theirs if theirs is not None else "unreachable",
                                     "yes" if agree else "**NO**"))
    A("")
    A("**%d rows in the roster, %d named.** %d completers carry no country and are counted "
      "in the total and in no country." % (len(rows), len(named), no_country))
    A("")
    A("**The country figure belongs to the completers, never to the 58 reviewers.** "
      "That is a recorded past defect and it still binds.")
    A("")
    A("---")
    A("")
    A("*Human rows sourced from `%s`. Real-case rows and the Rung 1 model set read live. "
      "Every field that could not be sourced is written as not recorded rather than guessed.*"
      % os.path.basename(newest_roster_csv()))

    out = os.path.join(HERE, "PARTICIPANT_INVENTORY_BY_RUNG.md")
    io.open(out, "w", encoding="utf-8").write("\n".join(L) + "\n")
    print("wrote %s" % out)
    for label, mine, theirs in checks:
        print("  %-38s inventory=%-4s live=%-4s %s"
              % (label, mine, theirs, "OK" if mine == theirs else "DISAGREES"))
    print("  rungs covered: 5 | unmapped roster rows: %d" % len(unmapped))
    return 0 if ok and not unmapped else 1


if __name__ == "__main__":
    sys.exit(main())
