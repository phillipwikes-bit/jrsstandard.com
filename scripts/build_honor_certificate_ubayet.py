#!/usr/bin/env python3
"""Issue Ubayet Hossain's Global Governance and Transparency Honor certificate.

CANONICAL BUILDER ONLY. research/CLAUDE.md section VIII requires that every
certificate come from research/build_certificate.py. This file supplies the
honoree's data and calls make_certificate from that module; it does not draw
anything itself, so the layout, colours, fonts and rules are the ones already
issued to 21 reviewers and to Stacyann Young.

TITLE LINE IS "Certificate of Recognition", NOT "Certificate of Completion".
That distinction was fixed on 2026-08-08 after the honor certificate went out
with the wrong title: an honoree did not complete a 24-record set. Verified
against the issued reference, research/JRS_Honor_Certificate_Stacyann_Young.pdf,
whose drawn text reads "Certificate of Recognition".

NO EMPLOYER ON THE CERTIFICATE, following the same precedent. His FRM is kept,
because a professional designation is his and not an employer's. His title,
"Independent Financial Risk & Model Validation Professional", is his own wording
from 2026-08-28 and is recorded in api/honor.js, but the certificate names the
person, not the post, exactly as Stacyann Young's does.

THE CITATION IS NOT WRITTEN HERE. It is read out of api/honor.js at run time, so
the certificate cannot drift from the citation the honor system would render if
he opened his link.

    python3 scripts/build_honor_certificate_ubayet.py
"""
import importlib.util
import io
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HONOR_JS = os.path.join(ROOT, "api", "honor.js")
BUILDER = os.path.join(ROOT, "research", "build_certificate.py")
KEY = "b3874haudg"
OUT = os.path.join(ROOT, "research", "JRS_Honor_Certificate_Ubayet_Hossain.pdf")


def honor_record(key):
    """Read the honoree's stored fields, so nothing here is retyped."""
    src = io.open(HONOR_JS, encoding="utf-8").read()
    i = src.find("'%s': {" % key)
    if i < 0:
        raise SystemExit("[REQUIRED_ENV_PARAM] key %s not found in api/honor.js" % key)
    block = src[i:src.find("\n  },", i)]
    out = {}
    for field in ("code", "name", "title", "org", "study", "order"):
        m = re.search(r"%s:\s*'((?:[^'\\]|\\.)*)'" % field, block)
        out[field] = m.group(1) if m else ""
    parts = re.findall(r"'((?:[^'\\]|\\.)*)'", block[block.find("citation:"):])
    out["citation"] = "".join(parts).replace("\\'", "'")
    hn = re.search(r"HONOR_NAME\s*=\s*'([^']+)'", src)
    hy = re.search(r"HONOR_YEAR\s*=\s*'([^']+)'", src)
    out["honor"] = hn.group(1) if hn else ""
    out["year"] = hy.group(1) if hy else ""
    return out


def load_builder():
    spec = importlib.util.spec_from_file_location("build_certificate", BUILDER)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    if not hasattr(mod, "make_certificate"):
        raise SystemExit("build_certificate.py exposes no make_certificate")
    return mod


def main():
    r = honor_record(KEY)
    mod = load_builder()

    # Body follows the issued precedent exactly: "was named the recipient of
    # the <honor> (<year>), <ordering clause>, <citation>."
    citation = r["citation"]
    citation = citation[0].lower() + citation[1:] if citation.startswith("In recognition") \
        else citation
    body = ("was named the recipient of the %s (%s), %s, %s"
            % (r["honor"], r["year"], r["order"], citation))

    path, lines = mod.make_certificate(
        r["name"], "August 29, 2026", body, OUT,
        title="Certificate of Recognition")

    print("wrote %s | body lines: %d" % (os.path.relpath(path, ROOT), lines))
    print()
    print("HONOREE DATA, read from api/honor.js, not retyped:")
    for k in ("code", "name", "title", "org", "study"):
        print("  %-9s %s" % (k, r[k] if r[k] else "(empty)"))
    return 0


if __name__ == "__main__":
    sys.exit(main())
