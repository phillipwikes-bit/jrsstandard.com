# SEC submission: Wikes & Hossain detection paper

## Send in this order
1. **Ubayet:** `EMAIL_TO_UBAYET_DRAFT.txt` with the manuscript. Wait for his yes and any edits.
2. **Lina** (after he agrees): `EMAIL_TO_LINA_DRAFT.txt` with **one attachment, `Wikes_Hossain_SEC_manuscript_DRAFT.docx`** (Word). This follows the Stacyann submission, where the owner sent only what Lina asked for (manuscript, preprint and a short message); this paper has no preprint.

## Held back unless the editorial office asks
- `Figure1.png` (separate 300 dpi file; the figure is already embedded in the manuscript)
- `SEC_cover_letter_form_DRAFT.docx` (names, positions, ORCIDs and roles only)
- `SEC_manuscript_ANONYMISED_DRAFT.docx` (for double-anonymous review)

## Still to fill in (owner)
- Nothing. By owner decision, the cover letter carries no contact information, dates or signatures. If the editorial office asks for a signed form, it can be added then.

## Risk register

| Risk | Status | What reduces it |
|---|---|---|
| Fit with the journal's socioeconomic scope | Reduced | Title follows the journal's convention; four of its own papers cited; agency-theory framing; socioeconomic implications section |
| Comparison study (null result) seen as hidden | Fixed | Now stated as "will be reported separately and in full, whatever its result" |
| Pre-registration not on a registry | Reduced | Claim limited to what git proves: fixed 6 July 2026, before key verification and any accuracy analysis. Thresholds confirmed present in those commits |
| Author identity (the earlier Springer issue) | Reduced | ORCIDs for both authors; Ubayet's own email in the form |
| Double-anonymous review | Ready | Anonymised copy built, with no author names, initials, ORCIDs or emails |
| Data not in a public repository | Accepted | Owner decision: available on request. The journal may ask |
| Author-built, clear-cut corpus; small reliability sample | Disclosed | Strengths and Limitations sections; framed as a first, bounded test |
| AI-assisted writing | Disclosed | AI statement in the manuscript |

## Rebuild
    python3 scripts/build_sec_detection_figure.py research/sec_detection_2026-10-26/Figure1.png
    python3 scripts/build_sec_detection_manuscript.py <SEC template.docx> research/sec_detection_2026-10-26/Wikes_Hossain_SEC_manuscript_DRAFT.docx
    python3 scripts/build_sec_detection_manuscript.py <SEC template.docx> research/sec_detection_2026-10-26/SEC_manuscript_ANONYMISED_DRAFT.docx --blind
    python3 scripts/fill_sec_cover_letter.py <blank SEC form.docx> research/sec_detection_2026-10-26/SEC_cover_letter_form_DRAFT.docx

The SEC template and the blank form live on branch `claude/tracker-2026-10-21` under `research/submissions/SEC_2026-10-21/`.
