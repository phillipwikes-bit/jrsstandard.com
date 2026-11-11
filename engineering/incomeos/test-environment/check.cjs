"use strict";
// IncomeOS free test environment: checks the staged workspace-revision design
// against a real, disposable Supabase stack (Auth, REST API, Postgres) running
// on this machine. It refuses any address that is not this machine, so it can
// never reach the live IncomeOS project. Synthetic identities and data only.
const {createHash, randomBytes} = require("node:crypto");
const {appendFileSync} = require("node:fs");
const {execFileSync} = require("node:child_process");
const {createTransport} = require("../../../tests/incomeos-browser-script-loader.cjs")(
  "revision-supabase-transport.js", "IncomeOSSupabaseRevisionTransport");

const LOCAL = /^http:\/\/(127\.0\.0\.1|localhost):\d{2,5}$/;
const api = process.env.API_URL || "";
const anonKey = process.env.ANON_KEY || "";
const serviceKey = process.env.SERVICE_ROLE_KEY || "";
if (!LOCAL.test(api)) { console.error("Refused: API_URL must be a Supabase stack on this machine (http://127.0.0.1:<port>)."); process.exit(2); }
const db = process.env.DB_URL || "";
if (!/^postgres(ql)?:\/\/[^@/]+@(127\.0\.0\.1|localhost):\d{2,5}\/[a-z_]+$/.test(db)) { console.error("Refused: DB_URL must be the local stack's database on this machine."); process.exit(2); }
if (!anonKey || !serviceKey) { console.error("Refused: ANON_KEY and SERVICE_ROLE_KEY of the local stack are required."); process.exit(2); }

// The staged client only accepts an https://<ref>.supabase.co address. That
// rule is left intact: requests to this placeholder are delivered to the
// local stack instead, and to nowhere else.
const PLACEHOLDER = "https://incomeoslocaltestonly.supabase.co";
function localFetch(observe) {
  return async (url, options) => {
    if (!String(url).startsWith(PLACEHOLDER + "/")) throw Error("Unexpected request target");
    const response = await fetch(api + String(url).slice(PLACEHOLDER.length), options);
    if (observe) observe(response);
    return response;
  };
}
async function json(path, init) {
  const response = await fetch(api + path, init);
  const text = await response.text();
  let body = null; try { body = text ? JSON.parse(text) : null; } catch { body = text; }
  return {status: response.status, ok: response.ok, body};
}
const admin = {apikey: serviceKey, Authorization: "Bearer " + serviceKey, "Content-Type": "application/json"};
async function createIdentity(label) {
  const email = `${label}-${randomBytes(6).toString("hex")}@incomeos-test.invalid`;
  const password = randomBytes(18).toString("base64url");
  const made = await json("/auth/v1/admin/users", {method: "POST", headers: admin,
    body: JSON.stringify({email, password, email_confirm: true})});
  if (!made.ok || !made.body || !made.body.id) throw Error(`Could not create synthetic identity (HTTP ${made.status})`);
  return {id: made.body.id, email, password};
}
async function signIn(identity, password = identity.password) {
  return json("/auth/v1/token?grant_type=password", {method: "POST",
    headers: {apikey: anonKey, "Content-Type": "application/json"},
    body: JSON.stringify({email: identity.email, password})});
}
function envelope() {
  const text = JSON.stringify({format: "incomeos-workspace", version: 1, kdf: "PBKDF2-SHA256", iterations: 600000,
    cipher: "AES-256-GCM", salt: randomBytes(16).toString("base64"), iv: randomBytes(12).toString("base64"),
    data: randomBytes(48).toString("base64")});
  return {encrypted_payload: text, payload_sha256: createHash("sha256").update(text, "utf8").digest("hex")};
}
const client = (token, fetchImpl = localFetch()) =>
  createTransport({url: PLACEHOLDER, key: anonKey, getToken: async () => token, fetch: fetchImpl, timeoutMs: 20000});
async function refusal(promise) {
  try { await promise; return null; } catch (error) { return error; }
}

const results = [];
async function check(title, plain, run) {
  try { const detail = await run(); results.push({ok: true, title, plain, detail: detail || ""}); }
  catch (error) { results.push({ok: false, title, plain, detail: String(error && error.message || error).slice(0, 300)}); }
}
function expect(condition, message) { if (!condition) throw Error(message); }

(async () => {
  let owner, stranger, ownerToken, strangerToken, first, second;
  await check("Two test accounts", "Two made-up accounts are created in the test sign-in service.", async () => {
    owner = await createIdentity("owner"); stranger = await createIdentity("stranger");
  });
  if (!owner || !stranger) return finish();
  await check("Owner approved", "Only the owner account is put on the approved list, the way an operator would do it in the database.", async () => {
    expect(/^[0-9a-f-]{36}$/.test(owner.id), "Unexpected identity format");
    execFileSync("psql", [db, "-X", "-q", "-v", "ON_ERROR_STOP=1", "-c",
      `insert into incomeos_private.allowed_owners(user_id) values ('${owner.id}')`], {stdio: ["ignore", "ignore", "pipe"]});
  });
  await check("API ready", "The test API has loaded the save and read functions.", async () => {
    for (let attempt = 0; attempt < 30; attempt++) {
      const probe = await json("/rest/v1/rpc/incomeos_latest_workspace_revision", {method: "POST",
        headers: {apikey: anonKey, Authorization: "Bearer " + anonKey, "Content-Type": "application/json"}, body: "{}"});
      if (probe.status !== 404) return;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    throw Error("The API never exposed the functions");
  });
  await check("Wrong password", "Signing in with the wrong password is refused.", async () => {
    const bad = await signIn(owner, "not-the-password");
    expect(!bad.ok && !(bad.body && bad.body.access_token), "A wrong password produced a session");
    return `HTTP ${bad.status}`;
  });
  await check("Sign-in", "Both accounts can sign in with their own password.", async () => {
    const a = await signIn(owner), b = await signIn(stranger);
    expect(a.ok && a.body.access_token && b.ok && b.body.access_token, "Sign-in failed");
    ownerToken = a.body.access_token; strangerToken = b.body.access_token;
  });
  if (!ownerToken || !strangerToken) return finish();

  await check("Not signed in", "Without signing in, nothing can be read or saved.", async () => {
    const read = await refusal(client(anonKey).latest());
    const write = await refusal(client(anonKey).append({expected_revision: 0, ...envelope()}));
    expect(read && [401, 403].includes(read.status) && write && [401, 403].includes(write.status),
      `Expected HTTP 401 or 403 twice, got ${read && read.status} and ${write && write.status}`);
    return `read HTTP ${read.status}, save HTTP ${write.status}`;
  });
  await check("Unapproved account", "A signed-in account that is not on the approved list can neither read nor save.", async () => {
    const read = await refusal(client(strangerToken).latest());
    const write = await refusal(client(strangerToken).append({expected_revision: 0, ...envelope()}));
    expect(read && read.status === 403 && write && write.status === 403, `Expected HTTP 403 twice, got ${read && read.status} and ${write && write.status}`);
    return "HTTP 403 for read and save";
  });
  await check("Empty start", "The owner starts with an empty workspace.", async () => {
    expect(await client(ownerToken).latest() === null, "Owner workspace was not empty");
  });
  await check("First save", "The owner saves an encrypted workspace and it becomes version 1.", async () => {
    first = envelope();
    expect(await client(ownerToken).append({expected_revision: 0, ...first}) === 1, "First save did not become version 1");
  });
  await check("Read back", "Reading back returns exactly what was saved.", async () => {
    const latest = await client(ownerToken).latest();
    expect(latest && latest.revision === 1 && latest.ciphertext === first.encrypted_payload &&
      latest.ciphertext_sha256 === first.payload_sha256, "Read-back did not match the saved version");
  });
  await check("Out-of-date save", "A save based on an old version is refused and changes nothing.", async () => {
    const stale = await refusal(client(ownerToken).append({expected_revision: 0, ...envelope()}));
    expect(stale && stale.status, "An out-of-date save was accepted");
    const latest = await client(ownerToken).latest();
    expect(latest.revision === 1 && latest.ciphertext_sha256 === first.payload_sha256, "An out-of-date save changed the workspace");
    return `HTTP ${stale.status}`;
  });
  await check("Damaged save", "A save whose fingerprint does not match its contents is refused.", async () => {
    const damaged = await refusal(client(ownerToken).append({expected_revision: 1, ...envelope(), payload_sha256: "0".repeat(64)}));
    expect(damaged && damaged.status, "A damaged save was accepted");
    expect((await client(ownerToken).latest()).revision === 1, "A damaged save changed the workspace");
    return `HTTP ${damaged.status}`;
  });
  await check("Lost confirmation", "If the connection drops after a save, reading back shows whether it was stored, and it is stored once.", async () => {
    second = envelope();
    let delivered = 0;
    const dropping = async (url, options) => { await localFetch(r => { if (r.ok) delivered++; })(url, options); throw Error("connection dropped"); };
    const outcome = await refusal(client(ownerToken, dropping).append({expected_revision: 1, ...second}));
    expect(outcome && !outcome.status, "The interrupted save was reported as confirmed");
    const latest = await client(ownerToken).latest();
    expect(delivered === 1 && latest.revision === 2 && latest.ciphertext_sha256 === second.payload_sha256,
      "Read-back did not show the interrupted save exactly once");
    const repeat = await refusal(client(ownerToken).append({expected_revision: 1, ...second}));
    expect(repeat && repeat.status && (await client(ownerToken).latest()).revision === 2, "The interrupted save could be stored twice");
  });
  await check("Still locked out", "After the owner has saved data, the unapproved account still sees nothing.", async () => {
    const read = await refusal(client(strangerToken).latest());
    expect(read && read.status === 403, `Expected HTTP 403, got ${read && read.status}`);
  });
  await check("No side door", "The stored versions cannot be read or changed directly, even by the owner's own sign-in.", async () => {
    const seen = [];
    for (const profile of [null, "incomeos_private"]) {
      for (const method of ["GET", "DELETE"]) {
        const headers = {apikey: anonKey, Authorization: "Bearer " + ownerToken};
        if (profile) headers[method === "GET" ? "Accept-Profile" : "Content-Profile"] = profile;
        const direct = await json("/rest/v1/workspace_revisions?select=*", {method, headers});
        expect(!direct.ok, `Direct ${method} on the stored versions was allowed`);
        seen.push(direct.status);
      }
    }
    expect((await client(ownerToken).latest()).revision === 2, "A direct request changed the workspace");
    return `HTTP ${seen.join(", ")}`;
  });
  finish();
})().catch(error => { console.error("Test environment error:", error && error.message || error); process.exit(1); });

function finish() {
  const failed = results.filter(r => !r.ok);
  const lines = ["## IncomeOS test environment", "",
    failed.length ? `**${failed.length} of ${results.length} checks failed.**` : `**All ${results.length} checks passed.**`, "",
    "A real Supabase sign-in service, API and database were started on a throwaway machine, used with made-up accounts, and deleted afterwards. The live IncomeOS project was not contacted.", "",
    "| Result | Check | What it means | Detail |", "| --- | --- | --- | --- |",
    ...results.map(r => `| ${r.ok ? "PASS" : "FAIL"} | ${r.title} | ${r.plain} | ${r.detail.replace(/\|/g, "/")} |`), "",
    "This is evidence about a local stack with synthetic data. It is not a hosted test, not owner acceptance, and it changes no acceptance record."];
  const report = lines.join("\n") + "\n";
  console.log(report);
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, report);
  process.exit(failed.length ? 1 : 0);
}
