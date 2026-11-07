#!/usr/bin/env python3
"""Validate complete, unique coverage from the current Chrome theme fixture."""
import ast
import html
import json
import re
import sys
from collections import Counter
from pathlib import Path


def expected_coverage(fixture):
    inventories = []
    for name, item_type in (("cases", str), ("widths", int)):
        match = re.search(r"const\s+" + name + r"\s*=\s*(\[.*?\]);", fixture, re.S)
        if not match:
            raise ValueError(f"current theme fixture has no {name} inventory")
        values = ast.literal_eval(match.group(1))
        if (not isinstance(values, list) or not values
                or any(type(value) is not item_type for value in values)
                or len(set(values)) != len(values)):
            raise ValueError(f"invalid or duplicate {name} inventory")
        inventories.append(values)
    paths, widths = inventories
    if any(width <= 0 for width in widths):
        raise ValueError("invalid viewport width")
    return {(path, width) for path in paths for width in widths}


def measured_rows(raw, expected):
    match = re.search(r"JRS_THEME_JSON_BEGIN(.*?)JRS_THEME_JSON_END", raw, re.S)
    if not match:
        raise ValueError("no computed browser theme measurements")
    rows = json.loads(html.unescape(match.group(1)))
    if not isinstance(rows, list) or any(not isinstance(row, dict) for row in rows):
        raise ValueError("browser theme measurements must be an array of objects")
    pairs = []
    for row in rows:
        if type(row.get("path")) is not str or type(row.get("width")) is not int:
            raise ValueError("theme sample has an invalid route or viewport width")
        pairs.append((row["path"], row["width"]))
    counts = Counter(pairs)
    if set(counts) != expected or any(count != 1 for count in counts.values()):
        missing = sorted(expected - set(counts))
        unexpected = sorted(set(counts) - expected)
        duplicates = sorted(pair for pair, count in counts.items() if count > 1)
        raise ValueError(f"expected {len(expected)} unique current route/viewport samples; "
                         f"received {len(rows)}; missing={missing}; "
                         f"unexpected={unexpected}; duplicates={duplicates}")
    if any(row.get("pass") is not True for row in rows):
        failed = [(row["path"], row["width"]) for row in rows if row.get("pass") is not True]
        raise ValueError(f"source-rendered light-theme samples disagree: {failed}")
    return rows


def self_test(expected):
    rows = [{"path": path, "width": width, "pass": True}
            for path, width in sorted(expected)]
    def encoded(value):
        return "JRS_THEME_JSON_BEGIN" + json.dumps(value) + "JRS_THEME_JSON_END"
    assert measured_rows(encoded(rows), expected) == rows
    failures = {
        "missing sample": rows[:-1],
        "same-count duplicate replaces a route": rows[:-1] + [rows[0]],
        "extra sample": rows + [rows[0]],
        "unexpected route": [{**rows[0], "path": "unknown.html"}] + rows[1:],
        "unexpected viewport": [{**rows[0], "width": 800}] + rows[1:],
        "failed computed sample": [{**rows[0], "pass": False}] + rows[1:],
        "truthy non-boolean result": [{**rows[0], "pass": "false"}] + rows[1:],
        "invalid sample": [None] + rows[1:],
        "missing route identity": [{"pass": True}] + rows[1:],
        "non-array payload": {"pass": True},
    }
    for name, value in failures.items():
        try:
            measured_rows(encoded(value), expected)
        except ValueError:
            print("PASS: reject", name)
        else:
            raise AssertionError("accepted " + name)
    for value in ("Pending", "JRS_THEME_JSON_BEGIN[broken]JRS_THEME_JSON_END"):
        try:
            measured_rows(value, expected)
        except ValueError:
            pass
        else:
            raise AssertionError("accepted incomplete browser execution")
    print(f"PASS: current inventory accepts {len(expected)} unique samples; "
          "12 invalid evidence cases rejected (self-tests, not browser measurements)")


def main():
    fixture = Path(__file__).with_name("jrs-public-palette-browser-audit.html").read_text()
    expected = expected_coverage(fixture)
    if sys.argv[1:] == ["--self-test"]:
        self_test(expected)
        return
    if len(sys.argv) != 2:
        raise ValueError("usage: jrs-public-palette-check.py AUDIT_HTML | --self-test")
    raw = Path(sys.argv[1]).read_text(encoding="utf-8", errors="replace")
    rows = measured_rows(raw, expected)
    for row in rows:
        print("PASS", json.dumps(row, ensure_ascii=False))
    routes = {path for path, width in expected}
    widths = sorted({width for path, width in expected})
    print(f"PASS: computed-color/type samples on {len(routes)} routes at "
          f"{widths} pixels; {len(rows)} unique measurements (not a full accessibility audit)")


if __name__ == "__main__":
    try:
        main()
    except (OSError, ValueError, SyntaxError) as exc:
        sys.exit(f"FAIL: {exc}")
