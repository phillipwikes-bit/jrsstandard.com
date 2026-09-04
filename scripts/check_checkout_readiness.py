#!/usr/bin/env python3
"""Report exactly what is unconfigured in the commercial checkout path.

Reads api/_offer-config.js as the single source of truth and prints, per offer
and per engine tier, which fields hold a real value and which are the deliberate
empty or null placeholders. Nothing is inferred from anywhere else, because a
price or a payment destination that exists in two places is the defect the config
file was written to prevent.

This script REPORTS. It never writes a checkout URL or a price. Those can only
come from the owner's own payment account, and a plausible-looking URL invented
here would be a fabricated payment destination.

Exit codes:
  0  the file parses and the report printed. This is the normal case whether or
     not anything is configured, because "nothing is configured" is the correct
     and intended state while the commercial offer is parked.
  1  the file could not be parsed, or an offer is internally inconsistent (a
     price with no label, a label with no price, a live offer with no URL).
"""

from __future__ import annotations

import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CONFIG = os.path.join(ROOT, "api", "_offer-config.js")

PAYMENT_ENV = ("STRIPE_SECRET_KEY", "STRIPE_PUBLISHABLE_KEY", "STRIPE_WEBHOOK_SECRET",
               "LEMONSQUEEZY_API_KEY", "PADDLE_API_KEY")


def read_text(path: str) -> str:
    with open(path, encoding="utf-8") as fh:
        return fh.read()


def blocks(src: str, const_name: str) -> dict[str, str]:
    """Split one exported object literal into its top-level entries."""
    start = src.find("export const %s = {" % const_name)
    if start < 0:
        raise SystemExit("could not find %s in %s" % (const_name, CONFIG))
    i = src.find("{", start)
    depth = 0
    end = i
    while end < len(src):
        if src[end] == "{":
            depth += 1
        elif src[end] == "}":
            depth -= 1
            if depth == 0:
                break
        end += 1
    body = src[i + 1:end]

    out: dict[str, str] = {}
    for match in re.finditer(r"^\s{2}([a-z_]+):\s*\{", body, re.M):
        key = match.group(1)
        j = body.find("{", match.start())
        d = 0
        k = j
        while k < len(body):
            if body[k] == "{":
                d += 1
            elif body[k] == "}":
                d -= 1
                if d == 0:
                    break
            k += 1
        out[key] = body[j + 1:k]
    return out


def field(block: str, name: str) -> str | None:
    match = re.search(r"\b%s:\s*(.+?)(?:,\s*//|,\s*$|,\n)" % re.escape(name), block, re.M)
    if not match:
        return None
    return match.group(1).strip().rstrip(",").strip()


def is_empty(value: str | None) -> bool:
    return value is None or value in ("''", '""', "null", "")


def main() -> int:
    if not os.path.exists(CONFIG):
        print("FAIL  api/_offer-config.js does not exist")
        return 1
    src = read_text(CONFIG)
    problems: list[str] = []

    print("=" * 78)
    print("FIXED-SCOPE OFFERS  (api/_offer-config.js :: OFFERS)")
    print("=" * 78)
    offers = blocks(src, "OFFERS")
    for key in sorted(offers):
        b = offers[key]
        retired = field(b, "retired") == "true"
        price = field(b, "price_label")
        url = field(b, "checkout_url")
        state = "RETIRED" if retired else ("LIVE" if not is_empty(url) else "LIVE, NO PAYMENT URL")
        print("\n  %-14s %s" % (key, state))
        print("    price          %s" % (price or "(none)"))
        print("    checkout_url   %s" % ("(empty, requires owner input)" if is_empty(url) else url))
        if not retired and is_empty(url):
            problems.append("%s is not retired and has no checkout_url" % key)

    print()
    print("=" * 78)
    print("ENGINE LICENCE TIERS  (api/_offer-config.js :: ENGINE_TIERS)")
    print("=" * 78)
    tiers = blocks(src, "ENGINE_TIERS")
    for key in sorted(tiers):
        b = tiers[key]
        free = field(b, "free") == "true"
        price_usd = field(b, "price_usd")
        price_label = field(b, "price_label")
        tokens = field(b, "tokens")
        ceiling = field(b, "call_ceiling")
        missing = [n for n, v in (("price_usd", price_usd), ("price_label", price_label),
                                  ("tokens", tokens), ("call_ceiling", ceiling))
                   if is_empty(v)]
        state = "FREE, fully configured" if free else (
            "PRICED" if not missing else "UNPRICED, %d field(s) awaiting input" % len(missing))
        print("\n  %-22s %s" % (key, state))
        print("    price_usd      %s" % (price_usd or "(none)"))
        print("    price_label    %s" % (price_label or "(none)"))
        print("    tokens         %s" % (tokens or "(none)"))
        print("    call_ceiling   %s" % (ceiling or "(none)"))
        if missing:
            print("    awaiting       %s" % ", ".join(missing))
        if is_empty(price_usd) != is_empty(price_label) and not free:
            problems.append("%s has a price and a label that disagree about existing" % key)

    print()
    print("=" * 78)
    print("PAYMENT GATEWAY ENVIRONMENT")
    print("=" * 78)
    api_dir = os.path.join(ROOT, "api")
    referenced: set[str] = set()
    for name in sorted(os.listdir(api_dir)):
        if name.endswith(".js"):
            referenced |= set(re.findall(r"process\.env\.([A-Z_0-9]+)", read_text(os.path.join(api_dir, name))))
    found = sorted(v for v in PAYMENT_ENV if v in referenced)
    print("\n  Payment-gateway env vars referenced anywhere in api/:  %s"
          % (", ".join(found) if found else "NONE"))
    print("  Env vars the code does read:                           %s"
          % ", ".join(sorted(referenced)))
    print("""
  No gateway SDK is wired in. /api/checkout does not call Stripe, Lemon Squeezy
  or any other provider: it reads checkout_url from the config above and issues
  a 302, or, when that field is empty, renders a lead-capture form that writes to
  pilot_contacts with source 'checkout-fallback' and alerts the owner. So there
  is no missing environment variable to set. What is missing is a hosted payment
  link per offer, pasted into checkout_url.""")

    print()
    print("=" * 78)
    print("TO UNPARK, IN ORDER")
    print("=" * 78)
    print("""
  1. Decide whether the offer is unparked at all. IP_SALE_TRACKER revision 14
     records the paid offer being withdrawn from the public site until the
     research programme completes, and check_revenue_model_is_licensing_only
     plus check_no_price_literals_in_html enforce that decision in the build.
     Reversing it is a decision, not a configuration change.
  2. Set retired:false on any OFFERS entry being brought back, or leave all
     three retired and price the ENGINE_TIERS ladder instead. The file's own
     note says the ladder is the only offer that scales without owner hours.
  3. Create one payment link per live offer in the provider dashboard and paste
     each into checkout_url. Nothing in this repository can mint one.
  4. Set price_usd and price_label together on any tier being priced. isPriced()
     requires both, and a surface reading a half-set tier shows "Contact for
     pricing" rather than a blank.
  5. Re-run scripts/check_zero_drift.py. Several guards read these values, and a
     price on a public page is one of them.""")

    print()
    if problems:
        print("FAIL  %d inconsistency(ies):" % len(problems))
        for line in problems:
            print("        %s" % line)
        return 1
    print("PASS  config is internally consistent; every unset field is a deliberate placeholder")
    return 0


if __name__ == "__main__":
    sys.exit(main())
