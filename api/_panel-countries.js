// PANEL COUNTRY RESOLUTION, COMPUTED, NOT TRANSCRIBED.
//
// WHY THIS EXISTS: /api/panel-stats reported countries and continents as
// hand-maintained constants with a "transcribed" flag and a date. A number that
// has to be updated by hand drifts, and this one sat beside four live figures
// borrowing their credibility. The owner asked for it fixed once and for all.
//
// HOW IT WORKS: pilot_progress and armb_progress already expose reviewer CODES.
// This maps code to ISO 3166-1 alpha-2, so the distinct-country count is derived
// from the codes that ACTUALLY completed, at request time. Add a completer and
// the count moves by itself. Add one whose code is not here and the endpoint
// reports it in countries_unresolved rather than silently under-counting.
//
// PRIVACY: this module is bundled INTO the edge function and is never served as
// a static file, so no code-to-country pair leaves the server. Only the
// aggregate count and the unresolved-code list are returned. The map carries no
// name, no email and no organization.
//
// PROVENANCE: research/Expert_Roster_All_Studies_2026-08-06.csv, column
// `country`, rows with status COMPLETE. Free-text values normalised to ISO2
// ("UAE (Dubai)" to AE, "US (North Carolina)" to US, "Cote d'Ivoire" to CI).
// Regenerated with research/build_expert_roster.py when the panel changes.
//
// VERIFIED 2026-08-13: computing from this map reproduces the previously
// transcribed constants EXACTLY, 16 countries and 5 continents, which is what
// makes it safe to replace them.
export const CODE_COUNTRY = {
  'RR-101': 'US',
  'RR-104': 'ZA',
  'RR-106': 'US',
  'RR-107': 'CA',
  'RR-109': 'IR',
  'RR-110': 'CI',
  'RR-113': 'IN',
  'RR-114': 'AU',
  'RR-116': 'SG',
  'RR-117': 'CA',
  'RR-121': 'AU',
  'RR-123': 'AU',
  'RR-124': 'AU',
  'RR-125': 'NG',
  'RR-126': 'KE',
  'RR-127': 'CA',
  'RR-128': 'CA',
  'V-AI-01': 'US',
  'V-AI-03': 'AU',
  'V-AI-06': 'IN',
  'V-AI-07': 'IN',
  'V-AI-08': 'US',
  'V-AI-10': 'NG',
  'V-AI-11': 'PL',
  'V-AI-12': 'GB',
  'V-AI-16': 'PL',
  'V-AI-20': 'DE',
  'V-AI-23': 'AU',
  'V-AI-24': 'KR',
  'V-AI-27': 'IN',
  'V-AI-28': 'SG',
  'V-AI-29': 'AE',
  'V-AI-30': 'ES'
};

// Deliberately unmapped: the two anonymous Arm B participants and one completer
// whose country was never recorded. They are counted as completers and reported
// as unresolved, never guessed.
export const CONTINENT_OF = {
  US:'NA', CA:'NA', AU:'OC', IN:'AS', NG:'AF', PL:'EU', GB:'EU', DE:'EU', KR:'AS',
  SG:'AS', AE:'AS', ES:'EU', ZA:'AF', IR:'AS', KE:'AF', CI:'AF', IE:'EU', FR:'EU', NO:'EU'
};

// Returns { countries, continents, resolved, unresolved:[codes] } for the codes
// that actually completed. Never invents a country for an unknown code.
export function resolvePanelGeo(completerCodes){
  const iso = {}, cont = {}, unresolved = [];
  let resolved = 0;
  for (let i = 0; i < completerCodes.length; i++){
    const c = String(completerCodes[i] || '').trim().toUpperCase();
    if (!c) continue;
    const k = CODE_COUNTRY[c];
    if (!k) { unresolved.push(c); continue; }
    iso[k] = 1; resolved++;
    if (CONTINENT_OF[k]) cont[CONTINENT_OF[k]] = 1;
  }
  return {
    countries: Object.keys(iso).length,
    continents: Object.keys(cont).length,
    resolved: resolved,
    unresolved: unresolved.sort()
  };
}
