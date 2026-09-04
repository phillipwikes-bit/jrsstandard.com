# Submitting to Corporate Compliance Insights: the full procedure

**Sources, retrieved 2026-08-19.** Everything below is from CCI's own pages, not from
recollection.

- `https://www.corporatecomplianceinsights.com/writing-for-cci/`
- `https://www.corporatecomplianceinsights.com/wp-content/uploads/2026/05/Writer-guidelines_051526.pdf`
  (their contributor-guidelines PDF, last updated 05/15/26; text decoded from the file's
  embedded fonts)
- `https://www.corporatecomplianceinsights.com/vendor-authors/` (vendor policy, does not
  apply to us; see step 0)

---

## Step 0. Confirm you are a contributor, not a vendor

CCI runs two separate intake tracks and putting a piece in the wrong one gets it treated
as a press release.

| | Contributor track | Vendor track |
|---|---|---|
| Who | Practitioners writing thought leadership | Software companies, technology providers, consultancies |
| What runs | Bylined articles | Vendor news, funding rounds, product launches |
| This article | **Yes, this track** | No |

**Risk to manage:** the article names the Justification Review Standard, which Phillip
developed. If an editor reads that as a product placement, the piece drops into the vendor
track. Three things already in the submission draft prevent that, and none of them should
be edited out:

1. The interest is disclosed in the standfirst: "Phillip Wikes developed the Justification
   Review Standard described below."
2. It is disclosed again in the body: "developed by one of the authors."
3. The neutrality line: "The specific instrument matters less than the discipline. Any
   review that forces those questions before a record is finalized addresses the same
   failure."

There is no link to jrsstandard.com anywhere in the piece, which is deliberate. CCI's
formatting rules say **"No promotional links to employer sites."** Do not add one, and do
not accept an offer to add one.

---

## Step 1. Confirm the article meets every stated requirement

Run the check. It is not advisory; it encodes CCI's published numbers.

```
python3 scripts/apply_cci_publication_pass.py --check
```

Expect **17 checks, 0 failed**. What each requirement is and where this article stands:

| CCI requirement (their words) | This article |
|---|---|
| Length: "1,000-1,200 words minimum (preferred)" | 1,627 words. Clears the floor |
| Style: "AP style, no Oxford comma" | 21 serial commas removed |
| Style: "in-text hyperlinks for citations, no footnotes" | 9 embedded links, 0 footnotes |
| "Use 2-3 subheadings per 1,000 words" | 4 subheadings over 1,627 words = 2.5 per 1,000 |
| "Main headlines in title case; subheadings in sentence case" | Conformed |
| "No promotional links to employer sites" | 0 present |
| "Maximum of two per article" (co-authors) | 2 |
| "Submit brief bio and high-resolution head-and-shoulders photo" | Bios in the file. **Photos are not in this repository** |

---

## Step 2. Assemble the package

Four items. Three exist; one does not.

1. **The article.** `research/Evidentiary_Deficit_Article_CCI_SUBMISSION_2026-08-19.docx`.
   Word format, real hyperlink relationships, 4 sentence-case subheadings, bios at the
   foot.
2. **Two short bios.** Already at the end of the article. If CCI wants them separately,
   lift them verbatim rather than rewriting, so the file and the email cannot disagree.
3. **Two headshots. THESE DO NOT EXIST IN THE REPOSITORY AND ARE A HARD BLOCKER.** CCI's
   guidelines say "high-resolution head-and-shoulders photo" for new authors. Both authors
   need to supply one. Get Hekim's before you send, or the submission is incomplete on
   arrival and sits waiting on an email.
4. **The change log**, `research/Evidentiary_Deficit_Article_CCI_SUBMISSION_LOG_2026-08-19.md`.
   **Do not send this to CCI.** It is internal. It exists so Hekim can see exactly what
   changed and so you can answer an editor's question about a specific line.

---

## Step 3. Send it

**To:** `editor@corporatecomplianceinsights.com`

That is the address CCI publishes for both editorial contact and submissions. There is no
submission form.

**One judgment call worth making deliberately.** CCI's page says: "To explore contribution
opportunities, please contact our editorial team with a brief description of your
background and areas of expertise. We'll be happy to discuss our editorial calendar and
mission." That reads as a pitch-first workflow for new contributors.

You have a finished, conforming, co-authored article. Sending the full draft with a short
pitch paragraph on top does both jobs in one email and does not waste an exchange. Attach
the .docx rather than pasting the body, so the hyperlinks survive.

**Subject line:**

```
Submission: The Evidentiary Deficit in AI-Assisted Record-Keeping (co-authored, 1,627 words)
```

**Body:**

```
Dear CCI editorial team,

I am submitting a co-authored article for your consideration: "The Evidentiary Deficit in
AI-Assisted Record-Keeping," 1,627 words, attached in Word with in-text hyperlinks.

The piece argues that AI-assisted drafting is quietly breaking the evidentiary link between
a consequential record and the reasoning behind it, and that the exposure shows up in
discovery, in pretext analysis and in GDPR accountability well before any AI-specific rule
applies. It sets out nine practitioner controls for HR, compliance, investigations and
audit teams.

My co-author is Hekim Colpan, an AI Governance and Compliance Manager and ISO/IEC 42001
auditor based in Germany, who writes the European governance section. I spent more than a
decade as a Lead Civil Rights Officer at the Maryland Commission on Civil Rights evaluating
discrimination complaints under federal HUD and EEOC frameworks, and I developed the
Justification Review Standard the article uses as one example among others. That interest is
disclosed in the standfirst and again in the body, and the article carries no link to it.

The article is original and unpublished, and we are not submitting it elsewhere while you
consider it.

Short bios and head-and-shoulders photographs for both authors are attached.

Thank you for your time.

Best regards,
Phillip Wikes
info@jrsstandard.com
```

**Attach:** the .docx, both headshots. Nothing else.

---

## Step 4. What happens next, per CCI's published process

Their guidelines list the stages:

1. Editorial review and potential revision requests
2. Copy editing and fact-checking
3. Artwork creation and sourcing
4. Publication and social media distribution
5. Newsletter inclusion, which they size at **12,000+ GRC professionals**

**Rights:** "Republication permitted with link to original." So after it runs you may
repost it on LinkedIn or elsewhere provided you link back to the CCI version. Do that
rather than reposting the text cold.

**No response time is published.** If nothing arrives in three weeks, send one short
follow-up on the same thread. One.

---

## Step 5. Prepare for the fact-check, because there will be one

Copy editing and fact-checking is an explicit stage. Three items will draw a query. Have
the answer ready rather than composing it under a deadline.

**1. Regulation (EU) 2026/1744 and the two dates.** Verified 2026-08-19 against
independent reporting: the Digital Omnibus on AI, published in the Official Journal
24 July 2026, in force 27 July 2026; Annex III stand-alone high-risk systems move to
2 December 2027; Annex I product-embedded systems move to 2 August 2028. The article now
carries the EUR-Lex ELI in-text. **This was verified from secondary sources, not from the
Official Journal itself.** Click the EUR-Lex link once from a browser before you send.

**2. McDonnell Douglas.** An editor may try to tighten "The Court did not hold that
documentation quality determines the outcome" into something punchier. **Refuse that
edit.** The sentence exists because the earlier draft credited the case with a
documentation rule it never announced. The holding and the practical pretext observation
have to stay separate.

**3. Disparate treatment and disparate impact.** Same posture. "Distinct theories with
different elements and proof structures, and recurring language does not by itself
establish either" is load-bearing. An editor cutting it for length reintroduces a legal
error.

A useful line for any of the three: *"That qualifier is deliberate; without it the sentence
overstates the law. Happy to shorten elsewhere."*

---

## Step 6. The AI disclosure question

CCI's stated policy, verbatim:

> "While CCI does not flatly prohibit contributors from using AI tools to generate
> material, our editorial team believes it is inappropriate and unnecessary for
> subject-matter experts, and we reserve the right to reject contributions that our team
> interprets as being machine-generated."

Two consequences.

**First, rejection can be on interpretation alone.** No proof is required. That is why the
submission pass removed 15 specific constructions: triadic anaphora, "Consider a manager
who," the "not X but something more Y:" colon-reveal used twice in one section, the
five-member semicolon series, the "What has changed... What has not changed" closer, and
the rest. Each one is listed with its reason in the change log.

**Second, do not volunteer a disclosure that is not asked for.** The policy addresses
machine-generated material. This article is two subject-matter experts' argument, drafted
and revised by them. If an editor asks directly, answer directly and briefly. Do not
pre-emptively raise it, and do not overclaim in either direction.

---

## Do not

- Do not paste the article body into the email instead of attaching it. The hyperlinks are
  a stated requirement and inline pasting mangles them.
- Do not add a link to jrsstandard.com, a LinkedIn profile or an employer site. Their rules
  prohibit it and it converts the piece into vendor content.
- Do not send the change log to CCI.
- Do not submit elsewhere while CCI is considering it. Their exclusivity line did not
  decode from the PDF, so the safe assumption is that they expect exclusivity during
  review, and the email above states it.
- Do not send before Hekim's final read. He asked for one and the article changed
  structurally since his last sight of it.
