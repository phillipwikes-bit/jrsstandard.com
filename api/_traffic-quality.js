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
