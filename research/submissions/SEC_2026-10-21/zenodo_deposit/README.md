# Zenodo deposit: data and code for Young and Wikes (2026)

This folder is the deposit the journal requires ("a trusted open repository ... A persistent identifier (DOI or equivalent) must be provided").
Upload its contents to Zenodo and paste the DOI into the manuscript's Data Availability Statement.

## Contents

| File | What it holds |
|---|---|
| `data/Young_Wikes_2026_32_Case_Master_Dataset.csv` | All 32 cases: citation, public URL, read, basis note, outcome, analysis inclusion flags, second-read agreement |
| `data/Young_Wikes_2026_Contemporaneous_Basis_Notes.csv` | The basis note recorded for each case before the outcome was consulted |
| `data/Young_Wikes_2026_Construct_Coding_Frame.csv` | Coding of the 24 noted case-level sources (Table 1) |
| `data/Young_Wikes_2026_Structural_Coding_Frame.csv` | Structural grouping used in Table 2 |
| `data/Young_Wikes_2026_Data_Dictionary.txt` | Field definitions |
| `reproduce_results.py` | Reproduces every count and test in the paper. Standard library only |

The files were prepared on 2026-08-28 for an earlier submission and renamed for this deposit; their content is unchanged. The data dictionary's section numbers follow that earlier draft:

| Dictionary section | Journal manuscript section |
|---|---|
| 5.2 | Agreement with Independent Auditors |
| 5.3 | The Read Tracks Reconstructability, Not Outcome |
| 5.4 | Reads Differed Across Source Classes |
| 5.5 | Appellate Outcome Is a Different Variable |

**No reviewer is named anywhere in these files.** The second reader appears only as agreement values.

Verified 2026-10-21: `python3 reproduce_results.py` prints 32 cases; reads 18/9/5; audit concordance 5 of 5; Table 1 p = 0.0000520 (stricter coding 0.0004941); Table 2 p = 0.00466 (case-level only 0.0833); Gap concentration p = 0.0000050; Table 3 OR 0.75, p = 1.000; second read 7 of 10, Wilson 39.7 to 89.2. Every figure matches the manuscript.

## Upload steps (about 10 minutes)

1. Sign in at zenodo.org (an ORCID login works) and click **New upload**.
2. Upload the five files in `data/`, `reproduce_results.py` and this README.
3. Fill in the form:
   - **Resource type:** Dataset
   - **Title:** Data and code for: Can Public-Records Determinations Be Independently Reconstructed? Evidence from 32 Public Cases
   - **Creators, in this order:**
     1. Young, Stacyann (ORCID 0009-0001-1727-0117), Independent Researcher
     2. Wikes, Phillip (ORCID 0009-0009-7230-3661), Independent Researcher
   - **Description:** Case-level dataset (32 publicly available public-records determinations, opinions and audits from New York and Connecticut, 2005 to 2026), coding frames, data dictionary and a script reproducing every reported result.
   - **Licence:** Creative Commons Attribution 4.0 International
   - **Keywords:** records management; freedom of information; documentation quality; reconstructability; public records
   - **Related works:** "Is supplement to" https://papers.ssrn.com/sol3/papers.cfm?abstract_id=7591521
4. Click **Publish**. Zenodo issues the DOI immediately. Publishing cannot be undone; a later correction becomes a new version.
5. Send the DOI so it can go into the manuscript.
