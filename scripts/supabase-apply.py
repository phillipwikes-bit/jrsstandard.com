#!/usr/bin/env python3
"""
Apply a SQL file to the project's Supabase database via the Supabase Management API.

Why this exists: the environment's network policy blocks direct Postgres ports
(5432/6543), but the Management API (https://api.supabase.com) is reachable over
HTTPS. With a Supabase personal access token in the environment, schema changes
can be applied from a session without anyone pasting SQL into the dashboard.

Requirements (environment variables, never committed):
  SUPABASE_ACCESS_TOKEN   required. A Supabase personal access token.
  SUPABASE_PROJECT_REF    optional. Defaults to this project's ref.

Usage:
  python3 scripts/supabase-apply.py [path/to/file.sql]   # defaults to supabase-ALL.sql

Behavior:
  - If SUPABASE_ACCESS_TOKEN is not set, it prints a notice and exits 0 (no-op),
    so it is safe to run from a SessionStart hook before the token is configured.
  - The SQL files in this repo use `create table if not exists` / `on conflict do
    nothing`, so applying them repeatedly is idempotent and safe.
"""
import os, sys, json, urllib.request, urllib.error

REF = os.environ.get("SUPABASE_PROJECT_REF", "pjzxkeviouofdseagvpf")
TOKEN = os.environ.get("SUPABASE_ACCESS_TOKEN")
PATH = sys.argv[1] if len(sys.argv) > 1 else "supabase-ALL.sql"

def main():
    if not TOKEN:
        print("[supabase-apply] SUPABASE_ACCESS_TOKEN not set; skipping (no-op).")
        return 0
    try:
        sql = open(PATH, encoding="utf-8").read()
    except OSError as e:
        print(f"[supabase-apply] cannot read {PATH}: {e}")
        return 1
    req = urllib.request.Request(
        f"https://api.supabase.com/v1/projects/{REF}/database/query",
        data=json.dumps({"query": sql}).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {TOKEN}",
            "Content-Type": "application/json",
            # api.supabase.com sits behind Cloudflare; the default urllib UA is bot-blocked (error 1010).
            "User-Agent": "jrs-migrate/1.0 (+https://jrsstandard.com)",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=120) as r:
            print(f"[supabase-apply] {PATH} applied OK (HTTP {r.status}).")
            return 0
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", "replace")[:1500]
        print(f"[supabase-apply] HTTP {e.code} applying {PATH}: {body}")
        return 1
    except Exception as e:
        print(f"[supabase-apply] error applying {PATH}: {e}")
        return 1

if __name__ == "__main__":
    sys.exit(main())
