export { config } from './_controlled-review.js';
import { unavailable } from './_controlled-review.js';

export default async function handler(req, res) {
  return unavailable(req, res, {
    error: 'pilot_intake_unavailable',
    detail: 'The public pilot intake is closed. No record, result, or contact data is accepted through this route.'
  });
}
