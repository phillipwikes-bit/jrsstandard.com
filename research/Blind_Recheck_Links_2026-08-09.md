# Blind second-read links

**PRIVATE. Generated 2026-08-09. Never publish this file: it maps each slot to a link.**

Three unassigned reader links for the public-records study. Each opens the same ten cases and records against an anonymous slot, so the endpoint never needs to know who holds which key. Write the name in this table when you hand one out.

| Slot | Assigned to | Link |
|---|---|---|
| R1 | offered to Stacyann Young to forward to her attorney contact, 2026-08-09 | https://jrsstandard.com/recheck.html?k=llfmfn3rb2 |
| R2 | *unassigned* | https://jrsstandard.com/recheck.html?k=swlck68d5b |
| R3 | *unassigned* | https://jrsstandard.com/recheck.html?k=ra9rn80s5k |

Three rather than one because a single reader gives one agreement figure with no way to tell a disagreement from a misread, and because a reader can go quiet. Hand out one, and the other two exist if you need them.

**R1 went to Stacyann Young to forward**, because she has the relationship with the reader and a cold link from a stranger would not be answered. That is a deliberate trade: it puts the packet one step from the person who knows the answers. The message asks her directly not to tell the reader how she read any of these cases. The link itself cannot leak them, because it does not contain them, but a conversation can.

## What the reader gets

The ten cases, each with its public source and a one-paragraph description of what the record is. Nothing else. Not the original read, not the basis note, not the recorded outcome, not the distribution of reads in the set. None of those values exists anywhere in `api/recheck.js`, so viewing source does not reveal them.

## What the reader is asked

One label per case, Ready, Needs work or Gap, plus a sentence on what drove the call, plus a tick if they already knew how that case came out. Then name, email, optional organization, optional note on prior familiarity, one required consent tick, and an optional tick allowing them to be named in the paper.

Answers save to their browser as they go, so they can stop and come back. A partial return is accepted: forcing all ten before anything saves risks losing all ten.

## What must never be sent

`research/Blind_Recheck_KEY_E08.md`. It holds the original reads and the recorded outcomes for these exact ten cases.

## Scoring, once answers are in

Raw agreement out of the number answered, plus Gwet's AC1 with a 95 percent interval, the same statistic used for the reliability panel so the two are comparable. Report the confusion pattern as well as the headline: a Ready against Needs work disagreement is a different finding from Ready against Gap. Ten cases gives a wide interval and it should be reported wide.

## Where the answers land

`pilot_contacts`, RLS on, no anon read, tagged `source='recheck-submit'`, with the full answer set as JSON in the message column. Link opens are logged to `interaction_events` as `source='recheck-link'` with the slot and never the key, so an unopened packet can be told apart from one that opened and was abandoned.
