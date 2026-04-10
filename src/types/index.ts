export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  artwork: string | null;
  fileBlob: Blob | null;
  fileName: string;
  fileSize?: number;
  storagePath?: string;
  publicUrl?: string | null;
  dateAdded: number;
  playCount: number;
  isFavorite: boolean;
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  trackIds: string[];
  dateCreated: number;
  dateModified: number;
}

export interface RecentlyPlayed {
  trackId: string;
  playedAt: number;
}

export interface Preferences {
  theme: 'light' | 'dark';
  sortBy: SortOption;
  sortOrder: 'asc' | 'desc';
  viewMode: 'grid' | 'list';
}

export type SortOption = 'name' | 'dateAdded' | 'duration' | 'artist';
export type RepeatMode = 'none' | 'all' | 'one';
export type PlaybackSpeed = 0.5 | 0.75 | 1 | 1.25 | 1.5 | 1.75 | 2;

export interface PlayerState {
  currentTrack: Track | null;
  queue: Track[];
  queueIndex: number;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  repeatMode: RepeatMode;
  isShuffled: boolean;
  playbackSpeed: PlaybackSpeed;
}

export type ViewSection = 'library' | 'playlists' | 'favorites' | 'recent' | 'playlist-detail' | 'settings';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

export interface User {
  id: string;
  email?: string;
}
