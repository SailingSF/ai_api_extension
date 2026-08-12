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
  onAuthenticate: (success: boolean) => void;
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
