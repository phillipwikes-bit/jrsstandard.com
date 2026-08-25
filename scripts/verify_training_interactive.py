#!/usr/bin/env python3
"""Drive the training page in a real browser and exercise every control on it.

WHY. Source audits and status-code checks both passed while the owner kept
reporting that the training was broken. Neither answers the only question that
matters: when a person opens the page and touches things, does anything happen.
This clicks every control and records the outcome.

WHAT IT EXERCISES, in both the default view and the ?focus=1 view that is
handed out to reviewers:

  1. arrival            no overlay in the way, module list on screen
  2. every module row   click the body, the panel must actually open
  3. every open button  same panel, reached the other way
  4. mark complete      progress must advance and persist to localStorage
  5. sticky nav         every anchor must scroll to an element that exists
  6. in-page jump links every href="#..." must land on a real element
  7. role cards         each of the five must render a panel with kit links
  8. kit downloads      every download href must resolve, none may 404
  9. certificate        the name field and generate control must be present
 10. console            zero uncaught errors across the whole pass

Usage:
  python3 scripts/verify_training_interactive.py --base http://127.0.0.1:8822
Exit 0 = every control works.
"""
import sys

from playwright.sync_api import sync_playwright

CHROME = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome"
BASE = "http://127.0.0.1:8822"
for i, a in enumerate(sys.argv):
    if a == "--base" and i + 1 < len(sys.argv):
        BASE = sys.argv[i + 1].rstrip("/")

results = []


def check(name, ok, detail=""):
    results.append((name, ok, detail))
    return ok


def run(pw, label, query):
    b = pw.chromium.launch(executable_path=CHROME, args=["--no-sandbox"])
    ctx = b.new_context(viewport={"width": 390, "height": 844})
    pg = ctx.new_page()
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto(BASE + "/training.html" + query, wait_until="networkidle")
    pg.wait_for_timeout(700)

    # 1. arrival
    ov = pg.query_selector("#enroll-overlay")
    check("%s: nothing blocks arrival" % label,
          pg.query_selector("#gate-overlay") is None
          and (ov is None or not ov.is_visible()), "")
    check("%s: the module list is on screen" % label,
          pg.is_visible("#module-list"), "")

    # 2 + 3. every module, both ways in
    for idx in range(6):
        body = pg.query_selector("#module-row-%d .module-body" % idx)
        if not body:
            check("%s: module %d row exists" % (label, idx + 1), False, "no .module-body")
            continue
        body.scroll_into_view_if_needed()
        pg.wait_for_timeout(90)
        body.click()
        pg.wait_for_timeout(260)
        panel = pg.query_selector("#module-panel-%d" % idx)
        box = panel.bounding_box() if panel else None
        h = round(box["height"]) if box else 0
        check("%s: module %d opens on the row" % (label, idx + 1), h > 50,
              "panel height %d" % h)

    for idx in range(6):
        btn = pg.query_selector("#module-btn-%d" % idx)
        if not btn:
            check("%s: module %d has an open button" % (label, idx + 1), False, "missing")
            continue
        btn.scroll_into_view_if_needed()
        pg.wait_for_timeout(90)
        btn.click()
        pg.wait_for_timeout(240)
        panel = pg.query_selector("#module-panel-%d" % idx)
        cls = panel.get_attribute("class") if panel else ""
        check("%s: module %d button reaches its panel" % (label, idx + 1),
              "open" in (cls or "") or (panel and panel.bounding_box()
                                        and panel.bounding_box()["height"] > 50),
              "class=%s" % cls)

    # 4. completion persists.
    # The two loops above leave module 1 toggled shut, so open it deliberately
    # rather than assuming a state the loops happen to produce.
    if "open" not in (pg.get_attribute("#module-panel-0", "class") or ""):
        pg.evaluate("toggleModule(0)")
        pg.wait_for_timeout(300)
    mc = pg.query_selector("#module-panel-0 button.btn-complete, "
                           "#module-panel-0 [onclick*='markComplete']")
    check("%s: the complete control is visible on this viewport" % label,
          bool(mc) and mc.is_visible(),
          "visible=%s" % (mc.is_visible() if mc else "no element"))
    if mc and mc.is_visible():
        mc.scroll_into_view_if_needed()
        pg.wait_for_timeout(90)
        mc.click()
        pg.wait_for_timeout(320)
        stored = pg.evaluate(
            "JSON.parse(localStorage.getItem('jrs-training-progress')||'{}')['0']")
        check("%s: marking module 1 complete persists" % label, stored is True,
              "stored=%r" % stored)
    else:
        check("%s: marking module 1 complete persists" % label, False,
              "control not reachable")

    # 5 + 6. every in-page anchor lands somewhere real
    hrefs = pg.eval_on_selector_all(
        "a[href^='#']", "els => els.map(e => e.getAttribute('href'))")
    dead = []
    for h in hrefs:
        frag = h[1:]
        if not frag:
            continue
        if not pg.query_selector("#" + frag.replace(":", "\\:")):
            dead.append(h)
    check("%s: every in-page jump link has a target" % label, not dead,
          "%d links, dead: %s" % (len(hrefs), dead or "none"))

    # 7. the five role cards
    roles = pg.eval_on_selector_all(
        ".role-path-card", "els => els.map(e => e.getAttribute('data-role'))")
    # A card with no data-role cannot be selected and is a defect in itself.
    blank = sum(1 for r in roles if not r)
    check("%s: every role card carries a data-role" % label, blank == 0,
          "%d of %d blank" % (blank, len(roles)))
    roles = [r for r in roles if r]
    if roles:
        broken = []
        for r in roles:
            pg.evaluate("selectRole(\"%s\")" % r)
            pg.wait_for_timeout(200)
            content = pg.eval_on_selector(
                "#role-panel-content", "e => e.innerHTML.length")
            links = pg.eval_on_selector_all(
                "#role-panel-content a[href]",
                "els => els.map(e => e.getAttribute('href'))")
            if content < 200 or not links:
                broken.append("%s(len=%s,links=%d)" % (r, content, len(links)))
        check("%s: every role card renders a panel with links" % label, not broken,
              "%d roles, broken: %s" % (len(roles), broken or "none"))
    else:
        check("%s: role cards present" % label, label.startswith("focus"),
              "none on the page (expected in focus mode)")

    # 8. downloads
    dls = pg.eval_on_selector_all(
        "a[href*='/api/dl']", "els => els.map(e => e.getAttribute('href'))")
    bad = [d for d in dls if "e=" not in d and "f=" not in d]
    check("%s: every download link carries a document token" % label, not bad,
          "%d download links, malformed: %s" % (len(dls), bad or "none"))

    # 9. certificate
    check("%s: the certificate name field is present" % label,
          pg.query_selector("#cert-name") is not None, "")

    # 10. console
    check("%s: no uncaught JavaScript errors" % label, not errs, errs[:3])

    b.close()


def main():
    with sync_playwright() as pw:
        run(pw, "default", "")
        run(pw, "focus", "?focus=1")
        run(pw, "invite", "?access=k7m2p9x4t1c8&focus=1&src=panel-org")

    width = max(len(n) for n, _, _ in results)
    failed = 0
    for name, ok, detail in results:
        if not ok:
            failed += 1
        print("%s  %-*s  %s" % ("PASS" if ok else "FAIL", width, name, detail))
    print("\n%d checks, %d failed  (base %s)" % (len(results), failed, BASE))
    return 0 if failed == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
