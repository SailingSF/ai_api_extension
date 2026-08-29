import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Wand2 } from 'lucide-react';

interface EditImageButtonProps {
  /** The image to carry into the editor. Must be one this app produced. */
  imageUrl: string;
  className?: string;
}

/**
 * Sends an existing image to /edit.
 *
 * The editing endpoint takes multipart uploads, not urls, so the editor fetches the
 * bytes back out of S3 itself -- all it needs from here is which image. That url
 * travels in router *state* rather than the query string on purpose: it is then
 * always one this app rendered, so /edit never becomes a fetcher someone else can
 * point at an arbitrary address.
 */
const EditImageButton: React.FC<EditImageButtonProps> = ({ imageUrl, className }) => {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      onClick={() => navigate('/edit', { state: { sourceImageUrl: imageUrl } })}
      className={
        className ??
        'flex items-center justify-center gap-2 rounded-md bg-teal-500 px-6 py-3 font-bold text-white transition duration-300 hover:bg-teal-600'
      }
    >
      <Wand2 size={18} />
      Edit this image
    </button>
  );
};

export default EditImageButton;
