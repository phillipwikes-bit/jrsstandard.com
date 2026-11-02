"use strict";
(function () {
  // Pure, deterministic underwriting and illustration logic. No transactions are executed.
  var VERSION = "1.0.0";
  function dateNumber(value) {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return NaN;
    var d = new Date(value + "T00:00:00Z");
    return Number.isFinite(d.getTime()) && d.toISOString().slice(0,10) === value ? d.getTime() : NaN;
  }
  function number(value, lower, upper, label) {
    if (value === "" || value === null || value === undefined) throw new RangeError(label + " is required");
    var result = Number(value);
    if (!Number.isFinite(result) || result < lower || result > upper) throw new RangeError(label + " is out of range");
    return result;
  }
  function round(value) { return Math.round((value + Number.EPSILON) * 100) / 100; }
  function review(asset, check, context) {
    check = check || {};
    context = context || {};
    var reasons = [];
    var today = dateNumber(context.today);
    var reviewed = asset && dateNumber(asset.reviewed);
    var maxAgeDays = context.maxAgeDays === undefined ? 7 : number(context.maxAgeDays, 0, 365, "Source age limit");
    if (!asset || typeof asset.id !== "string" || !asset.sourceUrl || !/^https:\/\//.test(asset.sourceUrl)) reasons.push("A traceable, HTTPS source for the individual opportunity is required.");
    if (!Number.isFinite(today)) reasons.push("Current review date is unavailable.");
    if (!Number.isFinite(reviewed)) reasons.push("Source review date is missing or invalid.");
    if (Number.isFinite(today) && Number.isFinite(reviewed)) {
      var age = Math.floor((today - reviewed) / 86400000);
      if (age < 0) reasons.push("The source review date is in the future.");
      if (age > maxAgeDays) reasons.push("Source verification is stale (" + age + " days; limit " + maxAgeDays + ").");
    }
    if (!check.specificOffer) reasons.push("A live, individually identified offer has not been verified.");
    if (!check.eligibility) reasons.push("Owner eligibility and participation restrictions are unverified.");
    if (!check.counterparty) reasons.push("Counterparty identity, ownership and legal terms are unverified.");
    if (!check.cashflow) reasons.push("Cash-flow evidence, source payments and financial assumptions are unverified.");
    if (!check.fees) reasons.push("Fees, taxes and complete acquisition costs are unverified.");
    if (!check.liquidity) reasons.push("Loss exposure, exit restrictions and liquidity have not been reviewed.");
    if (!check.reserve) reasons.push("Available investable cash, emergency reserves and commitments are unconfirmed.");
    var proposed = Number(check.proposedCapital);
    var limit = Number(check.confirmedCapacity);
    if (!Number.isFinite(proposed) || proposed <= 0) reasons.push("No positive, specific proposed allocation is entered.");
    if (!Number.isFinite(limit) || limit <= 0) reasons.push("No verified, uncommitted capital limit is entered.");
    if (Number.isFinite(proposed) && Number.isFinite(limit) && proposed > limit) reasons.push("Proposed capital exceeds the confirmed uncommitted limit.");
    if (asset && Number.isFinite(Number(asset.capitalUsd)) && Number(asset.capitalUsd) > proposed) reasons.push("Proposed allocation is below the listed entry amount.");
    if (!check.ownerDecision) reasons.push("Owner has not explicitly approved this individual review.");
    return {
      status: reasons.length ? "HOLD" : "READY_FOR_MANUAL_REVIEW",
      reasons: reasons,
      reviewedOn: context.today || "",
      sourceReviewedOn: asset && asset.reviewed || "",
      executable: false,
      disclaimer: "Review readiness never authorizes or performs a transaction."
    };
  }
  function scenario(input) {
    input = input || {};
    var initial = number(input.initial, 0, 100000000, "Initial capital");
    var monthly = number(input.monthly, 0, 1000000, "Monthly contribution");
    var years = number(input.years, 1, 40, "Years");
    if (!Number.isInteger(years)) throw new RangeError("Years must be a whole number");
    var annualRate = number(input.annualReturnPct, -99, 100, "Annual illustrative total return") / 100;
    var fee = number(input.annualFeePct, 0, 40, "Annual total fees") / 100;
    var tax = number(input.taxDragPct, 0, 100, "Illustrative tax drag on gains") / 100;
    var inflation = number(input.inflationPct, -20, 100, "Annual inflation") / 100;
    var monthlyRate = Math.pow(1 + annualRate, 1 / 12) - 1;
    var monthlyFeeFactor = Math.pow(1 - fee, 1 / 12);
    var balance = initial;
    for (var i = 0; i < years * 12; i++) {
      var grossChange = balance * monthlyRate;
      var afterGainTax = grossChange > 0 ? grossChange * (1 - tax) : grossChange;
      balance = (balance + afterGainTax) * monthlyFeeFactor + monthly;
    }
    var contributions = initial + monthly * years * 12;
    var real = balance / Math.pow(1 + inflation, years);
    if (!Number.isFinite(balance) || !Number.isFinite(real)) throw new RangeError("Scenario cannot be represented");
    return {
      nominal: round(balance), realTodayDollars: round(real),
      contributions: round(contributions), change: round(balance - contributions),
      principalAtRisk: round(contributions),
      assumptions: {annualReturnPct:annualRate * 100, annualFeePct:fee * 100,taxDragPct:tax * 100,inflationPct:inflation * 100,years:years},
      executed: false, historicalResults: false
    };
  }
  window.IncomeOSDecisionEngine = Object.freeze({ VERSION: VERSION, review: review, scenario: scenario });
}());