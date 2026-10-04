export { config } from '../_controlled-review.js';
import { unavailable } from '../_controlled-review.js';

export default async function handler(req, res) {
  return unavailable(req, res, { apiVersion: true });
}
