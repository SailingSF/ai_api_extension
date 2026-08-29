import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import axios from 'axios';
import ImageModal from './ImageModal';
import EditImageButton from './EditImageButton';
import InPageNavbar from './InPageNavbar';
import LoadingSpinner from './LoadingSpinner';
import UpvoteButton from './UpvoteButton';
import type { GalleryResponse, ImageItem } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL as string | undefined;

const Gallery: React.FC = () => {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [selectedImage, setSelectedImage] = useState<ImageItem | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [nextPageUrl, setNextPageUrl] = useState<string | null>(null);
  const [previousPageUrl, setPreviousPageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!API_BASE_URL) return;
    fetchImages(`${API_BASE_URL}/api/gallery-images/`);
  }, []);

  const fetchImages = async (url: string): Promise<void> => {
    setIsLoading(true);
    try {
      const response = await axios.get<GalleryResponse>(url);
      setImages(response.data.results);
      setNextPageUrl(response.data.next);
      setPreviousPageUrl(response.data.previous);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error fetching images:', error);
      setImages([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNextPage = (): void => {
    if (nextPageUrl) {
      fetchImages(nextPageUrl);
      setCurrentPage((p) => p + 1);
    }
  };

  const handlePreviousPage = (): void => {
    if (previousPageUrl) {
      fetchImages(previousPageUrl);
      setCurrentPage((p) => p - 1);
    }
  };

  return (
    <div className="mx-auto w-full overflow-hidden rounded-xl border-4 border-black bg-white shadow-xl">
      <Helmet>
        <title>AI Art Gallery – Browse and Upvote Images</title>
        <meta
          name="description"
          content="Explore community-generated AI art, view prompts and models, and upvote your favorites."
        />
        <link rel="canonical" href="https://yourdomain.com/gallery" />
      </Helmet>
      <InPageNavbar pageColor="bg-green-500" />
      <div className="p-6">
        <div className="mb-4 mt-4 flex flex-col items-center justify-between sm:flex-row">
          <h1 className="mb-2 text-3xl font-bold sm:mb-0">Image Gallery</h1>
          <Link
            to="/"
            className="rounded bg-black px-4 py-2 text-white transition duration-300 hover:bg-gray-800"
          >
            Home
          </Link>
        </div>

        {isLoading ? (
          <LoadingSpinner />
        ) : images.length > 0 ? (
          <>
            <div className="grid grid-cols-3 gap-4 md:grid-cols-5">
              {images.map((image) => (
                <div key={image.id ?? image.image_id} className="group relative aspect-square">
                  <img
                    src={image.thumbnail_url || image.url}
                    alt={image.generation_log.prompt}
                    loading="lazy"
                    width={512}
                    height={512}
                    className="h-full w-full cursor-pointer object-cover transition duration-300 group-hover:opacity-75"
                    onClick={() => setSelectedImage(image)}
                  />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 transition duration-300 group-hover:opacity-100">
                    <button
                      className="mr-2 rounded bg-black bg-opacity-50 px-3 py-1 text-sm text-white"
                      onClick={() => setSelectedImage(image)}
                    >
                      View
                    </button>
                    {image.id != null && <UpvoteButton imageId={image.id} />}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 flex items-center justify-between">
              <button
                onClick={handlePreviousPage}
                disabled={!previousPageUrl}
                className={`rounded px-4 py-2 ${previousPageUrl ? 'bg-black text-white hover:bg-gray-800' : 'cursor-not-allowed bg-gray-300 text-gray-500'} transition duration-300`}
              >
                Previous
              </button>
              <span className="text-lg font-semibold">Page {currentPage}</span>
              <button
                onClick={handleNextPage}
                disabled={!nextPageUrl}
                className={`rounded px-4 py-2 ${nextPageUrl ? 'bg-black text-white hover:bg-gray-800' : 'cursor-not-allowed bg-gray-300 text-gray-500'} transition duration-300`}
              >
                Next
              </button>
            </div>
          </>
        ) : (
          <p className="text-center text-gray-500">No images found.</p>
        )}

        {selectedImage && (
          <ImageModal
            image={selectedImage}
            onClose={() => setSelectedImage(null)}
            customButton={
              // Every gallery row is serialized with an id; the type allows it to be
              // absent, so don't offer an edit we couldn't submit.
              selectedImage.id != null ? (
                <EditImageButton imageId={selectedImage.id} imageUrl={selectedImage.url} />
              ) : undefined
            }
          />
        )}
      </div>
    </div>
  );
};

export default Gallery;
