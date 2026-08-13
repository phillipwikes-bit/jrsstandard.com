// IS THIS REQUEST A HUMAN CLICK, OR A BROWSER FETCHING THE LINK BY ITSELF?
//
// WHY THIS EXISTS. On 2026-08-13 six endorsements were recorded from four
// countries and produced ZERO arrivals on the screen every one of them redirects
// to. An endorsement is written server-side the instant /api/support is fetched;
// the arrival is written by the destination page. Six fetches with no page load
// is not six people. It is the browser fetching the link without navigating.
//
// Chrome, Firefox and Safari all prefetch, preload and prerender links, and they
// send a browser user agent while doing it, which is exactly why the crawler
// regex never caught this. The signal is a REQUEST HEADER, not the agent string.
//
// This is the same defect class as the 14:04Z cluster on 2026-08-12: four
// endorsements in one minute covering all four link placements, with no arrival.
// The cookie deduplication added that day could not help, because a prefetch
// carries no prior cookie and each campaign has its own marker.
//
// TOKEN-LESS: three header reads. No dependency, no key, no state.

// Sec-Purpose is the current standard (Chrome, Edge). Purpose: prefetch is the
// older form still sent by some versions. X-Moz is Firefox. X-Purpose is Safari
// and older WebKit. A miss defaults to "this is a real click", so a browser that
// sends nothing is treated as a person rather than silently dropped.
const PREFETCH_HEADERS = ['sec-purpose', 'purpose', 'x-moz', 'x-purpose'];
const PREFETCH_VALUES = /prefetch|prerender|preview|preload/i;

/**
 * True when the request is the browser fetching a link on its own behalf.
 * Callers must still serve the response: only the COUNT is protected, so a
 * prefetched link still works normally when the reader actually clicks it.
 */
export function isNotAClick(req){
  for (let i = 0; i < PREFETCH_HEADERS.length; i++){
    const v = req.headers.get(PREFETCH_HEADERS[i]);
    if (v && PREFETCH_VALUES.test(v)) return true;
  }
  // Sec-Fetch-Dest tells us what the result will be used for. A real link click
  // produces "document". "empty" on a navigational endpoint means something
  // fetched it programmatically.
  const dest = req.headers.get('sec-fetch-dest');
  const mode = req.headers.get('sec-fetch-mode');
  if (dest === 'empty' && mode !== 'navigate') return true;
  return false;
}

/** The header that triggered the decision, for the diagnostic payload. */
export function prefetchReason(req){
  for (let i = 0; i < PREFETCH_HEADERS.length; i++){
    const v = req.headers.get(PREFETCH_HEADERS[i]);
    if (v && PREFETCH_VALUES.test(v)) return PREFETCH_HEADERS[i] + '=' + String(v).slice(0, 40);
  }
  const dest = req.headers.get('sec-fetch-dest');
  if (dest === 'empty') return 'sec-fetch-dest=empty';
  return '';
}
