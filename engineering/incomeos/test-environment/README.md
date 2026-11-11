# IncomeOS free test environment

A safe place to test saving and reading the encrypted workspace, without a paid Supabase project and without touching the live IncomeOS data.

## What it is

Each run starts a real Supabase stack (sign-in service, API and database) on a throwaway machine, installs the staged database design, creates two made-up accounts, runs the checks, prints a plain-English report, and deletes everything.

It costs nothing, needs no account, and stores no secret. It refuses any address that is not the machine it runs on, so it cannot reach the live project.

## How to use it

**On GitHub (nothing to install).** It runs by itself on every pull request that changes the staged database design, the staged Supabase client, or this folder. Open the pull request, click the **Checks** tab, then **IncomeOS free test environment**. The report is a table of PASS and FAIL lines in plain English.

**On your own computer.** With Docker running:

```bash
bash engineering/incomeos/test-environment/run.sh
```

The first run downloads the stack and takes a few minutes.

## What it checks

1. A wrong password is refused.
2. Nothing can be read or saved without signing in.
3. A signed-in account that is not on the approved list can neither read nor save.
4. The approved owner starts empty, saves version 1, and reads back exactly what was saved.
5. A save based on an old version is refused and changes nothing.
6. A save whose fingerprint does not match its contents is refused.
7. If the connection drops after a save, reading back shows it was stored, once.
8. The stored versions cannot be read or changed directly, only through the two approved functions.

## What it is not

It is a local stack with synthetic data. It is not the hosted test that accounting requirement A14 names, it is not owner acceptance, and a passing run changes no acceptance record. Whether it is accepted in place of a hosted nonproduction project is the owner's decision.

The "Run workflow" button for this check appears on GitHub only once this workflow file also exists on the `main` branch. Until then it runs on pull requests.
