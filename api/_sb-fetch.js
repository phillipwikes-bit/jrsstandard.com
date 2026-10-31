// Paginated PostgREST reader.
//
// WHY THIS EXISTS. Supabase caps every REST response at 1,000 rows. The cap is
// applied AFTER the query's own `limit`, it is not an error, and the response
// carries no marker saying it happened: a request for `limit=20000` against a
// 1,031-row table returns 1,000 rows and HTTP 200. Every caller that summed
// those rows therefore reported a number that was silently short, and stayed
// plausible while being wrong.
//
// HOW IT SURFACED. The Investigator Guide download chart stopped at 31 August
// while the database held rows through 7 September. The guide total read 137
// against 145 in the table, a gap of exactly the eight September rows. Rows are
// returned in physical order with no `order` clause, so the rows lost are the
// most recently inserted: the failure always hides the newest data, which is
// the data anyone is actually looking at. The dashboard did not look broken. It
// looked quiet.
//
// THE FIX IS PAGING, NOT A BIGGER LIMIT. A larger `limit` cannot defeat a
// server-side cap. Range headers walk the whole result instead, and the loop
// ends when a page comes back short, so it costs one request on small tables
// and does not need to know any total in advance.
const PAGE = 1000;

// A hard ceiling so a runaway table cannot turn one dashboard request into an
// unbounded read. 100 pages is 100,000 rows, far above anything here, and
// truncation at that point is reported rather than hidden.
const MAX_PAGES = 100;

export async function fetchAll(base, path, headers) {
  const url = base + '/rest/v1/' + path;
  const out = [];
  for (let page = 0; page < MAX_PAGES; page++) {
    const from = page * PAGE, to = from + PAGE - 1;
    let batch;
    try {
      const r = await fetch(url, {
        headers: Object.assign({}, headers, {
          'Range-Unit': 'items',
          'Range': from + '-' + to
        })
      });
      // A partial-content 206 is the normal response to a Range request; 200 is
      // returned when the range covers the whole result. Both are successes.
      if (!r.ok && r.status !== 206) return { rows: out, complete: false };
      batch = await r.json();
    } catch (e) {
      return { rows: out, complete: false };
    }
    if (!Array.isArray(batch)) return { rows: out, complete: false };
    for (const row of batch) out.push(row);
    // A short page is the last page. This is the only stop condition that does
    // not depend on the caller knowing the row count up front.
    if (batch.length < PAGE) return { rows: out, complete: true };
  }
  return { rows: out, complete: false };
}

// A caller asking for rows rather than an explicit completeness flag must
// NEVER receive a partial array. The fetchAll() result still supports
// explicit failure handling, but wrappers throw on incomplete/unavailable.
export async function fetchAllRows(base, path, headers) {
  const { rows, complete } = await fetchAll(base, path, headers);
  if (!complete) throw new Error('source_read_incomplete');
  return rows;
}

// Full-URL variant, for the callers that assemble the whole REST URL as a
// string before fetching. Any `limit` already in the query is stripped: it was
// only ever there to mean "everything", the server never honoured it above the
// cap, and leaving it in place would fight the Range header.
export async function fetchAllUrl(url, headers) {
  const clean = String(url)
    .replace(/([?&])limit=\d+&/g, '$1')
    .replace(/[?&]limit=\d+$/g, '');
  const cut = clean.indexOf('/rest/v1/');
  // An invalid source path is not evidence of an empty dataset.
  if (cut < 0) throw new Error('source_url_invalid');
  const { rows, complete } = await fetchAll(clean.slice(0, cut),
                                            clean.slice(cut + '/rest/v1/'.length),
                                            headers);
  if (!complete) throw new Error('source_read_incomplete');
  return rows;
}
