import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getYouTubeEmbedUrl(url: string) {
  if (!url) return '';
  let videoId = '';
  try {
    const p = new URL(url);
    if (p.hostname === 'youtu.be') {
      videoId = p.pathname.slice(1);
    } else if (p.hostname.includes('youtube.com')) {
      videoId = p.searchParams.get('v') || '';
    }
  } catch(e) {}
  return videoId ? `https://www.youtube.com/embed/${videoId}` : '';
}
