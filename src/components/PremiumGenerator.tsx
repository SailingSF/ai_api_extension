import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import InPageNavbar from './InPageNavbar';
import NSFWModal from './NSFWModal';
import CreditNotice from './CreditNotice';
import EditImageButton from './EditImageButton';
import axios from 'axios';
import { useModelCatalog } from '../useModelCatalog';
import { useAuth } from '../AuthContext';
import { SIGNUP_BONUS_CREDITS } from '../constants';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL as string | undefined;

const PremiumGenerator: React.FC = () => {
  const { account, isLoggedIn, openAuthModal, logout, refresh } = useAuth();
  const [prompt, setPrompt] = useState<string>('');
  const [negativePrompt, setNegativePrompt] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  // Kept so the result can be sent to the editor by reference rather than by url.
  const [generatedImageId, setGeneratedImageId] = useState<number | null>(null);
  const [improvedPrompt, setImprovedPrompt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showNSFWWarning, setShowNSFWWarning] = useState<boolean>(false);
  const [isLoadingRandomPrompt, setIsLoadingRandomPrompt] = useState<boolean>(false);
  const [notice, setNotice] = useState<string | null>(null);

  const { catalog, isLoading: isLoadingModels, error: modelsError } = useModelCatalog();
  // Memoised so the empty-array fallback doesn't produce a new reference each
  // render, which would re-run the default-selection effect forever.
  const models = useMemo(() => catalog?.premium ?? [], [catalog]);

  // Default to the first model the backend offers, once the catalog arrives.
  useEffect(() => {
    if (!selectedModel && models.length > 0) {
      setSelectedModel(models[0].key);
    }
  }, [models, selectedModel]);

  const clearAllPrompts = (): void => {
    setPrompt('');
    setNegativePrompt('');
    setImprovedPrompt(null);
    setGeneratedImageUrl(null);
    setGeneratedImageId(null);
    setNotice(null);
  };

  const handleGenerateClick = (): void => {
    if (!isLoggedIn) {
      openAuthModal('Please log in to use the Premium Image Generator.');
    } else {
      void handleSubmit();
    }
  };

  const handleSubmit = async (e?: React.FormEvent<HTMLFormElement>): Promise<void> => {
    if (e) e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) {
      openAuthModal();
      return;
    }
    const currentModel = models.find((model) => model.key === selectedModel);
    if (currentModel?.tags.includes('nsfw')) {
      setShowNSFWWarning(true);
    } else {
      await generateImage();
    }
  };

  const generateImage = async (): Promise<void> => {
    setIsLoading(true);
    setShowNSFWWarning(false);
    setNotice(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        openAuthModal();
        return;
      }
      if (!API_BASE_URL) throw new Error('Missing REACT_APP_API_BASE_URL');

      const config = { headers: { Authorization: `Token ${token}` } };
      const response = await axios.post(
        `${API_BASE_URL}/api/generate-image-premium/`,
        {
          prompt,
          improved_prompt: improvedPrompt || '',
          negative_prompt: negativePrompt,
          selected_model: selectedModel,
        },
        config
      );
      setGeneratedImageUrl(response.data.image_url);
      setGeneratedImageId(response.data.image_id ?? null);
      setImprovedPrompt(response.data.improved_prompt ?? null);
      // The generation just spent credits; pull the new balance so the navbar pill
      // ticks down instead of showing what the user had a moment ago.
      void refresh();
    } catch (error: any) {
      if (error.response && error.response.status === 401) {
        // Go through the provider, not localStorage: clearing the key by hand leaves
        // the navbar showing a balance for a session the server has already rejected.
        // There is no /login route either -- the old redirect fell through to "*" and
        // dumped the user on the home page with no explanation.
        logout();
        openAuthModal('Your session expired. Please log in again.');
      } else if (error.response && error.response.status === 403) {
        // Out of credits, or the wrong tier. Say so where the button is and offer
        // the fix -- sending this to the login modal asked a signed-in user to sign
        // in again. Refresh so the balance on screen matches the refusal.
        void refresh();
        setNotice(
          "You don't have enough credits or aren't on the right membership tier for this request."
        );
      } else {
        // eslint-disable-next-line no-console
        console.error('Error generating image:', error);
        // DRF validation errors arrive as a JSON array of strings; prefer the
        // backend's explanation over "Request failed with status code 400".
        const data = error.response?.data;
        const backendMessage: string | undefined = Array.isArray(data)
          ? data[0]
          : (data?.detail ?? data?.message);
        setNotice(
          backendMessage ??
            `Error generating image: ${error.message}. This is probably not Max's fault. I would try again a few times before giving up. But I'm built different, so do you.`
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const generateRandomPrompt = async (): Promise<void> => {
    setIsLoadingRandomPrompt(true);
    try {
      if (!API_BASE_URL) throw new Error('Missing REACT_APP_API_BASE_URL');
      const response = await axios.get(`${API_BASE_URL}/api/random-prompt/`);
      setPrompt(response.data.prompt);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error generating random prompt:', error);
      alert('Failed to generate a random prompt. Please try again.');
    } finally {
      setIsLoadingRandomPrompt(false);
    }
  };

  const currentModel = models.find((model) => model.key === selectedModel);
  const cost = currentModel?.cost ?? 0;
  const balance = account?.credits ?? 0;
  // Only claim someone can't afford it once the account has actually loaded --
  // otherwise a slow /api/me/ would block the button on a balance we don't know yet.
  const cannotAfford = isLoggedIn && account != null && cost > 0 && balance < cost;

  const generateLabel = (): string => {
    if (isLoading) return 'Generating...';
    if (!isLoggedIn) return `Log in to generate — ${SIGNUP_BONUS_CREDITS} free credits`;
    if (cannotAfford) return 'Not enough credits';
    return cost > 0
      ? `Generate Image · ${cost} ${cost === 1 ? 'credit' : 'credits'}`
      : 'Generate Image';
  };

  return (
    <div className="mx-auto w-full overflow-hidden rounded-xl border-4 border-black bg-white shadow-xl md:w-3/4">
      <Helmet>
        <title>Premium AI Image Generator – Faster Models, Prompt Assist</title>
        <meta
          name="description"
          content="Access premium AI image models with faster generation and automatic prompt optimization."
        />
        <link rel="canonical" href="https://yourdomain.com/premium" />
      </Helmet>
      <InPageNavbar pageColor="bg-purple-500" />
      <div className="bg-gradient-to-r from-purple-500 to-purple-700 p-4 text-white md:p-6">
        <h2 className="text-center text-2xl font-bold md:text-4xl">
          <em>PREMIUM</em> AI Image Generator
        </h2>
        <p className="mt-2 text-center text-sm text-gray-200 sm:text-base">
          Premium models, done quickly. With automatic prompt optimization.
        </p>
      </div>
      <div className="bg-stone-50 p-6">
        <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
          <div>
            <label htmlFor="model" className="mb-1 block text-sm font-bold text-gray-700">
              Select Model
            </label>
            <select
              id="model"
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              disabled={isLoadingModels || models.length === 0}
              className="w-full rounded-md border-2 border-black p-2 text-sm disabled:bg-gray-100"
            >
              {isLoadingModels && <option>Loading models…</option>}
              {models.map((model) => (
                <option key={model.key} value={model.key}>
                  {model.label} — {model.cost} {model.cost === 1 ? 'credit' : 'credits'}{' '}
                  {model.speed === 'fast' ? '⚡' : '🐢'}
                </option>
              ))}
            </select>
            {modelsError && <p className="mt-1 text-sm text-red-600">{modelsError}</p>}
          </div>
          {currentModel && (
            <div className="mt-2 rounded-md bg-purple-100 p-3">
              <p className="text-sm text-gray-700">{currentModel.description}</p>
            </div>
          )}
          <div>
            <label htmlFor="prompt" className="mb-1 block text-sm font-bold text-gray-700">
              Image Description
            </label>
            <textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the image"
              required
              className="w-full rounded-md border-2 border-black p-2 text-sm"
              rows={3}
            />
            <div className="mt-4">
              <button
                type="button"
                onClick={generateRandomPrompt}
                disabled={isLoadingRandomPrompt}
                className="flex w-full items-center justify-center space-x-2 rounded-md bg-purple-100 px-4 py-2 text-sm font-medium text-purple-700 transition duration-300 hover:bg-purple-200 sm:w-auto"
              >
                <span role="img" aria-label="dice" className="text-xl">
                  🎲
                </span>
                <span>{isLoadingRandomPrompt ? 'Loading...' : 'Random Prompt'}</span>
              </button>
            </div>
          </div>
          {currentModel?.supports_negative_prompt && (
            <div>
              <label
                htmlFor="negativePrompt"
                className="mb-1 block text-sm font-bold text-gray-700"
              >
                Negative Prompt (Optional)
              </label>
              <input
                id="negativePrompt"
                type="text"
                value={negativePrompt}
                onChange={(e) => setNegativePrompt(e.target.value)}
                placeholder="What to exclude from the image"
                className="w-full rounded-md border-2 border-black p-2 text-sm"
              />
            </div>
          )}
          {improvedPrompt && (
            <div>
              <label
                htmlFor="improvedPrompt"
                className="mb-1 block text-sm font-bold text-gray-700"
              >
                Improved Prompt (Optional and Final)
              </label>
              <textarea
                id="improvedPrompt"
                value={improvedPrompt}
                onChange={(e) => setImprovedPrompt(e.target.value)}
                placeholder="AI improved prompt for this specific image model, this won't be altered"
                className="w-full rounded-md border-2 border-black p-2 text-sm"
                rows={4}
              />
            </div>
          )}
          {notice && (
            <CreditNotice tone="error" showBuyLink={cannotAfford || balance <= 0}>
              {notice}
            </CreditNotice>
          )}
          {cannotAfford && !notice && (
            <CreditNotice tone="credits" showBuyLink>
              {currentModel?.label} costs {cost} {cost === 1 ? 'credit' : 'credits'} and you have{' '}
              {balance}.
            </CreditNotice>
          )}
          <div className="flex space-x-4">
            {cannotAfford ? (
              <Link
                to="/billing"
                className="flex-1 rounded-md bg-emerald-500 px-4 py-2 text-center text-sm font-bold text-white transition duration-300 hover:bg-emerald-600 md:text-base"
              >
                Top up to generate
              </Link>
            ) : (
              <button
                type="button"
                onClick={handleGenerateClick}
                disabled={isLoading || !selectedModel}
                className={`flex-1 rounded-md px-4 py-2 text-sm font-bold transition duration-300 disabled:opacity-50 md:text-base ${isLoggedIn ? 'bg-black text-white hover:bg-gray-800' : 'bg-amber-400 text-black hover:bg-amber-500'}`}
              >
                {generateLabel()}
              </button>
            )}
            <button
              type="button"
              onClick={clearAllPrompts}
              className="flex-1 rounded-md bg-gray-300 px-4 py-2 text-sm font-bold text-black transition duration-300 hover:bg-gray-400 md:text-base"
            >
              New Image
            </button>
          </div>
        </form>
      </div>
      <div className="bg-stone-100 p-6">
        {generatedImageUrl ? (
          <div className="w-full">
            <p className="mb-4 text-center text-sm font-bold text-gray-700">
              Your generated image:
            </p>
            <img
              src={generatedImageUrl}
              alt="Generated"
              loading="lazy"
              width={1024}
              height={1024}
              className="mx-auto h-auto max-w-full rounded-md border-2 border-black shadow-lg"
            />
            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
              {generatedImageId != null && (
                <EditImageButton imageId={generatedImageId} imageUrl={generatedImageUrl} />
              )}
              <Link
                to="/gallery"
                className="inline-block rounded-md bg-green-500 px-6 py-3 font-bold text-white transition duration-300 hover:bg-green-600"
              >
                Check Out and Vote on Other Generations
              </Link>
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-500">
            <svg
              className="mx-auto mb-2 h-12 w-12"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <p className="text-sm font-bold">Your generated image will appear here</p>
          </div>
        )}
      </div>
      <div className="flex justify-center border-t-2 border-black bg-stone-50 p-4">
        <Link
          to="/"
          className="rounded bg-black px-4 py-2 text-white transition duration-300 hover:bg-gray-800"
        >
          Home
        </Link>
      </div>
      <NSFWModal
        isOpen={showNSFWWarning}
        onClose={() => {
          setShowNSFWWarning(false);
          window.open('https://www.vatican.va/', '_blank');
        }}
        onConfirm={() => {
          setShowNSFWWarning(false);
          void generateImage();
        }}
        prompt={prompt}
      />
    </div>
  );
};

export default PremiumGenerator;
