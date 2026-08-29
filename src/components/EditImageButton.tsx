import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Wand2 } from 'lucide-react';

interface EditImageButtonProps {
  /** Primary key of the image, sent to the server as `source_image_id`. */
  imageId: number | string;
  /** Only used to show a thumbnail on the editor page. */
  imageUrl: string;
  className?: string;
}

/**
 * Sends an existing image to /edit.
 *
 * Only the id crosses the wire on submit: the server already holds this picture and
 * presigns it for the provider itself. The url comes along purely so the editor can
 * show a thumbnail, which an <img> renders with no CORS involved. The earlier version
 * of this handed over the url alone and made the editor download and re-upload the
 * bytes, which broke whenever the serving origin was missing from the bucket's CORS
 * allowlist -- and again when the browser reused the <img> tag's non-CORS cache entry
 * for the fetch.
 */
const EditImageButton: React.FC<EditImageButtonProps> = ({ imageId, imageUrl, className }) => {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      onClick={() =>
        navigate('/edit', { state: { sourceImageId: imageId, sourceImageUrl: imageUrl } })
      }
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
