// Private Programme Status source classification. Only purpose-specific
// source fields, never identities or download activity, determine the group.
// This module does not grant contact, transfer, publication or sales consent.
const PUBLIC = new Set(['guide-register','support-register','support']);
const TRAINING = new Set(['training-enroll','training-complete']);
const RESEARCH = new Set([
  'pilot','contributor-confirm','reviewer-eval-incentive',
  'reviewer-cert','honor-accept'
]);
const ORGANIZATIONS = new Set(['org-pilot']);
const COMMERCIAL_LEGACY = new Set([
  'checkout-fallback','enterprise-inquiry'
]);
export const GROUPS = Object.freeze({
  public: 'Free resources and community',
  training: 'Training and reviewer learning',
  research: 'Research and validation',
  organizations: 'Organization participation',
  enquiries: 'General and other enquiries',
  commercial: 'Private commercial enquiries',
  other: 'Unclassified historical source'
});
export function participantGroup(source,payload={}) {
  const src=String(source||'');
  const p=payload && typeof payload==='object' && !Array.isArray(payload) ? payload : {};
  if(PUBLIC.has(src))return GROUPS.public;
  if(TRAINING.has(src))return GROUPS.training;
  if(RESEARCH.has(src))return GROUPS.research;
  if(ORGANIZATIONS.has(src))return GROUPS.organizations;
  if(COMMERCIAL_LEGACY.has(src))return GROUPS.commercial;
  if(src==='site-inquiry') {
    const cat=String(p.category||'');
    if(cat==='commercial')return GROUPS.commercial;
    if(cat==='research')return GROUPS.research;
    if(cat==='training')return GROUPS.training;
    if(cat==='organization')return GROUPS.organizations;
    return GROUPS.enquiries;
  }
  return GROUPS.other;
}
// An absent permission value is UNKNOWN, not 'no' and never implied 'yes'.
// Positive consent for one particular activity remains restricted to its source.
export function permissionState(payload,keys) {
  const p=payload&&typeof payload==='object'&&!Array.isArray(payload)?payload:{};
  for(const key of keys)if(p[key]===true)return 'recorded-yes';
  for(const key of keys)if(p[key]===false)return 'recorded-no';
  return 'not-recorded';
}
