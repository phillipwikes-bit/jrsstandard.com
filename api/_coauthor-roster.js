// SHARED co-author roster. Single source of truth for api/coauthor.js.
// Underscore-prefixed to match _contributor-roster.js and _panel-countries.js:
// bundled into the edge function, never served.
//
// SEPARATE FROM _contributor-roster.js ON PURPOSE. The contributor link asks a
// reviewer how they are named in a paper. This asks a CO-AUTHOR two different
// things: how their name, title and organisation are printed, and whether the
// work may be used commercially. Those are different permissions and the audit
// at research/CONSENT_AND_RELEASE_AUDIT_2026-08-13.md gap 2 is explicit that a
// consent tick is not an assignment. Keeping the instruments apart is what
// makes each one provable.
//
// Keys derived deterministically by scripts/add_coauthor_links.py from a fixed
// seed, collision-checked against every key in _contributor-roster.js and
// honor.js before insertion. They can be regenerated if this file is lost.
//
// TERMS_VERSION closes gap 1 of that audit: "no stored copy of the terms as
// they read on the day each person ticked." Every row this endpoint writes
// carries the version, so what a person agreed to is provable later. Bump it
// whenever the wording on coauthor.html changes, and never edit the wording
// without bumping it.
export const TERMS_VERSION = 'coauthor-v1.0-2026-08-24';

export const ROSTER = {
  'ggo2vm8jja': { code:'M-01',    first:'Ubayet',   name:'Ubayet Hossain, FRM', title:'Independent Financial Risk & Model Validation Professional', org:'', paper:'the detection study',          role:'co-author',   org_note:'' },
  '8277t7qv5r': { code:'V-HR-01', first:'Tanvi',    name:'Tanvi Pokhriyal',     title:'Organisational Psychologist (freelance)', org:'',        paper:'the employment records study', role:'first author', org_note:'' },
  // Young's organisation is deliberately blank. She set an affiliation policy on
  // 2026-08-09 removing her title and agency from every surface, recorded at
  // research/Dossier_Stacyann_Young_2026-08-09.md section 8a. The note is shown
  // beside the field so the blank reads as deliberate rather than as an omission
  // she should correct.
  'mt8yhlx1yg': { code:'E-08',    first:'Stacyann', name:'Stacyann Young',      title:'Independent Researcher', org:'',                        paper:'the public records study',     role:'first author', org_note:'Left blank on purpose. You asked on 9 August that your title and agency stay off every surface, and that still stands. Fill this in only if you want that to change.' }
};
