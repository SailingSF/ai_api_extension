import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router-dom';
import InPageNavbar from './InPageNavbar';
import axios from 'axios';
import ImageModal from './ImageModal';
import type { ImageItem } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL as string | undefined;

interface ArenaGeneratorProps {
  openAuthModal: (message?: string) => void;
}

const ArenaGenerator: React.FC<ArenaGeneratorProps> = ({ openAuthModal }) => {
  const [prompt, setPrompt] = useState<string>('');
  const [generatedImages, setGeneratedImages] = useState<ImageItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedImage, setSelectedImage] = useState<ImageItem | null>(null);
  const [selectedWinner, setSelectedWinner] = useState<number | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e?: React.FormEvent<HTMLFormElement>): Promise<void> => {
    if (e) e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) {
      openAuthModal('Please log in to generate images in the Arena.');
      return;
    }

    if (!API_BASE_URL) {
      openAuthModal('API is not configured.');
      return;
    }

    setIsLoading(true);
    try {
      const config = { headers: { Authorization: `Token ${token}` } };
      const response = await axios.post(`${API_BASE_URL}/api/arena-generate/`, { prompt }, config);
      const reshapedResults: ImageItem[] = response.data.results.map((result: any) => ({
        url: result.image_url,
        generation_log: { prompt: result.prompt, model: result.model },
        image_id: result.id,
        created_at: new Date().toISOString(),
      }));
      setGeneratedImages(reshapedResults);
    } catch (error: any) {
      if (error.response && error.response.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      } else if (error.response && error.response.status === 403) {
        openAuthModal(
          "You don't have enough credits or are not at the right tier for this request."
        );
      } else {
        // eslint-disable-next-line no-console
        console.error('Error generating images:', error);
        openAuthModal(`Error generating images: ${error.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const isLoggedIn = !!localStorage.getItem('token');

  const handleGenerateClick = (): void => {
    if (!isLoggedIn) {
      openAuthModal('Please log in to generate images in the Arena.');
    } else {
      void handleSubmit();
    }
  };

  const handleSelectWinner = async (image: ImageItem, index: number): Promise<void> => {
    const token = localStorage.getItem('token');
    if (!token) {
      openAuthModal('Please log in to vote for images.');
      return;
    }
    if (!API_BASE_URL) {
      openAuthModal('API is not configured.');
      return;
    }
    try {
      const config = { headers: { Authorization: `Token ${token}` } };
      await axios.post(`${API_BASE_URL}/api/images/upvote/`, { image_id: image.image_id }, config);
      setSelectedWinner(index);
    } catch (error: any) {
      if (error.response && error.response.status === 401) {
        openAuthModal('Please log in to vote for images.');
      } else {
        // eslint-disable-next-line no-console
        console.error('Error upvoting image:', error);
      }
    }
  };

  return (
    <div className="mx-auto w-full overflow-hidden rounded-xl border-4 border-black bg-white shadow-xl md:w-3/4">
      <Helmet>
        <title>The Arena – Compare AI Image Models</title>
        <meta
          name="description"
          content="Generate multiple images from different AI models with one prompt and vote for the winner."
        />
        <link rel="canonical" href="https://yourdomain.com/arena" />
      </Helmet>
      <InPageNavbar pageColor="bg-amber-400" />
      <div className="bg-gradient-to-r from-amber-400 to-yellow-600 p-4 text-white md:p-6">
        <h2 className="text-center text-2xl font-bold md:text-4xl">AI Image Arena</h2>
        <p className="mt-2 text-center text-sm text-gray-200 sm:text-base">
          Compare AI models with one prompt
        </p>
      </div>
      <div className="bg-stone-50 p-6">
        <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
          <div>
            <label htmlFor="prompt" className="mb-1 block text-sm font-bold text-gray-700">
              Image Description
            </label>
            <textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the image you want to generate"
              required
              className="w-full rounded-md border-2 border-black p-2 text-sm"
              rows={3}
            />
          </div>
          <button
            type="button"
            onClick={handleGenerateClick}
            className={`w-full rounded-md px-4 py-2 text-sm font-bold transition duration-300 md:text-base ${isLoggedIn ? 'bg-black text-white hover:bg-gray-800' : 'bg-gray-300 text-gray-600 hover:bg-gray-400'}`}
          >
            {isLoading
              ? 'Generating...'
              : isLoggedIn
                ? 'Generate Images'
                : 'Login to Generate Images'}
          </button>
        </form>
      </div>
      <div className="bg-stone-100 p-6">
        {generatedImages.length > 0 ? (
          <>
            {selectedWinner === null && (
              <div className="mb-6 text-center">
                <p className="text-lg font-bold text-gray-800">Which image turned out the best?</p>
                <p className="text-sm text-gray-600">
                  Select your favorite to crown it the winner!
                </p>
              </div>
            )}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {generatedImages.map((image, index) => (
                <div
                  key={String(image.image_id ?? index)}
                  className={`rounded-lg bg-white p-4 shadow-md transition-all duration-300 ${selectedWinner === index ? 'scale-102 transform ring-4 ring-amber-400' : ''}`}
                >
                  <div className="mb-4 aspect-square">
                    <img
                      src={image.url}
                      alt={`Generated by ${image.generation_log.model}`}
                      loading="lazy"
                      width={512}
                      height={512}
                      className="h-full w-full cursor-pointer object-contain"
                      onClick={() => setSelectedImage(image)}
                    />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold">{image.generation_log.model}</h3>
                  <p className="mb-4 line-clamp-3 text-sm text-gray-600">
                    {image.generation_log.prompt}
                  </p>

                  {selectedWinner === null ? (
                    <button
                      onClick={() => void handleSelectWinner(image, index)}
                      className="w-full rounded-md bg-black px-4 py-2 text-white transition duration-300 hover:bg-gray-800"
                    >
                      Select as Best Image
                    </button>
                  ) : selectedWinner === index ? (
                    <div className="mt-2 text-center font-bold text-amber-600">🏆 Winner!</div>
                  ) : null}
                </div>
              ))}
            </div>
            <div className="mt-8 text-center">
              <Link
                to="/gallery"
                className="inline-block rounded-md bg-green-500 px-6 py-3 font-bold text-white transition duration-300 hover:bg-green-600"
              >
                Check Out and Vote on Other Generations
              </Link>
            </div>
          </>
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
            <p className="text-sm font-bold">Your generated images will appear here</p>
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
      {selectedImage && <ImageModal image={selectedImage} onClose={() => setSelectedImage(null)} />}
    </div>
  );
};

export default ArenaGenerator;
