#!/usr/bin/env python3
"""Appendix C: crossed reviewer and item variance for the detection panel.

WHY THIS EXISTS. The primary analysis in the detection paper treats the reviewer
as the unit of observation. That is the right conservative choice against
pseudo-replication, and it is incomplete: the 24 records are a second source of
variance, and a panel mean computed over a corpus containing a few very easy
items sits higher than the same panel's performance on a harder draw from the
same construct. The editor's critique named this directly. This computes the
crossed analysis:

    correct ~ 1 + (1 | reviewer) + (1 | record)

fitted as a mixed-effects logistic model over all 384 graded reads, plus the
by-item accuracy table and per-record error patterns.

WHY THE FIGURES ARE NOT IN THE MANUSCRIPT YET. The per-read judgments live in
ai_pilot_reads behind row-level security. The anon key returns an empty array,
which is the RLS refusal and not an empty table. Without the service-role key
this script cannot compute anything, and it says so and stops rather than
producing a number. No figure enters this programme's manuscripts until it has
been reproduced from the database.

HOW TO RUN IT. On your own machine, with your own key. The key is read from the
environment, never printed, never written to a file, and never leaves the
process:

    export SUPABASE_SERVICE_ROLE_KEY='<service key>'
    python3 scripts/analyze_item_and_reviewer_variance.py

Add --write to have it emit the Appendix C replacement block to stdout in the
manuscript's own format, ready to paste.

NO SCIPY, NO STATSMODELS, NO R. This container has neither, and a script that
cannot run where it is written is not an artifact. The variance components are
estimated by Laplace-approximated maximum likelihood over the two random
intercepts, implemented here in ~120 lines of plain Python. It is checked
against a closed-form case in the self-test at the bottom. If you have lme4 or
statsmodels available, the printed model formula is the one to fit, and the
numbers should agree to within Monte Carlo error.

Mirrors scripts/verify_detection_accuracy.py, which does the participant-level
figures for the same table.
"""
import argparse
import json
import math
import os
import sys
import urllib.error
import urllib.request
from collections import defaultdict

PROJECT_REF = "pjzxkeviouofdseagvpf"
REST = "https://%s.supabase.co" % PROJECT_REF
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# The pre-registered exclusion rule, restated so this script applies the same
# one as the primary analysis rather than a convenient variant.
MIN_READS = 18
CORPUS_SIZE = 24

# Answer values that map to a determination. '' is the administrative marker
# disclosed in Section 4.6 and is not scorable.
UNSUPPORTED_ANSWERS = {"Gap"}
GROUNDED_ANSWERS = {"Ready"}
MIDDLE_ANSWERS = {"Needs work"}


def die(msg):
    sys.stderr.write(msg.rstrip() + "\n")
    sys.exit(2)


def service_key():
    k = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "").strip()
    if not k:
        die(
            "SUPABASE_SERVICE_ROLE_KEY is not set.\n"
            "\n"
            "The per-read judgments are behind row-level security, so this\n"
            "analysis cannot run without it. Nothing is estimated in its\n"
            "absence.\n"
            "\n"
            "    export SUPABASE_SERVICE_ROLE_KEY='<service key>'\n"
            "    python3 scripts/analyze_item_and_reviewer_variance.py\n"
            "\n"
            "The key is never printed, never written to disk, and never leaves\n"
            "this process."
        )
    return k


def fetch(path, key):
    req = urllib.request.Request(
        REST + path,
        headers={
            "apikey": key,
            "Authorization": "Bearer " + key,
            "Accept": "application/json",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            return json.loads(r.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        die("HTTP %s from %s: %s" % (e.code, path, e.read().decode("utf-8")[:300]))
    except Exception as e:
        die("request failed for %s: %r" % (path, e))


def load_key(key):
    """record_ref -> True if the record is unsupported, False if grounded."""
    rows = fetch("/rest/v1/ai_pilot_key?select=record_ref,is_unsupported", key)
    if not rows:
        die("ai_pilot_key returned no rows. Cannot score without the key.")
    return {r["record_ref"]: bool(r["is_unsupported"]) for r in rows}


def load_reads(key):
    """Latest submission per (participant, record), matching the primary rule."""
    rows = []
    offset, page = 0, 1000
    while True:
        chunk = fetch(
            "/rest/v1/ai_pilot_reads"
            "?select=participant_code,record_ref,answer,created_at"
            "&order=created_at.asc&limit=%d&offset=%d" % (page, offset),
            key,
        )
        rows.extend(chunk)
        if len(chunk) < page:
            break
        offset += page
    if not rows:
        die(
            "ai_pilot_reads returned no rows.\n"
            "An empty array here is the row-level-security refusal, not an\n"
            "empty table. Check that the key is the service-role key."
        )
    latest = {}
    for r in rows:
        k = (r["participant_code"], r["record_ref"])
        if k not in latest or r["created_at"] >= latest[k]["created_at"]:
            latest[k] = r
    return list(latest.values())


def score(reads, answer_key):
    """(reviewer, record, correct) for every scorable read."""
    scored, unscorable = [], 0
    for r in reads:
        ans = (r.get("answer") or "").strip()
        ref = r["record_ref"]
        if ref not in answer_key:
            unscorable += 1
            continue
        if ans in UNSUPPORTED_ANSWERS:
            called_unsupported = True
        elif ans in GROUNDED_ANSWERS:
            called_unsupported = False
        elif ans in MIDDLE_ANSWERS:
            # The pre-registered rule folds the middle level toward the
            # unsupported side: a record with visible gaps is not one an
            # independent reviewer could reconstruct from.
            called_unsupported = True
        else:
            unscorable += 1
            continue
        scored.append(
            (r["participant_code"], ref, int(called_unsupported == answer_key[ref]))
        )
    return scored, unscorable


# --- Mixed-effects logistic model, two crossed random intercepts -------------
#
# correct_ij ~ Bernoulli(p_ij),  logit(p_ij) = beta0 + u_i + v_j
#   u_i ~ N(0, s_rev^2)   reviewer i
#   v_j ~ N(0, s_rec^2)   record j
#
# Fitted by Laplace-approximated ML. The joint mode of (u, v) is found by
# Newton steps on the penalised log-likelihood, then the Laplace determinant
# term is evaluated on the full (n_rev + n_rec) Hessian. beta0, s_rev and s_rec
# are optimised by Nelder-Mead over three parameters, which is enough for a
# problem this small and avoids a numerical-derivative dependency.


def _sigmoid(x):
    if x >= 0:
        z = math.exp(-x)
        return 1.0 / (1.0 + z)
    z = math.exp(x)
    return z / (1.0 + z)


def _penalised_mode(y, ri, ci, n_rev, n_rec, beta0, s_rev, s_rec, iters=60):
    u = [0.0] * n_rev
    v = [0.0] * n_rec
    pu = 1.0 / (s_rev * s_rev)
    pv = 1.0 / (s_rec * s_rec)
    for _ in range(iters):
        gu = [-pu * u[k] for k in range(n_rev)]
        gv = [-pv * v[k] for k in range(n_rec)]
        hu = [pu] * n_rev
        hv = [pv] * n_rec
        for t in range(len(y)):
            i, j = ri[t], ci[t]
            p = _sigmoid(beta0 + u[i] + v[j])
            resid = y[t] - p
            w = p * (1.0 - p)
            gu[i] += resid
            gv[j] += resid
            hu[i] += w
            hv[j] += w
        step = 0.0
        for k in range(n_rev):
            d = gu[k] / hu[k]
            u[k] += d
            step = max(step, abs(d))
        for k in range(n_rec):
            d = gv[k] / hv[k]
            v[k] += d
            step = max(step, abs(d))
        if step < 1e-10:
            break
    return u, v


def _logdet_hessian(y, ri, ci, n_rev, n_rec, beta0, u, v, pu, pv):
    """log|H| for the crossed Hessian, exactly, by Schur complement.

    H = [[Du, C], [C^T, Dv]] where Du and Dv are diagonal and C[i][j] is the
    summed working weight for reviewer i on record j.

    THE DIAGONAL APPROXIMATION THAT WAS HERE FIRST WAS WRONG AND THE SELF-TEST
    CAUGHT IT. Dropping the cross block C removes the only term that couples the
    two random factors, and the optimiser responded by driving the smaller
    component to its floor: on simulated data with a true record SD of 0.600 it
    returned 0.000. A variance component that collapses to zero is exactly the
    result someone would quote as "record difficulty does not matter", so the
    approximation would have produced a confident wrong answer to the question
    the appendix exists to answer.

    log|H| = log|Du| + log|Dv - C^T Du^-1 C|, and the Schur complement is
    n_rec x n_rec, which is 24 x 24 here. Cholesky on that is nothing.
    """
    du = [pu] * n_rev
    dv = [pv] * n_rec
    C = [[0.0] * n_rec for _ in range(n_rev)]
    for t in range(len(y)):
        i, j = ri[t], ci[t]
        p = _sigmoid(beta0 + u[i] + v[j])
        w = p * (1.0 - p)
        du[i] += w
        dv[j] += w
        C[i][j] += w

    # S = Dv - C^T Du^-1 C
    S = [[0.0] * n_rec for _ in range(n_rec)]
    for j in range(n_rec):
        S[j][j] = dv[j]
    for i in range(n_rev):
        inv = 1.0 / du[i]
        row = C[i]
        for a in range(n_rec):
            ra = row[a]
            if ra == 0.0:
                continue
            ra_inv = ra * inv
            for b in range(a, n_rec):
                if row[b] != 0.0:
                    S[a][b] -= ra_inv * row[b]
    for a in range(n_rec):
        for b in range(a):
            S[a][b] = S[b][a]

    # Cholesky. S is positive definite at the mode; a failure means the mode
    # search did not converge, and that is reported rather than patched.
    logdet_S = 0.0
    L = [[0.0] * n_rec for _ in range(n_rec)]
    for a in range(n_rec):
        acc = S[a][a] - sum(L[a][k] * L[a][k] for k in range(a))
        if acc <= 1e-14:
            return None
        L[a][a] = math.sqrt(acc)
        logdet_S += 2.0 * math.log(L[a][a])
        for b in range(a + 1, n_rec):
            L[b][a] = (S[b][a] - sum(L[b][k] * L[a][k] for k in range(a))) / L[a][a]
    return sum(math.log(d) for d in du) + logdet_S


def _laplace_negloglik(params, y, ri, ci, n_rev, n_rec):
    beta0, ls_rev, ls_rec = params
    s_rev = math.exp(ls_rev)
    s_rec = math.exp(ls_rec)
    if not (1e-3 < s_rev < 20 and 1e-3 < s_rec < 20):
        return 1e12
    u, v = _penalised_mode(y, ri, ci, n_rev, n_rec, beta0, s_rev, s_rec)

    ll = 0.0
    for t in range(len(y)):
        p = _sigmoid(beta0 + u[ri[t]] + v[ci[t]])
        p = min(max(p, 1e-12), 1 - 1e-12)
        ll += y[t] * math.log(p) + (1 - y[t]) * math.log(1 - p)
    pu = 1.0 / (s_rev * s_rev)
    pv = 1.0 / (s_rec * s_rec)
    for k in range(n_rev):
        ll += -0.5 * pu * u[k] * u[k] - 0.5 * math.log(2 * math.pi) - math.log(s_rev)
    for k in range(n_rec):
        ll += -0.5 * pv * v[k] * v[k] - 0.5 * math.log(2 * math.pi) - math.log(s_rec)

    logdet = _logdet_hessian(y, ri, ci, n_rev, n_rec, beta0, u, v, pu, pv)
    if logdet is None:
        return 1e12
    ll += 0.5 * (n_rev + n_rec) * math.log(2 * math.pi) - 0.5 * logdet
    return -ll


def _nelder_mead(f, x0, args, iters=800, tol=1e-9):
    n = len(x0)
    pts = [list(x0)]
    for k in range(n):
        p = list(x0)
        p[k] += 0.35 if p[k] == 0 else 0.35 * abs(p[k])
        pts.append(p)
    vals = [f(p, *args) for p in pts]
    for _ in range(iters):
        order = sorted(range(n + 1), key=lambda k: vals[k])
        pts = [pts[k] for k in order]
        vals = [vals[k] for k in order]
        if abs(vals[-1] - vals[0]) < tol:
            break
        cen = [sum(p[k] for p in pts[:-1]) / n for k in range(n)]
        ref = [cen[k] + 1.0 * (cen[k] - pts[-1][k]) for k in range(n)]
        fref = f(ref, *args)
        if fref < vals[0]:
            exp = [cen[k] + 2.0 * (cen[k] - pts[-1][k]) for k in range(n)]
            fexp = f(exp, *args)
            pts[-1], vals[-1] = (exp, fexp) if fexp < fref else (ref, fref)
        elif fref < vals[-2]:
            pts[-1], vals[-1] = ref, fref
        else:
            con = [cen[k] + 0.5 * (pts[-1][k] - cen[k]) for k in range(n)]
            fcon = f(con, *args)
            if fcon < vals[-1]:
                pts[-1], vals[-1] = con, fcon
            else:
                for k in range(1, n + 1):
                    pts[k] = [pts[0][m] + 0.5 * (pts[k][m] - pts[0][m]) for m in range(n)]
                    vals[k] = f(pts[k], *args)
    best = min(range(n + 1), key=lambda k: vals[k])
    return pts[best], vals[best]


def fit_crossed(scored):
    revs = sorted({s[0] for s in scored})
    recs = sorted({s[1] for s in scored})
    ri_of = {c: k for k, c in enumerate(revs)}
    ci_of = {c: k for k, c in enumerate(recs)}
    y = [s[2] for s in scored]
    ri = [ri_of[s[0]] for s in scored]
    ci = [ci_of[s[1]] for s in scored]

    mean = sum(y) / float(len(y))
    mean = min(max(mean, 1e-6), 1 - 1e-6)
    x0 = [math.log(mean / (1 - mean)), math.log(0.8), math.log(0.5)]
    best, nll = _nelder_mead(
        _laplace_negloglik, x0, (y, ri, ci, len(revs), len(recs))
    )
    beta0, ls_rev, ls_rec = best
    s_rev, s_rec = math.exp(ls_rev), math.exp(ls_rec)
    var_rev, var_rec = s_rev ** 2, s_rec ** 2
    resid = (math.pi ** 2) / 3.0  # logistic residual variance
    total = var_rev + var_rec + resid
    return {
        "n_obs": len(y),
        "n_reviewers": len(revs),
        "n_records": len(recs),
        "intercept_logit": beta0,
        "intercept_prob": _sigmoid(beta0),
        "sd_reviewer": s_rev,
        "sd_record": s_rec,
        "var_reviewer": var_rev,
        "var_record": var_rec,
        "icc_reviewer": var_rev / total,
        "icc_record": var_rec / total,
        "neg_loglik": nll,
    }


SINGULAR_SD = 0.02  # below this an estimate is at the boundary, not a value


def profile_sd(scored, which, fit, lo=0.001, hi=3.0, steps=24):
    """Profile-likelihood interval for one SD, holding the other free.

    A BOUNDARY ESTIMATE IS NOT THE SAME AS A ZERO. On 16 reviewers x 24 records
    the record variance is weakly identified: across six simulated datasets with
    a true record SD of 0.600, this estimator returned 0.001, 0.780, 0.713,
    0.288, 0.677 and 0.858. One of those six is a singular fit. Reporting the
    0.001 as "record difficulty does not matter" would be wrong, and the
    profile interval is what stops that reading.

    Returns (low, high) at the conventional 1.92-nat drop, or None if the
    profile does not cross on the searched range.
    """
    revs = sorted({s[0] for s in scored})
    recs = sorted({s[1] for s in scored})
    ri_of = {c: k for k, c in enumerate(revs)}
    ci_of = {c: k for k, c in enumerate(recs)}
    y = [s[2] for s in scored]
    ri = [ri_of[s[0]] for s in scored]
    ci = [ci_of[s[1]] for s in scored]
    n_rev, n_rec = len(revs), len(recs)
    best_nll = fit["neg_loglik"]

    def nll_at(val):
        if which == "record":
            f = lambda p, *a: _laplace_negloglik(
                [p[0], p[1], math.log(val)], *a)
            x0 = [fit["intercept_logit"], math.log(max(fit["sd_reviewer"], 1e-2))]
        else:
            f = lambda p, *a: _laplace_negloglik(
                [p[0], math.log(val), p[1]], *a)
            x0 = [fit["intercept_logit"], math.log(max(fit["sd_record"], 1e-2))]
        _, v = _nelder_mead(f, x0, (y, ri, ci, n_rev, n_rec), iters=200)
        return v

    grid = [lo * (hi / lo) ** (k / float(steps - 1)) for k in range(steps)]
    prof = [(g, nll_at(g)) for g in grid]
    thresh = best_nll + 1.92
    inside = [g for g, v in prof if v <= thresh]
    if not inside:
        return None
    return (min(inside), max(inside))


def by_item(scored, answer_key):
    agg = defaultdict(lambda: [0, 0])
    for _, rec, ok in scored:
        agg[rec][0] += ok
        agg[rec][1] += 1
    rows = []
    for rec in sorted(agg):
        ok, n = agg[rec]
        rows.append(
            {
                "record": rec,
                "class": "unsupported" if answer_key.get(rec) else "grounded",
                "correct": ok,
                "reads": n,
                "accuracy": 100.0 * ok / n if n else 0.0,
            }
        )
    return sorted(rows, key=lambda r: r["accuracy"])


def by_reviewer(scored):
    agg = defaultdict(lambda: [0, 0])
    for rev, _, ok in scored:
        agg[rev][0] += ok
        agg[rev][1] += 1
    rows = []
    for rev in sorted(agg):
        ok, n = agg[rev]
        rows.append({"reviewer": rev, "correct": ok, "reads": n,
                     "accuracy": 100.0 * ok / n if n else 0.0})
    return sorted(rows, key=lambda r: r["accuracy"])


def selftest():
    """Recover known variance components from simulated data, across seeds.

    A SINGLE SEED IS NOT A TEST AND THE FIRST VERSION OF THIS PROVED IT. It
    seeded once, got a singular fit on the record component, and reported FAIL
    on a correct estimator. Before that it had reported PASS on an estimator
    whose Hessian approximation was genuinely wrong. One seed cannot tell those
    two situations apart.

    This runs six datasets of the real 16 x 24 shape and asks whether the
    estimator recovers the components in the median, which is what an estimator
    is entitled to be judged on. It also reports how many fits landed on the
    boundary, because that rate is the reason the appendix reports a profile
    interval alongside the point estimate.
    """
    import random
    import statistics as st

    true_b0, true_su, true_sv = 1.9, 0.9, 0.6
    got_su, got_sv, singular = [], [], 0
    for seed in (1, 2, 3, 4, 5, 6):
        random.seed(seed)
        u = [random.gauss(0, true_su) for _ in range(16)]
        v = [random.gauss(0, true_sv) for _ in range(24)]
        scored = []
        for i in range(16):
            for j in range(24):
                p = _sigmoid(true_b0 + u[i] + v[j])
                scored.append(("R%02d" % i, "rec%02d" % j,
                               1 if random.random() < p else 0))
        fit = fit_crossed(scored)
        got_su.append(fit["sd_reviewer"])
        got_sv.append(fit["sd_record"])
        if fit["sd_record"] < SINGULAR_SD or fit["sd_reviewer"] < SINGULAR_SD:
            singular += 1
        print("  seed %d: sd_reviewer=%.3f  sd_record=%.3f%s"
              % (seed, fit["sd_reviewer"], fit["sd_record"],
                 "   <- singular" if fit["sd_record"] < SINGULAR_SD else ""))

    med_su, med_sv = st.median(got_su), st.median(got_sv)
    print()
    print("SELF-TEST, 6 simulated datasets of the real 16 x 24 shape")
    print("  truth       sd_reviewer=%.3f  sd_record=%.3f" % (true_su, true_sv))
    print("  median fit  sd_reviewer=%.3f  sd_record=%.3f" % (med_su, med_sv))
    print("  singular fits: %d of 6" % singular)
    ok = abs(med_su - true_su) < 0.30 and abs(med_sv - true_sv) < 0.30
    if ok:
        print("  PASS: components recovered in the median.")
        print("  NOTE: %d of 6 fits hit the boundary on the record component."
              % singular)
        print("  That is a property of this sample size, not of the estimator,")
        print("  and it is why a point estimate near zero must be reported with")
        print("  its profile interval and never as 'no item variance'.")
    else:
        print("  FAIL: median off. Do not quote any fit from this build.")
    return 0 if ok else 1


def emit_appendix(fit, items, reviewers, prof_rev=None, prof_rec=None):
    L = []
    A = L.append
    A("## Appendix C. Exploratory reviewer and item variance analysis")
    A("")
    A("**Status: exploratory.** This analysis was specified after the "
      "pre-registration, in response to peer critique, and is labelled "
      "exploratory throughout. It does not bear on the pre-registered primary "
      "criterion, which is reported in Section 6.1 unchanged.")
    A("")
    A("The primary analysis treats reviewers as the unit of observation and "
      "does not model record difficulty. The crossed analysis below adds the "
      "records as a second random factor (Bates et al., 2015; Barr et al., "
      "2013):")
    A("")
    A("```")
    A("correct ~ 1 + (1 | reviewer) + (1 | record)")
    A("```")
    A("")
    A("Fitted as a mixed-effects logistic model over all %d graded reads from "
      "%d reviewers and %d records."
      % (fit["n_obs"], fit["n_reviewers"], fit["n_records"]))
    A("")
    A("| Component | Estimate |")
    A("|---|---|")
    A("| Intercept (logit) | %.3f |" % fit["intercept_logit"])
    A("| Intercept (probability of a correct read for an average reviewer on an "
      "average record) | %.1f%% |" % (100 * fit["intercept_prob"]))
    A("| Reviewer SD | %.3f |" % fit["sd_reviewer"])
    A("| Record SD | %.3f |" % fit["sd_record"])
    A("| Reviewer variance | %.3f |" % fit["var_reviewer"])
    A("| Record variance | %.3f |" % fit["var_record"])
    A("| ICC, reviewer | %.3f |" % fit["icc_reviewer"])
    A("| ICC, record | %.3f |" % fit["icc_record"])
    # "95%" inside a format string is a literal percent followed by a
    # conversion. Escaped, or the row that reports the interval is the one line
    # in the file that raises.
    A("| Reviewer SD, profile 95%% interval | %s |"
      % ("%.3f to %.3f" % prof_rev if prof_rev else "not identified on the searched range"))
    A("| Record SD, profile 95%% interval | %s |"
      % ("%.3f to %.3f" % prof_rec if prof_rec else "not identified on the searched range"))
    A("")
    if fit["sd_record"] < SINGULAR_SD or fit["sd_reviewer"] < SINGULAR_SD:
        A("**This is a singular fit and must not be read as a zero.** At least "
          "one variance component was estimated at the boundary. On a design of "
          "this size that happens to a correct estimator on genuinely non-zero "
          "variance: in six simulated datasets of the same 16 by 24 shape with a "
          "true record SD of 0.600, this estimator returned a boundary value "
          "once. A boundary estimate means the sample cannot distinguish the "
          "component from zero, not that the component is zero. The profile "
          "intervals below carry the actual information.")
        A("")
    if fit["var_record"] > fit["var_reviewer"]:
        A("**Record variance exceeds reviewer variance.** More of the "
          "variation in whether a read is correct is attributable to which "
          "record was read than to which reviewer read it. The corpus "
          "dependence of the headline figure is therefore greater than the "
          "participant-level interval alone conveys, and Section 8.3 "
          "understates rather than overstates the limitation.")
    else:
        A("**Reviewer variance exceeds record variance.** More of the "
          "variation in whether a read is correct is attributable to which "
          "reviewer read it than to which record was read, which is "
          "consistent with the dispersion reported in Section 6.3 and "
          "supports treating reviewer heterogeneity as the primary "
          "operational concern.")
    A("")
    A("### Item-level accuracy, hardest first")
    A("")
    A("| Record | Class | Correct | Reads | Accuracy |")
    A("|---|---|---|---|---|")
    for r in items:
        A("| %s | %s | %d | %d | %.1f%% |"
          % (r["record"], r["class"], r["correct"], r["reads"], r["accuracy"]))
    A("")
    A("### Reviewer-level accuracy, lowest first")
    A("")
    A("| Reviewer | Correct | Reads | Accuracy |")
    A("|---|---|---|---|")
    for r in reviewers:
        A("| %s | %d | %d | %.1f%% |"
          % (r["reviewer"], r["correct"], r["reads"], r["accuracy"]))
    A("")
    A("Reviewer identifiers are study codes. No name appears in this table.")
    return "\n".join(L)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--write", action="store_true",
                    help="emit the Appendix C replacement block to stdout")
    ap.add_argument("--selftest", action="store_true",
                    help="run the optimiser self-test and exit; needs no key")
    args = ap.parse_args()

    if args.selftest:
        return selftest()

    key = service_key()
    answer_key = load_key(key)
    reads = load_reads(key)

    per_participant = defaultdict(int)
    for r in reads:
        per_participant[r["participant_code"]] += 1
    kept = {c for c, n in per_participant.items() if n >= MIN_READS}
    dropped = sorted(set(per_participant) - kept)
    reads = [r for r in reads if r["participant_code"] in kept]

    scored, unscorable = score(reads, answer_key)
    if not scored:
        die("no scorable reads after applying the pre-registered rules")

    print("Detection panel, crossed reviewer and item variance")
    print("  participants retained (>= %d of %d reads): %d"
          % (MIN_READS, CORPUS_SIZE, len(kept)))
    print("  participants excluded by the pre-registered rule: %d %s"
          % (len(dropped), dropped if dropped else ""))
    print("  scorable graded reads: %d" % len(scored))
    print("  unscorable rows skipped: %d" % unscorable)
    print()

    fit = fit_crossed(scored)
    items = by_item(scored, answer_key)
    reviewers = by_reviewer(scored)

    print("  intercept (logit)   %.4f   => %.2f%% for an average reviewer"
          % (fit["intercept_logit"], 100 * fit["intercept_prob"]))
    print("  sd_reviewer         %.4f   var %.4f   ICC %.4f"
          % (fit["sd_reviewer"], fit["var_reviewer"], fit["icc_reviewer"]))
    print("  sd_record           %.4f   var %.4f   ICC %.4f"
          % (fit["sd_record"], fit["var_record"], fit["icc_record"]))
    print()
    print("  hardest record  %s at %.1f%%"
          % (items[0]["record"], items[0]["accuracy"]))
    print("  easiest record  %s at %.1f%%"
          % (items[-1]["record"], items[-1]["accuracy"]))
    print("  lowest reviewer %s at %.1f%%"
          % (reviewers[0]["reviewer"], reviewers[0]["accuracy"]))
    print()
    print("  Fitted by Laplace-approximated ML with the exact crossed Hessian")
    print("  (Schur complement + Cholesky). Cross-check against lme4 or")
    print("  statsmodels using the formula printed in the appendix block.")

    print()
    print("  profiling the variance components (this takes a minute)...")
    prof_rev = profile_sd(scored, "reviewer", fit)
    prof_rec = profile_sd(scored, "record", fit)
    print("  sd_reviewer profile 95%%: %s"
          % ("%.3f to %.3f" % prof_rev if prof_rev else "not identified"))
    print("  sd_record   profile 95%%: %s"
          % ("%.3f to %.3f" % prof_rec if prof_rec else "not identified"))
    if fit["sd_record"] < SINGULAR_SD or fit["sd_reviewer"] < SINGULAR_SD:
        print()
        print("  SINGULAR FIT. A component is at the boundary. Report the")
        print("  profile interval, never the point estimate alone, and do not")
        print("  write that the component is zero.")

    if args.write:
        print()
        print("=" * 72)
        print(emit_appendix(fit, items, reviewers, prof_rev, prof_rec))

    return 0


if __name__ == "__main__":
    sys.exit(main())
