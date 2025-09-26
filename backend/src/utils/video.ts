const YOUTUBE_URL_REGEX = /^(https?:\/\/)?(www\.|m\.)?(youtube\.com\/(watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})([?&][^\s]*)?$/i;

export interface NormalizedYouTubeLink {
  url: string;
  videoId: string;
}

/**
 * Returns the canonical 11-character YouTube video id if the url is valid, null otherwise.
 */
export const extractYouTubeVideoId = (rawUrl: string): string | null => {
  try {
    const url = rawUrl.trim();
    if (!url) {
      return null;
    }

    const directMatch = url.match(YOUTUBE_URL_REGEX);
    if (directMatch && directMatch[5]?.length === 11) {
      return directMatch[5];
    }

    const parsed = new URL(url);
    if (parsed.hostname.includes('youtu.be')) {
      const candidate = parsed.pathname.replace('/', '').slice(0, 11);
      return candidate.length === 11 ? candidate : null;
    }

    if (parsed.searchParams.has('v')) {
      const candidate = parsed.searchParams.get('v') ?? '';
      return candidate.length === 11 ? candidate : null;
    }

    const parts = parsed.pathname.split('/');
    const lastSegment = parts.pop() || '';
    return lastSegment.length === 11 ? lastSegment : null;
  } catch {
    return null;
  }
};

/**
 * Validates the provided string as a YouTube url and returns a normalized representation.
 * Throws an Error when invalid.
 */
export const validateYouTubeUrl = (rawUrl: string): NormalizedYouTubeLink => {
  const url = (rawUrl || '').trim();
  if (!url || !YOUTUBE_URL_REGEX.test(url)) {
    throw createYouTubeValidationError('A valid YouTube URL is required.');
  }

  const videoId = extractYouTubeVideoId(url);
  if (!videoId) {
    throw createYouTubeValidationError('Unsupported YouTube URL format.');
  }

  return { url, videoId };
};

export const createYouTubeValidationError = (message: string) => {
  const error = new Error(message) as Error & { status?: number };
  error.status = 400;
  return error;
};