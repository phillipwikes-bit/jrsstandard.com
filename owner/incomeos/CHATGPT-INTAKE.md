# ChatGPT intake for IncomeOS

ChatGPT gathers opportunities, including ones behind logins that only reach you by email. IncomeOS decides eligibility. ChatGPT's own eligibility opinion is never used: IncomeOS ignores any eligibility field in an imported file.

## Scheduled task prompt (paste into ChatGPT)

> Every day, collect new paid opportunities for me and output ONE JSON array, nothing else.
>
> Sources: (1) my Gmail, messages from Mercor, Outlier, Handshake, Alignerr, DataAnnotation, Appen, TELUS Digital, OneForma, Mindrift, Invisible, GLG, AlphaSights, Guidepoint, Third Bridge, Coleman, USAJOBS, and recruiters, received since the last run; (2) public postings for remote AI evaluation, trust and safety, AI policy, investigation quality, EEO or civil-rights investigation, HR compliance review, and expert consultations.
>
> For each opportunity output an object with exactly these fields:
> `id` (platform name plus the posting or message ID), `title`, `platform`, `employer`, `sourceUrl` (the https page or email-linked page where the posting appears), `applyUrl` (https), `reviewed` (today, YYYY-MM-DD), `remote` (true only if the posting says remote), `locationText`, `deadline` (YYYY-MM-DD or null), `descriptionText`.
>
> Rules:
> - `descriptionText` is the posting's full text copied word for word, including every requirement, pay statement and location restriction. Do not summarize, shorten or rephrase.
> - Do not include any opinion about whether I qualify. Do not add fields.
> - Do not include my personal data, account details, screening answers, passwords or verification codes.
> - Skip anything asking for upfront payment, gift cards, crypto, bank details, or contact through Telegram or WhatsApp; list those separately in plain text after the JSON as "Skipped as suspicious".
> - Only include items with a real https link I can open. If an email has no link, skip it and name it in plain text after the JSON.
> - If nothing is new, output `[]`.

## Using the output

1. Save ChatGPT's JSON as a `.json` file.
2. In IncomeOS, Research tab, "Eligible projects and expert work": load your private profile, then this file, then **Screen opportunities**.
3. Open each item awaiting verification, compare it to the source, and press "I read the full posting" only if the copied text is complete.

## Why the split

- ChatGPT can reach your inbox and logged-in platforms; IncomeOS cannot and must not.
- IncomeOS treats imported text as untrusted: it re-extracts requirements, flags fraud and embedded instructions, rejects non-https or off-domain links, and requires a review date within 3 days.
- A model's summary can drop a requirement and make a listing look eligible. Word-for-word text plus your confirmation prevents that.

## Second task: ledger rows for the "This week" workspace

> Once a month, read my Gmail receipts, invoices, payout notices and bank alerts from last month and output ONE JSON array of ledger rows, nothing else.
>
> Each row: `id` (sender plus the receipt or order number), `kind` ("income" or "outflow"), `type` ("expense" for purchases and bills; omit for income), `date` (YYYY-MM-DD of the charge or payment), `payer` (the company), `label` (what it was, under 100 characters), and either `amountUsd` (outflows, positive, like "85.00") or `grossUsd` and `feesUsd` (income), plus `category` ("other" unless the email states it clearly).
>
> Rules: copy amounts exactly as shown; never estimate or round. Skip anything that is not a completed charge or payment (quotes, carts, failed payments, marketing). Do not include card numbers, account numbers, addresses or passwords. If one email covers several charges, make one row per charge. After the JSON, list in plain text any email you could not read clearly.

Paste the rows into the `ledger` array of your workspace file (keep the file outside this repository, ideally saved encrypted from the "This week" panel). IncomeOS then proposes categories from your approved rules, finds renewals and price increases, and flags possible duplicate charges. Emailed receipts are evidence of a charge, not proof it posted to your bank; reconcile against statements before treating totals as complete.

## Third task: Passive Opportunity Radar findings (added 2026-11-04)

> Every day, find public recovery, rebate, settlement, refund, unclaimed-property and savings opportunities that may apply to me, and output ONE JSON object, nothing else:
> `{"schema":"incomeos.passive-findings.v1","findings":[ ... ]}`
>
> Each finding has exactly these fields: `id` (short unique text), `title`, `sourceName` (who published it), `sourceUrl` (https page where you found it), `directUrl` (https page where I would act, ideally the official site), `foundOn` (today, YYYY-MM-DD), `valueType` (one of `new_income`, `returned_capital`, `savings`, `projection`), `amountUsd` (number or null), `amountBasis` (`stated` only if the source states the amount; otherwise `estimated` or `unknown`), `deadline` (YYYY-MM-DD or null), `summary` and `eligibilityText` (copied from the source), `costToPursueUsd` (0 if free). Where the source states them, also add: `provider`, `requiredCapitalUsd` (money I would have to put in), `adminBurden`, `counterpartyRisk` and `defaultRisk` (each `low`, `medium`, `high` or `unknown`), `liquidity` (when and how I could get the money out), `lockupDays`, `taxNote` and `requiredAction` (the exact step I would take). Leave out anything the source does not state.
>
> Rules: use `projection` for any calculated or hypothetical gain (interest, yield, a rate comparison); it is never income. Use `returned_capital` for money that is already mine (refunds, unclaimed property, deposits). Do not invent amounts, deadlines or availability. Skip anything that asks for an upfront fee, a paid finder service, gift cards, crypto or contact through Telegram or WhatsApp. Do not include my personal data, account numbers, case numbers, passwords or codes. If nothing is new, output `{"schema":"incomeos.passive-findings.v1","findings":[]}`.

Save the output as a `.json` file and open it in IncomeOS: Assets tab, "Passive opportunity findings", **Review findings**. A finding without a source, a found-on date within 14 days or a direct https link is refused and the reason is shown. Projections are listed last and never counted. Nothing is fetched or filed. With your workspace open you can mark a finding Pursuing, Done or Dismissed; that decision is saved in the workspace, and dismissed findings stay hidden in later files; a finding becomes money only when you record the actual payment in Income.

## Fourth task: paid study alerts as a study file (added 2026-11-05)

The built-in study list is a dated snapshot and goes on hold after three days. Add this to the hourly IncomeOS Paid Study Alerts task so its findings can be loaded into the Research tab:

> At the end of each run, also output ONE JSON object, nothing else, in this exact shape:
> `{"asOf":"YYYY-MM-DD","studies":[ ... ]}`
>
> Each study has only these fields: `id` (letters, digits, `-` or `_`, 4 to 90 characters, e.g. recruiter plus study number), `title`, `provider` (the recruiter), `paymentUsd` (number), `paymentMethod` (as stated, e.g. "PayPal", "Amazon gift card"), `minutes` (session length), `screenMinutes`, `prepMinutes`, `adminMinutes` (each a number or null when not stated), `timeConfidence` (`verified` only if the posting states every time, otherwise `estimated` or `unknown`), `mode` (`online`, `hybrid` or `in-person`), `eventEnd` (YYYY-MM-DD or null), `dateType` (`application-deadline` or `published-session-end`), `reviewed` (today, YYYY-MM-DD), `url` (the https page where I apply to this study), `sourceUrl` (the https page where you found it), `dates` (participation dates as text), `linkKind` (`Direct screener`, `Study-specific registration` or `Application details unconfirmed`), `eligibility` (list of requirements copied from the posting), `risk` (list of concerns), `status` (availability as stated).
>
> Rules: never invent pay, times, dates or availability; use null when the posting does not say. Do not add fields. Do not include my personal data, screening answers, account details or codes.

Save it as a `.json` file and, in IncomeOS, open Research → "Paid research opportunity radar" → choose the file → **Import and analyze leads**. On the hosted app the studies are held for that visit only (browser storage stays blocked); nothing is stored, and reloading clears them. Any field outside the list above makes the whole study be refused.
