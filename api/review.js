// Retired experimental review endpoint. Fail closed and do not accept records.
function unavailable(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Allow', 'GET, HEAD, OPTIONS');
  return res.status(410).json({
    error: 'unavailable',
    message: 'No online record processing. Use the JRS manual review resources.'
  });
}
export default function handler(req, res) {
  return unavailable(req, res);
}
