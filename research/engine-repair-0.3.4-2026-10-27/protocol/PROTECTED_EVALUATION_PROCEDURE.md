# Protected Evaluation Procedure (fresh material)

**2026-10-27. Proposal. Owner approval: NOT GIVEN.** It describes how fresh records, once the owner obtains them, would be kept unseen until one frozen candidate is run on them once. No step below has started.

## 1. Before any record exists

| Step | Who | Record kept |
|---|---|---|
| 1. Choose the author (`protocol/FRESH_RECORD_AUTHORING_SPEC.md`, section 1) | Owner | Name, date, the author's statement |
| 2. Freeze the candidate and every tool the run uses | Done for 0.3.4: `seals/freeze` | Freeze manifest hash |
| 3. Approve the criteria to be applied (`protocol/ACCEPTANCE_CRITERIA_V2_PROPOSED.json`, or an amended set) | Owner | Approval record with date |
| 4. Decide the run's arms: offline scripted candidates only, or a live model under a separate authorization | Owner | Decision record |

## 2. Receiving the records

1. The author sends the package to the owner by a private channel, **not** through this repository. The repository is public: a commit to any branch publishes its contents.
2. The owner stores the package privately and checks every file against the author's manifest.
3. The owner records, in a private log, the manifest hash and the date. Nobody who works on the candidate opens the records.

## 3. The run

1. Check the freeze seal and the candidate manifest. Any mismatch stops the run before execution.
2. Run the frozen candidate once, offline, on the sealed records: the research profile, the heuristic and adversarial scripted candidates, and (only if separately authorized) a live model.
3. Score with the frozen scoring and the approved criteria. Rule-aligned arms (A3R, A4R) are reported as ceilings only.
4. Write the results once (write-once files). No result is edited after it is written.

## 4. After the run

| Rule | Why |
|---|---|
| No repair before the run | A repair made after seeing fresh records makes them development material |
| Any repair after the run is a new candidate version | Its evaluation needs new fresh records |
| The author's labels are the reference; where the owner disagrees, both are kept as **disputed** until a person the owner names settles them (**adjudicated**) | `registers/LABEL_STATUS_REGISTER.json` |
| Publication of the records, labels or results only after the run, and only with the owner's approval | CLAUDE.md section 23 |

## 5. What the result could and could not show

- **Could show:** how the frozen candidate's flags agree with an independent author's labels, on records the rule author never saw.
- **Could not show:** accuracy on operational records, behaviour of a live model (unless separately authorized and run), or benefit to reviewers.

## 6. Material that does not qualify

Any record written, edited or read by the rule author, and any record the candidate has already been run on, is development material. That includes every study record, every variant and every test construction in this package.
