export { config } from './_controlled-review.js';
import { unavailable } from './_controlled-review.js';

export default async function handler(req, res) {
  return unavailable(req, res, {
    error: 'bench_admin_unavailable',
    detail: 'The benchmark administration route is disabled. No study record or reviewer data is returned or accepted.',
    methods: ['GET', 'POST']
  });
}
