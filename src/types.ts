export type ModelSpeed = 'fast' | 'slow';

export interface TextToImageModel {
  id: string;
  name: string;
  supportsNegativePrompt: boolean;
  speed?: ModelSpeed;
  nsfw?: boolean;
  description?: string;
}

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

export interface EditModel {
  key: string;
  label: string;
  cost: number;
  provider: string;
  supports_mask: boolean;
  supports_multiple_images: boolean;
  tags: string[];
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

export interface ImageItem {
  id?: number | string;
  url: string;
  thumbnail_url?: string;
  generation_log: GenerationLog;
  image_id?: number | string; // for Arena reshaped results
  created_at: string;
}

export interface GalleryResponse {
  results: ImageItem[];
  next: string | null;
  previous: string | null;
}

export interface ApiKeyContextValue {
  apiKey: string;
  saveApiKey: (key: string) => void;
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
