#!/usr/bin/env python3
"""SEC-0111-2026: source-backed reproduction of de-identified original aggregates.

Run at repository root:
    python3 research/sec_detection_2026-11-08/reproduce_original_data.py
Only retained original score vectors and record-wise counts are used.
This does not reconstruct the unavailable later 104-row original export.
"""
import csv, json, math, random
from pathlib import Path
from statistics import mean, stdev
P=Path(__file__).resolve().parent
def load(name):
    with (P/name).open(encoding="utf-8",newline="") as f:return list(csv.DictReader(f))
review=load("Original_16Reviewer_Scores_Anonymized.csv")
items=load("Figure_1_Item_Level_Source.csv")
labels=load("Original_99Row_Reliability_Aggregated_By_Record.csv")
correct=[int(x["matching_classifications_n"]) for x in review]
assert len(correct)==16 and all(int(x["total_classifications_n"])==24 for x in review)
assert len(items)==24 and all(int(x["reviewer_n"])==16 for x in items)
assert sum(int(x["matched_reference_n"]) for x in items)==sum(correct)==322
scores=[v*100/24 for v in correct]
m=mean(scores)
tcrit=2.131449545559323
t_ci=[m-tcrit*stdev(scores)/math.sqrt(16),m+tcrit*stdev(scores)/math.sqrt(16)]
rng=random.Random(20261108); B=100000
boots=sorted(sum(rng.choices(scores,k=16))/16 for _ in range(B))
boot_ci=[boots[int(.025*B)],boots[int(.975*B)]]
ground=set("R01 R04 R06 R08 R10 R12 R14 R16 R18 R20 R22 R24".split())
specific_correct=sum(int(r["matched_reference_n"]) for r in items if r["record_id"] in ground)
sensitive_correct=sum(int(r["matched_reference_n"]) for r in items if r["record_id"] not in ground)
assert specific_correct==155 and sensitive_correct==167
C=("ready_n","review_required_n","gap_identified_n")
def agreement(rows):
    vectors=[[int(r[x]) for x in C] for r in rows]
    assert len(vectors)==10 and all(sum(v)>=2 for v in vectors)
    pa_i=[sum(x*(x-1) for x in v)/(sum(v)*(sum(v)-1)) for v in vectors]
    pi_i=[[x/sum(v) for x in v] for v in vectors]
    pa=mean(pa_i)
    pi=[mean(v[j] for v in pi_i) for j in range(3)]
    pe=sum(p*(1-p) for p in pi)/2
    AC=(pa-pe)/(1-pe)
    values=[]
    for i in range(10):
        pei=sum(pi_i[i][j]*(1-pi[j]) for j in range(3))/2
        values.append((pa_i[i]-pe)/(1-pe)-2*(1-AC)*(pei-pe)/(1-pe))
    se=math.sqrt(sum((v-AC)**2 for v in values)/(10*9))
    ci=[AC-2.2621571628540993*se,min(1,AC+2.2621571628540993*se)]
    pair_num=sum(sum(x*(x-1) for x in v) for v in vectors)
    pair_den=sum(sum(v)*(sum(v)-1) for v in vectors)
    n_by_cat=[sum(v[j] for v in vectors) for j in range(3)]
    n=sum(n_by_cat)
    fleiss_pe=sum((x/n)**2 for x in n_by_cat)
    fleiss=(pair_num/pair_den-fleiss_pe)/(1-fleiss_pe)
    coinc=[[0.]*3 for _ in range(3)]
    for v in vectors:
        den=sum(v)-1
        for i in range(3):
            for j in range(3):coinc[i][j]+=v[i]*(v[j]-(i==j))/den
    marg=[sum(row) for row in coinc]; tot=sum(marg)
    observed=sum(coinc[i][j] for i in range(3) for j in range(3) if i!=j)/tot
    expected=(tot*tot-sum(x*x for x in marg))/(tot*(tot-1))
    return {"records":10,"labels":sum(sum(v) for v in vectors),
            "ac1":AC,"ac1_analytic95":ci,"fleiss_kappa":fleiss,
            "krippendorff_alpha":1-observed/expected}
reliability={g:agreement([x for x in labels if x["group"]==g])
             for g in ("invited","open_enrolment")}
assert reliability["invited"]["labels"]==36
assert reliability["open_enrolment"]["labels"]==63
print(json.dumps({"status":"earlier source snapshot only; NOT final 104-label reproduction",
                 "reviewers":16,"judgments":384,"matched_reference":322,
                 "mean_percent":m,"student_t95":t_ci,"reviewer_bootstrap95":boot_ci,
                 "bootstrap_seed":20261108,"bootstrap_draws":B,
                 "sensitivity_percent":100*sensitive_correct/192,
                 "specificity_percent":100*specific_correct/192,
                 "original_reliability_99":reliability},indent=2))
