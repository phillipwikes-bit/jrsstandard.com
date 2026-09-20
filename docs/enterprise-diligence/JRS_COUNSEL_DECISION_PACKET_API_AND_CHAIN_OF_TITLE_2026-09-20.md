# JRS Counsel Decision Packet — API Contract and Chain of Title

**Status:** PREPARED FOR TARGETED PROFESSIONAL REVIEW  
**Date:** 2026-09-20  
**Purpose:** Reduce B-007/B-016 and B-004 to bounded questions. This document does not answer legal questions or determine title.

## Matter A — Published API contract / implementation conflict

### Established repository facts
1. `openapi.json` is a published commercial-interface document for `POST /api/v1/review-engine`.
2. It describes required top-level response fields/routing that do not match the current implementation.
3. The implementation nests conditions under `result` and does not emit the routing vocabulary described by that document.
4. A second specification, `openapi-review-engine.json`, was recorded as matching the implementation more closely.
5. B-016 separately records that `openapi.json` describes the call as stateless while the versioned implementation calls `logReview()` and retains model-derived programme telemetry.
6. The repository has frozen modification of the published commercial contract pending targeted review.

### Questions for counsel
A1. For JRS's present licensing posture, should the published `openapi.json` be treated as a contractual/licensed interface whose modification requires specific notice, versioning, or preservation steps?  
A2. May JRS correct the document prospectively so that its response schema matches the implementation, or should the implementation instead be changed to conform to the published schema?  
A3. How should the existing "stateless" and data-residency language be treated given the documented telemetry write path?  
A4. Is a versioned replacement/deprecation approach preferable to in-place correction for existing/public reliance interests?  
A5. What wording, if any, should accompany the corrected interface to avoid implying legal compliance, certification, or guarantees not established by evidence?

### Engineering action after counsel
Implement only the selected disposition; preserve the superseded artifact/version; update guards and public documentation; test the actual response contract; record the decision authority and effective version. Do not invent a routing mapping before the disposition is selected.

## Matter B — Chain of title / Level-A evidence

### Established repository fact
B-004 records: no Level-A executed signed instrument establishing the required chain of title is present in the accessible corpus. The repository therefore does not determine ownership/title.

### Questions for counsel
B1. What executed instruments are required to establish a diligence-ready chain of title for the JRS assets actually intended for licensing?  
B2. Which contributors, contractors, co-authors, vendors, or prior entities, if any, require assignment, confirmation, license, consent, or exclusion from the licensable package?  
B3. Which JRS materials can be represented as solely authored/controlled based on existing evidence, and which require additional documentary proof before such a representation?  
B4. What treatment is appropriate for third-party/open-source components, public research inputs, journal co-authorship, and AI-assisted development records?  
B5. What representations should be avoided in a prospective license or diligence package until the identified instruments are executed?  
B6. If an exclusive license or asset transaction is contemplated, what additional chain-of-title evidence should exist before signing?

### Requested output from counsel
For each matter: conclusion; factual assumptions relied upon; documents reviewed; required corrective instrument/action; whether action is prerequisite to non-exclusive evaluation, commercial license, exclusive license, or asset sale; and any required public/contract wording.

## Preservation rule
Counsel's answer is a professional-review input. It must be recorded without silently rewriting the historical blocker record. Engineering and diligence documents should point to the decision and implement only the authorized disposition.
