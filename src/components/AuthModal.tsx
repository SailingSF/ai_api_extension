import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MailCheck } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { SIGNUP_BONUS_CREDITS } from '../constants';
import type { AuthModalProps } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL as string | undefined;

// Long enough to register the green confirmation, short enough that the modal isn't
// standing between the user and the thing they came to do. Registration doesn't use
// this -- it has something to say, so it holds until dismissed.
const LOGIN_CLOSE_DELAY_MS = 400;

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, message }) => {
  const { login } = useAuth();
  const [isLogin, setIsLogin] = useState<boolean>(true);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [registeredMessage, setRegisteredMessage] = useState<string | null>(null);

  useEffect(() => {
    setError('');
    setSuccessMessage('');
  }, [isLogin]);

  // Start clean each time it opens, so a stale success panel from last time doesn't
  // greet someone who reopened it to log into a different account.
  useEffect(() => {
    if (!isOpen) {
      setRegisteredMessage(null);
      setSuccessMessage('');
      setError('');
      setIsSubmitting(false);
    }
  }, [isOpen]);

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

    setIsSubmitting(true);
    try {
      const endpoint = isLogin ? '/api/login/' : '/api/register/';
      const data = isLogin ? { email, password } : { email, password, userdisplay_name: username };
      const response = await axios.post(`${API_BASE_URL}${endpoint}`, data);

      if (response.data.token) {
        // Hand the token to the provider rather than writing localStorage directly:
        // that's what makes the navbar balance and the generators update right away.
        await login(response.data.token);

        if (isLogin) {
          setSuccessMessage('Login successful!');
          setTimeout(onClose, LOGIN_CLOSE_DELAY_MS);
        } else {
          // Registration has an instruction attached -- verify your email to collect
          // the bonus -- so it stays up until the user dismisses it.
          setRegisteredMessage(response.data.message ?? null);
        }
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
    } finally {
      setIsSubmitting(false);
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
        After registration, check your email to verify your account and receive{' '}
        {SIGNUP_BONUS_CREDITS} free credits!
      </p>
    </>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="w-96 max-w-full rounded-lg bg-white p-6 shadow-xl">
        {registeredMessage !== null ? (
          <div className="text-center">
            <MailCheck className="mx-auto text-emerald-500" size={40} />
            <h2 className="mt-3 text-2xl font-bold">Check your email</h2>
            <p className="mt-2 text-sm text-gray-600">
              {registeredMessage ||
                'Your account has been created and you are signed in on this device.'}
            </p>
            <p className="mt-3 rounded-md bg-emerald-50 p-3 text-sm font-medium text-emerald-800">
              Verify your email to collect {SIGNUP_BONUS_CREDITS} free credits.
            </p>
            <button
              onClick={onClose}
              className="mt-4 w-full rounded bg-black p-2 font-bold text-white hover:bg-gray-800"
            >
              Got it
            </button>
          </div>
        ) : (
          <>
            <h2 className="mb-2 text-2xl font-bold">{isLogin ? 'Login' : 'Register'}</h2>
            {message && <p className="mb-4 text-blue-500">{message}</p>}
            {!isLogin && (
              <p className="mb-4 rounded-md bg-amber-50 p-2 text-sm font-medium text-amber-900">
                New accounts get {SIGNUP_BONUS_CREDITS} free credits.
              </p>
            )}
            <form onSubmit={handleSubmit}>
              {isLogin ? renderLoginForm() : renderRegisterForm()}
              {error && <p className="mb-4 text-red-500">{error}</p>}
              {successMessage && <p className="mb-4 text-green-500">{successMessage}</p>}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded bg-black p-2 text-white hover:bg-blue-600 disabled:opacity-60"
              >
                {isSubmitting ? 'Please wait…' : isLogin ? 'Login' : 'Register'}
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
          </>
        )}
      </div>
    </div>
  );
};

export default AuthModal;
