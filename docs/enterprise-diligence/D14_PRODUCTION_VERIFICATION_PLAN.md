# D-14 Production Verification Plan

**Status: PLAN ONLY. Not executed. Execution requires deployment, which is NOT AUTHORIZED.**

The existing **12/12 development result is preserved and is not production evidence.**
`D14_SANITIZE_PATH_VERIFICATION_2026-09-15.md` holds it.

## Preconditions

Deployment authorized by the owner; `pilot.html` live and byte-verified against the deployed
commit; a test window agreed, because these submissions create real rows in `pilot_contacts`
and real Formspree deliveries.

## Cases

| # | Message content | Expected prompt | Action | Expected `pilot_contacts` row | Expected Formspree delivery |
|---|---|---|---|---|---|
| P1 | Clean text, no identifier | none | submit | **1** | **1** |
| P2 | Synthetic email | yes, labelled "email address" | **dismiss** | **0** | **0** |
| P3 | Synthetic email | yes | accept | 1 | 1 |
| P4 | Synthetic phone | yes, labelled "phone number" | **dismiss** | **0** | **0** |
| P5 | Synthetic SSN-shaped value | yes, labelled "SSN" | **dismiss** | **0** | **0** |
| P6 | Synthetic card-shaped value | yes, labelled "card number" | **dismiss** | **0** | **0** |
| P7 | Two identifiers | yes, **both** labels | accept | 1 | 1 |
| P8 | Empty | none; browser blocks | n/a | 0 | 0 |

**The decisive rows are the dismissals. Zero rows AND zero deliveries** is what makes the
`privacy.html` §2 sentence true; a row with no delivery would mean the screen gates only one
destination.

## Evidence to capture

Timestamped screenshot of each dialog including its label; a `pilot_contacts` count before and
after each case, queried read-only; Formspree delivery confirmation; and the deployed
`pilot.html` byte-compared against the commit under test.

Use **synthetic values only**. Do not submit real personal data. Delete the test rows
afterwards and record the deletion.

## What this will and will not establish

**Will:** that the screen runs in production, prompts with correct labels, and that dismissal
prevents both writes.

**Will NOT:** that every sensitive identifier is detected. Four pattern classes are covered.
**It is a prompt, not a filter**, and an accepting submitter still sends. The public sentence
claims a screen, which is what exists, and must not be widened.
