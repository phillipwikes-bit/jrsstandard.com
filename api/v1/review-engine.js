export { config } from '../_controlled-review.js';
import { unavailable } from '../_controlled-review.js';

export default async function handler(req) {
  return unavailable(req, { apiVersion: true });
}
