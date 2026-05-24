import React, { useState, useEffect } from 'react';
import axios from 'axios';
import type { AuthModalProps } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL as string | undefined;

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onAuthenticate, message }) => {
  const [isLogin, setIsLogin] = useState<boolean>(true);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  useEffect(() => {
    setError('');
    setSuccessMessage('');
  }, [isLogin]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!API_BASE_URL) {
      setError('API is not configured.');
      return;
    }

    if (!isLogin && password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      const endpoint = isLogin ? '/api/login/' : '/api/register/';
      const data = isLogin ? { email, password } : { email, password, userdisplay_name: username };
      const response = await axios.post(`${API_BASE_URL}${endpoint}`, data);

      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        if (response.data.user?.credits != null) {
          localStorage.setItem('credits', String(response.data.user.credits));
        }
        setSuccessMessage(
          isLogin ? 'Login successful!' : `${response.data.message} You're now signed in.`
        );
        setTimeout(() => {
          onAuthenticate(true);
          onClose();
        }, 2000);
      } else {
        setError('Authentication failed. Please try again.');
      }
    } catch (error: any) {
      if (error.response) {
        if (error.response.status === 400) {
          setError(error.response.data.message || 'Invalid input. Please check your details.');
        } else if (error.response.status === 401) {
          setError('Invalid credentials. Please try again.');
        } else if (error.response.status === 409) {
          setError('This email is already registered. Please login or use a different email.');
        } else {
          setError('An unexpected error occurred. Please try again later.');
        }
      } else if (error.request) {
        setError('No response from server. Please check your internet connection and try again.');
      } else {
        setError('An unexpected error occurred. Please try again later.');
      }
    }
  };

  const renderLoginForm = () => (
    <>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="mb-4 w-full rounded border p-2"
        required
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="mb-4 w-full rounded border p-2"
        required
      />
    </>
  );

  const renderRegisterForm = () => (
    <>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="mb-4 w-full rounded border p-2"
        required
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="mb-4 w-full rounded border p-2"
        required
      />
      <input
        type="password"
        placeholder="Confirm Password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        className="mb-4 w-full rounded border p-2"
        required
      />
      <input
        type="text"
        placeholder="Username (optional)"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        className="mb-4 w-full rounded border p-2"
      />
      <p className="mb-4 text-sm text-gray-600">
        After registration, check your email to verify your account and receive 20 free credits!
      </p>
    </>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-96 rounded-lg bg-white p-6 shadow-xl">
        <h2 className="mb-2 text-2xl font-bold">{isLogin ? 'Login' : 'Register'}</h2>
        {message && <p className="mb-4 text-blue-500">{message}</p>}
        <form onSubmit={handleSubmit}>
          {isLogin ? renderLoginForm() : renderRegisterForm()}
          {error && <p className="mb-4 text-red-500">{error}</p>}
          {successMessage && <p className="mb-4 text-green-500">{successMessage}</p>}
          <button
            type="submit"
            className="w-full rounded bg-black p-2 text-white hover:bg-blue-600"
          >
            {isLogin ? 'Login' : 'Register'}
          </button>
        </form>
        <p className="mt-4 text-center">
          {isLogin ? "Don't have an account? " : 'Already have an account? '}
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
              setSuccessMessage('');
              setEmail('');
              setPassword('');
              setConfirmPassword('');
              setUsername('');
            }}
            className="text-blue-500 hover:underline"
          >
            {isLogin ? 'Register' : 'Login'}
          </button>
        </p>
        <button
          onClick={onClose}
          className="mt-4 w-full rounded bg-gray-300 p-2 text-gray-800 hover:bg-gray-400"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default AuthModal;
