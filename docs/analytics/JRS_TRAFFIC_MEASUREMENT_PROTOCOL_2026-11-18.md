# JRS website traffic measurement protocol

Effective 18 November 2026. Applies prospectively. Past GA4 reports cannot be retroactively separated into owner, automated, and external traffic with certainty.

## 1. Before testing the live site

Open this URL in **each** browser or automated testing session before opening other JRS pages:

https://www.jrsstandard.com/?jrs_test=1

The page works normally, but its public Google Analytics tag does not load. The exclusion persists during later visits in the same browser, if local storage is available. It does not mark another browser, another device, or a new isolated ChatGPT/Claude browser session. Start each fresh testing session at the URL above. For a one-page test in a browser that blocks storage, append `?jrs_test=1` to that page's URL.

Preview, staging, and WebDriver-controlled browser sessions are automatically excluded by the website's analytics loader. Automated browsers that conceal WebDriver status still require the explicit test link. The loader does not claim to detect or remove all bots.

To resume normal measurement in that browser, open:

https://www.jrsstandard.com/?jrs_test=0

Do not send either test-mode URL to prospective users or organizations. Do not use the live website's campaign support buttons as a testing fixture because server-side support records are separate from GA4.

## 2. Use distinct tagged links in future outreach

For **Decisions You Can Defend**, email:

https://www.jrsstandard.com/decisions-you-can-defend.html?utm_source=outreach_email&utm_medium=email&utm_campaign=jrs_decisions_you_can_defend_2026_11

For **The Right to Know Why**, email:

https://www.jrsstandard.com/right-to-know-why.html?utm_source=outreach_email&utm_medium=email&utm_campaign=jrs_right_to_know_why_2026_11

For **free investigator guides**, email:

https://www.jrsstandard.com/investigator-guides.html?utm_source=outreach_email&utm_medium=email&utm_campaign=jrs_investigator_guides_2026_11

For **free reviewer training**, email:

https://www.jrsstandard.com/training.html?utm_source=outreach_email&utm_medium=email&utm_campaign=jrs_reviewer_training_2026_11

For **Decisions You Can Defend** on LinkedIn:

https://www.jrsstandard.com/decisions-you-can-defend.html?utm_source=linkedin&utm_medium=social&utm_campaign=jrs_decisions_you_can_defend_2026_11

For **The Right to Know Why** on LinkedIn:

https://www.jrsstandard.com/right-to-know-why.html?utm_source=linkedin&utm_medium=social&utm_campaign=jrs_right_to_know_why_2026_11

Do not place personal names, email addresses, contact identifiers, or case information in tracking parameters. Do not add UTM parameters to links between pages on the JRS site, because that could distort attribution. Existing campaign email drafts do not change automatically; use these links in future approved messages.

## 3. How to interpret the reports

- Compare `session source / medium` and `session manual campaign` in GA4, along with engagement and actual `jrs_*` events.
- A tagged referral indicates a visit to a campaign URL, not confirmed human reading. Email security scanners may also open tagged links.
- `Direct` means GA4 could not associate the session with a source. It does not mean an organizational visitor, and it cannot be assigned to outreach retroactively.
- GA4 filters recognized bot traffic, but unknown automated browsers can still create visits. Review browser, city, time, landing page, engagement and events together before interpreting unusual spikes.
- The on-site QA mode protects future browser testing only. It cannot remove previous visits, exclude all automated traffic, prove organizational interest, or identify individuals.
- The website's server-side PDF and voluntary campaign support records remain separate. Do not count them as GA4 human visitors or use live support buttons to test analytics.

## 4. Verification checklist

1. On a live production page opened with `?jrs_test=1`, confirm that the Google tracking script and GA collection requests are absent; navigate to another tracked page in the same session and verify again.
2. On a new, non-automated browser without test mode, confirm the GA script loads and page views appear in GA4 DebugView or Realtime after normal processing delay.
3. In a separate test browser, visit a tagged outreach URL and confirm the associated source, medium and campaign are recorded correctly before sending it widely. Do not use a test-mode browser for this step.
4. Verify public resource and training clicks still produce their established allowlisted `jrs_*` events. No changes are made to their event contract.
5. Review the first full seven days of data after deployment. Report attributed outreach traffic separately from Direct, owner testing and unverified automated traffic.

This is an analytics-quality control, not a countermeasure that certifies any visit as human. The GA4 property-level internal-traffic filter is not changed by the website code and must be validated separately before any permanent activation.
