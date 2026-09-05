export type ModelSpeed = 'fast' | 'slow';

/**
 * Model catalog served by the backend at GET /api/models/.
 *
 * The roster lives in the backend's api/model_config.py and is the single source of
 * truth -- do not hardcode model lists here. Adding, removing or repricing a model is
 * a backend-only change that this app picks up on the next load.
 */
export interface FreeModel {
  key: string;
  label: string;
  description: string;
  repo: string;
  providers: string[];
  supports_negative_prompt: boolean;
  speed: ModelSpeed;
  /** Output is always stored flagged NSFW and excluded from the public gallery. */
  nsfw: boolean;
  tags: string[];
}

export interface PremiumModel {
  key: string;
  label: string;
  description: string;
  cost: number;
  provider: string;
  supports_negative_prompt: boolean;
  speed: ModelSpeed;
  tags: string[];
}

/**
 * An entry from the catalog's `edit` array. The four `supports_*` flags are what the
 * editing UI gates its controls on: the server rejects a parameter the selected model
 * can't use, so a control shown for a `false` flag produces a 400 the user can do
 * nothing about.
 */
export interface EditModel {
  key: string;
  label: string;
  description: string;
  cost: number;
  provider: string;
  supports_mask: boolean;
  supports_multiple_images: boolean;
  supports_size: boolean;
  supports_strength: boolean;
  /** Prompt budget. The server clamps a longer instruction rather than erroring. */
  max_prompt_chars: number;
  tags: string[];
}

/**
 * POST /api/generate-image-with-input/.
 *
 * `prompt` is what was actually sent, not what was typed -- compare the two to know
 * whether the server's clamp fired. There is no balance in this response; refresh it
 * with GET /api/me/. Edits now land in the public gallery like any other image unless
 * the request opted out, carrying a link back to the picture they were made from.
 */
export interface EditResponse {
  image_url: string;
  /** Send this back as `source_image_id` to edit the result again. */
  image_id: number;
  prompt: string;
  credits_spent: number;
  nsfw: boolean;
}

export interface ModelCatalog {
  free: FreeModel[];
  premium: PremiumModel[];
  edit: EditModel[];
  arena_defaults: string[];
}

export interface GenerationLog {
  prompt: string;
  model: string;
}

/**
 * Where an edit came from, served on every gallery payload as `edit_source`.
 *
 * `type` is the only key guaranteed to be there: for a `user_upload` every other
 * field is null, because the site holds no row for a file the user brought with them
 * -- all the UI can say is that the source was an upload. For a `site_image`,
 * `image_id`/`image_url` point at the original and `prompt`/`model` are how it was
 * made. When `is_edit` is true that prompt is itself an edit instruction rather than
 * a description of the picture, so it needs a different label.
 */
export interface EditSource {
  type: 'site_image' | 'user_upload';
  image_id: number | null;
  image_url: string | null;
  prompt: string | null;
  model: string | null;
  is_edit: boolean;
}

export interface ImageItem {
  id?: number | string;
  url: string;
  thumbnail_url?: string;
  generation_log: GenerationLog;
  image_id?: number | string; // for Arena reshaped results
  created_at: string;
  /** False (or absent, on payloads that predate provenance) for a plain generation. */
  is_edit?: boolean;
  /** Null whenever `is_edit` is false. Lineage is one level deep. */
  edit_source?: EditSource | null;
}

export interface GalleryResponse {
  results: ImageItem[];
  next: string | null;
  previous: string | null;
}

export interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  message?: string;
}

export interface ApiKeySetupProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onSave: (apiKey: string) => void;
  onClear: () => void;
  initialApiKey?: string | null;
}

export interface ImageModalProps {
  image: ImageItem;
  onClose: () => void;
  customButton?: React.ReactNode;
}

export interface NSFWModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  prompt: string;
}

/**
 * Billing. The catalog is served by the backend at GET /api/billing/products/ and
 * the registry lives in the backend's billing/products.py -- do not hardcode prices
 * or product keys here. The client only ever sends a product *key*; the amount that
 * gets charged is resolved server-side.
 */
export interface CreditPack {
  key: string;
  display_name: string;
  credits: number;
  price_usd: number;
}

export interface SubscriptionPlan {
  key: string;
  display_name: string;
  tier: string;
  monthly_credits: number;
  price_usd: number;
  interval: string;
}

export interface BillingCatalog {
  credit_packs: CreditPack[];
  subscription_plans: SubscriptionPlan[];
}

export interface AccountSubscription {
  plan_key: string;
  status: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
}

/**
 * GET /api/me/ -- the live balance. `credits` is the spendable total; the two
 * buckets behind it differ in lifetime: `monthly_credits` is a subscription
 * allowance that resets each billing cycle, `purchased_credits` comes from packs
 * and never expires. Spending drains the monthly bucket first.
 */
export interface Account {
  id: number;
  email: string;
  userdisplay_name: string;
  tier: string;
  is_email_verified: boolean;
  credits: number;
  monthly_credits: number;
  purchased_credits: number;
  subscription: AccountSubscription | null;
}

/**
 * GET /api/billing/checkout-status/. `paid` and `fulfilled` are deliberately
 * separate: Stripe returns the browser here the moment the card clears, but credits
 * are granted by webhook a beat later. Poll until `fulfilled`.
 */
export interface CheckoutStatus {
  session_id: string;
  mode: string;
  product_key: string;
  status: string;
  paid: boolean;
  fulfilled: boolean;
  credits_granted: number | null;
  account: Account;
}
