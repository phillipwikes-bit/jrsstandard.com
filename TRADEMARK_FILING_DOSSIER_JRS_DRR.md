# Trademark Filing Dossier: JRS and DRR

**Prepared:** 2026-08-11
**Basis:** repository and live-site evidence, read directly from disk and from `jrsstandard.com` on this date.

**Two limits, stated once.** This is filing preparation, not legal advice, and it does not create an attorney relationship. The identifications below are **drafted to USPTO ID Manual patterns but have not been verified against the current Manual** in this pass, so each is labelled DRAFTED, NOT VERIFIED. Every date and specimen path is evidence-backed or marked `[REQUIRES USER INPUT]`.

---

## 0. The finding that governs the whole filing

**No commerce is currently transacted through this site, and that determines the filing basis for most classes.**

| Test | Evidence |
|---|---|
| Pricing page | None. `/kit.html` and `/deployment-kit.html` both return **404** |
| Purchase links on `/`, `/jrsstandard.html`, `/enterprise.html` | **0** |
| Gumroad, Stripe, Payhip, checkout URLs anywhere in deployed HTML | **0** |
| `enterprise.html` | Says "Free" three times, offers "Contact" |
| Every `$` figure on the site | Inside sample records used as teaching examples, not price offers |

`index.html` and `jrsstandard.html` **visibly describe** a Deployment Kit purchase flow, stating "Payment is handled by Gumroad. Materials are delivered as a downloadable PDF package." **There is no link to it and the pages it refers to are 404.** The site advertises a purchase that cannot be made.

**Consequence:** a Section 1(a) claim resting on paid goods is **not supportable from current evidence**. Section 1(a) is arguable only for services actually rendered free of charge to the public, which is a fact-specific question for your attorney. Section 1(b) is the defensible basis for the commercial classes.

**This is also a live site defect worth fixing independently of the filing:** a reader who reaches that section has nowhere to go.

---

## MARK 1: JUSTIFICATION REVIEW STANDARD

### 1.1 Mark identification and specification

| Field | Value |
|---|---|
| **Literal element** | JUSTIFICATION REVIEW STANDARD |
| **Mark type** | Standard Character Mark |
| **Mark description** | The mark consists of the standard characters "JUSTIFICATION REVIEW STANDARD" without claim to any particular font style, size, or color. |
| **Applicant** | `[REQUIRES USER INPUT]` |
| **Entity type** | `[REQUIRES USER INPUT]` |
| **Domicile address** | `[REQUIRES USER INPUT]` |

**On the abbreviation "JRS".** It appears throughout the site as a short form. **Do not fold it into this application.** An abbreviation with a distinct commercial impression is normally a separate application. Filing "JUSTIFICATION REVIEW STANDARD (JRS)" as one literal element risks a requirement to amend the drawing. `[REQUIRES USER INPUT: whether to file JRS as a second, separate application]`

**On descriptiveness, flagged because it is the likeliest office action.** "Justification Review Standard" is composed of three ordinary words that together describe a standard for reviewing justification. Expect a **Section 2(e)(1) merely descriptive** refusal as a realistic outcome, with the Supplemental Register or a 2(f) acquired-distinctiveness showing as fallbacks. The evidence that would support 2(f) is the reviewer programme: 56 reviewers, 35 completers, 16 countries. That is recognition among a relevant public, and it is documented.

### 1.2 Designated classes and identifications

**Class 042 (primary). DRAFTED, NOT VERIFIED.**

> Developing voluntary technical standards and operational protocols for artificial intelligence governance, automated record-keeping systems, and algorithmic decision auditing; providing online non-downloadable software for auditing and evaluating the completeness of decision records in automated decision systems; providing online non-downloadable software for testing whether the stated basis for a recorded decision can be reconstructed from the record alone.

*Narrowed deliberately from the language supplied. "Platform as a service (PAAS) featuring computer software platforms for automated record verification, system log analysis, and decision justification testing" was removed: no PaaS exists. The only interactive surface, `org-pilot.html`, has **0 sessions all-time**. Claiming PaaS invites both a vagueness objection and a specimen failure.*

**Class 041. DRAFTED, NOT VERIFIED. Recommended addition, not in the supplied language.**

> Educational services, namely, providing online non-downloadable training modules and instructional materials in the field of reviewing and documenting administrative, employment, and compliance decision records; providing online non-downloadable reference guides in the field of decision-record review.

*Recommended because this is the class with the **strongest specimen evidence actually in existence**: `training.html` is a live six-module training system with 7 enrolments and 7 completions, and four Investigator Field Guides are published and downloadable. Filing 042 and 035 while omitting 041 files for what is aspirational and omits what is operating.*

**Class 009. DRAFTED, NOT VERIFIED. Conditional.**

> Downloadable electronic publications, namely, guides, reference cards, and worksheets in the field of decision-record review and artificial intelligence governance.

*File this class only on a **1(b)** basis unless the Gumroad flow is made operational. The materials exist and are downloadable at no charge; whether free distribution supports 1(a) for goods is a question for your attorney and I will not assert it.*

**Class 035 (secondary). DRAFTED, NOT VERIFIED.**

> Business auditing services in the field of institutional record-keeping compliance; business consultancy services in the field of artificial intelligence governance and automated decision documentation.

*Narrowed from "Business risk assessment services", which is broad enough to draw a vagueness inquiry standing alone. **File this class 1(b).** No consultancy has been sold and no client engagement is evidenced in the repository.*

### 1.3 Filing basis strategy

| Class | Recommended basis | Reason |
|---|---|---|
| 042 | **1(b) intent to use** | The non-downloadable software described exists only as `org-pilot.html`, which has 0 sessions all-time |
| 041 | **1(a) arguable**, attorney call | Training is live, used, and completed by 7 people. Specimen evidence is strongest here |
| 009 | **1(b)** | Free distribution only; no operational storefront |
| 035 | **1(b)** | No consultancy sold or evidenced |

**A 1(b) filing preserves your priority date now and defers the specimen requirement to a Statement of Use.** Given that no commerce is transacted, that is the honest and lower-risk route for three of the four classes.

### 1.4 Specimen inventory, as it actually exists

| Path | Type | Mark visible | Would demonstrate | Assessment |
|---|---|---|---|---|
| `jrsstandard.html` | Live page | Yes, 5 occurrences | 042 services | **Medium.** Describes the standard; a service specimen must show the mark used in the *sale or advertising* of the service |
| `training.html` | Live page | Yes, 3 occurrences | **041 services** | **Strongest available.** A live training system with completions |
| `org-pilot.html` | Live page | Yes, 6 occurrences | 042 software | **Weak on use.** Offers the service; 0 sessions all-time |
| `JRS-Standard.pdf` | Downloadable | Yes | 009 goods | Medium. A publication, not obviously a point-of-sale display |
| `JRS_Investigator_Field_Guide_*.pdf` (3 editions) | Downloadable | Yes | 009 goods | Medium. 65 downloads across 7 countries recorded |
| `JRS_Rapid_Review_Card.pdf` | Downloadable | Yes | 009 goods | Medium |
| `enterprise.html` | Live page | Yes, 3 occurrences | 035 services | **Weak.** Says "Free", offers "Contact", no service sold |

### 1.5 First-use evidence

| Field | Value | Evidence |
|---|---|---|
| Earliest appearance in repository | 2026-04-14 | Commit `06e99ce`, first commit containing the wording in an HTML file |
| Earliest appearance on production branch | 2026-07-07 | Commit `40e6cdd`. **A floor, not a first-use date:** `40e6cdd` is a 110-file bulk import that begins that branch's history |
| Public use verified | 2026-08-11 | HTTP fetch of `/`, `/jrsstandard.html`, `/decision-reconstruction-risk.html` |
| **First Use Anywhere** | **`[REQUIRES USER INPUT]`** | A commit is private drafting, not use of a mark |
| **First Use in Commerce** | **`[REQUIRES USER INPUT]`** | No sale, invoice, price or licence fee exists anywhere in the repository |

---

## MARK 2: DECISION RECONSTRUCTION RISK

### 2.1 Mark identification and specification

| Field | Value |
|---|---|
| **Literal element** | DECISION RECONSTRUCTION RISK |
| **Mark type** | Standard Character Mark |
| **Mark description** | The mark consists of the standard characters "DECISION RECONSTRUCTION RISK" without claim to any particular font style, size, or color. |
| **Applicant** | `[REQUIRES USER INPUT]` |
| **Entity type** | `[REQUIRES USER INPUT]` |
| **Domicile address** | `[REQUIRES USER INPUT]` |

**Descriptiveness risk is higher here than for JRS, and the reason is specific.** The site uses "Decision Reconstruction Risk" as the **name of a measured condition**, not only as a brand: it appears 12 times on its own page describing what the risk *is*. A term used to name the thing it identifies is the classic pattern for a 2(e)(1) refusal, and in the worst case for a genericness argument. **Fixing this is a marketing decision, not a filing one:** the mark needs to appear as a source identifier, for example "the DECISION RECONSTRUCTION RISK assessment", rather than purely as a descriptive noun phrase.

### 2.2 Designated classes and identifications

**Class 042 (primary). DRAFTED, NOT VERIFIED.**

> Providing online non-downloadable software for assessing and diagnostically testing the reconstructability of decision records in automated decision systems; technical assessment services, namely, evaluating decision logs of automated systems to determine whether the basis for a recorded decision can be reconstructed from the record; providing online non-downloadable software for evaluating data lineage and evidentiary completeness in artificial intelligence workflows.

*Narrowed from the supplied language. "Software as a service (SAAS)" was removed: no SaaS product exists, no account system exists, and there is no sign-in anywhere on the site. Claiming SaaS creates a specimen problem at Statement of Use that a narrower identification avoids.*

**Class 035. NOT RECOMMENDED for DRR at this time.**

*The supplied brief lists Class 042 only for DRR, and the evidence supports that restraint. Adding 035 would duplicate the JRS 035 claim without independent evidence.*

### 2.3 Filing basis strategy

| Class | Recommended basis | Reason |
|---|---|---|
| 042 | **1(b) intent to use** | No non-downloadable software bearing this mark is in operation. `decision-reconstruction-risk.html` explains the concept; it does not deliver the service |

**DRR should be filed 1(b) in its entirety on current evidence.**

### 2.4 Specimen inventory

| Path | Type | Mark visible | Assessment |
|---|---|---|---|
| `decision-reconstruction-risk.html` | Live page | Yes, **12 occurrences** | **Strongest available.** The mark's dedicated page |
| `DRR_Article.pdf` | Downloadable | Yes | Weak for services. An article is not a service specimen |
| 11 further HTML files on `main` | Live pages | Yes | Weak to medium. Supporting mentions |

### 2.5 First-use evidence

| Field | Value | Evidence |
|---|---|---|
| Earliest appearance in repository | 2026-06-23 | Commit `9ea3687` |
| Earliest appearance on production branch | 2026-07-07 | Commit `40e6cdd`, same bulk-import caveat |
| Public use verified | 2026-08-11 | HTTP fetch, 12 occurrences on the dedicated page |
| **First Use Anywhere** | **`[REQUIRES USER INPUT]`** | |
| **First Use in Commerce** | **`[REQUIRES USER INPUT]`** | |

---

## 3. Specimen requirements, what a filing actually needs

A specimen must show the mark **as used in commerce for the goods or services claimed**, not merely appear in a document that mentions the mark.

**For services (041, 042, 035):** a screen capture of a live web page that both displays the mark and shows the service being advertised or rendered, with the **URL and access date visible in the capture**. A page that only explains a concept is not sufficient.

**For goods (009):** a screen capture of the download or point-of-sale page showing the mark **in association with the downloadable item**, ideally with the download control in frame. The PDF's own cover page is generally weaker than the page from which it is obtained.

**What to capture, in order of current strength:**

1. `training.html`, showing the mark and the enrolment control (Class 041)
2. `decision-reconstruction-risk.html`, showing the mark and what is offered (Class 042, DRR)
3. `investigator-guides.html`, showing the mark beside the download buttons (Class 009)
4. `org-pilot.html`, showing the mark and the diagnostic offer (Class 042, JRS)

---

## 4. Master filing summary

| Field | Justification Review Standard (JRS) | Decision Reconstruction Risk (DRR) |
| :--- | :--- | :--- |
| **Mark type** | Standard Character Mark | Standard Character Mark |
| **Primary class(es)** | 042 primary; 041 recommended; 009 and 035 conditional | 042 only |
| **Core service/good** | Developing voluntary technical standards for AI governance and decision-record auditing; online non-downloadable software for evaluating decision-record completeness; training in decision-record review | Online non-downloadable software and technical assessment services for evaluating whether the basis for a recorded decision can be reconstructed from the record |
| **Recommended basis** | 041 arguably 1(a); 042, 009, 035 **1(b)** | **1(b)** in full |
| **Specimen type** | Live web page capture with URL and date; `training.html` strongest | Live web page capture with URL and date; `decision-reconstruction-risk.html` strongest |
| **Principal risk** | 2(e)(1) merely descriptive | 2(e)(1) merely descriptive, aggravated by descriptive-noun usage |
| **Dossier status** | **REQUIRES USER INPUT** | **REQUIRES USER INPUT** |

---

## 5. Required user inputs, consolidated

| # | Item | Applies to |
|---|---|---|
| 1 | Applicant name, entity type, domicile address | Both |
| 2 | **First Use Anywhere** date, and what evidences it | Both |
| 3 | **First Use in Commerce** date, or confirmation there has been none | Both |
| 4 | Whether to file "JRS" as a separate application | JRS |
| 5 | Whether Class 041 and Class 009 are wanted | JRS |
| 6 | Attorney verification of every identification against the current ID Manual | Both |
| 7 | Whether the Gumroad flow will be made operational, which changes the 009 and 035 basis | Both |

## 6. What I did not do

- **I did not verify any identification against the USPTO ID Manual.** Each is marked DRAFTED, NOT VERIFIED.
- **I did not assert USPTO acceptability**, because I have no verified Manual access in this pass.
- **I did not invent a first-use date.** Commit dates are recorded as commit dates and nothing more.
- **I did not claim a specimen is acceptable.** Candidates are inventoried and assessed for strength only.
