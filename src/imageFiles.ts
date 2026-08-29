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

/*
 * There is deliberately no "download an image we already host and re-upload it"
 * helper here any more. Editing a picture the site already stores is done by sending
 * its `source_image_id` -- the server presigns the object it already holds. Fetching
 * our own S3 object from the browser meant every handoff depended on the bucket's
 * CORS allowlist covering the serving origin, and on the browser not reusing the
 * non-CORS cache entry that the <img> tag had just created for the same url.
 */

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
