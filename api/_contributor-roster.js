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
  // V-AI-08's LINK REINSTATED 2026-08-19 at the owner's instruction: "She did
  // not withdraw from study ... should get a link ... just like all the rest of
  // the Arm A, Arm B, and Study 004 completers." The entry below is the one
  // removed on 2026-08-16, restored under its original key so any link she
  // already holds still resolves.
  //
  // THE REINSTATEMENT IS THE LINK AND ONLY THE LINK. Her honor entry H-2026-06
  // stays retired from api/honor.js and the manuscript acknowledgments stay
  // removed, because the same instruction says the only special certificate is
  // Ubayet Hossain's. The link is how she elects how she is named; it is
  // restored first so the election is hers to make.
  //
  // The 2026-08-16 removal is recorded below and kept for the record.
  //
  // V-AI-08 REMOVED 2026-08-16 at the owner's instruction: this person is not to
  // appear as a contributor anywhere in the programme. Her contributor link is
  // withdrawn with the entry, and her honor roster entry H-2026-06 was removed
  // from api/honor.js in the same change.
  //
  // THIS IS A NAMING AND CREDIT REMOVAL, NOT A DATA WITHDRAWAL. Her graded reads
  // remain in the study database and remain counted, unnamed, in the detection
  // panel of 16 and the 384 graded reads. If the study data is ever to be
  // withdrawn as well, every published figure that rests on the panel has to be
  // recomputed; that is a separate instruction and has not been given.
  //
  // Do not repopulate this entry from research/Expert_Roster_All_Studies_2026-08-06.csv
  // or from any study-record export. The roster CSV is a study record and does
  // not carry consent state. scripts/check_zero_drift.py fails if the name
  // reappears anywhere in api/, the served pages, or the research deliverables.
  'agbhlh6n4d': { code:'V-AI-08', kind:'panel',  first:'Gabriela',  name:'Gabriela Cortez',     title:'Civil rights records and bilingual intake',             org:'',                        named_on_file:true },
  's3ln3ud13s': { code:'V-AI-10', kind:'panel',  first:'Lawal',     name:'Lawal Olabanji',      title:'Operations and records management',                     org:'ALTV',                    named_on_file:true },
  'h5dypgmtdu': { code:'V-AI-11', kind:'panel',  first:'Andrey',    name:'Andrey Ekhmenin',     title:'Founder, EAS; governance diagnostics and post-execution review', org:'EAS',            named_on_file:true },
  // RECLASSIFIED 2026-08-15 from kind:'author' to kind:'panel'. He is a Study
  // 011 detection completer: Arm A, 24 of 24 reads, status COMPLETE in
  // research/Expert_Roster_All_Studies_2026-08-06.csv. Carrying kind:'author'
  // made contributor.html greet him as "Co-author and contributor" rather than
  // "International reviewer panel" and filed him under Co-authors on the link
  // sheet, so the one person who is both was the only completer not receiving
  // the regular study link. The co-author fact is kept in the note; it is
  // additional to his panel role, not a replacement for it.
  'xoam4zq6yh': { code:'V-AI-12', kind:'panel',  first:'Kyle',      name:'Kyle McMullan',       title:'Chief Audit Executive',                                 org:'',                        named_on_file:true, note:'detection panel completer; also co-author, Business Ethics paper' },
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
  'zobi7fgt8q': { code:'V-HR-01', kind:'facil',  first:'Tanvi',     name:'Tanvi Pokhriyal',     title:'HR and employment compliance',                          org:'',                        named_on_file:true, note:'facilitator, HR and employment pilot' },

  // RELIABILITY STUDY EXPERT RATERS (Rung 2a). Added 2026-08-14, removed the same
  // day, RESTORED 2026-08-15 on the owner's instruction.
  //
  // The removal was correct for what it was asked to do: take Rung 2a off the
  // EVALUATOR OUTREACH, which is an award-citation invitation for the people the
  // detection and comparison papers report. These three are not on that list and
  // are not being added to it: build_evaluator_outreach.py selects on the V-AI-
  // and RR- code prefixes, so an E- code cannot reach it, and the assertion suite
  // fails if a 2a message file ever appears.
  //
  // What the removal also took away, which was not intended, was their only route
  // to the results summary. They graded records for this programme, they are
  // counted in the 58, and without a roster entry they have no link and therefore
  // no way to receive the findings their work produced.
  //
  // KEYS ARE THE ORIGINAL ONES minted on 2026-08-14 and recovered from commit
  // c6c01d0, not freshly generated. If any of the three was ever sent their link
  // in that window, it still resolves.
  //
  // E-08 is not repeated here: she is already on this roster as an author.
  // E-09, E-12 and E-13 are not repeated either: they are the same people as
  // V-AI-06, V-AI-07 and V-AI-03 and already hold a key. One person, one link.
  // E-11 has no identity on record and cannot be given a link at all.
  '8g35408va0': { code:'E-03', kind:'rater', first:'Andrzej', name:'Andrzej Skulski', title:'Founder, Dom Ciszy - Resonance Lab; AI Governance and Decision Systems', org:'', named_on_file:true, note:'reliability study expert rater' },
  '999cw3iw4i': { code:'E-10', kind:'rater', first:'Rahul', name:'Rahul Potdar', title:'Independent Director (IICA Certified); Corporate Governance, Risk Management and ESG Strategy; Board Adviser; Leontra Technologies; IIM Raipur', org:'', named_on_file:true, note:'reliability study expert rater' },
  '2u7s9to5ta': { code:'E-14', kind:'rater', first:'Alankar', name:'Alankar Yaduvanshi', title:'Data Privacy Professional (CIPP-E), WNS; 8+ years data privacy and corporate compliance', org:'', named_on_file:true, note:'reliability study expert rater' },

  // COMPARISON STUDY COMPLETERS, added 2026-08-14.
  //
  // These were deliberately absent because a JRS-branded page naming the
  // standard tells an unaided-arm reviewer that the standard exists.
  //
  // THE COMPARISON STUDY IS OPEN AND CLOSES 2026-08-15. The owner directed on
  // 2026-08-14 that every completer is treated identically and receives the same
  // confirmation link, so these 20 join the roster. Everyone listed here has
  // already submitted all 24 records, so the link cannot alter their reviews.
  //
  // RR-130 and RR-132 completed anonymously. They carry no name and
  // named_on_file:null, so the fallback is anonymous and the confirmation page
  // asks how they wish to be printed rather than assuming.
  'dg2yvv3h69': { code:'RR-101', kind:'panel',  first:'Boris', name:'Boris Khazin', title:'AI Governance, Digital Risk and GRC leader; ClearView MRI; ex-EPAM Global Head of DRM/GRC', org:'', named_on_file:true, note:'comparison study completer' },
  '4rfqa5u47w': { code:'RR-104', kind:'panel',  first:'Donavine', name:'Donavine Smith, MBA', title:'Chief Strategy and Transformation Officer; frontier AI strategy and governance; NED, Rape Crisis Cape Town Trust', org:'', named_on_file:true, note:'comparison study completer' },
  'l8ukpuypgf': { code:'RR-106', kind:'panel',  first:'Nicholas', name:'Nicholas Evans', title:'AI Governance and Runtime Auditor; adversarial and non-adversarial testing; ex-USMC', org:'', named_on_file:true, note:'comparison study completer' },
  'iq0jgphrzx': { code:'RR-107', kind:'panel',  first:'Tuneer', name:'Tuneer Mondal', title:'AI, HealthTech and Governance; Consultant, Operations and AI Solutions; Arcadia Impact; University of Cambridge', org:'', named_on_file:true, note:'comparison study completer' },
  'xrtta15iyp': { code:'RR-109', kind:'panel',  first:'Mostafa', name:'Mostafa Mahmoudi', title:'AI Governance Researcher; Founder and Director, Iran Tech Diplomacy Institute; PhD candidate, University of Tehran', org:'', named_on_file:true, note:'comparison study completer' },
  'hxsge0aowg': { code:'RR-110', kind:'panel',  first:'Jean-Luc', name:'Jean-Luc Adade', title:'Regional IT Leader, West, Central and North Africa; IT governance and digital transformation', org:'', named_on_file:true, note:'comparison study completer' },
  'ndd9nr08sk': { code:'RR-113', kind:'panel',  first:'Priyam', name:'Priyam Dhamankar', title:'Ethics and Compliance Leader, Cummins India; 17+ years legal, compliance and investigations', org:'', named_on_file:true, note:'comparison study completer' },
  'fkszsr4mii': { code:'RR-114', kind:'panel',  first:'MacKenzie', name:'MacKenzie McCowan', title:'AI Governance Specialist, Atomi; PhD candidate, University of Sydney; Sessional Lecturer, Avondale University', org:'', named_on_file:true, note:'comparison study completer' },
  '550gzz59he': { code:'RR-116', kind:'panel',  first:'Eric', name:'Dr. Eric J. W. Orlowski', title:'AI Governance Specialist, Ethnographer, Tech Policy Researcher; Research Fellow, NUS AI Institute; PhD, UCL', org:'', named_on_file:true, note:'comparison study completer' },
  '2hz6uvwxvn': { code:'RR-117', kind:'panel',  first:'Alexandria', name:'Alexandria Davis', title:'Responsible AI and Compliance Leader; Founder and Principal Consultant, FIEA Consulting Inc.; DBA candidate', org:'', named_on_file:true, note:'comparison study completer' },
  'zu8iotht1u': { code:'RR-121', kind:'panel',  first:'Sharon', name:'Dr Sharon Licqurish, PhD', title:'CEO, Chief Scientist and AI Governance Architect, AIIP', org:'', named_on_file:true, note:'comparison study completer' },
  'u34j0adlsm': { code:'RR-123', kind:'panel',  first:'Greg', name:'Greg Searle', title:'AI Governance and Model Behaviour Researcher; Master\'s candidate', org:'', named_on_file:true, note:'comparison study completer' },
  'q8n5h174fk': { code:'RR-124', kind:'panel',  first:'Adesh', name:'Adesh Sharma', title:'Data and AI Governance Leader, Digital Frontier Partners; IAPP AIGP', org:'', named_on_file:true, note:'comparison study completer' },
  'mlskg9y1s8': { code:'RR-125', kind:'panel',  first:'Muhammad', name:'Muhammad Dauda', title:'Programme leadership, sustainability and governance; UN SDSN Youth Nigeria; Miva Open University; PgMP', org:'', named_on_file:true, note:'comparison study completer' },
  'hgjk1vonxs': { code:'RR-126', kind:'panel',  first:'Joseph', name:'Joseph Mungai', title:'Public-Interest Technology and AI Ethics/Governance Professional; Maasai Mara University', org:'', named_on_file:true, note:'comparison study completer' },
  'ltrtk9chzj': { code:'RR-127', kind:'panel',  first:'Candid', name:'Candid Opris', title:'Founder and Managing Partner, Opris & Associates; two decades in AI and data governance and digital trust', org:'', named_on_file:true, note:'comparison study completer' },
  'fcnrwmgyfj': { code:'RR-128', kind:'panel',  first:'Sagarika', name:'Sagarika Banerjee', title:'AI Governance and Software QA Leader; ISO/IEC 42001, NIST AI RMF', org:'', named_on_file:true, note:'comparison study completer' },
  'hidg3cmtsy': { code:'RR-129', kind:'panel',  first:'Wendy', name:'Wendy Ann Martel', title:'Data protection, privacy and AI governance; twenty five years of public and private sector practice', org:'', named_on_file:true, note:'comparison study completer' },
  'kt18kaanxw': { code:'RR-130', kind:'panel',  first:'', name:'', title:'JRS-naive expert professional', org:'', named_on_file:null, note:'comparison study completer, anonymous by choice' },
  'd0cofc93jc': { code:'RR-132', kind:'panel',  first:'', name:'', title:'JRS-naive expert professional', org:'', named_on_file:null, note:'comparison study completer, anonymous by choice' }
};

// DERIVED, never restated. api/contributor-stats.js previously carried a
// hand-written ROSTER_SIZE with a comment asking a future editor to keep it in
// step by hand. That is the defect class that put the country and endorsement
// figures out of agreement earlier this month: a second copy of a number that
// nothing forces to match. Removing V-HC-01 would have silently left it at 20
// against a roster of 19.
export const ROSTER_SIZE = Object.keys(ROSTER).length;
