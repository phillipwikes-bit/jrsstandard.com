export { config } from './_controlled-review.js';
import { unavailable } from './_controlled-review.js';

export default async function handler(req, res) {
  return unavailable(req, res, {
    error: 'engine_activity_unavailable',
    detail: 'The engine activity route is disabled. No record-derived activity is exposed.',
    methods: ['GET']
  });
}
