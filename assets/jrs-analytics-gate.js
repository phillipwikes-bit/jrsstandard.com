/* JRS analytics gate.
   Owners and automated reviewers can opt out of public GA4 measurement with
   ?jrs_test=1. The choice persists only in that browser's local storage.
   ?jrs_test=0 removes the choice. No testing identifiers are transmitted. */
(function () {
  'use strict';

  var measurementId = 'G-NVYHJ7BJ92';
  var storageKey = 'jrs_analytics_test_mode';
  var mode = null;
  var optedOut = false;

  try {
    mode = new URLSearchParams(window.location.search).get('jrs_test');
  } catch (_) {
    // A restricted browser can still load the site without search parsing.
  }

  try {
    if (mode === '1') {
      window.localStorage.setItem(storageKey, '1');
      optedOut = true;
    } else if (mode === '0') {
      window.localStorage.removeItem(storageKey);
    } else {
      optedOut = window.localStorage.getItem(storageKey) === '1';
    }
  } catch (_) {
    // In private/restricted contexts, the query parameter works per page.
  }

  if (mode === '1') optedOut = true;
  if (mode === '0') optedOut = false;

  var hostname = window.location.hostname.toLowerCase();
  var productionHost = hostname === 'www.jrsstandard.com' || hostname === 'jrsstandard.com';
  var automatedBrowser = !!(window.navigator && window.navigator.webdriver === true);
  var suppress = optedOut || !productionHost || automatedBrowser;

  window.jrsAnalyticsSuppressed = suppress;
  if (suppress) {
    // Existing resource/training click handlers may call gtag. Make these
    // calls harmless without downloading Google's tracking script.
    window.gtag = function () {};
    return;
  }

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () {
    window.dataLayer.push(arguments);
  };
  window.gtag('js', new Date());
  window.gtag('config', measurementId);

  var script = document.createElement('script');
  script.async = true;
  script.src = 'https://www.googletagmanager.com/gtag/js?id=' + measurementId;
  document.head.appendChild(script);
})();
