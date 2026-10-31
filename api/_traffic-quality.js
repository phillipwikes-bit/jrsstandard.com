// Shared declared-crawler heuristic for aggregate interaction-event readers.
// This is a user-agent screen, NOT a unique-person count or proof of human use.
// Historical requests without user_agent must remain explicitly unclassified.
export const CRAWLER = /googlebot|bingbot|baiduspider|yandexbot|duckduckbot|applebot|GoogleOther|bingpreview|facebookexternalhit|bot|spider|crawl|slurp|preview|headless|python-requests|curl|wget/i;

export function isCrawler(p) {
  return CRAWLER.test(String((p || {}).user_agent || ''));
}

export function classifyDownloadTraffic(p) {
  const ua = String((p || {}).user_agent || '').trim();
  if (!ua) return 'user_agent_missing';
  return CRAWLER.test(ua) ? 'declared_crawler' : 'not_identified_as_crawler';
}

// Use a single source-tag rule for historic metric reconstruction. Internal
// verification remains recorded separately, never deleted during normal traffic.
export function isInternalTestSource(src) {
  const s = String(src || '');
  return s === 'verify' || s === 'test' || s === 'selftest' || s.startsWith('deploytest');
}

export function isCurrentDownloadResource(row) {
  if (!row || !['guide-dl', 'pdf-dl', 'kit-dl'].includes(row.source)) return false;
  const p = row.payload || {};
  if (isInternalTestSource(p.src)) return false;
  if (row.source === 'kit-dl') {
    return p.file === 'JRS_Rapid_Review_Card.pdf' ||
      p.file === 'JRS_Investigator_Field_Guide.pdf' ||
      p.file === 'JRS-Reference-9d4f2a7c.pdf';
  }
  return true;
}
