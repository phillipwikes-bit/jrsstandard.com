// SHARED contributor roster. Single source of truth for both api/contributor.js
// (which resolves a link key to a person) and api/contributor-stats.js (which
// only needs the size). Underscore-prefixed to match _country-backfill.js and
// _panel-countries.js: bundled into the edge functions, never served.
//
// V-HC-01, the healthcare compliance pilot, was WITHDRAWN on 2026-08-13 at the
// owner's instruction. It was accepted and never started, with zero cases in
// realcase_progress across its whole life, so no published figure changes with
// it. Its contributor link is removed too, which is safe because nobody had
// confirmed on any link at the time, so no stored consent is orphaned.

// Keys are unguessable per person so one contributor's link never exposes
// another's details. Titles are the ones on file from registration and from the
// study record; they are shown back as editable defaults, not asserted.
//
// named_on_file:
//   true  = an election to be named is on file, so that is the fallback.
//   null  = NO election is on file. The fallback is anonymous, deliberately:
//           a name is never printed on silence alone.
export const ROSTER = {
  'upbtroc754': { code:'V-AI-01', kind:'panel',  first:'Jake',      name:'Jake McDonough',      title:'AI governance',                                         org:'SAEONYX Global Holdings', named_on_file:true },
  '08c17ihb60': { code:'V-AI-03', kind:'panel',  first:'Frank',     name:'Frank Schouten',      title:'AI Governance and Assurance',                           org:'AEGF',                    named_on_file:true },
  'im06wa5vd4': { code:'V-AI-06', kind:'panel',  first:'Nitin',     name:'Dr Nitin Deshpande',  title:'Chief Human Resources Officer',                         org:'',                        named_on_file:true },
  'u63k28aizs': { code:'V-AI-07', kind:'panel',  first:'Saurabh',   name:'Saurabh Nanda',       title:'General Manager, APAC',                                 org:'',                        named_on_file:true },
  'agbhlh6n4d': { code:'V-AI-08', kind:'panel',  first:'Gabriela',  name:'Gabriela Cortez',     title:'Civil rights records and bilingual intake',             org:'',                        named_on_file:true },
  's3ln3ud13s': { code:'V-AI-10', kind:'panel',  first:'Lawal',     name:'Lawal Olabanji',      title:'Operations and records management',                     org:'ALTV',                    named_on_file:true },
  'h5dypgmtdu': { code:'V-AI-11', kind:'panel',  first:'Andrey',    name:'Andrey Ekhmenin',     title:'Founder, EAS; governance diagnostics and post-execution review', org:'EAS',            named_on_file:true },
  'xoam4zq6yh': { code:'V-AI-12', kind:'author', first:'Kyle',      name:'Kyle McMullan',       title:'Chief Audit Executive',                                 org:'',                        named_on_file:true, note:'panel reviewer and co-author, Business Ethics paper' },
  'hpyvpad2sk': { code:'V-AI-16', kind:'panel',  first:'Gabriela',  name:'Dr Gabriela Bar',     title:'Attorney, PhD; AI ethics advisor',                      org:'',                        named_on_file:true },
  '2s7eencte4': { code:'V-AI-20', kind:'panel',  first:'Hekim',     name:'Hekim Colpan',        title:'AI Governance and Compliance Manager; ISO/IEC 42001 auditor', org:'',                  named_on_file:true },
  'h7a376209q': { code:'V-AI-23', kind:'panel',  first:'Niloofar',  name:'Niloofar Kandi',      title:'',                                                      org:'',                        named_on_file:null },
  'vxieh79z7v': { code:'V-AI-24', kind:'panel',  first:'SungSoo',   name:'SungSoo In',          title:'AI Governance and Responsible AI',                      org:'',                        named_on_file:true },
  'jusnt4chyx': { code:'V-AI-27', kind:'panel',  first:'Sidharth',  name:'Sidharth Borah',      title:'Advocate, High Court of Delhi; Partner, Gurinder and Partners', org:'',                named_on_file:true },
  'si81km0m1r': { code:'V-AI-28', kind:'panel',  first:'Nigel',     name:'Nigel Hee',           title:'AI Ethics, Safety and Governance',                      org:'University of Glasgow',   named_on_file:true },
  's3ud3trom6': { code:'V-AI-29', kind:'panel',  first:'Marguerite', name:'Marguerite Maroudis, PhD', title:'AI and law; data protection officer and AI governance consultant', org:'TechLegalExperts', named_on_file:true },
  '42zgubzfq8': { code:'V-AI-30', kind:'panel',  first:'Andres',    name:'Andres Lage Freire',  title:'AI Governance Lead and Responsible AI Architect',       org:'',                        named_on_file:true },

  '6dyc0l2757': { code:'M-01',    kind:'author', first:'Ubayet',    name:'Ubayet Hossain, FRM', title:'Associate Director, Model Validation',                  org:'KPMG India',              named_on_file:true, note:'methodology co-author' },
  '1wlgcn02gn': { code:'E-08',    kind:'author', first:'Stacyann', name:'Stacyann Young',      title:'Public records and FOIL practice',                      org:'',                        named_on_file:true, note:'co-author and facilitator, public records pilot' },
  'zobi7fgt8q': { code:'V-HR-01', kind:'facil',  first:'Tanvi',     name:'Tanvi Pokhriyal',     title:'HR and employment compliance',                          org:'',                        named_on_file:true, note:'facilitator, HR and employment pilot' }
};

// DERIVED, never restated. api/contributor-stats.js previously carried a
// hand-written ROSTER_SIZE with a comment asking a future editor to keep it in
// step by hand. That is the defect class that put the country and endorsement
// figures out of agreement earlier this month: a second copy of a number that
// nothing forces to match. Removing V-HC-01 would have silently left it at 20
// against a roster of 19.
export const ROSTER_SIZE = Object.keys(ROSTER).length;
