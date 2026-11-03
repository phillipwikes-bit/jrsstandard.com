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
