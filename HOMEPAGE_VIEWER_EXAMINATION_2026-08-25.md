# Homepage: What A Viewer Actually Sees

**Date:** 2026-08-25
**Method:** the deployed `main` at `f6c5e35` rendered in headless Chromium at four
viewports and measured in the live DOM. Screenshots attached. Google Fonts could not load
in this sandbox, so type renders in a fallback face; **everything else is exactly what a
visitor gets.**

---

## FIRST: THREE THINGS I REPORTED EARLIER WERE WRONG

I measured the HTML source. I should have rendered the page. The difference matters.

**1. The homepage is not a 24,772-word scroll. It is a 13-panel tab switcher.**
Only `#section-home` is `display:block`. Twelve panels are `display:none`:
`doccond`, `kit`, `tools`, `scenarios`, `guidance`, `roles`, `maturity`, `ai`, `usecases`,
`training`, `library`, `about`. **50,725 characters are visible; 240,415 sit in hidden
subtrees.** My "84 sections, roughly a 100-minute read" counted content no visitor sees
without clicking. **Withdraw that finding.**

**2. Only 24 of 83 `h2` elements are visible.** The B1 heading conversion was still correct
and still worth doing, but the headline number I gave you, "95 headings live", is wrong.
The honest figure is **24 visible, 59 hidden**.

**3. The dual-track band is not "1.1% down". It renders at y=972 on a 900px-tall desktop
viewport, which is 72 pixels BELOW THE FOLD.** My 1.1% figure divided by total text
including the 240,415 hidden characters. **That is why the page looks unchanged to you: on
a standard laptop the band is not on the first screen.** You were right both times.

---

## WHAT A VISITOR SEES, BY DEVICE

| | Desktop 1440 | Tablet 768 | Phone 390 |
|---|---|---|---|
| Header and nav before any content | **305px** | **305px** | **387px** |
| That as a share of the first screen | **34%** | 30% | **46%** |
| Visible `<h1>` | **none** | **none** | **none** |
| Dual-track band position | y=972, **below fold** | ~2 screens down | ~2 screens down |
| Content column width | 580px = **40% of screen** | 580px = 76% | 362px = 93% |
| Horizontal overflow | 0px | **346px** | 0px |
| Tap targets under 32px | 48 | 47 | **54** |

---

## THE SIX DEFECTS A VIEWER REACTS TO

### 1. The first screen is a menu, not a page

At 1440 and 1280 the first fourteen focusable things on the page are **all navigation**:
Home, Pilot Program, Simulations, Review Controls, Documentation Failures, Free Resources,
Deployment Kit, Simulations again, Reviewer Calibration, Research & Validation,
Implementation, Enterprise, Workflow Fit.

**No headline. No sentence. No proposition.** A visitor's first impression is a control
panel belonging to somebody else's workflow.

### 2. Three stacked navigation bars, with duplicated items

Measured bands: `cross-site-nav` at y=74 (40px), `primary-nav` at y=114 (44px), and a third
resource row beneath it.

**"Free Resources" appears in row 2 and again in row 3. "Simulations" appears in row 1 and
row 2. "Pilot Program" appears in row 1 and row 3.** The same destination is offered twice
within 100 vertical pixels, which reads as disorganisation rather than choice.

### 3. Navigation text is cut off mid-word

On desktop the second row ends **"RESEARCH & VALI"**. On tablet the third row ends
**"SIMULATION LIBRA"**. Nav items total 1,483px of content in a 1,060px container.

This is the single most damaging thing on the page. **Truncated text in the header reads as
a broken site before a visitor has read one word of substance.**

### 4. The tablet layout scrolls sideways

Document width 1,114px in a 768px viewport: **346px of horizontal overflow**, caused by the
nav rows. On an iPad the page slides left and right under the thumb. The mobile fix pack set
`body{overflow-x:hidden}` only below 640px, so the 641–1024px range was never covered.

### 5. Sixty percent of the desktop screen is empty

The content column is **580px inside a 1,440px viewport**. Content sits left of centre and
the right-hand 860px is black. At 1440 the page looks like a 600px mobile layout stretched
onto a monitor.

### 6. Phone: four stacked bands and an open menu

387px of the 844px screen is chrome, and the resource links render **as a visible grid
below the hamburger** rather than inside it. So the phone shows a "☰ MENU" button **and**
the menu contents at the same time, plus a second "HOME" link directly under the first.

Five `div` elements measure 640px, 638px, 560px, 540px and 414px inside a 390px viewport.

---

## SURGICAL CORRECTIONS, IN ORDER

| # | Correction | Effect | Effort |
|---|---|---|---|
| 1 | **Give the page a visible `<h1>`** in `#section-home` | The page currently has none. Largest SEO and accessibility gain available | 10 min |
| 2 | **Collapse three nav rows into one**, removing the duplicated Free Resources, Simulations and Pilot Program entries | Recovers ~130px of first screen and ends the truncation | 45 min |
| 3 | **Move the dual-track band above the intro paragraph** | It is 72px below the fold; this is the reason the page looks unchanged | 10 min |
| 4 | **`overflow-x:hidden` and nav wrapping up to 1024px** | Ends the 346px sideways scroll on tablet | 15 min |
| 5 | **Widen the content column to ~1,060px** and use the empty 60% for a two-column layout at 1200px and above | The page stops looking like a stretched phone layout | 1 hour |
| 6 | **Collapse the phone resource grid into the hamburger**, remove the duplicate HOME | Recovers ~230px on phone, roughly a quarter of the screen | 30 min |
| 7 | **Raise the 48–54 sub-32px tap targets to 44px** | Already partly covered by the mobile pack; the nav links were missed | 20 min |

**Items 1 to 4 are ninety minutes and fix everything a visitor complains about.**

---

## ON THE 13-PANEL TAB SWITCHER

Not in the list above, because it is a decision rather than a defect.

240,415 characters are hidden behind tabs on one URL. Search engines index it as one page
about everything, so it ranks for nothing, and a reader who wants the Ten Conditions cannot
link anyone to them. Splitting those twelve panels into twelve URLs is the structural fix.
**That is a bigger change than a surgical correction and I am not proposing it inside this
list.**
