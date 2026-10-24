import { VIDEO_MANIFEST, type VideoEntry, type VideoManifest } from '../data/videoManifest';

export type { VideoEntry, VideoManifest };
export { VIDEO_MANIFEST };

/**
 * Returns the base URL for video and poster assets.
 * When VITE_VIDEO_CDN_URL is set, strips trailing slash and returns it.
 * Falls back to local '/videos' when unset.
 */
export function getVideoBaseUrl(): string {
  const cdn = (
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_VIDEO_CDN_URL) ||
    (typeof process !== 'undefined' && process.env?.VITE_VIDEO_CDN_URL) ||
    ''
  ).trim().replace(/\/$/, '');
  if (cdn) return cdn;

  // Resilient fallback (F-06): If deployed without VITE_VIDEO_CDN_URL, route to default Supabase video storage
  if (typeof window !== 'undefined' && !window.location.hostname.includes('localhost') && !window.location.hostname.includes('127.0.0.1')) {
    return 'https://mcwadkgzplurjtstrhdd.supabase.co/storage/v1/object/public/chemora-videos';
  }
  return '/videos';
}

/**
 * Resolves a video or poster filename/identifier using manifest.json.
 * @param name Video ID (e.g. 'conductivity') or direct filename (e.g. 'chemora-intro.mp4')
 * @param format Optional format selector ('mp4' | 'webm' | 'poster')
 */
export function videoUrl(name: string, format?: 'mp4' | 'webm' | 'poster'): string {
  const base = getVideoBaseUrl();
  const clean = name.trim().replace(/^\/?videos\//, '');

  if (format && VIDEO_MANIFEST[clean]) {
    const file = VIDEO_MANIFEST[clean][format];
    return `${base}/${file}`;
  }

  if (VIDEO_MANIFEST[clean]) {
    return `${base}/${VIDEO_MANIFEST[clean].mp4}`;
  }

  return `${base}/${clean}`;
}

/**
 * Fallback local URL (always starts with /videos/).
 */
export function localVideoUrl(filename: string): string {
  const clean = filename.trim().replace(/^\/?videos\//, '');
  return `/videos/${clean}`;
}

/**
 * Checks if an asset exists in videos/manifest.json.
 */
export function hasVideoAsset(nameOrId: string): boolean {
  const clean = nameOrId.trim().replace(/^\/?videos\//, '').replace(/\.(mp4|webm|webp)$/, '').replace(/-poster$/, '');
  return Boolean(VIDEO_MANIFEST[clean]);
}

/**
 * Gets all three URLs for an experiment / media asset.
 * Returns null if not in manifest (per Option A).
 */
export function getVideoMediaUrls(nameOrId: string): {
  mp4: string;
  webm: string;
  poster: string;
  fallbackMp4: string;
  fallbackWebm: string;
  fallbackPoster: string;
} | null {
  const clean = nameOrId.trim().replace(/^\/?videos\//, '').replace(/\.(mp4|webm|webp)$/, '').replace(/-poster$/, '');
  const entry = VIDEO_MANIFEST[clean];
  if (!entry) return null;

  const base = getVideoBaseUrl();
  return {
    mp4: `${base}/${entry.mp4}`,
    webm: `${base}/${entry.webm}`,
    poster: `${base}/${entry.poster}`,
    fallbackMp4: `/videos/${entry.mp4}`,
    fallbackWebm: `/videos/${entry.webm}`,
    fallbackPoster: `/videos/${entry.poster}`,
  };
}
