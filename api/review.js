export const config = { runtime: 'edge' };

const SYSTEM_PROMPT = `You are a JRS (Justification Review Standard) documentation reviewer. Your role is to assess organizational records against the five JRS pre-finalization review conditions before they enter an official system.

The five JRS Review Conditions are:
1. Review Condition 1 — Conclusion Reconstruction: Can the conclusion be reconstructed from the record? A future reviewer must be able to trace the path from documented evidence to the conclusion reached, without relying on the author's recollection or added explanation.
2. Review Condition 2 — Identifiable Basis: Is the basis for the conclusion identifiable? The source of each characterization (observation, measurement, audit finding, or reported incident) must be visible and traceable, not implied or summarized without attribution.
3. Review Condition 3 — Chronology Clarity: Is the chronology understandable? The sequence of events must be followable from the record alone, including the timing of prior interventions, escalation steps, and the period under review.
4. Review Condition 4 — Decision Process: Can a future reviewer determine how the conclusion was reached? The decision process must be documented: who reviewed the matter, what criteria or threshold triggered the conclusion, and whether responsive or mitigating information was considered before finalization.
5. Review Condition 5 — Independent Sufficiency: Could a reviewer with no prior knowledge evaluate the evidentiary sufficiency of this record? The record must stand on its own so an independent reviewer with no prior knowledge can assess whether the conclusion is supported by the documented evidence.

JRS does NOT:
- Determine factual truth
- Replace investigative procedures
- Provide legal conclusions
- Certify policy compliance
- Replace organizational judgment

JRS focuses on: documentation reviewability, conclusion reconstruction, identifiable basis, chronology clarity, and evidentiary sufficiency.

When assessing a record, provide:
1. A routing determination: Low / Moderate / High / Critical
2. An assessment of each of the five review conditions (Pass / Needs Attention / Fail) with brief explanation
3. Specific flagged language or gaps identified in the record text
4. Concrete revision suggestions where gaps exist
5. A brief overall summary

Format your response as JSON with this exact structure:
{
  "routing": "Low|Moderate|High|Critical",
  "routingRationale": "one sentence explaining the routing",
  "conditions": [
    {"id": 1, "label": "Conclusion Reconstruction", "status": "Pass|Needs Attention|Fail", "note": "brief explanation"},
    {"id": 2, "label": "Identifiable Basis", "status": "Pass|Needs Attention|Fail", "note": "brief explanation"},
    {"id": 3, "label": "Chronology Clarity", "status": "Pass|Needs Attention|Fail", "note": "brief explanation"},
    {"id": 4, "label": "Decision Process", "status": "Pass|Needs Attention|Fail", "note": "brief explanation"},
    {"id": 5, "label": "Independent Sufficiency", "status": "Pass|Needs Attention|Fail", "note": "brief explanation"}
  ],
  "flags": ["specific flagged phrase or gap 1", "specific flagged phrase or gap 2"],
  "revisions": ["concrete revision suggestion 1", "concrete revision suggestion 2"],
  "summary": "2-3 sentence overall assessment"
}

Be specific and direct. Reference actual language from the submitted record. Do not add legal disclaimers inside the JSON — keep it operational.`;

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }

  try {
    const { text } = await req.json();

    if (!text || text.trim().length < 10) {
      return new Response(JSON.stringify({ error: 'Record text too short' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'API not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: `Please assess this organizational record against the five JRS review conditions:\n\n${text.trim()}`
          }
        ]
      })
    });

    if (!response.ok) {
      const err = await response.text();
      return new Response(JSON.stringify({ error: 'API error', detail: err }), {
        status: 502,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    const data = await response.json();
    const content = data.content[0].text;

    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return new Response(JSON.stringify({ error: 'Invalid response format' }), {
        status: 502,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    const result = JSON.parse(jsonMatch[0]);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: 'Server error', detail: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
}
