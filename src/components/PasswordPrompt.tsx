import React, { useState, useEffect } from 'react';

interface PasswordSetupProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onAuthenticate: (success: boolean) => void;
}

const PasswordSetup: React.FC<PasswordSetupProps> = ({ isOpen, setIsOpen, onAuthenticate }) => {
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setError('');
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    if (password === process.env.REACT_APP_SITE_PASSWORD) {
      onAuthenticate(true);
      localStorage.setItem('isAuthenticated', 'true');
      setIsOpen(false);
    } else {
      setError('Incorrect password. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="w-full max-w-md rounded-xl border-4 border-black bg-white p-6">
        <h2 className="mb-4 text-2xl font-bold">Enter Password</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            required
            className="w-full rounded-md border-2 border-black p-2"
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex justify-end space-x-2">
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
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PasswordSetup;
