import React, { useState, useEffect } from 'react';
import type { ApiKeySetupProps } from '../types';

const APIKeySetup: React.FC<ApiKeySetupProps> = ({
  isOpen,
  setIsOpen,
  onSave,
  onClear,
  initialApiKey,
}) => {
  const [inputKey, setInputKey] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setInputKey(initialApiKey || '');
    }
  }, [isOpen, initialApiKey]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    onSave(inputKey);
    setIsOpen(false);
  };

  const handleClear = (): void => {
    onClear();
    setInputKey('');
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="w-full max-w-md rounded-xl border-4 border-black bg-white p-6">
        <h2 className="mb-4 text-2xl font-bold">
          {initialApiKey ? 'Edit' : 'Enter'} HuggingFace API Key
        </h2>
        <h5 className="mb-2 text-lg font-normal">
          Enter a huggingface API key to completely bypass the server and maintain your privacy. Go
          to{' '}
          <a
            className="text-blue-500 hover:underline"
            target="_blank"
            rel="noopener noreferrer"
            href="https://huggingface.co"
          >
            huggingface.co
          </a>
          , create a user and and then{' '}
          <a
            className="text-blue-500 hover:underline"
            target="_blank"
            rel="noopener noreferrer"
            href="https://huggingface.co/settings/tokens"
          >
            create a token
          </a>{' '}
          and paste it here.
        </h5>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={inputKey}
            onChange={(e) => setInputKey(e.target.value)}
            placeholder="Paste your API key here"
            required
            className="w-full rounded-md border-2 border-black p-2"
          />
          <div className="flex justify-between space-x-2">
            <button
              type="button"
              onClick={handleClear}
              className="rounded-md bg-red-500 px-4 py-2 font-bold text-white transition duration-300 hover:bg-red-600"
            >
              Clear Key
            </button>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-md bg-gray-200 px-4 py-2 font-bold text-black transition duration-300 hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-md bg-black px-4 py-2 font-bold text-white transition duration-300 hover:bg-gray-800"
              >
                Save
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default APIKeySetup;
