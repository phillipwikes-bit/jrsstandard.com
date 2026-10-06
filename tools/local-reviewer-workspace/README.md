# Local reviewer workspace

**Local and offline. Internal only. Not deployed** (`tools/` is excluded by `.vercelignore`). It shows a reviewer packet already produced by the local Engine candidate and lets a person record their own dispositions. It does not run the Engine, decide anything, or send anything anywhere. Tested on synthetic fixtures only. It satisfies no release gate. Rules and design: `docs/architecture/LOCAL_REVIEWER_WORKSPACE_PROTOCOL.md`.

## Use
1. Start it: `node tools/local-reviewer-workspace/serve.mjs` (loopback only; `--port N` to change the port). Open `http://127.0.0.1:4317/`.
2. Choose a reviewer packet JSON file on your computer, and optionally the source text so every quotation anchor can be checked against it. Then press **Check and open**. Or press **Open the synthetic demo packet**.
3. Read the four sections. Record a disposition for every finding in **Human review**, ticking the acknowledgement that it applies only to this packet.
4. Enter your reviewer reference and the review date, confirm the statement, and press **Sign off**. Then press **Export disposition record (JSON)**.
5. Check an export later: `node tools/local-reviewer-workspace/verify-export.mjs <record.json> <packet.json>`.

Nothing is saved. Closing the window discards the session unless you exported it.

**Confidentiality:** a packet can contain quotations from the record. Handle the packet, the window and any export as you would the record.

## Files
| File | Role |
|---|---|
| `app/index.html`, `app/workspace.css`, `app/workspace.js` | The page. It renders text only and keeps the session in memory only. |
| `app/core.js` | Packet checks, the session, sign-off, export and export verification. Shared by the page and the tools. |
| `app/demo-packet.js` | The generated SYNTHETIC demonstration packet |
| `serve.mjs` | Loopback-only static server, with `connect-src 'none'` |
| `verify-export.mjs` | Verifies an exported disposition record against its packet |
| `make-demo-packet.mjs` | Rebuilds the demonstration packet from the SYNTHETIC-SAE-03 fixture and the mock adapter |

Tests: `node tests/local-reviewer-workspace/run-all.mjs`. The browser checks use Playwright with a local Chromium when it is installed. If it is not, they are reported as SKIPPED, not passed.
