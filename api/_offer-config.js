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
export const OFFERS = {
  audit: {
    slug: 'audit-request',
    name: 'AI Documentation Defensibility Review',
    price_usd: 250,
    price_label: '$250',
    scope: 'Five de-identified records, read against the five conditions and the seven failure modes',
    checkout_url: ''   // [REQUIRES USER INPUT] paste the payment link here
  },
  governance: {
    slug: 'governance-request',
    name: 'AI Governance Documentation Review',
    price_usd: 500,
    price_label: '$500',
    scope: 'A documentation standard or template set, plus up to five records produced under it',
    checkout_url: ''   // [REQUIRES USER INPUT] paste the payment link here
  },
  calibration: {
    slug: 'calibration-request',
    name: 'Benchmark Access and Calibration',
    price_usd: 750,
    price_label: '$750',
    scope: 'One licensed run of the held-out record set, scoring returned by the holder',
    checkout_url: ''   // [REQUIRES USER INPUT] paste the payment link here
  }
};

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
