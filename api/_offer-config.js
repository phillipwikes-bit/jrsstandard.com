// OFFER CONFIGURATION. Single source of truth for price and checkout URL.
//
// Prices are declared ONCE here. The intake pages, the checkout redirect and
// any future receipt all read this object, so a price cannot say $250 on one
// surface and $500 on another. That is the defect class this repository has
// hit repeatedly, and a price is the worst possible place for it.
//
// CHECKOUT URLs ARE DELIBERATELY EMPTY.
//
// A Stripe Payment Link or a Lemon Squeezy checkout URL can only be created
// inside the owner's own payment account. Nothing in this repository can mint
// one, and a plausible-looking URL written here would be a fabricated payment
// destination: at best a dead link shown to a paying customer, at worst money
// sent somewhere unintended. So they stay empty until the owner pastes the
// real ones in, and /api/checkout refuses to redirect rather than guessing.
//
// TO GO LIVE: create one payment link per offer in your provider's dashboard,
// paste each URL below, and deploy. Nothing else needs to change.
// RETIRED 2026-08-26. The revenue model collapsed to a single motion:
// engine licensing. These three were fixed-scope engagements that consumed
// owner hours against a recorded weekly capacity of 10 to 15 hours, and the
// file's own comment below says the engine is the only offer that scales
// without that time. None of them ever took a payment: every checkout_url was
// empty for the whole time they were listed.
//
// THEY ARE MARKED RATHER THAN DELETED. api/checkout-stats.js,
// api/leads-4b7e2c9af106d385.js, api/asset-stats.js and the owner programme
// page resolve historical rows through these keys. Deleting them would orphan
// records that already exist. retired:true stops anything new being sold while
// history keeps its names.
//
// The audit scope did not disappear. It became the free evaluation step in
// ENGINE_TIERS below, which is where a five-record read belongs: proof inside
// a licensing conversation rather than a $250 product competing with it.
export const OFFERS = {
  audit: {
    retired: true,   // retired 2026-08-26, licensing-only model
    slug: 'audit-request',
    name: 'AI Documentation Defensibility Review',
    price_usd: 250,
    price_label: '$250',
    scope: 'Five de-identified records, read against the five conditions and the seven failure modes',
    checkout_url: ''   // [REQUIRES USER INPUT] paste the payment link here
  },
  governance: {
    retired: true,   // retired 2026-08-26, licensing-only model
    slug: 'governance-request',
    name: 'AI Governance Documentation Review',
    price_usd: 500,
    price_label: '$500',
    scope: 'A documentation standard or template set, plus up to five records produced under it',
    checkout_url: ''   // [REQUIRES USER INPUT] paste the payment link here
  },
  calibration: {
    retired: true,   // retired 2026-08-26, licensing-only model
    slug: 'calibration-request',
    name: 'Benchmark Access and Calibration',
    price_usd: 750,
    price_label: '$750',
    scope: 'One licensed run of the held-out record set, scoring returned by the holder',
    checkout_url: ''   // [REQUIRES USER INPUT] paste the payment link here
  }
};

// REVIEW ENGINE LICENCE TIERS.
//
// The engine is the only offer that scales without the owner's time, so it is
// the one that belongs in a tier ladder rather than in a fixed-scope engagement.
//
// PRICES ARE DELIBERATELY NULL, FOR THE SAME REASON THE CHECKOUT URLS ARE EMPTY.
// A price nobody has agreed to is not a smaller problem than a payment link
// nobody minted: it is a number a buyer will hold you to, and inventing one here
// would put a figure on a public page that no engagement has ever tested. Three
// engagements at the existing $250, $500 and $750 come first; the tier prices are
// then set from what those actually closed at.
//
// Until a price is set, isPriced() is false and any surface reading these must
// show "Contact for pricing" rather than a blank or a guess. The evaluation tier
// is genuinely free and is marked so explicitly, never inferred from a null.
export const ENGINE_TIERS = {
  evaluation: {
    slug: 'engine-evaluation',
    name: 'Review Engine Evaluation',
    price_usd: 0,
    price_label: 'Free on request',
    free: true,
    tokens: 1,
    call_ceiling: 100,
    term_days: 30,
    scope: 'One token, 100 calls, 30 days. Lead capture rather than a discount: it exists so an integrator can read real output before committing.'
  },
  single_function: {
    slug: 'engine-single-function',
    name: 'Review Engine, Single Function',
    price_usd: null,      // [REQUIRES USER INPUT] annual price, set after 3 closed engagements
    price_label: '',      // [REQUIRES USER INPUT] must match price_usd exactly
    free: false,
    tokens: 1,
    call_ceiling: null,   // [REQUIRES USER INPUT] stated annual call ceiling
    term_days: 365,
    scope: 'One token for one function, annual term, stated call ceiling.'
  },
  enterprise: {
    slug: 'engine-enterprise',
    name: 'Review Engine, Enterprise',
    price_usd: null,      // [REQUIRES USER INPUT] annual price
    price_label: '',      // [REQUIRES USER INPUT] must match price_usd exactly
    free: false,
    tokens: null,         // [REQUIRES USER INPUT] number of per-team tokens
    call_ceiling: null,   // [REQUIRES USER INPUT]
    term_days: 365,
    scope: 'Multiple per-team tokens, each independently revocable, higher ceiling, a named contact.'
  },
  governance_reporting: {
    slug: 'engine-governance-reporting',
    name: 'Governance Reporting',
    price_usd: null,      // [REQUIRES USER INPUT] annual price
    price_label: '',      // [REQUIRES USER INPUT] must match price_usd exactly
    free: false,
    tokens: null,         // [REQUIRES USER INPUT]
    call_ceiling: null,   // [REQUIRES USER INPUT]
    term_days: 365,
    // WORDING IS LOAD-BEARING HERE. This tier delivers aggregate reporting over
    // records the licensee has already run. It does NOT deliver compliance, a
    // certification, an accreditation or an audit opinion, and terms.html states
    // in writing that JRS establishes compliance with no framework. Any surface
    // rendering this scope must carry that non-establishment clause in the same
    // block, which scripts/check_zero_drift.py now enforces.
    scope: 'Aggregate reporting across a reviewed population: measured rate of records that cannot carry their own reasoning, broken out by decision type and business unit. Evidence for a management system you already run. Not a compliance determination.'
  }
};

// True only when a tier has a real, agreed price. A null price is a question that
// has not been answered, and it must never render as a number or as a blank.
export function isPriced(tier) {
  return !!(tier && tier.free === false
            && typeof tier.price_usd === 'number' && tier.price_usd > 0
            && typeof tier.price_label === 'string' && tier.price_label.length > 0);
}

export function tierFor(key) {
  return Object.prototype.hasOwnProperty.call(ENGINE_TIERS, key) ? ENGINE_TIERS[key] : null;
}

// The free tier. Named here so nothing downstream has to remember that Offer 1
// has a free public half, and so no surface can quietly start charging for it.
export const FREE_TIER = {
  name: 'Seven-Point Record Defensibility Check',
  path: '/check.html',
  price_usd: 0,
  price_label: 'Free',
  gated: false
};

export function offerFor(key) {
  return Object.prototype.hasOwnProperty.call(OFFERS, key) ? OFFERS[key] : null;
}

export function isConfigured(offer) {
  return !!(offer && typeof offer.checkout_url === 'string'
            && /^https:\/\/\S+$/.test(offer.checkout_url));
}
