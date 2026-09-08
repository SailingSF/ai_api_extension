/**
 * Every word on the Credits & Plans page (/billing) lives in this file.
 *
 * TO CHANGE THE WORDING: edit the text between the quote marks and save. That is all.
 *
 *   - Keep the quote marks, the commas and the names on the left (heroTitle, planCta...)
 *     exactly as they are -- those are what the page looks the text up by.
 *   - In planBenefits you can add, remove or reorder lines. Each line is one bullet
 *     point, in quote marks, with a comma after it.
 *   - If your text contains an apostrophe, write it as a curly one -- don't -- or the
 *     straight one will end the quote early and break the page.
 *
 * Nothing in here sets a price. Prices, credit amounts and plan names come from the
 * backend and appear on the page automatically.
 */
export const BILLING_COPY = {
  /** The big heading at the top of the page, and the line under it. */
  heroTitle: 'Credits & Plans',
  heroSubtitle: 'Pay as you go, or subscribe and get more for your money.',

  /** Heading above the list of things a subscription unlocks. */
  benefitsTitle: 'What subscribing gets you',

  /** The bullet list itself. Add or remove lines freely. */
  planBenefits: [
    'A batch of credits every month, at the best price per credit',
    'Unused credits roll over',
    'Keep any image private, out of the public gallery',
    'Manage your own gallery, every image you made in one place',
  ],

  /** One line under the "Monthly plan" heading. The value claim lives here. */
  planPitch: 'The cheapest way to buy credits, and the only way to unlock private images and your own gallery.',

  /** One line under the "One-time credit packs" heading. */
  packPitch: 'No subscription, no renewal. Buy once and the credits stay until you spend them.',

  /** The two buy buttons. */
  planCta: 'Go Premium',
  packCta: 'Buy pack',

  /** The little tag on whichever pack gives the most credits per dollar. */
  bestValueBadge: 'Best value',

  /** Reassurance line at the bottom of the page. */
  reassurance:
    'Cancel anytime · Credits never expire · Payments handled by Stripe — we never see your card details',

  /**
   * How the balance is broken down. Shown on this page and in the account menu, so
   * both say the same thing. Each label follows a number, e.g. "40 from your plan".
   */
  monthlyBucketLabel: 'from your plan (rolls over)',
  purchasedBucketLabel: 'purchased (never expire)',
};
