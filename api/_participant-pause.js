// Temporary containment: participant keys are present in public repository
// history. No key from that history can authenticate a participant until
// replacement credentials and an independent verification process are ready.
export function participantLinkPaused() {
  return new Response(JSON.stringify({
    error: 'participant_link_unavailable',
    detail: 'This participant link is temporarily unavailable. Contact info@jrsstandard.com for assistance.'
  }), {
    status: 503,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex, nofollow'
    }
  });
}
