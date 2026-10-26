"""Build the SocioEconomic Challenges version of the detection study.

Uses the journal-template styles carried by the Young & Wikes SEC manuscript
(branch claude/tracker-2026-10-21) so both submissions share one format.

Usage: python3 scripts/build_sec_detection_manuscript.py <template.docx> <out.docx>
"""
import copy
import re
import sys

import docx

TITLE = ("Socioeconomic Challenges of AI-Drafted Decision Records: "
         "Can Expert Reviewers Detect Unsupported Conclusions?")

AUTHORS = [
    "**Phillip Wikes** (corresponding author, info@jrsstandard.com), Independent Researcher. ORCID: 0009-0009-7230-3661",
    "**Ubayet Hossain, FRM**, Independent Financial Risk & Model Validation Professional. ORCID: 0009-0001-5304-2170",
    "Type of manuscript: research paper",
]

ABSTRACT = (
    "Employers, public agencies and regulated firms now use generative artificial intelligence (AI) to draft the records "
    "behind decisions on hiring, discipline, benefits, investigations and compliance. A drafted record can look "
    "complete and still omit the evidence and reasoning that justify its conclusion. When such a decision is later "
    "challenged, someone has to rebuild it, and much of that cost lands on the person affected. Many institutions rely on a human reviewer to stop weak records before they "
    "are finalised, and recent regulation assumes this oversight works. Research has mostly taken that oversight "
    "for granted. This study measures the overseers. It asks "
    "whether expert reviewers can tell supported from unsupported conclusions in AI-drafted decision records, "
    "how far individual reviewers differ, and whether they agree closely enough for one review to be trusted. In a "
    "pre-registered study, sixteen credentialed experts working in compliance, audit, human resources, investigations, "
    "privacy, records management and law across 11 countries classified 24 constructed records, half with documented "
    "support for their conclusions and half without, giving 384 independent judgments. Reviewers worked alone and did not know the reference "
    "classification, which was fixed in advance and reproduced on every record by three automated raters. Mean "
    "accuracy reached 83.9 percent (95 percent CI 72.7 to 95.1), above the registered target of 70 percent, and even the lower end of the confidence interval cleared that target; "
    "sensitivity was 87.0 percent and specificity 80.7 percent. Individual accuracy, however, ran from 37.5 to 100 "
    "percent, and an exploratory model placed most of that spread with the reviewers rather than the records. A "
    "separate reliability test met its registered point estimate but fell short of its lower confidence bound. As a "
    "panel, the reviewers could detect the problem; as individuals, they could not yet be relied on to. For "
    "organisations this means a panel accuracy figure says little about the person actually assigned to a file, and "
    "whether a flawed decision is caught can depend on who happens to read it. Calibration and double review cost "
    "staff time, and that cost has to be set against the costs that unsupported decisions push onto the people they "
    "affect. The corpus was constructed at the extremes of documentation quality and classified by the first author, "
    "so the results are a first, bounded test rather than an estimate of everyday performance. Further work with independently "
    "built and more ambiguous records is needed before the figures can guide practice directly."
)

KEYWORDS = ("accountability; administrative justice; human oversight; inter-rater reliability; large language "
            "models; public trust; regulatory compliance; transparency")
JEL = "D73; D82; D83; H83; J53; K23; M42; O33."

BODY = [
("h1", "INTRODUCTION"),
("p", "Most consequential decisions leave a written trace. A dismissal, a refused benefit, an investigation finding or a compliance ruling is recorded, and the record is what any later review examines. Appeals officers, auditors, regulators and courts seldom get to question the person who decided. They read the file, and whatever they can learn about why the decision went one way rather than another has to come from it."),
("p", "When a record does not carry the basis for its conclusion, somebody pays to reconstruct it. The affected person must contest a decision whose reasons are hidden from them. An appeal body or regulator must rebuild the decision from competing submissions. The organisation itself may be unable to defend a decision it can no longer explain. These costs fall unevenly. A large employer or a well-funded claimant can absorb the expense of litigation; an individual trying to understand why they lost a job or a benefit usually cannot. A poorly supported record is in this sense a transfer of cost from the institution that produced it to the people and bodies who must later make sense of it."),
("p", "Generative artificial intelligence (AI) has changed how these records are written. Organisations now use large language models to draft decision memoranda, case summaries and determination letters, often to save staff time. The output is well organised and professional in tone, and that polish is separate from whether the evidence behind a conclusion actually appears on the page (Bender et al., 2021; Ji et al., 2023). A model can produce a conclusion that sounds settled while leaving out the facts that would justify it. Readers have long relied on rough signals to spot a thin file, such as hedged wording, a disorganised structure or an informal register. Machine drafting can remove exactly those signals."),
("p", "A common safeguard is a person. A supervisor, compliance officer or second reader checks the draft before it becomes final, and regulation increasingly takes such oversight for granted (European Union, 2024). Recent work in this journal finds the same reliance in other settings: the benefits of algorithmic management depend on intelligible explanations and meaningful human review (van der Nest & Sheik, 2026), and municipal oversight still rests largely on manual verification and retrospective audit (Oluka, 2026). A safeguard of this kind only works if reviewers can tell a supported conclusion from an unsupported one. If they cannot, the institution pays for review and receives little protection in return. If some reviewers can and others cannot, an organisation that assigns one reviewer per file carries a risk it cannot see."),
("p", "This paper reports a pre-registered study of that problem and addresses three research questions:"),
("n", "1. Can independent expert reviewers distinguish supported from unsupported conclusions in AI-drafted decision records, judged against a classification fixed in advance?"),
("n", "2. How much does that ability vary between individual reviewers, and does the variation come from the reviewers or from the records?"),
("n", "3. Do reviewers using a structured review agree with each other closely enough for a single judgment to be relied on?"),
("p", "The answers are mixed in a way that matters for practice. A panel of experts detected the difference well above chance and above a target set before the data were seen. Individual reviewers, though, varied widely, and agreement between them fell short of the registered standard. Human review of AI-drafted records therefore looks feasible as a collective judgment and unproven as an individual one. The rest of the paper sets out the literature, the design and the results, and then considers what they imply for how organisations organise, staff and pay for review."),

("h1", "LITERATURE REVIEW"),
("h2", "Accountability Depends on the Record"),
("p", "Bovens (2007) describes accountability as a relationship in which an actor must explain and justify conduct to a forum that can ask questions, pass judgment and impose consequences. Every stage of that relationship needs information about what the actor did and why. Where the record cannot provide it, the forum has to reconstruct events from argument and memory, and accountability weakens even when every formal step has been followed. Mashaw (1983) argues that mass administrative adjudication should be judged on whether it reaches accurate decisions consistently and can justify them. Tyler (2006) shows that people accept decisions, including unfavourable ones, largely according to whether they see the process as fair, and being given reasons is part of that judgment. A record that loses its own reasoning undermines both the justification Mashaw emphasises and the legitimacy Tyler describes."),
("p", "Transparency is often offered as the remedy, yet its effects depend on what is disclosed. In an experiment, Grimmelikhuijsen and Meijer (2014) find that transparency raises the perceived trustworthiness of a government organisation only under certain conditions, depending on the content released and on citizens' prior views. The OECD (2017) treats public trust as an economic asset as well as a political one, tied to compliance, to the cost of carrying out policy and to people's willingness to deal with institutions. Ananny and Crawford (2018) argue that seeing a system is different from being able to hold it to account. A record can therefore be available and still be of little use to the person reading it."),
("h2", "Artificial Intelligence, Automation and the Opacity of Decisions"),
("p", "Citron (2008) warns that automated systems can hollow out notice and hearing rights when the logic of a decision sits in software rather than in the record. Kaminski and Urban (2021) set out a right to contest automated decisions, which assumes that the grounds of a decision can be found. Cobbe, Lee and Singh (2021) propose that automated decision-making be built for review from the outset, with the necessary record-keeping designed in."),
("p", "Most governance tools for artificial intelligence look at the model, the training data or the development process. Model cards document a model's intended use and evaluation (Mitchell et al., 2019), datasheets record how a dataset was assembled (Gebru et al., 2021), and internal audit frameworks follow a system through its lifecycle (Raji et al., 2020). These tools rarely examine the individual record that a decision leaves behind. Generative drafting makes that gap harder to ignore. A drafted record can be perfectly readable and still fail to show how its conclusion was reached."),
("p", "Work in this journal frames the economic side of the same development. Mushkudiani et al. (2026) treat artificial intelligence adoption as a set of investments with different functions, including productivity gains and the reduction of information asymmetry, and argue that governance capacity and stakeholder trust shape how much value those investments deliver. Drafting assistance is a clear productivity function. Whether it also preserves the information a later reviewer needs depends on the organisation's capacity to check its output. In their review of algorithmic management, van der Nest and Sheik (2026) find that the benefits reported for such systems were conditional on intelligible explanations and meaningful human review, and they describe an assurance framework that ties worker voice to evidence, oversight and remedy. Oluka (2026) finds that municipal officials depend on manual verification, siloed systems and retrospective audits, and that weak oversight erodes public confidence. Each of these studies treats human oversight as a condition of value or legitimacy. None measures how well the people doing the overseeing perform."),
("h2", "Review as Monitoring: An Agency Perspective"),
("p", "Agency theory gives these concerns an economic form. Jensen and Meckling (1976) describe the costs that arise when one party acts on behalf of another as the sum of the principal's monitoring expenditures, the agent's bonding expenditures and the residual loss that remains despite both. A consequential decision record fits this structure. The organisation, and behind it the people affected and the public, relies on a drafter to document the basis for a decision. Review before finalisation is a monitoring expenditure, and unsupported decisions that pass review anyway are residual loss. How much protection the monitoring buys depends on how well the monitors perform, which is the question this study addresses."),
("p", "Akerlof (1970) showed how markets deteriorate when buyers cannot observe quality: if good and bad products cannot be told apart, both are valued alike and the incentive to supply quality weakens. The same logic can be applied, by analogy, to documentation. If reviewers cannot reliably tell a supported record from an unsupported one, the extra effort of documenting the basis of a decision goes unrewarded, and polished drafts that omit it are treated the same as careful ones. Generative drafting lowers the cost of producing records that look complete, which makes the observability of record quality more important. The analogy is offered as a framing for the results, not as a tested model."),
("h2", "Measuring Records and Reviewers"),
("p", "A companion study applied a structured record-level review to 32 publicly available public-records determinations, court decisions, advisory opinions and compliance audits (Young & Wikes, 2026). The review matched independent government auditors in all five cases where comparable audit findings existed, and it showed no association with appellate outcome, which suggests that whether a decision can be reconstructed and whether it was upheld are different properties. That study used real documents but relied mainly on one reader. The present study takes the opposite approach, with constructed documents and an international panel of independent reviewers."),
("p", "Measuring agreement between reviewers has known pitfalls. Cohen's and Fleiss' kappa coefficients can produce low values despite high raw agreement when one category dominates (Byrt et al., 1993; Feinstein & Cicchetti, 1990; Fleiss, 1971). Gwet (2008) proposed the AC1 coefficient partly to address this, and Krippendorff (2004) offers a further alternative. Performance estimates also depend on the cases chosen: a test evaluated on clear-cut examples will look better than it performs across the full range met in practice (Ransohoff & Feinstein, 1978; Whiting et al., 2011). Jacobs and Wallach (2021) add that an operational definition can come to stand in for the concept it was meant to capture, and Frimpong (2026) cautions that research instruments carried across settings may lose validity when their assumptions do not fit the new context."),
("h2", "Research Gap"),
("p", "The literature shows why records need to explain themselves and why oversight matters to the value of artificial intelligence in organisations. It says much less about the overseers. We know little about whether the people who review consequential records can recognise one that lacks its own basis, or how consistent they are when they try. Without that evidence, institutions cannot judge what their review is worth or what it should cost. The underlying idea, that a record should allow its decision to be reconstructed, is long established in administrative law and audit practice. To the authors' knowledge, however, it has not previously been measured as a property of the individual record with a stated instrument, a stated scale and reported detection and agreement statistics. This study takes that step. This study supplies initial evidence on those questions for records drafted with generative artificial intelligence."),

("h1", "METHODOLOGY"),
("h2", "Definitions"),
("p", "A conclusion is referred to here as supported when an independent reviewer can find, in the record alone, the evidence it rests on and can follow the reasoning from that evidence to the conclusion. A conclusion is unsupported when the record states it without that basis, so the reviewer cannot work out why the decision went as it did. The risk that unsupported records create is referred to as decision reconstruction risk."),
("p", "Whether a record can be reconstructed depends partly on who reads it and what they may bring to it. The study therefore fixed one standpoint: a reviewer who is competent in the domain, has the record and generally available professional knowledge, and has no access to the original decision-maker or to papers outside the file. A supported conclusion may still be wrong, but its error is visible and can be challenged; an unsupported conclusion may happen to be right, but nobody reading the file can confirm it."),
("h2", "Design and Registration"),
("p", "The study measured detection. Independent reviewers classified a balanced corpus of constructed records, and their answers were scored against a reference classification fixed beforehand. The protocol, analysis plan and decision thresholds were fixed and time-stamped on 6 July 2026, before the reference classification was verified and before any accuracy analysis was run; the dated documents are available from the authors. Data collection closed on 15 August 2026. The design has no comparison arm. A separate randomised study, using the same records with different participants, compares review with and without a structured instrument and is reported elsewhere."),
("h2", "Corpus"),
("p", "The corpus consists of 24 constructed records from settings where decisions carry real consequences: human resources and employment, investigations, compliance and audit, public records, and AI-assisted summaries. Twelve records are supported and twelve unsupported. They were shown unlabelled and in random order. Each was generated with large-language-model assistance and then edited by the first author to fit its intended class, and none is based on a real case, person or organisation. The study did not keep a construction log detailed enough to reconstruct how each record was generated (model and version, date, prompt and extent of editing)."),
("p", "Records were built at the two ends of the quality range so that the detection question could be posed cleanly. Real files are spread across that range, with many partly supported or ambiguous. Clear cases make classification easier, much as a diagnostic test assessed on obvious cases overstates how it performs in the clinic (Ransohoff & Feinstein, 1978; Whiting et al., 2011). The accuracy figures below describe performance on clear cases and should be read that way."),
("h2", "Reference Classification"),
("p", "Before verification began, the first author recorded a classification for each record together with the specific evidentiary gap or support behind it. That document was time-stamped and left unchanged. Three separate large-language-model instances then classified all 24 records under the same operational rule, with no access to the intended labels or to each other, producing 72 classifications. All three reproduced the intended classification for every record, so the registered adjudication step was never triggered and no label changed. The registration called for two passes with adjudication if they disagreed; three were run."),
("p", "This check confirms that the classification follows consistently from the rule and that it was not adjusted to fit reviewers' answers after the event. It falls short of independent validation, since the automated raters were briefed by the authors on what the two classes mean. No human has yet replicated the reference independently. Unanimous agreement across all 24 records is also a further sign that the corpus contains clear cases."),
("h2", "Participants"),
("p", "All reviewers were credentialed experts, practitioners and researchers in AI governance, compliance, audit, human resources, investigations, data privacy, records management and law, recruited through professional networks. By the data lock, 16 had completed all 24 records. They worked in 11 countries on five continents: Australia, Germany, India, Nigeria, Poland, Singapore, South Korea, Spain, the United Arab Emirates, the United Kingdom and the United States. Another eleven accepted an invitation but never started. Reviewers did not know the reference classification, could not see each other's answers and were not told that the corpus was balanced. All took part unpaid and in a personal capacity. Because the panel chose to take part out of interest in documentation governance, it represents no defined population. The panel was recruited internationally on purpose. Reviewers from different legal traditions and professions differ in what they expect a record to state and what they assume a reader already knows, and an unsupported record relies on exactly those assumptions to look complete. A panel drawn from several systems is less likely to share one blind spot, although, as the Limitations note, it cannot establish that the results hold equally in every setting."),
("h2", "Analysis"),
("p", "Accuracy was calculated for each reviewer. The panel estimate is the mean of the 16 reviewer accuracies with a Student t interval, so each reviewer counts as one independent unit. Treating all 384 judgments as independent would overstate precision, since one reviewer's answers reflect one person's threshold. Where a reviewer resubmitted a record, the latest answer was used. The registered exclusion rule, which removed anyone completing fewer than 18 records, excluded nobody. Of 385 stored rows after de-duplication, one was an administrative marker and was dropped, leaving 384 scorable judgments."),
("p", "The registered detection criterion had two parts. The lower bound of the 95 percent confidence interval had to exceed 0.50, the chance rate on a balanced corpus, and the point estimate had to reach 0.70. The 0.70 figure was a practical floor chosen in advance; it was not derived from any cost model, and readers can judge the reported interval against their own threshold."),
("p", "After registration, a mixed-effects logistic model with crossed random intercepts for reviewer and record was added to separate differences between reviewers from differences in record difficulty (Barr et al., 2013; Bates et al., 2015). It was fitted by Laplace-approximated maximum likelihood with profile-likelihood intervals. Because it was added later, it is treated as exploratory and plays no part in the registered criterion."),
("h2", "Reliability Analysis"),
("p", "Agreement between reviewers was measured in a separate sample, where raters applied a five-condition structured review to a shared set of records. The five conditions ask whether the conclusion can be reconstructed from the record alone, whether the record identifies the basis for its conclusions, whether its chronology holds together, whether the reasoning from evidence to conclusion can be followed, and whether the record contains enough evidence for the weight of the decision. Some raters were invited directly and others enrolled through an open review page. All raters were experienced practitioners. The two groups are reported separately because they arrived by different routes, which says nothing about their expertise."),
("p", "Gwet's (2008) AC1 was registered as the primary coefficient because it copes better than kappa with skewed category distributions (Byrt et al., 1993; Feinstein & Cicchetti, 1990); Krippendorff's (2004) alpha and Fleiss' (1971) kappa were computed alongside it. The registered criterion required a point estimate of at least 0.61 and a lower 95 percent confidence bound of at least 0.41. Only labels recorded under the five-condition review were analysed, keeping each rater's latest label per record. Sixteen labels from raters who worked under an unstructured baseline prompt were left out, because those raters were answering a different question with a different tool and mixing the two would measure agreement between methods instead of the reliability of one."),

("h1", "RESULTS"),
("h2", "Panel Detection"),
("p", "Table 1 gives the main result. Both parts of the registered detection criterion were met."),
("caption", "Table 1. Detection of supported and unsupported records by the reviewer panel"),
("table", [["Measure", "Result"],
           ["Mean reviewer-level accuracy", "83.9%"],
           ["95% confidence interval (participant level, n = 16)", "72.7 to 95.1"],
           ["Sensitivity (unsupported records correctly identified)", "87.0%"],
           ["Specificity (supported records correctly identified)", "80.7%"],
           ["Registered criterion: point estimate at least 70%", "Met"],
           ["Registered criterion: lower bound above 50%", "Met"]]),
("note", "Source: developed by the authors from 384 judgments by 16 reviewers on 24 records."),
("p", "The lower end of the confidence interval, 72.7 percent, lies above the 70 percent target as well as above chance, so the panel's accuracy exceeds the target even at the lower end of its 95 percent confidence interval."),
("p", "Sensitivity was about six percentage points higher than specificity, so reviewers were somewhat more inclined to flag a sound record than to pass a flawed one. The paired data needed to test this difference were not kept in a usable form, and it is reported as a direction only."),
("h2", "Individual Reviewers"),
("p", "Behind the panel average, individual performance was very uneven (Table 2)."),
("caption", "Table 2. Variation in performance between individual reviewers"),
("table", [["Measure", "Mean", "SD", "Range across reviewers", "Reviewers at 100%"],
           ["Accuracy", "83.9%", "21.0", "37.5 to 100", "6 of 16"],
           ["Sensitivity", "87.0%", "24.2", "25.0 to 100", "11 of 16"],
           ["Specificity", "80.7%", "25.8", "16.7 to 100", "7 of 16"]]),
("note", "Source: developed by the authors."),
("p", "Six reviewers classified every record correctly, and 11 of the 16 caught every unsupported record. At least one reviewer scored below the 50 percent chance rate. The lowest scorers' answers were checked for straight-lining, uniform responses and missing data. Their judgments varied from record to record and were complete, so they were kept."),
("p", "The records themselves varied much less. Record-level accuracy ranged from 62.5 to 93.8 percent, and every record was classified correctly by at least 10 of the 16 reviewers. Six records were classified correctly by 15 reviewers, and the hardest by 10. No record was missed by a majority of the panel, so errors were spread across the corpus instead of clustering on a few ambiguous files. Figure 1 shows the distribution."),
("caption", "Figure 1. Accuracy by record across the expert panel"),
("figure", "research/sec_detection_2026-10-26/Figure1.png"),
("note", "Note: bars show the percentage of the 16 experts who classified each record correctly, ordered from hardest to easiest; the class of each record is not shown, so that the reference classification is not disclosed. Source: developed by the authors."),
("p", "The exploratory crossed model points the same way. The reviewer standard deviation on the logit scale was 1.769 (profile 95 percent interval 1.292 to 3.000), which gives a latent-scale reviewer intraclass correlation of 0.488. The record standard deviation was estimated at the boundary, 0.011 (interval 0.001 to 0.556). With only 24 records, that component is poorly identified and its interval allows a moderate effect, so record difficulty cannot be ruled out. On this corpus, though, differences between reviewers clearly outweighed differences between records. Allowing for record difficulty left the performance estimate essentially unchanged: the model puts an average reviewer on an average record at 89.2 percent."),
("h2", "Agreement Between Reviewers"),
("p", "Of 25 reliability participants, 22 recorded labels under the five-condition review, 8 invited and 14 from open enrolment. Three open-enrolment raters used only the baseline prompt and were excluded. Agreement can only be estimated for records seen by at least two raters. Ten records met that condition, carrying 113 determinations, or 104 once each rater's latest label per record was kept. Table 3 shows the coefficients."),
("caption", "Table 3. Chance-corrected agreement on the overall determination"),
("table", [["Group", "Records", "Labels", "Raters", "AC1", "95% CI (analytic, registered)", "95% CI (bootstrap, sensitivity)"],
           ["Invited", "10", "36", "8", "0.739", "0.402 to 1.000", "0.427 to 1.000"],
           ["Open enrolment", "10", "68", "14", "0.623", "0.252 to 0.993", "0.285 to 0.894"]]),
("note", "Note: AC1 is Gwet's first-order agreement coefficient. Source: developed by the authors."),
("p", "The registered reliability criterion was not met. Both point estimates clear 0.61, but the analytic lower bounds, 0.402 for the invited group and 0.252 for open enrolment, both fall below 0.41. A bootstrap interval would put the invited group's lower bound at 0.427, above the line. The analytic interval was the one registered, however, and picking whichever interval passes after seeing both would defeat the purpose of registration, so the bootstrap figure is reported only as a sensitivity check. It shows that the invited group missed narrowly and that the verdict depends on how the interval is calculated, which in turn reflects how little ten records can establish. The planned pooled set was about 26 records, and these coefficients are interim."),
("p", "Including the baseline-prompt labels would have changed the picture considerably, cutting the open-enrolment coefficient to between 0.16 and 0.18. The rule excluding them was part of the design from the start and was not chosen after either figure was known."),
("h2", "Supporting Analyses"),
("p", "Two descriptive analyses help interpret these results. The first looks at the five conditions of the structured review. Across the 565 condition-level labels in the reliability sample, raters most often marked evidentiary sufficiency as not met (77.9 percent), followed by chronological integrity (65.5 percent), traceability of reasoning (64.6 percent), reconstructability from the record alone (57.5 percent) and identification of the basis (51.3 percent). The conditions feed the overall determination, so their link to it is expected and shows nothing about whether each condition discriminates on its own. What the pattern does show is where raters most often located the weakness: in whether the file held enough to carry the weight of the decision."),
("p", "The second looks at automated application. Three large language models from three different vendors applied the same review each night to a fixed set of 15 records, over 41 runs between 29 June and 15 August 2026. Mean pairwise agreement on the overall determination was 87.2 percent (95 percent CI 86.2 to 88.2). Agreement between models is a different thing from accuracy, since three models can agree and all be wrong. The finding indicates only that software can apply the review consistently, which is relevant if organisations want to use such tools to decide which files a person should look at first."),

("h1", "DISCUSSION"),
("h2", "What the Results Show"),
("p", "Reviewers who had never seen the records and did not know the answers identified unsupported conclusions in AI-drafted files at 83.9 percent, comfortably above a target set before the data came in. At least for clear cases, then, the problem is recognisable to independent experts, and human review has a factual basis on which to build."),
("p", "Individual results temper that conclusion. Every reviewer was a credentialed expert, yet accuracy ran from 37.5 to 100 percent, and most of the spread came from the reviewers. Expertise alone did not guarantee dependable judgment. Agreement between raters also missed its registered lower bound. Detection worked as something a group of reviewers can do; for any single reviewer it remains unproven."),
("h2", "Socioeconomic Implications"),
("p", "Staffing comes first. Organisations usually plan review on the basis that one competent person per file is enough. For AI-drafted records, these results cast doubt on that assumption. A panel figure tells a manager little about the colleague who will actually read a given file, and nothing in the file reveals which kind of reviewer it got. Making review dependable could mean calibrating reviewers against cases with known answers, sending a sample of files to a second reader, or adjudicating disagreements. All of these take staff time. Drafting tools are often adopted for productivity gains of this kind (Mushkudiani et al., 2026), so part of the saving may have to be spent on checking the output. How much depends on the stakes of the decisions and on what errors cost, neither of which this study measured. In the terms of agency theory, the results show that the same monitoring expenditure can buy very different protection depending on who performs it, so the residual loss an organisation carries is partly a function of reviewer assignment (Jensen & Meckling, 1976)."),
("p", "Fairness is the second concern. An unsupported record that passes review does not disappear. Its cost comes back later, usually as an appeal the affected person has to bring or as a decision the organisation cannot defend. Because reviewers differ so much, whether a particular person's flawed file is caught depends partly on which reviewer it reaches. Nobody intends that inequality, and the person affected cannot see it. In employment, benefits and public services, where the individual usually has far fewer resources than the institution, it adds to the uneven burden described in the Introduction. Van der Nest and Sheik (2026) report a related gap in algorithmic management: in the research they reviewed, the points at which algorithmic scores turn into sanctions were the least examined."),
("p", "Capacity differs between institutions as well as between reviewers. A large employer or national agency can afford to train reviewers, run calibration exercises and pay for a second reading of its most consequential files. A small municipality, a charity or a firm with a single compliance officer usually cannot. Those smaller bodies may be the keenest adopters of drafting tools, since they are short of staff, and they are the least able to absorb the checking that the tools appear to require. If that pattern holds, generative drafting could widen the gap in decision quality between well-resourced and poorly resourced institutions, and the people who deal with the second group would bear the difference. This is a hypothesis that the present data cannot test. It does suggest that guidance and shared resources for review, such as common calibration sets, may matter as much for smaller institutions as the drafting tools themselves."),
("p", "Records also carry institutional memory. Staff move on, retire or leave, and the record is often the only account of a decision that remains. A file that only its author could explain turns the organisation's memory into one person's recollection, which fades and eventually disappears. Where generative drafting produces polished records that lack their basis, an organisation may build up decisions it cannot later explain, a cost that appears only when someone asks. Measuring whether reviewers can catch such records is therefore also a way of protecting what the organisation knows about its own past decisions."),
("p", "Trust and regulation form the third concern. The OECD (2017) links public trust to compliance and to the cost of implementing policy, and Grimmelikhuijsen and Meijer (2014) show that transparency builds trust only when what is released makes sense to the reader. If AI-drafted records spread faster than institutions learn to check them, more will be disclosed while less is understood. Rules requiring human oversight of high-risk systems (European Union, 2024) presume that oversight works. These results suggest it should be measured, and that the individual reviewer, as well as the review process, is the right thing to measure. Oluka (2026) reaches a compatible conclusion for municipal finance, where the impact of digital compliance tools was constrained by poor data integration, limited digital readiness and uneven accountability."),
("p", "The direction of reviewer error has its own economics. Sensitivity was somewhat higher than specificity here, though the difference could not be tested. Both errors cost money. A missed unsupported record pushes costs onto the affected person and onto whoever must later reconstruct the decision. A sound record wrongly flagged causes delay, repeat review, paperwork and reviewer fatigue, and a slow decision can sometimes harm a person more than an imperfect one. Which error to tolerate depends on the stakes and on local costs, and those costs are best stated openly before review thresholds are set."),
("h2", "Implications for Practice"),
("p", "Several low-cost steps follow from the findings. An organisation can test its own reviewers on a small set of files whose answers are known, instead of assuming a published panel figure applies to them. It can send its highest-stakes files to two reviewers and treat their disagreement as a reason to look again. It can ask reviewers to record why they passed a file as well as whether they did, so later auditors can see the reasoning. And it can track how often reviewed files are later found deficient on appeal or audit, which is the evidence needed to judge whether review is worth what it costs. None of these steps was tested here, and each should be evaluated where it is used."),
("h2", "Relation to the Companion Study"),
("p", "The companion study of 32 public-records determinations (Young & Wikes, 2026) came at the same question from the other side. It used real public documents and found that a record-level review matched independent government auditors in all five cases with comparable audit findings, and that it bore no relation to appellate outcome. Its main weakness was reliance on one reader. This study used constructed documents and a large international panel, so its strength and weakness are reversed. Taken together, they suggest that whether a record can be reconstructed is a property that can be assessed on real material and recognised by independent experts, and that the weak link in practice may be the consistency of individual reviewers. Both studies share authors and neither validates the other, so the agreement between them is a reason to test further."),
("h2", "AI Drafting as Context"),
("p", "All 24 records were AI-generated, and the study included no human-written comparison set. People write unsupported records as well, so the results say nothing about whether AI drafting causes the problem or makes it harder to detect. AI-drafted records were chosen because reviewers increasingly face them and because their polish strips away cues a reviewer might otherwise use. A matched comparison of AI-drafted and human-drafted files would be needed to test whether drafting source affects detection."),
("h2", "Strengths of the Design"),
("p", "Several features of the design support confidence in the main result. The analysis plan and thresholds were fixed before any accuracy analysis. Reviewers did not know the answers, the balance of the corpus or each other's judgments. The reference classification was reproduced on all 72 automated checks without access to the intended labels. Accuracy was analysed with reviewers as the unit, so precision was not overstated, and an exploratory model allowing for record difficulty left the estimate essentially unchanged. The panel spanned 11 countries and several professions. Three models from three different vendors applied the same review with 87.2 percent agreement, which indicates that the review examines the record itself and can be applied whichever drafting tool produced it. Finally, every registered criterion is reported, including the reliability criterion that was not met. That openness is deliberate: a result reported together with its shortfalls gives institutions a sounder basis for decisions than one reported selectively."),
("h2", "Limitations"),
("p", "The first author built the records and set their classification. Automated reproduction shows that the reference was not fitted to the results, but the reference still reflects the authors' definition, so the finding is that independent experts recognise that definition (Jacobs & Wallach, 2021). The corpus held only clear cases in equal numbers, and its accuracy, sensitivity and specificity should not be carried over to ordinary files or to the share of unsupported records found in practice. The expert panel was small and self-selected, and how less experienced reviewers or people outside these fields would perform is unknown. With one to three reviewers per country, the study could not test for national or linguistic differences, and as Frimpong (2026) argues, an instrument's validity in one setting cannot simply be assumed in another. Why reviewers differed was not analysed in advance and could not be explained with 16 people. The reliability evidence is interim, rests on ten records and missed its registered lower bound. A complete generation log for the records, and full execution records for the automated reference check, were not kept. The study was not reviewed by an ethics committee, as explained in the Informed Consent Statement. Finally, the authors defined the construct, built the records, set the reference, recruited the participants and planned the analysis; registration, blinding, automated reproduction of the reference and the reporting of a failed criterion reduce that dependence without eliminating it."),
("h2", "Further Research"),
("p", "The most useful next steps follow from those limitations. A corpus built and classified by researchers with no stake in the construct would test whether the finding survives independent definition. Records spanning supported, partly supported, ambiguous and unsupported files would show how reviewers perform where judgment is hard. A larger reliability set would allow informative confidence bounds. A matched comparison of AI-drafted and human-drafted files would address the question of drafting source, and a trial comparing unaided with structured review would show whether a review instrument helps. Field studies using properly authorised real records, under independent ethical review, would test performance in practice. Studies that measure the staff time needed for calibration and double review would allow the cost trade-off discussed above to be put in numbers."),

("h1", "CONCLUSIONS"),
("p", "Expert reviewers, working independently and without the answer key, distinguished supported from unsupported conclusions in AI-drafted decision records at a mean accuracy of 83.9 percent, clearing a target fixed in advance. Sixteen reviewers in 11 countries made 384 judgments."),
("p", "The same data show where that result stops. Accuracy ranged from 37.5 to 100 percent between reviewers. Most of that spread came from the reviewers rather than the records, and agreement between raters fell short of its registered standard. Reviewers succeeded as a panel. As individuals they could not yet be relied on, and organisations should not treat a panel figure as the accuracy of the person they assign."),
("p", "For employers and public bodies adopting generative drafting, human review is a safeguard whose value depends on who performs it and how it is organised. Its effectiveness should be measured rather than assumed, and the staff cost of calibration or double review should be weighed against the costs that unsupported decisions place on the people they affect. The study adds to this journal's discussion of AI assurance and digital oversight (Oluka, 2026; van der Nest & Sheik, 2026) by measuring the overseers themselves, and it gives agency-theoretic arguments about monitoring an empirical starting point for decision records. These conclusions rest on constructed clear-cut records and a reference set by the authors. Within those limits, the study shows that whether a record carries the basis for its conclusion can be measured, and that professional judgments about it differ substantially from one reviewer to the next."),

("h1", "AUTHOR CONTRIBUTIONS"),
("p", "Conceptualization, P.W.; methodology, P.W. and U.H.; validation, U.H.; formal analysis, P.W. and U.H.; investigation, P.W.; resources, P.W.; data curation, P.W.; writing (original draft preparation), P.W.; writing (review and editing), P.W. and U.H.; supervision of the reliability and validation framework, U.H.; project administration, P.W. P.W. conceived the construct and the review method, constructed the corpus, wrote the reference classification and assembled the reviewer panel. U.H. designed the reliability and validation framework: the reference-panel design, the chance-corrected agreement statistics, and the registered decision thresholds and analysis plan. Neither author took part in the automated reproduction of the reference classification or graded any record in the detection panel. All authors have read and agreed to the published version of the manuscript."),
("h1", "ACKNOWLEDGEMENTS"),
("p", "The detection panel, 16 independent experts across 11 countries and five continents, each read the full 24-record corpus without knowing the reference classification and returned 384 graded judgments. This paper's main result is theirs. The reliability study involved 25 raters, eight invited and seventeen enrolled through an open review page. Twenty-two of them worked under the five-condition review and form the analysed sample; the other three worked under the unstructured baseline prompt, and their labels are excluded under the rule stated in the Methodology. All 25 are credited here because all 25 did the work. A further 20 independent experts completed the same corpus in a separate comparison study, which is reported elsewhere."),
("p", "These three groups comprise 61 participations held by 58 distinct people, since three reliability raters also served on the detection panel. All 58 worked unpaid, in a personal capacity and with nothing at stake in the outcome. Contributors are named only with their consent; none is an author of this paper, and any contributor may withdraw their name at any time. Reviewers who have not recorded a choice are counted in every figure and are not named."),
("p", "Thirty-two contributors chose to be named. Each name and description below is given as that person recorded it:"),
("n", 'Adesh Sharma, Data and AI Governance Leader | IAPP AIGP CIPT; Digital Frontier Partners'),
("n", 'Andres Lage Freire, Operational AI Governance Lead & Responsible AI Architect; Independent Consultant'),
("n", 'Andrey Ekhmenin, Founder, ANDEKS™; Independent Governance Assessment and Diagnostics'),
("n", 'Andrzej Skulski, Founder | AI Governance & Decision Systems; Dom Ciszy – Resonance Lab'),
("n", 'Boris Khazin, AI Governance, Digital Risk and GRC leader; ClearView MRI; ex-EPAM Global Head of DRM/GRC; Khazin Consulting LLC'),
("n", 'Candid Opris, Founder and Managing Partner, Opris & Associates Inc.; two decades in AI and data governance and digital trust'),
("n", 'Donavine Smith, Board & Executive Advisor | Frontier AI Strategy & Governance; Independent'),
("n", 'Dr. Eric J. W. Orlowski, AI Governance Specialist, Ethnographer, Tech Policy Researcher; Research Fellow, NUS AI Institute; PhD, UCL'),
("n", 'Dr. Gabriela Bar, attorney at law, AI ethics advisor; Gabriela Bar Law & AI'),
("n", 'Dr. Nitin Deshpande, Chief Human Resources Officer; Cooper Corporation Pvt Limited'),
("n", 'Dr. Sharon Licqurish, PhD, CEO, Chief Scientist and AI Governance Architect, AIIP; Ontocore Licencing Authority LLC'),
("n", 'Franciscus C Schouten, AI Governance and Assurance; The AI Non-Delegation Doctrine'),
("n", 'Gabriela Cortez, Education and Outreach/Intake; Maryland Commission on Civil Rights'),
("n", 'Greg Searle, AI Governance and Model Behaviour Researcher; Anypoint Pty Ltd'),
("n", 'Hekim Colpan, AI Governance and Compliance Manager | Data Protection Manager | ISO/IEC 42001 Auditor'),
("n", 'Jake McDonough, AI Governance; SAEONYX Global Holdings LLC'),
("n", 'Jean-Luc Adade, Regional IT Leader, West, Central and North Africa; IT governance and digital transformation'),
("n", 'Joseph Mungai, AI Governance and public policy researcher; Independent Researcher, Kenya'),
("n", 'MacKenzie McCowan, AI Governance Specialist, PhD candidate, Lecturer; Atomi; The University of Sydney; Avondale University'),
("n", 'Mostafa Mahmoudi, AI Governance Researcher; Founder and Director, Iran Tech Diplomacy Institute; PhD candidate, University of Tehran'),
("n", 'Muhammad Dauda, Programme leadership, sustainability and governance; UN SDSN Youth Nigeria; Miva Open University; PgMP'),
("n", 'Nicholas Evans, AI Governance and Runtime Auditor; adversarial and non-adversarial testing; ex-USMC'),
("n", 'Nigel Hee, AI Ethics, Safety and Governance; University of Glasgow'),
("n", 'Olabanji Lawal, Operations and records management; ALTV'),
("n", 'Priyam Dhamankar, Ethics and Compliance Leader, Cummins India Limited; 17+ years legal, compliance and investigations'),
("n", 'Rahul Potdar, Independent Director; Corporate Governance, Risk Management and ESG Strategy; Board Adviser; Leontra Technologies; IIM Raipur'),
("n", 'Sagarika Banerjee, AI Governance and Software QA Leader; ISO/IEC 42001, NIST AI RMF; on sabbatical until March 2027'),
("n", 'Saurabh Nanda, General Manager, APAC; healthcare'),
("n", 'Sidharth Borah, Advocate, High Court of Delhi; Partner, Gurinder and Partners'),
("n", 'Stacyann Young, Public records and FOIL practice; Independent Researcher'),
("n", 'SungSoo In, Independent Researcher; Founder, Athena Governance Architecture'),
("n", 'Wendy Ann Martel, Founder and Strategic Advisor, Data, Privacy & AI Governance; Evata Consulting'),
("p", "Five further contributors chose not to be named. Their judgments are counted in every figure reported here, and they appear nowhere by name."),
("h1", "STATEMENT ON THE USE OF AI TOOLS"),
("p", "AI tools were part of the research design and are described where they occur: the corpus was generated with large-language-model assistance and edited by the first author, and the reference classification was reproduced by three automated raters briefed by the authors. Generative AI tools also supported the writing and production of this manuscript, helping restructure and edit the text under the authors' direction. Every research judgment was made by the authors, who reviewed all content and take full responsibility for it. AI tools do not meet the criteria for authorship and are not listed as authors."),
("h1", "FUNDING"),
("p", "There is no funding for this research."),
("h1", "CONFLICT OF INTEREST"),
("p", "P.W. created the construct and the review method studied here, constructed the corpus, wrote the reference classification, recruited the panel, has a continuing professional interest in the method and would benefit professionally and commercially from its adoption. U.H. designed the validation and reliability framework and would benefit reputationally from its use. No commercial arrangement is contingent on any result reported here, and no participant had any financial interest in the outcome."),
("h1", "DATA AVAILABILITY STATEMENT"),
("p", "The 24 constructed records, the reference classification with the reason for each record, the instructions given to the automated raters and their record-by-record results, aggregate result tables and the analysis scripts are available from the corresponding author on reasonable request. Participants consented to the use of their responses in aggregate, so individual reviewer responses are not publicly shared; de-identified participant-level data are available from the corresponding author on reasonable request. A complete record-level generation log was not retained."),
("h1", "INFORMED CONSENT STATEMENT"),
("p", "This study was not reviewed by an institutional review board or ethics committee. It was conducted outside any institution holding one, by independent researchers. Every participant was a credentialed expert who volunteered in a professional capacity to give professional judgments about wholly synthetic documents. No approval or exemption was sought or granted. All participants gave informed consent, took part voluntarily, unpaid and in a personal capacity, and could withdraw at any time before publication. They were told in advance that the reference classification and the composition of the corpus would not be disclosed during review, because disclosure would compromise the blinded task. No personal data beyond name, professional title, country and contact address was collected, no vulnerable population was involved, and responses are reported only in aggregate. Independent ethical review would be sought for any successor study involving real records or real case outcomes."),
]

REFERENCES = [
    'Akerlof, G. A. (1970). The market for "lemons": Quality uncertainty and the market mechanism. The Quarterly Journal of Economics, 84(3), 488–500. https://doi.org/10.2307/1879431',
    'Jensen, M. C., & Meckling, W. H. (1976). Theory of the firm: Managerial behavior, agency costs and ownership structure. Journal of Financial Economics, 3(4), 305–360. https://doi.org/10.1016/0304-405X(76)90026-X',
    'Ananny, M., & Crawford, K. (2018). Seeing without knowing: Limitations of the transparency ideal and its application to algorithmic accountability. New Media & Society, 20(3), 973–989. https://doi.org/10.1177/1461444816676645',
    'Barr, D. J., Levy, R., Scheepers, C., & Tily, H. J. (2013). Random effects structure for confirmatory hypothesis testing: Keep it maximal. Journal of Memory and Language, 68(3), 255–278. https://doi.org/10.1016/j.jml.2012.11.001',
    'Bates, D., Mächler, M., Bolker, B., & Walker, S. (2015). Fitting linear mixed-effects models using lme4. Journal of Statistical Software, 67(1), 1–48. https://doi.org/10.18637/jss.v067.i01',
    'Bender, E. M., Gebru, T., McMillan-Major, A., & Shmitchell, S. (2021). On the dangers of stochastic parrots: Can language models be too big? In Proceedings of the 2021 ACM Conference on Fairness, Accountability, and Transparency (pp. 610–623). ACM. https://doi.org/10.1145/3442188.3445922',
    'Bovens, M. (2007). Analysing and assessing accountability: A conceptual framework. European Law Journal, 13(4), 447–468. https://doi.org/10.1111/j.1468-0386.2007.00378.x',
    'Byrt, T., Bishop, J., & Carlin, J. B. (1993). Bias, prevalence and kappa. Journal of Clinical Epidemiology, 46(5), 423–429. https://doi.org/10.1016/0895-4356(93)90018-V',
    'Citron, D. K. (2008). Technological due process. Washington University Law Review, 85(6), 1249–1313.',
    'Cobbe, J., Lee, M. S. A., & Singh, J. (2021). Reviewable automated decision-making: A framework for accountable algorithmic systems. In Proceedings of the 2021 ACM Conference on Fairness, Accountability, and Transparency (pp. 598–609). ACM. https://doi.org/10.1145/3442188.3445921',
    'Feinstein, A. R., & Cicchetti, D. V. (1990). High agreement but low kappa: I. The problems of two paradoxes. Journal of Clinical Epidemiology, 43(6), 543–549. https://doi.org/10.1016/0895-4356(90)90158-L',
    'Fleiss, J. L. (1971). Measuring nominal scale agreement among many raters. Psychological Bulletin, 76(5), 378–382. https://doi.org/10.1037/h0031619',
    'Frimpong, V. (2026). The challenge of context-free validity: Introducing the contextual research validity index framework for situated legitimacy under socioeconomic challenges. SocioEconomic Challenges, 10(1), 42–49. https://doi.org/10.61093/sec.10(1).42-49.2026',
    'Gebru, T., Morgenstern, J., Vecchione, B., Vaughan, J. W., Wallach, H., Daumé III, H., & Crawford, K. (2021). Datasheets for datasets. Communications of the ACM, 64(12), 86–92. https://doi.org/10.1145/3458723',
    'Grimmelikhuijsen, S., & Meijer, A. (2014). Effects of transparency on the perceived trustworthiness of a government organization: Evidence from an online experiment. Journal of Public Administration Research and Theory, 24(1), 137–157. https://doi.org/10.1093/jopart/mus048',
    'Gwet, K. L. (2008). Computing inter-rater reliability and its variance in the presence of high agreement. British Journal of Mathematical and Statistical Psychology, 61(1), 29–48. https://doi.org/10.1348/000711006X126600',
    'Jacobs, A. Z., & Wallach, H. (2021). Measurement and fairness. In Proceedings of the 2021 ACM Conference on Fairness, Accountability, and Transparency (pp. 375–385). ACM. https://doi.org/10.1145/3442188.3445901',
    'Ji, Z., Lee, N., Frieske, R., Yu, T., Su, D., Xu, Y., Ishii, E., Bang, Y. J., Madotto, A., & Fung, P. (2023). Survey of hallucination in natural language generation. ACM Computing Surveys, 55(12), 1–38. https://doi.org/10.1145/3571730',
    'Kaminski, M. E., & Urban, J. M. (2021). The right to contest AI. Columbia Law Review, 121(7), 1957–2048.',
    'Krippendorff, K. (2004). Content analysis: An introduction to its methodology (2nd ed.). Sage.',
    'Mashaw, J. L. (1983). Bureaucratic justice: Managing social security disability claims. Yale University Press.',
    'Mitchell, M., Wu, S., Zaldivar, A., Barnes, P., Vasserman, L., Hutchinson, B., Spitzer, E., Raji, I. D., & Gebru, T. (2019). Model cards for model reporting. In Proceedings of the Conference on Fairness, Accountability, and Transparency (pp. 220–229). ACM. https://doi.org/10.1145/3287560.3287596',
    'Mushkudiani, Z., Tchanturia, N., Dalakishvili, R., Surmanidze, N., & Mushtaq, N. (2026). Socioeconomic challenges of artificial intelligence-driven digital transformation: The functional mechanism model. SocioEconomic Challenges, 10(3), 40–62. https://doi.org/10.61093/sec.10(3).40-62.2026',
    'van der Nest, D. P., & Sheik, I. (2026). Algorithmic management and socioeconomic challenges: A systematic review of worker voice and AI assurance. SocioEconomic Challenges, 10(3), 214–239. https://doi.org/10.61093/sec.10(3).214-239.2026',
    'OECD. (2017). Trust and public policy: How better governance can help rebuild public trust. OECD Publishing. https://doi.org/10.1787/9789264268920-en',
    'Oluka, A. (2026). Irregular and wasteful expenditure as socio-economic challenges for local municipalities: RegTech and SupTech as digital mechanisms of compliance and oversight. SocioEconomic Challenges, 10(3), 17–39. https://doi.org/10.61093/sec.10(3).17-39.2026',
    'Raji, I. D., Smart, A., White, R. N., Mitchell, M., Gebru, T., Hutchinson, B., Smith-Loud, J., Theron, D., & Barnes, P. (2020). Closing the AI accountability gap: Defining an end-to-end framework for internal algorithmic auditing. In Proceedings of the 2020 Conference on Fairness, Accountability, and Transparency (pp. 33–44). ACM. https://doi.org/10.1145/3351095.3372873',
    'Ransohoff, D. F., & Feinstein, A. R. (1978). Problems of spectrum and bias in evaluating the efficacy of diagnostic tests. New England Journal of Medicine, 299(17), 926–930. https://doi.org/10.1056/NEJM197810262991705',
    'European Union. (2024). Regulation (EU) 2024/1689 of the European Parliament and of the Council of 13 June 2024 laying down harmonised rules on artificial intelligence (Artificial Intelligence Act). Official Journal of the European Union, L, 2024/1689.',
    'Tyler, T. R. (2006). Why people obey the law. Princeton University Press.',
    'Whiting, P. F., Rutjes, A. W. S., Westwood, M. E., Mallett, S., Deeks, J. J., Reitsma, J. B., Leeflang, M. M. G., Sterne, J. A. C., & Bossuyt, P. M. M. (2011). QUADAS-2: A revised tool for the quality assessment of diagnostic accuracy studies. Annals of Internal Medicine, 155(8), 529–536. https://doi.org/10.7326/0003-4819-155-8-201110180-00009',
    'Young, S., & Wikes, P. (2026). Can public-records determinations be independently reconstructed? Evidence from 32 public cases [Preprint]. SSRN. https://papers.ssrn.com/sol3/papers.cfm?abstract_id=7591521',
]


from docx.oxml import OxmlElement
from docx.oxml.ns import qn

FONT = "Cambria"
BOOK_TITLES = (
    "Content analysis: An introduction to its methodology",
    "Bureaucratic justice: Managing social security disability claims",
    "Trust and public policy: How better governance can help rebuild public trust",
    "Why people obey the law",
    "Can public-records determinations be independently reconstructed? Evidence from 32 public cases",
)


def _ppr(par, jc=None, line=None, before=None, after=None, first=None, left=None, hanging=None, style_id=None):
    ppr = par._p.get_or_add_pPr()
    if style_id:
        ps = ppr.find(qn("w:pStyle"))
        if ps is None:
            ps = OxmlElement("w:pStyle")
            ppr.insert(0, ps)
        ps.set(qn("w:val"), style_id)
    if line is not None or before is not None or after is not None:
        sp = OxmlElement("w:spacing")
        if line is not None:
            sp.set(qn("w:line"), str(line))
            sp.set(qn("w:lineRule"), "auto")
        if before is not None:
            sp.set(qn("w:before"), str(before))
        if after is not None:
            sp.set(qn("w:after"), str(after))
        ppr.append(sp)
    if first is not None or left is not None or hanging is not None:
        ind = OxmlElement("w:ind")
        if left is not None:
            ind.set(qn("w:left"), str(left))
        if first is not None:
            ind.set(qn("w:firstLine"), str(first))
        if hanging is not None:
            ind.set(qn("w:hanging"), str(hanging))
        ppr.append(ind)
    if jc:
        j = OxmlElement("w:jc")
        j.set(qn("w:val"), jc)
        ppr.append(j)


def _run(par, text, size, bold=False, italic=False, font=True):
    r = par.add_run(text)
    if font:
        r.font.name = FONT
    r.font.size = docx.shared.Pt(size)
    r.bold = bold or None
    r.italic = italic or None
    return r


def _marked(par, text, size, base_italic=False):
    """**bold** and *italic* markers."""
    for chunk in re.split(r"(\*\*.+?\*\*|\*.+?\*)", text):
        if not chunk:
            continue
        if chunk.startswith("**"):
            _run(par, chunk[2:-2], size, bold=True, italic=base_italic)
        elif chunk.startswith("*"):
            _run(par, chunk[1:-1], size, italic=not base_italic)
        else:
            _run(par, chunk, size, italic=base_italic)


def _apa_italics(ref):
    for t in BOOK_TITLES:
        if t in ref:
            return ref.replace(t, "*" + t + "*", 1)
    ref = re.sub(r"In (Proceedings[^(]*?) \(pp\.", r"In *\1* (pp.", ref)
    ref = ref.replace("Official Journal of the European Union, L, 2024/1689", "*Official Journal of the European Union*, L, 2024/1689")
    ref = re.sub(r"\. ([A-Z][A-Za-z&:' -]+?, \d+)(\(\d+(?:/\d+)?\))?, ", lambda m: ". *" + m.group(1) + "*" + (m.group(2) or "") + ", ", ref, count=1)
    return ref


def main(template, out):
    d = docx.Document(template)
    inherited = {rid for rid, rel in d.part.rels.items() if rel.reltype.endswith(("/image", "/comments"))}
    body = d.element.body
    sect = body[-1]
    for el in list(body):
        if el is not sect:
            body.remove(el)
    styles = {s.name for s in d.styles}

    def styled(style):
        return d.add_paragraph(style=style if style in styles else None)

    def body_par(text, first=283, left=None):
        par = styled("Normal")
        _ppr(par, jc="both", line=276, before=0, after=0, first=first, left=left)
        _marked(par, text, 10)
        return par

    par = styled("AR&P Level 0 Title of the Manuscript Style")
    _ppr(par, jc="center")
    _run(par, TITLE, 16, bold=True)
    for a in AUTHORS:
        par = styled("AuthorLine")
        _marked(par, a, 9)
    par = styled("AbstractText")
    _ppr(par, jc="both")
    _run(par, "Abstract:", 10, bold=True)
    _run(par, " ", 10)
    _run(par, ABSTRACT, 10, italic=True)
    for label, value in (("Keywords:", KEYWORDS + "."), ("JEL Classification:", JEL)):
        par = styled("KeywordsText")
        _run(par, label, 8, bold=True)
        _run(par, " " + value, 8)

    for kind, val in BODY:
        if kind == "h1":
            styled("AR&P Level 1 Style").add_run(val)
        elif kind == "h2":
            styled("AR&P Level 2 Style").add_run(val)
        elif kind == "p":
            body_par(val)
        elif kind == "n":
            body_par(val, first=0, left=283)
        elif kind == "caption":
            par = styled("AR&P Title of the Figures and Tables Style")
            _ppr(par, jc="center")
            r = par.add_run(val)
            r.bold = True
        elif kind == "note":
            par = styled("AR&P Source and Notes Style")
            _ppr(par, jc="center")
            _run(par, val, 8, italic=True)
        elif kind == "figure":
            par = styled("Normal")
            _ppr(par, jc="center", before=60, after=60)
            par.add_run().add_picture(val, width=docx.shared.Cm(16))
        elif kind == "table":
            t = d.add_table(rows=len(val), cols=len(val[0]))
            t.style = "Table Grid"
            tblpr = t._tbl.tblPr
            w = OxmlElement("w:tblW")
            w.set(qn("w:type"), "pct")
            w.set(qn("w:w"), "5000")
            for old in tblpr.findall(qn("w:tblW")):
                tblpr.remove(old)
            tblpr.append(w)
            hdr = t.rows[0]._tr.get_or_add_trPr()
            th = OxmlElement("w:tblHeader")
            th.set(qn("w:val"), "true")
            hdr.append(th)
            for r_i, row in enumerate(val):
                for c_i, cell_text in enumerate(row):
                    cpar = t.cell(r_i, c_i).paragraphs[0]
                    _ppr(cpar, jc="left" if c_i == 0 else "center", style_id="Compact")
                    _run(cpar, cell_text, 9, bold=(r_i == 0))
    styled("AR&P Level 1 Style").add_run("REFERENCES")
    for ref in sorted(REFERENCES, key=lambda x: x.lower().replace("van der ", "")):
        par = styled("Normal")
        _ppr(par, jc="left", line=276, before=0, after=60, left=283, hanging=283)
        _marked(par, _apa_italics(ref), 10)

    # Drop parts inherited from the template paper: its figures, comments and title metadata.
    part = d.part
    for rid in inherited:
        del part.rels[rid]
    d.core_properties.title = TITLE
    d.core_properties.subject = ""
    d.core_properties.author = "Phillip Wikes; Ubayet Hossain"
    d.save(out)


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
