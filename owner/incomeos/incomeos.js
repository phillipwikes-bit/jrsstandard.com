"use strict";
(function () {
  var STORE_KEY = "incomeos.owner.prototype.v1";
  var state = { saved: [], stages: {}, receipts: [] };
  var feed = { studies: [], assets: [], asOf: "" };
  var views = ["research", "assets", "ledger", "compound", "about"];
  var stages = ["New", "Screening", "Applied", "Invited", "Completed", "Paid", "Declined"];
  var money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 });
  var money0 = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
  var $ = function (id) { return document.getElementById(id); };
  function node(type, className, text) {
    var x = document.createElement(type);
    if (className) x.className = className;
    if (text !== undefined) x.textContent = String(text);
    return x;
  }
  function append(parent, child) { parent.appendChild(child); return child; }
  function sectionText(parent, type, className, text) { return append(parent, node(type, className, text)); }
  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (_e) { alert("This device is not allowing local storage. Entries may not be retained."); }
  }
  function restore() {
    try {
      var raw = JSON.parse(localStorage.getItem(STORE_KEY) || "{}");
      state.saved = Array.isArray(raw.saved) ? raw.saved.filter(function (v) { return typeof v === "string"; }) : [];
      state.stages = raw.stages && typeof raw.stages === "object" && !Array.isArray(raw.stages) ? raw.stages : {};
      state.receipts = Array.isArray(raw.receipts) ? raw.receipts.filter(function (r) {
        return r && typeof r.label === "string" && Number.isFinite(Number(r.amount)) && Number(r.amount) > 0 && ["pending", "paid"].includes(r.status);
      }) : [];
    } catch (_e) { state = { saved: [], stages: {}, receipts: [] }; }
  }
  function localDate() {
    var d = new Date();
    return String(d.getFullYear()) + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }
  function past(s) { return !!s.eventEnd && s.eventEnd < localDate(); }
  function show(view) {
    views.forEach(function (v) {
      var active = v === view, pane = $("view-" + v);
      pane.classList.toggle("active", active);
      pane.hidden = !active;
      var b = document.querySelector('.bottomnav button[data-view="' + v + '"]');
      b.classList.toggle("selected", active);
      if (active) b.setAttribute("aria-current", "page");
      else b.removeAttribute("aria-current");
    });
    if (view === "compound") calculate();
    window.scrollTo({ top: 0, behavior: "auto" });
  }
  function chips(parent, items) {
    var c = append(parent, node("div", "chips"));
    items.forEach(function (it) {
      var warning = it.warn === true ? "chip warn" : "chip gray";
      sectionText(c, "span", warning, it.value);
    });
  }
  function link(url, label) {
    var a = node("a", "mainbtn", label);
    a.href = url; a.target = "_blank"; a.rel = "noopener noreferrer"; a.referrerPolicy = "no-referrer";
    return a;
  }
  function details(parent, label, value) {
    var wrap = append(parent, node("div", "line"));
    sectionText(wrap, "dt", "", label + ":");
    sectionText(wrap, "dd", "", value);
  }
  function bullets(parent, items) {
    if (!items || !items.length) return;
    var ul = append(parent, node("ul", "bullets"));
    items.forEach(function (v) { sectionText(ul, "li", "", v); });
  }
  function markSaved(id, btn) {
    btn.classList.toggle("saved", state.saved.includes(id));
    btn.setAttribute("aria-pressed", String(state.saved.includes(id)));
    btn.title = state.saved.includes(id) ? "Remove from saved" : "Save opportunity";
  }
  function saveButton(id) {
    var b = node("button", "iconbtn", "★"); b.type = "button";
    b.setAttribute("aria-label", "Save this opportunity");
    markSaved(id, b);
    b.addEventListener("click", function () {
      if (state.saved.includes(id)) state.saved = state.saved.filter(function (x) { return x !== id; });
      else state.saved.push(id);
      save(); markSaved(id, b);
    });
    return b;
  }
  function rate(s) {
    return (Number(s.paymentUsd) > 0 && Number(s.minutes) > 0) ? Number(s.paymentUsd) * 60 / Number(s.minutes) : null;
  }
  function studyCard(s) {
    var card = node("article", "card");
    card.id = "study-" + s.id;
    var head = append(card, node("div", "cardheader")), hdr = append(head, node("div"));
    sectionText(hdr, "span", "provider", "Researcher: " + s.provider);
    sectionText(hdr, "h3", "", s.title);
    append(head, saveButton(s.id));
    var pay = append(card, node("div", "payrow")), left = append(pay, node("div")), right = append(pay, node("div"));
    sectionText(left, "strong", "", money0.format(s.paymentUsd));
    sectionText(left, "span", "", s.paymentMethod || "Confirm payment method");
    sectionText(right, "strong", "rate", rate(s) === null ? "Unspecified" : money0.format(rate(s)) + "/hr");
    sectionText(right, "span", "", "Session-only rate");
    var status = past(s) ? "Event dates passed. Verify reopening" : s.status;
    chips(card, [{ value: status, warn: past(s) }, { value: s.mode === "online" ? "Remote" : "Requires in-person", warn: s.mode !== "online" }, { value: s.linkKind || "Study application" }]);
    var dl = append(card, node("dl", "detail"));
    details(dl, "Session", String(s.minutes) + " minutes; " + s.dates);
    details(dl, "Eligibility", (s.eligibility || []).join("; "));
    if (s.screenMinutes) details(dl, "Screener", String(s.screenMinutes) + " minutes stated, unpaid");
    details(dl, "Status", "Not a confirmed paid seat");
    bullets(card, s.risk);
    var foot = append(card, node("div", "cardfooter"));
    append(foot, link(s.url, "Open individual application ↗"));
    var controls = append(foot, node("div", "cardalt"));
    var share = node("button", "", "Copy direct link");
    share.type = "button"; share.addEventListener("click", function () {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(s.url).then(function () { share.textContent = "Copied"; }).catch(function () { window.prompt("Copy this application URL:", s.url); });
      } else window.prompt("Copy this application URL:", s.url);
    });
    append(controls, share);
    var label = append(controls, node("label"));
    sectionText(label, "span", "", "Your status");
    var select = append(label, node("select"));
    select.setAttribute("aria-label", "Application stage for " + s.title);
    stages.forEach(function (v) { var o = node("option", "", v); o.value = v; select.appendChild(o); });
    select.value = stages.includes(state.stages[s.id]) ? state.stages[s.id] : "New";
    select.addEventListener("change", function () { state.stages[s.id] = select.value; save(); });
    sectionText(card, "div", "stamp", "Public listing reviewed " + s.reviewed + ". Source-specific availability is not live verified.");
    return card;
  }
  function renderStudies() {
    var root = $("research-cards"); root.replaceChildren();
    var f = $("research-filter").value, text = $("research-search").value.trim().toLowerCase();
    var list = feed.studies.filter(function (s) {
      if (f === "current" || f === "online" || f === "direct" || f === "highpay") {
        if (past(s)) return false;
      }
      if (f === "online" && s.mode !== "online") return false;
      if (f === "direct" && !s.linkKind.toLowerCase().includes("direct")) return false;
      if (text && !(s.title + " " + s.provider + " " + (s.eligibility || []).join(" ")).toLowerCase().includes(text)) return false;
      return true;
    });
    list.sort(function (a, b) {
      if (f === "highpay") return rate(b) - rate(a);
      return String(a.eventEnd || "").localeCompare(String(b.eventEnd || ""));
    });
    if (!list.length) sectionText(root, "div", "empty", "No research leads match this filter. Published dates may have passed; the source file is not a live availability guarantee.");
    else list.forEach(function (s) { append(root, studyCard(s)); });
  }
  function assetCard(a) {
    var card = node("article", "card");
    var head = append(card, node("div", "cardheader")), h = append(head, node("div"));
    sectionText(h, "span", "provider", a.type + " · " + a.provider);
    sectionText(h, "h3", "", a.title);
    append(head, saveButton(a.id));
    sectionText(card, "div", "assetAmount", money0.format(a.capitalUsd) + " quoted minimum or asking price");
    var d = append(card, node("dl", "detail"));
    details(d, "Structure", a.terms);
    details(d, "Payout", a.payout);
    if (a.historicalUsd !== null) {
      details(d, "History", money0.format(a.historicalUsd) + " gross reported receipts over " + a.historicalMonths + " months");
      details(d, "Comparison", "Historical receipts / quoted price: " + (a.historicalUsd / a.capitalUsd * 100).toFixed(1) + "%; NOT a projected investment return");
    }
    chips(card, [{ value: a.status, warn: true }, { value: a.linkKind, warn: true }]);
    bullets(card, a.risks);
    append(card, link(a.opportunityUrl, "Review original source ↗"));
    sectionText(card, "div", "stamp", "Source reviewed " + a.reviewed + ". Research watchlist only; do not interpret as an open purchase allocation.");
    return card;
  }
  function renderAssets() {
    var root = $("asset-cards"); root.replaceChildren();
    if (!feed.assets.length) sectionText(root, "div", "empty", "No alternative asset candidates in this snapshot.");
    else feed.assets.forEach(function (a) { append(root, assetCard(a)); });
  }
  function paidTotal() {
    return state.receipts.reduce(function (sum, r) { return sum + (r.status === "paid" ? Number(r.amount) : 0); }, 0);
  }
  function renderLedger() {
    var total = paidTotal();
    $("metric-paid").textContent = money0.format(total);
    $("ledger-total").textContent = money.format(total);
    $("cash-assessed").textContent = money.format(total);
    var root = $("ledger-list"); root.replaceChildren();
    if (!state.receipts.length) { sectionText(root, "div", "empty", "No income has been recorded. Prospective study incentives are not earnings."); return; }
    state.receipts.slice().reverse().forEach(function (r) {
      var entry = append(root, node("div", "entry")), summary = append(entry, node("div")), right = append(entry, node("div"));
      sectionText(summary, "strong", "", r.label);
      sectionText(summary, "small", "", r.date + " · " + (r.status === "paid" ? "Received" : "Pending, not earned"));
      sectionText(right, "div", "amt" + (r.status === "pending" ? " pending" : ""), money.format(Number(r.amount)));
      var remove = append(right, node("button", "", "Remove"));
      remove.type = "button"; remove.setAttribute("aria-label", "Remove " + r.label);
      remove.addEventListener("click", function () {
        if (!confirm("Remove this entry from the local ledger?")) return;
        state.receipts = state.receipts.filter(function (x) { return x.id !== r.id; });
        save(); renderLedger();
      });
    });
  }
  function calculate() {
    var p = Number($("initial").value), m = Number($("monthly").value), annual = Number($("assumed-return").value), y = Number($("years").value);
    if (!Number.isFinite(p) || !Number.isFinite(m) || !Number.isFinite(annual) || !Number.isFinite(y) || p < 0 || m < 0 || annual < -100 || annual > 40 || y < 1 || y > 30) return;
    var n = y * 12, r = Math.pow(1 + annual / 100, 1 / 12) - 1, compound = Math.pow(1 + r, n);
    var fv = p * compound + (Math.abs(r) < 0.0000000001 ? m * n : m * (compound - 1) / r);
    var contribution = p + m * n;
    $("years-text").textContent = String(y) + (y === 1 ? " year" : " years");
    $("future-value").textContent = money0.format(fv);
    $("contributions").textContent = money0.format(contribution);
    $("growth").textContent = money0.format(fv - contribution);
  }
  function csvCell(s) { return '"' + String(s).replace(/"/g, '""') + '"'; }
  function exportLedger() {
    var csv = [["Date", "Source", "Amount USD", "Status"].join(",")];
    state.receipts.forEach(function (r) { csv.push([r.date, csvCell(r.label), Number(r.amount).toFixed(2), r.status].join(",")); });
    var blob = new Blob([csv.join("\r\n") + "\r\n"], { type: "text/csv;charset=utf-8" });
    var url = URL.createObjectURL(blob), a = document.createElement("a");
    a.href = url; a.download = "IncomeOS-personal-earnings.csv"; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }
  async function loadFeed() {
    var status = $("feed-status");
    try {
      var response = await fetch("./opportunities.json", { cache: "no-store", credentials: "same-origin" });
      if (!response.ok) throw new Error("HTTP " + response.status);
      var data = await response.json();
      if (!data || !Array.isArray(data.studies) || !Array.isArray(data.assets)) throw new Error("Invalid opportunity data");
      feed = data;
      $("metric-study").textContent = String(feed.studies.filter(function (x) { return !past(x); }).length);
      $("metric-asset").textContent = String(feed.assets.length);
      $("review-date").textContent = new Date(feed.asOf + "T12:00:00").toLocaleDateString("en-US", { dateStyle: "long" });
      status.classList.remove("error");
      status.textContent = "Reviewed source snapshot: " + feed.asOf + ". This file does not update automatically with ChatGPT alerts; verify availability before applying.";
      renderStudies(); renderAssets();
      var deep = new URLSearchParams(location.search).get("study");
      if (deep) {
        $("research-filter").value = "all"; renderStudies(); show("research");
        var target = document.getElementById("study-" + deep);
        if (target) { target.scrollIntoView({ block: "center" }); target.style.outline = "2px solid #197b68"; }
      }
    } catch (e) {
      status.classList.add("error");
      status.textContent = "Opportunity source file unavailable. Previously saved local records remain on this device. " + e.message;
      $("research-cards").replaceChildren(node("div", "empty", "Feed unavailable. Try Refresh."));
      $("asset-cards").replaceChildren(node("div", "empty", "Feed unavailable. Try Refresh."));
    }
  }
  function init() {
    restore();
    document.querySelectorAll(".bottomnav button[data-view]").forEach(function (b) {
      b.addEventListener("click", function () { show(b.dataset.view); });
    });
    $("research-filter").addEventListener("change", renderStudies);
    $("research-search").addEventListener("input", renderStudies);
    $("refresh").addEventListener("click", loadFeed);
    $("receipt-date").value = localDate();
    $("receipt-form").addEventListener("submit", function (event) {
      event.preventDefault();
      var label = $("receipt-label").value.trim(), amount = Number($("receipt-amount").value), date = $("receipt-date").value, status = $("receipt-state").value;
      if (!label || !Number.isFinite(amount) || amount <= 0 || amount > 10000000 || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !["paid", "pending"].includes(status)) {
        alert("Enter a valid source, positive amount, date and payment status."); return;
      }
      state.receipts.push({ id: "local-" + Date.now() + "-" + Math.floor(Math.random() * 100000), label: label.slice(0, 100), amount: amount, date: date, status: status });
      save(); $("receipt-form").reset(); $("receipt-date").value = localDate(); renderLedger();
    });
    $("export-ledger").addEventListener("click", exportLedger);
    $("clear-local").addEventListener("click", function () {
      if (!confirm("Erase all locally saved IncomeOS statuses, bookmarks and income entries on this device?")) return;
      state = { saved: [], stages: {}, receipts: [] }; save();
      renderLedger(); renderStudies(); renderAssets(); alert("Local IncomeOS data cleared.");
    });
    ["initial", "monthly", "assumed-return", "years"].forEach(function (id) { $(id).addEventListener("input", calculate); });
    renderLedger(); calculate(); loadFeed();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();