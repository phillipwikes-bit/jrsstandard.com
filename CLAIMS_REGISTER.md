# CLAIMS REGISTER

**Every externally visible research statistic, with the population it belongs to. Created 2026-08-13.**

**The governing rule: these populations are different and must never be combined.** Attaching the country figure to the reviewer total is a recorded past defect in this repository, and it is the single most likely way a true number becomes a false claim.

---

## The populations, and what each one is

| Population | Value | What it counts |
|---|---|---|
| Reviewers | **58** | Everyone who has graded at least one record across the three studies |
| Completers | **36** | Graded a full 24-record set |
| Countries | **16** | Distinct countries **of the 36 completers** |
| Continents | **5** | Distinct continents of the 36 completers |
| Registered | **48** | Enrolled, whether or not they completed |
| Detection completers | **16** | Completed the Arm A detection set |
| Detection countries | **11** | Countries **of those 16**, the figure the manuscript publishes |
| Comparison completers | **20** | Completed the Arm B randomized comparison |
| Reliability raters | **25** | Labelled records in the reliability study |

All read live from `/api/panel-stats`, computed at request time. `geo_resolved` is 36 of 36 and `geo_unresolved` is empty.

---

## Claim register

### C-01 Reviewer total
| | |
|---|---|
| **Exact wording** | "58 reviewers have graded records" |
| **Source** | `/api/panel-stats` `reviewers` |
| **Population** | Everyone with at least one graded record, all three studies |
| **Denominator** | Not a rate |
| **Date** | Live |
| **Permitted** | "58 reviewers have graded records across three studies" |
| **PROHIBITED** | "58 reviewers across 16 countries." **The country figure does not belong to this population.** |

### C-02 Completers
| | |
|---|---|
| **Exact wording** | "36 completed a full 24-record set" |
| **Source** | `/api/panel-stats` `completers` |
| **Population** | Reviewers reaching 24 of 24 reads |
| **Date** | Live |
| **Permitted** | "36 reviewers completed a full 24-record set" |
| **PROHIBITED** | "36 experts", unless the specific person is an expert-designated rater |

### C-03 Countries
| | |
|---|---|
| **Exact wording** | "16 countries" |
| **Source** | `/api/panel-stats` `countries`, computed from `api/_panel-countries.js` |
| **Population** | **The 36 completers only** |
| **Date** | Live. All 36 resolved as of 2026-08-13 |
| **Permitted** | "36 completers across 16 countries and 5 continents" |
| **PROHIBITED** | "58 reviewers across 16 countries"; "34 independent experts across 16 countries". **Neither statistic exists in this repository.** |

### C-04 Detection panel
| | |
|---|---|
| **Exact wording** | "16 independent experts, 11 countries, 384 graded reads" |
| **Source** | `/api/panel-stats` `detection_completers`, `detection_countries` |
| **Population** | Arm A detection completers only |
| **Denominator** | 384 reads = 16 reviewers x 24 records |
| **Permitted** | "83.9% detection across 16 independent experts and 384 graded reads, 95% CI 72.7 to 95.1" |
| **PROHIBITED** | Quoting 16 countries here. **The detection panel's figure is 11.** |

### C-05 Reliability
| | |
|---|---|
| **Exact wording** | "Gwet's AC1 0.74 experts, 0.63 trained" |
| **Source** | `research/JRS_Validation_Report.md`, Rung 2a |
| **Population** | 25 reliability raters, 10 records, 108 labels |
| **Permitted** | "Substantial chance-corrected agreement, AC1 0.74 among experts and 0.63 among trained reviewers, across 10 records and 108 labels" |
| **PROHIBITED** | Presenting reliability as accuracy, or as evidence of effectiveness |

### C-06 Reproducibility
| | |
|---|---|
| **Exact wording** | "84% cross-vendor agreement across 15 records" |
| **Source** | `research/JRS_Validation_Report.md` Rung 1; nightly runs in `study_runs` |
| **Population** | **AI models, not people.** 3 vendors, one model each |
| **Permitted** | "Three independent models from three vendors agreed on the read 84% of the time across 15 constructed records" |
| **PROHIBITED** | Any wording implying human agreement, or implying accuracy. It is raw agreement on synthetic data, and the chance-corrected coefficient is not yet computed |

### C-07 Answer key
| | |
|---|---|
| **Exact wording** | "a key fixed and independently verified 24 of 24 before scoring" |
| **Source** | `research/JRS_Validation_Report.md`; key held in `research/`, never deployed |
| **Permitted** | "Scored against a key fixed and independently verified before any scoring took place" |
| **PROHIBITED** | Publishing the key, or describing it as available |

### C-08 Arm B
| | |
|---|---|
| **Exact wording** | "designed and live, not yet analyzed" |
| **Population** | 20 comparison completers |
| **Permitted** | "A randomized JRS-versus-unaided comparison is deployed and has not reached its enrollment target, so no advantage claim is made" |
| **PROHIBITED** | **Any claim that JRS outperforms unaided review.** Not measured |

### C-09 Commercial traction
| | |
|---|---|
| **Live values** | 0 organization pilots, 0 evaluation submissions, $0 revenue, no payment mechanism |
| **Source** | `/api/asset-stats` |
| **Permitted** | "Market validation in progress." "Commercial demand has not yet been established." "Current offers are being tested through controlled market experiments." |
| **PROHIBITED** | high demand, proven demand, market-proven, industry standard, battle-tested, widely adopted, certified standard, product-market fit |

### C-10 Regulatory posture
| | |
|---|---|
| **Permitted** | "Designed to support organizational governance, auditability, documentation traceability, and review processes that may be relevant to frameworks and regulatory requirements such as the EU AI Act and NIST AI RMF." |
| **PROHIBITED** | That JRS establishes legal or regulatory compliance; that ISO/IEC 42001 requires JRS; "required by ISO" |

---

## Standing status line

**JRS is under operational validation.** Reproducibility and reliability are reported. Accuracy, controlled comparison and real-case criterion validity are accruing. No effectiveness claim is made.
