// Analysis on a fixed synthetic repository manifest: determinism, classification, dependencies.
import { t, done, AN, R, IG, clone, fixtureFacts, analyzeWithDigest, net } from './_helpers.mjs';

const F = fixtureFacts();
const one = analyzeWithDigest(F), two = analyzeWithDigest(fixtureFacts());
t('the same manifest gives the same output', one.digest === two.digest);
const shuffled = fixtureFacts(); shuffled.files.reverse(); shuffled.commits.reverse();
t('input order does not change the output', analyzeWithDigest(shuffled).digest === one.digest);
const changed = fixtureFacts(); changed.files.find((f) => f.path === 'index.html').blob = 'e'.repeat(40);
t('a changed source file changes the inventory', analyzeWithDigest(changed).digest !== one.digest);
const a = one.a, file = (p) => a.files.find((f) => f.path === p);

// Classification.
t('every file gets an area or is reported UNCLASSIFIED', a.files.every((f) => f.area));
t('an unrecognized file is reported UNCLASSIFIED with boundary UNKNOWN', file('mystery.bin').area === 'UNCLASSIFIED' && file('mystery.bin').boundary === 'UNKNOWN');
t('every boundary is from the controlled vocabulary', a.files.every((f) => AN.BOUNDARIES.includes(f.boundary)));
t('a controlled refusal stub is CONTROLLED_OR_CLOSED_ROUTE', file('api/review.js').boundary === 'CONTROLLED_OR_CLOSED_ROUTE' && file('api/review.js').route_status === 'CONTROLLED_REFUSAL_STUB');
t('an underscore module is a deployed server module, not a route', file('api/_controlled-review.js').boundary === 'DEPLOYED_SERVER_MODULE');
t('another route is PUBLIC_ROUTE with behaviour not assessed', file('api/open-route.js').route_status === 'DEPLOYED_ROUTE_BEHAVIOUR_NOT_ASSESSED');
t('the engine candidate is LOCAL_INTERNAL with its exclusion rule', file('lib/engine-candidate/review-candidate.js').boundary === 'LOCAL_INTERNAL' && /lib\//.test(file('lib/engine-candidate/review-candidate.js').deployment_exclusion));
t('the engine candidate version identifier is read', file('lib/engine-candidate/review-candidate.js').version_id === 'candidate-prompt/9.9.9');
t('a synthetic fixture is marked synthetic and registered as development material', file('tests/engine-candidate/fixtures/SYNTHETIC-X.txt').synthetic_material && file('tests/engine-candidate/fixtures/SYNTHETIC-X.txt').holdout_exclusion === 'REGISTERED_DEVELOPMENT_MATERIAL');
t('a deployed JSON file under docs/ is reported, not assumed excluded', file('docs/public.json').deployment_exclusion === null && file('docs/public.json').boundary === 'UNKNOWN');
t('opaque slugs are redacted in paths', a.files.some((f) => f.path === 'api/leads-<slug>.js') && !JSON.stringify(a).includes('0123456789abcdef'));
t('a restricted owner endpoint is flagged', file('api/leads-<slug>.js').restricted_surface === true);
t('excluded groups carry the routing note, not a confidentiality claim', a.boundary_groups.filter((g) => g.exclusion_rules.length).every((g) => g.routing === AN.ROUTING_NOTE) && /not a confidentiality control/.test(AN.ROUTING_NOTE));
t('no boundary or note calls an excluded file secret', !/\bsecret\b/i.test(JSON.stringify(a.boundary_groups) + JSON.stringify(a.totals)));

// Ignore semantics.
const rules = IG.parseIgnore('*.md\n!404.md\nresearch/\n/docs/private/\n*.docx\n');
t('ignore: a file under an excluded directory is decided by the directory rule', IG.exclusionRule(rules, 'research/x.docx') === 'line 3: research/');
t('ignore: a negated pattern re-includes a file', IG.exclusionRule(rules, '404.md') === null && IG.exclusionRule(rules, 'a.md') === 'line 1: *.md');
t('ignore: an anchored pattern matches only at the root', IG.exclusionRule(rules, 'docs/private/a.json') !== null && IG.exclusionRule(rules, 'x/docs/private/a.json') === null);
t('ignore: an unanchored directory pattern matches at any depth', IG.exclusionRule(rules, 'docs/research/a.json') === 'line 3: research/');

// Dependencies: nothing fabricated.
const comp = (n) => a.dependencies.components.find((c) => c.name === n);
t('a third-party import with no local metadata is MISSING_LOCAL_LICENSE_METADATA', comp('left-pad') && comp('left-pad').status === 'MISSING_LOCAL_LICENSE_METADATA' && comp('left-pad').license_value === null && /NOT_DECLARED/.test(comp('left-pad').declared_version));
t('Python third-party imports are found; standard-library imports are not listed', comp('reportlab') && comp('PIL') && !comp('os'));
t('a runtime built-in is UNKNOWN, not RECORDED', comp('node:crypto').status === 'UNKNOWN');
t('a hosted script is listed with no license value', comp('Google Analytics 4 (gtag.js), loaded from googletagmanager.com').license_value === null);
t('no component is RECORDED without local license evidence', a.dependencies.components.every((c) => c.status !== 'RECORDED' || c.local_license_evidence !== 'NONE_FOUND'));
t('every dependency status is from the vocabulary', a.dependencies.components.every((c) => AN.DEP_STATUSES.includes(c.status)));
t('with no license file the repository license is UNKNOWN', /^UNKNOWN/.test(a.dependencies.repository_license));
const lic = fixtureFacts(); lic.files.push({ path: 'LICENSE', mode: '100644', blob: 'd'.repeat(40), size: 10 }); lic.text.LICENSE = 'Some terms';
t('a license file present is REQUIRES_REVIEW, never interpreted', /^REQUIRES_REVIEW/.test(AN.analyze(lic).dependencies.repository_license));

// Credential-like patterns: names, never values.
t('a credential-like pattern is reported by name and path only', a.secret_patterns.supabase_publishable_key && a.secret_patterns.supabase_publishable_key.files.includes('config.js') && !JSON.stringify(a).includes('X'.repeat(20)));

// Contribution map.
const cand = a.contribution.find((r) => r.area === 'engine-candidate');
t('an area with an AI co-author trailer is labelled AI_ASSISTED_RECORDED', cand.origin_labels.includes('AI_ASSISTED_RECORDED') && cand.commits_with_ai_tool_markers === 1);
const site = a.contribution.find((r) => r.area === 'site-pages');
t('an area without markers is UNKNOWN, never "human-authored"', site.origin_labels.join() === 'UNKNOWN' && !/human/i.test(JSON.stringify(a.contribution).replace(/a person wrote the change/g, '')));
t('every area carries the metadata limitation', a.contribution.every((r) => r.limitation.includes(AN.METADATA_NOTE)));
t('the shallow-history limitation is stated', cand.limitation.includes('shallow'));
t('emails are masked', !JSON.stringify(a.contribution).includes('person@example.invalid') && JSON.stringify(a.contribution).includes('p…@example.invalid'));
t('there is no percentage, score or share in the contribution map', !/percent|share|score|ownership_/i.test(JSON.stringify(a.contribution.map(({ limitation, ...r }) => r))));
t('analysis made no network call', net.calls === 0);
done();
