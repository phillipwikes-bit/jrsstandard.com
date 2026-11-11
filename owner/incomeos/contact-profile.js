"use strict";
(function (root) {
  // Contact data remains owner-entered. Only passphrase-encrypted ciphertext
  // is stored in this browser. This is not a server-side identity store.
  var STORAGE_KEY = "incomeos.contact.encrypted.v1";
  var FORMAT = "incomeos-contact-encrypted";
  var ITERATIONS = 600000;
  var FIELDS = Object.freeze([
    ["fullName", "Full name"],
    ["email", "Email"],
    ["phone", "Phone"],
    ["cityState", "City / State"],
    ["qualifications", "Professional qualifications"],
    ["linkedin", "LinkedIn (optional)"]
  ]);

  function empty() {
    var p = {};
    FIELDS.forEach(function (f) { p[f[0]] = ""; });
    return p;
  }
  function clean(input) {
    if (!input || typeof input !== "object" || Array.isArray(input)) throw Error("Invalid contact profile.");
    var p = empty();
    FIELDS.forEach(function (f) {
      var v = input[f[0]];
      if (typeof v !== "string" || v.length > 500) throw Error("Invalid contact field.");
      p[f[0]] = v.trim();
    });
    return p;
  }
  function info(p) {
    var s = clean(p);
    return ["CONTACT INFORMATION"].concat(FIELDS.map(function (f) {
      return f[1] + ": " + (s[f[0]] || "(not provided)");
    })).join("\n");
  }
  // Explicit local export for Apple's Contacts/Safari AutoFill. This does not
  // read other websites, fill a recruiter form, or submit screening answers.
  function escapeCard(value) {
    return value.replace(/\r\n|\r|\n/g, "\n")
      .replace(/\\/g, "\\\\").replace(/\n/g, "\\n")
      .replace(/;/g, "\\;").replace(/,/g, "\\,");
  }
  function contactCard(input) {
    var p = clean(input);
    if (!p.fullName) throw Error("Enter a full name before preparing an iPhone contact card.");
    var nameParts = p.fullName.split(/\s+/);
    var family = nameParts.length > 1 ? nameParts.pop() : "";
    var given = nameParts.join(" ") || p.fullName;
    var lines = [
      "BEGIN:VCARD", "VERSION:3.0",
      "FN:" + escapeCard(p.fullName),
      "N:" + escapeCard(family) + ";" + escapeCard(given) + ";;;"
    ];
    if (p.email) lines.push("EMAIL;TYPE=INTERNET:" + escapeCard(p.email));
    if (p.phone) lines.push("TEL;TYPE=CELL:" + escapeCard(p.phone));
    // City / State is the only address field the present profile holds.
    // Never invent a street, ZIP code, or country from a partial address.
    var match = p.cityState.match(/^([^,]+),\s*([A-Za-z]{2})(?:\s+(\d{5}(?:-\d{4})?))?$/);
    if (match) lines.push("ADR;TYPE=HOME:;;;" + escapeCard(match[1].trim()) +
      ";" + match[2].toUpperCase() + ";" + (match[3] || "") + ";");
    lines.push("END:VCARD");
    return lines.join("\r\n") + "\r\n";
  }
  function storage() {
    try {
      if (!root.localStorage) throw Error("No browser storage");
      return root.localStorage;
    } catch (_e) {
      throw Error("Private browser storage is unavailable. Nothing was saved.");
    }
  }
  function hasSaved() {
    try { return !!storage().getItem(STORAGE_KEY); } catch (_e) { return false; }
  }
  function passphrase(s) {
    if (typeof s !== "string" || s.length < 16 || s.length > 1024) {
      throw Error("Use a passphrase of 16 to 1024 characters.");
    }
    return s;
  }
  function b64(v) {
    var t = "";
    for (var i = 0; i < v.length; i++) t += String.fromCharCode(v[i]);
    return root.btoa(t);
  }
  function fromB64(v, maxLength) {
    if (typeof v !== "string" || v.length > maxLength || v.length % 4 !== 0 ||
      !/^[A-Za-z0-9+/]+={0,2}$/.test(v)) throw Error("Saved profile is damaged.");
    var raw = root.atob(v), arr = new Uint8Array(raw.length);
    for (var i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
    return arr;
  }
  async function key(password, salt) {
    if (!root.crypto || !root.crypto.subtle) throw Error("Secure encryption is not supported on this device.");
    var seed = await root.crypto.subtle.importKey(
      "raw", new TextEncoder().encode(passphrase(password)), "PBKDF2", false, ["deriveKey"]);
    return root.crypto.subtle.deriveKey(
      {name:"PBKDF2", hash:"SHA-256", iterations:ITERATIONS, salt:salt},
      seed, {name:"AES-GCM", length:256}, false, ["encrypt", "decrypt"]);
  }
  async function seal(p, password) {
    var verified = clean(p);
    passphrase(password);
    if (!FIELDS.some(function (f) { return verified[f[0]].length > 0; })) {
      throw Error("Enter at least one contact field before saving.");
    }
    var salt = root.crypto.getRandomValues(new Uint8Array(16));
    var iv = root.crypto.getRandomValues(new Uint8Array(12));
    var raw = new TextEncoder().encode(JSON.stringify(verified));
    var encrypted = await root.crypto.subtle.encrypt({name:"AES-GCM", iv:iv},
      await key(password, salt), raw);
    return JSON.stringify({
      format:FORMAT, version:1, kdf:"PBKDF2-SHA256", iterations:ITERATIONS,
      cipher:"AES-256-GCM", salt:b64(salt), iv:b64(iv), data:b64(new Uint8Array(encrypted))
    });
  }
  async function open(encoded, password) {
    passphrase(password);
    if (typeof encoded !== "string" || encoded.length > 100000) throw Error("Saved profile is damaged.");
    var e;
    try { e = JSON.parse(encoded); } catch (_e) { throw Error("Saved profile is damaged."); }
    if (!e || e.format !== FORMAT || e.version !== 1 || e.kdf !== "PBKDF2-SHA256" ||
      e.iterations !== ITERATIONS || e.cipher !== "AES-256-GCM") throw Error("Saved profile format is invalid.");
    var salt = fromB64(e.salt, 40), iv = fromB64(e.iv, 30), data = fromB64(e.data, 50000);
    if (salt.length !== 16 || iv.length !== 12 || data.length < 17) throw Error("Saved profile is damaged.");
    try {
      var raw = await root.crypto.subtle.decrypt({name:"AES-GCM", iv:iv},
        await key(password, salt), data);
      return clean(JSON.parse(new TextDecoder("utf-8", {fatal:true}).decode(raw)));
    } catch (_e) {
      throw Error("Unlock failed. Check the passphrase, or the saved copy may be damaged.");
    }
  }
  async function save(p, password) {
    var ciphertext = await seal(p, password);
    storage().setItem(STORAGE_KEY, ciphertext);
  }
  async function unlock(password) {
    var value = storage().getItem(STORAGE_KEY);
    if (!value) throw Error("No saved profile exists on this browser.");
    return open(value, password);
  }
  function remove() { storage().removeItem(STORAGE_KEY); }

  var api = Object.freeze({
    STORAGE_KEY:STORAGE_KEY, FIELDS:FIELDS, empty:empty, clean:clean,
    formatContact:info, contactCard:contactCard, hasSaved:hasSaved, seal:seal, open:open,
    save:save, unlock:unlock, remove:remove
  });
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (!root.document) return;
  root.IncomeOSContact = api;

  function init() {
    var view = document.getElementById("view-research");
    if (!view || document.getElementById("incomeos-contact-panel")) return;
    var panel = document.createElement("section");
    panel.id = "incomeos-contact-panel";
    panel.className = "panel";
    panel.setAttribute("aria-labelledby", "incomeos-contact-title");
    // Static, audited UI markup; no owner values or recruiter content in HTML.
    panel.innerHTML =
      '<h3 id="incomeos-contact-title">Contact information for research applications</h3>' +
      '<p class="muted">Enter your contact details once. Use Save encrypted to keep them on this iPhone after closing the tab. Unlock them on return. Nothing is automatically sent to recruiters.</p>' +
      '<p class="muted">Device and browser only. No cloud sync or recovery if browser data is cleared or the passphrase is lost. Do not enter screener answers here.</p>' +
      '<p class="muted">For Safari AutoFill, you can download a contact card and add it to iPhone Contacts. The downloaded .vcf file is NOT encrypted. Review it before saving to Contacts. Add your street address separately in your contact card. Safari may not fill every form field.</p>' +
      '<div id="incomeos-contact-fields" class="formgrid"></div>' +
      '<div class="formgrid"><div><label for="contact-password">Encryption passphrase (16 characters minimum)</label><input id="contact-password" type="password" autocomplete="off" minlength="16"></div>' +
      '<div><label for="contact-confirm">Confirm passphrase when saving</label><input id="contact-confirm" type="password" autocomplete="off" minlength="16"></div></div>' +
      '<div class="reportactions"><button type="button" class="smallbtn" id="contact-save">Save encrypted on this device</button>' +
      '<button type="button" class="smallbtn" id="contact-unlock">Unlock saved details</button>' +
      '<button type="button" class="smallbtn" id="contact-copy">Copy contact information</button>' +
      '<button type="button" class="smallbtn" id="contact-vcard">Prepare iPhone AutoFill card (.vcf)</button>' +
      '<button type="button" class="smallbtn" id="contact-delete">Delete encrypted copy</button></div>' +
      '<p class="muted">Screening responses must be completed personally. PRC Global Market Research prohibits AI use in its screening and study participation.</p>' +
      '<p role="status" aria-live="polite" id="contact-status" class="muted"></p>';
    var first = view.querySelector("#start-here") || view.firstChild;
    view.insertBefore(panel, first);
    var fields = panel.querySelector("#incomeos-contact-fields"), inputs = {};
    FIELDS.forEach(function (f) {
      var wrap = document.createElement("div");
      var lab = document.createElement("label"); lab.htmlFor = "contact-" + f[0]; lab.textContent = f[1];
      var input = document.createElement(f[0] === "qualifications" ? "textarea" : "input");
      input.id = "contact-" + f[0]; input.maxLength = 500; input.autocomplete = "off";
      if (input.tagName === "INPUT") input.type = f[0] === "email" ? "email" : f[0] === "phone" ? "tel" : "text";
      wrap.appendChild(lab); wrap.appendChild(input); fields.appendChild(wrap); inputs[f[0]] = input;
    });
    var status = panel.querySelector("#contact-status");
    var pw = panel.querySelector("#contact-password"), pw2 = panel.querySelector("#contact-confirm");
    var busy = false, locked = hasSaved();
    function notice(t) { status.textContent = t; }
    function read() { var p = empty(); FIELDS.forEach(function (f) { p[f[0]] = inputs[f[0]].value; }); return p; }
    function fill(p) { FIELDS.forEach(function (f) { inputs[f[0]].value = p[f[0]]; }); }
    function eraseSecrets() { pw.value = ""; pw2.value = ""; }
    function sync() {
      panel.querySelector("#contact-unlock").disabled = !locked || busy;
      panel.querySelector("#contact-save").disabled = locked || busy;
      panel.querySelector("#contact-vcard").disabled = locked || busy;
      panel.querySelector("#contact-delete").disabled = !hasSaved() || busy;
    }
    notice(locked ? "Encrypted contact details found. Enter your passphrase and tap Unlock." :
      "No encrypted contact details are saved on this browser.");
    sync();
    panel.querySelector("#contact-save").addEventListener("click", async function () {
      if (locked || busy) return;
      if (pw.value !== pw2.value) { notice("Passphrase confirmation does not match."); return; }
      busy = true; sync();
      try {
        await save(read(), pw.value); notice("Contact details saved encrypted on this browser. Unlock after refreshing.");
      } catch (e) { notice("Nothing saved: " + e.message); }
      finally { eraseSecrets(); busy = false; sync(); }
    });
    panel.querySelector("#contact-unlock").addEventListener("click", async function () {
      if (!locked || busy) return;
      busy = true; sync();
      try {
        var saved = await unlock(pw.value); fill(saved); locked = false;
        notice("Unlocked. Details are available in this tab. Tap Save encrypted to keep any edits.");
      } catch (e) { notice(e.message); }
      finally { eraseSecrets(); busy = false; sync(); }
    });
    panel.querySelector("#contact-copy").addEventListener("click", async function () {
      var p = clean(read());
      if (!FIELDS.some(function (f) { return !!p[f[0]]; })) {
        notice("Unlock or enter your contact details before copying."); return;
      }
      try { await navigator.clipboard.writeText(info(p)); notice("Contact information copied. Paste it into the recruiter's official form yourself."); }
      catch (_e) { notice("Clipboard is unavailable in this browser. Select and copy the individual fields."); }
    });
    panel.querySelector("#contact-vcard").addEventListener("click", function () {
      if (locked || busy) return;
      var content;
      try { content = contactCard(read()); }
      catch (e) { notice(e.message); return; }
      if (!root.confirm("This downloads an UNENCRYPTED contact card containing your name, email, phone and any recognized city/state. Anyone with the file can read it. Continue?")) {
        notice("Contact card not downloaded."); return;
      }
      var url;
      try {
        var blob = new Blob([content], {type:"text/vcard;charset=utf-8"});
        url = root.URL.createObjectURL(blob);
        var a = document.createElement("a");
        a.href = url; a.download = "IncomeOS-contact.vcf"; a.hidden = true;
        document.body.appendChild(a); a.click(); a.remove();
        root.setTimeout(function () { root.URL.revokeObjectURL(url); }, 10000);
        notice("Contact card downloaded. Open it, review, and add it to Contacts. In iPhone Settings > Apps > Safari > AutoFill, enable Use Contact Info and choose your card under My Info. Remove the unencrypted download when finished.");
      } catch (_e) {
        if (url) root.URL.revokeObjectURL(url);
        notice("The contact card could not be downloaded in this browser. Use Copy contact information instead.");
      }
    });
    panel.querySelector("#contact-delete").addEventListener("click", function () {
      if (!root.confirm("Delete this browser's encrypted contact profile? This cannot be undone.")) return;
      try { remove(); fill(empty()); locked = false; eraseSecrets(); notice("Encrypted profile deleted from this browser."); }
      catch (e) { notice("Delete failed: " + e.message); }
      sync();
    });

    function prepare() {
      var tab = document.querySelector('.bottomnav button[data-view="research"]');
      if (tab && view.hidden) tab.click();
      panel.scrollIntoView({behavior:"smooth", block:"start"});
      notice(locked ? "Unlock saved details to prepare your application. No information has been submitted." :
        "Review your contact details, then copy them or prepare an iPhone AutoFill card. Complete the official recruiter screener yourself.");
    }
    function decorate() {
      document.querySelectorAll("#research-cards article.card, #radar-results article.radar-card").forEach(function (card) {
        if (card.dataset.contactPrepared === "1") return;
        var link = card.querySelector('a[href^="https://"], a[href^="http://"]');
        if (!link) return;
        var parent = card.querySelector(".cardalt, .radar-controls") || card;
        var b = document.createElement("button");
        b.type = "button"; b.className = "smallbtn"; b.textContent = "Prepare contact details";
        b.addEventListener("click", prepare);
        parent.appendChild(b); card.dataset.contactPrepared = "1";
      });
    }
    decorate();
    ["research-cards", "radar-results"].forEach(function (id) {
      var target = document.getElementById(id);
      if (target) new MutationObserver(decorate).observe(target, {childList:true, subtree:true});
    });
  }
  if (root.document.readyState === "loading") root.document.addEventListener("DOMContentLoaded", init);
  else init();
}(typeof window !== "undefined" ? window : globalThis));
