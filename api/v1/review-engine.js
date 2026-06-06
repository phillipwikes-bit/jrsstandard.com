// Versioned route for the JRS Review Engine.
// Re-exports the canonical implementation so there is a single source of truth.
// Stable path for partner integrations: POST /api/v1/review-engine
export { config, default } from '../review-engine.js';
