import React, { useEffect, useRef } from 'react';
import type { EditSource, ImageModalProps } from '../types';

/**
 * Provenance for an edited image.
 *
 * Only `type` is guaranteed: an edit of a file the user brought with them has no row
 * on this site, so there is nothing to link to and nothing to say about how the
 * source was made. An edit of one of our own images gets a thumbnail linking back to
 * it plus the prompt behind it -- labelled "previous edit" rather than "original
 * prompt" when that source was itself an edit, since the text is then an instruction
 * and not a description.
 */
const EditProvenance: React.FC<{ source: EditSource }> = ({ source }) => {
  const isSiteImage = source.type === 'site_image' && !!source.image_url;

  return (
    <div className="mb-3 rounded-md border-2 border-black bg-teal-50 p-3">
      <p className="text-xs font-bold uppercase tracking-wide text-teal-800">
        {isSiteImage ? 'Edited from' : 'Edited from an uploaded image'}
      </p>
      {isSiteImage && (
        <div className="mt-2 flex gap-3">
          <a href={source.image_url as string} target="_blank" rel="noopener noreferrer">
            <img
              src={source.image_url as string}
              alt={source.prompt ?? 'The original image'}
              loading="lazy"
              width={96}
              height={96}
              className="h-20 w-20 flex-shrink-0 rounded-md border-2 border-black object-cover transition duration-300 hover:opacity-75"
            />
          </a>
          <div className="min-w-0 text-sm">
            {source.prompt && (
              <p className="text-gray-800">
                <span className="font-semibold">
                  {source.is_edit ? 'Previous edit: ' : 'Original prompt: '}
                </span>
                {source.prompt}
              </p>
            )}
            {source.model && <p className="mt-1 text-xs text-gray-500">Model: {source.model}</p>}
            <a
              href={source.image_url as string}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-block text-xs font-semibold text-teal-700 underline hover:text-teal-900"
            >
              View original
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

const ImageModal: React.FC<ImageModalProps> = ({ image, onClose, customButton }) => {
  const modalRef = useRef<HTMLDivElement | null>(null);
  const isEdit = !!image.is_edit && !!image.edit_source;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div
        ref={modalRef}
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg bg-white p-4"
      >
        <img
          src={image.url}
          alt={image.generation_log.prompt}
          loading="lazy"
          width={1024}
          height={1024}
          className="mb-4 h-auto w-full"
        />
        {customButton && (
          <div className="mb-4 flex items-center justify-center">{customButton}</div>
        )}
        {image.gallery_eligible === false && (
          <p className="mb-3 inline-block rounded border-2 border-black bg-amber-300 px-2 py-0.5 text-xs font-bold uppercase">
            Private — not in the public gallery
          </p>
        )}
        {isEdit && <EditProvenance source={image.edit_source as EditSource} />}
        <p className="mb-2 text-lg font-semibold">{isEdit ? 'Edit instruction:' : 'Prompt:'}</p>
        <p className="mb-2 text-lg font-medium">{image.generation_log.prompt}</p>
        <p className="text-md mb-2">Model: {image.generation_log.model}</p>
        <p className="text-sm text-gray-500">
          Created at: {new Date(image.created_at).toLocaleString()}
        </p>
      </div>
    </div>
  );
};

export default ImageModal;
