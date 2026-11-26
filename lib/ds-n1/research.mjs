// Research harness switch (2026-11-26, after an external audit).
//
// The data classification public_record_test lifts the identifier and
// excluded-domain screens so the engine can be tested on decisions already
// published by a court, agency or auditor. It is self-declared, so it is off
// unless a research script turns it on by calling enablePublicRecordResearch().
// The browser pages and the enterprise workspace never call it, and it reads no
// environment variable or setting. It cannot prove a document is public; it
// only makes the choice explicit and visible in the calling code.
let enabled = false;
export function enablePublicRecordResearch() { enabled = true; }
export function disablePublicRecordResearch() { enabled = false; }
export function publicRecordResearchEnabled() { return enabled; }
