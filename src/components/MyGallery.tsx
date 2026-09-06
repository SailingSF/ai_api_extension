import React, { useCallback, useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Lock } from 'lucide-react';
import ImageModal from './ImageModal';
import EditImageButton from './EditImageButton';
import InPageNavbar from './InPageNavbar';
import LoadingSpinner from './LoadingSpinner';
import VisibilityToggle from './VisibilityToggle';
import { useAuth } from '../AuthContext';
import type { GalleryResponse, ImageItem } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL as string | undefined;

/**
 * Everything the signed-in premium user has generated, newest first.
 *
 * Not the public gallery's queryset: no dedup by (prompt, model), so near-identical
 * neighbours are correct rather than a bug, and no vote UI. Private images are
 * badged; public ones can be pulled back out of the gallery from here.
 */
const MyGallery: React.FC = () => {
  const { account, isLoggedIn, isLoadingAccount, openAuthModal } = useAuth();
  const isPremium = !!account?.is_premium;

  const [images, setImages] = useState<ImageItem[]>([]);
  const [selectedImage, setSelectedImage] = useState<ImageItem | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [hasNext, setHasNext] = useState<boolean>(false);

  useEffect(() => {
    if (!isPremium || !API_BASE_URL) {
      setIsLoading(false);
      return;
    }
    let cancelled = false;
    setIsLoading(true);
    axios
      .get<GalleryResponse>(`${API_BASE_URL}/api/my-images/?page=${page}&page_size=30`, {
        headers: { Authorization: `Token ${localStorage.getItem('token')}` },
      })
      .then((response) => {
        if (cancelled) return;
        setImages(response.data.results);
        setHasNext(!!response.data.next);
        setError(null);
      })
      .catch(() => {
        if (!cancelled) setError('Could not load your gallery.');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isPremium, page]);

  // The card and the open modal are two views of the same row; keep them in step so
  // a toggle used in one is not contradicted by the other.
  const setVisibility = useCallback((id: number | string, isPublic: boolean): void => {
    setImages((current) =>
      current.map((image) =>
        (image.id ?? image.image_id) === id ? { ...image, gallery_eligible: isPublic } : image
      )
    );
    setSelectedImage((current) =>
      current && (current.id ?? current.image_id) === id
        ? { ...current, gallery_eligible: isPublic }
        : current
    );
  }, []);

  const body = (): JSX.Element => {
    if (isLoadingAccount) return <LoadingSpinner />;

    if (!isLoggedIn) {
      return (
        <div className="py-10 text-center">
          <p className="mb-4 text-gray-600">Sign in to see the images you've generated.</p>
          <button
            type="button"
            onClick={() => openAuthModal('Log in to open your private gallery.')}
            className="rounded bg-black px-4 py-2 text-white transition duration-300 hover:bg-gray-800"
          >
            Log in
          </button>
        </div>
      );
    }

    if (!isPremium) {
      return (
        <div className="mx-auto max-w-md rounded-md border-2 border-black bg-amber-50 p-6 text-center">
          <Lock size={28} className="mx-auto mb-2" />
          <p className="mb-2 font-bold">Your private gallery is a premium feature.</p>
          <p className="mb-4 text-sm text-gray-700">
            Premium keeps every image you generate in one place — including the ones you keep out of
            the public gallery.
          </p>
          <Link
            to="/billing"
            className="inline-block rounded-md border-2 border-black bg-amber-300 px-4 py-2 font-bold text-black transition duration-300 hover:bg-amber-400"
          >
            See premium
          </Link>
        </div>
      );
    }

    if (isLoading) return <LoadingSpinner />;
    if (error) return <p className="text-center font-medium text-red-600">{error}</p>;
    if (images.length === 0) {
      return (
        <div className="py-10 text-center text-gray-600">
          <p className="mb-4">Nothing here yet — every image you generate lands in this gallery.</p>
          <Link
            to="/premium"
            className="rounded bg-black px-4 py-2 text-white transition duration-300 hover:bg-gray-800"
          >
            Generate one
          </Link>
        </div>
      );
    }

    return (
      <>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {images.map((image) => {
            const id = image.id ?? image.image_id;
            const isPublic = image.gallery_eligible !== false;
            return (
              <div key={String(id)}>
                <div className="group relative aspect-square">
                  <img
                    src={image.thumbnail_url || image.url}
                    alt={image.generation_log.prompt}
                    loading="lazy"
                    width={512}
                    height={512}
                    className="h-full w-full cursor-pointer object-cover transition duration-300 group-hover:opacity-75"
                    onClick={() => setSelectedImage(image)}
                  />
                  {!isPublic && (
                    <span className="pointer-events-none absolute left-1 top-1 flex items-center gap-1 rounded border-2 border-black bg-amber-300 px-1.5 py-0.5 text-[10px] font-bold uppercase text-black">
                      <Lock size={10} /> Private
                    </span>
                  )}
                  {image.is_edit && (
                    <span className="pointer-events-none absolute right-1 top-1 rounded border-2 border-black bg-teal-400 px-1.5 py-0.5 text-[10px] font-bold uppercase text-black">
                      Edit
                    </span>
                  )}
                </div>
                {id != null && (
                  <VisibilityToggle
                    imageId={id}
                    isPublic={isPublic}
                    onChange={(next) => setVisibility(id, next)}
                    className="mt-1"
                  />
                )}
              </div>
            );
          })}
        </div>
        <div className="mt-6 flex items-center justify-between">
          <button
            onClick={() => setPage((p) => p - 1)}
            disabled={page === 1}
            className={`rounded px-4 py-2 ${page > 1 ? 'bg-black text-white hover:bg-gray-800' : 'cursor-not-allowed bg-gray-300 text-gray-500'} transition duration-300`}
          >
            Previous
          </button>
          <span className="text-lg font-semibold">Page {page}</span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={!hasNext}
            className={`rounded px-4 py-2 ${hasNext ? 'bg-black text-white hover:bg-gray-800' : 'cursor-not-allowed bg-gray-300 text-gray-500'} transition duration-300`}
          >
            Next
          </button>
        </div>
      </>
    );
  };

  return (
    <div className="mx-auto w-full overflow-hidden rounded-xl border-4 border-black bg-white shadow-xl">
      <Helmet>
        <title>My Gallery – Your AI Images</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <InPageNavbar pageColor="bg-amber-400" />
      <div className="p-6">
        <div className="mb-4 mt-4 flex flex-col items-center justify-between sm:flex-row">
          <h1 className="mb-2 text-3xl font-bold sm:mb-0">My Gallery</h1>
          <Link
            to="/gallery"
            className="rounded bg-black px-4 py-2 text-white transition duration-300 hover:bg-gray-800"
          >
            Public gallery
          </Link>
        </div>
        {body()}
        {selectedImage && (
          <ImageModal
            image={selectedImage}
            onClose={() => setSelectedImage(null)}
            customButton={
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

export default MyGallery;
