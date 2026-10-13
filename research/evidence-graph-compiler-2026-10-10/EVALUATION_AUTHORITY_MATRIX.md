# Evaluation Authority Matrix

Local ID: EGC-DOC-08 (NON-CANONICAL). Data: `sealed-evaluation-factory/AUTHORITY_MATRIX.json`; check: `checkAuthorityAssignment` in `factory.mjs`.

## Claim
Eight roles are separated. Local engineering cannot fill, or convert its work into the output of, any role reserved to another authority.

## Local engineering evidence
`AUTHORITY_MATRIX.json`; `EXCLUSIVE_FROM_ENGINEERING`; suite check "authority matrix separates the seven roles and bars engineering from conversion".

| Role | May | May not | Produces |
|---|---|---|---|
| Owner decision | Authorise or decline; set scope | Label or adjudicate work they commissioned | Recorded owner decision |
| Independent labeler | Assign reference labels | Have built or tuned the candidate | Reference labels |
| Adjudicator | Resolve labeler disagreements | Be a labeler on the same items or the builder | Adjudicated labels |
| Technical operator | Run the frozen candidate | Change prompt, codebook or compiler after freeze | Run records |
| Counsel | Review data flows, privacy, claims | Be replaced by engineering documentation | Counsel disposition |
| Production QA | Test a deployed build | Be the developer | Production QA record |
| Release authority | Record a release decision after gates and QA | Treat local tests as release evidence | Release authorisation |
| Local engineering | Build and test on synthetic material | Convert local work into independent validation, counsel disposition, production evidence or release authorisation | Local engineering evidence only |

## Interpretation
The matrix records who could make each kind of claim, and that this session can make none of the reserved ones.

## Limitation
The matrix is a proposal. No person has been assigned to any role.

## External evidence still required
Owner adoption of the matrix and named role holders.
