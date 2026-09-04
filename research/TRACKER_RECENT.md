# JRS Master Tracker, recent activity

**Extract only. The permanent record is `research/MASTER_TRACKER.md`,** 1,723,919 bytes, 672 entries, committed to the development branch and never deployed to `main` by design.

Covering the 3 most recent dates: 2026-08-27, 2026-08-28, 2026-08-29. Long lines are rewrapped here for reading; the source is not modified.

---

## 2026-08-27 — **THE JRS STORY WAS FACT-CHECKED AGAINST THE REPOSITORY AND ONE CLAIM WAS CUT ON THE OWNER'S INSTRUCTION**

Phillip supplied a narrative history of JRS and asked whether it was correct. **Most of it
verifies exactly.** Maryland Commission on Civil Rights, **81 occurrences**; Ubayet Hossain
recorded verbatim as **"FRM, Associate Director for Model Validation, KPMG India"**; Hekim
Colpan's co-authorship accepted and logged; the New York pilot is the **FOIL corpus at 32 real
cases**; the five conditions map correctly to the engine's five keys; the two initiatives, the
three lanes and the licensing-only model all match the tree, the last because it was collapsed
to that yesterday. **ONE CLAIM DID NOT SURVIVE, AND IT WAS THE MOST DANGEROUS ONE IN THE
DOCUMENT.** The narrative made **"intention detection"** a core capability, calling it *"an
important part of what JRS is designed to surface"*, *"one of the more distinctive areas of
development"*, and listing *"intention-detection behavior"* and *"intention-detection
capability"* among what a platform vendor would evaluate. **Measured: `intent` and `intention`
appear ZERO times in `api/v1/review-engine.js`, `api/review.js`, `api/review-engine.js` and
`codebook.html`. "intention detection" and "intent detection" return ZERO hits across the entire
corpus.** The five conditions are basis identification, decision-process traceability,
reconstructability, evidentiary sufficiency and chronology; **none concerns intent.** **WORSE
THAN ABSENT, IT IS CONTRADICTED BY THE LIVE PUBLISHED STANDARD.** Every occurrence of the word
in `jrsstandard.html` argues the reverse: *"not usually the product of intentional falsification
or misconduct"*, *"Well-intentioned personnel working under normal operational conditions"*, and
decisively *"The gaps it identifies are usually the product of those conditions, not of
intent."* A vendor reading the narrative would have evaluated for a feature that does not exist,
against a standard that publicly disclaims it, and *"this record contains indicators of
discriminatory intent"* is the single most subpoena-exposed sentence the business could publish.
**Phillip's instruction: cut it and revise.** Done. `research/JRS_Story_2026-08-27.md`, 2,969
words: **`intent`/`intention` now appear 0 times**, and the work that section was doing is
replaced by something true and stronger, the failure mode from the ISACA article that **a record
with an obvious gap looks thin and gets caught, while a record that reads well and cannot be
reconstructed passes file-by-file review and fails later under examination**. The civil-rights
connection is kept but reframed from blame to **reviewability**: JRS does not determine whether
bias occurred, it examines whether the record preserves enough for someone else to determine
that. **"Dubai" was also corrected to "United Arab Emirates"**, because `MASTER_TRACKER.md:284`
records *"HR pilot (Tanvi Pokhriyal, UAE) n=5"* and Dubai specifically is not sourced anywhere.
The revision was screened against the repository's own banned-claim vocabulary: certif 0,
accredit 0, guarantee 0, proves 0, peer-reviewed 0, detects bias 0, determines intent 0. **Two
flags were raised and both were correctly left alone**: "fully validated" and "validated AI" are
the same sentence, *"It should not, however, be described as a fully validated AI system"*,
which is a disclaimer rather than a claim. Delivered as markdown and a 13-page PDF, since
artifacts cannot be downloaded.

---

## 2026-08-27 — four-step operationalisation plan assessed, **BACKFILLED: this turn happened and was not logged when it happened**

Phillip asked whether a four-step plan was possible: isolate the core engine, enforce data
isolation, package the B2B licensing offer, and use upcoming publications as demand generation.
**Answer: yes, and three of the four were already done, two of them in this session.** Steps 1
and 2 verified in code (`api/v1/review-engine.js` fail-closed, `api/review.js:177` keeps no
model text); step 3 shipped yesterday at `33a3988` when the revenue model collapsed to licensing
only. **STEP 4 WAS HALF TRUE AND THE HALF THAT WAS FALSE MATTERED.** *CEP Magazine* is real and
stronger than the plan treated it: **"When the Record Cannot Speak for Itself" was ACCEPTED
2026-07-16 for the November issue**, editor Bill Anholzer, in copy-editing since 2026-07-21.
**"The Evidentiary Deficit" is NOT forthcoming**: the tracker's last word is *"READY TO SUBMIT
WITH MINOR CORRECTIONS, 89/100"* dated 2026-08-18 and the pipeline audit found **no send
recorded anywhere**. It is also a trade article for Corporate Compliance Insights, not a legal
manuscript. An earlier entry already flags *"peer-reviewed backing"* as **FALSE**. **THE
SEQUENCING POINT**: CEP lands in November, roughly ten weeks out, which is almost exactly the
90-day horizon, so the article is not the demand engine, **it is the deadline**. The Evaluation
Agreement, token flow and prospect list have to exist before an inbound reader arrives, because
today they would land on a page with nothing to sign.

---

## 2026-08-27 — report delivery defect fixed, **BACKFILLED**

Phillip could not download the reports. **Cause was mine**: five of six were delivered as
artifacts, which are web pages rendered in a sandbox that blocks downloads, so he could read
them and not keep them. Only the business plan had ever become a file.
**`scripts/render_report_pdf.py`** now turns any report page into a Letter PDF, with print
handling applied at render time only so published artifacts are never modified. Six PDFs
produced and each verified for `%PDF-` header and `%%EOF` trailer rather than assumed: tracker
extract 27pp, website audit 29pp, feasibility 14pp, licensing plan 7pp, 90-day plan 12pp,
business plan 7pp. **The second half of the same complaint was the tracker itself**:
`research/MASTER_TRACKER.md` is **1.6 MB with single lines running to 6,568 characters**, which
is the correct permanent record and not a readable document. **`scripts/tracker_extract.py`**
writes a rewrapped recent-activity extract and never touches the source, verified byte-identical
before and after.

---

## 2026-08-27 — Master Tracker location answered, **BACKFILLED**

Asked where it is. Three places: **`research/MASTER_TRACKER.md`** in the working directory at
1,611,673 bytes; **committed and pushed to the `claude/html-pilot-L8rC3` branch**, which is the
durable copy that survives the session ending; and **deliberately absent from `main`**, because
`CLAUDE.md` VIII excludes `research/` from every deploy. Delivered as a 28-page PDF plus
markdown covering 26 and 27 August.

---

## 2026-08-27 — **THE OWNER ASKED HOW HE COULD TRUST THAT THE TRACKER WAS BEING KEPT. I MEASURED IT AND HE WAS RIGHT.**

Counting entries per date against the day's actual work: **2026-08-27 held ONE entry** while the
day contained roughly five substantive turns. **Two had no entry at all**, the four-step
operationalisation assessment and the report-delivery-defect fix, and a third, the
tracker-location answer, was also missing. For contrast the three days before it hold **22, 34
and 28** entries, so the failure is recent and specific rather than chronic. The three missing
turns are **backfilled and explicitly marked BACKFILLED** rather than quietly inserted, because
a log that hides its own gaps is worse than one that shows them. **THE ANSWER TO "HOW CAN I
TRUST YOU" IS NOT A STRONGER PROMISE. IT IS A NUMBER HE CAN READ.** Two mechanisms, both
committed. **`scripts/check_tracker_current.py`** prints the file size, the total entry count,
the newest date and the per-day counts, and exits 1 if today has no entry; he can run it himself
at any time without me in the loop. **`check_tracker_logged_today`** in `check_zero_drift.py`
**fails the pre-commit hook on any day the tracker has not been written to**, demonstrated by
stripping today's entries from a working copy and watching it report *"NO ENTRY for 2026-08-27;
newest is 2026-08-26"* before restoring. **WHAT NEITHER CAN CATCH, STATED PLAINLY RATHER THAN
GLOSSED**: a turn that produces no commit. The repository holds no record of conversational
turns, so nothing in it can count them, and the hook only fires when something is committed.
That residual gap is why the per-day count is printed for him to judge rather than asserted by
me. Suite now **94 checks**. From this point the Master Tracker block in every response carries
the live entry count read from the file, so a claim that the log was updated is falsifiable on
sight.

---

## 2026-08-27 — **OWNER DECISION: THE CO-AUTHOR CONFIRMATION LINKS WILL NOT BE USED. SUBMITTING TANVI'S AND HEKIM'S ARTICLES; AWAITING STACY AND UBAYET ON THEIRS.**

Recorded verbatim as a standing instruction. `42ea524` verified present and on `main`, *"feat:
co-author confirmation links live"*, dated 2026-08-24, touching `api/_coauthor-roster.js`,
`api/coauthor.js`, `api/coauthor-stats.js`, `coauthor.html`, `api/asset-stats.js` and
`vercel.json`. **The three keys resolve to M-01 Ubayet Hossain FRM (Associate Director, Model
Validation, KPMG India), V-HR-01 Tanvi Pokhriyal (Organisational Psychologist, freelance) and
E-08 Stacyann Young (Independent Researcher).** Live `/api/coauthor-stats` at
2026-08-27T12:39:35Z: **expected 3, confirmed 0, outstanding E-08, M-01, V-HR-01**, terms
version `coauthor-v1.0-2026-08-24`, and every consent counter at zero. **THE LINKS ARE LIVE AND
UNUSED AND WILL NOT BE USED. Nothing is being torn down without instruction**; the system stays
deployed and simply goes unexercised. **TWO THINGS THE OWNER SHOULD HAVE IN FRONT OF HIM, STATED
ONCE.** **(1) Tanvi is FIRST author on the ISACA manuscript** per
`research/ISACA_Submission_Package_2026-08-24.md:13` (*"Authors | Tanvi Pokhriyal and Phillip
Wikes"*), and her co-author record shows **no confirmation, no print-name consent, no use
consent and no retention consent**. Submitting names a first author who has not confirmed
through the mechanism built for that purpose. That is his call and it is recorded here as his
call. **(2) Hekim Colpan is NOT in the co-author roster at all**, which holds exactly three
keys; the CCI article's co-authorship was accepted and logged separately, so no consent record
exists in that system for the Evidentiary Deficit paper either. **I ALSO GOT THE FOURTH ARTICLE
WRONG AND THE OWNER'S MESSAGE CORRECTS ME.** On 2026-08-26 I inventoried seven manuscripts and
offered ISACA, CCI, Detection and FOIL as my read of the four. **Naming Tanvi, Hekim, Stacy and
Ubayet makes the fourth Ubayet's Rungs 1 and 2 paper, not Detection**, which also supplies the
venue that `scripts/publication_status.py` reports as `[REQUIRED_ENV_PARAM]` only in the sense
that it is now clearly an active submission rather than a dormant draft; **the venue itself is
still unrecorded anywhere in the tree and remains unknown.** **CONSEQUENCE FOR THE CHASE LIST**:
the 2026-09-05 fallback chase for E-08 and M-01 through the contributor mechanism is superseded
for those two, since the owner is handling both directly. **V-AI-12 remains outstanding on the
contributor side** and is unaffected by this decision.

---

## 2026-08-27 — **KYLE McMULLAN SIGNED OFF ON THE ISACA ARTICLE, INCLUDING AN INDEPENDENT ARITHMETIC CHECK**

Received 7:54am, LinkedIn message, screenshot on file. He opened by apologising for a slow
reply, having been away from correspondence for a few days on a family medical matter. **ON THE
ACKNOWLEDGEMENT: "the acknowledgement is agreed exactly as you have it, including the second
sentence. No changes needed."** That closes the item logged on 2026-08-21, where the
acknowledgement was rewritten to thank him for comments on audit practice and to bound that
contribution with the clause "did not extend to" the rest; **the exact form and the bounding
sentence both stand as written.** **ON THE REVISED DRAFT: "a considerably stronger piece."** He
named four changes specifically and approved each: **withdrawing the AI claim as a finding**,
**stating the circularity objection in the body rather than in an endnote**, **naming the two
exclusions**, and **saying plainly that the study cannot establish a control sample size.** All
four were the Tier 1 and Tier 2 editor corrections applied earlier this month. **HE CHECKED THE
ARITHMETIC INDEPENDENTLY AND IT RECONCILES.** In his words, "I checked the arithmetic out of
habit": **the primary table, the Wilson intervals, the Woolf test and the sensitivity analysis
including the two excluded matters all reconcile, and the appendix forum counts tie back to the
20.** That is an unprompted verification by a co-author with audit practice, of exactly the
figures a referee will attack first, and it is the strongest external check the paper has had.
**HIS VERDICT: "It reads as a defensible field pilot now, which is what it is."** That phrasing
matters and should be preserved: it claims a field pilot and nothing more, which is the same
boundary the manuscript, the engine payloads and the site all hold. **He closed: "Good luck with
it at ISACA."** **CONTEXT ON KYLE'S SEAT**: `MASTER_TRACKER.md` records him filling Sanya
Dalal's vacated compliance and investigations co-author seat on the Business Ethics paper
(*Journal of Business Ethics*), alongside Ubayet Hossain as methodology co-author. **He is also
V-AI-12 on the detection panel and was on the outstanding contributor-link list; this message is
his substantive response and it arrived without the link.**

---

## 2026-08-27 — **THE OWNER CORRECTED ME AGAIN ON THE RUNGS PAPER AND HE WAS RIGHT, SO THE CAUSE IS FIXED RATHER THAN THE SYMPTOM**

He advised that the Rung 1 and 2 paper was already merged into the international detection panel
paper co-authored by Ubayet, and told me plainly that he has had to keep reminding me. **The
record confirms him at `MASTER_TRACKER.md:750`, dated 2026-07-27: "CONSOLIDATION EXECUTED:
standalone Rungs 1-2 paper merged into the international paper
(`Detection_ArmB_Article_Draft.md`), per Phillip's decision to publish ONE flagship artifact."**
**MY DEFECT: `scripts/publication_status.py` was hand-built from filenames in `research/`**, so
it reported `research/Article1_Rungs1and2.md` as a seventh manuscript pending submission with
`[REQUIRED_ENV_PARAM] venue not recorded`. **A file on disk is not evidence of a live
submission**, and building a status table from a directory listing is the same
hand-written-constant defect this repository already guards against in four other places. The
phantom entry is removed and the Detection entry now records the absorption and names Ubayet as
co-author rather than only crediting his methodology. **IT ALSO MEANS MY "CORRECTION" LAST TURN
WAS THE WRONG DIRECTION.** On 2026-08-26 I offered ISACA, CCI, Detection and FOIL as the four;
when he named Tanvi, Hekim, Stacy and Ubayet I switched Detection out for Rungs. **The original
read was right: Ubayet's paper IS Detection, because Detection now contains Rungs.** The four
are **ISACA (Tanvi), CCI (Hekim), FOIL (Stacy), Detection (Ubayet)**. **THE GUARD TOOK TWO
ATTEMPTS AND THE FIRST ONE WAS A FALSE ALARM I CAUGHT BEFORE SHIPPING.** Version one searched
the tracker for "merged into" and treated any nearby `.md` filename as superseded; it
immediately flagged `BusinessEthics_Article_Draft.md`, which is the **destination** of a merge,
not its subject, while in the Rungs entry the destination is the filename and the source is
named only in prose. **Prose does not reliably say which side of a merge a filename sits on.**
Inference was replaced with declared data: `check_superseded_manuscripts_not_listed` now holds
an explicit map of superseded file to the tracker line establishing it, demonstrated to FAIL
with *"Article1_Rungs1and2.md listed as pending, but MASTER_TRACKER.md:750"* when the phantom is
reinserted. Suite now **95 checks**.

---

## 2026-08-27 — **THE FIFTH ARTICLE IS THE ONE THAT IS ALREADY ACCEPTED, AND MY INVENTORY OMITTED IT**

Phillip supplied the revised `.docx` of **"When the Record Cannot Speak for Itself"**, the *CEP
Magazine* (SCCE) piece **accepted 2026-07-16 for the November issue**, editor Bill Anholzer, in
copy-editing since **2026-07-21** (`MASTER_TRACKER.md:493`). **`scripts/publication_status.py`
did not contain it at all.** **SAME ROOT CAUSE AS THE PHANTOM RUNGS ENTRY, IN THE OPPOSITE
DIRECTION.** The table was hand-built from `research/*.md` filenames, so it invented a pending
manuscript from a superseded file and, here, missed a real one because the accepted article
lived as a `.docx` outside the repository. **The only accepted piece in the whole portfolio was
invisible to the tool built to report publication status.** **PRESERVED IN THE REPOSITORY**,
because an accepted manuscript held only on a laptop is one hardware failure from gone:
`research/CEP_When_the_Record_Cannot_Speak_for_Itself_ACCEPTED.docx` (40,027 bytes, the file
that was accepted and the source of truth) and a faithful text extraction alongside it at
`research/CEP_When_the_Record_Cannot_Speak_for_Itself_ACCEPTED.md`, **54 paragraphs and all
1,666 words preserved**, for search and diffing. **THE DEEPER DEFECT WAS THAT A PUBLICATION
STATUS TOOL HAD NO STATUS COLUMN.** An accepted article and an unsubmitted draft rendered
identically, which is why the omission was invisible even after the tool was run and read. A
status field is now first in every row and the tool prints a rollup. **Current state: `ACCEPTED
1 | TO SUBMIT 4 | BLOCKED 1 | BACKUP 1`**, which reconciles exactly with what Phillip has said
twice: four to submit, plus a fifth already accepted. The four to submit are **ISACA (Tanvi),
CCI (Hekim), Detection (Ubayet), FOIL (Stacy)**; Business Ethics is BLOCKED on a co-author who
has not accepted; EDPACS is a declared BACKUP. **`check_accepted_article_is_tracked` asserts
three things**: the accepted text is preserved in the repository, the inventory lists it with
its venue, and the inventory has a status column at all. Demonstrated to FAIL with
*"research/CEP_When_the_Record_Cannot_Speak_for_Itself_ACCEPTED.md missing"* when the file is
moved aside. Suite now **96 checks**. **THIS IS THE THIRD TIME TODAY THE SAME CLASS OF DEFECT
HAS SURFACED**: a hand-built list standing in for the record. It produced the phantom Rungs
paper, the missing CEP article, and the false BusinessEthics merge flag, and in each case the
correction was to replace inference or a filename scan with declared data citing its source.

---

## 2026-08-27 — **STACYANN YOUNG APPROVED THE FOIL PAPER AND SENT NINE TARGETED EDITS. ALL NINE APPLIED. SHE DID NOT USE THE CO-AUTHOR LINK.**

**DIRECT ANSWER TO THE QUESTION ASKED: no, she has not filled it out.** Live
`/api/coauthor-stats` at **2026-08-27T20:09:55Z**: expected 3, **confirmed 0**, outstanding
**E-08, M-01, V-HR-01**, `consent_print_yes` 0, `consent_use_yes` 0, `consent_keep_yes` 0,
**zero answers recorded.** Her approval came by email only, which is consistent with the owner's
standing decision of earlier today that the links will not be used. **Her sign-off: "It's a go
on my end."** **HER OBJECTIVE, IN HER OWN WORDS**: to make the manuscript match the
personal-capacity and institutional-separation language already agreed in the two emails, and to
be clear she participated as an independent researcher using public materials and is **not
representing NYC, HPD, or any other government entity**. She was explicit that she did not want
the disclaimer overstated or the paper sounding defensive, and that the substantive analysis and
framing should be preserved. **ALL NINE APPLIED, EACH VERIFIED INDIVIDUALLY, 13 of 13 CHECKS
PASS**: title to **"32 Public Cases"** with the hyphen dropped from Documentation-Quality;
contributions to **"all 32 publicly available determinations"**; **disclosure replaced with her
text**, which names the City of New York, City agencies and other government entities explicitly
and drops the weaker *"named without institutional affiliation at her request"*; **Section 4.2
rewritten to her "Public material only" opening**, keeping the statement she specifically asked
to preserve and broadening it to *"otherwise nonpublic government material"*; **"32 live
determinations" to "32 publicly available determinations"** because live could be read as active
matters; Section 6 recast as a research implication rather than a directive; **"For records
officers" to "For public-records programs"** to keep the discussion off her current role; and
the conclusion softened to *"the outcome measure with which the read showed concordance in this
sample"* for the five-audit subset. **ITEM NINE NEEDED THE MOST CARE AND A BLANKET REPLACEMENT
WOULD HAVE CORRUPTED THE PAPER.** She asked for terminology consistent with the JRS instrument.
**The word "complete" appears NINE times and only ONE is an instrument coding.** The other eight
are ordinary prose (*"a determination can read as complete and still fail"*), a dataset
descriptor (*"a completed and citable 32-case set"*, twice), a verb (*"necessary to complete the
audit"*), an adverb (*"Gap reads concentrate completely"*) and a description of agency records
(*"request tracking was absent or incomplete"*). **The instrument codes Ready, Needs work and
Gap and has no "incomplete" value**, and the sibling sentence in the same paragraph already
writes *"Needs work or Gap"*. Only `for records read as incomplete` was changed, to `for records
read as Needs work or Gap`. **HER OPTIONAL ITEM WAS DELIBERATELY NOT ADDED**: a second
personal-capacity statement after the Disclosure. She said she was fine leaving it out if it
duplicated the Disclosure, and the new Disclosure covers it. **SUBSTANTIVE ANALYSIS PRESERVED
AND PROVEN**: all **28 reported figures** are byte-identical before and after, none lost and
none gained, verified by extracting every p value, odds ratio, proportion and confidence
interval from both versions and comparing the sorted sets. Manuscript now 4,344 words. Commit
`766b6f1`. **FOIL STATUS MOVES FROM AWAITING CO-AUTHOR TO READY TO SUBMIT**, with the caveat
that her consent is recorded in email rather than through the built mechanism.

---

## 2026-08-27 — **REVISED FOIL PAPER PRODUCED FOR REVIEW, PLUS A MESSAGE TO STACYANN YOUNG ON THE SECOND READER AND THE UNREADABLE EMAIL**

The nine edits were already applied at `766b6f1`; this turn produces the reviewable artifacts.
**Revised manuscript rendered to `FOIL_Paper_REVISED_2026-08-27.pdf`, 11 pages, 101,744 bytes**,
header and EOF verified, with the markdown alongside it. **THE SECOND-READER QUESTION IS
ANCHORED TO THE PAPER'S OWN STATED LIMITATION, NOT INVENTED**: Section 7 reads *"All 32 reads
were recorded by a single domain reviewer, so no inter-rater agreement is estimated and
reader-dependence cannot be ruled out."* That is the limitation a referee is most likely to
press, and it is exactly what a second reader would remove, so the message asks whether she ever
got anyone to independently review the determinations and states plainly that **even a subset
would let an agreement figure be reported**, while making clear that if it did not come together
the paper submits as it stands with the limitation stated. **The message also carries the
owner's two other instructions**: that he was unable to read the email she sent earlier and
would like it resent, and a full account of what changed in the manuscript so she can check the
edits against what she asked for. **512 words.** It confirms her Disclosure wording went in
verbatim, that the *"at her request"* phrasing is gone, that Section 4.2 keeps the sentence she
specifically asked to preserve, and that **her optional second personal-capacity statement was
deliberately left out with an explicit offer to add it back**, since she said she was
comfortable either way. **It explains the terminology decision rather than just asserting it**:
the word "complete" appears nine times, only one was an instrument coding, and a
find-and-replace would have introduced errors into eight correct sentences. **A FALSE ALARM IN
MY OWN VERIFICATION, CAUGHT AND NOT ACTED ON.** The first check reported `32 Public Cases`
MISSING from the message. It is present; a line break in the source splits the phrase and the
probe was line-sensitive. Re-checked against normalised whitespace: **9 of 9 probes present.**
Had I trusted the first result I would have edited correct copy to satisfy a broken test. Files:
`research/Message_Stacyann_Young_2026-08-27.md` and a 2-page PDF.

---

## 2026-08-27 — **TEN CONTRIBUTOR-LINK REMINDER EMAILS GENERATED, AND WRITING THEM EXPOSED A REAL HOLE IN THE WITHDRAWAL SCANNER**

`scripts/build_reminder_emails.py` writes one file per person for **E-10, E-14, RR-106, RR-109,
RR-110, RR-116, V-AI-08, V-AI-12, V-AI-23, V-AI-27**. **Nothing is hand-copied**: names, codes
and unguessable links come from `research/Contributor_Links.md`, which is itself generated from
`api/_contributor-roster.js`, and **the fallback date is read out of `api/contributor.js` at
`FALLBACK_DATE`**, which returns *Saturday, 5 September 2026*. A date typed ten times is a date
that drifts, and a reminder carrying a wrong link is worse than no reminder. Each email is ~150
words, thanks the person for **the study they actually did** (reliability ratings, comparison
study, or detection panel, chosen by code prefix rather than one form letter), states the link
takes about a minute, names the fallback date, and says plainly that **choosing to stay
anonymous is a perfectly good answer and the form handles it in one click**. **THE HOLE.** The
first run wrote V-AI-08's file with **her full name in the path and her first name in the
greeting**. `withdraw_contributor.py --check` reported **clean**, and it was wrong twice over.
**The register holds four name forms for V-AI-08: full name, short-form full name, surname and
short first name. The short first name is a nickname, and its word-boundary pattern does not
match the longer first name it abbreviates**, so the bare first name passed untouched. **And the
scan read file CONTENTS only, so a withdrawn name sitting in a FILENAME was invisible
entirely.** A name is exposed by a directory listing just as surely as by a paragraph. **The
filename scan is now part of `scan_traces` and is demonstrated**: reinstating the badly named
file makes the check report that path at line 0 with the marker *"(in the filename)"*. **MY
FIRST FIX WAS WRONG AND THE FILE HAD ALREADY WARNED ME.** I added the bare long-form first name
to the register. It produced **77 traces**, because that form collides with **a different person
entirely, an active collaborator carrying 62 mentions across the tree**, against 3 for the
withdrawn contributor. `scripts/withdraw_contributor.py` already carried a comment warning about
exactly that collision and naming the collaborator, and I overrode it before checking. Reverted
within the hour with the reasoning recorded in the register so the next person does not repeat
it. **THE GREETING PROBLEM IS NOW SOLVED WHERE IT BELONGS, IN THE GENERATOR.** V-AI-08's
reminder is written as `V-AI-08.md` with no name in the filename and a neutral *"Hi there,"*
greeting. Her reinstatement of 2026-08-19 is scoped to the contributor link and to four named
files; **a reminder about that link is within the reinstatement, but a NEW file carrying her
name is not**, and the file does not need to identify her to do its job since the owner sends it
to an address he already holds. Suite 92 checks, register check exit 0.

---

## 2026-08-28 — **THE REMINDER-EMAIL COMMIT WAS BLOCKED BY MY OWN TWO GUARDS AND BOTH CATCHES WERE CORRECT**

The ten contributor-link reminder emails were finished and the commit was refused by the
pre-commit hook with exactly two FAIL lines, **92 checks, 2 failed, 2 skipped**. **NEITHER WAS A
FALSE ALARM, WHICH IS THE POINT WORTH RECORDING.** **(1) `no withdrawn contributor name
survives` fired on `research/MASTER_TRACKER.md:2594`.** My own log entry describing the
withdrawal-scanner fix had spelled the withdrawn contributor's name out four times while
explaining why her name must not appear in generated files. The register's rule for historical
surfaces is that **the log keeps the decision and loses the name**, and the tracker is not one
of the four files her name is permitted in. The entry is rewritten to participant code and
structural description only: the four register name forms are described by shape rather than
quoted, the offending filename is referred to by its marker `(in the filename)` rather than
reproduced, and the 62-mention collision is described as a different, active collaborator with
the reader pointed at `scripts/withdraw_contributor.py`, which is the one place the names
legitimately live. **Nothing about the lesson was lost; only the name was.** Register check now
exits 0 with *"No trace of any withdrawn contributor remains outside the register."* **THIS IS
THE SECOND TIME IN ONE DAY THE SAME GUARD CAUGHT ME DOING THE SAME THING**, which is a fair
measure of how easily a name leaks back in through the very document that records its removal.
**(2) `Master Tracker written to today` fired with *"NO ENTRY for 2026-08-28; newest is
2026-08-27"*.** The date rolled over mid-task. **That guard was written yesterday, in this
session, in direct answer to Phillip asking how he could trust that the tracker was being
kept**, and its first live catch is on my own commit rather than on a hypothetical one. That is
the behaviour he was owed: the mechanism did not depend on my remembering. This entry is what
clears it. **DELIVERED THIS TURN**: `scripts/build_reminder_emails.py` and the ten files in
`research/Reminder_Emails_2026-08-27/`, nine named for their recipient and **V-AI-08's written
as `V-AI-08.md` with a neutral greeting**, sent to Phillip as files rather than as an artifact,
since artifacts render in a sandbox that blocks downloads.

---

## 2026-08-28 — **THE STUDY LABEL IN THE REMINDERS WAS INFERRED FROM A CODE PREFIX, AND VALIDATING IT FOUND A REAL BUG**

Each reminder thanks the person for the study they actually did, and that label was chosen by a
hand-written prefix map: E to the reliability study, RR to the comparison study, V-AI to the
detection panel. **That is the same hand-built-list defect that produced the phantom Rungs paper
and hid the accepted CEP article yesterday**, so it was checked rather than trusted. **NEITHER
OBVIOUS SOURCE SETTLES IT.** `api/_contributor-roster.js` carries a declared `kind`, but
**`kind` is `panel` for BOTH the comparison study and the detection panel**, so it holds less
information than the prefix does. `research/Contributor_Links.md` carries a free-text note that
does name the study, but the note is **blank for 15 rows, including 3 of the 10 people being
reminded**, so it cannot be read off per person either. **THE MAP IS THEREFORE VALIDATED INSTEAD
OF ASSUMED**: every roster row that does carry a note must agree with it or the build exits
non-zero. Result: **24 notes agree, 0 disagree, 15 blank rows take the validated label.** A map
that agrees with 24 declared rows is evidence for the blanks; a map nobody checks is a guess,
and a guess inside a thank-you is worse than no thank-you. **THE VALIDATOR FIRED ON ITS FIRST
RUN AND FOUND A LATENT BUG I HAD NOT LOOKED FOR.** `group_of` returned `E` for anything that was
not V-AI or RR, so it classified **E-08, M-01 and V-HR-01, who are co-authors and
facilitators**, as reliability-study expert raters. None of the three is on the reminder list,
so no wrong email was ever written, but the function was unsound and would have thanked a
co-author for ratings she never gave. **Fixed by declaration rather than by luck**:
participation is now gated on `kind` in `{panel, rater}`, authors and facilitators are excluded
by the roster's own field, and the prefix is used only to split the two panel arms. The build
also refuses outright if any target code is not a study participant. **COMPLETION VERIFIED
BEFORE THANKING ANYONE, per CLAUDE.md VIII**: `research/check_completion.py` returns **COMPLETE
for all eight panel codes**, V-AI-08, V-AI-12, V-AI-23, V-AI-27, RR-106, RR-109, RR-110 and
RR-116, read from the anon-readable aggregate views. E-10 and E-14 are reliability-study raters
on a different instrument and the checker correctly reports *"NO ROW"* for them rather than
passing them silently. **A SECOND SMALL DEFECT FIXED**: the subject line read *"Quick one, there
- your name on the JRS write-up"* for the withheld-name recipient, which is not a greeting
anyone writes. The subject now drops the name entirely when the name is withheld. **LINKS AND
DATE PROVEN, NOT ASSUMED**: all **10 keys checked back against `api/_contributor-roster.js` and
all 10 match, all 10 distinct**, and the fallback date *Saturday, 5 September 2026* is present
in all 10 and is read from `FALLBACK_DATE` in `api/contributor.js` rather than typed. **MY FIRST
VERIFICATION PROBE WAS BROKEN AND I DID NOT ACT ON IT.** A shell one-liner with a malformed awk
field separator reported **0 of 10 links matching**. The separator was the fault, not the data.
Rewritten against the roster source in Python: 10 of 10. **That is the fourth broken probe in
two days, and in every case trusting the first red result would have meant editing correct
output to satisfy a defective test.** Suite 96 checks, 0 failed. Register check exit 0. Commit
`fcb932b` carried the emails; this turn hardens the generator.

---

## 2026-08-28 — **THE CORRECTED SKIP-CI HOOK CONFIRMED ON THREE MORE COMMITS, INCLUDING THE LONGEST MESSAGE YET TESTED**

PR #10 returned bot status for all three of today's pushes and **Cloudflare reported `Deployment
skipped` on every one**: `fcb932b`, `b7c092f` and `1c95d3b`. **Vercel reached `Ready` on each**,
which again confirms the token costs nothing on the Vercel side. **The new evidence is the
message length.** The hook was corrected on 2026-08-26 to insert `[skip ci]` on line 3 rather
than append it, and the longest confirmation on record until now was `ea96a85` at **1,758 bytes
with the token at byte 77**. Today: **`fcb932b` at 2,352 bytes, token at byte 65**; `b7c092f` at
2,013 bytes, token at byte 64; `1c95d3b` at 341 bytes, token at byte 62. **The 2,352-byte
message is now the longest commit message proven to skip**, and it sits well past the 1,031-byte
offset at which `f607e86` and `d07268e` FAILED under the old appending hook. That is the point
the fix was meant to establish: **the offset stays fixed near the top however long the body
grows**, so the length cap Cloudflare reads under is never reached.
`check_skip_token_lands_where_cloudflare_reads_it` asserts the offset stays under 194 and all
three commits are comfortably inside it. **Nothing was actioned from these notifications** and
none needed it; they are ten routine deployment status updates from `vercel[bot]` and
`cloudflare-workers-and-pages[bot]`, recorded here only because they are live evidence for a
hook whose behaviour this file documents in detail. **The Cloudflare Git integration is still
connected and still a dashboard action to remove**: Workers and Pages, jrsstandardcom, Settings,
Build.

---

## 2026-08-28 — **THE CREDENTIAL SENTENCE WAS VERIFIED AGAINST THE LIVE DATABASE AND THEN PLACED ON THE FOUR PAGES THAT ASK A STRANGER TO ACT AND OFFERED NO PROOF**

Phillip supplied the sentence from `access.html` and asked it be verified and integrated where
appropriate. **EVERY FIGURE VERIFIES AGAINST `/api/panel-stats` READ LIVE AT
2026-08-28T09:06:23Z**: `reviewers_all` **58** scoped *all three studies*, `completers_all`
**36**, `countries_all` **16** scoped *all completers*, and the endpoint's own `basis` field
states *"completers graded all 24 records in their set"*, which is the 24-record claim. **THE
SCOPING IS THE PART THAT MATTERS AND IT IS CORRECT.** The sentence attaches 16 countries to the
**36 completers**, never to the 58. `geo_note` records that attaching the country figure to the
reviewer total is a **recorded past defect**, and `check_panel_geo` exists to prevent it. The
sentence as written does not commit it. **IT WAS ALREADY LIVE ON FIVE PAGES AND MISSING FROM THE
FOUR THAT NEEDED IT MOST.** Present on `access.html:81`, `investigator-guides.html:110`,
`org-pilot.html:154`, `reviewer/index.html:124` and, in a figure-free form,
`training.html:3193`. **Absent entirely from `index.html`, `enterprise.html` and
`review-engine.html`**: the homepage and both Track 1 commercial pages, which is to say every
page where a platform buyer arrives cold and is asked to click, to open a scoping call, or to
request a token. **`training.html` carried the credential with NO figures at all**, and no
binder, so its enrolment overlay asked for a full name and a work email on authority alone.
**`scripts/integrate_credentials.py` places it, and the binder is READ from `access.html` at run
time rather than pasted into the script**, so the script cannot become a fifth stale copy of a
3,889-byte block that `check_panel_binder_identical` requires to be byte-identical in what is
now 14 places. Dry run by default. **THE FIGURES ARE NEVER TYPED**: every numeral sits in a
`data-panel` span the binder overwrites from the endpoint, and the markup numeral is the marked
fallback that renders with a dotted underline if the fetch fails. **PLACEMENT FOLLOWS THE
DECISION ALREADY RECORDED AT `access.html:78`**: the credential goes BELOW the button row on all
four, because it is supporting evidence and not a precondition. **MEASURED ON THE RENDERED PAGE,
NOT READ FROM SOURCE**: the block sits at **5.2% depth on `index.html` at 390px**, 3.9% on
`enterprise.html`, 7.5% on `review-engine.html`, and all three spans report
`data-panel-state="live"` rather than stale. No horizontal overflow at 390px or 1280px.
**`check.html` WAS DELIBERATELY EXCLUDED AND THE EXCLUSION IS ASSERTED IN CODE.** It already
publishes `completers_detection` **16** and `countries_detection` **11**, the detection-panel
figures. Putting 36 and 16 beside them would place two populations in one viewport, which is
precisely the top-versus-bottom mismatch the scoped keys were introduced to end.
`check_trust_pages_carry_their_proof` **fails if the all-studies keys ever appear on that
page.** **THE NEW GUARD FOUND A REAL DEFECT ON ITS FIRST RUN.** `reviewer/index.html:124` was
still bound to the **legacy unscoped keys** `completers` and `countries`. The endpoint returns
them as aliases so the page was not visibly broken, but the binder's own comment states the
problem exactly: *"a bare `countries` meant two different populations in two paragraphs of the
same page, which is the whole of the top-versus-bottom mismatch."* **It was the last page in the
tree still on them**; migrated to `completers_all` and `countries_all`, and a site-wide scan
confirms **zero unscoped bindings remain**. **The guard is demonstrated rather than asserted**:
removing the new block from `index.html` makes it report *"index.html: no credential (the
homepage: first contact, and it asks for a click into both tracks)"*, restored immediately
after. It holds a reason string per page, so a future reader can argue with the list instead of
guessing why a page is on it. Suite now **97 checks, 0 failed**. `every published panel figure
is bound` scans **73 HTML files**; `panel binder copies are byte-identical` now covers **14
pages**.

---

## 2026-08-28 — **JEFFREY BILLUPS SUBMITTED THE BLIND SECOND READ. THE OWNER COULD NOT TELL WHAT HE DID, AND THE REASON IS A REAL GAP: NO DEPLOYED SURFACE READS THE ANSWERS.**

Phillip saw a new row dated 2026-08-28 on the programme status page and asked what it was.
**ANSWER: `activity` and `source` both read `recheck-submit`, timestamped
2026-08-28T04:22:14.765Z, country US, `consent_contact` true, `consent_transfer` false,
`consent_public` false.** That is `api/recheck.js`, the **blind second-reader instrument for the
public-records study**, whose own header states why it exists: *"The manuscript reports 32 reads
produced by one person. The one weakness a referee will name is that nobody checked those reads
independently."* `/api/asset-stats` confirms it under
`named_professional_engagement.blind_second_read`: **links_issued 3, submitted 1.** **THIS IS
THE ANSWER TO THE QUESTION PUT TO STACYANN YOUNG YESTERDAY.** The message sent to her asked
whether she ever got anyone to independently review the determinations, because Section 7 of the
FOIL manuscript concedes *"All 32 reads were recorded by a single domain reviewer, so no
inter-rater agreement is estimated."* A second read has now arrived. **WHICH SLOT HE USED IS NOT
PROVABLE FROM ANY READABLE SURFACE AND IS NOT ASSERTED.**
`research/Blind_Recheck_Links_2026-08-09.md:9-11` records **R1 offered to Stacyann Young on
2026-08-09 to forward to her attorney contact, R2 and R3 unassigned**, which makes R1 the plain
reading. But `api/recheck.js` deliberately does not store who holds a key, and `submitted()` in
`api/asset-stats.js:94-104` falls back to `created_at` when no slot is present, so **submitted:1
does not by itself prove a slot was recorded.** Stated as inference, not fact. **THE GAP THAT
MADE HIM ASK.** `api/recheck.js:163-179` writes the ten answers, the slot, `answered_count`,
`prior_familiarity` and `consent_named_in_paper` as JSON into `pilot_contacts.message`.
**Nothing deployed reads that column.** `api/people-9dd1ecdf6f8cdfd4` returns the row with
`detail:""`; `api/asset-stats` returns a count; `api/leads-4b7e2c9af106d385` correctly excludes
it as non-commercial. **The single most valuable research event of the month landed where the
owner can see that it happened and not what it said.** **`scripts/score_blind_recheck.py` closes
it.** Pulls every `source='recheck-submit'` row, scores each against
`research/Blind_Recheck_KEY_E08.md` (never deployed), and reports per-case agreement, percent
agreement and **Cohen's kappa**. **Kappa and not raw agreement alone, because the key is 6
Ready, 3 Needs work, 1 Gap: a reader who answered Ready ten times scores 60% and has
demonstrated nothing.** Verified on synthetic input without touching the database: perfect 10/10
gives 100% and kappa 1.0; **all-Ready gives 60% and kappa 0.0**; a partial 4-of-10 return gives
75% and kappa 0.636. Vocabulary, project URL and label set are all read out of `api/recheck.js`
rather than restated. **FAIL-CLOSED, NOT GUESSED.** `pilot_contacts` has RLS on with no anon
read, and no service key exists in this environment, so the script exits 1 with
`[REQUIRED_ENV_PARAM]` naming the three accepted variable names and stating the key lives in the
Vercel environment and must not be committed. **The ten answers remain unread; nothing about
their content is claimed.** **A SECOND, UNRELATED DEFECT WAS FOUND WHILE READING THAT ROW AND IS
FIXED.** `api/people-9dd1ecdf6f8cdfd4.js:193` set `training_completed_on` to the row's own
`created_at` for every non-enrolment row, so **46 of 58 rows carried a training completion date
while `training_completed` was false** and every one of those dates equalled the row date. The
owner table at `programme-status-9872fb93cc94.html:1451` guards the field on
`training_completed` and therefore looked correct. **The CSV export at line 1515 does not guard
it**, so a downloaded file asserted 46 completions that never happened. Fixed at source so both
surfaces are right. `training_completed_named_count` was never affected: it filters on
`training_completed`. `check_completion_date_implies_completion` demonstrated to FAIL with
*"training_completed_on falls back to r.created_at with no completion test"* against the pre-fix
expression. Suite now **98 checks, 0 failed**. **ONE ANOMALY NAMED AND NOT EXPLAINED**:
`blind_second_read` reports **links_opened 0 with submitted 1**. `api/recheck.js:112-127` writes
an open ping on GET unless `?src=owner|verify|test|selftest|deploytest`, and the open window
opened 2026-08-09, well before this submission. A submitted packet that was never recorded as
opened means either the ping was suppressed by a src tag on the link he followed, or the write
failed inside the try/catch that is designed never to block the packet. **Not resolved from a
readable surface, so it is logged rather than explained.**

---

## 2026-08-28 — **DID THE SECOND READER FINISH? THE HONEST ANSWER WAS THAT NOTHING DEPLOYED COULD SAY, AND THAT IS NOW FIXED RATHER THAN ANSWERED BY HAND**

Phillip asked whether Jeffrey Billups completed the assigned task and provided results. **WHAT
IS PROVEN: HE SUBMITTED. WHAT WAS NOT PROVABLE: WHETHER HE FINISHED.** `api/recheck.js:150-153`
accepts a partial return on purpose, with the reason written into the file: *"Unanswered cases
are accepted rather than rejected: a partial return is data, and forcing ten before anything can
be saved risks losing all ten."* **So a `recheck-submit` row proves arrival and says nothing
about completion.** The `answered_count` and the ten labels sit in `pilot_contacts.message`.
**RLS CONFIRMED BY PROBE, NOT ASSUMED**: the public anon key from
`research/check_completion.py:35` returns **HTTP 200 with `[]`** on
`pilot_contacts?source=eq.recheck-submit`, and `recheck_progress`, `recheck_results` and
`recheck_agreement` all return **PGRST205, no such table**. There is no aggregate view for this
instrument. **HE IS IN NO ASSIGNMENT RECORD.** A corpus-wide search for the name returns exactly
one hit, my own tracker entry from earlier today.
`research/Blind_Recheck_Links_2026-08-09.md:9-11` shows **R1 offered to Stacyann Young to
forward to her attorney contact, R2 and R3 unassigned**, and the forwarded recipient was never
named here, which is consistent with an inbound submission from someone the repository has never
held. **THE FIX IS NOT TO ANSWER THE QUESTION, IT IS TO MAKE THE DASHBOARD ANSWER IT.**
`api/asset-stats.js` already parses `pilot_contacts` server-side, so `blind_second_read` now
publishes **`complete_returns`, `partial_returns`, `answers_recorded`, `cases_offered` and
`unparsed_rows`** beside `submitted`. Completeness is now readable **without a service role key
on his laptop**. **AND IT PUBLISHES COUNTS ONLY, WHICH IS THE HARD CONSTRAINT.** No label, no
case, no agreement figure and no kappa goes into that endpoint. **An agreement percentage
sitting beside a public ten-case list reconstructs the answer key**, and the blind is the entire
instrument. `check_second_read_completeness_is_published` asserts both halves: that
`complete_returns` is present, and that no field name matching agreement, kappa, label,
per_case, score, correct or key ever appears. Demonstrated both ways: stripping
`complete_returns` reports *"does not publish complete_returns"*, and adding `agreement_pct: 80`
reports *"publishes the field 'agreement_pct', which leaks the answer key"*. **MY FIRST VERSION
OF THAT GUARD WAS A BROKEN PROBE AND I CAUGHT IT BEFORE SHIPPING.** It scanned the whole block
for the substring *agreement* and failed on **the note I had written explaining why no agreement
figure is published**. A guard that fires on its own documentation would have had me delete a
correct explanation to satisfy a bad test. Rewritten to parse **field names only**. **That is
the fifth broken probe in three days and the fifth time the first red result was wrong.** **A
SECOND DEFECT FOUND IN THE SAME BLOCK AND FIXED.** The suppressed-cohort entry hardcoded `sent:
0` with the reason *"Awaiting the second reader being named. None has been sent."* while
`submitted: 1` sat in the same object. **A returned packet is proof a link reached a reader.**
State is now derived: a submission moves the cohort from SUPPRESSED to ACTIVE by itself, and
`sent` is **`null` rather than `0`**, because the links are forwarded by hand and this system
never observes the send. A zero asserted a fact; null states the truth, which is that the send
is unobserved. Suite now **99 checks, 0 failed**. `scripts/score_blind_recheck.py` still holds
the per-case detail and still fail-closes without the service key; **the ten answers remain
unread and nothing about their content is claimed.**

---

## 2026-08-28 — **THE FOIL PAPER WAS CITING THE COMPANION STUDY'S EXCLUDED-CASES SENSITIVITY ANALYSIS AS ITS HEADLINE CROSS-DOMAIN RESULT. FIXED IN TWO PLACES, PLUS A DELIVERY DEFECT IN YESTERDAY'S PDF.**

Phillip supplied the CFOC submission and the revised FOIL PDF and asked for the research to be
completed and the article revised. **THE UPLOADED CFOC DOCX IS THE REPOSITORY'S OWN
`research/CFOC_Submission_2026-08-08.md` EXPORTED TO WORD**, verified sentence by sentence: the
only difference is a dropped `---` separator. A duplicate I had extracted was deleted rather
than kept. **THE REAL FINDING IS A FIGURE THAT WENT SUPERSEDED IN THREE DOCUMENTS AT ONCE.**
`FOIL_Article_Draft.md` section 5.6 and its findings summary at line 29 both cited the
employment corpus at **"22 cases from 22 distinct sources", "7 of 9 against 2 of 13, p = 0.0073,
odds ratio 19.25"** and **"6 of 8 against 1 of 8, p = 0.041, odds ratio 21.0"**. Every one of
those is computed on the **22-case SCREENED set**. **The employment corpus was corrected on
2026-08-24**: two matters fail the stated inclusion criteria and the analysis runs on **20**
(`Employment_Records_Article_ISACA_2026-08-21.md`, notes 2 and 5), where the primary association
is **p = 0.0194, odds ratio 15.00, 6 of 8 against 2 of 12**. **THIS IS WORSE THAN A STALE
NUMBER.** That manuscript states outright: *"Including them produces p = 0.0073 with an odds
ratio of 19.25. Because those matters do not meet the stated inclusion criteria, this result is
reported only as a sensitivity analysis."* **The public-records paper was publishing the
companion study's sensitivity analysis as its primary cross-domain evidence.** **AND ONE OF THE
TWO EXCLUDED MATTERS IS A PUBLIC-RECORDS ADVISORY OPINION**, appendix A15, FOIL-AO-19774,
excluded precisely because it belongs to the corpus this paper reports. A referee opening the
companion manuscript would have found a public-records case propping up the public-records
paper's cross-domain claim. That is the most damaging form the error could take. **PROVENANCE
WAS ESTABLISHED BEFORE ANYTHING WAS REWRITTEN, FROM LIVE DATA.**
`scripts/recompute_sustained_coding.py` pulls the 22 screened employment matters from
`bench_outcomes` and recomputes the sustained coding with Fisher's exact written out by hand,
because scipy is not installed and a p value quoted to a federal council must not depend on a
package being present: **6 of 8 against 1 of 8, p = 0.0406, odds ratio 21.00**, reproducing the
quoted figures exactly. **The numbers were never wrong; their basis was superseded.** **THE
20-CASE SUSTAINED CODING WAS NOT COMPUTED AND THE SCRIPT SAYS SO RATHER THAN GUESSING.** Its
exclusion screen flagged 22 rows where the manuscript names 2, because the appendix-A-to-row
mapping is not in the anon-readable data. It exits 2 with `[REQUIRED_ENV_PARAM]` and refuses to
drop two rows by inference. **The published p = 0.0291 on 13 resolved matters is cited from the
manuscript instead.** **THREE DOCUMENTS CORRECTED**: both occurrences in `FOIL_Article_Draft.md`
(4,344 to 4,369 words), and the CFOC outreach paragraph, which had gone out under Stacyann
Young's name to the Chief FOIA Officers Council and a named DOI attorney carrying **22
adjudicated cases, six of eight against one of eight, p = 0.041**. **PROVEN NOT TO HAVE
DISTURBED THE PAPER'S OWN FIGURES**: every reported figure token was extracted before and after
and diffed. **8 removed, all employment; 6 added, all their corrected counterparts; 13
unchanged, all public-records.** All **9 of Stacy's edits intact.** **MY FIRST REPLACEMENT PROSE
WAS WRONG AND I CAUGHT IT.** It read *"the figures previously cited here ... are superseded"*,
which is a note to an editor, not manuscript prose: a referee has no idea what was previously
cited. Rewritten as clean text; the superseded figures live in the commit and here. **A SEPARATE
AND SERIOUS DELIVERY DEFECT.** `scripts/render_report_pdf.py` wraps its source in `<body>` and
**does no markdown conversion at all**. Handed a `.md` manuscript it produces a PDF with literal
`#`, `**` and `---` markers and every heading, table and paragraph collapsed into one wall of
running text. **The 11-page FOIL PDF delivered to Phillip on 2026-08-27 has that defect**; it
was reported as a manuscript and it was unformatted source. Caught here only because a longer
document rendered to **6 pages instead of 11**, which did not add up, and the PDF was rendered
back through the browser and read rather than trusted. **`scripts/md_to_html.py` supplies the
missing step**, with no external dependency because markdown, mistune and commonmark are all
absent here: ATX headings, bold, italic, inline code, superscript already written as HTML, pipe
tables, ordered and unordered lists, rules, block quotes and paragraphs. Output on this
manuscript: **1 h1, 11 h2, 12 h3, 4 tables, 78 paragraphs, 0 unconverted markers.** The renderer
now routes any `.md` through it, so no caller can forget. **Re-rendered: 99,284 bytes, 11 pages,
verified by screenshot to carry real headings and a title block.** **Two guards added and both
demonstrated against the pre-fix state**: `check_crossdomain_citation_is_current` holds a map of
seven superseded fragments to the reason each is wrong and fails with *"still cites '22 cases
from 22'"* and three more; `check_markdown_pdfs_are_converted` fails with *"does not route a .md
source through md_to_html.py"*. **`scripts/audit_cfoc_claims.py` verifies all 12 empirical
claims in the outreach emails against the manuscripts and now passes.** Two of its own rules
were false positives I fixed rather than acted on: it searched the paper for the email's
phrasing *"no relationship"* when the paper writes *"is null (p = 1.000)"*, and a bare
`/certif/` fired on **Stacyann Young's genuine SUNY and New York State Archives
certifications**. **That is the sixth broken probe in three days.** Artifacts:
`FOIL_Paper_REVISED_2026-08-28.pdf` 11pp, `FOIL_Article_REVISED_2026-08-28.docx`. Suite now
**101 checks, 0 failed**. **STILL OPEN**: the blind second read is complete at 10 of 10 but
unscored, so Section 7's single-reader limitation stands unchanged and correctly.

---

## 2026-08-28 — **THE SECOND READ IS SCORED AND THE ARTICLE IS UPDATED THROUGHOUT. 70.0 PERCENT AGREEMENT, COHEN'S KAPPA 0.474. THE SINGLE-READER LIMITATION IS NARROWED, NOT RETIRED.**

Phillip required the article updated with the re-examination. The blocker was real and was
removed rather than argued with: the ten answers sat in `pilot_contacts.message` behind RLS, and
**the service role key exists in the Vercel environment even though it does not exist here**.
**`api/recheck-answers-b1a768e88d3e48bd.js`** is a third owner-only endpoint on the established
pattern, opaque slug, no token, no analytics tag, never linked. It returns the reader's labels,
reasons, slot and consent flags and **deliberately does not contain the answer key**: the
original reads stay in `research/Blind_Recheck_KEY_E08.md`, which is never deployed, so a leak
of this slug exposes one person's labels and still leaves nothing to score them against, and the
blind on the two unissued packets survives. Deployed to `main` at `ac43692`. **THE READER IS
JEFFREY BILLUPS, SLOT R1**, which is the packet offered to Stacyann Young on 2026-08-09 to
forward to her attorney contact, submitted 2026-08-28T04:22:14Z, **10 of 10 answered**, prior
familiarity with the instrument recorded as *"None / Independent reviewer"*, and **he reported
knowing the documented outcome in 0 of the 10 cases**, which is the blind holding. **He
consented to be named in the paper.** **THE RESULT, COMPUTED AND NOT ESTIMATED**: exact
agreement **7 of 10, 70.0 percent, 95 percent Wilson 39.7 to 89.2**; **Cohen's kappa 0.474
unweighted**; linear weighted kappa 0.559; **Gwet's AC1 0.582**. **ALL THREE DISAGREEMENTS WERE
ADJACENT AND NONE WAS A READY AGAINST A GAP.** Case 1 Ready to Needs work, case 4 Ready to Needs
work, case 5 Needs work to Ready: **the second reader was stricter on two and more lenient on
one, and every disagreement sits on the Ready and Needs work boundary**, which is the boundary
the instrument is least sharp about. **The single Gap read, which carries the operational
consequence, was reproduced exactly.** **THREE COEFFICIENTS ARE REPORTED AND THE UNWEIGHTED
KAPPA LEADS, WHICH IS THE LOWEST OF THE THREE.** Reporting only AC1 at 0.582 would be choosing a
statistic after seeing the data. The weighted kappa is justified because the scale is
**ordinal** and every disagreement was adjacent; AC1 is justified because **Ready holds 6 of 10
of the margin**, the condition under which kappa is known to understate. Each is stated with its
n. **THE LIMITATION NARROWS, IT DOES NOT VANISH, AND THAT IS ENFORCED IN CODE.** Section 7 now
reads that **10 of 32, not all 32, were re-read**, that 0.474 is moderate and is *"evidence that
the read is not idiosyncratic to one person, and not evidence that two readers would classify
the full corpus alike"*, that the interval is wide because ten cases cannot make it narrow, that
**a single re-read cannot separate reader dependence from case difficulty**, that the remaining
22 cases carry the original limitation in full, and that **two further packets were prepared and
have not been returned**. **FIVE SECTIONS CHANGED, EVERY FIGURE READ FROM JSON AND NONE TYPED**:
Abstract, Data availability, Methods 4.6 (new, describing what the reader was and was not
shown), Results 5.7 (new), Limitations. `scripts/apply_second_read_to_manuscript.py` refuses to
run if `research/Blind_Recheck_RESULT_2026-08-28.json` is absent. **4,369 to 5,045 words.**
**PROVEN NOT TO HAVE DISTURBED ANYTHING ELSE**: the figure-token diff against HEAD shows **0
removed** and only the seven new agreement figures added. **All 9 of Stacy's edits intact.**
`check_second_read_reported_honestly` asserts all five computed figures are present, that **the
lowest coefficient is reported**, and that Limitations still says *"not all 32"* and *"is not a
panel"*. Demonstrated both ways: replacing 0.474 with 0.582 fails with *"the lowest of the three
coefficients (0.474) is not reported"*, and softening *"is not a panel"* fails with *"a subset
re-read is being presented as if it settled the corpus"*. **The guard raised a NameError on
first run and was fixed rather than deleted.** Artifacts: `FOIL_Paper_REVISED_2026-08-28.pdf`
**13 pages**, `FOIL_Article_REVISED_2026-08-28.docx`, `Blind_Recheck_RESULT_2026-08-28.json`.
Suite now **102 checks, 0 failed**.

---

## 2026-08-28 — **ALL 18 SURGICAL CORRECTIONS APPLIED, AND VERIFYING ITEM 11 EXPOSED A REAL ANALYTIC DEFECT THAT NEITHER OF THE OWNER'S TWO OPTIONS COVERED**

Items 1 to 9 are KEEP instructions and are asserted rather than written:
`scripts/apply_final_surgical_list.py` fails if any of the nine co-author approved strings is
missing after the pass. **9 of 9 verified present.** **ITEM 11 WAS LEFT OPEN ON PURPOSE AND THE
ANSWER IS A THIRD THING.** He wrote that the 27-case wording should be used *"only if that
accurately reflects the actual analytic design. If the actual exclusion was based on missing
notes rather than document class, the sentence must reflect that instead."* **Live
`bench_outcomes` for the public-records corpus: Ready 18 cases / 17 noted, Needs work 9 / 7, Gap
5 / 4. 32 cases, 28 notes, 4 without.** The Section 5.3 table was drawn on **n = 9 and n = 18,
all 27 case-level sources, but only 24 of those 27 carry a note**, so **THREE CASES WITH NO NOTE
WERE SITTING IN THE "NOT STATED" COLUMN.** Absence of a note is not a note that fails to state a
reconstructability failure, and coding it as one inflates the comparison group. **Both
restrictions are now stated: case-level first, then note-carrying.** **THE CORRECTION MAKES THE
RESULT STRONGER, WHICH IS WHY IT HAD TO BE CHECKED RATHER THAN ASSUMED HARMFUL.** As published,
`[[6,3],[0,18]]` on 27 gives **p = 0.00028**, which is arithmetically right for the table as
drawn. Restricted to the 24 noted cases, `[[6,1],[0,17]]` gives **p = 0.0000520**. Both
recomputed with Fisher's exact written out by hand, scipy being absent. Cell counts are forced
arithmetic, not a re-reading: a coded note must exist, so the 6 stated Needs work cases all
carry notes. **TWO PLACES THE OWNER'S LIST DID NOT REACH AND THAT WOULD HAVE LEFT THE PAPER
CONTRADICTING ITSELF.** **(1) The ABSTRACT carried the same table**, *"six of nine ... against
none of eighteen ... p = 0.00028"*. Correcting 5.3 and leaving the abstract would have put the
paper's two most-read passages in conflict, which is the defect item 10 exists to remove. Same
correction, same source. **(2) ITEM 9 WAS VIOLATED IN EXACTLY ONE PLACE AND IT WAS NOT THE
OBVIOUS ONE**: the abstract described the employment corpus as *"flagged records"* against
*"passed records"*. That corpus is read with the same five-condition instrument, so those are
JRS classifications and now read *"Needs work or Gap"* and *"Ready"*. **Line 17's "can read as
complete" was left alone**: ordinary prose, not a classification, the same judgment the
co-author's own terminology pass made. **ITEM 10'S OPENING SENTENCE NEEDED THE OWNER'S NUMBER,
NOT MY COMPUTED ONE.** My first pass wrote *"For the 24 cases with contemporaneous basis
notes"*, which contradicts Section 5.1's 28 in precisely the way item 10 forbids. **28 is
corpus-wide, 24 is the coded subset.** The opening now uses 28 as he specified and the
restriction paragraph explains the drop to 24, so both numbers appear in order and neither
surprises. **REMAINING ITEMS APPLIED AS SPECIFIED**: 12 adjudicator to **independent government
auditor** in RQ2, 4.5 and 5.2; 13 **Four to Five analyses** now that 5.7 exists; 14 Section 7 to
**20 adjudicated with 22 screened**; 15 *"That answers"* to preliminary evidence; 16
*"establishes three things"* to *"provides evidence for three propositions"*; **17 applied
although optional**, abstract softened to *"preliminary evidence that the read responds to the
reconstructability property it is designed to assess"*; 18 the unsupported causal implication
removed from the introduction. **5,045 to 5,189 words.** **BOTH COUNCIL EMAILS UPDATED TO
MATCH**: the construct sentence corrected the same way, the blind second read added as a
**fourth finding** with agreement, both kappas and the adjacency of every disagreement, and
*"Three findings"* corrected to four. `scripts/audit_cfoc_claims.py` now verifies **15 claims
across both manuscripts, all OK, vocabulary clean**; its stale rules were rewritten to the
corrected figures rather than left passing on absence. **MESSAGE TO STACYANN YOUNG, 762 words**,
carrying the owner's three instructions verbatim in substance: her friend completed the work,
the article and emails are updated, **she should send both emails solo** because they are
stronger from twenty years in New York City government and her certifications than from a joint
signature, and **he handles the journal submission once she gives final approval**. It reports
the agreement honestly including that it does **not** retire the limitation, explains why the
construct correction strengthens the result, and raises the two unissued packets as entirely her
call. Artifacts: `FOIL_Paper_FINAL_2026-08-28.pdf` 13pp, `FOIL_Article_FINAL_2026-08-28.docx`,
`CFOC_Submission_2026-08-08.docx`, `Message_Stacyann_Young_2026-08-28.docx`. Suite **102 checks,
0 failed**.

---

## 2026-08-28 — **THE MANUSCRIPT'S REPRODUCIBILITY CLAIM WAS FALSE WHEN CHECKED, AND THAT IS THE FINDING OF THIS PASS. FIXED, PLUS A FULL SUBMISSION-CONTROL PACKAGE.**

Phillip asked for a final check of References and Data availability against the actual source
files before emailing the editor, on the ground that the paper makes unusually strong
reproducibility claims. **It did, and one of them did not hold.** **THE DATA AVAILABILITY
STATEMENT CLAIMED: *"Every figure in Section 5 is reproduced by an analysis script using only
the Python standard library."* THAT WAS FALSE ON TWO COUNTS.**
`research/analysis_foil_2026-08-08.py` exists and runs, but it **covers R1 to R4 only, so
Sections 5.6 and 5.7 were not reproduced at all**, and **its R2 still computes the superseded
construct table, 6 of 9 against 0 of 18 at p = 0.00028**, which the manuscript corrected earlier
today to the 24 note-carrying case-level sources at **p = 0.0000520**. **A reproducibility claim
the supporting script does not substantiate is the worst defect a paper about traceability can
carry**, and it would have been trivial for a referee to test.
**`research/analysis_foil_2026-08-28.py` closes it**: covers 5.2 through 5.7, standard library
only with Fisher's exact, the Wilson interval, Cohen's kappa and Gwet's AC1 all written out
rather than imported, and **it verifies every figure against the manuscript text on each run**.
`--verify` exits non-zero on any mismatch. Current state: **19 probes, 0 mismatches.** The Data
availability statement now names that file and `Blind_Recheck_RESULT_2026-08-28.json`
explicitly. **MY 5.4 GROUPING WAS THE ONE THING I GOT WRONG AND THE VERIFIER CAUGHT IT.** A
keyword screen over the note text produced a degenerate table at **p = 1.00000** against the
manuscript's 0.00466. The grouping is not reliably derivable from the note; it is **declared**
in the 2026-08-08 script as Group A 6 Ready / 1 not against Group B 0 Ready / 7 not. Carried
forward verbatim with the source cited. **Inference replaced with declared data, for the seventh
time in four days.** **MANUSCRIPT ITEM 2 APPLIED**: Section 5.2 *"What it establishes"* to
*"What it demonstrates"*. Items 1, 3, 4, 5, 6 verified unchanged as instructed. **REFERENCES
AUDIT CLEAN AND IT RECONCILES TO 32**: 18 New York appellate and trial decisions, 7 Committee on
Open Government advisory opinions, 2 Connecticut FOI Commission decisions, **which is exactly
the 27 case-level sources**, plus 5 compliance audits.
`scripts/audit_references_and_availability.py` also confirms every count quoted in Data
availability matches the live database and **fails outright if the statement ever names the
superseded script again**. **SUBMISSION PACKAGE BUILT, `research/JCI_SUBMISSION_2026-08-28/`, 12
files in the owner's six-folder structure**, zipped at 150,207 bytes. **CSV rather than XLSX**,
because openpyxl is not installed here and a submission dataset must not depend on a package the
next machine may lack. **EVERY FIELD IS LABELLED BY PROVENANCE**: DATABASE for read, note,
outcome, citation, URL and collection date; DERIVED for the inclusion flags, computed from the
analysis rules rather than hand-assigned; DECLARED for the Section 5.3 coding; and **`[NOT IN
THE DATASET]` for the eight fields the study never recorded**, rather than invented.
Jurisdiction, source type, decision date, URL-tested-on, verified-by, and the second-read join
are all marked absent. **A package about traceability must not fabricate the one thing it exists
to prove.** **THE BUILDER ITSELF LOST A CODED CASE AND I CAUGHT IT BEFORE SHIPPING.** The first
run reported **5 coded Yes where the manuscript says 6**: `FIC2012-276` appears only inside its
URL, and I was matching against the citation half of the source string. Fixed to match the whole
string. **That failure is precisely the class of defect the package exists to detect, and it was
in my own builder.** **IT ALSO RESOLVED AN AMBIGUITY I FLAGGED EARLIER AND COULD NOT SETTLE**:
of the three Needs work cases not coded Yes, **`FIC2015-122` is the one that carries a note and
does not state a failure**, while `FOIL AO 19646` and `2025 NY Slip Op 00220` carry no note at
all. That is now recorded rather than guessed. **`scripts/presubmission_audit.py` runs the
owner's section XIV checklist as executable assertions: 26 checks, 0 failed**, against the live
database, the manuscript text and the built package. It covers all 32 URLs, the 18/9/5 and
15/7/5/5 reconciliations, the 28 notes, the 24 coded, the 7 + 17 split, 6 of 7 and 0 of 17,
every p value, the second read's four coefficients, the adjacency of all three disagreements,
the disclosure, and that the title is unchanged. **NOTHING NEW WAS MEASURED.** No case re-read,
no note re-coded, no reader re-contacted. Suite **102 checks, 0 failed**.

---

## 2026-08-28 — **THE PACKAGE REACHED OUTSIDE ITSELF, WHICH IS THE ONE FAILURE THIS PAPER CANNOT SHIP. NOW SELF-CONTAINED, AND URL TESTING FOUND A BROKEN CITATION.**

The review of the delivered ZIP was correct on every RED item. **The reproduction script queried
a live database over the network, embedded an API key, and verified against
`research/FOIL_Article_Draft.md`, a path that does not exist inside the package.** A reviewer on
a clean machine could not run it. **ALL SEVEN RED ITEMS CLOSED, AND THE OFFLINE CLAIM IS PROVEN
RATHER THAN ASSERTED.** `04_REPRODUCTION/analysis.py` reads only files inside the package. Run
from the **unzipped copy with `socket.socket`, `create_connection` and `getaddrinfo` all
replaced by raising stubs and every proxy variable unset**: **20 probes, 0 mismatches, exit 0.**
**NOTHING HARD-CODED THAT THE DATA CAN PRODUCE.** Section 5.3's cells are computed from
`JCI_JRS_Construct_Coding_Frame.csv` and Section 5.4's groups from a **new
`JCI_JRS_Structural_Coding_Frame.csv`**, so the chain is case, coding, analysis, result. The
constants `nw_stated, rd_stated = 6, 0` and `GROUP_A_READY = 6, 1` are gone. **NO CREDENTIAL
TRAVELS WITH THE SUBMISSION.** Verified on the unzipped ZIP: **0 files containing
`sb_publishable`, `supabase` or `apikey`; 0 external `research/` paths; 0 references to the
superseded script; 0 occurrences of `[NOT IN THE DATASET]`.** **URL TESTING FOUND A REAL BROKEN
CITATION, WHICH IS WHY THE INDEX EXISTS.** **PR-28's stored URL is truncated by one character**,
`compliance-freedom-information-law-requirement`, and returns **HTTP 404**; the plural form
returns **HTTP 200**. Corrected in the index with the evidence recorded. **AND NINE 403s WERE
NOT RECORDED AS BROKEN, BECAUSE THEY ARE NOT.** All nine are `nycourts.gov` and
`law.justia.com`. **Retried with a full browser user agent and still 403**, so this is
host-level refusal of automated requests, not a dead link. Recording them as inaccessible would
have been false and would have understated the corpus. They read *"Yes to a person; this host
refuses automated requests"*. **32 of 32 verified.** **THE BLIND SECOND READ JOINS TO THE CORPUS
EXACTLY.** The ten packet UUIDs in the never-deployed answer key match **`bench_outcomes.id` 10
of 10** and `record_id` 0 of 10, so the master dataset's blind-review columns are now populated
from real data rather than dropped. **BOTH EMPLOYMENT EXCLUSIONS ARE NAMED**, which I could not
do this morning: `FOIL-AO-19774` and the unidentifiable Employment Tribunal entry both match a
row by exact citation. The companion file now shows **22 screened, 20 included, 2 excluded**
with the reason on each, plus tested URLs. **ADDED**: `00_MANIFEST.txt`,
`02_DATA/JCI_JRS_Data_Dictionary.txt` defining every column in every CSV,
`01_MANUSCRIPT/manuscript_verification.txt` as the local verification target, and a rewritten
`README.txt` that describes the actual ZIP. **16 files, was 12.** **MY OWN OFFLINE TEST FAILED
FIRST AND THE SCRIPT WAS FINE.** An `exec()` harness broke on `__file__`; re-run properly
through a `sitecustomize` that blocks sockets, it passed. **The seventh broken probe in four
days, and again the first red result was mine, not the code's.**
`check_submission_package_is_self_contained` asserts no credential, no external path, no
placeholder and standard library only, demonstrated to FAIL when a credential is planted. Suite
**103 checks, 0 failed**. `presubmission_audit.py` still **26 of 26**. **NOT SENT. The
submission remains two attachments, manuscript DOCX and PDF, held for Stacy's final approval;
the package is held for an editorial request.**

---

## 2026-08-28 — **THE REVIEW'S TOP RED ITEM WAS RIGHT ABOUT THE SYMPTOM AND WRONG ABOUT THE FIX, AND FOLLOWING IT WOULD HAVE CORRUPTED A CORRECT MANUSCRIPT.**

The review reported that Section 5.4's table says **6 of 7** while the packaged structural
coding frame produces **5 of 6**, and recommended changing the manuscript. **The manuscript was
right. My coding frame was wrong.** **ROOT CAUSE, AND THE REVIEW FOUND IT ITSELF WITHOUT
CONNECTING IT**: PR-10's stored citation reads **`OIL AO 19746`**, missing its leading F, so my
classifier keyed on *"FOIL AO"* returned `N/A` and **silently dropped a Ready advisory opinion
out of group A**. Its own item 5 flagged that typo as unrelated citation hygiene. Restoring it
gives **group A = 7 cases, 6 Ready**, exactly the published table. The typo is corrected with
its evidence: the source URL is `docsopengovernment.dos.ny.gov/coog/ftext/f19746.htm`, the
Committee's FOIL advisory-opinion path, matching the `f####` pattern of the other six. **`p =
0.00466` is unchanged, because Fisher on [[6,1],[0,7]] and [[5,1],[0,7]] both return it, which
is precisely why the p value could not have caught this.** **RED 2 AND 3 WERE ARTIFACTS OF MY
OWN GENERATOR, NOT MANUSCRIPT ERRORS.** The review read `manuscript_verification.txt` and found
*"analysisfoil2026-08-28.py"* and *"BlindRecheckRESULT2026-08-28.json"*. **My markdown stripper
removed `_` along with `*` and backticks, rewriting every filename in the Data availability
statement.** Underscores are load-bearing in a filename; the stripper now removes emphasis only.
**The manuscript's JSON name was correct all along; only the script name was genuinely wrong**,
because I named the repository file where the package ships `analysis.py`. Corrected. **RED 4
CLOSED**: PR-01, PR-03, PR-04, PR-05 and PR-10 were `N/A`. Four carry **NY3d** reporter
citations, which is the **New York Court of Appeals**, and PR-01's URL is the `/ctapps/` path.
The classifier now recognises NY3d, AD3d and `/ctapps/`. **0 rows remain unclassified.** **RED 6
AND 7 ARE FLAGGED, NOT FIXED, AND THAT IS DELIBERATE.** PR-15 stores `2024 NY Slip Op 0407`
against a URL ending `2024_04071`, and PR-22 stores `2025 NY Slip Op 0578` against `2025_05783`.
**Appending the digit the URL implies would be inference presented as verification**, in a
package whose entire purpose is to prevent exactly that, and `nycourts.gov` refuses automated
requests so the decisions could not be read from here. Both are recorded in the source
verification index with the implied citation and an explicit *"requires author verification
against the published source"*. **Two items the owner must check by hand before sending.**
**AMBER 8 CANNOT BE SATISFIED AND THE FALLBACK IS TAKEN.** The employment corpus holds **zero
URLs anywhere in the database**; that study recorded full reporter citations, which are the
canonical identifiers for legal sources. The companion file is now explicitly labelled a
**citation-based verification record for a separately conducted corpus, not a URL-based
reproducibility dataset**, with the reason stated. **No URL was invented.** Both exclusions
carry their reason; 22 screened, 20 included, 2 excluded.
**`check_coding_frames_match_the_manuscript` closes the class of defect**: it asserts group A is
6 Ready of 7, group B 0 of 7, the construct frame matches the published n values and codes 6 and
0, and **no row is left `N/A`**. Demonstrated by reverting the citation correction, which fails
with *"structural group A is 5 Ready of 6"* and *"1 row(s) still N/A: PR-10"*. **FINAL STATE,
VERIFIED ON THE UNZIPPED PACKAGE**: offline run with sockets blocked returns **20 probes, 0
mismatches, exit 0**; all seven RED items confirmed in the delivered files; suite **104 checks,
0 failed**; `presubmission_audit.py` **26 of 26**. **Still not sent, and still awaiting Stacy's
approval.**

---

## 2026-08-28 — **BOTH COUNCIL EMAILS REPLACED AGAINST THE FINAL MANUSCRIPT, AND THE MANUSCRIPT'S LAST FIVE SOURCE ITEMS RESOLVED OR FLAGGED**

The emails had been written against an earlier version and carried four material
inconsistencies: they attributed the whole 32-case study to one author with *"I applied it to"*,
used the retired *partial* and *complete* categories, quoted the **superseded companion
figures** and lacked the personal-capacity separation the co-author asked for. Both replaced in
full, 1,214 words, **sent by Stacyann Young alone** per the owner's decision. **THE EMAILS ARE
NOW ASSERTED, NOT PROOFREAD.** `scripts/audit_cfoc_claims.py` gained a **REQUIRED_IN_EMAIL**
list of 15 figures and statements that must be present, and four new banned patterns covering
the exact defects found: `partial assessments`, `assessed as complete`, `I applied it to` and
`can send the current draft on request`. **15 of 15 present, all banned patterns clean, 15
manuscript claims verified.** An email preserved in an administrative record and the eventual
publication must describe the same study, and that is now enforced rather than hoped for.
**SECTION 7's GRAMMAR WAS GENUINELY BROKEN AND IT WAS MY DOING.** My 2026-08-24 corpus
correction inserted a clause into *"It belongs to a corpus of 20 adjudicated matters, ...
collected by a different reviewer, is reported in full ..., and is cited here ..."*, destroying
the parallelism. Split into three sentences. **TWO CONNECTICUT CITATIONS WERE INFORMAL STUBS.**
PR-06 stored `CT FOIC` and PR-07 `CT FOI`. Their own URLs end **FIC2012-276** and
**FIC2015-122**, the Commission's formal docket numbers, **and the manuscript's reference list
already cites both in that form**, so the correction is evidenced twice over. Corrected with the
evidence recorded. **PR-01 IS NOT RESOLVED AND IS FLAGGED, BECAUSE ITS OWN TWO SOURCES
CONTRADICT EACH OTHER.** The stored citation reads *"NY Appellate Division FOIL email disclosure
decision (2026)"*, a description rather than a reporter citation, while its URL is the
**`/ctapps/` path, which is the New York COURT OF APPEALS**, for opinion `6opn26` of February
2026. Source type is recorded from the URL. **`nycourts.gov` refuses automated requests, so the
opinion could not be read to settle which court it is or to establish a reporter citation.**
Flagged for author verification alongside PR-15 and PR-22. **THREE ITEMS NOW REQUIRE THE OWNER'S
HAND BEFORE SENDING: PR-01, PR-15, PR-22.** Each carries the implied correction and an explicit
statement that it was not applied. **Guessing the digit a URL implies, or the court a path
implies, would be inference presented as verification in a package built to prevent exactly
that.** Four corrections were applied where the evidence was conclusive; two discrepancies were
not. **`presubmission_audit.py` FAILED AFTER THE GRAMMAR REPAIR AND THE CHECK WAS AT FAULT, NOT
THE TEXT.** It probed the literal string *"22 matters screened"*, which Section 7 now phrases as
*"screened from 22"*, while Section 5.6 still carries *"Twenty-two matters were screened and two
were excluded"*. **The manuscript was right in both places.** Rewritten to assert the substance
across any of three phrasings plus the exclusion count. **That is the eighth brittle probe of my
own in four days, and the eighth time the first red result was mine.** **FINAL STATE**: offline
run on the unzipped package **20 probes, 0 mismatches, exit 0**; `presubmission_audit.py` **26
of 26**; suite **104 checks, 0 failed**; manuscript re-rendered to 13 pages and the DOCX
regenerated after the text changed. **Nothing sent. Awaiting Stacy's approval and the owner's
verification of the three source items.**

---

## 2026-08-28 — **ALL SIXTEEN FINAL CORRECTIONS APPLIED. THE THREE CITATIONS I COULD NOT VERIFY WERE VERIFIED BY THE OWNER AGAINST THE OFFICIAL DECISIONS, WHICH IS THE RIGHT RESOLUTION.**

I flagged PR-01, PR-15 and PR-22 rather than correcting them, because `nycourts.gov` refuses
automated requests and appending the digit a URL implies is inference presented as verification.
**The owner read the published decisions and supplied the citations**, and the package now
records **who verified each correction and how**, so a reviewer can tell machine evidence from a
human reading. **PR-01 was the one that mattered.** The stored entry was a description, *"NY
Appellate Division FOIL email disclosure decision (2026)"*, and it named the wrong court.
Verified: **`Matter of Russell v Town of Mount Pleasant, N.Y., 2026 NY Slip Op 00966`, New York
COURT OF APPEALS, 19 February 2026**. The `/ctapps/` path in its URL was right and the stored
text was wrong, which is what the conflict flag said. Corrected in the manuscript's reference
list and in both supporting files. **PR-15 and PR-22 were truncated by one digit each in the
SUPPORTING FILES ONLY**: the manuscript already carried `2024 NY Slip Op 04071` and `2025 NY
Slip Op 05783` correctly. Now `Matter of Gannett Co., Inc. v Town of Greenburgh Police Dept.,
2024 NY Slip Op 04071 [229 AD3d 789]` and `Matter of Wagner v New York City Dept. of Educ., 2025
NY Slip Op 05783`. **THREE MISSING DECISION YEARS SUPPLIED AND ONE URL MADE CANONICAL**: PR-06
**2013**, PR-07 **2015**, PR-32 **2025**, each recorded as author-verified with the issuing
date. PR-07's URL moves to the `Final-Decisions-2015` path; **both paths were tested and both
return HTTP 200**, so the switch is to the canonical form rather than a repair. **0 rows now
carry `N/A` for a decision year.** **PR-10's VERIFICATION NOTE WAS STALE AND SAID SO IN THE
PRESENT TENSE**, *"Stored citation is missing its leading F"*, after the correction had been
applied. Reworded to **CORRECTION APPLIED** with the evidence kept, rather than deleted: a
package about traceability should keep the record of what changed, not erase it. **THE EMAIL
DOCUMENT CONTRADICTED ITSELF AND I INTRODUCED THAT.** Its header states Stacyann sends both
alone, and **Email 1 still carried Phillip's signature**. Removed. **Both emails now read *"The
manuscript is being submitted for publication"***, which is the accurate form while the article
and the correspondence go out together. **A CLEAN SEND COPY NOW EXISTS AS ITS OWN FILE**,
`research/CFOC_Emails_SEND_COPY_2026-08-28.md`, 1,083 words, containing the two emails and
nothing else. The working file keeps the editorial notes and says plainly that it is the working
copy. **Editorial material must not travel with correspondence to a federal council.** **BOTH
ARE ASSERTED, NOT PROOFREAD.** `audit_cfoc_claims.py` now checks the send copy for all **15
required figures** and for **three banned patterns**: a second signature, any working-note
heading, and the overstated status phrase. `check_send_copy_is_clean` fails the commit if any
reappears, demonstrated by re-adding the signature. **FINAL STATE, EVERY LINK IN THE CHAIN
VERIFIED**: offline run on the unzipped package **20 probes, 0 mismatches, exit 0**;
`presubmission_audit.py` **26 of 26**; suite **105 checks, 0 failed**; **6 author-verified
citations, 1 machine-corrected, 0 unresolved**; 0 rows N/A for jurisdiction, source type or
decision year; and the standalone DOCX and PDF are **byte-identical by SHA-256 to the copies
inside the ZIP**. **Nothing is sent. The article awaits Stacy's approval; the emails await the
owner.**

---

## 2026-08-28 — **ONE WORD CHANGED, THE MANUSCRIPT DELIBERATELY UNTOUCHED, AND THE FULL PRE-SUBMISSION CONTROL RUN CLEAN**

The review found **no required correction to the manuscript and none to the emails**, and
recommended a single optional micro-edit. Applied: Email 1's transition reads *"Three findings
may be particularly relevant to the Council's work"*, which marks the three as the principal
points and leaves the fourth analysis as supporting context rather than an afterthought the
sentence forgot to count. Applied to **both the working copy and the send copy**, so they cannot
diverge. **THE MANUSCRIPT WAS NOT TOUCHED AND THAT IS PROVEN BY HASH, NOT ASSERTED.**
`FOIL_Article_Draft.md`, the DOCX and the PDF all carry the same SHA-256 before and after this
turn. **No re-export was performed, because the source did not change**, which is exactly the
control the review asked for: export a fresh PDF only if the DOCX changed. Re-rendering an
unchanged document would have produced a new file with no new content and broken the
byte-identity with the ZIP for nothing. **THE OPTIONAL PAGE-BREAK TWEAK WAS DECLINED ON THE
REVIEW'S OWN TERMS.** Data availability sits alone on page 13. The review called it cosmetic and
said not to sacrifice readability to save a page; the renderer already forbids splitting a
heading from its section. **Leaving it is the conservative choice and it is recorded as a
decision rather than an oversight.** **FULL CONTROL, EVERY STEP EXECUTED**: reproduction run
**offline from the unzipped ZIP with sockets blocked, 20 probes, 0 mismatches, exit 0**; the
standalone DOCX and PDF **byte-identical by SHA-256** to the copies inside the ZIP; all three
author-verified citations present in the packaged dataset (**Russell 00966, Gannett 04071,
Wagner 05783**); all three supplied decision years correct (**PR-06 2013, PR-07 2015, PR-32
2025**); **PR-07 on the canonical `Final-Decisions-2015` path**; and **zero stale present-tense
verification notes** remaining. `audit_cfoc_claims.py` **15 of 15 claims and both banned lists
clean**, including the send copy; `presubmission_audit.py` **26 of 26**; suite **105 checks, 0
failed**. **THE PACKAGE IS AT THE POINT WHERE FURTHER EDITING WOULD PRODUCE DRIFT RATHER THAN
IMPROVEMENT, AND EDITING STOPS HERE.** **Nothing has been sent. The article awaits Stacy's
approval; the two Council emails await the owner.**

---

## 2026-08-28 — **CCI DID NOT REJECT THE EVIDENTIARY DEFICIT ARTICLE. THE EDITOR INVITED A REVISION AND NAMED THE FRAME SHE WANTS. THE OWNER'S REWRITE HITS IT, WITH TWO PROBLEMS.**

**Jennifer Gaskin, Corporate Compliance Insights, 2026-08-28T14:57**, replying to the submission
of 2026-08-27. Preserved at `research/CCI_Editor_Response_Gaskin_2026-08-28.pdf`. **HER WORDS:
*"There's a lot here we like"*, and *"If the piece focused on that, we'd be happy to consider a
revision."* That is a conditional invitation, not a decline.** **WHAT SHE SAYS IS ALREADY
COVERED**, four items published by CCI in the past two months: AI-generated records; the gap
between what a file says and what it can prove; **ISO 42001/NIST as scaffolding rather than safe
harbour**; and **Mobley v. Workday**. **WHAT SHE WANTS INSTEAD, VERBATIM**: *"the
employment-discrimination frame you're working in, pretext, burden-shifting and what happens
when AI-drafted records get read side by side across a workforce."* **THE OWNER'S REWRITE
ANSWERS THE BRIEF DIRECTLY**, 1,506 words: new sections *Pretext starts with the record*
(McDonnell Douglas burden-shifting) and *The pattern may appear only across employees*
(side-by-side review). **Pretext 2, burden-shifting 1, McDonnell Douglas 1, side-by-side 2,
across employees 3. Mobley and NIST are gone entirely.** Vocabulary clean: 0 peer-reviewed, 0
validated, 0 proves, 0 certif, 0 guarantee, 0 em dashes. **PROBLEM 1, AND IT IS THE ONE THAT
COULD DRAW THE SAME OBJECTION AGAIN. The European frame is the LARGEST SECTION IN THE ARTICLE at
315 words, 20.9 percent**, against an employment core of 588 words, 39 percent. **That section
is where ISO/IEC 42001 lives, which is one of the four things she said CCI has already
covered.** She asked for a piece *focused on* the employment frame; the single biggest block is
the material she named as overdone. **PROBLEM 2: THE CLAIM THAT HEKIM'S PART IS UNCHANGED IS NOT
ACCURATE, AND I CHECKED RATHER THAN ACCEPTED IT.** Measured against his preserved
`Evidentiary_Deficit_Article_Hekim_Version_rev2026-08-18.md`, **SequenceMatcher similarity
0.625, and only 1 of his 13 sentences survives verbatim.** Most differences are benign: UK to US
spelling, and a section title change. **Two are substantive additions to a section bylined to a
named co-author**: *"Many of those workflows will not fall within the high-risk regime at all"*
and *"Neither establishes any particular record-level control."* Both are new assertions about
what ISO/IEC 42001 and DORA do **not** do, **added to text carrying the byline of a certified
ISO/IEC 42001 auditor.** He should see those two sentences before it goes back. **TWO FORMATTING
DEFECTS IN THE DOCX**: missing spaces at *"assessed.The timing"* and *"accepted?ISO/IEC"*, where
paragraph breaks collapsed. **MY OWN PROBE FAILED FIRST AND I CORRECTED IT IN THE SAME TURN.** I
searched the literal `ISO 42001`, the text uses `ISO/IEC 42001`, and I briefly reported that the
rewrite carried none of the editor's four overlaps. It carries one. **Ninth broken probe in five
days; the first red result was mine again.** Files preserved: the rewrite as `.md` and `.docx`,
and the editor's reply as PDF. **Nothing sent. No revision applied to Hekim's section without
his sight of it.**

---

## 2026-08-28 — **STANDING PROMPT RE-PASTED WITH NO QUESTION. NO AUDIT RE-RUN, PER CLAUDE.md VIII. ONE STANDING DIRECTIVE I HAVE BEEN BREACHING ALL SESSION IS NOW HONOURED.**

The message carried the MASTER ARCHITECTURE mandate and no instruction. `CLAUDE.md` VIII is
explicit that a re-paste is not a trigger to re-run a clean pass, because doing so burns usage
the owner has objected to by name. State it in one line and stop. **THE BREACH, STATED PLAINLY
RATHER THAN QUIETLY CORRECTED**: the same section carries *"ATTACH THE TRACKER EVERY TURN, NO
EXCEPTIONS (Phillip, 2026-08-13) ... a chat attachment is the only way he can reach it. Do not
ask whether to attach; attach."* **I have ended every response this session with an inline
Master Tracker block and attached the file on only two turns.** The inline block satisfies the
v3.1 response format; it does not satisfy the 2026-08-13 directive, because a block in chat
scrollback is not a file he can keep, and `research/` is excluded from every deploy by design.
**The two requirements are not the same and I treated them as if they were.** From this turn the
readable extract is attached on every response. The raw file is **1.7 MB with single lines past
6,500 characters** and is the permanent record, not a document anyone can read;
`scripts/tracker_extract.py` rewraps recent activity without touching the source, verified
byte-identical before and after. **NOTHING ELSE CHANGED.** Open decisions still with the owner
and unmoved: whether to cut the European frame in the CCI resubmission from 20.9 percent,
whether Hekim sees the two sentences added under his byline, Stacy's approval on FOIL, Ubayet on
Detection, and whether to issue blind packets R2 and R3.

---

## 2026-08-28 — 12 queued PR notifications read and triaged

Twelve routine deployment bots covering three commits, `6465ea1` CCI preservation, `4e379bc` the
tracker-attachment correction, and `8578a51` the ordered-list fix. **Cloudflare skipped on all
three, Vercel Ready on all three, check suites clean, 0 actionable, 0 review comments.**
`4e379bc` was a hash I did not recognise on sight and I verified it against the log rather than
assuming it was mine; it is the attachment-directive commit whose hash I never printed. None of
the three reaches production: all touch `research/` and `scripts/` only, and `main` stays at
`ac43692`. Tracker extract regenerated and attached per the 2026-08-13 directive.

---

## 2026-08-28 — **CCI ARTICLE REVISED TO THE EDITOR'S BRIEF. THE EUROPEAN SECTION IS CUT FROM 20.9 PERCENT TO 11.5, AND HEKIM GETS A CHANGE LOG RATHER THAN A CLAIM THAT NOTHING MOVED.**

`research/Evidentiary_Deficit_CCI_RESUBMISSION_2026-08-28_REV2.md`, **1,511 words**, plus a Word
document and an 818-word change log for the co-author. **THE STRUCTURAL PROBLEM IS FIXED.** The
previous draft answered Jennifer Gaskin's brief in its sections but contradicted it in its
proportions: the **European frame was the single largest block at 315 words, 20.9 percent**, and
it was where **ISO/IEC 42001** lived, one of the four topics she said CCI has already covered.
Now: **employment core 686 words, 45.4 percent; European note 174 words, 11.5 percent**,
retitled *"A note for organizations operating in Europe"* and **moved after the practical
control** so pretext, side-by-side review and the defensible-record standard run consecutively.
**ISO/IEC 42001 appears once in the whole piece, in Hekim's author biography, where it
identifies a credential rather than making an argument.** **SEVEN DEFECTS IN THE PREVIOUS DRAFT
WERE FOUND AND FIXED, FIVE MORE THAN I REPORTED LAST TURN.** A **dangling repeated citation**,
*"is pretextual. McDonnell Douglas Corp. v. Green"*; **two collapsed sentence spaces**; **two
stray `GDPR` tokens**, one ending the European section and one ending Hekim's biography; the
**seven-point control list run together in a single paragraph** as *"1. Identify...2.
Preserve..."*; and the **four reviewer questions as four loose paragraphs**. Only the two
spacing defects had been reported. **SUBSTANTIVE ADDITIONS, ALL INSIDE THE FRAME SHE ASKED
FOR**: the mechanism behind cross-employee recurrence, that a tool prompted on prior records
reproduces the same characterizations while a reviewer approving one record at a time has no
vantage point to notice it; and in the pretext section, *"An employer in that position can
articulate its reason. What it may not be able to do is show the reason was the one it actually
applied."* **HEKIM'S SECTION: EVERY DATE AND INSTRUMENT HE SUPPLIED IS RETAINED.** Article 5(2),
Regulation (EU) 2026/1744, Annex III from 2 December 2027, Annex I from 2 August 2028, and the
point that many workflows fall outside the high-risk regime. **Three citations dropped and each
is named as his call**: Article 30, ISO/IEC 42001, DORA. **AND THE SENTENCE THAT WAS PUT IN HIS
MOUTH IS OUT.** *"Neither establishes any particular record-level control"* was added to his
section in the previous draft without his sight of it, and it asserts what ISO/IEC 42001 and
DORA do **not** do under the byline of a **certified ISO/IEC 42001 auditor**. Removed. The
change log states that plainly rather than burying it. Similarity to his original is **0.184**,
which is compression, not disagreement: nothing he wrote is contradicted.
**`scripts/audit_cci_revision.py` TESTS THE BRIEF RATHER THAN JUDGING IT BY EYE**: 9 required
elements all present, 3 overlap caps all met (Mobley 0, NIST 0, ISO/IEC 42001 1), 10
banned-vocabulary and formatting checks all zero, and a hard rule that the European note must be
both smaller than the employment core and under 12 percent. **0 problems.** **MY OWN AUDITOR HAD
A REPORTING BUG AND I FIXED IT BEFORE SHIPPING**: it read the prior draft with a heading parser
the flat docx extraction does not satisfy and printed *"prior resubmission draft 0 words"* in a
change report meant for a co-author's approval. Corrected to locate the block by content: **312
words**. **Tenth broken probe in five days.** **Nothing sent. The revision and the change log go
to Hekim first; the piece does not go back to CCI until he has approved his own section.**

---

## 2026-08-28 — **CCI MICROEDIT PASS APPLIED. ALL 13 NAMED EDITS IN, 14 PROTECTED ELEMENTS ASSERTED INTACT, AND THE WORD TARGET REACHED IN THE DOCX BUT NOT IN THE MARKDOWN.**

`research/Evidentiary_Deficit_CCI_RESUBMISSION_2026-08-28_V3.md`, built by
`scripts/apply_cci_microedits.py`, which **refuses to write the file if any protected element is
disturbed**. **EVERY NAMED EDIT APPLIED**: item 2 the duplicate *the*; item 5 *"matters at the
point where"* to **"can matter when"**, which is the legally disciplined form; item 7 the
sentence break; **item 8, the highest-value one, replacing *"a drafting tool trained or prompted
on prior records will tend to produce"* with *"prompted with prior records may reproduce similar
characterizations"***, removing an unnecessary claim about how drafting systems are trained;
item 10 and 11 *show* to **identify** and *used* to **applied**; items 15, 16, 17 in the control
list; item 18 *"hold up under"* to **"can withstand"**; item 19 **"an individual employee's
wording"**; and the biography cut to his recommended version, **minus the HUD and EEOC clause
and the *named Decision Reconstruction Risk* construction**. **HEKIM'S BIOGRAPHY WAS NOT
TOUCHED**, on his instruction, and DORA survives there. Taking a co-author's biography for
twenty words while he is already being asked to approve a cut to his section would be trading
his control for a rounding error. **MY OWN CUT SILENTLY UNDID HIS ITEM 18 AND I CAUGHT IT IN THE
DOCX CHECK.** The JRS compression deleted the very clause item 18 had just been applied to, so
*"can withstand independent review"* vanished from the built document. Restored inside the
compression. **Applying an instruction and then removing it in the same pass is worse than not
applying it, because the change log would have claimed it was done.** **THE WORD TARGET IS MET
IN THE DELIVERABLE AND MISSED IN THE SOURCE, AND BOTH NUMBERS ARE REPORTED.** The Word document
is **1,339 words**, inside his 1,250 to 1,350 range. The markdown source is **1,414**, because
it carries heading syntax, list numerals and emphasis marks that Word does not count as text.
**99 words came out**, all from the four categories he authorised: transitional sentences,
repeated explanations, the European section and bio length. **I STOPPED CUTTING AT THAT POINT
DELIBERATELY.** The remaining 60-odd words would have had to come out of the seven-point
control, the Before and After pairs, the side-by-side section, the disparate-treatment
limitation, the DRR definition or the subjective-language examples, **every one of which he
listed as protected**, or out of Hekim's remaining citations, **which are not mine to cut
twice**. Balance now: **employment core 656 words, 46.5 percent; European note 157 words, 11.1
percent**. `audit_cci_revision.py` reports **0 problems**: 9 required elements present, Mobley
0, NIST 0, ISO/IEC 42001 confined to the author biography. **THREE ITEMS HE MARKED BLOCKING ARE
STILL OPEN AND NONE IS MINE TO CLOSE**: Hekim's approval of the shortened European section;
**the AI-use disclosure question, which depends on CCI's submission policy and is not recorded
anywhere in this repository, so it is a `[REQUIRED_ENV_PARAM]` rather than a guess**; and
**CCI-compatible hyperlinks, which `research/md_to_docx.py` cannot produce, containing zero
hyperlink support**. The links must be added in Word or the builder extended.

---

## 2026-08-28 — **AI-FINGERPRINT AUDIT OF THE CCI ARTICLE. CLEAN ON EVERY WORD TEST AND CAUGHT BY RHYTHM, WHICH IS THE ONE THAT MATTERS.**

The uploaded V3 is **my own V3 returned unchanged**, 0.979 similarity with no sentence added or
removed; the apparent diffs are list markers Word stores as numbering rather than text.
**`scripts/audit_ai_fingerprints.py` TESTS THREE FAMILIES BECAUSE THEY FAIL DIFFERENTLY.**
Lexical: **0 of 21** present, no *delve*, *landscape*, *leverage*, *robust*, *seamless*,
*underscore*, *crucial*, *comprehensive*, *testament to*, *moreover*. House rules from
`CLAUDE.md` III.7: **0 em dashes, 0 "Designed for", 0 "frequently", 0 "no policy change
required"**. Burstiness: **coefficient of variation 0.52**, inside the 0.45 to 0.75 human band,
sentences running 3 to 48 words. **THE PIECE PASSED EVERY VOCABULARY TEST AND WAS STILL CARRYING
THE MOST RECOGNISABLE MODEL TELL THERE IS.** **Fourteen of 78 sentences used negation, and six
were the same antithesis, *"X is not Y. It is Z."*, about one every 230 words.** A compliance
editor who reads AI-drafted prose all day feels that rhythm before naming it, and this article's
own subject is AI-assisted documentation, so reading as generated undercuts the argument by
example. **MY OWN DETECTOR UNDERCOUNTED IT SIX TO THREE AND I FOUND THAT BEFORE ACTING.** Three
overlapping regexes matched the same sentences, and a deduplicated print certified as clean the
exact construction the check exists to find. Rewritten to count **sentence by sentence over
pairs**, so one construction counts once however many patterns hit it. **An undercount there is
worse than no check at all.** **THREE VARIED, THREE KEPT, AND THE SPLIT IS ARGUED RATHER THAN
ARBITRARY.** Varied: *"The problem is not necessarily that the decision was wrong"* becomes
**"The decision may well have been the right one. The record may still be unable to demonstrate
why it was made"**; *"The control is not to ban particular phrases"* becomes **"Banning
particular phrases achieves little"**; and *"The organizing principle is not 'retain
everything'"* becomes **"The organizing principle is preservation rather than retention"**.
**KEPT**: the risk sentence, because the antithesis *is* the article's central claim; the
conclusion's framing, which the owner protected; and **"It is not a legal doctrine and not a
claim of any new entitlement"**, which is the right-to-know-why disclaimer and legally
load-bearing. **Meaning is identical in all three rewrites; only the shape changed.** **RESULT:
antithesis 4 to 2 by the corrected counter, 2.8 to 1.4 per 1,000 words. Negation density 17.9 to
14.1 percent of sentences.** **THE WORD DOCUMENT IS NOW 1,328 WORDS, INSIDE THE OWNER'S 1,250 TO
1,350 TARGET**, with 11 numbered list items and the case name italicised.
`audit_cci_revision.py` still reports **0 problems** and every protected element survives: the
disparate-theories limitation, both Before and After pairs, the seven-point control, *can
withstand independent review*, *undergoing structured validation*, and Hekim's untouched
biography. **The three BLOCKING items are unchanged and none is mine to close**: Hekim's
approval, the AI-use disclosure question which depends on CCI policy not recorded here, and
hyperlinks which `md_to_docx.py` cannot emit.

---

## 2026-08-28 — **CCI FINAL PASS: FOUR EDITS, FOUR WORKING HYPERLINKS, AND THE DOCX BUILDER EXTENDED TO SUPPORT THEM. ONE INSTRUCTION DELIBERATELY NOT EXECUTED.**

**ALL FOUR TEXT EDITS APPLIED**: *"not that the prose"* to **"not simply that the prose"**,
which stops the article implying ordinary AI errors are irrelevant; the mechanism sentence to
**"a drafting tool may reproduce similar characterizations when prompted with prior records"**,
moving the conditional to the front so it does not read as a claim about how every drafting
system is built; the **Oxford comma removed** from the side-by-side sentence for AP style; and
*"follow the reasoning"* to **"reconstruct the reasoning"**, which closes the loop back to
Decision Reconstruction Risk. **A sweep found 0 remaining Oxford commas** in the whole
manuscript. **THE HYPERLINK BLOCKER IS CLOSED BY BUILDING THE CAPABILITY, NOT BY WORKING AROUND
IT.** `research/md_to_docx.py` had none: it flattened `[text](url)` into **"text (url)"**,
printing bare URLs into the prose, which is exactly what an outlet asking for in-text links does
not want. It now emits real `w:hyperlink` elements with the `r:` namespace declared, a
`Hyperlink` character style in blue and underlined, and relationships written from the links
actually collected rather than a fixed string. **FOUR LINKS EMBEDDED, AND EVERY TARGET WAS
FETCHED AND ITS CONTENT CHECKED RATHER THAN PINGED.** A EUR-Lex ELI URI **returns HTTP 200 for a
not-found page**, so a status code proves nothing. Each was retrieved and its document title
matched: `law.cornell.edu/supremecourt/text/411/792` titled *"McDONNELL DOUGLAS CORPORATION,
Petitioner, v. Percy GREEN"*; `eli/reg/2016/679/oj` titled *"Regulation - 2016/679 - EN -
gdpr"*; `eli/reg/2024/1689/oj`; and **`eli/reg/2026/1744/oj`, which resolves and is titled
correctly**, so the amending regulation the article cites is real and linkable. **Justia was
rejected**: it returns 403 to automated requests, so it could not be verified from here, and
Cornell's LII is both authoritative and reachable. **VERIFIED IN THE BUILT DOCUMENT**: 4
`w:hyperlink` elements, anchor text displaying **"McDonnell Douglas Corp. v. Green", "GDPR", "EU
AI Act", "Regulation (EU) 2026/1744"**, **zero bare URLs anywhere in the prose**, the case name
**keeping its italics inside the link**, no footnotes part in the package, and no reference
list. The nine concepts the owner said not to link, including DRR, JRS and the right-to-know-why
phrase, are **0 linked**, asserted in code. **ITEM 19 WAS NOT EXECUTED AND THE REASON IS THE
INSTRUCTION ITSELF.** The owner asks to retitle the European section to *"The European frame"*
but conditions it on Hekim's approval. **Hekim has approved nothing: the section's length, its
content and its heading are precisely what he is being asked to sign off.** Changing the heading
now would pre-empt the approval it is conditioned on. **NO REGRESSION**: the FOIL manuscript and
the CFOC send copy both rebuild cleanly at 4,984 and 1,048 words with 0 hyperlinks, so the
tokenizer change is additive. Fingerprint audit **0 findings**, revision audit **0 problems**,
suite **105 checks, 0 failed**. Word count **1,330**, inside the 1,250 to 1,350 target. **Two of
the three BLOCKING items are now closed. The remaining one is Hekim's approval, and the AI-use
disclosure still depends on CCI policy that is not recorded in this repository.**

---

## 2026-08-29 — **UBAYET HOSSAIN APPROVED THE DETECTION PAPER AND CHANGED HIS OWN AFFILIATION. THE CHANGE WAS APPLIED BEFORE ANY LINK WAS SENT, AND THE ORDER MATTERED.**

LinkedIn, 2026-08-28 3:37am, screenshot on file. **His verdict: *"The paper looks absolutely
great, the methodological framing, statistical rigor, and clear treatment of the findings and
limitations are spot on."*** That is the co-author who designed the reliability framework
signing off on the framework's own presentation. **HIS INSTRUCTION, VERBATIM: *"I agree that
removing the KPMG name is the right move. Listing me as an 'Independent Financial Risk & Model
Validation Professional' works much better for this personal capacity contribution. Please go
ahead with that update for submission."*** **THE SEQUENCING PROBLEM I FOUND BEFORE SENDING
ANYTHING.** His honor record at `api/honor.js:124` still read *"Associate Director, Model
Validation"* and *"KPMG India"*, and **`honor.html:124-126` pre-fills exactly those two fields
into the acceptance form**. Sending him the honor link first would have shown him, on a page
inviting him to accept recognition, **the affiliation he had just asked to retire**. The change
was applied first. **FOUR LIVE SURFACES UPDATED, NOT ONE**: `api/honor.js`,
`api/_coauthor-roster.js`, `api/_contributor-roster.js` and
`research/Detection_Article_Submission_FINAL5_2026-08-18.md`. Title set to his exact wording,
**org field cleared rather than replaced**, and **his FRM designation retained**, which is his
own credential and not an employer's. Verified: **0 occurrences of KPMG tied to him on any live
surface.** **HISTORICAL LOGS WERE DELIBERATELY LEFT ALONE.** `MASTER_TRACKER.md` and the
superseded drafts record the affiliation that was true when they were written; rewriting them
would destroy the record of the change itself, which is the same principle the withdrawal
register applies to names. **HE HAS NEVER USED ANY LINK SENT TO HIM**, and the owner confirms
it. His co-author confirmation key `ggo2vm8jja` and contributor key `6dyc0l2757` are both
outstanding, consistent with `/api/coauthor-stats` showing **expected 3, confirmed 0** since the
links went live on 2026-08-24. **The owner's standing decision of 2026-08-27 is that the
co-author links will not be used and he handles co-authors directly, so the reply does not chase
them.** **HIS HONOR LINK IS `H-2026-38`, key `b3874haudg`**, awarded *"for the methodology
rather than for a completed review"*: the reference-panel design, the chance-corrected
reliability framework, and the acceptance thresholds fixed before any analysis. **Of 34 honor
links issued, only 1 has ever been sent.** His would be the second. **HE ASKED TO BE TAGGED** in
any LinkedIn posts or announcements once the paper is submitted or published, and offered to
share it across his network. Recorded as a commitment the owner has now made. **The paper's
venue is *AI and Ethics* (Springer), and the venue still does not appear anywhere in the FINAL5
manuscript itself.**

---

## 2026-08-29 — **REPLY TO UBAYET WRITTEN, 376 WORDS, CARRYING HIS HONOR LINK. AFFILIATION CHANGE DEPLOYED AND VERIFIED LIVE BEFORE THE LINK GOES OUT.**

Deployed to `main` at **`39b5316`**. Live check on `/api/honor?k=b3874haudg` returns **title
*"Independent Financial Risk & Model Validation Professional"*, org empty, and `KPMG` absent
from the entire payload**. The acceptance form he opens will now pre-fill the affiliation he
asked for. **THE REPLY DOES NOT CHASE THE TWO LINKS HE HAS NEVER USED**, and that is deliberate
rather than an omission. His co-author key and contributor key are both outstanding, but the
owner's standing decision of 2026-08-27 is that the co-author links will not be used and he
handles co-authors directly. **Asking a man who has just approved a paper and made one clear
request to go complete two forms would read as transactional.** The honor link is offered as
recognition, with *"it is not a request for anything"* stated in the message and declining
framed as a perfectly good answer. **IT CONFIRMS WHAT WAS ACTUALLY DONE RATHER THAN PROMISING
IT**: the affiliation is already changed everywhere his name appears, his **FRM is retained
because it is his and not an employer's title**, and the tagging commitment is given in plain
terms, at submission and again on acceptance. **HIS HONOR WOULD BE THE SECOND EVER SENT**: 34
issued, 1 sent to date. The citation quoted back to him is the one already stored in
`api/honor.js`, not a new one written for the occasion. Files:
`research/Message_Ubayet_Hossain_2026-08-29.md` and `.docx`. Verified clean of *KPMG*,
*Associate Director*, and any co-author or contributor link chase.

---

## 2026-08-29 — **UBAYET'S CERTIFICATE ISSUED, THE MESSAGE REWRITTEN AROUND IT, AND HIS AFFILIATION FOUND ON A SECOND LIVE MANUSCRIPT NOBODY HAD LOOKED AT.**

**CERTIFICATE BUILT BY THE CANONICAL BUILDER, NOT HAND-DESIGNED.**
`scripts/build_honor_certificate_ubayet.py` supplies the data and calls `make_certificate` from
`research/build_certificate.py`, so the layout, the ivory ground, the double gold border and the
type are the ones already issued to 21 reviewers and to Stacyann Young. **The citation is read
out of `api/honor.js` at run time rather than retyped**, so the certificate cannot drift from
what the honor system would render if he opened his link. **IT SAYS "CERTIFICATE OF
RECOGNITION", NOT "COMPLETION", AND THAT DISTINCTION HAS A HISTORY.** `MASTER_TRACKER.md:1044`
records the honor certificate going out on 2026-08-08 titled *Certificate of Completion*, which
was wrong because **an honoree did not complete a 24-record set**. Verified against Stacyann
Young's issued certificate by **decoding the PDF content stream**, which is ASCII85 over Flate,
not by reading the source: hers draws *"Certificate of Recognition"*, and so does his. **HIS
CERTIFICATE VERIFIED THE SAME WAY.** 2,920 bytes, `%PDF-` header, `%%EOF` trailer, and the drawn
text decoded line by line: *Certificate of Recognition*, *Ubayet Hossain, FRM*, the Global
Governance and Transparency Honor (2026), the full methodology citation across six body lines,
and the signature block. **KPMG absent, *Associate Director* absent, *Certificate of Completion*
absent, and no employer or job title on the face of it**, matching the precedent set when Stacy
asked for her agency and title removed. **THE SECOND LIVE MANUSCRIPT IS THE FINDING.** His
instruction named the detection paper, but a sweep found
**`research/BusinessEthics_Article_Draft.md:10`**, a live manuscript for the *Journal of
Business Ethics* currently blocked on a different co-author, still crediting him as *"Associate
Director, Model Validation, KPMG India"* for the same methodology contribution. **Updated.** His
words were that removing the employer name is right *for this personal-capacity contribution*,
and it is the same contribution in both papers. **LIVE SURFACES NOW CARRYING KPMG AGAINST HIS
NAME: ZERO.** The superseded detection drafts FINAL through FINAL4, `Detection_Article_Final`
and `Detection_ArmB_Article_Draft` were **deliberately left alone**, as were the historical
tracker entries: they record what was true when written. **ONE THING FLAGGED RATHER THAN
CHANGED.** `research/Broida_Founding_Access_Offer.md:8` uses his employer's name in a
**commercial** context, *"KPMG worded as an individual model-validation director's
designed-and-approved methodology"*, which is a different and more sensitive use than a byline.
That channel was **closed on 2026-08-23** on the owner's determination, so the document is
dormant and was left as the historical record, but **if it is ever reused that line must go
first.** **MESSAGE REWRITTEN, 355 words.** The honor link is out entirely: **no URL, no key, no
*"takes about a minute"***. The certificate is attached instead, the citation is quoted in full
so he can read it without opening anything, and it states the certificate carries his name and
no employer. It now also tells him the Business Ethics paper was corrected, which he did not ask
about and would otherwise have found himself.

---

## 2026-08-29 — **CERTIFICATE REBUILT: HE IS THE AUTHOR OF THE METHODOLOGY, NOT ITS CO-AUTHOR. MESSAGE REWRITTEN IN A PLAINER VOICE.**

The owner asked whether the certificate should call him the author of the methodology, or
whether that was too much. **It was not too much. The certificate was understating him, and it
contradicted the paper.** **FOUR SOURCES, AND THE STRONGEST ONE IS THE MANUSCRIPT ABOUT TO BE
SUBMITTED.** `Detection_Article_Submission_FINAL5:581` reads *"The reliability and validation
methodology ... **was designed by** Ubayet Hossain, FRM"*, which is sole design attribution.
`DRR_Detection_Validation_Protocol:116` and `MASTER_TRACKER:98` say *contributions* and
*contributed*. **The certificate said the weakest of the four**: *"He is named as a co-author of
the methodology on that basis."* A reader who checked the paper would find it claiming more for
him than his own certificate did. **THE WORD *CO-AUTHOR* WAS ALSO DOING DOUBLE DUTY.** He
genuinely is a co-author of the paper, which is a separate fact, so the old line risked reading
as though his methodology role were shared. The citation now closes both: ***"He is the author
of that methodology and a co-author of the paper that reports it."*** **CHANGED IN
`api/honor.js`, NOT ONLY ON THE CERTIFICATE**, so the honor page and the certificate cannot
diverge. The builder reads the citation at run time, so one edit moved both. Rebuilt and
**verified by decoding the PDF stream again**: the new sentence is present, *"co-author of the
methodology"* is gone, and the certificate still carries no employer and no job title. **THE
PROVENANCE OF THE CITATION WAS SURFACED RATHER THAN LEFT BURIED.** `MASTER_TRACKER:1794` records
that **I wrote it on 2026-08-19**, grounded in two repository sources and explicitly *"not
invented"*, but they are **my sentences, not his**. **Stacyann Young's citation is verbatim her
own** per `MASTER_TRACKER:1053`, with two of her word choices deliberately left unsmoothed. The
two certificates were therefore not equivalent in provenance, and the message now says so to him
directly: *"I wrote that wording rather than asking you for it, so if any of it lands wrong,
tell me and I will reissue it however you would put it."* **That gives him the same courtesy
Stacy had, without pretending it was already given.** **MESSAGE REWRITTEN, 398 words, plainer
and warmer.** It opens with something true rather than formal: *"yours was the read I was most
nervous about, because you built the thing I was reporting on."* It credits him for the reason
the limitations section is honest, tells him the Business Ethics paper carried the old
affiliation and that **he had not seen it**, and gives the tagging commitment in one line.
**Fingerprint audit: 0 of 21 lexical tells, coefficient of variation 0.54, inside the human
band.** No link, no key, no URL anywhere in it.

---
