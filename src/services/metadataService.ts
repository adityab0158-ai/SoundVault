import { parseFile } from 'music-metadata';
import { v4 as uuidv4 } from 'uuid';
import type { Track } from '../types';

export async function extractMetadata(file: File): Promise<Partial<Track>> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const metadata = await parseFile(arrayBuffer as any);
    
    let artwork: string | null = null;
    if (metadata.common.picture && metadata.common.picture.length > 0) {
      const pic = metadata.common.picture[0];
      const base64 = arrayBufferToBase64(new Uint8Array(pic.data));
      artwork = `data:${pic.format};base64,${base64}`;
    }

    return {
      title: metadata.common.title || file.name.replace(/\.[^/.]+$/, ''),
      artist: metadata.common.artist || 'Unknown Artist',
      album: metadata.common.album || 'Unknown Album',
      duration: metadata.format.duration || 0,
      artwork,
    };
  } catch (error) {
    console.warn('Failed to extract metadata:', error);
    return {
      title: file.name.replace(/\.[^/.]+$/, ''),
      artist: 'Unknown Artist',
      album: 'Unknown Album',
      duration: 0,
      artwork: null,
    };
  }
}

export async function createTrack(file: File): Promise<Track> {
  const metadata = await extractMetadata(file);
  
  return {
    id: uuidv4(),
    title: metadata.title || file.name,
    artist: metadata.artist || 'Unknown Artist',
    album: metadata.album || 'Unknown Album',
    duration: metadata.duration || 0,
    artwork: metadata.artwork ?? null,
    fileBlob: file,
    fileName: file.name,
    fileSize: file.size,
    storagePath: undefined,
    publicUrl: undefined,
    dateAdded: Date.now(),
    playCount: 0,
    isFavorite: false,
  };
}

function arrayBufferToBase64(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function formatDuration(seconds: number): string {
  if (!seconds || !isFinite(seconds)) return '0:00';
  
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function formatDurationLong(seconds: number): string {
  if (!seconds || !isFinite(seconds)) return '0:00';
  
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function generatePlaceholderArtwork(seed: string): string {
  const hash = seed.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);
  
  const h1 = Math.abs(hash) % 360;
  const h2 = (h1 + 40) % 360;
  
  return `data:image/svg+xml,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="400" height="400">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:hsl(${h1}, 70%, 50%)"/>
          <stop offset="100%" style="stop-color:hsl(${h2}, 70%, 40%)"/>
        </linearGradient>
      </defs>
      <rect width="400" height="400" fill="url(#g)"/>
      <circle cx="200" cy="180" r="80" fill="rgba(255,255,255,0.2)"/>
      <circle cx="200" cy="180" r="30" fill="rgba(255,255,255,0.3)"/>
    </svg>
  `)}`;
}
