# Candid Opris: completion message, certificate and recommendation

**RR-127, Arm B, Records Review Study. Verified complete 2026-08-11: 24 of 24 reads, all in one sitting, last read 18:23Z.**

---

## VERIFICATION RUN BEFORE ANY OF THIS WAS WRITTEN

```
python3 research/check_completion.py RR-127
B(B2)    RR-127   reads=24  COMPLETE (+24 today) last 2026-08-11T18:23Z
VERDICT: COMPLETE, recognition may be issued.        exit 0
```

## THE CONSTRAINT ON EVERY WORD BELOW

```
python3 research/check_completion.py RR-108
B(B1)    RR-108   reads=9   IN PROGRESS 9/24 last 2026-07-31T05:43Z      exit 1
```

Arm B is still blind. Nothing sent to Candid may name JRS, the review conditions, reconstructability, the verified key, or the fact that a comparison is running.

**There is a second reason for care here that does not apply to most reviewers.** Candid is in the **B2 arm**, which graded **without** the review conditions. They have never seen the method at all. A stray mention would not only break the blind for other recruits, it would hand this reviewer information they were specifically not given.

Pronouns are not stated in the recruitment record, so everything below uses they/them.

The certificate was generated through `build_certificate_armb.py`'s `neutral_body()` rather than written by hand, and the exact strings rendered onto it were checked: none of JRS, Justification, reconstruct, five conditions, verified key, comparison, Arm B or B2 appears. The recommendation was checked separately against the same list and is clean.

---

## 1. MESSAGE TO SEND

**Subject:** Your Records Review Study certificate

---

Hi Candid,

You finished all 24, and in one sitting. Thank you.

Your certificate is attached. It records that you completed the independent review of the full set with care, rigor and independent judgment, and that your AI governance and digital trust perspective contributed to the international reviewer panel.

I have also drafted a LinkedIn recommendation, the same one every reviewer on this panel receives. It is at the end of this message. I will not post it unless you tell me to, and I will change any line you want changed. If you would rather I did not post anything at all, that is a perfectly good answer and it changes nothing about the certificate.

Two other things, so you are not guessing.

**On being named.** Nothing appears anywhere with your name on it until you have seen the exact wording and said yes.

**On the results.** The full results go to every reviewer once the study closes, whichever way they come out.

Thank you again. Twenty four records without a break is a real piece of work, and the consistency held right across it.

Phillip Wikes
info@jrsstandard.com

---

### The recommendation, for you to approve or change

I had the pleasure of working with Candid Opris as an independent reviewer on the Records Review Study, an international panel of professionals evaluating administrative and workplace records. Candid completed the full 24-record review with rigor, care, and genuinely independent judgment.

Candid has spent two decades in AI and data governance and digital trust, as Founder and Managing Partner of Opris & Associates. That is a field where the work is rarely to decide whether something was done and almost always to establish whether the record of it would survive being examined by someone with no prior context. It is the discipline this study asks for, and it showed in the steadiness of their reviews across the full set and in a willingness to take each record on its own terms rather than settle into a pattern. Twenty four records in a single sitting is also a real piece of work, and the consistency did not drift across it.

Candid would be an asset to any organization working on AI governance, data governance, digital trust, or the standards by which consequential decisions are documented and reviewed. I recommend them without reservation.

Phillip Wikes

---

## 2. NOTE ON THE SIGNATURE

The recommendation is signed **Phillip Wikes** only, with no title. That is a blind protection, not a style choice: every Arm B guardrail carries the instruction never to sign "Creator, JRS" on a public recommendation, because RR-108 has not finished and other blind recruits and their networks can read it.

The message itself does carry `info@jrsstandard.com`, which is the address Candid was originally contacted from, so it is not new information to them.

---

## 3. WHAT WAS PRODUCED

| Item | File |
|---|---|
| Certificate | `research/Records_Review_Study_Certificate_Candid_Opris.pdf` |
| Message to send | `research/Message_Candid_Opris_Completion_2026-08-11.md` |
| LinkedIn recommendation, standard format | `research/LinkedIn_Recommendation_Candid_Opris.md` |
| Certificate registry entry | Added to `research/build_certificate_armb.py` so it regenerates with the rest |

Certificate reads: **Certificate of Completion · Candid Opris · August 11, 2026**. The date is the UTC date of the last read, which is the record it rests on.

The recommendation was checked against the house format used for the other 21 reviewers on nine structural points and passed all nine: three body paragraphs and a bare signature, the standard opening sentence, the international-panel phrasing, the full-24-record statement, the "would be an asset to any organization" close, "I recommend them without reservation", no long dashes, and they/them throughout with no gendered pronoun anywhere.

---

## 4. OPEN, PENDING THEIR ANSWER

1. **Permission to post the recommendation.** Not posted. Do not post without an explicit yes.
2. **Whether they want to be named on the panel**, and in what exact wording.
3. **Pronouns.** Not stated in the record. Everything uses they/them, which is correct until they say otherwise. Worth asking in the same message if you are comfortable doing so.
4. **Honor roster.** The roster in `api/honor.js` holds 34 entries and is now **two short** of the completers: neither Alexandria Davis (RR-117) nor Candid Opris (RR-127) has an entry. Adding one means writing a citation and issuing a link, which is a recognition decision rather than a count correction, so it is left for you.
