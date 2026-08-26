#!/usr/bin/env python3
"""Collapse the revenue model to one motion: engine licensing.

WHY. api/_offer-config.js:58 already carries the argument:

    "The engine is the only offer that scales without the owner's time, so it
     is the one that belongs in a tier ladder rather than in a fixed-scope
     engagement."

Three fixed-scope engagements sit above that line and contradict it:

    audit        $250  five de-identified records, read by the owner
    governance   $500  a standard or template set, plus five records
    calibration  $750  one licensed run, scored by the holder

All three consume owner hours, and weekly capacity is recorded as a hard
constraint (check_zero_drift.py:1719, "10 to 15 hours"). All three have an
empty checkout_url and have therefore never taken a payment. Thirteen people
reached the unconfigured screen between 14 and 21 August 2026 and left nothing
recoverable (api/checkout.js:250).

WHAT THIS DOES NOT DO. It does not delete the offers. api/checkout-stats.js,
api/leads-4b7e2c9af106d385.js, api/asset-stats.js and the owner programme page
all read these keys to resolve historical rows, and deleting them would turn
existing records into orphans. Each is marked retired instead, so history still
names itself while nothing new can be sold.

It also does not touch the free practitioner track. That track is the demand
engine, not a revenue line, and charging for it would trade reach for pennies.

    python3 scripts/collapse_to_licensing.py            # dry run, default
    python3 scripts/collapse_to_licensing.py --apply    # write the changes
"""
import io
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CONFIG = os.path.join(ROOT, "api", "_offer-config.js")
CHECKOUT = os.path.join(ROOT, "api", "checkout.js")

RETIRE = ("audit", "governance", "calibration")

BANNER = """// RETIRED 2026-08-26. The revenue model collapsed to a single motion:
// engine licensing. These three were fixed-scope engagements that consumed
// owner hours against a recorded weekly capacity of 10 to 15 hours, and the
// file's own comment below says the engine is the only offer that scales
// without that time. None of them ever took a payment: every checkout_url was
// empty for the whole time they were listed.
//
// THEY ARE MARKED RATHER THAN DELETED. api/checkout-stats.js,
// api/leads-4b7e2c9af106d385.js, api/asset-stats.js and the owner programme
// page resolve historical rows through these keys. Deleting them would orphan
// records that already exist. retired:true stops anything new being sold while
// history keeps its names.
//
// The audit scope did not disappear. It became the free evaluation step in
// ENGINE_TIERS below, which is where a five-record read belongs: proof inside
// a licensing conversation rather than a $250 product competing with it.
"""


def read(p):
    return io.open(p, encoding="utf-8").read()


def plan_config(src):
    """Return (new_src, list_of_changes) for the offer config."""
    changes = []
    out = src

    if "RETIRED 2026-08-26" not in out:
        anchor = "export const OFFERS = {"
        if anchor not in out:
            raise SystemExit("OFFERS block not found in %s" % CONFIG)
        out = out.replace(anchor, BANNER + anchor, 1)
        changes.append("prepend retirement banner above OFFERS")

    for key in RETIRE:
        pat = re.compile(r"(\n  %s:\s*\{)" % re.escape(key))
        m = pat.search(out)
        if not m:
            changes.append("SKIP %s: key not found" % key)
            continue
        block_start = m.end()
        if re.search(r"retired:\s*true", out[block_start:block_start + 400]):
            changes.append("SKIP %s: already retired" % key)
            continue
        insert = "\n    retired: true,   // retired 2026-08-26, licensing-only model"
        out = out[:block_start] + insert + out[block_start:]
        changes.append("mark %s retired" % key)

    return out, changes


def plan_checkout(src):
    """A retired offer must not render a buy path, and must not 404 either."""
    changes = []
    out = src
    marker = "// RETIRED OFFER GUARD"
    if marker in out:
        changes.append("SKIP checkout: guard already present")
        return out, changes

    anchor = "  const prefetch = isNotAClick(req);"
    if anchor not in out:
        changes.append("SKIP checkout: anchor not found, apply by hand")
        return out, changes

    guard = '''  // RETIRED OFFER GUARD. A retired offer is not an unknown offer: someone
  // reaching this link followed a real reference, so it explains what changed
  // and routes them to the licensing conversation rather than a 404.
  if (offer && offer.retired) {
    if (!prefetch) await record(env, key, 'retired', req, srcTag);
    return new Response(null, {
      status: 302,
      headers: {
        'Location': 'https://www.jrsstandard.com/enterprise.html#enterprise-inquiry',
        'Cache-Control': 'no-store'
      }
    });
  }

'''
    out = out.replace(anchor, anchor + "\n\n" + guard, 1)
    changes.append("add retired-offer 302 into the licensing funnel")
    return out, changes


def main():
    apply = "--apply" in sys.argv
    cfg_src = read(CONFIG)
    chk_src = read(CHECKOUT)

    cfg_new, cfg_changes = plan_config(cfg_src)
    chk_new, chk_changes = plan_checkout(chk_src)

    print("api/_offer-config.js")
    for c in cfg_changes:
        print("   %s" % c)
    print("   %d -> %d bytes" % (len(cfg_src), len(cfg_new)))
    print("api/checkout.js")
    for c in chk_changes:
        print("   %s" % c)
    print("   %d -> %d bytes" % (len(chk_src), len(chk_new)))

    print("\nNOT TOUCHED, deliberately:")
    print("   ENGINE_TIERS            the licensing ladder is the whole model now")
    print("   evaluation tier         already free at price_usd: 0")
    print("   training / guides       the demand engine, stays free")
    print("   checkout lead capture   the mechanism that catches enterprise buyers")
    print("   historical offer keys   retained so existing rows still resolve")

    if not apply:
        print("\nDRY RUN. Nothing written. Re-run with --apply to write.")
        return

    io.open(CONFIG, "w", encoding="utf-8").write(cfg_new)
    io.open(CHECKOUT, "w", encoding="utf-8").write(chk_new)
    print("\nwritten")


if __name__ == "__main__":
    main()
