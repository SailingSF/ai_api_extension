import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import NSFWModal from './NSFWModal';
import APIKeySetup from './APIKeySetup';
import InPageNavbar from './InPageNavbar';
import axios from 'axios';
import { HfInference } from '@huggingface/inference';
import Tooltip from './Tooltip';
import { useModelCatalog } from '../useModelCatalog';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL as string | undefined;

const blobToDataUrl = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

const FreeImageGenerator: React.FC = () => {
  const [prompt, setPrompt] = useState<string>('');
  const [negativePrompt, setNegativePrompt] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showNSFWWarning, setShowNSFWWarning] = useState<boolean>(false);
  const [hfApiKey, setHfApiKey] = useState<string | null>(null);
  const [showAPIKeySetup, setShowAPIKeySetup] = useState<boolean>(false);
  const [improvePrompt, setImprovePrompt] = useState<boolean>(false);
  const [improvedPrompt, setImprovedPrompt] = useState<string | null>(null);
  const [isLoadingRandomPrompt, setIsLoadingRandomPrompt] = useState<boolean>(false);

  const { catalog, isLoading: isLoadingModels, error: modelsError } = useModelCatalog();
  // Memoised so the empty-array fallback doesn't produce a new reference each
  // render, which would re-run the default-selection effect forever.
  const models = useMemo(() => catalog?.free ?? [], [catalog]);

  useEffect(() => {
    const storedApiKey = localStorage.getItem('hfApiKey');
    if (storedApiKey) {
      setHfApiKey(storedApiKey);
    }
  }, []);

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
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    const currentModel = models.find((model) => model.key === selectedModel);
    if (currentModel?.nsfw) {
      setShowNSFWWarning(true);
    } else {
      await generateImage();
    }
  };

  const generateImage = async (): Promise<void> => {
    setIsLoading(true);
    setShowNSFWWarning(false);

    try {
      if (hfApiKey) {
        // Calling Hugging Face directly with the user's own key needs the repo id;
        // the backend accepts either, so it gets the catalog key below.
        const repo = models.find((model) => model.key === selectedModel)?.repo;
        if (!repo) throw new Error('Unknown model selected');
        const hf = new HfInference(hfApiKey);
        const result = await hf.textToImage({
          inputs: prompt,
          model: repo,
          parameters: { negative_prompt: negativePrompt },
        });
        const imageUrl = await blobToDataUrl(result);
        setGeneratedImageUrl(imageUrl);
      } else {
        if (!API_BASE_URL) throw new Error('Missing REACT_APP_API_BASE_URL');
        const response = await axios.post(`${API_BASE_URL}/api/generate-image/`, {
          prompt,
          negative_prompt: negativePrompt,
          improved_prompt: improvedPrompt,
          selected_model: selectedModel,
          improve_prompt: improvePrompt,
        });
        const imageUrl: string = response.data.image_url;
        setGeneratedImageUrl(imageUrl);
        setImprovedPrompt(response.data.improved_prompt ?? null);
      }
    } catch (error: any) {
      // eslint-disable-next-line no-console
      console.error('Error generating image:', error);
      // DRF validation errors come back as a JSON array of strings, and the backend
      // puts real explanations in there (out of monthly credits, unknown model), so
      // show that rather than "Request failed with status code 400".
      const data = error.response?.data;
      const backendMessage: string | undefined = Array.isArray(data)
        ? data[0]
        : (data?.detail ?? data?.message);

      if (
        error.response &&
        error.response.status === 400 &&
        data?.message === 'The request to the external API timed out'
      ) {
        alert('The request to the image generator timed out, try again in one second.');
      } else if (error.response && error.response.status === 504) {
        alert(
          "The free image generator is taking too long to respond. This might work if you try again in a few seconds. Premium image generator doesn't have this problem."
        );
      } else if (backendMessage) {
        alert(backendMessage);
      } else {
        alert(
          `Error generating image: ${error.message}. ${hfApiKey ? 'Please check your Hugging Face API key.' : "This is probably not Max's fault. I would try again a few times before giving up. But I'm built different, so do you."}`
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleApiKeyChange = (newApiKey: string): void => {
    setHfApiKey(newApiKey);
    localStorage.setItem('hfApiKey', newApiKey);
    setShowAPIKeySetup(false);
  };

  const handleApiKeyClear = (): void => {
    setHfApiKey(null);
    localStorage.removeItem('hfApiKey');
    setShowAPIKeySetup(false);
  };

  const currentModel = models.find((model) => model.key === selectedModel);

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

  return (
    <div className="mx-auto w-full overflow-hidden rounded-xl border-4 border-black bg-white shadow-xl md:w-3/4">
      <Helmet>
        <title>Free AI Image Generator – Hugging Face Models</title>
        <meta
          name="description"
          content="Generate AI images for free using Hugging Face models. Optional negative prompts and random prompt generator."
        />
        <link rel="canonical" href="https://yourdomain.com/generate" />
      </Helmet>
      <InPageNavbar pageColor="bg-blue-500" />
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 text-white md:p-6">
        <h2 className="text-center text-2xl font-bold md:text-4xl">AI Image Generator</h2>
        <p className="mt-2 text-center text-sm text-gray-200 sm:text-base">
          {hfApiKey
            ? 'Using your Hugging Face API key'
            : 'All of the models. None of the subscriptions.'}
        </p>
      </div>
      <div className="bg-stone-50 p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
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
                  {model.label} {model.speed === 'fast' ? '⚡' : '🐢'}
                </option>
              ))}
            </select>
            {modelsError && <p className="mt-1 text-sm text-red-600">{modelsError}</p>}
            {currentModel && (
              <p className="mt-2 text-sm text-gray-600">{currentModel.description}</p>
            )}
          </div>
          <div>
            <label htmlFor="prompt" className="mb-1 block text-sm font-bold text-gray-700">
              Image Prompt
            </label>
            <div className="relative">
              <textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the image"
                required
                className="w-full rounded-md border-2 border-black p-2 text-sm"
                rows={3}
              />
            </div>
            <div className="mt-4 flex flex-col items-center space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
              <button
                type="button"
                onClick={generateRandomPrompt}
                disabled={isLoadingRandomPrompt}
                className="flex w-full items-center justify-center space-x-2 rounded-md bg-blue-100 px-4 py-2 text-sm font-medium text-blue-700 transition duration-300 hover:bg-blue-200 sm:w-auto"
              >
                <span role="img" aria-label="dice" className="text-xl">
                  🎲
                </span>
                <span>{isLoadingRandomPrompt ? 'Loading...' : 'Random Prompt'}</span>
              </button>
              <div className="flex items-center space-x-2">
                <Tooltip text="Enhance your prompt with AI, this will take your original prompt and make it better.">
                  <label
                    htmlFor="improvePrompt"
                    className="flex cursor-pointer items-center space-x-1 text-sm font-medium text-gray-700"
                  >
                    <span role="img" aria-label="magic wand" className="text-xl">
                      🪄
                    </span>
                    <span>Pimp My Prompt</span>
                  </label>
                </Tooltip>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    className="peer sr-only"
                    checked={improvePrompt}
                    onChange={() => setImprovePrompt(!improvePrompt)}
                  />
                  <div className="peer h-6 w-11 rounded-full bg-gray-300 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-purple-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:border-gray-700 dark:bg-gray-700 dark:peer-focus:ring-blue-800" />
                </label>
              </div>
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
          <div className="flex space-x-4">
            <button
              type="submit"
              disabled={isLoading || !selectedModel}
              className="flex-1 rounded-md bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-3 text-sm font-bold text-white shadow-md transition duration-300 hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 md:text-base"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="-ml-1 mr-3 h-5 w-5 animate-spin text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Generating...
                </span>
              ) : (
                'Generate Image'
              )}
            </button>
            <button
              type="button"
              onClick={clearAllPrompts}
              className="flex-1 rounded-md bg-gray-200 px-6 py-3 text-sm font-bold text-black transition duration-300 hover:bg-gray-300 md:text-base"
            >
              New Image
            </button>
          </div>
          <button
            type="button"
            onClick={() => setShowAPIKeySetup(true)}
            className="w-full rounded-md bg-gray-200 px-4 py-2 text-sm font-bold text-black transition duration-300 hover:bg-gray-300 md:text-base"
          >
            {hfApiKey ? 'Change API Key' : 'Set Up API Key'}
          </button>
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
            <div className="mt-6 text-center">
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
      <APIKeySetup
        isOpen={showAPIKeySetup}
        setIsOpen={setShowAPIKeySetup}
        onSave={handleApiKeyChange}
        onClear={handleApiKeyClear}
        initialApiKey={hfApiKey ?? undefined}
      />
    </div>
  );
};

export default FreeImageGenerator;
