export const config = { runtime: 'edge' };

// Global Governance and Transparency Honor: per-person acceptance endpoint.
//
// One unguessable link per honoree. The link does four jobs the email round
// cannot do reliably:
//
//   1. Captures how the honoree wants their NAME and TITLE printed on the
//      certificate and in any article byline or contributor list, confirmed by
//      the person rather than transcribed from a registration form.
//   2. Captures a short QUOTE in their own words about documentation quality in
//      public records, which is the thing an article, a press note, and a data
//      room all need and none of them can invent.
//   3. Records permissions in writing, in one required tick: contact, secure
//      storage, and transfer with the project if it is ever acquired. Public
//      listing of the honoree's name is a SEPARATE optional choice, matching
//      the split-consent model used across the rest of the site.
//   4. Issues the honor itself: the citation text is returned on submission so
//      the honoree sees exactly what the certificate will say.
//
// Writes to the EXISTING private pilot_contacts table (RLS on, no anon read)
// via the service-role key, tagged source='honor-accept' so it never collides
// with training-enroll, guide-register, support-register, contributor-confirm
// or pilot rows. Fields the table has no column for ride along as JSON in the
// message column, matching the /api/enroll, /api/access and /api/contributor
// convention.
//
// NOTE ON SCOPE, revised 2026-08-08: the Honor is not a single-recipient award.
// Every completer of the detection study receives one, alongside honorees named
// for public-records and governance work. The ROSTER below therefore grows to
// the full completer list and each entry keeps its own citation, because the
// citation states what that person actually did and no two are the same.
//
// Stacyann Young is H-2026-01 because she is first named, not because she is the
// only one. Nothing in the copy anywhere may describe this as one recipient a
// year or imply exclusivity.
//
// Comparison-arm reviewers (RR-### codes) remain NOT eligible and must not be
// added, because that arm is blind and a page naming the standard would break
// it for anyone still reviewing.

const SB = 'https://pjzxkeviouofdseagvpf.supabase.co';

const HONOR_NAME = 'Global Governance and Transparency Honor';
const HONOR_YEAR = '2026';

// Roster. Keys are unguessable per person so one honoree's link never exposes
// another's details. Titles are the ones on file and are shown back as editable
// defaults, not asserted. `citation` is the sentence that goes on the
// certificate; it states what that person actually did, and no two are the same.
//
// THREE STUDIES, THREE CITATION FORMS, AND THE DIFFERENCE IS NOT COSMETIC:
//
//   study: 'public-records'  Stacyann Young. Names the 32-case documentation study
//                            because that study is hers and is being published
//                            under her name.
//
//   study: 'detection'       The 16 Arm A completers of the international
//                            detection study. Their citations name the standard,
//                            the five conditions and the verified key, because
//                            Arm A reviewers applied the standard knowingly and
//                            nothing about it is hidden from them.
//
//   study: 'records-review'  The 17 Arm B completers of the randomized
//                            comparison. Their citations are DELIBERATELY
//                            NEUTRAL and must stay that way: no mention of JRS,
//                            of the five conditions, of reconstructability, or
//                            of the fact that a comparison is running. That arm
//                            is blind, RR-108 has not finished, and a page
//                            naming the standard would break the blind for that
//                            person. This matches the wording already used on
//                            the twelve Arm B certificates issued from
//                            research/build_certificate_armb.py. When RR-108
//                            completes or the study closes, these may be
//                            revised; until then they do not change.
//
// RR-130 and RR-132 completed anonymously by choice. Their entries carry the
// code and the citation with no name, so the acceptance page asks them how they
// wish to be printed rather than guessing.
//
// 34 entries: 1 public-records + 16 detection + 17 records-review.
// The 33 completers are the figure published on the site, verified against
// pilot_progress and armb_progress on 2026-08-09.
const ROSTER = {
  'q7m2vd9xk4': {
    code: 'H-2026-01',
    study: 'public-records',
    first: 'Stacyann',
    name: 'Stacyann Young',
    // TITLE AND ORGANIZATION ARE DELIBERATELY EMPTY, at her written request of
    // 2026-08-09: the work was volunteer, done in a personal capacity on public
    // materials, and she asked that her agency title and employer be removed
    // entirely from the certificate and from any public-facing recognition.
    // Do not repopulate these from the study record.
    title: '',
    org: '',
    order: 'first honoree named under this designation',
    // Citation wording supplied by the honoree on 2026-08-09 and used as she
    // wrote it. 'voluntarily' and 'public' are hers and carry the point: the
    // study was volunteer work on already-public materials.
    citation: 'In recognition of voluntarily designing and completing a public-records '
            + 'documentation study of 32 public determinations, advisory opinions, and '
            + 'compliance audits, drawn from four document classes and two states and spanning '
            + 'twenty-one years of decisions, each assessed from the source alone and each '
            + 'accompanied by a written record of the basis for that assessment.'
  },
  'e7m9x03lgo': {
    code: 'H-2026-02',
    study: 'detection',
    participant: 'V-AI-01',
    first: 'Jake',
    name: 'Jake McDonough',
    title: 'Founder, SAEONYX Global Holdings',
    org: 'SAEONYX Global Holdings',
    order: 'named for completing the international detection study',
    citation: 'For completing the full 24-record set of the international detection study '
            + 'as an independent reviewer, reading every record cold and blind to the '
            + 'verified key, and applying the five review conditions with care, rigor and '
            + 'independent judgment. A AI governance and self-accountable AI runtimes '
            + 'perspective contributed to the evidence that Decision Reconstruction Risk '
            + 'is detectable by independent experts.'
  },
  'cuh3yreh99': {
    code: 'H-2026-03',
    study: 'detection',
    participant: 'V-AI-03',
    first: 'Frank',
    name: 'Frank Schouten',
    title: 'AI Governance and Assurance',
    org: 'AEGF',
    order: 'named for completing the international detection study',
    citation: 'For completing the full 24-record set of the international detection study '
            + 'as an independent reviewer, reading every record cold and blind to the '
            + 'verified key, and applying the five review conditions with care, rigor and '
            + 'independent judgment. A risk and accountability practice in AI assurance '
            + 'perspective contributed to the evidence that Decision Reconstruction Risk '
            + 'is detectable by independent experts.'
  },
  'gxbnsiu779': {
    code: 'H-2026-04',
    study: 'detection',
    participant: 'V-AI-06',
    first: 'Nitin',
    name: 'Dr Nitin Deshpande',
    title: 'Chief Human Resources Officer',
    org: '',
    order: 'named for completing the international detection study',
    citation: 'For completing the full 24-record set of the international detection study '
            + 'as an independent reviewer, reading every record cold and blind to the '
            + 'verified key, and applying the five review conditions with care, rigor and '
            + 'independent judgment. A thirty eight years in human resources and '
            + 'industrial relations perspective contributed to the evidence that Decision '
            + 'Reconstruction Risk is detectable by independent experts.'
  },
  'psbts5lwlt': {
    code: 'H-2026-05',
    study: 'detection',
    participant: 'V-AI-07',
    first: 'Saurabh',
    name: 'Saurabh Nanda',
    title: 'General Manager, APAC',
    org: 'Align Technology',
    order: 'named for completing the international detection study',
    citation: 'For completing the full 24-record set of the international detection study '
            + 'as an independent reviewer, reading every record cold and blind to the '
            + 'verified key, and applying the five review conditions with care, rigor and '
            + 'independent judgment. A senior general-management and P&L leadership '
            + 'across Asia-Pacific perspective contributed to the evidence that Decision '
            + 'Reconstruction Risk is detectable by independent experts.'
  },
  'apuyyioat6': {
    code: 'H-2026-06',
    study: 'detection',
    participant: 'V-AI-08',
    first: 'Gabriela',
    name: 'Gabriela Cortez',
    title: 'Civil-rights records and bilingual intake',
    org: 'Maryland Commission on Civil Rights',
    order: 'named for completing the international detection study',
    citation: 'For completing the full 24-record set of the international detection study '
            + 'as an independent reviewer, reading every record cold and blind to the '
            + 'verified key, and applying the five review conditions with care, rigor and '
            + 'independent judgment. A civil-rights intake and records practice '
            + 'perspective contributed to the evidence that Decision Reconstruction Risk '
            + 'is detectable by independent experts.'
  },
  'f6t7aw2wya': {
    code: 'H-2026-07',
    study: 'detection',
    participant: 'V-AI-10',
    first: 'Lawal',
    name: 'Lawal Olabanji',
    title: 'Operations and records management',
    org: 'ALTV Engineering',
    order: 'named for completing the international detection study',
    citation: 'For completing the full 24-record set of the international detection study '
            + 'as an independent reviewer, reading every record cold and blind to the '
            + 'verified key, and applying the five review conditions with care, rigor and '
            + 'independent judgment. A operations and records management practice '
            + 'perspective contributed to the evidence that Decision Reconstruction Risk '
            + 'is detectable by independent experts.'
  },
  'jnmye9ecx3': {
    code: 'H-2026-08',
    study: 'detection',
    participant: 'V-AI-11',
    first: 'Andrey',
    name: 'Andrey Ekhmenin',
    title: 'Founder, EAS',
    org: 'EAS',
    order: 'named for completing the international detection study',
    citation: 'For completing the full 24-record set of the international detection study '
            + 'as an independent reviewer, reading every record cold and blind to the '
            + 'verified key, and applying the five review conditions with care, rigor and '
            + 'independent judgment. A governance diagnostics and post-execution review '
            + 'perspective contributed to the evidence that Decision Reconstruction Risk '
            + 'is detectable by independent experts.'
  },
  '6qojookcu2': {
    code: 'H-2026-09',
    study: 'detection',
    participant: 'V-AI-12',
    first: 'Kyle',
    name: 'Kyle McMullan',
    title: 'Chief Audit Executive',
    org: 'the audit hub, London',
    order: 'named for completing the international detection study',
    citation: 'For completing the full 24-record set of the international detection study '
            + 'as an independent reviewer, reading every record cold and blind to the '
            + 'verified key, and applying the five review conditions with care, rigor and '
            + 'independent judgment. A internal audit and financial-crimes leadership '
            + 'perspective contributed to the evidence that Decision Reconstruction Risk '
            + 'is detectable by independent experts.'
  },
  'ttcnmo9pl6': {
    code: 'H-2026-10',
    study: 'detection',
    participant: 'V-AI-16',
    first: 'Gabriela',
    name: 'Dr Gabriela Bar',
    title: 'Attorney, PhD; AI ethics advisor',
    org: 'Gabriela Bar Law & AI',
    order: 'named for completing the international detection study',
    citation: 'For completing the full 24-record set of the international detection study '
            + 'as an independent reviewer, reading every record cold and blind to the '
            + 'verified key, and applying the five review conditions with care, rigor and '
            + 'independent judgment. A legal practice and AI ethics advisory in the '
            + 'European Union perspective contributed to the evidence that Decision '
            + 'Reconstruction Risk is detectable by independent experts.'
  },
  'vdyulyea6z': {
    code: 'H-2026-11',
    study: 'detection',
    participant: 'V-AI-20',
    first: 'Hekim',
    name: 'Hekim Colpan',
    title: 'AI Governance and Compliance Manager',
    org: '',
    order: 'named for completing the international detection study',
    citation: 'For completing the full 24-record set of the international detection study '
            + 'as an independent reviewer, reading every record cold and blind to the '
            + 'verified key, and applying the five review conditions with care, rigor and '
            + 'independent judgment. A ISO/IEC 42001 audit practice across the EU AI Act, '
            + 'GDPR and DORA perspective contributed to the evidence that Decision '
            + 'Reconstruction Risk is detectable by independent experts.'
  },
  '7fd48knqsc': {
    code: 'H-2026-12',
    study: 'detection',
    participant: 'V-AI-23',
    first: 'Niloofar',
    name: 'Niloofar Kandi',
    title: 'AI Governance and Strategy Specialist',
    org: 'University of Wollongong',
    order: 'named for completing the international detection study',
    citation: 'For completing the full 24-record set of the international detection study '
            + 'as an independent reviewer, reading every record cold and blind to the '
            + 'verified key, and applying the five review conditions with care, rigor and '
            + 'independent judgment. A ISO/IEC 42001 implementation and doctoral research '
            + 'perspective contributed to the evidence that Decision Reconstruction Risk '
            + 'is detectable by independent experts.'
  },
  'eu8e8xezu4': {
    code: 'H-2026-13',
    study: 'detection',
    participant: 'V-AI-24',
    first: 'SungSoo',
    name: 'SungSoo In',
    title: 'AI Governance and Responsible AI',
    org: '',
    order: 'named for completing the international detection study',
    citation: 'For completing the full 24-record set of the international detection study '
            + 'as an independent reviewer, reading every record cold and blind to the '
            + 'verified key, and applying the five review conditions with care, rigor and '
            + 'independent judgment. A authorship of the Athena Governance Architecture '
            + 'perspective contributed to the evidence that Decision Reconstruction Risk '
            + 'is detectable by independent experts.'
  },
  'st5iw1arlr': {
    code: 'H-2026-14',
    study: 'detection',
    participant: 'V-AI-27',
    first: 'Sidharth',
    name: 'Sidharth Borah',
    title: 'Advocate, High Court of Delhi; Partner',
    org: 'Gurinder & Partners',
    order: 'named for completing the international detection study',
    citation: 'For completing the full 24-record set of the international detection study '
            + 'as an independent reviewer, reading every record cold and blind to the '
            + 'verified key, and applying the five review conditions with care, rigor and '
            + 'independent judgment. A thirteen years of litigation practice perspective '
            + 'contributed to the evidence that Decision Reconstruction Risk is '
            + 'detectable by independent experts.'
  },
  'rvjlu41ick': {
    code: 'H-2026-15',
    study: 'detection',
    participant: 'V-AI-28',
    first: 'Nigel',
    name: 'Nigel Hee',
    title: 'AI Ethics, Safety and Governance; Co-founder',
    org: 'OpenNexus',
    order: 'named for completing the international detection study',
    citation: 'For completing the full 24-record set of the international detection study '
            + 'as an independent reviewer, reading every record cold and blind to the '
            + 'verified key, and applying the five review conditions with care, rigor and '
            + 'independent judgment. A research practice at the University of Glasgow '
            + 'perspective contributed to the evidence that Decision Reconstruction Risk '
            + 'is detectable by independent experts.'
  },
  'htmenbd8if': {
    code: 'H-2026-16',
    study: 'detection',
    participant: 'V-AI-29',
    first: 'Marguerite',
    name: 'Marguerite Maroudis, PhD',
    title: 'AI and Law Expert; DPO and AI Governance Consultant',
    org: 'TechLegalExperts',
    order: 'named for completing the international detection study',
    citation: 'For completing the full 24-record set of the international detection study '
            + 'as an independent reviewer, reading every record cold and blind to the '
            + 'verified key, and applying the five review conditions with care, rigor and '
            + 'independent judgment. A doctoral work in private law and data-protection '
            + 'practice perspective contributed to the evidence that Decision '
            + 'Reconstruction Risk is detectable by independent experts.'
  },
  'vu2xpy61t2': {
    code: 'H-2026-17',
    study: 'detection',
    participant: 'V-AI-30',
    first: 'Andres',
    name: 'Andres Lage Freire',
    title: 'AI Governance Lead and Responsible AI Architect',
    org: '',
    order: 'named for completing the international detection study',
    citation: 'For completing the full 24-record set of the international detection study '
            + 'as an independent reviewer, reading every record cold and blind to the '
            + 'verified key, and applying the five review conditions with care, rigor and '
            + 'independent judgment. A EU AI Act and ISO 42001 implementation practice '
            + 'perspective contributed to the evidence that Decision Reconstruction Risk '
            + 'is detectable by independent experts.'
  },
  'rdj6ml8uq9': {
    code: 'H-2026-18',
    study: 'records-review',
    participant: 'RR-101',
    first: 'Boris',
    name: 'Boris Khazin',
    title: 'AI Governance, Digital Risk and GRC leader',
    org: 'ClearView MRI',
    order: 'named for completing the Records Review Study',
    citation: 'For participating as an independent reviewer in the Records Review Study '
            + 'and completing the review of all 24 records with care, rigor and '
            + 'independent judgment. A AI-governance and digital-risk perspective '
            + 'enriched the international reviewer panel.'
  },
  'dizf86mznv': {
    code: 'H-2026-19',
    study: 'records-review',
    participant: 'RR-104',
    first: 'Donavine',
    name: 'Donavine Smith, MBA',
    title: 'Chief Strategy and Transformation Officer',
    org: '',
    order: 'named for completing the Records Review Study',
    citation: 'For participating as an independent reviewer in the Records Review Study '
            + 'and completing the review of all 24 records with care, rigor and '
            + 'independent judgment. A executive strategy and AI-governance perspective '
            + 'enriched the international reviewer panel.'
  },
  'f54ch6u1qx': {
    code: 'H-2026-20',
    study: 'records-review',
    participant: 'RR-106',
    first: 'Nicholas',
    name: 'Nicholas Evans',
    title: 'AI Governance and Runtime Auditor',
    org: '',
    order: 'named for completing the Records Review Study',
    citation: 'For participating as an independent reviewer in the Records Review Study '
            + 'and completing the review of all 24 records with care, rigor and '
            + 'independent judgment. A adversarial and non-adversarial testing '
            + 'perspective enriched the international reviewer panel.'
  },
  'p8jiqz66lm': {
    code: 'H-2026-21',
    study: 'records-review',
    participant: 'RR-107',
    first: 'Tuneer',
    name: 'Tuneer Mondal',
    title: 'Consultant, Operations and AI Solutions',
    org: 'Arcadia Impact',
    order: 'named for completing the Records Review Study',
    citation: 'For participating as an independent reviewer in the Records Review Study '
            + 'and completing the review of all 24 records with care, rigor and '
            + 'independent judgment. A AI, health-technology, and governance perspective '
            + 'enriched the international reviewer panel.'
  },
  'v2d4bkrj9z': {
    code: 'H-2026-22',
    study: 'records-review',
    participant: 'RR-109',
    first: 'Mostafa',
    name: 'Mostafa Mahmoudi',
    title: 'Founder and Director',
    org: 'Iran Tech Diplomacy Institute',
    order: 'named for completing the Records Review Study',
    citation: 'For participating as an independent reviewer in the Records Review Study '
            + 'and completing the review of all 24 records with care, rigor and '
            + 'independent judgment. A AI-governance research and technology diplomacy '
            + 'perspective enriched the international reviewer panel.'
  },
  '2hl8luyhje': {
    code: 'H-2026-23',
    study: 'records-review',
    participant: 'RR-110',
    first: 'Jean-Luc',
    name: 'Jean-Luc Adade',
    title: 'Regional IT Leader, West, Central and North Africa',
    org: '',
    order: 'named for completing the Records Review Study',
    citation: 'For participating as an independent reviewer in the Records Review Study '
            + 'and completing the review of all 24 records with care, rigor and '
            + 'independent judgment. A IT-leadership and governance perspective enriched '
            + 'the international reviewer panel.'
  },
  '2v6vp7paa4': {
    code: 'H-2026-24',
    study: 'records-review',
    participant: 'RR-114',
    first: 'MacKenzie',
    name: 'MacKenzie McCowan',
    title: 'AI Governance Specialist',
    org: 'Atomi',
    order: 'named for completing the Records Review Study',
    citation: 'For participating as an independent reviewer in the Records Review Study '
            + 'and completing the review of all 24 records with care, rigor and '
            + 'independent judgment. A AI-governance and academic-appeals perspective '
            + 'enriched the international reviewer panel.'
  },
  'ig3u5w4awa': {
    code: 'H-2026-25',
    study: 'records-review',
    participant: 'RR-116',
    first: 'Eric',
    name: 'Dr. Eric J. W. Orlowski',
    title: 'Research Fellow',
    org: 'NUS AI Institute',
    order: 'named for completing the Records Review Study',
    citation: 'For participating as an independent reviewer in the Records Review Study '
            + 'and completing the review of all 24 records with care, rigor and '
            + 'independent judgment. A AI-governance, ethnographic, and technology-policy '
            + 'perspective enriched the international reviewer panel.'
  },
  '4bu6c3nq09': {
    code: 'H-2026-26',
    study: 'records-review',
    participant: 'RR-121',
    first: 'Sharon',
    name: 'Dr Sharon Licqurish, PhD',
    title: 'CEO and Chief Scientist',
    org: 'AIIP',
    order: 'named for completing the Records Review Study',
    citation: 'For participating as an independent reviewer in the Records Review Study '
            + 'and completing the review of all 24 records with care, rigor and '
            + 'independent judgment. A AI governance, research, and intellectual-property '
            + 'strategy perspective enriched the international reviewer panel.'
  },
  't6l3ofp0oc': {
    code: 'H-2026-27',
    study: 'records-review',
    participant: 'RR-123',
    first: 'Greg',
    name: 'Greg Searle',
    title: 'AI Governance and Model Behaviour Researcher',
    org: '',
    order: 'named for completing the Records Review Study',
    citation: 'For participating as an independent reviewer in the Records Review Study '
            + 'and completing the review of all 24 records with care, rigor and '
            + 'independent judgment. A AI-governance and model-behaviour research '
            + 'perspective enriched the international reviewer panel.'
  },
  'nvl0rhlc0c': {
    code: 'H-2026-28',
    study: 'records-review',
    participant: 'RR-124',
    first: 'Adesh',
    name: 'Adesh Sharma',
    title: 'Data and AI Governance Leader',
    org: 'Digital Frontier Partners',
    order: 'named for completing the Records Review Study',
    citation: 'For participating as an independent reviewer in the Records Review Study '
            + 'and completing the review of all 24 records with care, rigor and '
            + 'independent judgment. A enterprise data and AI governance perspective '
            + 'enriched the international reviewer panel.'
  },
  '0hrzl37w89': {
    code: 'H-2026-29',
    study: 'records-review',
    participant: 'RR-125',
    first: 'Muhammad',
    name: 'Muhammad Dauda',
    title: 'Programme leadership, sustainability and governance',
    org: 'UN SDSN Youth Nigeria',
    order: 'named for completing the Records Review Study',
    citation: 'For participating as an independent reviewer in the Records Review Study '
            + 'and completing the review of all 24 records with care, rigor and '
            + 'independent judgment. A program management, sustainability, and governance '
            + 'perspective enriched the international reviewer panel.'
  },
  'z6dh1slel4': {
    code: 'H-2026-30',
    study: 'records-review',
    participant: 'RR-126',
    first: 'Joseph',
    name: 'Joseph Mungai',
    title: 'Public-Interest Technology and AI Ethics Professional',
    org: 'Maasai Mara University',
    order: 'named for completing the Records Review Study',
    citation: 'For participating as an independent reviewer in the Records Review Study '
            + 'and completing the review of all 24 records with care, rigor and '
            + 'independent judgment. A public-interest technology, AI ethics, and '
            + 'governance perspective enriched the international reviewer panel.'
  },
  '96mt96wwaw': {
    code: 'H-2026-31',
    study: 'records-review',
    participant: 'RR-128',
    first: 'Sagarika',
    name: 'Sagarika Banerjee',
    title: 'AI Governance and Software QA Leader',
    org: '',
    order: 'named for completing the Records Review Study',
    citation: 'For participating as an independent reviewer in the Records Review Study '
            + 'and completing the review of all 24 records with care, rigor and '
            + 'independent judgment. A AI governance and software quality assurance '
            + 'perspective enriched the international reviewer panel.'
  },
  '4xupge4ll5': {
    code: 'H-2026-32',
    study: 'records-review',
    participant: 'RR-129',
    first: 'Wendy',
    name: 'Wendy Ann Martel',
    title: 'Data protection, privacy and AI governance',
    org: '',
    order: 'named for completing the Records Review Study',
    citation: 'For participating as an independent reviewer in the Records Review Study '
            + 'and completing the review of all 24 records with care, rigor and '
            + 'independent judgment. A data-protection, privacy, and AI-governance '
            + 'perspective enriched the international reviewer panel.'
  },
  'dm92vdhqpn': {
    code: 'H-2026-33',
    study: 'records-review',
    participant: 'RR-130',
    first: '',
    name: '',
    title: '',
    org: '',
    order: 'named for completing the Records Review Study',
    citation: 'For participating as an independent reviewer in the Records Review Study '
            + 'and completing the review of all 24 records with care, rigor and '
            + 'independent judgment. A independent professional perspective enriched the '
            + 'international reviewer panel.'
  },
  '1jww49m0eb': {
    code: 'H-2026-34',
    study: 'records-review',
    participant: 'RR-132',
    first: '',
    name: '',
    title: '',
    org: '',
    order: 'named for completing the Records Review Study',
    citation: 'For participating as an independent reviewer in the Records Review Study '
            + 'and completing the review of all 24 records with care, rigor and '
            + 'independent judgment. A independent professional perspective enriched the '
            + 'international reviewer panel.'
  }
};

function json(o, s){
  return new Response(JSON.stringify(o), {
    status: s || 200,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
  });
}
function clean(v, n){ return (v == null ? '' : String(v)).trim().slice(0, n || 200); }

export default async function handler(req){
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }});
  }

  const env = (typeof process !== 'undefined' && process.env) || {};
  const SERVICE = env.SUPABASE_SERVICE_ROLE_KEY || '';

  const url = new URL(req.url);
  const key = clean(url.searchParams.get('k'), 40);
  const person = ROSTER[key];

  // GET returns only this person's own defaults. An unknown key returns nothing
  // about anyone, so a guessed link is a dead end rather than a directory.
  if (req.method === 'GET') {
    if (!person) return json({ ok: false, found: false }, 404);

    // Link-open ping. Same reason as /api/contributor: without it an honor link
    // that has not been accepted is indistinguishable from one nobody opened.
    // Records the honor code and never the key, so the event log cannot be
    // turned back into a set of working links. Best-effort, and silent on
    // failure, so a telemetry problem never stops an honoree seeing their
    // citation.
    const tsrc = String(url.searchParams.get('src') || '').toLowerCase();
    // ?src=owner or ?owner=1 suppresses the log, so Phillip can open any link to
    // check it without inflating a figure a buyer will read as external engagement.
    const isCheck = tsrc === 'owner' || url.searchParams.get('owner') === '1' || tsrc === 'verify' || tsrc === 'test' || tsrc === 'selftest' || tsrc.indexOf('deploytest') === 0;
    if (SERVICE && !isCheck) {
      try {
        const ua = String(req.headers.get('user-agent') || '').slice(0, 300);
        await fetch(SB + '/rest/v1/interaction_events', {
          method: 'POST',
          headers: { 'apikey': SERVICE, 'Authorization': 'Bearer ' + SERVICE,
                     'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
          body: JSON.stringify({ source: 'honor-link', type: 'view', payload: {
            honor_code: person.code,
            study: person.study,
            country: String(req.headers.get('x-vercel-ip-country') || '')
              .toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2) || '',
            user_agent: ua,
            is_mobile: /Mobi|Android|iPhone|iPad|iPod|Windows Phone|IEMobile|BlackBerry|Opera Mini/i.test(ua)
          }})
        });
      } catch (e) { /* never block the page */ }
    }

    return json({
      ok: true, found: true,
      honor: HONOR_NAME, year: HONOR_YEAR,
      code: person.code, first: person.first, name: person.name,
      title: person.title, org: person.org, order: person.order,
      study: person.study, participant: person.participant || '',
      citation: person.citation
    });
  }

  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  if (!person) return json({ error: 'unknown_link' }, 404);
  if (!SERVICE) return json({ error: 'service_key_missing' }, 503);

  let b; try { b = await req.json(); } catch(e){ return json({ error: 'invalid_json' }, 400); }

  const name  = clean(b.name, 200) || person.name;
  const title = clean(b.title, 300) || person.title;
  const email = clean(b.email, 200);
  const org   = clean(b.organization, 200) || person.org;
  const quote = clean(b.quote, 1200);

  if (!email || email.indexOf('@') < 1 || email.indexOf('.') < 0) {
    return json({ error: 'valid_email_required' }, 400);
  }
  if (b.consent_core !== true) return json({ error: 'consent_required' }, 400);

  const geo = String(req.headers.get('x-vercel-ip-country') || '')
    .toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2) || '';

  const payload = {
    kind: 'honor-accept',
    honor: HONOR_NAME,
    year: HONOR_YEAR,
    honor_code: person.code,
    study: person.study,
    participant_code: person.participant || '',
    printed_name: name,
    printed_title: title,
    organization: org,
    country: geo,
    quote: quote,
    quote_clearance: b.quote_clearance === true,
    byline_ok: b.byline_ok === true,
    consent_contact: true,
    consent_transfer: true,
    consent_public_list: b.consent_public_list === true,
    ts: new Date().toISOString()
  };

  const H = {
    'apikey': SERVICE,
    'Authorization': 'Bearer ' + SERVICE,
    'Content-Type': 'application/json',
    'Prefer': 'return=minimal'
  };

  const res = await fetch(SB + '/rest/v1/pilot_contacts', {
    method: 'POST', headers: H,
    body: JSON.stringify({
      name: name, email: email, organization: org,
      message: JSON.stringify(payload), source: 'honor-accept'
    })
  });
  if (!res.ok) {
    const t = await res.text();
    return json({ error: 'db_insert_failed', status: res.status, detail: String(t).slice(0, 300) }, 502);
  }

  return json({
    ok: true,
    honor: HONOR_NAME, year: HONOR_YEAR,
    code: person.code,
    printed_name: name,
    printed_title: title,
    citation: person.citation
  });
}
