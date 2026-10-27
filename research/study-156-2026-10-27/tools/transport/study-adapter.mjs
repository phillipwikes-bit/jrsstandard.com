// 156-record study: capture-to-candidate adapter for a future live run (offline-tested only).
// Reads a write-once capture, classifies the provider response, extracts the candidate text by block type, and
// pairs the capture with the frozen versions before any replay. Nothing is repaired; the first failure classifies.
//   S1 status not 200            -> provider_error
//   S2 stop_reason refusal       -> model_refusal (no retry, no other model: Haiku 5.5 has no server-side fallback)
//   S3 stop_reason max_tokens    -> response_truncated
//   S4 other stop_reason         -> unexpected_stop_reason
//   S5 content blocks: thinking blocks are kept in the capture and ignored; exactly one text block is required
//   S6 text larger than 64 KiB   -> response_too_large
//   S7 empty text                -> empty_response
//   S8 model in the body differs from the authorized model -> model_identifier_mismatch
// Pairing: the capture's body hash, sender version, candidate manifest and prompt hash must equal the frozen values.
import { createHash } from 'node:crypto';
export const ADAPTER_VERSION = '0.3.0-study-offline';
export const MAX_TEXT_BYTES = 64 * 1024;
const sha = (s) => createHash('sha256').update(s).digest('hex');

export function extractCandidate(capture, expectedModel) {
  if (!capture || capture.status !== 200) return { ok: false, step: 'S1', code: 'provider_error' };
  let body; try { body = JSON.parse(capture.response_body); } catch { return { ok: false, step: 'S1', code: 'response_body_not_json' }; }
  if (body.stop_reason === 'refusal') return { ok: false, step: 'S2', code: 'model_refusal', category: body.stop_details && body.stop_details.category || null };
  if (body.stop_reason === 'max_tokens') return { ok: false, step: 'S3', code: 'response_truncated' };
  if (body.stop_reason !== 'end_turn') return { ok: false, step: 'S4', code: 'unexpected_stop_reason:' + body.stop_reason };
  const blocks = Array.isArray(body.content) ? body.content : [];
  const texts = blocks.filter((b) => b && b.type === 'text');
  const other = blocks.filter((b) => b && b.type !== 'text' && b.type !== 'thinking' && b.type !== 'redacted_thinking');
  if (texts.length !== 1 || other.length) return { ok: false, step: 'S5', code: 'unexpected_content_blocks', blocks: blocks.map((b) => b && b.type) };
  const text = texts[0].text;
  if (typeof text !== 'string') return { ok: false, step: 'S5', code: 'text_block_without_text' };
  if (Buffer.byteLength(text, 'utf8') > MAX_TEXT_BYTES) return { ok: false, step: 'S6', code: 'response_too_large' };
  if (!text.trim()) return { ok: false, step: 'S7', code: 'empty_response' };
  if (body.model !== expectedModel) return { ok: false, step: 'S8', code: 'model_identifier_mismatch' };
  return { ok: true, text, usage: body.usage || null, thinking_blocks: blocks.filter((b) => b.type === 'thinking' || b.type === 'redacted_thinking').length };
}

// frozen: { sender_version, body_sha256, candidate_manifest_sha256, prompt_sha256 }; record: the capture's journal entry.
export function pairCapture(captureText, journalEntry, frozen) {
  const p = [];
  if (sha(captureText) !== journalEntry.capture_sha256) p.push('capture_hash_mismatch');
  let c; try { c = JSON.parse(captureText); } catch { return ['capture_unparseable']; }
  if (c.request_id !== journalEntry.request_id) p.push('request_id_mismatch');
  if (c.sender_version !== frozen.sender_version) p.push('sender_version_incompatible');
  if (c.body_sha256 !== frozen.body_sha256) p.push('request_body_differs_from_frozen_request');
  if (frozen.candidate_manifest_sha256 !== frozen.expected_candidate_manifest_sha256) p.push('candidate_version_incompatible');
  if (frozen.prompt_sha256 !== frozen.expected_prompt_sha256) p.push('prompt_version_incompatible');
  return p;
}
