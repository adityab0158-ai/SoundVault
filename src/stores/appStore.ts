import { create } from 'zustand';
import type { 
  Track, 
  Playlist, 
  RecentlyPlayed, 
  Preferences, 
  ViewSection,
  RepeatMode,
  PlaybackSpeed,
  Toast
} from '../types';
import * as storage from '../services/storageService';
import { audioService } from '../services/audioService';

interface AppState {
  tracks: Track[];
  playlists: Playlist[];
  recentlyPlayed: RecentlyPlayed[];
  preferences: Preferences;
  
  currentView: ViewSection;
  selectedPlaylistId: string | null;
  searchQuery: string;
  
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
  
  toasts: Toast[];
  isLoading: boolean;
  
  initialize: () => Promise<void>;
  
  setCurrentView: (view: ViewSection) => void;
  setSelectedPlaylistId: (id: string | null) => void;
  setSearchQuery: (query: string) => void;
  
  addTrack: (track: Track) => Promise<void>;
  deleteTrack: (id: string) => Promise<void>;
  updateTrackMetadata: (id: string, metadata: { title?: string; artist?: string; album?: string }) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  
  createPlaylist: (name: string, description?: string) => Promise<void>;
  updatePlaylist: (id: string, updates: { name?: string; description?: string }) => Promise<void>;
  deletePlaylist: (id: string) => Promise<void>;
  addToPlaylist: (playlistId: string, trackId: string) => Promise<void>;
  removeFromPlaylist: (playlistId: string, trackId: string) => Promise<void>;
  
  playTrack: (track: Track) => Promise<void>;
  playQueue: (tracks: Track[], startIndex?: number) => Promise<void>;
  togglePlay: () => void;
  nextTrack: () => void;
  previousTrack: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  setRepeatMode: (mode: RepeatMode) => void;
  toggleShuffle: () => void;
  setPlaybackSpeed: (speed: PlaybackSpeed) => void;
  
  setTheme: (theme: 'light' | 'dark') => void;
  setSortBy: (sortBy: Preferences['sortBy']) => void;
  setSortOrder: (order: 'asc' | 'desc') => void;
  setViewMode: (mode: 'grid' | 'list') => void;
  
  clearRecentlyPlayed: () => Promise<void>;
  
  addToast: (type: Toast['type'], message: string) => void;
  removeToast: (id: string) => void;
}

export const useStore = create<AppState>((set, get) => ({
  tracks: [],
  playlists: [],
  recentlyPlayed: [],
  preferences: {
    theme: 'dark',
    sortBy: 'dateAdded',
    sortOrder: 'desc',
    viewMode: 'grid',
  },
  
  currentView: 'library',
  selectedPlaylistId: null,
  searchQuery: '',
  
  currentTrack: null,
  queue: [],
  queueIndex: -1,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 0.7,
  isMuted: false,
  repeatMode: 'none',
  isShuffled: false,
  playbackSpeed: 1,
  
  toasts: [],
  isLoading: true,
  
  initialize: async () => {
    try {
      const [tracks, playlists, recentlyPlayed, preferences] = await Promise.all([
        storage.getAllTracks(),
        storage.getAllPlaylists(),
        storage.getRecentlyPlayed(),
        storage.getPreferences(),
      ]);
      
      set({
        tracks,
        playlists,
        recentlyPlayed,
        preferences,
        isLoading: false,
      });
      
      audioService.setVolume(get().volume);
      audioService.setPlaybackSpeed(get().playbackSpeed);
      
      applyTheme(preferences.theme);
    } catch (error) {
      console.error('Failed to initialize:', error);
      set({ isLoading: false });
    }
  },
  
  setCurrentView: (view) => set({ currentView: view }),
  setSelectedPlaylistId: (id) => set({ selectedPlaylistId: id, currentView: id ? 'playlist-detail' : 'playlists' }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  
  addTrack: async (track) => {
    await storage.saveTrack(track);
    set((state) => ({ tracks: [...state.tracks, track] }));
    get().addToast('success', `Added "${track.title}" to library`);
  },
  
  deleteTrack: async (id) => {
    const track = get().tracks.find(t => t.id === id);
    await storage.deleteTrack(id);
    set((state) => ({
      tracks: state.tracks.filter(t => t.id !== id),
      queue: state.queue.filter(t => t.id !== id),
      currentTrack: state.currentTrack?.id === id ? null : state.currentTrack,
    }));
    if (track) {
      get().addToast('info', `Removed "${track.title}" from library`);
    }
  },
  
  updateTrackMetadata: async (id, metadata) => {
    await storage.updateTrackMetadata(id, metadata);
    set((state) => ({
      tracks: state.tracks.map(t => 
        t.id === id ? { ...t, ...metadata } : t
      ),
    }));
  },
  
  toggleFavorite: async (id) => {
    const track = get().tracks.find(t => t.id === id);
    if (track) {
      const newValue = !track.isFavorite;
      await storage.updateTrackFavorite(id, newValue);
      set((state) => ({
        tracks: state.tracks.map(t => 
          t.id === id ? { ...t, isFavorite: newValue } : t
        ),
      }));
      get().addToast('success', newValue ? `Added to favorites` : `Removed from favorites`);
    }
  },
  
  createPlaylist: async (name, description = '') => {
    const playlist: Playlist = {
      id: crypto.randomUUID(),
      name,
      description,
      trackIds: [],
      dateCreated: Date.now(),
      dateModified: Date.now(),
    };
    await storage.savePlaylist(playlist);
    set((state) => ({ playlists: [...state.playlists, playlist] }));
    get().addToast('success', `Created playlist "${name}"`);
  },
  
  updatePlaylist: async (id, updates) => {
    const playlist = get().playlists.find(p => p.id === id);
    if (playlist) {
      const updated = { ...playlist, ...updates, dateModified: Date.now() };
      await storage.savePlaylist(updated);
      set((state) => ({
        playlists: state.playlists.map(p => p.id === id ? updated : p),
      }));
    }
  },
  
  deletePlaylist: async (id) => {
    const playlist = get().playlists.find(p => p.id === id);
    await storage.deletePlaylist(id);
    set((state) => ({
      playlists: state.playlists.filter(p => p.id !== id),
      selectedPlaylistId: state.selectedPlaylistId === id ? null : state.selectedPlaylistId,
    }));
    if (playlist) {
      get().addToast('info', `Deleted playlist "${playlist.name}"`);
    }
  },
  
  addToPlaylist: async (playlistId, trackId) => {
    const playlist = get().playlists.find(p => p.id === playlistId);
    if (playlist && !playlist.trackIds.includes(trackId)) {
      const updated = {
        ...playlist,
        trackIds: [...playlist.trackIds, trackId],
        dateModified: Date.now(),
      };
      await storage.savePlaylist(updated);
      set((state) => ({
        playlists: state.playlists.map(p => p.id === playlistId ? updated : p),
      }));
      get().addToast('success', `Added to playlist`);
    }
  },
  
  removeFromPlaylist: async (playlistId, trackId) => {
    const playlist = get().playlists.find(p => p.id === playlistId);
    if (playlist) {
      const updated = {
        ...playlist,
        trackIds: playlist.trackIds.filter(id => id !== trackId),
        dateModified: Date.now(),
      };
      await storage.savePlaylist(updated);
      set((state) => ({
        playlists: state.playlists.map(p => p.id === playlistId ? updated : p),
      }));
    }
  },
  
  playTrack: async (track) => {
    try {
      await audioService.loadTrack(track);
      audioService.play();
      
      await storage.incrementPlayCount(track.id);
      await storage.addToRecentlyPlayed(track.id);
      
      set({
        currentTrack: track,
        queue: [track],
        queueIndex: 0,
        isPlaying: true,
        currentTime: 0,
        duration: audioService.duration,
      });
      
      const recentlyPlayed = await storage.getRecentlyPlayed();
      set({ recentlyPlayed });
    } catch (error) {
      console.error('Failed to play track:', error);
      get().addToast('error', 'Failed to play track');
    }
  },
  
  playQueue: async (tracks, startIndex = 0) => {
    if (tracks.length === 0) return;
    
    const track = tracks[startIndex];
    try {
      await audioService.loadTrack(track);
      audioService.play();
      
      await storage.incrementPlayCount(track.id);
      await storage.addToRecentlyPlayed(track.id);
      
      set({
        currentTrack: track,
        queue: tracks,
        queueIndex: startIndex,
        isPlaying: true,
        currentTime: 0,
        duration: audioService.duration,
      });
      
      const recentlyPlayed = await storage.getRecentlyPlayed();
      set({ recentlyPlayed });
    } catch (error) {
      console.error('Failed to play queue:', error);
      get().addToast('error', 'Failed to play track');
    }
  },
  
  togglePlay: () => {
    if (get().isPlaying) {
      audioService.pause();
    } else {
      audioService.play();
    }
  },
  
  nextTrack: () => {
    const { queue, queueIndex, repeatMode, isShuffled } = get();
    if (queue.length === 0) return;
    
    let nextIndex: number;
    
    if (isShuffled) {
      nextIndex = Math.floor(Math.random() * queue.length);
    } else if (queueIndex >= queue.length - 1) {
      nextIndex = repeatMode === 'all' ? 0 : -1;
    } else {
      nextIndex = queueIndex + 1;
    }
    
    if (nextIndex >= 0) {
      get().playQueue(queue, nextIndex);
    } else {
      audioService.pause();
      set({ isPlaying: false });
    }
  },
  
  previousTrack: () => {
    const { queue, queueIndex, currentTime } = get();
    if (currentTime > 3) {
      get().seek(0);
      return;
    }
    
    if (queueIndex > 0) {
      get().playQueue(queue, queueIndex - 1);
    } else if (queue.length > 0) {
      get().seek(0);
    }
  },
  
  seek: (time) => {
    audioService.seek(time);
    set({ currentTime: time });
  },
  
  setVolume: (volume) => {
    audioService.setVolume(volume);
    set({ volume, isMuted: volume === 0 });
  },
  
  toggleMute: () => {
    const { isMuted, volume } = get();
    audioService.setMuted(!isMuted);
    if (isMuted && volume === 0) {
      audioService.setVolume(0.7);
      set({ isMuted: false, volume: 0.7 });
    } else {
      set({ isMuted: !isMuted });
    }
  },
  
  setRepeatMode: (mode) => set({ repeatMode: mode }),
  
  toggleShuffle: () => set((state) => ({ isShuffled: !state.isShuffled })),
  
  setPlaybackSpeed: (speed) => {
    audioService.setPlaybackSpeed(speed);
    set({ playbackSpeed: speed });
  },
  
  setTheme: async (theme) => {
    const prefs = { ...get().preferences, theme };
    await storage.savePreferences(prefs);
    set({ preferences: prefs });
    applyTheme(theme);
  },
  
  setSortBy: async (sortBy) => {
    const prefs = { ...get().preferences, sortBy };
    await storage.savePreferences(prefs);
    set({ preferences: prefs });
  },
  
  setSortOrder: async (sortOrder) => {
    const prefs = { ...get().preferences, sortOrder };
    await storage.savePreferences(prefs);
    set({ preferences: prefs });
  },
  
  setViewMode: async (viewMode) => {
    const prefs = { ...get().preferences, viewMode };
    await storage.savePreferences(prefs);
    set({ preferences: prefs });
  },
  
  clearRecentlyPlayed: async () => {
    await storage.clearRecentlyPlayed();
    set({ recentlyPlayed: [] });
  },
  
  addToast: (type, message) => {
    const id = crypto.randomUUID();
    set((state) => ({
      toasts: [...state.toasts, { id, type, message }],
    }));
    setTimeout(() => {
      get().removeToast(id);
    }, 4000);
  },
  
  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter(t => t.id !== id),
    }));
  },
}));

function applyTheme(theme: 'light' | 'dark'): void {
  document.documentElement.setAttribute('data-theme', theme);
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

audioService.onTimeUpdate = () => {
  const state = useStore.getState();
  useStore.setState({
    currentTime: audioService.currentTime,
    duration: audioService.duration || state.duration,
  });
};

audioService.onEnded = () => {
  const { repeatMode } = useStore.getState();
  if (repeatMode === 'one') {
    useStore.getState().seek(0);
    audioService.play();
  } else {
    useStore.getState().nextTrack();
  }
};

audioService.onPlayStateChange = (isPlaying) => {
  useStore.setState({ isPlaying });
};
