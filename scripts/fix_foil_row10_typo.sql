-- Restore the dropped leading F in one public-records citation.
-- Found 2026-08-24 by scripts/build_case_citations.py --corpus 'Public records / FOIL'.
-- Transcription fix only: no classification, outcome or figure changes.
-- The anon key is read-only, so this is run by the owner against the project.

UPDATE bench_outcomes SET source = 'F' || source WHERE id = '235b8b4f-90eb-4cb1-af23-9a42f20ad12c';

-- Verify:
-- SELECT id, source FROM bench_outcomes WHERE source LIKE 'FOIL AO 19746%';
