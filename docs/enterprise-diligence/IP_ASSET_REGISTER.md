# IP Asset Register

**Ownership status uses only: Verified, owner assertion, disputed, or unknown.**
Authorship and a copyright notice are **not** evidence of chain of title. Transferability
is assessed separately from ownership.

| Asset | Type | Creator (claimed) | Creation | Version | Location | Contributors | Ownership status | Assignment evidence | Third-party material | Public/private | Transferability | Diligence risk |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| JRS Standard (methodology) | Document / trade secret | Phillip Wikes | 2026 | see `JRS-Standard.pdf` | `JRS-Standard.pdf`, `jrsstandard.html` | Sole author asserted | **Owner assertion** | **OWNER INPUT REQUIRED** | None identified | Public | **Unknown** | Medium |
| Decision Reconstruction Risk (construct) | Copyright / trade secret | Phillip Wikes | 2026 | n/a | Manuscript, public pages | Section 2.1 argument credited to a named contributor | **Owner assertion** | **OWNER INPUT REQUIRED** | None identified | Public | **Unknown** | **Medium**: a contributed argument shaped panel design. **DRR itself predates the credit by six weeks** and is the owner's stated origination |
| Codebook | Document | Phillip Wikes | 2026 | **1.0** | `codebook.html` | Sole author asserted | **Owner assertion** | **OWNER INPUT REQUIRED** | None identified | Public | **Unknown** | Medium |
| Review Engine logic | Software | Phillip Wikes | 2026 | `engine_version` in payload | `api/v1/review-engine.js` | Unknown | **Owner assertion** | **OWNER INPUT REQUIRED** | Anthropic model API (service, not embedded IP) | Private source, public contract | **Unknown** | Medium |
| API and OpenAPI specification | Software / document | Phillip Wikes | 2026 | **Conflicting: 1.0.0 and 0.1.0-validation** | `openapi.json`, `openapi-review-engine.json` | Unknown | **Owner assertion** | **OWNER INPUT REQUIRED** | None identified | Public | **Unknown** | Medium: version conflict must be resolved before hand-over |
| Field guides (EEO, Fair Housing, International) | Document | Phillip Wikes | 2026 | see files | repository PDFs | Unknown | **Owner assertion** | **OWNER INPUT REQUIRED** | None identified | Public | **Unknown** | Low |
| Training modules | Document / software | Phillip Wikes | 2026 | n/a | `training.html` | Unknown | **Owner assertion** | **OWNER INPUT REQUIRED** | None identified | Public | **Unknown** | Low |
| Simulation library | Document / software | Phillip Wikes | 2026 | n/a | `simulations.html` | Unknown | **Owner assertion** | **OWNER INPUT REQUIRED** | None identified | Public | **Unknown** | Low |
| Research instruments | Document | Phillip Wikes and co-author | 2026 | n/a | `research/` | Second author designed the reliability and validation framework | **Owner assertion** | **OWNER INPUT REQUIRED** | None identified | Private | **Restricted**: co-authored | **High** |
| Datasets and study materials | Dataset | Programme | 2026 | data lock 2026-08-15 | Supabase; `research/` | 58 distinct participants across three studies | **Owner assertion** | **OWNER INPUT REQUIRED** | Participant contributions under consent | Private | **Restricted** | **High**: consent is not assignment |
| Authored publications | Copyright | Wikes and co-authors | 2026 | n/a | `research/` | Multiple co-authors across manuscripts | **Owner assertion** | **OWNER INPUT REQUIRED** | Publisher rights on acceptance | Mixed | **Restricted**: co-authored, and publisher terms may attach | **High** |
| Trademarks and names (JRS, DRR) | Trademark | Phillip Wikes | n/a | n/a | `TRADEMARK_FILING_DOSSIER_JRS_DRR.md` | n/a | **Unknown** | **No filing evidence located** | None identified | Public use | **Unknown** | **High** |
| Source code (site and API) | Software | Phillip Wikes | 2026 | commit-tracked | this repository | Unknown | **Owner assertion** | **OWNER INPUT REQUIRED** | Google Fonts (Bodoni Moda, JetBrains Mono, Inter) | Private | **Unknown** | Medium: **no LICENSE file exists** |
| Domain | Domain | n/a | n/a | n/a | `jrsstandard.com` | n/a | **Unknown** | **No registrar record located in-repo** | Registrar | Public | **Unknown** | Medium |
| Graphics and templates | Document | Unknown | 2026 | n/a | repository assets | Unknown | **Unknown** | **OWNER INPUT REQUIRED** | Font licences apply | Public | **Unknown** | Low |

## Summary of diligence risk

**INFERENCE**, from the table above. **Every row's ownership status is "owner
assertion" or "unknown". No row is Verified.** That is not a statement that ownership
is doubtful; it is a statement that ownership has not been evidenced in a form a buyer
can rely on, which is a different and fixable thing.

Concentrations of risk, in order:

1. **Contributor-derived material in the study design.** The Section 2.1 argument
   is credited to a named contributor. Credit was given with permission; permission to
   be named is not an assignment of rights.
2. **Co-authored research and publications.** A second author designed the reliability
   and validation framework. Co-authored work is not unilaterally transferable.
3. **Trademarks.** A filing dossier exists. No evidence of an actual filing was located.
4. **No repository licence.** The absence of a LICENSE file leaves the terms on which
   any of this is held or conveyed unstated.
