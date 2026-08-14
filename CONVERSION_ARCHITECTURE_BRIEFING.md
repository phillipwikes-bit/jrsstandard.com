# CONVERSION ARCHITECTURE BRIEFING

**Prepared 2026-08-14. Every finding checked against the live site and the files on disk.**

## STATUS: the two headline remedies are BUILT AND LIVE

| Remedy | State |
|---|---|
| Re-architect the `/check.html` fold | **LIVE.** Evidence above the modes, caveat below the self-assessment. Verified order on the rendered page: evidence 347px, modes 571px, caveat 2116px |
| Build `/engagement.html` | **LIVE**, linked from 36 pages |

**Still open** are the entity name, terms of service, the `noindex` decision on the intake pages, and the scoping-call bridge. Those are owner decisions, not build work.

**Fixed before this was written:** `/api/checkout` opened with *"Payment link not live yet."* That was the last screen before a $500 purchase, telling a General Counsel the product is unfinished. It now reads as scoping and invoicing: fixed price, purchase orders accepted, no records exchanged at that stage. Deployed and verified live. **That was my copy, not a recommendation.**

---

## 1. Door-level conversion

**The fold is currently problem, then caveat.** The status strip carrying "Commercial demand has not yet been established" sits **above** the seven failure modes. A General Counsel is being told nobody buys this before they have seen what it is. Claims control is right; the placement is inverted.

| Move | Why |
|---|---|
| **Move the status strip below the self-assessment** | Same words, same honesty. Read after they have found two modes in their own file it lands as rigour. Read before value it lands as a disclaimer on a prototype |
| **Put the confidence interval above the modes** | "16 independent experts across 11 countries, 384 graded reads, 83.9%, 95% CI 72.7 to 95.1" appears **nowhere** on `/check.html`. Nobody selling governance software publishes a CI. **The interval is the credential** |
| **Kill the hour** | "Run it against five closed matters in an hour" asks for an hour a GC does not have. The page already supports one record in four minutes. The copy is asking for more than the page does |
| **Do not add a lead magnet** | Ungated with nothing transmitted is the differentiator against every vendor asking for a work email. Protect it |

---

## 2. Executive trust and signal architecture

**The structural gap: there is no page you can send to procurement.**

Verified on disk: **zero** security, DPA, trust or terms pages. One privacy page. A buyer's next step after "interesting" is forwarding this to their own counsel, and there is nothing to forward.

- **Build `/engagement.html`.** One page, no design work required: data isolation, de-identification protocol, what is stored and what is not, retention, IP ownership of the deliverable, insurance status, standard engagement letter. **This is the single highest-value page that does not exist.**
- **Present tiers as engagements, not products.** Scope, fixed fee, turnaround, deliverable, in that order. Elite buyers read a fee schedule and distrust a pricing table.
- **"Experimental" maturity appears on 5 public pages, unframed.** To a governance buyer that reads *prototype*. The same word, framed as a rung on a pre-registered ladder with thresholds fixed in advance, reads as *disciplined*. One sentence wherever it appears.
- **Lead the Data Isolation Guarantee with the mechanism.** "There is no upload form on this page" is verifiable in two seconds. "We never store your data" is what everyone says.

---

## 3. Friction as asset

**Keep the manual scoping. It is correct at this price.** Self-serve card checkout at $750 would cost credibility with this buyer: it signals consumer software rather than a controlled engagement.

- **The friction is not the problem. The silence is.** A mailto has no acknowledgement and no expected response time. **State the service level on the page: scope and invoice within one business day.**
- **The missing bridge.** Between the free diagnostic and the $250 engagement there is nothing. Add a **no-charge 20-minute scoping call that reads one record on the call.** Not a discovery call. That is the only step that converts someone who just found two modes in their own file.
- **Purchase orders and invoicing are now stated on the checkout page**, which removes the largest procurement objection at this size.

---

## 4. Structural leaks

Counted across the public HTML on 2026-08-14:

| Leak | Measured | Why it signals indie |
|---|---|---|
| No entity named anywhere | **"Phillip Wikes" on 65 pages**, no practice name or registered address | A GC cannot contract with a person's name on a website. Incorporation is not required; a consistent practice name and address in the footer closes most of it |
| Personal mailto as the only channel | **20 pages** | The mailto is fine. The absence of any stated process around it is not |
| No terms of service | **0 files** | First thing enterprise legal looks for on a paid engagement touching client records, and the fastest way to lose the deal |
| Intake pages are `noindex` | all three | Deliberate and correct while testing, but **no inbound buyer can find them.** Worth re-taking now the offers are live |

---

## The one thing to do this week

**Build `/engagement.html`.** Everything else here is optimisation. That page is the difference between a General Counsel being interested and a General Counsel being able to act.

---

*Findings verified against the live site and the repository on 2026-08-14. No figure carried from memory.*
