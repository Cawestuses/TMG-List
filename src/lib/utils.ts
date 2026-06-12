import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getVideoEmbedUrl(url: string) {
  if (!url) return '';
  try {
    const p = new URL(url);
    if (p.hostname === 'youtu.be') {
      const videoId = p.pathname.slice(1);
      return `https://www.youtube.com/embed/${videoId}?autoplay=0`;
    } else if (p.hostname.includes('youtube.com')) {
      const videoId = p.searchParams.get('v');
      if (videoId) return `https://www.youtube.com/embed/${videoId}?autoplay=0`;
    } else if (p.hostname.includes('twitch.tv')) {
      const parts = p.pathname.split('/').filter(Boolean);
      if (parts[0] === 'videos' && parts[1]) {
        return `https://player.twitch.tv/?video=${parts[1]}&parent=${window.location.hostname}&autoplay=false`;
      } else if (parts[0]) {
        return `https://player.twitch.tv/?channel=${parts[0]}&parent=${window.location.hostname}&autoplay=false`;
      }
    }
  } catch(e) {}
  return '';
}
