"use strict";
// Static defense-in-depth checks only. These do not prove that SQL migrations
// have been applied or exercised against a live Supabase/Postgres instance.
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const source=p=>fs.readFileSync(path.resolve(__dirname,"../engineering/incomeos",p),"utf8");
const privateSql=source("workspace-revision-staging.sql");
const publicSql=source("workspace-revision-rpc-staging.sql");
assert.match(privateSql,/STAGING ONLY/);
assert.match(privateSql,/create table if not exists incomeos_private\.allowed_owners/);
assert.match(privateSql,/revoke all on incomeos_private\.workspace_revisions from public, anon, authenticated/i);
assert.match(privateSql,/alter table incomeos_private\.workspace_revisions enable row level security/i);
assert.match(privateSql,/security definer set search_path = ''/i);
assert.match(privateSql,/actor uuid := auth\.uid\(\)/);
assert.match(privateSql,/pg_advisory_xact_lock/);
assert.match(privateSql,/current_revision <> expected_revision/);
assert.match(privateSql,/extensions\.digest\(convert_to\(encrypted_payload,'UTF8'\),'sha256'\)/);
assert.match(privateSql,/->'version' = '1'::jsonb/);
assert.match(privateSql,/->'iterations' = '600000'::jsonb/);
for(const field of ["data","salt","iv"]){
  assert.ok(privateSql.includes("jsonb_typeof((encrypted_payload::jsonb)->'"+field+"') = 'string'"),field+" must be a JSON string");
}
assert.match(privateSql,/A-Za-z0-9\+\/=\]\+\$/);
assert.match(privateSql,/A-Za-z0-9\+\/\]\{22\}==\$/);
assert.match(privateSql,/A-Za-z0-9\+\/\]\{16\}\$/);
assert.match(publicSql,/create or replace function public\.incomeos_latest_workspace_revision/);
assert.match(publicSql,/create or replace function public\.incomeos_append_workspace_revision/);
assert.match(publicSql,/where owner_id=actor/);
assert.match(publicSql,/incomeos_private\.append_workspace_revision\(/);
assert.match(publicSql,/revoke all on function public\.incomeos_latest_workspace_revision\(\) from public,anon/);
assert.match(publicSql,/revoke all on function public\.incomeos_append_workspace_revision\(bigint,text,text\) from public,anon/);
console.log("PASS: static staging SQL checks for owner isolation, CAS, envelope validation and least-privilege RPC");
