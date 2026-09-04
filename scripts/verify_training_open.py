"""Cold-visitor check: the training must open with nothing in front of it."""
from playwright.sync_api import sync_playwright
import sys

BASE = 'http://127.0.0.1:8811/training.html'
SHOT = '/tmp/claude-0/-home-user-jrsstandard-com/a76d20a8-5d43-552c-9e4f-7e7587af471a/scratchpad/'
fails = []

def check(cond, label, detail=''):
    print(('PASS  ' if cond else 'FAIL  ') + label + ('   ' + str(detail) if detail else ''))
    if not cond:
        fails.append(label)

with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
                          args=['--no-sandbox'])

    # ---- 1. cold visitor, no query string, fresh storage --------------------
    ctx = b.new_context(viewport={'width': 390, 'height': 844})
    pg = ctx.new_page()
    pg.goto(BASE, wait_until='networkidle')

    check(pg.query_selector('#gate-overlay') is None,
          'no by-invitation overlay exists in the DOM')

    enroll = pg.query_selector('#enroll-overlay')
    check(enroll is not None and not enroll.is_visible(),
          'registration overlay is not forced on arrival',
          'visible=' + str(enroll.is_visible() if enroll else 'missing'))

    # Module 1 body must be readable without any interaction beyond opening it.
    check(pg.is_visible('#module-list'), 'module list is visible to a cold visitor')

    # ---- 2. every module opens, not just the first --------------------------
    for idx in (0, 2, 5):
        pg.evaluate('toggleModule(%d)' % idx)
        pg.wait_for_timeout(250)
        panel = pg.query_selector('#module-panel-%d' % idx)
        opened = panel is not None and 'open' in (panel.get_attribute('class') or '')
        ov = pg.query_selector('#enroll-overlay')
        forced = ov is not None and ov.is_visible()
        check(opened and not forced,
              'module %d opens with no registration prompt' % (idx + 1),
              'open=%s forced_overlay=%s' % (opened, forced))

    # ---- 3. the offer strip is present but is not a lock --------------------
    pb = pg.query_selector('#preview-banner')
    check(pb is not None and pb.is_visible(), 'certificate offer strip is shown')
    box = pb.bounding_box() if pb else None
    check(box is not None and box['height'] < 200,
          'offer strip is a strip, not a wall', 'height=' + str(box['height'] if box else '?'))

    # ---- 4. the strip opens the registration, and it can be closed ----------
    pg.click('#preview-banner button')
    pg.wait_for_timeout(250)
    ov = pg.query_selector('#enroll-overlay')
    check(ov is not None and ov.is_visible(), 'registration opens when asked for')
    dl = pg.query_selector('#en-dismiss')
    check(dl is not None and dl.is_visible(), 'a way out of the registration is always shown')
    pg.evaluate('dismissEnroll()')
    pg.wait_for_timeout(200)
    check(not pg.query_selector('#enroll-overlay').is_visible(),
          'registration closes and returns to the training')

    pg.screenshot(path=SHOT + 'training-open-phone.png', full_page=False)

    # ---- 5. an old invite link still attributes its channel ----------------
    ctx2 = b.new_context(viewport={'width': 390, 'height': 844})
    pg2 = ctx2.new_page()
    pg2.goto(BASE + '?access=k7m2p9x4t1c8&src=panel-org', wait_until='networkidle')
    chan = pg2.evaluate('window._jrsChannel')
    check(chan == 'panel-org', 'an existing ?access= link still tags its channel',
          'channel=' + str(chan))
    stored = pg2.evaluate("JSON.parse(localStorage.getItem('jrs-training-progress')||'{}').channel")
    check(stored == 'panel-org', 'channel persists as a jrs-training-progress sub-key',
          'stored=' + str(stored))
    legacy = pg2.evaluate("localStorage.getItem('jrs-training-access')")
    check(legacy is None, 'the retired jrs-training-access key is never written',
          'value=' + str(legacy))

    # ---- 6. focus mode still renders ---------------------------------------
    pg3 = b.new_context(viewport={'width': 390, 'height': 844}).new_page()
    pg3.goto(BASE + '?focus=1', wait_until='networkidle')
    check(pg3.is_visible('#training-modules'), 'focus mode still shows the modules')
    ov3 = pg3.query_selector('#enroll-overlay')
    check(ov3 is None or not ov3.is_visible(), 'focus mode is not gated either')
    pg3.screenshot(path=SHOT + 'training-focus-phone.png', full_page=False)

    # ---- 7. no console errors ----------------------------------------------
    errs = []
    pg4 = b.new_context().new_page()
    pg4.on('pageerror', lambda e: errs.append(str(e)))
    pg4.goto(BASE, wait_until='networkidle')
    pg4.evaluate('toggleModule(3)')
    pg4.wait_for_timeout(300)
    check(not errs, 'no JavaScript errors on load or module open', errs[:3])

    b.close()

print('\n%d checks, %d failed' % (7 + 3 + 6, len(fails)))
sys.exit(1 if fails else 0)
