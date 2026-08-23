/**
 * Credits granted to a new account once it verifies its email.
 *
 * This number belongs to the backend -- it is mirrored here only because the API
 * doesn't report it yet. It is now quoted in several places (the register form, the
 * signed-out navbar, the home hero, the signed-out generate buttons), so keep it in
 * this one constant. Better still: have GET /api/me/ or the products endpoint return
 * it, then delete this and read it from there, the same way prices and model costs
 * are already resolved server-side.
 */
export const SIGNUP_BONUS_CREDITS = 20;

/**
 * At or below this balance the credit pill switches to its "running low" treatment.
 * A deliberate round number rather than a model price: the navbar has no catalog, and
 * the generators do the precise "you can't afford *this* model" check themselves.
 */
export const LOW_CREDIT_THRESHOLD = 5;
