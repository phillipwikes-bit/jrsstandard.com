# Contributor Register and Third-Party Content Register

## Part 1: Contributor Register

**Contribution evidence only.** No entry converts to a rights conveyance, and none is
described as one.

| # | Contributor | Contribution evidenced | Evidence source | Agreement located | Classification |
|---|---|---|---|---|---|
| C-01 | Phillip Wikes | Sole human commit author, 2026-04-14 to 2026-09-07, 293 commits across two git identities | Git history | **None** | **EVIDENCE OF AUTHORSHIP OR CREATION** |
| C-02 | Second author (AI and Ethics manuscript) | Designed the reliability and validation framework: reference-panel design, chance-corrected agreement statistics, pre-registered decision floors and analysis plan | Manuscript author-contributions statement | **None** | **CONTRIBUTOR EVIDENCE** · **HIGH PRIORITY** |
| C-03 | Section 2.1 contributor | Originated the argument developed in Section 2.1, credited with permission | Manuscript acknowledgements; withdrawal register | **None** | **CONTRIBUTOR EVIDENCE** · **POSSIBLE OWNERSHIP ISSUE** · **HIGHEST PRIORITY** |
| C-04 | Detection panel, 16 experts | Read the 24-record corpus cold and returned 384 graded judgments | Manuscript; study data | Tick-box consent only | **CONTRIBUTOR EVIDENCE** |
| C-05 | Reliability study, 25 raters | Recorded labels on the shared record set | Manuscript; study data | Tick-box consent only | **CONTRIBUTOR EVIDENCE** |
| C-06 | Comparison study, 20 experts | Completed the corpus under the Section 5 design | Manuscript; study data | Tick-box consent only | **CONTRIBUTOR EVIDENCE** |
| C-07 | AI assistance (`Claude` commit identity) | **1,737 of 2,031 commits (85.5%); 1,100 explicit co-authorship trailers; 100% of surviving lines in the sampled API modules, OpenAPI, Codebook page and training** | Git history and blame | n/a | **POSSIBLE OWNERSHIP ISSUE**. See register Section 5 |

**Totals.** 58 distinct human participants across three studies; 32 elected to be named.
**Zero rights agreements located for any of them.**

## Part 2: Third-Party Content Register

| # | Item | Type | Where used | Rights position located | Classification |
|---|---|---|---|---|---|
| T-01 | Bodoni Moda, JetBrains Mono, Inter | Fonts, served by Google | 104 `fonts.googleapis.com` + 51 `fonts.gstatic.com` references across public HTML | Google Fonts terms not restated in-repo | **THIRD-PARTY CONTENT** |
| T-02 | Google Tag Manager / GA4 (`G-NVYHJ7BJ92`) | Analytics service | 43 references | No DPA located | **THIRD-PARTY CONTENT** |
| T-03 | Anthropic Messages API | Model inference service | `api/v1/review-engine.js`, `api/review.js` | No agreement located in-repo | **THIRD-PARTY CONTENT** |
| T-04 | Supabase | Data storage and REST | 22 references to the project host | No DPA located | **THIRD-PARTY CONTENT** |
| T-05 | Vercel | Hosting and edge execution | `vercel.json` | No agreement located in-repo | **THIRD-PARTY CONTENT** |
| T-06 | **Formspree** (`formspree.io/f/mreddwdg`) | **Third-party form processor** | **`pilot.html`** | No agreement located | **THIRD-PARTY CONTENT. NEW in this pass** |
| T-07 | schema.org | Vocabulary reference | 2 references | Public vocabulary | **THIRD-PARTY CONTENT**, non-material |
| T-08 | npm / declared dependency tree | Software | **Absent: no `package.json` or lockfile** | n/a | **VERIFIED ABSENT**. Materially reduces third-party software risk |

**The absence at T-08 is a genuine strength** and is recorded as such: there is no
transitive open-source dependency tree to audit, licence-check, or inherit obligations
from. Very few projects of this size can say that.

**T-06 is a material shift against the baseline.** The baseline records three
processors; there are four. The finding is broadened, not corrected.
