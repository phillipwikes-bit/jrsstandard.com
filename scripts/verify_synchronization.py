#!/usr/bin/env python3
"""SYNCHRONIZATION CLOSURE VERIFIER.

Rebuilds the discovered estate from the repository, classifies it, sweeps the
current subset, and reports the partition. It exists so the closure claim of
2026-09-18 can be RE-DERIVED rather than believed, and so a later state change
can be checked as a DELTA instead of triggering another full audit.

RUN: python3 scripts/verify_synchronization.py [--baseline]

Discovery is the union of three methods, because no one of them is sufficient:
  A IDENTIFIER  an estate id appears
  B ROLE        membership of .jrs/, the control architecture (CLAUDE.md 4)
  C SEMANTIC    a dependency or owner/counsel action stated in words, no id

Method A alone cannot see .jrs/state/PROGRAM_STATE.json -- the file CLAUDE.md
section 18 names as the first thing to read in a new context -- because it does
not happen to mention a B- number. That is why B and C exist.
"""
import os, re, sys, json, subprocess, collections

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "scripts"))
import estate_state_sweep as sw

TEXT_EXT = {".md", ".txt", ".json", ".yaml", ".yml", ".js", ".mjs", ".ts", ".tsx",
            ".py", ".html", ".htm", ".xml", ".csv", ".tsv", ".ndjson", ".sql",
            ".sh", ".svg"}
BINARY_EXT = {".docx", ".pdf", ".png", ".zip"}

# TIER 1 - shapes no other namespace in this repository uses.
T1 = re.compile(r"\bB-0\d\d\b|\bE-0\d\d\b|\bBD-\d+\b|\bCT-[A-Z][\w.]*\b|"
                r"CONTRADICTION_\d+|\bX-1\d\b|\bB-013[ABC]\b")
# TIER 2 - shapes SHARED with the research corpus, where V-AI-08 is a PARTICIPANT
# code and S-1 / T-6 / V-4 are STUDY ARM labels. Counted only in estate context,
# or the estate fills with roster files and buries the real findings.
T2 = re.compile(r"\b[STVWUMDF]-\d+\b")
ESTATE_CTX = re.compile(
    r"OWNER INPUT REQUIRED|OWNER FACTUAL|COUNSEL|BLOCKER|BOARD|GATE|DEPLOYMENT|"
    r"UNRESOLVED|DISPOSITION|SUPERSEDED|REMAINING QUESTION|CURRENT STATE|"
    r"\bCLOSED\b|\bOPEN\b|\bRESOLVED\b|ANSWERED|ATTESTATION|EVIDENCE", re.I)
STRONG_SEM = re.compile(
    r"OWNER (?:ACTION|INPUT|DECISION|APPROVAL) (?:REQUIRED|NEEDED)|"
    r"COUNSEL (?:REVIEW |ACTION )?REQUIRED|HUMAN APPROVAL REQUIRED|"
    r"(?:queued behind|waits on|blocked by|gated by|contingent on|prerequisite)\s*\**[A-Z]|"
    r"REQUIRES (?:OWNER|COUNSEL|HUMAN|PRODUCTION|AUTHORIZATION)|"
    r"NOT (?:READY|AUTHORIZED|VERIFIED|ESTABLISHED)|CRITICAL PATH|"
    r"DEPLOYMENT NOT AUTHORIZED|PRODUCTION VERIFICATION REQUIRED", re.I)

MANDATORY_SEVEN = [
    ".jrs/state/BLOCKERS.json",
    "docs/enterprise-diligence/HUMAN_DECISIONS_REQUIRED.md",
    "docs/enterprise-diligence/JRS_QUESTION_RESOLUTION_MATRIX_2026-09-16.md",
    "docs/enterprise-diligence/COUNSEL_REVIEW_PACKET_2026-09-16.md",
    "docs/enterprise-diligence/JRS_BOARD_DECISION_REGISTER_2026-09-16.md",
    "docs/enterprise-diligence/JRS_CURRENT_DEPENDENCY_GRAPH_2026-09-16.md",
    "docs/enterprise-diligence/OWNER_RESOLUTION_BATCH_2026-09-18.md",
]
MASTER_PAIR = [
    "docs/enterprise-diligence/JRS_MASTER_ASSET_EVIDENCE_AND_CHAIN_OF_TITLE_REGISTER.md",
    "docs/enterprise-diligence/EVIDENCE_LEDGER.md",
]


def tracked():
    out = subprocess.run(["git", "ls-files"], cwd=ROOT, capture_output=True,
                         text=True, check=True).stdout
    return [l for l in out.splitlines() if l.strip()]


def read(rel):
    try:
        with open(os.path.join(ROOT, rel), encoding="utf-8", errors="replace") as fh:
            return fh.read()
    except OSError:
        return ""


def partition(files):
    text, binary, other = [], [], []
    for f in files:
        ext = os.path.splitext(f)[1].lower()
        if ext in TEXT_EXT or os.path.basename(f) in ("CLAUDE.md", ".vercelignore"):
            text.append(f)
        elif ext in BINARY_EXT:
            binary.append(f)
        else:
            other.append(f)
    return text, binary, other


def discover(text_files):
    found = {}
    for f in text_files:
        t = read(f)
        if not t:
            continue
        how = []
        if T1.search(t):
            how.append("A")
        else:
            for line in t.splitlines():
                if ESTATE_CTX.search(line) and T2.search(line):
                    how.append("A")
                    break
        if f.startswith(".jrs/"):
            how.append("B")
        if STRONG_SEM.search(t):
            how.append("C")
        if how:
            found[f] = "+".join(sorted(set(how)))
    return found


def main():
    files = tracked()
    text, binary, other = partition(files)
    est = discover(text)
    cls = {f: sw.classify(f)[0] for f in est}
    counts = collections.Counter(cls.values())
    current = sorted(f for f in est if cls[f] == "CURRENT")

    print("=" * 74)
    print("SYNCHRONIZATION CLOSURE VERIFICATION")
    print("=" * 74)
    print("TRACKED FILES                 :", len(files))
    print("  text-searchable             :", len(text))
    print("  binary (docx/pdf/png/zip)   :", len(binary))
    print("  other                       :", len(other))
    print()
    print("DISCOVERED ESTATE             :", len(est))
    by = collections.Counter(est.values())
    for k in sorted(by):
        print(f"  method {k:<10}            : {by[k]}")
    print()
    print("CLASSIFICATION PARTITION")
    total = 0
    for k in ("CURRENT", "RESEARCH CORPUS", "CONTROL CODE", "HISTORICAL",
              "CORRECTION NARRATIVE"):
        print(f"  {k:<22}: {counts.get(k, 0)}")
        total += counts.get(k, 0)
    print(f"  {'SUM':<22}: {total}   partition closed: {total == len(est)}")
    print()

    # --- current sweep completeness -------------------------------------
    rows = sw.scan(current)
    swept = {r["file"].split(" :: ")[0] for r in rows}
    unreadable = [f for f in current if not read(f)]
    stale = [r for r in rows if r["strict"] == "STALE CURRENT-STATE"]
    seen, uniq = set(), []
    for r in stale:
        k = (r["file"], r["unit"][:70])
        if k not in seen:
            seen.add(k)
            uniq.append(r)
    print("CURRENT RECORDS               :", len(current))
    print("CURRENT RECORDS SWEPT         :", len(current) - len(unreadable))
    print("UNSWEPT CURRENT RECORDS       :", len(unreadable), unreadable or "")
    print("OCCURRENCES IN CURRENT RECORDS:", len(rows))
    for k, v in collections.Counter(r["strict"] for r in rows).most_common():
        print(f"  {k:<28}: {v}")
    print("DISTINCT STALE OCCURRENCES    :", len(uniq))
    print()

    # --- mandatory seven and master pair --------------------------------
    print("MANDATORY SEVEN")
    ok7 = 0
    for rel in MANDATORY_SEVEN:
        body = read(rel)
        present = bool(body)
        ok7 += present
        print(f"  {'OK ' if present else 'MISSING'} {rel}")
    print("MASTER PAIR")
    ok2 = 0
    for rel in MASTER_PAIR:
        body = read(rel)
        ok2 += bool(body)
        print(f"  {'OK ' if body else 'MISSING'} {rel}")
    # no competing current master
    competing = [f for f in files
                 if re.search(r"MASTER_ASSET.*\(\d+\)|EVIDENCE_LEDGER\(\d+\)", f)]
    print("  competing numbered masters  :", len(competing), competing or "- none")
    print()

    for r in uniq:
        print(f"  FLAG {r['file']}\n       [{r['prop']}] {r['unit'][:120]}")

    return dict(tracked=len(files), text=len(text), binary=len(binary),
                estate=len(est), counts=dict(counts), current=len(current),
                unswept=len(unreadable), occurrences=len(rows),
                stale=len(uniq), mandatory=ok7, master=ok2,
                competing=len(competing))


if __name__ == "__main__":
    res = main()
    if "--baseline" in sys.argv:
        print("\nJSON:", json.dumps(res, sort_keys=True))
