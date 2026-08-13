# What people actually sign, and how it insulates you

**Scoured 2026-08-13 from the live pages and the endpoints that store the flags. Every quotation below is verbatim from the site, not a paraphrase.**

*Not legal advice. This is an inventory of what is on the record and an assessment of where it is strong and where it is thin.*

---

## 1. The short answer

**There is no signature anywhere. Nobody signs anything.** Every permission on this project is a **tick box plus a stored boolean**, with the wording shown at the moment of ticking and a dated row written to the database.

That is weaker than a signed release and stronger than most research sites. **Where it insulates you well, it does so because of one design decision repeated everywhere: you separated "you may contact me" from "you may publish my name", and you never bundled either into getting the thing.**

---

## 2. The consent architecture, in one picture

There are **two decisions**, deliberately kept apart, and the separation is the single most defensible thing in the whole design.

### Decision 1: the registration tick (one box, three parts)

Shown on **training, honor, org-pilot, recheck, reviewer evaluation**. The panel opens the full text before the tick. Verbatim from `privacy.html`:

> **1. Contact.** We may contact you about JRS.
> **2. Storage.** We may store your details securely for that purpose.
> **3. Transfer with the asset.** Your record may transfer to a successor organization if the JRS assets are sold or transferred.

And immediately after, verbatim:

> **"Ticking that box does not publish your name. Nothing about you appears on any public page as a result of it."**

Stored as `consent_contact`, `consent_transfer`.

### Decision 2: the public listing (a separate, later, optional click)

Verbatim from `privacy.html`:

> *"Appearing on the public International Registry of Supporters is offered on its own, **after you already have whatever you came for**: the guide is downloaded, the training is unlocked, the diagnostic is open, the endorsement is recorded. It is one click, **it is never a condition of any of those things**, and if you never click it your name stays private. Where it applies, **only your name and organization are published. Your email address is never published.**"*

Stored as `consent_named`, `consent_public_list`.

**Why this matters:** the most common consent failure is conditioning a benefit on a publicity permission. You explicitly did not. The policy says so, the sequencing enforces it, and the flags are stored separately so it is provable from the data.

---

## 3. Stream by stream: exactly what each person agreed to

### 3.1 Training enrolment

**Wording ticked, verbatim:**
> *"I agree to receive my certificate and updates on the JRS standard, and to my details being stored securely under the registration terms. **Your name is not published by ticking this.**"*

**Insulation:**
- The certificate itself carries: *"Completion reflects participation in the training modules only and **does not constitute certification, accreditation, or a professional credential**."*
- The simulator carries: *"Not legal advice, HR guidance, or compliance determination."*
- And: *"Use fictional or anonymized text only. Do not paste records containing real personal identifying information."*

**This is the strongest stream.** A completer cannot claim they were credentialed, cannot claim they received advice, and was told not to paste real records.

### 3.2 The reviewer evaluation

**Wording ticked, verbatim:**
> *"I agree to be contacted about the JRS standard and to my details being stored securely under the registration terms."*
> *"**Optional:** list my name publicly as a JRS-trained reviewer."*

**And on the incentive block, verbatim:**
> *"By checking this box, you consent to research follow-up and secure storage and **transfer of your contact information if JRS assets are transferred to a successor project**."*

**The strongest structural protection on the whole site sits here:** answers and identity are written to **different tables with no shared key**. Nobody, including you, can say which respondent gave which answers. That is not a promise, it is an architecture, and it means a re-identification complaint has nothing to attach to.

### 3.3 Endorsements

**Wording, verbatim:** *"You may contact me about this initiative. **I understand my details stay private.**"*

**This is your thinnest stream, and you should know why.** A one-click endorsement records a count, a campaign tag and a country. It carries **no ticked consent at all** unless the person went on to register. **50 endorsements produced 3 named supporters.** The other 47 are anonymous counts with nobody attached.

**That is actually protective**, because there is no personal data to mishandle. But it means the endorsement figure conveys nothing to a buyer and cannot be represented as a consented audience.

### 3.4 Honor acceptances

**Wording, verbatim:**
> *"Ticking the box means three things and no more: contact me about this work, store my details securely, and allow that record to travel with the project if the JRS assets are ever transferred to a successor."*

**On the certificate:** *"Nothing is issued until you confirm it below, and **nothing is published without your say-so**."*

**On the quote:** *"If you give us one, it may appear in the article and in coverage of the work, **always attributed and never edited beyond punctuation**."*

**Two separate booleans are stored: `quote_clearance` and `byline_ok`.** A quote is never rendered anywhere without its clearance flag beside it, and an uncleared quote displays in red reading **"NOT cleared, do not publish"**. **This is the best-controlled permission on the project.**

### 3.5 Organization pilots

**Wording, verbatim:**
> *"I agree to receive my diagnostic results and updates on the JRS standard... **No record text is ever stored, and your name and organization are not published by ticking this.**"*

**The insulation here is data minimisation, which beats any consent form:**
> *"Your record text is never stored: **each record is assessed in memory and discarded**."*
> *"It is generated in your browser from the counts on screen, so it **contains no record text**."*

**You cannot leak what you never held.** If an organization ran real HR records through it, you hold zero of that text. That removes the single largest liability an outsider would expect this project to carry.

### 3.6 Contributor confirmations (the paper)

**Three explicit questions, verbatim:**
> *"May your name and title be printed in the paper as a named contributor?"* with *"**Either answer is fine.** No means your contribution is counted in the aggregate and your name appears nowhere."*
> *"May the review work you contributed, and your credited name and title, **continue to be used** in publications and materials about this study?"*
> *"If this work **transfers to a successor organization**, may that permission and your contact details transfer with it?"*

**This is the only stream that captures continuing-use rights**, which is exactly what a buyer's counsel will look for. It is well drafted. **It has been sent to nobody: 20 links issued, 0 sent.**

---

## 4. The seven things that actually insulate you

| # | Protection | Where it comes from | Strength |
|---|---|---|---|
| 1 | **Publicity is never a condition of anything** | Sequencing plus the policy text, plus separate stored flags | **Strong.** Provable from the data |
| 2 | **No record text is ever stored** | `org-pilot`, in-memory assessment | **Strongest.** You cannot leak what you never held |
| 3 | **Answers and identity in different tables, no shared key** | The reviewer evaluation | **Strong.** Architectural, not promissory |
| 4 | **"Not certification, not accreditation, not a credential"** | On the certificate, the training and `index.html` | **Strong.** Blocks a reliance claim |
| 5 | **"Not legal advice, HR guidance, or compliance determination"** | Training, pilot, implementation-scenarios | **Strong** |
| 6 | **"It does not guarantee that any decision is correct, lawful, or will survive challenge"** | `acquisition`, `vp` | **Strong** for buyer diligence |
| 7 | **PII screen before any free-text submission** | `jrsSanitizeCheck` in the browser | **Moderate.** Prompts redaction, does not enforce it |

**Plus withdrawal, verbatim:** *"You can withdraw your consent at any time by emailing info@jrsstandard.com. On withdrawal we remove you from the public Registry, stop contacting you, and delete or anonymize your record on request."*

---

## 5. The four gaps, stated plainly

**1. Nothing is signed, and nothing is versioned.**
Every permission is a tick against wording that lives on a live page you can edit. **There is no stored copy of the terms as they read on the day each person ticked.** If wording changes, you cannot prove what any given person saw. **This is the biggest weakness and it is cheap to fix:** store a terms version string on every consent row from now on.

**2. No IP assignment from co-authors.**
Consent covers contact, storage, transfer and naming. **It does not assign copyright.** The transfer map already flags this: co-authored papers carry shared copyright and cannot be sold as solely owned works. **A consent tick is not an assignment.**

**3. The transfer consent is narrow, and correctly so.**
It transfers **contact details and permissions**, not contributed work product. A buyer wanting the reviewer relationships gets them; a buyer assuming they get assignable rights in reviewer contributions does not.

**4. The contributor confirmation, which is your best-drafted instrument, has been sent to nobody.**
20 issued, 0 sent, 0 confirmed. **The permissions a buyer most wants are the ones you have not collected.**

---

## 6. What I would fix, in order

| # | Fix | Effort | Why |
|---|---|---|---|
| 1 | **Store a terms version on every consent row** | an hour | Turns "he ticked something" into "he ticked v1.3 on this date". Closes gap 1 |
| 2 | **Send the contributor confirmations** | a day | Your best instrument, unused. Closes gap 4 |
| 3 | **Get written copyright assignment or licence from co-authors** | attorney | Consent is not assignment. Closes gap 2 |
| 4 | **Snapshot `privacy.html` to a dated, immutable copy** | 30 min | So today's terms are provable in a year |

---

## 7. The honest summary

**You are better insulated than you probably think on liability, and thinner than you think on ownership.**

The disclaimers are consistent and repeated in the right places. The data minimisation on record text is genuinely excellent and removes the worst-case exposure entirely. The two-decision consent split is well designed and well documented, and the separation is provable from the stored flags rather than resting on your word.

**What is missing is not protection from complaints. It is proof of rights.** Nobody has assigned you copyright, no terms version is stored against any tick, and the one instrument that captures continuing-use and transfer rights has never been sent.

**For a sale, gap 2 and gap 4 are the ones that cost money.**

---

## Outstanding

| Item | Status |
|---|---|
| Terms version on consent rows | **Not implemented.** Recommended, not built in this pass |
| Co-author copyright assignment | **`[REQUIRES USER INPUT]`.** Attorney work |
| Contributor confirmations sent | **0 of 20** |
| Dated snapshot of `privacy.html` | Does not exist |
