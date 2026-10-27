"""Figure 1 for the SEC detection manuscript: accuracy by record.

Data: item-level accuracy table, Appendix C of the AI and Ethics manuscript
(research/aie_submission_2026-09-01/01_Blinded_Manuscript.md). Record class is
deliberately not shown, as in the source, so the reference classification is
not disclosed.

Usage: python3 scripts/build_sec_detection_figure.py <out.png>
"""
import re
import sys

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt

SRC = "research/aie_submission_2026-09-01/01_Blinded_Manuscript.md"


def main(out):
    rows = re.findall(r"^\| (R\d\d) \| (\d+) of 16 \| ([\d.]+)% \|$", open(SRC).read(), re.M)
    assert len(rows) == 24, len(rows)
    rows.sort(key=lambda r: (float(r[2]), r[0]))
    acc = [float(r[2]) for r in rows]
    plt.rcParams.update({"font.family": "serif", "font.size": 9})
    fig, ax = plt.subplots(figsize=(6.3, 3.0), dpi=300)
    ax.bar(range(1, 25), acc, color="#4d4d4d", width=0.7)
    ax.axhline(50, color="#000000", linestyle="--", linewidth=0.8)
    ax.text(24.6, 51.5, "Chance (50%)", ha="right", va="bottom", fontsize=8,
            bbox=dict(facecolor="white", edgecolor="none", pad=1.5))
    ax.set_ylim(0, 100)
    ax.set_xlim(0.3, 24.7)
    ax.set_xticks(range(1, 25))
    ax.set_xticklabels([str(i) for i in range(1, 25)], fontsize=7)
    ax.set_xlabel("Records, ordered from hardest to easiest")
    ax.set_ylabel("Experts classifying correctly (%)")
    for side in ("top", "right"):
        ax.spines[side].set_visible(False)
    fig.tight_layout()
    fig.savefig(out, dpi=300)


if __name__ == "__main__":
    main(sys.argv[1])
