export { config } from './_controlled-review.js';
import { unavailable } from './_controlled-review.js';

export default async function handler(req) {
  return unavailable(req, {
    error: 'study_runner_disabled',
    detail: 'The study runner is disabled. No model call, database write, or study publication is performed from this route.',
    methods: ['GET', 'POST']
  });
}
