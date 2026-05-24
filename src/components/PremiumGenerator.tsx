import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router-dom';
import InPageNavbar from './InPageNavbar';
import NSFWModal from './NSFWModal';
import axios from 'axios';
import type { TextToImageModel } from '../types';

const models: (TextToImageModel & { description: string })[] = [
  {
    id: 'flux/schnell',
    name: 'FLUX.1 [schnell]',
    supportsNegativePrompt: false,
    description:
      'FLUX.1 [schnell] is optimized for speed, delivering quick results while maintaining good quality. Ideal for rapid prototyping and iterative design processes.',
  },
  {
    id: 'flux/dev',
    name: 'FLUX.1 [dev]',
    supportsNegativePrompt: false,
    description:
      "FLUX.1 [dev] is the development version of FLUX, offering cutting-edge features and improvements. It's great for experimenting with the latest AI image generation capabilities.",
  },
  {
    id: 'dall-e-3',
    name: 'DALL-E 3',
    supportsNegativePrompt: false,
    description:
      "DALL-E 3 excels at creating highly detailed images from text descriptions. It's particularly good at understanding complex prompts and generating creative, diverse outputs. OpenAI takes all prompts and transforms them to make more detailed images, but also will remove things for safety and copyright reasons, users have no control over this but the prompt they used will be returned so you can see what generated that image. Sometimes it can feel 'woke' but the main purpose is to make better, more interesting images.",
  },
  {
    id: 'gpt-image-1',
    name: 'OpenAI GPT Image Model',
    supportsNegativePrompt: false,
    description:
      'The best image generation model from OpenAI. It makes the best images, use the prompt improver!',
  },
  {
    id: 'stable-diffusion-v35-medium',
    name: 'Stable Diffusion V3.5',
    supportsNegativePrompt: true,
    description:
      "Stable Diffusion V3.5 is the most recent and powerful model of the open Stable Diffusion line. It's versatile but performs best at making very 'AI Art' looking images, with the added benefit of supporting negative prompts for fine-tuned control.",
  },
  {
    id: 'playground-v25',
    name: 'Playground v2.5',
    supportsNegativePrompt: true,
    description:
      "Playground v2.5 is known for its flexibility and wide range of artistic styles. It's great for exploring different visual aesthetics and supports negative prompts for precise adjustments.",
  },
  {
    id: 'recraft-v3',
    name: 'Recraft v3',
    supportsNegativePrompt: false,
    description:
      'Recraft v3 is a powerful model that excels at creating detailed and realistic images. It is suitable for a wide range of image generation tasks and excels at text rendering.',
  },
  {
    id: 'flux-pro',
    name: 'FLUX.1.1 [pro]',
    supportsNegativePrompt: false,
    description:
      "FLUX.1.1 [pro] is the premium version of FLUX, offering enhanced image quality and more advanced features. It's ideal for professional-grade image generation tasks.",
  },
];

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL as string | undefined;

interface PremiumGeneratorProps {
  openAuthModal: (message?: string) => void;
}

const PremiumGenerator: React.FC<PremiumGeneratorProps> = ({ openAuthModal }) => {
  const [prompt, setPrompt] = useState<string>('');
  const [negativePrompt, setNegativePrompt] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>(models[0].id);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [improvedPrompt, setImprovedPrompt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showNSFWWarning, setShowNSFWWarning] = useState<boolean>(false);
  const navigate = useNavigate();
  const [isLoadingRandomPrompt, setIsLoadingRandomPrompt] = useState<boolean>(false);

  const clearAllPrompts = (): void => {
    setPrompt('');
    setNegativePrompt('');
    setImprovedPrompt(null);
    setGeneratedImageUrl(null);
  };

  const isLoggedIn = !!localStorage.getItem('token');

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
    const currentModel = models.find((model) => model.id === selectedModel);
    if ((currentModel as any)?.nsfw) {
      setShowNSFWWarning(true);
    } else {
      await generateImage();
    }
  };

  const generateImage = async (): Promise<void> => {
    setIsLoading(true);
    setShowNSFWWarning(false);
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
      setImprovedPrompt(response.data.improved_prompt ?? null);
    } catch (error: any) {
      if (error.response && error.response.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      } else if (error.response && error.response.status === 403) {
        openAuthModal(
          "You don't have enough credits or are not at the right membership tier for this request."
        );
      } else {
        // eslint-disable-next-line no-console
        console.error('Error generating image:', error);
        openAuthModal(
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

  const currentModel = models.find((model) => model.id === selectedModel);

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
              className="w-full rounded-md border-2 border-black p-2 text-sm"
            >
              {models.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name}
                </option>
              ))}
            </select>
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
          {currentModel?.supportsNegativePrompt && (
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
              type="button"
              onClick={handleGenerateClick}
              className={`flex-1 rounded-md px-4 py-2 text-sm font-bold transition duration-300 md:text-base ${isLoggedIn ? 'bg-black text-white hover:bg-gray-800' : 'bg-gray-300 text-gray-600 hover:bg-gray-400'}`}
            >
              {isLoading ? 'Generating...' : 'Generate Image'}
            </button>
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
    </div>
  );
};

export default PremiumGenerator;
