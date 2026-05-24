export type ModelSpeed = 'fast' | 'slow';

export interface TextToImageModel {
  id: string;
  name: string;
  supportsNegativePrompt: boolean;
  speed?: ModelSpeed;
  nsfw?: boolean;
  description?: string;
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
