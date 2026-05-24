import React, { useEffect, useRef } from 'react';
import type { ImageModalProps } from '../types';

const ImageModal: React.FC<ImageModalProps> = ({ image, onClose, customButton }) => {
  const modalRef = useRef<HTMLDivElement | null>(null);

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
        <p className="mb-2 text-lg font-semibold">Prompt:</p>
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
