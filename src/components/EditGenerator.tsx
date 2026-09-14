import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { RefreshCw, Upload, X } from 'lucide-react';
import InPageNavbar from './InPageNavbar';
import CreditNotice from './CreditNotice';
import { useModelCatalog } from '../useModelCatalog';
import { useAuth } from '../AuthContext';
import { track } from '../analytics';
import { SIGNUP_BONUS_CREDITS } from '../constants';
import { IMAGE_ACCEPT_ATTRIBUTE, validateImageFile } from '../imageFiles';
import type { EditResponse } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL as string | undefined;

/**
 * This endpoint is synchronous -- there is no job id and nothing to poll, so the
 * request is held open for however long the provider takes. Their text-to-image
 * siblings run to ~105s, so a default axios timeout of "never" is wrong and 30s is
 * far too short.
 */
const EDIT_TIMEOUT_MS = 180000;

/**
 * Deliberately three sizes and not a free-form control.
 *
 * The two fal editing models take an arbitrary width/height, but gpt-image-2 forwards
 * the string straight to OpenAI, which accepts only 1024x1024, 1536x1024 and
 * 1024x1536. An unsupported value there fails at the provider and comes back as a
 * *502*, not a 400 -- so the list here is the intersection that is safe everywhere.
 */
const SIZE_OPTIONS = [
  { value: '', label: "Model's default" },
  { value: '1024x1024', label: 'Square — 1024 × 1024' },
  { value: '1536x1024', label: 'Landscape — 1536 × 1024' },
  { value: '1024x1536', label: 'Portrait — 1024 × 1536' },
];

/** DRF errors arrive in several shapes; read `detail` first, then unwrap the rest. */
const describeError = (error: unknown): string | null => {
  const data = axios.isAxiosError(error) ? error.response?.data : undefined;
  if (typeof data === 'string') return data;
  if (Array.isArray(data)) return String(data[0]);
  if (data && typeof data === 'object') {
    const record = data as Record<string, unknown>;
    const detail = record.detail ?? record.message;
    if (detail) return String(detail);
    const first = Object.values(record)[0];
    if (Array.isArray(first)) return String(first[0]);
    if (first) return String(first);
  }
  return null;
};

const EditGenerator: React.FC = () => {
  const { account, isLoggedIn, openAuthModal, logout, refresh } = useAuth();
  const location = useLocation();

  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  /**
   * An image the server already stores, arrived at through "edit this image". It is
   * referenced by id rather than uploaded -- there are no bytes on this side at all,
   * and the url is only here to draw a thumbnail.
   */
  const [sourceImage, setSourceImage] = useState<{ id: number | string; url: string } | null>(null);
  const [prompt, setPrompt] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [size, setSize] = useState<string>('');
  const [result, setResult] = useState<EditResponse | null>(null);
  const [submittedPrompt, setSubmittedPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [noticeTone, setNoticeTone] = useState<'error' | 'credits'>('error');
  const [isRetryable, setIsRetryable] = useState<boolean>(false);
  const [revealNSFW, setRevealNSFW] = useState<boolean>(false);

  const { catalog, isLoading: isLoadingModels, error: modelsError } = useModelCatalog();
  // Memoised so the empty-array fallback doesn't produce a new reference each render,
  // which would re-run the default-selection effect forever.
  const models = useMemo(() => catalog?.edit ?? [], [catalog]);

  useEffect(() => {
    if (!selectedModel && models.length > 0) {
      setSelectedModel(models[0].key);
    }
  }, [models, selectedModel]);

  const currentModel = models.find((model) => model.key === selectedModel);
  const supportsMultiple = currentModel?.supports_multiple_images ?? false;
  const supportsSize = currentModel?.supports_size ?? false;
  const promptBudget = currentModel?.max_prompt_chars ?? 1800;

  // Object URLs are not garbage collected on their own; revoking on every change is
  // the only thing standing between a long editing session and a leak.
  useEffect(() => {
    const urls = files.map((file) => URL.createObjectURL(file));
    setPreviews(urls);
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [files]);

  // Switching from a multi-image model to a single-image one with several files
  // staged would post an `input_images[]` array the new model can't take. Trim rather
  // than let the user discover it as a 400.
  useEffect(() => {
    if (!supportsMultiple) {
      // A referenced source counts as the one input, so uploads go rather than
      // outrank it.
      setFiles((current) => {
        const limit = sourceImage ? 0 : 1;
        return current.length > limit ? current.slice(0, limit) : current;
      });
    }
  }, [supportsMultiple, sourceImage]);

  // A model that fixes its own output shape rejects `size` outright, so drop a
  // leftover choice when the selection moves to one.
  useEffect(() => {
    if (!supportsSize) setSize('');
  }, [supportsSize]);

  // Arriving from "Edit this image" elsewhere in the app. Nothing is downloaded: the
  // id is what gets submitted, and the server presigns the object it already holds.
  const handoff = location.state as {
    sourceImageId?: number | string;
    sourceImageUrl?: string;
  } | null;
  const handoffId = handoff?.sourceImageId;
  const handoffUrl = handoff?.sourceImageUrl;
  useEffect(() => {
    if (handoffId != null && handoffUrl) {
      setSourceImage({ id: handoffId, url: handoffUrl });
    }
  }, [handoffId, handoffUrl]);

  const handleFilesPicked = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const picked = Array.from(event.target.files ?? []);
    // Let the same file be picked again after being removed.
    event.target.value = '';
    if (picked.length === 0) return;

    const rejected = picked.map(validateImageFile).find((message) => message !== null);
    if (rejected) {
      setFileError(rejected);
      return;
    }

    setFileError(null);
    if (!supportsMultiple) {
      // Choosing a file on a single-image model means editing that file instead.
      setSourceImage(null);
      setFiles(picked.slice(0, 1));
      return;
    }
    setFiles((current) => [...current, ...picked]);
  };

  const removeFile = (index: number): void => {
    setFiles((current) => current.filter((_, i) => i !== index));
  };

  const startOver = (): void => {
    setFiles([]);
    setSourceImage(null);
    setPrompt('');
    setResult(null);
    setNotice(null);
    setFileError(null);
    setIsRetryable(false);
    setRevealNSFW(false);
  };

  const submitEdit = async (): Promise<void> => {
    const token = localStorage.getItem('token');
    if (!token) {
      openAuthModal();
      return;
    }
    if (!API_BASE_URL) {
      setNoticeTone('error');
      setNotice('Missing REACT_APP_API_BASE_URL');
      return;
    }

    setIsLoading(true);
    setNotice(null);
    setIsRetryable(false);
    setRevealNSFW(false);

    try {
      const form = new FormData();
      form.append('prompt', prompt);
      form.append('selected_model', selectedModel);
      // An image the server already stores travels as an id -- no download, no
      // re-upload, and it is the first reference the provider sees.
      if (sourceImage) form.append('source_image_id', String(sourceImage.id));
      if (supportsMultiple) {
        files.forEach((file) => form.append('input_images[]', file));
      } else if (files.length > 0) {
        form.append('input_image', files[0]);
      }
      if (size) form.append('size', size);

      const response = await axios.post<EditResponse>(
        `${API_BASE_URL}/api/generate-image-with-input/`,
        form,
        // No Content-Type header: axios sets the multipart boundary itself, and
        // naming the type by hand loses it.
        { headers: { Authorization: `Token ${token}` }, timeout: EDIT_TIMEOUT_MS }
      );

      setResult(response.data);
      setSubmittedPrompt(prompt);
      track('generate_image', { mode: 'edit' });
      // The edit just spent credits; pull the new balance so the navbar pill ticks
      // down instead of showing what the user had a moment ago.
      void refresh();
    } catch (error) {
      const status = axios.isAxiosError(error) ? error.response?.status : undefined;
      const backendMessage = describeError(error);

      if (status === 401) {
        logout();
        openAuthModal('Your session expired. Please log in again.');
      } else if (status === 403) {
        // Out of credits, not an auth problem. Refresh so the balance on screen
        // matches the refusal, and offer the fix next to the button that failed.
        void refresh();
        setNoticeTone('credits');
        setNotice(
          backendMessage ??
            "You don't have enough credits or aren't on the right membership tier for this edit."
        );
      } else if (status === 400) {
        // The request itself is wrong -- a retry of the same thing fails identically,
        // so this is the one case that gets no "try again".
        setNoticeTone('error');
        setNotice(backendMessage ?? 'That request was rejected. Change something and try again.');
      } else if (status === 429) {
        setNoticeTone('error');
        setNotice(backendMessage ?? "That's 30 edits in an hour. Give it a little while.");
      } else if (axios.isAxiosError(error) && error.code === 'ECONNABORTED') {
        // A client-side timeout is not the same as a provider failure: the server may
        // still be finishing, and may still charge for it. Don't promise otherwise.
        setNoticeTone('error');
        setIsRetryable(true);
        setNotice(
          'That took longer than three minutes, so we stopped waiting. The edit may still have finished on the server — check your balance before running it again.'
        );
      } else {
        // 502 and network failures. Nothing was charged: credits are deducted only
        // after the image is stored, so the same request may well work next time.
        // eslint-disable-next-line no-console
        console.error('Error editing image:', error);
        setNoticeTone('error');
        setIsRetryable(true);
        setNotice(
          backendMessage ??
            'The image provider failed on that one. Nothing was charged — it is worth trying again.'
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditClick = (): void => {
    if (!isLoggedIn) {
      openAuthModal('Please log in to edit images.');
      return;
    }
    void submitEdit();
  };

  const cost = currentModel?.cost ?? 0;
  const balance = account?.credits ?? 0;
  // Only claim someone can't afford it once the account has actually loaded -- a slow
  // /api/me/ shouldn't block the button on a balance we don't know yet.
  const cannotAfford = isLoggedIn && account != null && cost > 0 && balance < cost;
  const isReady =
    (files.length > 0 || sourceImage != null) && prompt.trim().length > 0 && !!selectedModel;
  const wasClamped = result != null && result.prompt !== submittedPrompt;

  const editLabel = (): string => {
    if (isLoading) return 'Editing…';
    if (!isLoggedIn) return `Log in to edit — ${SIGNUP_BONUS_CREDITS} free credits`;
    if (cannotAfford) return 'Not enough credits';
    return cost > 0 ? `Edit Image · ${cost} ${cost === 1 ? 'credit' : 'credits'}` : 'Edit Image';
  };

  return (
    <div className="mx-auto w-full overflow-hidden rounded-xl border-4 border-black bg-white shadow-xl md:w-3/4">
      <Helmet>
        <title>AI Image Editor – Edit Your Photos With a Prompt</title>
        <meta
          name="description"
          content="Upload a picture and edit it with a plain instruction. Remove objects, change the season, restyle a portrait — with FLUX Kontext, Qwen, Nano Banana and GPT Image."
        />
      </Helmet>
      <InPageNavbar pageColor="bg-teal-500" />
      <div className="bg-gradient-to-r from-teal-500 to-teal-700 p-4 text-white md:p-6">
        <h2 className="text-center text-2xl font-bold md:text-4xl">AI Image Editor</h2>
        <p className="mt-2 text-center text-sm text-gray-100 sm:text-base">
          Upload a picture, say what to change. Your edits stay private — they never go to the
          gallery.
        </p>
      </div>

      <div className="bg-stone-50 p-6">
        <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
          <div>
            <label htmlFor="editModel" className="mb-1 block text-sm font-bold text-gray-700">
              Select Model
            </label>
            <select
              id="editModel"
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              disabled={isLoadingModels || models.length === 0}
              className="w-full rounded-md border-2 border-black p-2 text-sm disabled:bg-gray-100"
            >
              {isLoadingModels && <option>Loading models…</option>}
              {models.map((model) => (
                <option key={model.key} value={model.key}>
                  {model.label} — {model.cost} {model.cost === 1 ? 'credit' : 'credits'}
                </option>
              ))}
            </select>
            {modelsError && <p className="mt-1 text-sm text-red-600">{modelsError}</p>}
          </div>

          {currentModel && (
            <div className="mt-2 rounded-md bg-teal-100 p-3">
              <p className="text-sm text-gray-700">{currentModel.description}</p>
              <p className="mt-1 text-xs font-medium text-teal-800">
                {supportsMultiple
                  ? 'Takes several reference images at once.'
                  : 'Takes one image at a time.'}
              </p>
            </div>
          )}

          <div>
            <div className="mb-1 block text-sm font-bold text-gray-700">
              {supportsMultiple ? 'Your Images' : 'Your Image'}
            </div>
            <label
              htmlFor="editFiles"
              className="flex cursor-pointer items-center justify-center gap-2 rounded-md border-2 border-dashed border-black bg-white p-4 text-sm font-medium text-gray-700 transition duration-300 hover:bg-teal-50"
            >
              <Upload size={18} />
              <span>
                {files.length === 0 && !sourceImage
                  ? 'Choose a JPEG, PNG or WEBP (max 10 MB)'
                  : supportsMultiple
                    ? 'Add another image'
                    : 'Choose a different image'}
              </span>
            </label>
            <input
              id="editFiles"
              type="file"
              accept={IMAGE_ACCEPT_ATTRIBUTE}
              multiple={supportsMultiple}
              onChange={handleFilesPicked}
              className="hidden"
            />
            {fileError && <p className="mt-2 text-sm text-red-600">{fileError}</p>}
            {(sourceImage != null || files.length > 0) && (
              <div className="mt-3 flex flex-wrap gap-3">
                {sourceImage && (
                  <div className="relative">
                    {/* A plain <img> against the same url the gallery just showed --
                        no fetch, so no CORS involved. */}
                    <img
                      src={sourceImage.url}
                      alt="Selected for editing"
                      className="h-24 w-24 rounded-md border-2 border-black object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setSourceImage(null)}
                      aria-label="Remove this image"
                      className="absolute -right-2 -top-2 rounded-full border-2 border-black bg-white p-1 text-black transition duration-300 hover:bg-red-500 hover:text-white"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
                {/* Driven off `files`, not `previews`: the object urls are rebuilt in an
                    effect, so for one paint after a removal `previews` is still the
                    longer, already-revoked list. Mapping the files and skipping a
                    preview that hasn't caught up avoids rendering a dead src. */}
                {files.map((file, index) =>
                  previews[index] ? (
                    <div key={`${file.name}-${file.size}-${index}`} className="relative">
                      <img
                        src={previews[index]}
                        alt={file.name}
                        className="h-24 w-24 rounded-md border-2 border-black object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        aria-label={`Remove ${file.name}`}
                        className="absolute -right-2 -top-2 rounded-full border-2 border-black bg-white p-1 text-black transition duration-300 hover:bg-red-500 hover:text-white"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : null
                )}
              </div>
            )}
          </div>

          <div>
            <label htmlFor="editPrompt" className="mb-1 block text-sm font-bold text-gray-700">
              What should change?
            </label>
            <textarea
              id="editPrompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              maxLength={promptBudget}
              placeholder="Give it an instruction: “remove the parked car”, “make it winter”, “put her in a red coat”"
              className="w-full rounded-md border-2 border-black p-2 text-sm"
              rows={3}
            />
            <div className="mt-1 flex justify-between text-xs text-gray-500">
              {/* No prompt-improver runs on this path -- what's typed is what the model
                  gets -- so an instruction beats a description here. */}
              <span>An instruction, not a description. Nothing rewrites it.</span>
              <span>
                {prompt.length} / {promptBudget}
              </span>
            </div>
          </div>

          {supportsSize && (
            <div>
              <label htmlFor="editSize" className="mb-1 block text-sm font-bold text-gray-700">
                Output Size
              </label>
              <select
                id="editSize"
                value={size}
                onChange={(e) => setSize(e.target.value)}
                className="w-full rounded-md border-2 border-black p-2 text-sm"
              >
                {SIZE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {notice && (
            <CreditNotice
              tone={noticeTone}
              showBuyLink={noticeTone === 'credits' || cannotAfford || balance <= 0}
            >
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
                Top up to edit
              </Link>
            ) : (
              <button
                type="button"
                onClick={handleEditClick}
                disabled={isLoading || (isLoggedIn && !isReady)}
                className={`flex-1 rounded-md px-4 py-2 text-sm font-bold transition duration-300 disabled:opacity-50 md:text-base ${isLoggedIn ? 'bg-black text-white hover:bg-gray-800' : 'bg-amber-400 text-black hover:bg-amber-500'}`}
              >
                {editLabel()}
              </button>
            )}
            {/* A 400 means the request has to change, so it gets no retry. A 502 or a
                dropped connection is worth a second attempt on the same input. */}
            {isRetryable && !isLoading && (
              <button
                type="button"
                onClick={() => void submitEdit()}
                className="flex items-center justify-center gap-2 rounded-md bg-teal-500 px-4 py-2 text-sm font-bold text-white transition duration-300 hover:bg-teal-600 md:text-base"
              >
                <RefreshCw size={16} />
                Try again
              </button>
            )}
            <button
              type="button"
              onClick={startOver}
              className="flex-1 rounded-md bg-gray-300 px-4 py-2 text-sm font-bold text-black transition duration-300 hover:bg-gray-400 md:text-base"
            >
              New Edit
            </button>
          </div>
        </form>
      </div>

      <div className="bg-stone-100 p-6">
        {result ? (
          <div className="w-full">
            <p className="mb-4 text-center text-sm font-bold text-gray-700">Your edited image:</p>
            <div className="relative mx-auto w-fit">
              <img
                src={result.image_url}
                alt="Edited"
                loading="lazy"
                width={1024}
                height={1024}
                className={`mx-auto h-auto max-w-full rounded-md border-2 border-black shadow-lg ${result.nsfw && !revealNSFW ? 'blur-2xl' : ''}`}
              />
              {result.nsfw && !revealNSFW && (
                <button
                  type="button"
                  onClick={() => setRevealNSFW(true)}
                  className="absolute inset-0 flex items-center justify-center rounded-md bg-black bg-opacity-40 text-sm font-bold text-white"
                >
                  Flagged as sensitive — tap to reveal
                </button>
              )}
            </div>
            {wasClamped && (
              <p className="mt-4 text-center text-sm text-amber-700">
                Your instruction was longer than this model accepts, so it was shortened to: “
                {result.prompt}”
              </p>
            )}
            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => {
                  setResult(null);
                  setPrompt('');
                  setFiles([]);
                  setSourceImage({ id: result.image_id, url: result.image_url });
                }}
                className="rounded-md bg-teal-500 px-6 py-3 font-bold text-white transition duration-300 hover:bg-teal-600"
              >
                Edit this result again
              </button>
              <a
                href={result.image_url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-md bg-black px-6 py-3 font-bold text-white transition duration-300 hover:bg-gray-800"
              >
                Open full size
              </a>
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-500">
            <Upload className="mx-auto mb-2 h-12 w-12" strokeWidth={1.5} />
            <p className="text-sm font-bold">Your edited image will appear here</p>
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
    </div>
  );
};

export default EditGenerator;
