# Employment pilot: two blocking defects, authorship, and venue

**The pilot is closed and the data is final.** `realcase_progress` for contributor
V-HR-01, pulled live 2026-08-21, returns 22 cases with `last_at`
2026-07-29T18:01:58. Nothing added in 23 days. Every cell in the manuscript
reconciles to that row: cases 22, held_up 7, failed_appeal 7, challenged 6,
jrs_ready 13, jrs_review 6, jrs_gap 3.

**Every statistic recomputes to the digit.** Fisher's exact 0.0073, odds ratio
19.25, both Wilson intervals, and both alternative codings at 0.041 and 0.165 were
recalculated from the cell counts and match the manuscript exactly. **The
arithmetic was never the problem.**

---

## 1. Two defects that would have sunk this paper

### Defect 1: the "pre-registered outcome coding" claim is unsupported

The manuscript says it three times: *"Primary result, on the pre-registered
outcome coding"*, *"The protocol fixes the primary outcome as an adverse
finding"*, and *"The primary coding is the one fixed in the protocol."*

**No such protocol exists in this repository.** Searched:

| File | Result |
|---|---|
| `research/JRS_PreRegistered_Analysis_Plan.md` | Zero hits on outcome, coding, adverse or challenged |
| `research/OSF_PreRegistration.md:70` | Explicitly **excludes** this stage: a pass "does not establish ... that DRR predicts real-world failure, those require external-validity and criterion-validity stages" |
| `research/Tanvi_Pilot_Summary.md` | Describes the pilot, fixes no outcome coding |
| `research/DRR_Detection_Validation_Protocol.md:102` | One general line about criterion validity as a stage, no coding rule |

**And the repository already warned about exactly this.**
`research/Tanvi_Criterion_Analysis_2026-08-01.md`, written 2026-08-01, three days
after the data closed, lays out both codings with their p-values (0.10 and 0.006)
and then says in terms:

> "Which coding is legitimate is **not** a choice to make after seeing the
> p-values, it must be the coding fixed in the pre-registered real-case protocol.
> Picking Coding B because it clears 0.05, after seeing that Coding A does not, is
> the same cherry-picking trap that damages a paper."

The manuscript then adopted Coding B and labelled it pre-registered. **That file
asked for a protocol that was never produced, and the label was applied anyway.**

This is the same defect class as the corpus-construction-log claim repaired out of
the detection article at FINAL4, and it is worse here, because it converts a
best-of-three exploratory choice into a claimed confirmatory test. A referee who
asks for the registration and is told it does not exist does not request
revisions. **That is a desk rejection and a credibility event that travels.**

### Defect 2: the corpus is not blind, and the programme's own record says so

`research/MASTER_TRACKER.md`, exploratory-sweep section 5:

> "The Rung 3 set is **not blind**: one contributor recorded both the JRS read and
> the outcome for their own corpus, with no separation of roles recorded in the
> data. Until reads and outcomes are assigned by different people, **no Rung 3
> association is interpretable, whatever its p-value.**"

The manuscript's limitations disclosed a single reader. They did not disclose that
the same person also assigned the outcomes. **Temporal separation, read fixed
before outcome consulted, is real and worth stating. It is not role separation,
and the tracker already ruled on which one matters.**

### Also relevant: the multiplicity context

The tracker records a 10-test exploratory sweep on the pooled n=54 Rung 3 set with
a Bonferroni threshold of p < 0.005. The HR corpus appears there twice, at
p = 0.165. **The manuscript's headline p = 0.0073 would not clear that threshold.**
The defence is that a pre-registered confirmatory test is not one of ten
exploratory tests. That defence requires the pre-registration in Defect 1, which
does not exist.

---

## 2. What was done about it

`scripts/apply_business_ethics_completion.py`, 21 rules, 8 checks, 0 failed. It
does **not** delete the result and does not hedge it into nothing. It moves the
paper from a confirmatory claim it cannot support to a pilot report it can.

| Change | Why |
|---|---|
| Every pre-registration claim removed | Unsupported. Section 5.2 now opens by stating plainly that no analysis plan fixing a primary coding was recorded before the data closed |
| Three codings reported with equal standing | The strongest was being presented as primary on a label that did not hold |
| Dual role disclosed in **Section 5.1**, not only Section 7 | It is a design fact, and the tracker calls it disqualifying if hidden |
| Title changed | "Criterion Evidence" asserted a validation tier the design cannot carry. Now "A Single-Reviewer Pilot", stating the design in the title |
| Abstract written | It never existed. Emerald structured headings, **249 words** against their stated 250 ceiling, with the coding dependence inside the abstract where a screening editor sees it |
| Conclusion rewritten | Now reports an effect size and a corrected design rather than a finding, and ties each requirement of the next study to a specific defect in this one |
| Kyle's 4 bracketed asks removed | Internal instructions to a co-author cannot ship inside a manuscript |
| Competing-interests statement added | The revised author block referenced one that did not exist |
| Selection mechanism named | A matter reaches adjudication because something was contested, which is selection on a variable related to the outcome |

**One fail-closed stub is deliberately left in the file:**
`[REQUIRED_ENV_PARAM: co-author declarations...]`. Pokhriyal, Hossain and
McMullan must each confirm in writing whether they hold any financial interest in
JRS. **I did not invent those declarations.** The stub travels with the manuscript
so the gap cannot be forgotten.

---

## 3. Who should be first author

**Tanvi Pokhriyal first. Phillip Wikes senior and last. Hossain and McMullan in
the middle.**

**Why not Phillip first.** The paper evaluates a standard Phillip created. With him
as first author, the first thing a referee sees is the inventor reporting that his
own instrument works, in a corpus he did not read, on a coding chosen after the
data were in. Each of those is defensible alone. Stacked under his name at
position one they are not, and no wording fixes an optic that structural.

**Why Tanvi first.** She generated every data point reported. She selected and
screened all 22 matters, recorded all 22 reads, and recorded the outcomes. The
paper is her case set. She was also promised named co-authorship in writing
(`research/Message_Tanvi_Pokhriyal_CaseSet.md:11`), so this honours a commitment
already made rather than creating a new one.

**The honest tension, stated rather than buried.** Tanvi is also the single
non-blind dual-role reviewer, so first authorship puts her name on the design's
principal weakness. That is the correct outcome. The weakness belongs to the
design, the design is disclosed, and the alternative is Phillip taking first
authorship to shield her from a limitation the paper states openly anyway. **She
should be told exactly this before the order is fixed.** It is her name.

**Last-author position is not a demotion.** In empirical convention, first did the
work and last ran the programme. Phillip keeps senior authorship, the framework
credit, and the competing-interests disclosure that makes the whole thing legible.

---

## 4. Venue: not Journal of Business Ethics

**JBE is the wrong journal and always was.** It is FT50 and ABS 4*, publishing
normative ethics theory and large-scale empirical work. A 22-case, single-reviewer,
non-blind pilot with a coding-dependent result will be desk-rejected without
review. Estimated acceptance **under 5 percent**, and a desk rejection there costs
two to six weeks and teaches you nothing.

**Recommendation: Records Management Journal (Emerald), subscription route.**

Judged against the criteria your own `Venue_Decision_Detection_Paper_2026-08-05.md`
used, which are the right ones:

| Criterion | Records Management Journal |
|---|---|
| Cost | **Emerald hybrid.** Subscription route carries no APC. Their OA route is £3,222 and is optional, not required. **This is the deciding factor, same as last time** |
| Scope | Recordkeeping, evidentiary sufficiency, documentation quality. The paper's actual subject, in the journal's own territory |
| Collision | None. AI and Ethics holds the detection paper, Journal of Civic Information holds the FOIL paper, CCI holds the practitioner piece |
| Tolerance for a pilot | A niche methods-and-practice journal reviews work at this scale. JBE does not |

**Estimated acceptance after revisions: 45 to 60 percent.** Reasoned judgment, not
measured. What holds it there: n=22, one reviewer, dual role, no pre-registration,
no institutional affiliation. What supports it: a real-outcome corpus across three
jurisdictional systems, a large effect, complete and honest reporting of three
codings including the null, and a specified confirmatory design.

**Two items I could not verify and am not going to guess.** RMJ's specific word
ceiling: their author-guidelines page returns 403 to this environment. The Emerald
rule counts abstract, references and table text plus 280 words per table, which
puts this manuscript at **4,538**. Check the ceiling on the journal page before
submitting. Second, confirm RMJ's current hybrid status directly rather than from
Emerald's general policy page.

**Fallback ladder if RMJ declines:** *International Journal of Law and Management*
(Emerald, same cost model), then *Journal of Information, Communication and Ethics
in Society*.

---

## 5. Do not

- **Do not submit to JBE.** The retitle and reframe do not make it a JBE paper;
  they make it an honest paper for a smaller journal.
- **Do not restore any pre-registration language** to make the result look
  stronger. It is the single most damaging sentence available to this manuscript.
- **Do not drop the p = 0.165 coding.** Reporting the null coding alongside the
  significant one is most of this paper's credibility.
- **Do not submit before the four co-author confirmations**: Tanvi on the
  authorship order and on Section 5 describing the pilot as she ran it, Hossain on
  Section 4, McMullan on 6.4, and all three on competing interests.
- **Do not reopen the pilot to reach 30 cases.** It stalled at 22 on 29 July.
  Adding cases now, after the analysis is known, is a worse problem than n=22.
