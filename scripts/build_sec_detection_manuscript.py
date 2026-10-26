"""Build the SocioEconomic Challenges version of the detection study.

Uses the journal-template styles carried by the Young & Wikes SEC manuscript
(branch claude/tracker-2026-10-21) so both submissions share one format.

Usage: python3 scripts/build_sec_detection_manuscript.py <template.docx> <out.docx>
"""
import copy
import re
import sys

import docx

TITLE = ("Detecting Unsupported Conclusions in AI-Drafted Decision Records: "
         "Evidence from an International Expert Panel")

AUTHORS = [
    "**Phillip Wikes** (corresponding author, info@jrsstandard.com), Independent Researcher. ORCID: 0009-0009-7230-3661",
    "**Ubayet Hossain, FRM**, Independent Financial Risk & Model Validation Professional. ORCID: [ADD IF AVAILABLE]",
    "Type of manuscript: research paper",
]

ABSTRACT = (
    "Organisations and public bodies increasingly use generative artificial intelligence to draft the records that "
    "document consequential decisions about employment, benefits, investigations and compliance. Such records can "
    "read as complete while the evidence and reasoning behind their conclusions are missing, and when a decision is "
    "later challenged, the cost of reconstructing it falls on the affected person, the reviewing body and the "
    "organisation itself. Human review is the safeguard most institutions rely on, and regulation increasingly "
    "assumes it. This paper asks whether independent professional reviewers can in fact tell supported from "
    "unsupported conclusions in AI-drafted decision records, how much individual reviewers differ, and whether they "
    "agree closely enough for a single review to be relied on. In a pre-registered study, sixteen credentialed "
    "professionals in compliance, audit, human resources, investigations, privacy, records management and law, "
    "working in 11 countries, independently classified 24 constructed records, 12 with documented support for their "
    "conclusions and 12 without, producing 384 judgments. Reviewers were blind to a reference classification fixed "
    "in advance and reproduced on every record by three automated raters. Mean accuracy was 83.9 percent (95 percent "
    "CI 72.7 to 95.1), above a pre-registered target of 70 percent, with sensitivity of 87.0 percent and specificity "
    "of 80.7 percent. Individual accuracy ranged from 37.5 to 100 percent, and an exploratory model attributed most "
    "of the variation to reviewers rather than records. A separate reliability analysis met its pre-registered point "
    "estimate but not its lower confidence bound. The distinction is therefore detectable as a panel judgment but not "
    "yet dependable as an individual one. For institutions this means that a panel accuracy figure cannot be assumed "
    "for the reviewer actually assigned, and that whether an affected person's record is caught can depend on who "
    "reads it. Calibration, sampled double review and adjudication carry staff costs that need to be weighed against "
    "the costs unsupported decisions shift onto affected people, appeals bodies and regulators. The study does not "
    "establish performance on ambiguous or real records or any benefit of a structured review instrument. The records "
    "were constructed at the two extremes of documentation quality and classified by the first author, and both "
    "registered criteria are reported whether or not they were met, so the results should be read as a first, "
    "bounded test rather than as an estimate of performance in practice."
)

KEYWORDS = ("accountability; administrative justice; documentation; generative artificial intelligence; "
            "governance; inter-rater reliability; public trust; reviewer variation")
JEL = "D73; D83; H83; K23; M42; O33."

# Body: ("h1"|"h2"|"p"|"n"|"table"|"caption"|"note", payload)
BODY = [
("h1", "INTRODUCTION"),
("p", "A consequential decision usually leaves a record behind. An employment determination, a benefits refusal, an investigation finding or a compliance conclusion is written down, and that record is what any later review examines. When the decision is challenged through a complaint, an appeal, an audit or litigation, the reviewer rarely has access to the person who made it. The reviewer reads the record. Whatever can be learned about why the decision went the way it did must come from the document."),
("p", "That dependence has economic consequences. When a record does not carry the basis for its conclusion, the cost of finding out what happened moves to someone else: to the affected person, who must contest a decision whose reasons are unavailable; to the appeals body, regulator or court, which must rebuild the decision from submissions; and to the organisation, which cannot defend a decision it cannot itself explain. Those costs are unevenly distributed. A well-resourced party can litigate, whereas an individual seeking to understand a decision about their own job or benefits may not be able to. An unsupported record is therefore a channel through which the burden of institutional opacity can fall on those least able to bear it."),
("p", "Generative artificial intelligence changes the conditions under which such records are produced. Organisations increasingly use language models to draft decision memoranda, case summaries and determination letters. These systems produce professional, well-organised prose, and the quality of the prose is separable from whether the evidence behind a conclusion appears on the page (Bender et al., 2021; Ji et al., 2023). A model-drafted record can present a conclusion in the register of a well-founded one while the evidence and reasoning that would justify it are absent. The cues a reader ordinarily relies on to spot a weak record, such as hedging, disorganisation or an informal register, are precisely the cues that machine drafting removes."),
("p", "Many institutions answer this risk with human review: a supervisor, compliance officer or second reader checks the record before it is finalised. Regulation increasingly assumes such oversight (Regulation (EU) 2024/1689, 2024). Human review can only serve as a safeguard, however, if reviewers can actually tell a supported conclusion from an unsupported one. If they cannot, the safeguard is nominal and its cost is paid without the protection it is meant to buy. If some reviewers can and others cannot, an institution that relies on one reviewer per record carries a hidden and uneven risk."),
("p", "This paper reports a pre-registered study of that question. It addresses three research questions:"),
("n", "1. Can independent professional reviewers distinguish supported from unsupported conclusions in AI-drafted decision records, judged against a classification fixed in advance?"),
("n", "2. How much does that ability vary between individual reviewers, and is the variation driven by the reviewers or by the records?"),
("n", "3. Do reviewers applying a structured review agree with one another closely enough for individual judgments to be relied on?"),
("p", "The contribution is specific. The study shows that the distinction is detectable by a panel of professionals, that individual performance varies widely, and that dependable agreement between individual reviewers has not been shown. It does not show that AI drafting causes unsupported records, that any particular review instrument improves on unaided judgment, or how reviewers perform on ambiguous or real records. Those boundaries are stated where they apply and collected in the Discussion."),

("h1", "LITERATURE REVIEW"),
("h2", "Accountability Depends on the Record"),
("p", "Bovens (2007) defines accountability as a relationship in which an actor is obliged to explain and justify conduct to a forum that can pose questions, pass judgement and impose consequences. Each stage of that relationship presupposes information about what the actor did and why. Where the record cannot supply that information, the forum must reconstruct the conduct from argument and recollection, and the relationship weakens even when every formal step is observed. Mashaw (1983) argues that mass administrative adjudication should be judged by its capacity to reach accurate decisions consistently and to justify them, and Tyler (2006) shows that people's willingness to accept decisions, including adverse ones, depends substantially on whether they perceive the process as fair. Whether decisions are explained is one element of that perception. A record that does not preserve its own reasoning weakens both the justification Mashaw emphasises and the procedural legitimacy Tyler describes."),
("p", "Transparency is often treated as the remedy, but its effects are conditional. In an experimental study, Grimmelikhuijsen and Meijer (2014) find that the effect of transparency on the perceived trustworthiness of a government organisation depends on the content of what is disclosed and on the prior dispositions of the citizen. The OECD (2017) treats public trust as an economic as well as a political asset, linking it to compliance, the cost of implementing policy and citizens' willingness to engage with institutions. Ananny and Crawford (2018) argue that visibility alone does not produce accountability. Taken together, these findings suggest that making a record available is not sufficient. What matters is whether the record, once read, lets the reader understand the basis for the action."),
("h2", "Automated Drafting and the Opacity of Records"),
("p", "Citron (2008) argues that automated decision systems can erode the procedural protections of notice and hearing when the logic of a decision is embedded in software rather than stated in the record. Kaminski and Urban (2021) develop a right to contest automated decisions, which presupposes that the grounds of a decision can be identified. Cobbe, Lee and Singh (2021) argue that automated decision-making should be built to be reviewable, with the record-keeping needed for later scrutiny designed in from the start."),
("p", "Most governance instruments for AI take the model, the dataset or the organisational process as their object. Model cards document a model's intended use and evaluation (Mitchell et al., 2019), datasheets document a dataset's composition and provenance (Gebru et al., 2021), and internal audit frameworks trace an organisation's development lifecycle (Raji et al., 2020). Each is valuable, and none takes as its object the individual record that a consequential decision leaves behind. Generative drafting adds a further difficulty: a record can be entirely readable, contain no technical artefact, and still not show the basis of its own conclusion, because well-formed prose has taken the place of evidentiary content."),
("h2", "Measuring Record Quality and Reviewer Agreement"),
("p", "A companion study applied a structured record-level review to 32 publicly available public-records determinations, court decisions, advisory opinions and compliance audits (Young & Wikes, 2026). It found that the review agreed with independent government auditors in all five cases where comparable audit findings existed and that it was not associated with appellate outcome, which suggests that reconstructability and the substantive result of a decision are different properties. That study used real public documents but a single primary reader and a small blind re-read. The present study complements it with a controlled corpus and a larger, international panel of independent reviewers."),
("p", "Measuring whether reviewers agree raises its own methodological issues. Chance-corrected agreement coefficients such as Cohen's and Fleiss' kappa can behave paradoxically when one category dominates, producing low values despite high raw agreement (Byrt et al., 1993; Feinstein & Cicchetti, 1990; Fleiss, 1971). Gwet (2008) proposed the AC1 coefficient to address that behaviour, and Krippendorff (2004) offers a further alternative. Evaluations of classification performance are also sensitive to the composition of the cases studied: a test evaluated on clear-cut cases overstates how it will perform on the full range met in practice (Ransohoff & Feinstein, 1978; Whiting et al., 2011). Finally, Jacobs and Wallach (2021) caution that an operational definition can circulate as if it were the underlying concept it is meant to capture. Each of these points shapes how the results below should be read."),
("h2", "Human Review as an Institutional Safeguard"),
("p", "Human review is the most common response to the risks of automated and AI-assisted decision-making, and it is increasingly written into law. The European Union's Artificial Intelligence Act requires that high-risk AI systems be designed so that people can effectively oversee them during use (Regulation (EU) 2024/1689, 2024). Oversight of this kind carries a cost: staff time, slower decisions, and the training needed to make reviewers competent. Its value depends entirely on whether reviewers can detect the problems they are asked to catch. The accountability literature reviewed above explains why an unsupported record is costly; it says much less about whether the people placed between a draft and its finalisation can reliably recognise one. Where review is assumed to work but does not, an institution pays the cost of oversight without receiving its protection, and the affected person bears the risk the oversight was meant to remove."),
("h2", "Research Gap"),
("p", "The literature establishes that accountability depends on explanation, that transparency builds trust only when disclosure is intelligible, and that automated systems can make the grounds of decisions harder to see. It provides much less evidence on whether the people who review consequential records can detect when a record does not carry its own basis, how consistent they are, and what that implies for the design and cost of review. This study provides initial evidence on those questions for AI-drafted records."),

("h1", "METHODOLOGY"),
("h2", "Definitions"),
("p", "A conclusion is referred to here as supported when an independent reviewer can identify, from the record alone, the evidence it rests on and follow the reasoning from that evidence to the conclusion. It is unsupported when the record states the conclusion without that basis, so that the reviewer cannot reconstruct why the decision went the way it did. The risk created by unsupported records is referred to as decision reconstruction risk."),
("p", "The property depends on the reader. Whether a record can be reconstructed depends on who reads it and what they may legitimately bring to it. The standpoint was therefore fixed as that of an independent reviewer who is competent in the domain, has the record and generally available domain knowledge, and has no access to the original decision-maker or to material outside the record. Supported is not the same as correct: a supported record can reach a wrong conclusion that a reader can see and challenge, and an unsupported record can reach a right conclusion that no reader can verify."),
("h2", "Design and Registration"),
("p", "The study is a detection study. Independent reviewers classified a balanced corpus of constructed records, and their classifications were scored against a reference classification fixed in advance. The protocol, analysis plan and decision thresholds were registered before data collection, and data collection closed on 15 August 2026. There is no comparison arm. A separate randomised study using the same corpus and different participants compares review with and without a structured instrument and is reported separately."),
("h2", "Corpus"),
("p", "The corpus comprises 24 constructed records drawn from high-stakes documentation contexts: human resources and employment, investigations, compliance and audit, public records, and AI-assisted summaries. Twelve records are supported and twelve are unsupported. Records were presented unlabelled and in randomised order. Every record was generated with large-language-model assistance and then edited by the first author to instantiate its intended class. No record derives from a real case, person or organisation. A record-level construction log sufficient to reconstruct the generation of each record (model and version, date, prompt and extent of human editing) was not retained."),
("p", "The corpus was built at the two ends of the severity range so that the detection question could be asked cleanly. Real documentation is continuous, running from strongly supported through ambiguous to wholly unsupported. A corpus concentrated at the extremes makes classification easier than the operational task, in the same way that a diagnostic test evaluated on clear-cut cases overstates its field performance (Ransohoff & Feinstein, 1978; Whiting et al., 2011). The accuracy reported below should not be read as an estimate of performance on ordinary records."),
("h2", "Reference Classification"),
("p", "Before verification began, the first author recorded a classification for each record together with the specific evidentiary defect or support that determined it. This document was time-stamped and not revised afterwards. Three separate large-language-model instances then classified all 24 records under the operational rule, without access to the intended labels or to one another, producing 72 classifications. All three reproduced the intended classification on all 24 records, so the pre-specified adjudication step was not triggered and no label changed. The registered procedure specified two passes with conditional adjudication; three were run."),
("p", "This check shows that the classification follows reproducibly from the operational rule and rules out the reference having been fitted to reviewers' responses after the fact, but it does not amount to independent validation. The automated raters were briefed by the authors on what the two classes mean, so the reference is independent of the results but not of the definition. No human has independently replicated the reference classification. Unanimity on all 24 records is also further evidence that the corpus contains clear cases."),
("h2", "Participants"),
("p", "Reviewers were credentialed practitioners and researchers in AI governance, compliance, audit, human resources, investigations, data privacy, records management and law, recruited through professional networks. At data lock, 16 reviewers had completed all 24 records. They worked in 11 countries on five continents: Australia, Germany, India, Nigeria, Poland, Singapore, South Korea, Spain, the United Arab Emirates, the United Kingdom and the United States. Eleven further invitees accepted but did not begin. Reviewers were blind to the reference classification, to one another's judgments and to the composition of the corpus, including that it was balanced. They took part unpaid and in a personal capacity. The panel self-selected for interest in documentation governance and is not a probability sample of any population."),
("h2", "Analysis"),
("p", "Accuracy was computed for each reviewer, and the panel estimate is the mean of the 16 reviewer accuracies with a Student t interval, treating reviewers as the independent sampling units. Treating each of the 384 judgments as independent would understate uncertainty, because the judgments of one reviewer reflect one person applying one threshold. For each reviewer and record the latest submission was used. The registered exclusion rule, fewer than 18 of 24 records completed, excluded no one. Of 385 stored rows after de-duplication, one was an administrative marker rather than a judgment and was excluded, leaving 384 scorable judgments."),
("p", "The registered detection criterion had two parts: the lower bound of the 95 percent confidence interval must exceed 0.50, the chance rate on a balanced corpus, and the point estimate must reach at least 0.70. The 0.70 target was a pragmatic floor set before data collection rather than a value derived from a cost model, and readers can apply their own threshold to the reported interval."),
("p", "After registration, a mixed-effects logistic model with crossed random intercepts for reviewer and record was added to separate reviewer variation from record difficulty (Barr et al., 2013; Bates et al., 2015). It was fitted by Laplace-approximated maximum likelihood with profile-likelihood intervals. Because it was specified after registration, it is reported as exploratory and does not bear on the registered criterion."),
("h2", "Reliability Analysis"),
("p", "Reliability was assessed separately, in a sample in which raters applied a five-condition structured review to a shared set of records. The five conditions ask whether the record allows the conclusion to be reconstructed from the record alone, identifies the basis for its conclusions, holds together chronologically, lets the reasoning from evidence to conclusion be followed, and contains enough evidence to support the weight of the decision. Raters were either invited directly or enrolled through an open review page; the two groups are reported separately because they reached the study by different routes, not because they differ in expertise."),
("p", "Agreement on the overall determination was estimated with Gwet's (2008) AC1 as the registered primary coefficient, chosen for its robustness to the prevalence paradox under skewed category distributions (Byrt et al., 1993; Feinstein & Cicchetti, 1990), with Krippendorff's (2004) alpha and Fleiss' (1971) kappa computed alongside. The registered criterion had two parts: a point estimate of at least 0.61 and a lower 95 percent confidence bound of at least 0.41. Only labels recorded under the five-condition review were analysed, one per rater per record, keeping the latest. Sixteen labels recorded by raters working under an unstructured baseline prompt were excluded because they answered a different question with a different instrument; including them would measure agreement between two methods rather than the reliability of one."),

("h1", "RESULTS"),
("h2", "Panel Detection"),
("p", "Table 1 reports the primary result. The registered detection criterion was met on both parts."),
("caption", "Table 1. Detection of supported and unsupported records by the reviewer panel"),
("table", [["Measure", "Result"],
           ["Mean reviewer-level accuracy", "83.9%"],
           ["95% confidence interval (participant level, n = 16)", "72.7 to 95.1"],
           ["Sensitivity (unsupported records correctly identified)", "87.0%"],
           ["Specificity (supported records correctly identified)", "80.7%"],
           ["Registered criterion: point estimate at least 70%", "Met"],
           ["Registered criterion: lower bound above 50%", "Met"]]),
("note", "Source: developed by the authors from 384 judgments by 16 reviewers on 24 records."),
("p", "Sensitivity exceeded specificity by about six percentage points. The difference is reported as a direction only, because the paired data needed to test it were not retained in a form that supports a paired test. Reviewers were therefore slightly more likely to flag a supported record as unsupported than to pass an unsupported one, although the study cannot say whether that tendency is real."),
("h2", "Individual Reviewers"),
("p", "Table 2 shows how widely individual performance varied around the panel mean."),
("caption", "Table 2. Variation in performance between individual reviewers"),
("table", [["Measure", "Mean", "SD", "Range across reviewers", "Reviewers at 100%"],
           ["Accuracy", "83.9%", "21.0", "37.5 to 100", "6 of 16"],
           ["Sensitivity", "87.0%", "24.2", "25.0 to 100", "11 of 16"],
           ["Specificity", "80.7%", "25.8", "16.7 to 100", "7 of 16"]]),
("note", "Source: developed by the authors."),
("p", "Six reviewers classified every record correctly, and 11 of 16 identified every unsupported record. At the other end, at least one reviewer scored below the 50 percent chance rate. The responses of the low scorers were examined for straight-lining, uniform responding and missing data; they showed varied judgments across records and complete data, and they are retained."),
("p", "The records varied far less than the reviewers. Record-level accuracy ranged from 62.5 to 93.8 percent, and every record was classified correctly by at least 10 of the 16 reviewers. In the exploratory crossed model, the reviewer standard deviation on the logit scale was 1.769 (profile 95 percent interval 1.292 to 3.000), giving a latent-scale reviewer intraclass correlation of 0.488. The record standard deviation was estimated at the boundary, 0.011 (interval 0.001 to 0.556). That boundary estimate does not show that the records were equally difficult: with 24 records the record component is weakly identified, and its interval allows a moderate effect. The defensible reading is that, on this corpus, variation between reviewers was substantially larger than variation between records. Modelling record difficulty did not materially change the performance estimate, since the model places an average reviewer on an average record at 89.2 percent."),
("p", "The distribution across records is consistent with that reading. Six records were classified correctly by 15 of the 16 reviewers, and the most difficult record was classified correctly by 10 of 16. No record was missed by a majority of the panel. Errors were therefore spread across the corpus rather than concentrated on a few records that most reviewers found ambiguous, which is what would be expected if the main source of error lay in differences between reviewers rather than in particular records."),
("h2", "Agreement Between Reviewers"),
("p", "Of 25 reliability participants, 22 contributed labels under the five-condition review: 8 invited and 14 open-enrolment raters. Three open-enrolment raters contributed only under the baseline prompt and were excluded. Agreement can be estimated only where a record has two or more raters; 10 records met that condition, carrying 113 determinations, reduced to 104 after keeping one label per rater per record. Table 3 reports the result."),
("caption", "Table 3. Chance-corrected agreement on the overall determination"),
("table", [["Group", "Records", "Labels", "Raters", "AC1", "95% CI (analytic, registered)", "95% CI (bootstrap, sensitivity)"],
           ["Invited", "10", "36", "8", "0.739", "0.402 to 1.000", "0.427 to 1.000"],
           ["Open enrolment", "10", "68", "14", "0.623", "0.252 to 0.993", "0.285 to 0.894"]]),
("note", "Note: AC1 is Gwet's first-order agreement coefficient. Source: developed by the authors."),
("p", "The registered reliability criterion was not met. Both point estimates exceed 0.61, but neither analytic lower bound reaches 0.41: the invited group's is 0.402 and the open-enrolment group's is 0.252. The bootstrap interval places the invited group's lower bound at 0.427, above the criterion. The analytic interval was the registered construction, however, and choosing whichever interval clears a criterion after seeing both is what registration exists to prevent. The bootstrap result is therefore reported as a sensitivity analysis only. It shows that the shortfall is marginal for the invited group and that the conclusion depends on how the interval is built, which itself reflects how little ten records can support. Ten records against a planned pooled set of about 26 produce intervals too wide to be informative at their lower end, and these coefficients are interim."),
("p", "The exclusion of baseline-prompt labels changes the result materially. Pooling them with the analysed set reduces the open-enrolment coefficient to between 0.16 and 0.18. The exclusion rule was the one the study was designed around and was not chosen after seeing either figure."),
("h2", "Supporting Analyses"),
("p", "Two supporting analyses, both descriptive, help to interpret the main results. The first concerns the five conditions of the structured review. Across the 565 condition-level labels recorded in the reliability sample, evidentiary sufficiency was the condition most often recorded as not met, at 77.9 percent, followed by chronological integrity at 65.5 percent, traceability of the reasoning at 64.6 percent, reconstructability from the record alone at 57.5 percent and identification of the basis at 51.3 percent. Because the five conditions feed the overall determination, their association with it is expected and does not demonstrate that each condition discriminates independently. The pattern indicates only where raters most often located the weakness: in whether the record contained enough to carry the weight of the decision."),
("p", "The second concerns consistency of automated application. The same review was applied nightly to a fixed set of 15 records by three large language models from three different vendors, over 41 runs between 29 June and 15 August 2026. Mean pairwise agreement on the overall determination was 87.2 percent (95 percent CI 86.2 to 88.2). Agreement among models is not accuracy: three models agreeing is consistent with all three being wrong in the same way. The result shows only that the review can be applied consistently by automated tools, which is relevant to whether such tools could help institutions triage records for human attention, and it does not show that they could replace human review."),

("h1", "DISCUSSION"),
("h2", "What the Results Show"),
("p", "Independent professionals reading AI-drafted records, blind to the reference classification, distinguished supported from unsupported conclusions at 83.9 percent, above a target fixed in advance. The distinction is therefore recognisable to independent experts, at least at the ends of the severity range. That is a precondition for any safeguard that relies on human review: a property that experienced reviewers cannot identify cannot be governed by asking reviewers to identify it."),
("p", "The second result qualifies the first. Panel accuracy coexists with individual accuracy from 37.5 to 100 percent, and on this corpus the spread lay mainly with the reviewers rather than with the records. The reliability analysis, which met its point estimate but not its lower bound, points the same way. Detection worked as a panel-level judgment in this study. It has not been shown to work as an individual one."),
("h2", "Socioeconomic Implications"),
("p", "The first implication concerns how institutions design review. Many organisations staff review on the assumption that one competent reviewer per record is sufficient. The results suggest that this assumption may not hold for AI-drafted records: a panel-level accuracy figure says little about the reviewer an organisation actually assigns, and at the point of use the difference is invisible. Institutions that rely on review as a safeguard may need reviewer calibration, sampled double review or adjudication of disagreements. Each carries a cost in staff time, and that cost has to be weighed against the cost of unsupported records reaching affected people. This study does not measure either cost; it shows why the trade-off exists and why a panel figure cannot be borrowed in place of measuring one's own reviewers."),
("p", "The second implication concerns who bears the risk when review fails. When an unsupported record passes review, its cost is deferred rather than removed. It reappears as an appeal the affected person must bring, an inquiry a regulator must conduct, or a decision the organisation cannot defend. Because individual reviewer performance varies so widely, whether a given person's record is caught depends partly on which reviewer happens to read it. That is a source of unequal treatment that no individual decision-maker intends and that the affected person cannot see. In settings such as employment, benefits and public services, where the affected party often has fewer resources than the institution, that inequality compounds the uneven distribution of accountability costs described in the Introduction."),
("p", "The third implication concerns public trust and the governance of AI adoption. The OECD (2017) links trust to compliance and to the cost of implementing policy, and Grimmelikhuijsen and Meijer (2014) show that transparency builds trust only when what is disclosed is intelligible. If AI-drafted records become common faster than institutions learn to check them, disclosure may increase while intelligibility does not. Regulatory frameworks that require human oversight of high-risk AI (Regulation (EU) 2024/1689, 2024) assume that the oversight is effective. These results suggest that the effectiveness of record-level oversight should be measured rather than assumed, and that the unit to measure is the individual reviewer as well as the review process."),
("p", "The direction of reviewer error also has economic content. In this study sensitivity exceeded specificity by about six points, a difference that could not be tested. Both kinds of error are costly. A missed unsupported record passes its costs downstream to the affected person and to whoever must later reconstruct the decision. A supported record wrongly flagged causes delay, repeated review, administrative burden and reviewer fatigue, and in some settings a delayed determination harms the affected person more than an imperfect one. Which error an institution should prefer depends on the stakes and on the relative costs in its own setting. The defensible position is that those costs should be specified explicitly before review thresholds are set, rather than assumed."),
("h2", "Implications for Practice"),
("p", "Several practical steps follow from the results without going beyond them. Institutions that rely on human review of AI-drafted records can measure their own reviewers against a small set of records whose support is known, rather than assuming panel-level performance. They can route the highest-stakes records to two reviewers and treat disagreement as a signal for adjudication rather than as noise. They can record not only the reviewer's conclusion but the reason for it, so that later reviewers and auditors can see why a record was passed. And they can track over time how often reviewed records are later found to be unsupported on appeal or audit, which is the evidence needed to judge whether the cost of review is buying the protection intended. None of these steps has been tested in this study, and each should be evaluated where it is adopted."),
("h2", "Relation to the Companion Study"),
("p", "The companion study of 32 public-records determinations (Young & Wikes, 2026) approached the same property from the opposite direction. It used real public documents and found that a record-level review agreed with independent government auditors in all five cases where comparable audit findings existed, and that it was not associated with appellate outcome. Its limitation was that it relied mainly on one reader. The present study used constructed documents but an international panel, and its limitation is the reverse. Read together, the two studies suggest that record-level reconstructability can be assessed on real public material and recognised by independent professionals, and that the weak point in practice may be the consistency of individual reviewers rather than the property itself. Neither study is independent validation, and both share authors, so this convergence is a reason for further testing rather than a conclusion."),
("h2", "AI Drafting as Context, Not Cause"),
("p", "All 24 records were AI-generated, and the study makes no comparison with human-authored records. People produce unsupported records too. The study therefore does not show that AI drafting causes unsupported conclusions or that AI-drafted records are harder to assess than human ones. AI-generated records were studied because they are a growing share of what reviewers face and because their polish removes surface cues reviewers might otherwise rely on. Whether that makes detection harder is an open question that requires a matched comparison."),
("h2", "Limitations"),
("p", "The first author constructed the records and fixed their classification. Automated reproduction rules out fitting the reference to the results but not dependence on the authors' definition, so the finding is that the authors' distinction is recognisable to independent experts, not that it has been externally validated (Jacobs & Wallach, 2021). The corpus is bimodal and balanced, so accuracy, sensitivity and specificity should not be extrapolated to ordinary records or to the prevalence of unsupported records in practice. The panel consisted of 16 self-selected, credentialed reviewers; performance among less experienced reviewers, or outside the represented domains, is unknown. With one to three reviewers per country, the study has no power to test jurisdictional or linguistic effects, and the international composition does not establish cross-cultural validity. The sources of reviewer variation were not analysed in advance and cannot be explained with 16 reviewers. The reliability evidence is interim, rests on ten records and failed its registered lower-bound criterion."),
("p", "Two further limitations concern the record of the study itself. A complete record-level generation log was not retained, and per-pass execution records for the automated reference check were not retained in a form sufficient for independent reproduction of those passes. The study was also not reviewed by an institutional ethics committee, as set out in the Informed Consent Statement. Finally, the authors defined the construct, built the records, set the reference, recruited the participants and specified the analysis. The registered plan and thresholds, the blind automated reproduction of the reference, the blinding of reviewers and the reporting of a failed criterion mitigate that dependence but do not remove it."),
("h2", "Further Research"),
("p", "The limitations define the next studies. In order of value, they are: a corpus generated and classified by researchers with no role in developing the construct; records spanning supported, partly supported, ambiguous and unsupported, so that performance can be estimated where judgment is hard; a reliability set large enough for informative lower bounds; a matched comparison of AI-drafted and human-drafted records; a comparison of unaided and instrument-guided review on the same records; and, under independent ethical review, suitably authorised real records. Studies that measure the staff time required for calibration and double review would allow the cost trade-off described above to be quantified."),

("h1", "CONCLUSIONS"),
("p", "This study provides preliminary evidence that professional reviewers can distinguish supported from unsupported conclusions in AI-drafted decision records. Sixteen reviewers in 11 countries made 384 judgments and reached a mean accuracy of 83.9 percent against a classification fixed in advance, clearing a registered target."),
("p", "The same data show the limits of that result. Accuracy ranged from 37.5 to 100 percent between reviewers, more than it varied between records, and a separate reliability analysis did not meet its full registered criterion. Detection worked as a panel-level judgment. It has not been shown to work as an individual one, and institutions should not treat a panel figure as the accuracy of the reviewer they assign."),
("p", "For organisations and public bodies adopting generative drafting, the practical conclusion is that human review of AI-drafted records is a safeguard whose effectiveness depends on who performs it and how review is organised. Its effectiveness should be measured, and the cost of calibration or double review should be weighed against the cost of unsupported decisions reaching the people they affect. The evidence is bounded by an author-constructed, deliberately bimodal corpus and a reference classification that depends on the authors' definition. Within those bounds, it establishes that whether a record carries the basis for its conclusion is an empirically measurable property, and that professional judgments about it vary substantially."),

("h1", "AUTHOR CONTRIBUTIONS"),
("p", "Conceptualization, P.W.; methodology, P.W. and U.H.; validation, U.H.; formal analysis, P.W. and U.H.; investigation, P.W.; resources, P.W.; data curation, P.W.; writing (original draft preparation), P.W.; writing (review and editing), P.W. and U.H.; supervision of the reliability and validation framework, U.H.; project administration, P.W. P.W. conceived the construct and the review method, constructed the corpus, wrote the reference classification and assembled the reviewer panel. U.H. designed the reliability and validation framework: the reference-panel design, the chance-corrected agreement statistics, and the registered decision thresholds and analysis plan. Neither author took part in the automated reproduction of the reference classification or graded any record in the detection panel. All authors have read and agreed to the published version of the manuscript."),
("h1", "ACKNOWLEDGEMENTS"),
("p", "The authors thank the sixteen independent professionals who served on the detection panel and the raters who took part in the reliability study, all of whom contributed unpaid and in a personal capacity."),
("h1", "STATEMENT ON THE USE OF AI TOOLS"),
("p", "AI tools were part of the research design and are described where they occur: the corpus was generated with large-language-model assistance and edited by the first author, and the reference classification was reproduced by three automated raters briefed by the authors. Generative AI tools also supported the writing and production of this manuscript, helping restructure and edit the text under the authors' direction. Every research judgment was made by the authors, who reviewed all content and take full responsibility for it. AI tools do not meet the criteria for authorship and are not listed as authors."),
("h1", "FUNDING"),
("p", "There is no funding for this research."),
("h1", "CONFLICT OF INTEREST"),
("p", "P.W. created the construct and the review method studied here, constructed the corpus, wrote the reference classification, recruited the panel, has a continuing professional interest in the method and would benefit professionally and commercially from its adoption. U.H. designed the validation and reliability framework and would benefit reputationally from its use. No commercial arrangement is contingent on any result reported here, and no participant had any financial interest in the outcome."),
("h1", "DATA AVAILABILITY STATEMENT"),
("p", "[OWNER TO CONFIRM BEFORE SUBMISSION] The 24 constructed records, the reference classification with the reason for each record, the instructions given to the automated raters and their record-by-record results, aggregate result tables and the analysis scripts will be deposited in Zenodo, with a DOI, before publication: [ZENODO DOI]. Participants consented to the use of their responses in aggregate, so individual reviewer responses are not deposited; de-identified participant-level data are available from the corresponding author on reasonable request. A complete record-level generation log was not retained."),
("h1", "INFORMED CONSENT STATEMENT"),
("p", "This study was not reviewed by an institutional review board or ethics committee. It was conducted outside any institution holding one, by independent researchers, with adult professional volunteers making judgments about wholly synthetic documents. No approval or exemption was sought or granted. All participants gave informed consent, took part voluntarily, unpaid and in a personal capacity, and could withdraw at any time before publication. They were told in advance that the reference classification and the composition of the corpus would not be disclosed during review, because disclosure would compromise the blinded task. No personal data beyond name, professional title, country and contact address was collected, no vulnerable population was involved, and responses are reported only in aggregate. Independent ethical review would be sought for any successor study involving real records or real case outcomes."),
]

REFERENCES = [
"Ananny, M., & Crawford, K. (2018). Seeing without knowing: Limitations of the transparency ideal and its application to algorithmic accountability. New Media & Society, 20(3), 973–989. https://doi.org/10.1177/1461444816676645",
"Barr, D. J., Levy, R., Scheepers, C., & Tily, H. J. (2013). Random effects structure for confirmatory hypothesis testing: Keep it maximal. Journal of Memory and Language, 68(3), 255–278. https://doi.org/10.1016/j.jml.2012.11.001",
"Bates, D., Mächler, M., Bolker, B., & Walker, S. (2015). Fitting linear mixed-effects models using lme4. Journal of Statistical Software, 67(1), 1–48. https://doi.org/10.18637/jss.v067.i01",
"Bender, E. M., Gebru, T., McMillan-Major, A., & Shmitchell, S. (2021). On the dangers of stochastic parrots: Can language models be too big? In Proceedings of the 2021 ACM Conference on Fairness, Accountability, and Transparency (pp. 610–623). ACM. https://doi.org/10.1145/3442188.3445922",
"Bovens, M. (2007). Analysing and assessing accountability: A conceptual framework. European Law Journal, 13(4), 447–468. https://doi.org/10.1111/j.1468-0386.2007.00378.x",
"Byrt, T., Bishop, J., & Carlin, J. B. (1993). Bias, prevalence and kappa. Journal of Clinical Epidemiology, 46(5), 423–429. https://doi.org/10.1016/0895-4356(93)90018-V",
"Citron, D. K. (2008). Technological due process. Washington University Law Review, 85(6), 1249–1313.",
"Cobbe, J., Lee, M. S. A., & Singh, J. (2021). Reviewable automated decision-making: A framework for accountable algorithmic systems. In Proceedings of the 2021 ACM Conference on Fairness, Accountability, and Transparency (pp. 598–609). ACM. https://doi.org/10.1145/3442188.3445921",
"Feinstein, A. R., & Cicchetti, D. V. (1990). High agreement but low kappa: I. The problems of two paradoxes. Journal of Clinical Epidemiology, 43(6), 543–549. https://doi.org/10.1016/0895-4356(90)90158-L",
"Fleiss, J. L. (1971). Measuring nominal scale agreement among many raters. Psychological Bulletin, 76(5), 378–382. https://doi.org/10.1037/h0031619",
"Gebru, T., Morgenstern, J., Vecchione, B., Vaughan, J. W., Wallach, H., Daumé III, H., & Crawford, K. (2021). Datasheets for datasets. Communications of the ACM, 64(12), 86–92. https://doi.org/10.1145/3458723",
"Grimmelikhuijsen, S., & Meijer, A. (2014). Effects of transparency on the perceived trustworthiness of a government organization: Evidence from an online experiment. Journal of Public Administration Research and Theory, 24(1), 137–157. https://doi.org/10.1093/jopart/mus048",
"Gwet, K. L. (2008). Computing inter-rater reliability and its variance in the presence of high agreement. British Journal of Mathematical and Statistical Psychology, 61(1), 29–48. https://doi.org/10.1348/000711006X126600",
"Jacobs, A. Z., & Wallach, H. (2021). Measurement and fairness. In Proceedings of the 2021 ACM Conference on Fairness, Accountability, and Transparency (pp. 375–385). ACM. https://doi.org/10.1145/3442188.3445901",
"Ji, Z., Lee, N., Frieske, R., Yu, T., Su, D., Xu, Y., Ishii, E., Bang, Y. J., Madotto, A., & Fung, P. (2023). Survey of hallucination in natural language generation. ACM Computing Surveys, 55(12), 1–38. https://doi.org/10.1145/3571730",
"Kaminski, M. E., & Urban, J. M. (2021). The right to contest AI. Columbia Law Review, 121(7), 1957–2048.",
"Krippendorff, K. (2004). Content analysis: An introduction to its methodology (2nd ed.). Sage.",
"Mashaw, J. L. (1983). Bureaucratic justice: Managing social security disability claims. Yale University Press.",
"Mitchell, M., Wu, S., Zaldivar, A., Barnes, P., Vasserman, L., Hutchinson, B., Spitzer, E., Raji, I. D., & Gebru, T. (2019). Model cards for model reporting. In Proceedings of the Conference on Fairness, Accountability, and Transparency (pp. 220–229). ACM. https://doi.org/10.1145/3287560.3287596",
"OECD. (2017). Trust and public policy: How better governance can help rebuild public trust. OECD Publishing. https://doi.org/10.1787/9789264268920-en",
"Raji, I. D., Smart, A., White, R. N., Mitchell, M., Gebru, T., Hutchinson, B., Smith-Loud, J., Theron, D., & Barnes, P. (2020). Closing the AI accountability gap: Defining an end-to-end framework for internal algorithmic auditing. In Proceedings of the 2020 Conference on Fairness, Accountability, and Transparency (pp. 33–44). ACM. https://doi.org/10.1145/3351095.3372873",
"Ransohoff, D. F., & Feinstein, A. R. (1978). Problems of spectrum and bias in evaluating the efficacy of diagnostic tests. New England Journal of Medicine, 299(17), 926–930. https://doi.org/10.1056/NEJM197810262991705",
"Regulation (EU) 2024/1689 of the European Parliament and of the Council of 13 June 2024 laying down harmonised rules on artificial intelligence (Artificial Intelligence Act). (2024). Official Journal of the European Union, L, 2024/1689.",
"Tyler, T. R. (2006). Why people obey the law. Princeton University Press.",
"Whiting, P. F., Rutjes, A. W. S., Westwood, M. E., Mallett, S., Deeks, J. J., Reitsma, J. B., Leeflang, M. M. G., Sterne, J. A. C., & Bossuyt, P. M. M. (2011). QUADAS-2: A revised tool for the quality assessment of diagnostic accuracy studies. Annals of Internal Medicine, 155(8), 529–536. https://doi.org/10.7326/0003-4819-155-8-201110180-00009",
"Young, S., & Wikes, P. (2026). Can public-records determinations be independently reconstructed? Evidence from 32 public cases [Preprint]. SSRN. https://papers.ssrn.com/sol3/papers.cfm?abstract_id=7591521",
]


def add_runs(par, text):
    for i, chunk in enumerate(re.split(r"\*\*", text)):
        if chunk:
            par.add_run(chunk).bold = (i % 2 == 1)


def main(template, out):
    d = docx.Document(template)
    body = d.element.body
    sect = body[-1]
    for el in list(body):
        if el is not sect:
            body.remove(el)
    styles = {s.name for s in d.styles}

    def para(text, style):
        p = d.add_paragraph(style=style if style in styles else None)
        add_runs(p, text)
        return p

    para(TITLE, "AR&P Level 0 Title of the Manuscript Style")
    for a in AUTHORS:
        para(a, "AuthorLine")
    p = d.add_paragraph(style="AbstractText")
    p.add_run("Abstract: ").bold = True
    p.add_run(ABSTRACT).italic = True
    p = d.add_paragraph(style="KeywordsText")
    p.add_run("Keywords: ").bold = True
    p.add_run(KEYWORDS + ".")
    p = d.add_paragraph(style="KeywordsText")
    p.add_run("JEL Classification: ").bold = True
    p.add_run(JEL)

    for kind, val in BODY:
        if kind == "h1":
            para(val, "AR&P Level 1 Style")
        elif kind == "h2":
            para(val, "AR&P Level 2 Style")
        elif kind in ("p", "n"):
            para(val, "Normal")
        elif kind == "caption":
            para(val, "AR&P Title of the Figures and Tables Style")
        elif kind == "note":
            para(val, "AR&P Source and Notes Style")
        elif kind == "table":
            t = d.add_table(rows=len(val), cols=len(val[0]))
            t.style = "Table Grid"
            for r, row in enumerate(val):
                for c, cell in enumerate(row):
                    t.cell(r, c).text = cell
                    if r == 0:
                        for run in t.cell(r, c).paragraphs[0].runs:
                            run.bold = True
    para("REFERENCES", "AR&P Level 1 Style")
    for ref in REFERENCES:
        para(ref, "Normal")
    # Drop parts inherited from the template paper: its figures, comments and title metadata.
    part = d.part
    for rid, rel in list(part.rels.items()):
        if rel.reltype.endswith(("/image", "/comments")):
            del part.rels[rid]
    d.core_properties.title = TITLE
    d.core_properties.subject = ""
    d.core_properties.author = "Phillip Wikes; Ubayet Hossain"
    d.save(out)


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
