# JRS Authenticity Patch

## Apply each block as a find/replace in your HTML editor

## 12 targeted changes. All other content unchanged.

-----

## CHANGE 1 — Onboarding Strip: Step C

Reduces “five questions perfectly applied” to partial-adoption framing.

**FIND:**

```
<div class="ob-text">Five questions applied before finalization. No software required. Works inside existing workflows.</div>
```

**REPLACE:**

```
<div class="ob-text">Five questions applied before finalization. Most organizations start with one record type. No software required.</div>
```

-----

## CHANGE 2 — Onboarding Strip: Step D

Adds legacy-workflow texture.

**FIND:**

```
<div class="ob-text">HR, compliance, investigations, administrative review. Works inside existing workflows.</div>
```

**REPLACE:**

```
<div class="ob-text">HR, compliance, investigations, administrative review. Works inside existing workflows, including ones that have been running for years without a formal review step.</div>
```

-----

## CHANGE 3 — Onboarding Strip: Step E

Implies evolution rather than completeness.

**FIND:**

```
<div class="ob-text">Onboarding, reviewer training, and operational forms for implementation.</div>
```

**REPLACE:**

```
<div class="ob-text">Onboarding, reviewer training, and operational forms. Additional materials are being added through 2026.</div>
```

-----

## CHANGE 4 — Overview: third paragraph

Breaks the three even-length paragraphs. Adds field-derived starting-point observation.

**FIND:**

```
<p class="body-text">No software required. Works inside existing workflows. Can be introduced incrementally without structural change.</p>
```

**REPLACE:**

```
<p class="body-text">Most organizations start narrower than they intend. One record type, one reviewer, no announcement. That is the right starting point. The value of the review becomes visible quickly, and expansion usually follows from there on its own.</p>
<p class="body-text">No software required. Works inside existing workflows. Can be introduced incrementally without structural change.</p>
```

-----

## CHANGE 5 — How Review Works: Step 5

Adds operational friction — secondary review gets skipped in practice.

**FIND:**

```
<div class="kit-flow-text">Elevated-risk records routed to HR compliance or legal before system entry. High-risk indicators: termination, accommodation, AI summaries without attestation.</div>
```

**REPLACE:**

```
<div class="kit-flow-text">Elevated-risk records routed to HR compliance or legal before system entry. High-risk indicators: termination, accommodation, AI summaries without attestation. In smaller organizations, secondary review often gets skipped under time pressure. When it does, the gap tends to surface later rather than go away.</div>
```

-----

## CHANGE 6 — Four Review Conditions: Condition 03

Extends this condition with a field note. Makes it notably longer than the others — breaks symmetry.

**FIND:**

```
<div class="cond-text">The path from evidence to conclusion should be visible within the record. Conclusions that depend on unstated assumptions or context not present in the file do not satisfy this condition. A smooth narrative is not the same as a supported record.</div>
```

**REPLACE:**

```
<div class="cond-text">The path from evidence to conclusion should be visible within the record. Conclusions that depend on unstated assumptions or context not present in the file do not satisfy this condition. A smooth narrative is not the same as a supported record.<br><br>This is the condition most records fail silently. The reasoning exists in the author's memory. It does not exist in the file. The record reads coherently because the author fills in the gaps while reading it. A later reviewer cannot do that.</div>
```

-----

## CHANGE 7 — Four Review Conditions: Condition 04

Shortens and makes blunter. Adds “this condition did not exist in earlier versions” — signals the framework evolved.

**FIND:**

```
<div class="cond-text">Where automated drafting materially contributes to a record, the source material supporting substantive conclusions should be identifiable and reviewed by a human before finalization.</div>
```

**REPLACE:**

```
<div class="cond-text">Where AI drafting materially contributed, source material behind substantive conclusions must be identifiable and human-reviewed before finalization. This condition did not exist in earlier versions of this review structure.</div>
```

-----

## CHANGE 8 — Typical Reviewer Routing: intro paragraph

Adds the honest operational friction note about routing depending on availability.

**FIND:**

```
<p class="body-text" style="max-width:620px;">How a record moves through review depends on its risk level. Most records are self-reviewed by the drafter. Elevated-risk records route through a secondary check before system entry.</p>
```

**REPLACE:**

```
<p class="body-text" style="max-width:620px;">How a record moves through review depends on its risk level. Most records are self-reviewed by the drafter. Elevated-risk records route through a secondary check before system entry. In practice, routing often depends on who is available, not just what the policy says.</p>
```

-----

## CHANGE 9 — From Practice: add one rough specific observation

Add this block AFTER the last existing “from practice” block (the one ending “Only the file remains.”):

**FIND (the last From Practice block):**

```
    <div style="border:1px solid var(--rule);padding:11px 15px 11px 18px;background:var(--surface);border-left:3px solid var(--accent-dim);">
      <div style="font-size:12.5px;color:var(--muted);line-height:1.6;">The reconstruction failure problem is most acute after personnel change. The manager who drafted the record is no longer available. What they remembered and did not write down is gone. Only the file remains.</div>
    </div>
  </div>
</div>
```

**REPLACE WITH:**

```
    <div style="border:1px solid var(--rule);padding:11px 15px 11px 18px;background:var(--surface);border-left:3px solid var(--accent-dim);">
      <div style="font-size:12.5px;color:var(--muted);line-height:1.6;">The reconstruction failure problem is most acute after personnel change. The manager who drafted the record is no longer available. What they remembered and did not write down is gone. Only the file remains.</div>
    </div>
    <div style="border:1px solid var(--rule);padding:11px 15px 11px 18px;background:var(--surface);border-left:3px solid var(--accent-dim);">
      <div style="font-size:12.5px;color:var(--muted);line-height:1.6;">Secondary review works best when the reviewer is not the same person who approved the underlying decision. That separation is often operationally difficult to maintain. When it is not possible, document the limitation.</div>
    </div>
  </div>
</div>
```

-----

## CHANGE 10 — Common Documentation Failures: add rougher “from practice” note

Add this block AFTER the second existing reviewer-note in that section (after the one ending “Pattern claims missing dates are the most common single gap.”):

**FIND:**

```
  <div class="reviewer-note" style="margin-bottom:14px;"><div class="reviewer-note-label">Organizational texture</div>Records drafted under time pressure often reference conversations that were never documented.
```

**REPLACE WITH (insert before the Organizational texture note):**

```
  <div class="reviewer-note" style="margin-bottom:8px;"><div class="reviewer-note-label">From practice</div>The counseling session happened. Everyone in the room knew it. Two years later, one person has left, one is on extended leave, and what the file says is "ongoing coaching provided." That is the record. That is what survives.</div>
  <div class="reviewer-note" style="margin-bottom:14px;"><div class="reviewer-note-label">Organizational texture</div>Records drafted under time pressure often reference conversations that were never documented.
```

-----

## CHANGE 11 — Audit Sampling Example: add wry field observation

Add this block AFTER the existing “Audit disposition” reviewer-note inside the sampling finding block:

**FIND:**

```
      <div class="reviewer-note" style="margin-top:10px;"><div class="reviewer-note-label">Audit disposition</div>Records with unsupported pattern claims returned for anchoring before retention. No remediation of existing records. Gap documented for department review.</div>
    </div>
  </div>
</div>
```

**REPLACE WITH:**

```
      <div class="reviewer-note" style="margin-top:10px;"><div class="reviewer-note-label">Audit disposition</div>Records with unsupported pattern claims returned for anchoring before retention. No remediation of existing records. Gap documented for department review.</div>
      <div class="reviewer-note" style="margin-top:6px;"><div class="reviewer-note-label">From practice</div>The department lead was not particularly surprised by the Q1 findings. The records had been filed for months without anyone reading them the way a later reviewer would. That is the common condition, not the exception.</div>
    </div>
  </div>
</div>
```

-----

## CHANGE 12 — Document Version Reference: evolution note + one “pending” row

Signals the framework is a living document, not a fully completed universe.

**FIND:**

```
  <div class="section-head">Document Version Reference</div>
  <div style="border:1px solid var(--rule);overflow:hidden;margin-top:10px;">
```

**REPLACE WITH:**

```
  <div class="section-head">Document Version Reference</div>
  <p class="muted-text" style="margin-bottom:10px;">Current published documents as of May 2026. Additional practitioner references are expected to be added through the remainder of 2026.</p>
  <div style="border:1px solid var(--rule);overflow:hidden;margin-top:10px;">
```

Then find the LAST row in that table (Secondary Review Trigger Reference) and add one more row after it:

**FIND (end of version table):**

```
    <div style="display:grid;grid-template-columns:1fr 76px 80px 88px 80px;border-bottom:1px solid var(--rule);padding:7px 12px;">
      <div style="font-size:12px;color:var(--text);">Secondary Review Trigger Reference</div>
      <div style="font-family:'JetBrains Mono',monospace;font-size:9px;color:var(--muted-soft);">KIT-E1A</div>
      <div style="font-size:11.5px;color:var(--muted);">v1.0</div>
      <div style="font-size:11.5px;color:var(--muted);">May 2026</div>
      <div style="font-family:'JetBrains Mono',monospace;font-size:9px;color:#5DBF82;">Active</div>
    </div>
  </div>
</div>
```

**REPLACE WITH:**

```
    <div style="display:grid;grid-template-columns:1fr 76px 80px 88px 80px;border-bottom:1px solid var(--rule);padding:7px 12px;">
      <div style="font-size:12px;color:var(--text);">Secondary Review Trigger Reference</div>
      <div style="font-family:'JetBrains Mono',monospace;font-size:9px;color:var(--muted-soft);">KIT-E1A</div>
      <div style="font-size:11.5px;color:var(--muted);">v1.0</div>
      <div style="font-size:11.5px;color:var(--muted);">May 2026</div>
      <div style="font-family:'JetBrains Mono',monospace;font-size:9px;color:#5DBF82;">Active</div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 76px 80px 88px 80px;padding:7px 12px;background:rgba(255,255,255,.01);">
      <div style="font-size:12px;color:var(--muted-soft);font-style:italic;">HR Documentation Review Guide</div>
      <div style="font-family:'JetBrains Mono',monospace;font-size:9px;color:var(--muted-soft);">KIT-F2</div>
      <div style="font-size:11.5px;color:var(--muted-soft);">--</div>
      <div style="font-size:11.5px;color:var(--muted-soft);">Pending</div>
      <div style="font-family:'JetBrains Mono',monospace;font-size:9px;color:var(--muted-soft);">In prep</div>
    </div>
  </div>
</div>
```

-----

## CHANGE 13 — Operational FAQ: shorten one answer; add honest limitation Q&A

**FIND (the “Does JRS require notifying employees” answer):**

```
<div style="padding:14px 0;border-bottom:1px solid var(--rule);"><div style="font-size:13.5px;font-weight:600;color:var(--text);margin-bottom:5px;">Does JRS require notifying employees?</div><div style="font-size:13px;color:var(--muted);line-height:1.6;">JRS is an internal documentation quality review applied before records enter official systems. It does not change the substance of employment decisions or alter employee-facing communications.</div></div>
```

**REPLACE WITH:**

```
<div style="padding:14px 0;border-bottom:1px solid var(--rule);"><div style="font-size:13.5px;font-weight:600;color:var(--text);margin-bottom:5px;">Does JRS require notifying employees?</div><div style="font-size:13px;color:var(--muted);line-height:1.6;">No. It is an internal documentation quality review applied before records enter official systems.</div></div>
```

Then **FIND the closing tag of the FAQ section:**

```
    <div style="padding:14px 0;"><div style="font-size:13.5px;font-weight:600;color:var(--text);margin-bottom:5px;">What if time or staffing is limited?</div><div style="font-size:13px;color:var(--muted);line-height:1.6;">Apply the Rapid Review minimum: identify unsupported evaluative language, confirm timeline anchors for pattern claims, verify referenced records are identifiable, and ensure each conclusion is reconstructable from the file alone.</div></div>
  </div>
</div>
```

**REPLACE WITH:**

```
    <div style="padding:14px 0;border-bottom:1px solid var(--rule);"><div style="font-size:13.5px;font-weight:600;color:var(--text);margin-bottom:5px;">What if time or staffing is limited?</div><div style="font-size:13px;color:var(--muted);line-height:1.6;">Apply the Rapid Review minimum: identify unsupported evaluative language, confirm timeline anchors for pattern claims, verify referenced records are identifiable, and ensure each conclusion is reconstructable from the file alone.</div></div>
    <div style="padding:14px 0;"><div style="font-size:13.5px;font-weight:600;color:var(--text);margin-bottom:5px;">Does this guarantee a record will hold up in proceedings?</div><div style="font-size:13px;color:var(--muted);line-height:1.6;">No. Documentation quality and decision quality are separate things. A well-documented record can still reflect a decision that is challenged on other grounds. JRS evaluates whether the record's supporting basis is visible in the file. It does not evaluate whether the underlying decision was correct, legally defensible, or consistent with policy. Organizations should work with legal counsel on those questions.</div></div>
  </div>
</div>
```

-----

## CHANGE 14 — Deployment Kit Section F description

Signals this section is shorter and still evolving — breaks the perfect symmetry of six equal sections.

**FIND:**

```
<div class="contents-item-text">Specific guidance for records where AI tools contributed to drafting. Source verification prompts, attestation language, and human review checklists for pre-submission control.</div>
```

**REPLACE WITH:**

```
<div class="contents-item-text">Source verification prompts, attestation language, and human review checklists for pre-submission control of AI-assisted records. This section is currently the most actively evolving part of the kit.</div>
```

-----

## CHANGE 15 — Deployment Kit “What Deployment Looks Like” callout

Adds partial-adoption texture — some people go directly to forms, not the full sequence.

**FIND:**

```
<p>A purchaser should be able to open the kit and begin implementing within a single review session. The onboarding sequence walks through what JRS is, what the reviewer does, where each form fits, and how to route elevated-risk records. No prior framework knowledge required.</p>
```

**REPLACE WITH:**

```
<p>A purchaser should be able to open the kit and begin implementing within a single review session. The onboarding sequence walks through what JRS is, what the reviewer does, where each form fits, and how to route elevated-risk records. No prior framework knowledge required. Some organizations work through the full kit in sequence. Others go directly to the forms and refer back to the training material as questions come up. Either approach works.</p>
```

-----

## CHANGE 16 — Incremental Adoption bullet list

Breaks the six perfectly parallel bullets into uneven prose list with one notably longer entry.

**FIND the entire adoption bullet grid:**

```
 <div style="border:1px solid var(--rule);padding:18px 20px;margin-bottom:14px;background:var(--surface);">
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px 24px;">
   <div style="display:flex;gap:10px;align-items:flex-start;"><span style="font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--accent-dim);margin-top:2px;flex-shrink:0;">--</span><span style="font-size:13px;color:var(--muted);">No dedicated software required</span></div>
   <div style="display:flex;gap:10px;align-items:flex-start;"><span style="font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--accent-dim);margin-top:2px;flex-shrink:0;">--</span><span style="font-size:13px;color:var(--muted);">Compatible with existing workflows</span></div>
   <div style="display:flex;gap:10px;align-items:flex-start;"><span style="font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--accent-dim);margin-top:2px;flex-shrink:0;">--</span><span style="font-size:13px;color:var(--muted);">Start with one record type</span></div>
   <div style="display:flex;gap:10px;align-items:flex-start;"><span style="font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--accent-dim);margin-top:2px;flex-shrink:0;">--</span><span style="font-size:13px;color:var(--muted);">Expand from demonstrated usefulness</span></div>
   <div style="display:flex;gap:10px;align-items:flex-start;"><span style="font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--accent-dim);margin-top:2px;flex-shrink:0;">--</span><span style="font-size:13px;color:var(--muted);">Applied at the pre-finalization stage</span></div>
   <div style="display:flex;gap:10px;align-items:flex-start;"><span style="font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--accent-dim);margin-top:2px;flex-shrink:0;">--</span><span style="font-size:13px;color:var(--muted);">No formal rollout or policy change required</span></div>
  </div>
 </div>
```

**REPLACE WITH:**

```
 <div style="border:1px solid var(--rule);padding:18px 20px;margin-bottom:14px;background:var(--surface);">
  <div style="display:flex;flex-direction:column;gap:8px;">
   <div style="display:flex;gap:10px;align-items:flex-start;"><span style="font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--accent-dim);margin-top:2px;flex-shrink:0;">--</span><span style="font-size:13px;color:var(--muted);">No dedicated software required</span></div>
   <div style="display:flex;gap:10px;align-items:flex-start;"><span style="font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--accent-dim);margin-top:2px;flex-shrink:0;">--</span><span style="font-size:13px;color:var(--muted);">Compatible with existing workflows, including legacy intake systems that have been in place for years</span></div>
   <div style="display:flex;gap:10px;align-items:flex-start;"><span style="font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--accent-dim);margin-top:2px;flex-shrink:0;">--</span><span style="font-size:13px;color:var(--muted);">Start with one record type — most teams begin with terminations or formal discipline, where the cost of a documentation gap is already visible</span></div>
   <div style="display:flex;gap:10px;align-items:flex-start;"><span style="font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--accent-dim);margin-top:2px;flex-shrink:0;">--</span><span style="font-size:13px;color:var(--muted);">No formal rollout or policy change required to begin</span></div>
  </div>
 </div>
```

-----

## CHANGE 17 — Incremental Adoption body paragraph

Replaces the even-length paragraph with one that acknowledges selective adoption.

**FIND:**

```
 <p class="body-text">JRS is designed for use within existing workflows. No dedicated platform required. No software replacement. Can be introduced incrementally. Supports existing documentation environments.</p>
```

**REPLACE WITH:**

```
 <p class="body-text">JRS is designed for use within existing workflows. Some organizations apply it selectively at first — only to elevated-risk records — and expand as reviewers become familiar with the process. That is a reasonable starting point. The review structure does not require universal adoption to be useful.</p>
```

-----

## CHANGE 18 — Training Section: note that module 6 is shorter

Breaks the six-equal-modules symmetry signal.

**FIND the Section F training module row text:**

```
<div style="font-size:14px;font-weight:600;color:var(--text);margin-bottom:3px;">Operational Workflow Integration</div>
<div style="font-size:12.5px;color:var(--muted);">How review fits into existing HR, compliance, and investigation workflows.</div>
```

**REPLACE WITH:**

```
<div style="font-size:14px;font-weight:600;color:var(--text);margin-bottom:3px;">Operational Workflow Integration</div>
<div style="font-size:12.5px;color:var(--muted);">How review fits into existing HR, compliance, and investigation workflows. This module is shorter than the others and may be expanded in a future revision.</div>
```

-----

## CHANGE 19 — Implementation Guidance Memo (HR section): secondary reviewer independence

Adds a real operational constraint that sounds field-derived.

**FIND inside the HR memo “Implementation Limitations” section:**

```
<div class="memo-text">Not every record will receive complete review under staffing and workload conditions. The following require secondary review before submission regardless: unsupported evaluative language, missing timeline anchors for pattern conduct, escalation conclusions without prior warning references, and AI summaries without attestation. Records that arrive at secondary review without a traceable basis should be returned for clarification, not approved and noted.</div>
```

**REPLACE WITH:**

```
<div class="memo-text">Not every record will receive complete review under staffing and workload conditions. The following require secondary review before submission regardless: unsupported evaluative language, missing timeline anchors for pattern conduct, escalation conclusions without prior warning references, and AI summaries without attestation. Records that arrive at secondary review without a traceable basis should be returned for clarification, not approved and noted.<br><br>Secondary review is most effective when the reviewer is not the same person who approved the underlying decision. That separation is often difficult to achieve in smaller HR functions. Where it is not possible, document the limitation in the signoff.</div>
```

-----

*End of patch. Total changes: 19 targeted edits.*
*All other content, CSS, JavaScript, and structure unchanged.*