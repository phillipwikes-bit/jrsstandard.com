#!/usr/bin/env python3
"""Live analysis for the detection paper, 2026-08-04. Figures pulled from
Supabase this session; per-reviewer accuracies and reliability labels are
pasted below exactly as returned so the computation is reproducible offline."""
import math, statistics as st

# Participant-level accuracy, reviewers with >=24 graded reads.
ARM_A = [100,100,100,100,100,100,95.83,95.83,91.67,87.5,79.17,79.17,75,58.33,41.67,37.5]
B1    = [100,87.5,70.83,62.5,45.83]
B2    = [100,100,100,91.67,87.5,87.5,66.67,37.5,37.5,33.33,20.83]

def mean(x): return sum(x)/len(x)
def sd(x): return st.stdev(x) if len(x) > 1 else 0.0
def ci95_t(x):
    n=len(x); m=mean(x); s=sd(x)
    # t critical, two-sided .05
    tcrit={4:2.776,5:2.571,10:2.228,11:2.201,15:2.131,16:2.120,20:2.086}.get(n-1,2.045)
    h=tcrit*s/math.sqrt(n)
    return m-h, m+h

def welch(a,b):
    na,nb=len(a),len(b); ma,mb=mean(a),mean(b); va,vb=sd(a)**2,sd(b)**2
    t=(ma-mb)/math.sqrt(va/na+vb/nb)
    df=(va/na+vb/nb)**2/((va/na)**2/(na-1)+(vb/nb)**2/(nb-1))
    return t, df, ma-mb

def cohens_d(a,b):
    na,nb=len(a),len(b)
    sp=math.sqrt(((na-1)*sd(a)**2+(nb-1)*sd(b)**2)/(na+nb-2))
    return (mean(a)-mean(b))/sp

def n_per_arm(d, power=0.80, alpha=0.05):
    z_a, z_b = 1.959964, 0.8416212
    return math.ceil(2*((z_a+z_b)/d)**2)

print("=== Participant-level detection accuracy (>=24 graded reads) ===")
for label, x in (("Arm A panel", ARM_A), ("Arm B1 (JRS)", B1), ("Arm B2 (baseline)", B2)):
    lo, hi = ci95_t(x)
    print(f"{label:20} n={len(x):2}  mean={mean(x):5.1f}%  SD={sd(x):5.1f}  95% CI {lo:5.1f} to {hi:5.1f}  range {min(x):.1f} to {max(x):.1f}")

t, df, diff = welch(B1, B2)
d = cohens_d(B1, B2)
print("\n=== Pre-registered secondary comparison, B1 vs B2 ===")
print(f"difference = {diff:+.1f} points, Welch t = {t:.2f}, df = {df:.1f}, Cohen's d = {d:.3f}")
print(f"n needed per arm for 80% power at this effect size: {n_per_arm(abs(d))}")

# Gwet's AC1, three categories, on JRS-mode labels.
LABELS = {}   # (record, labeler) -> determination, last write wins
RAW = open('/home/user/jrsstandard.com/research/reliability_labels_2026-08-04.tsv').read().strip().split('\n')
for line in RAW[1:]:
    rec, coder, det, is_exp = line.split('\t')
    LABELS[(rec, coder, is_exp)] = det

def ac1(rows):
    """rows: dict (record,coder)->category. Gwet AC1 for multiple raters."""
    by_rec = {}
    for (rec, coder), cat in rows.items():
        by_rec.setdefault(rec, []).append(cat)
    cats = sorted({c for v in by_rec.values() for c in v})
    q = len(cats)
    recs = [v for v in by_rec.values() if len(v) >= 2]
    if not recs: return None, 0, 0
    n = len(recs)
    pa = 0.0
    for v in recs:
        r = len(v)
        agree = sum(v.count(c)*(v.count(c)-1) for c in cats)
        pa += agree/(r*(r-1))
    pa /= n
    pi = {}
    for c in cats:
        pi[c] = sum(v.count(c)/len(v) for v in recs)/n
    pe = sum(pi[c]*(1-pi[c]) for c in cats)/(q-1)
    return (pa-pe)/(1-pe), n, sum(len(v) for v in recs)

exp = {(r, c): d for (r, c, e), d in LABELS.items() if e == 'true'}
trn = {(r, c): d for (r, c, e), d in LABELS.items() if e == 'false'}
allr = {(r, c): d for (r, c, e), d in LABELS.items()}

print("\n=== Reliability, Gwet's AC1, JRS-mode labels only ===")
for label, rows in (("Experts", exp), ("Trained reviewers", trn), ("All raters", allr)):
    a, n, k = ac1(rows)
    print(f"{label:20} AC1 = {a:.3f}   records = {n}   labels = {k}")
