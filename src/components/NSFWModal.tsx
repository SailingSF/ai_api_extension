import React from 'react';
import type { NSFWModalProps } from '../types';

const NSFWModal: React.FC<NSFWModalProps> = ({ isOpen, onClose, onConfirm, prompt }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="w-full max-w-[90%] rounded-lg bg-white p-4 shadow-xl sm:max-w-md sm:p-6">
        <h2 className="mb-3 text-center text-lg font-bold sm:mb-4 sm:text-xl">You are a sicko</h2>
        <p className="mb-3 text-sm sm:mb-4 sm:text-base">
          You are about to use a model that may generate NSFW content. You sick freak.
        </p>
        <p className="mb-3 rounded bg-gray-100 p-2 text-sm italic sm:mb-4 sm:text-base">
          &quot;{prompt}&quot;
        </p>
        <p className="mb-3 text-sm sm:mb-4 sm:text-base">
          You want AI to make you a NSFW picture of this? You are genuinely sick in the head.
        </p>
        <p className="mb-4 text-sm sm:mb-6 sm:text-base">Seek Christ.</p>
        <div className="mt-4 flex flex-col items-center">
          <button
            onClick={onClose}
            className="mb-2 w-full rounded bg-blue-200 px-4 py-2 text-sm text-black transition duration-300 hover:bg-gray-300 sm:text-base"
          >
            I will seek Christ ✝️
          </button>
          <button
            onClick={onConfirm}
            className="w-full rounded bg-red-500 px-4 py-2 text-sm text-white transition duration-300 hover:bg-red-600 sm:text-base"
          >
            I understand that I am sick in the head and I really want to see this gross image.
          </button>
        </div>
      </div>
    </div>
  );
};

export default NSFWModal;
