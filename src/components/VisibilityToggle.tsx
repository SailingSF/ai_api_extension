import React, { useState } from 'react';
import axios from 'axios';
import { Eye, EyeOff } from 'lucide-react';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL as string | undefined;

interface VisibilityToggleProps {
  imageId: number | string;
  /** Current `gallery_eligible`. The parent owns it so the change is optimistic. */
  isPublic: boolean;
  onChange: (isPublic: boolean) => void;
  className?: string;
}

/**
 * Moves one of your own images in or out of the public gallery.
 *
 * The parent holds the state so the card flips immediately; a failure hands it back.
 * A 404 means the image is not the caller's -- the backend returns 404 rather than
 * 403 on purpose, so a stranger can't enumerate other people's galleries by id.
 */
const VisibilityToggle: React.FC<VisibilityToggleProps> = ({
  imageId,
  isPublic,
  onChange,
  className = '',
}) => {
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const toggle = async (): Promise<void> => {
    const next = !isPublic;
    setError(null);
    setIsSaving(true);
    onChange(next);
    try {
      if (!API_BASE_URL) throw new Error('Missing REACT_APP_API_BASE_URL');
      await axios.post(
        `${API_BASE_URL}/api/images/${imageId}/visibility/`,
        { publish_to_gallery: next },
        { headers: { Authorization: `Token ${localStorage.getItem('token')}` } }
      );
    } catch (err) {
      onChange(!next);
      const status = axios.isAxiosError(err) ? err.response?.status : undefined;
      setError(
        status === 404
          ? "That image isn't yours."
          : status === 403
            ? 'Changing visibility is a premium feature.'
            : 'Could not change that. Try again.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => void toggle()}
        disabled={isSaving}
        className="flex w-full items-center justify-center gap-1.5 rounded-md border-2 border-black bg-white px-3 py-1.5 text-xs font-bold text-black transition duration-300 hover:bg-gray-100 disabled:opacity-50"
      >
        {isPublic ? <EyeOff size={14} /> : <Eye size={14} />}
        {isPublic ? 'Make private' : 'Make public'}
      </button>
      {error && <p className="mt-1 text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
};

export default VisibilityToggle;
