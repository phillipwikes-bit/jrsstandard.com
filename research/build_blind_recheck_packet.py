#!/usr/bin/env python3
"""
Build the blind second-reader packet for the public-records study (contributor E-08).

WHY THIS EXISTS
The manuscript reports 32 reads produced by one person. The single weakness a
reviewer will name is that nobody checked those reads independently. Stacy Young
agreed on 2026-08-08 that a blind re-read of ten cases would strengthen the
study. This builds the packet that makes that re-read possible without leaking
the answer.

WHAT "BLIND" MEANS HERE, PRECISELY
The second reader receives, for each of the ten cases: the public source, the
record summary, and nothing else. They do NOT receive the original read, the
written basis note, the recorded outcome, the distribution of reads in the set,
or any hint of how many of each category to expect. The answer key is written to
a separate file that is not sent.

SELECTION
Stratified proportionally across the three read categories so the ten cases span
the full range rather than clustering on the easy ones, then ordered by a fixed
rule (case id) inside each stratum so the selection is reproducible and cannot be
described as cherry-picked. The presentation order in the packet is interleaved
so consecutive cases do not share a category, which stops a reader inferring
structure from position.

Standard library only. No third-party packages, matching every other analysis
script in this directory.

Usage:  python3 research/build_blind_recheck_packet.py
Writes: research/Blind_Recheck_Packet_E08.md      (send to the second reader)
        research/Blind_Recheck_KEY_E08.md         (DO NOT SEND)
"""

import json
import os
import urllib.request

SB = "https://pjzxkeviouofdseagvpf.supabase.co"
ANON = "sb_publishable_mkdtg6-NgJ44_JVr9vZf6Q_30BVgY4e"
CONTRIBUTOR = "E-08"
N_SELECT = 10
HERE = os.path.dirname(os.path.abspath(__file__))

READ_LABEL = {
    "ready": "Ready",
    "review_required": "Needs work",
    "gap_identified": "Gap",
}


def fetch(path):
    req = urllib.request.Request(
        SB + "/rest/v1/" + path,
        headers={"apikey": ANON, "Authorization": "Bearer " + ANON},
    )
    return json.loads(urllib.request.urlopen(req, timeout=45).read())


def select(rows):
    """Proportional stratified pick, deterministic inside each stratum."""
    strata = {}
    for r in rows:
        strata.setdefault(r.get("jrs_read"), []).append(r)
    for k in strata:
        strata[k].sort(key=lambda r: str(r.get("id")))

    total = len(rows)
    # Largest-remainder allocation so the ten seats reflect the real mix and
    # every category that exists in the corpus gets at least one seat.
    quota = {k: (len(v) * N_SELECT) / total for k, v in strata.items()}
    take = {k: max(1, int(q)) for k, q in quota.items()}
    while sum(take.values()) > N_SELECT:
        k = max(take, key=lambda k: (take[k] - quota[k], k))
        if take[k] > 1:
            take[k] -= 1
        else:
            break
    while sum(take.values()) < N_SELECT:
        k = max(take, key=lambda k: (quota[k] - take[k], k))
        if take[k] < len(strata[k]):
            take[k] += 1
        else:
            break

    picked = {k: strata[k][: take[k]] for k in strata}

    # Interleave so position carries no information about category.
    order = sorted(picked, key=lambda k: (-len(picked[k]), k))
    out, i = [], 0
    while len(out) < sum(len(v) for v in picked.values()):
        for k in order:
            if i < len(picked[k]):
                out.append(picked[k][i])
        i += 1
    return out, take, {k: len(v) for k, v in strata.items()}


def main():
    rows = [
        r for r in fetch("bench_outcomes?select=*&limit=2000")
        if str(r.get("contributor", "")).upper() == CONTRIBUTOR
    ]
    rows.sort(key=lambda r: str(r.get("id")))
    if len(rows) < N_SELECT:
        raise SystemExit("only %d cases found for %s" % (len(rows), CONTRIBUTOR))

    chosen, take, strata_sizes = select(rows)

    packet = []
    packet.append("# Blind re-read: ten public-records cases\n")
    packet.append(
        "You are being asked to read ten records and answer one question about each. "
        "You are not being asked to check anyone's work, and you are not being shown "
        "anyone else's answers. There is no right total: some sets are mostly one "
        "category and some are mixed.\n"
    )
    packet.append("## What you are deciding\n")
    packet.append(
        "For each case, read the source and answer this:\n\n"
        "> Could a reviewer with no access to the author, no institutional memory, and "
        "no supplementary explanation identify the basis for each conclusion from the "
        "record alone?\n"
    )
    packet.append("Choose one label per case.\n")
    packet.append(
        "| Label | Use it when |\n|---|---|\n"
        "| **Ready** | The basis for each conclusion is present in the record and can be "
        "rebuilt from it without asking anyone. |\n"
        "| **Needs work** | The record states conclusions whose basis is partly present, "
        "so a cold reader could reconstruct some of it and would have to assume the rest. |\n"
        "| **Gap** | The record does not carry a reconstructable basis at all. A cold reader "
        "could not say why the conclusion was reached. |\n"
    )
    packet.append("## How to record your answers\n")
    packet.append(
        "Reply with ten lines, one per case, in this format, and add a sentence saying "
        "what drove the call:\n\n"
        "```\nCase 1: Ready. The determination text sets out the exemption claimed and the "
        "facts relied on.\nCase 2: Gap. ...\n```\n"
    )
    packet.append("## Ground rules\n")
    packet.append(
        "- Read the source before deciding. The summary below is orientation, not the record.\n"
        "- Do not look up how the case came out. If you already know, say so for that case "
        "and answer anyway; it will be noted rather than dropped.\n"
        "- Do not discuss the cases with anyone else on the study until your answers are in.\n"
        "- If a source is unreachable, write \"unreachable\" and move on.\n"
    )
    packet.append("---\n")

    key = []
    key.append("# ANSWER KEY: blind re-read, ten cases. DO NOT SEND.\n")
    key.append(
        "Original reads recorded by contributor %s between 2026-06-26 and 2026-08-08, "
        "each entered before the outcome was consulted. This file exists so agreement can "
        "be scored after the second reader's answers are in, and for no other purpose.\n"
        % CONTRIBUTOR
    )
    key.append("| Case | Case id | Original read | Recorded outcome |\n|---|---|---|---|\n")

    for n, r in enumerate(chosen, 1):
        src = (r.get("source") or "").strip()
        rec = (r.get("record") or "").strip()
        packet.append("### Case %d\n" % n)
        packet.append("**Source:** %s\n" % (src or "not recorded"))
        packet.append("**What the record is:** %s\n" % (rec or "not recorded"))
        packet.append("**Your call:** Ready / Needs work / Gap, and one sentence on why.\n")
        key.append(
            "| %d | %s | %s | %s |\n"
            % (
                n,
                r.get("id"),
                READ_LABEL.get(r.get("jrs_read"), r.get("jrs_read")),
                r.get("outcome"),
            )
        )

    packet.append("---\n")
    packet.append(
        "That is all ten. Thank you for doing this: a second independent read is the one "
        "thing that turns a single-reader study into a measured one.\n"
    )

    key.append("\n## Selection method, for the methods section\n")
    key.append(
        "Corpus of %d cases for contributor %s, stratified by original read "
        "(%s), proportional allocation with a floor of one seat per category, "
        "deterministic ordering by case id inside each stratum, presentation order "
        "interleaved so consecutive cases do not share a category. Seats allocated: %s. "
        "No random number generator is used anywhere, so the selection is reproducible "
        "from this script alone.\n"
        % (
            len(rows),
            CONTRIBUTOR,
            ", ".join(
                "%s %d" % (READ_LABEL.get(k, k), v) for k, v in sorted(strata_sizes.items())
            ),
            ", ".join(
                "%s %d" % (READ_LABEL.get(k, k), v) for k, v in sorted(take.items())
            ),
        )
    )
    key.append(
        "\n## Scoring, once the answers are in\n"
        "Report raw agreement (matches out of ten) and Gwet's AC1 with its 95 percent "
        "interval, the same statistic used for the reliability panel elsewhere in the "
        "programme, so the two are comparable. Report the confusion pattern rather than "
        "only the headline number: a disagreement that runs Ready against Needs work is a "
        "different finding from one that runs Ready against Gap. Ten cases is a small "
        "sample and the interval will be wide; report it wide rather than rounding it off.\n"
    )

    p1 = os.path.join(HERE, "Blind_Recheck_Packet_E08.md")
    p2 = os.path.join(HERE, "Blind_Recheck_KEY_E08.md")
    open(p1, "w", encoding="utf-8").write("\n".join(packet))
    open(p2, "w", encoding="utf-8").write("\n".join(key))
    print("corpus: %d cases" % len(rows))
    print("strata: %s" % {READ_LABEL.get(k, k): v for k, v in strata_sizes.items()})
    print("seats : %s" % {READ_LABEL.get(k, k): v for k, v in take.items()})
    print("wrote %s" % os.path.basename(p1))
    print("wrote %s  (DO NOT SEND)" % os.path.basename(p2))


if __name__ == "__main__":
    main()
