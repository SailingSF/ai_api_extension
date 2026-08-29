/**
 * Client-side rules for the files sent to POST /api/generate-image-with-input/.
 *
 * These mirror the backend's `_validate_upload` (api/utils.py) so a file it would
 * reject never costs a round trip. The backend owns the real limits -- if they ever
 * move, they move there first and this is what goes stale, the same caveat as
 * SIGNUP_BONUS_CREDITS in constants.ts.
 *
 * The important quirk: the server decides a file's type from its **filename
 * extension**, not its bytes or its MIME header. A File built from a blob -- which is
 * exactly what the "edit this image" handoff does -- is a 400 unless it is given a
 * name ending in one of these.
 */
export const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'] as const;

/** Matches the backend's MAX_UPLOAD_MB default of 10. */
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

/** For the file input's `accept`, so the picker filters before the user chooses. */
export const IMAGE_ACCEPT_ATTRIBUTE = 'image/jpeg,image/png,image/webp';

const hasAllowedExtension = (name: string): boolean =>
  ALLOWED_IMAGE_EXTENSIONS.some((extension) => name.toLowerCase().endsWith(extension));

/** A human explanation of why this file won't do, or null if it will. */
export const validateImageFile = (file: File): string | null => {
  if (!hasAllowedExtension(file.name)) {
    return `${file.name} isn't a JPEG, PNG or WEBP. The file's extension is what decides its type, so rename it if it's really an image.`;
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    const megabytes = (file.size / (1024 * 1024)).toFixed(1);
    return `${file.name} is ${megabytes} MB. The limit is ${MAX_UPLOAD_BYTES / (1024 * 1024)} MB.`;
  }
  return null;
};

/**
 * Pull an already-generated image down as a File so it can be re-uploaded.
 *
 * The editing endpoint takes multipart uploads, not urls, so carrying an image from
 * the gallery or a generation result into the editor means fetching the bytes back
 * out of S3. The bucket sends CORS headers for this app's origins, and returns the
 * object as `binary/octet-stream` -- harmless, because the name is what the server
 * reads. Anything that doesn't already end in an allowed extension gets `.png`.
 */
export const fetchImageAsFile = async (url: string): Promise<File> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Could not load that image (${response.status}).`);
  }
  const blob = await response.blob();

  const lastSegment = new URL(url).pathname.split('/').pop() || 'source-image';
  const name = hasAllowedExtension(lastSegment) ? lastSegment : `${lastSegment}.png`;

  return new File([blob], name, { type: blob.type || 'image/png' });
};
