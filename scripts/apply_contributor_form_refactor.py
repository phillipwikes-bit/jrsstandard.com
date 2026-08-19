#!/usr/bin/env python3
"""contributor.html and api/contributor.js: deadline, initiative removal,
consent consolidation.

WHAT CHANGES
  A. FALLBACK_DATE moves to 5 September 2026 in api/contributor.js, which is
     the single source the page reads through p.fallback_date.
  B. The on-file sentence is shortened.
  C. The two initiative checkboxes and their .sect wrapper are deleted, and the
     two payload fields they fed are removed from the fetch body.
  D. The three separate yes/no permission blocks become ONE consent control.

WHY THE CONSENT CONTROL IS A THREE-OPTION GROUP AND NOT A LONE CHECKBOX
  A single master checkbox has two states, and the form has to produce three
  distinct server-side outcomes: credit me, include my work but keep me
  anonymous, and do not use my contribution. A lone checkbox can express the
  first and the absence of the first. It cannot express anonymity, which is the
  election the API and the roster treat as a first-class answer, and it cannot
  record an explicit refusal.

  So the consolidation is real but takes the shape the data requires: one
  block, one plain-language statement, one decision, one tap. Six taps across
  three blocks become one. Nothing is preselected, so silence is still never
  read as consent, which is the property api/contributor.js was built around.

  The three server booleans are still sent explicitly. THE API IS NOT CHANGED
  and no stored field changes meaning.

Usage:
  python3 scripts/apply_contributor_form_refactor.py --apply
  python3 scripts/apply_contributor_form_refactor.py --check
"""
import argparse
import io
import os
import re
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PAGE = os.path.join(ROOT, "contributor.html")
API = os.path.join(ROOT, "api", "contributor.js")

OLD_DATE = "const FALLBACK_DATE = 'Monday, 31 August 2026';"
NEW_DATE = "const FALLBACK_DATE = 'Saturday, 5 September 2026';"

OLD_SENTENCE = (
    "    var s = '<div class=\"onfile\">If I do not hear from you by <b>' + "
    "esc(p.fallback_date) + '</b>, the paper uses what is already on file for "
    "you';")
NEW_SENTENCE = (
    "    var s = '<div class=\"onfile\">If I do not hear back from you by <b>' "
    "+ esc(p.fallback_date) + '</b>, the paper uses what is on file for you';")

OLD_CSS = (
    ".qbox{border:1px solid var(--rule);background:var(--surface2);"
    "padding:12px 13px;margin-bottom:10px}")
NEW_CSS = (
    ".qbox{border:1px solid var(--rule);background:var(--surface2);"
    "padding:12px 13px;margin-bottom:10px}\n"
    "/* Consolidated consent. One block, one decision. Rows are full-width\n"
    "   tap targets at 44px minimum so a thumb cannot miss on mobile, and the\n"
    "   group stacks rather than sitting in a row, which removes the\n"
    "   horizontal cramping the three yes/no rows had at 360px. */\n"
    ".consent{border:1px solid var(--rule);background:var(--surface2);"
    "padding:13px 13px 5px;margin-bottom:14px}\n"
    ".consent .q{font-size:12.5px;color:var(--text);line-height:1.55;"
    "margin-bottom:5px}\n"
    ".consent .sub{font-size:11px;color:var(--muted-soft);line-height:1.5;"
    "margin-bottom:10px}\n"
    ".consent label{display:flex;gap:10px;align-items:flex-start;"
    "min-height:44px;padding:9px 10px;margin:0 -4px 8px;border:1px solid "
    "transparent;border-radius:2px;font-size:12.5px;color:var(--text);"
    "line-height:1.5;cursor:pointer}\n"
    ".consent label:has(input:checked){border-color:var(--accent-dim);"
    "background:rgba(190,148,71,.07)}\n"
    ".consent label input{width:auto;margin:2px 0 0;flex:0 0 auto}\n"
    ".consent label b{font-weight:500}\n"
    ".consent label .d{display:block;font-size:11px;color:var(--muted-soft);"
    "line-height:1.5;margin-top:2px}")

OLD_BLOCKS = """    + '<div class="qbox">'
      + '<div class="q">May your name and title be printed in the paper as a named contributor?</div>'
      + '<div class="sub">Either answer is fine. No means your contribution is counted in the aggregate and your name appears nowhere.</div>'
      + '<div class="opts">'
        + '<label><input type="radio" name="c-named" value="yes"><span>Yes</span></label>'
        + '<label><input type="radio" name="c-named" value="no"><span>No</span></label>'
      + '</div>'
    + '</div>'

    + '<div class="qbox">'
      + '<div class="q">May the review work you contributed, and your credited name and title, continue to be used in publications and materials about this study?</div>'
      + '<div class="sub">This covers the paper, follow-up articles, and the study record. It does not give away anything you own outside this study.</div>'
      + '<div class="opts">'
        + '<label><input type="radio" name="c-use" value="yes"><span>Yes</span></label>'
        + '<label><input type="radio" name="c-use" value="no"><span>No</span></label>'
      + '</div>'
    + '</div>'

    + '<div class="qbox">'
      + '<div class="q">If this work transfers to a successor organization, may that permission and your contact details transfer with it?</div>'
      + '<div class="sub">You can withdraw either permission at any time by writing to info@jrsstandard.com.</div>'
      + '<div class="opts">'
        + '<label><input type="radio" name="c-transfer" value="yes"><span>Yes</span></label>'
        + '<label><input type="radio" name="c-transfer" value="no"><span>No</span></label>'
      + '</div>'
    + '</div>'

    + '<div class="sect">'
      + '<label class="chk"><input type="checkbox" id="s-rtkw"><span><b style="color:var(--text);font-weight:500">The Right to Know Why.</b> When a decision affects a person\\'s job, housing, or livelihood, that person deserves to know why it was made and to have a fair way to question it. <a href="decision-reconstruction-risk.html" target="_blank" rel="noopener">Read it</a></span></label>'
      + '<label class="chk"><input type="checkbox" id="s-defend"><span><b style="color:var(--text);font-weight:500">The Decisions You Can Defend.</b> Every consequential decision is eventually questioned. The only uncertainty is whether the record will still explain and defend it. <a href="decision-reconstruction-risk.html" target="_blank" rel="noopener">Read it</a></span></label>'
    + '</div>'
"""

NEW_BLOCK = """    + '<div class="consent">'
      + '<div class="q">How may your contribution be used?</div>'
      + '<div class="sub">One answer covers all of it: whether you are named in the paper, whether your credited name and the review work you contributed may keep appearing in publications and materials about this study, and whether those permissions travel with the work if it passes to a successor organization. Nothing here touches anything you own outside this study, and you can change or withdraw it at any time by writing to info@jrsstandard.com.</div>'
      + '<label><input type="radio" name="c-all" value="named"><span><b>Credit me by name.</b><span class="d">Your name and title are printed in the paper, and your credited name and contributed work may continue to be used in study publications, including by a successor organization.</span></span></label>'
      + '<label><input type="radio" name="c-all" value="anon"><span><b>Use my work, but keep me anonymous.</b><span class="d">Your contribution is counted in the aggregate on the same terms. Your name appears nowhere.</span></span></label>'
      + '<label><input type="radio" name="c-all" value="none"><span><b>Do not use my contribution in publications.</b><span class="d">Nothing you contributed is used in the paper or in later study materials.</span></span></label>'
    + '</div>'
"""

OLD_PICK = """    function pick(n){ var e = document.querySelector('input[name="' + n + '"]:checked'); return e ? e.value : ''; }
    var cNamed = pick('c-named');
    var cUse = pick('c-use');
    var cTransfer = pick('c-transfer');

    msg.style.color = 'var(--review-text)';
    // The three permission questions come first and are always required. Nobody
    // is asked to identify themselves before answering them.
    if (!cNamed)    { msg.textContent = 'Please answer the naming question. Either answer is fine.'; return; }
    if (!cUse)      { msg.textContent = 'Please answer the continuing use question. Either answer is fine.'; return; }
    if (!cTransfer) { msg.textContent = 'Please answer the transfer question. Either answer is fine.'; return; }
"""

NEW_PICK = """    function pick(n){ var e = document.querySelector('input[name="' + n + '"]:checked'); return e ? e.value : ''; }

    // ONE ANSWER, THREE PERMISSIONS, STILL SENT EXPLICITLY.
    // The three yes/no blocks were consolidated into a single choice. The
    // server contract is unchanged: it still receives an explicit yes or no
    // for naming, continuing use, and transfer, and still rejects a missing
    // one. Nothing is preselected, so silence is never read as consent.
    var choice = pick('c-all');
    var cNamed    = (choice === 'named') ? 'yes' : (choice ? 'no' : '');
    var cUse      = (choice === 'none')  ? 'no'  : (choice ? 'yes' : '');
    var cTransfer = (choice === 'none')  ? 'no'  : (choice ? 'yes' : '');

    msg.style.color = 'var(--review-text)';
    // The permission question comes first and is always required. Nobody is
    // asked to identify themselves before answering it.
    if (!choice) { msg.textContent = 'Please choose how your contribution may be used. Any of the three is fine.'; return; }
"""

OLD_BODY = """        k: key, name: name, title: title, organization: org, email: email, profile: link,
        consent_named: cNamed, consent_use: cUse, consent_transfer: cTransfer,
        support_rtkw: el('s-rtkw').checked,
        support_defend: el('s-defend').checked
"""
NEW_BODY = """        k: key, name: name, title: title, organization: org, email: email, profile: link,
        consent_named: cNamed, consent_use: cUse, consent_transfer: cTransfer
"""

PAGE_RULES = [
    ("B", "on-file sentence shortened, deadline reference retained",
     OLD_SENTENCE, NEW_SENTENCE),
    ("C1", "initiative checkboxes and their section wrapper removed",
     OLD_BLOCKS, NEW_BLOCK),
    ("C2", "initiative payload fields removed from the request body",
     OLD_BODY, NEW_BODY),
    ("D1", "consent consolidated to a single control",
     OLD_PICK, NEW_PICK),
    ("D2", "consent styling, mobile touch targets", OLD_CSS, NEW_CSS),
]
API_RULES = [
    ("A", "deadline moved to 5 September 2026", OLD_DATE, NEW_DATE),
]

PAGE_REQUIRED = [
    ("single consent control present", 'name="c-all"'),
    ("three outcomes offered", 'value="named"'),
    ("anonymity outcome offered", 'value="anon"'),
    ("refusal outcome offered", 'value="none"'),
    ("consent still sent as three explicit values",
     "consent_named: cNamed, consent_use: cUse, consent_transfer: cTransfer"),
    ("button unchanged", "<button id=\"go\" type=\"button\">Confirm my details</button>"),
    ("sect rule retained for the confirmation screen", ".sect{border-top:"),
    ("confirmation screen still uses sect", "+ '<div class=\"sect\">'"),
]
PAGE_FORBIDDEN = [
    "s-rtkw", "s-defend", "support_rtkw", "support_defend",
    "The Right to Know Why.", "The Decisions You Can Defend.",
    'name="c-named"', 'name="c-use"', 'name="c-transfer"',
    "naming question", "continuing use question", "transfer question",
    "do not hear from you",
]
API_REQUIRED = [
    ("new deadline", "Saturday, 5 September 2026"),
    ("forced-choice contract intact", "if (!cName)     return json({ error:'naming_choice_required' }, 400);"),
    ("anonymity path intact", "const wantsNamed = (cName === 'yes');"),
]
API_FORBIDDEN = ["Monday, 31 August 2026"]


def apply(path, rules, check):
    body = io.open(path, encoding="utf-8").read()
    applied, already, failed = [], [], []
    for tag, where, old, new in rules:
        if new in body and old not in body:
            already.append((tag, where))
            continue
        n = body.count(old)
        if n == 1:
            body = body.replace(old, new, 1)
            applied.append((tag, where))
        elif n > 1:
            failed.append((tag, where, "matched %d times" % n))
        else:
            failed.append((tag, where, "no match"))
    if not check and not failed:
        io.open(path, "w", encoding="utf-8").write(body)
    return body, applied, already, failed


def main():
    ap = argparse.ArgumentParser()
    g = ap.add_mutually_exclusive_group(required=True)
    g.add_argument("--apply", action="store_true")
    g.add_argument("--check", action="store_true")
    args = ap.parse_args()
    check = args.check

    api_body, a_ap, a_al, a_fa = apply(API, API_RULES, check)
    pg_body, p_ap, p_al, p_fa = apply(PAGE, PAGE_RULES, check)

    req_miss = [(l, n) for l, n in PAGE_REQUIRED if n not in pg_body]
    forb = [t for t in PAGE_FORBIDDEN if t in pg_body]
    areq_miss = [(l, n) for l, n in API_REQUIRED if n not in api_body]
    aforb = [t for t in API_FORBIDDEN if t in api_body]

    # inline script must still parse
    m = re.search(r"<script>(.*?)</script>", pg_body, re.S)
    syntax_ok = True
    syntax_err = ""
    if m:
        tmp = os.path.join("/tmp", "contributor_inline_check.js")
        io.open(tmp, "w", encoding="utf-8").write(m.group(1))
        r = subprocess.run(["node", "--check", tmp], capture_output=True)
        syntax_ok = (r.returncode == 0)
        syntax_err = r.stderr.decode()[:300]
    api_syntax = subprocess.run(["node", "--check", API], capture_output=True)
    api_ok = (api_syntax.returncode == 0)

    ok = (not a_fa and not p_fa and not req_miss and not forb
          and not areq_miss and not aforb and syntax_ok and api_ok)

    W = sys.stdout.write
    for tag, where in a_ap + p_ap:
        W("APPLIED  %-3s %s\n" % (tag, where))
    for tag, where in a_al + p_al:
        W("ALREADY  %-3s %s\n" % (tag, where))
    for tag, where, why in a_fa + p_fa:
        W("FAILED   %-3s %s: %s\n" % (tag, where, why))
    W("\ncontributor.html required : %s\n" % ("PASS" if not req_miss else "FAIL"))
    for l, n in req_miss:
        W("  MISSING  %s\n" % l)
    W("contributor.html forbidden: %s\n" % ("PASS" if not forb else "FAIL"))
    for t in forb:
        W("  PRESENT  %s\n" % t)
    W("api/contributor.js        : %s\n"
      % ("PASS" if not areq_miss and not aforb else "FAIL"))
    for l, n in areq_miss:
        W("  MISSING  %s\n" % l)
    for t in aforb:
        W("  PRESENT  %s\n" % t)
    W("inline script node --check: %s%s\n"
      % ("PASS" if syntax_ok else "FAIL", "" if syntax_ok else "\n" + syntax_err))
    W("api node --check          : %s\n" % ("PASS" if api_ok else "FAIL"))
    W("\nRESULT: %s\n" % ("PASS" if ok else "FAIL"))
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
