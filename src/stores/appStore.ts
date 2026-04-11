import { create } from 'zustand';
import type { 
  Track, 
  Playlist, 
  RecentlyPlayed, 
  Preferences, 
  ViewSection,
  RepeatMode,
  PlaybackSpeed,
  Toast,
  User
} from '../types';
import * as storage from '../services/supabaseService';
import { audioService } from '../services/audioService';

interface AppState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  
  tracks: Track[];
  playlists: Playlist[];
  recentlyPlayed: RecentlyPlayed[];
  favorites: Set<string>;
  preferences: Preferences;
  
  currentView: ViewSection;
  selectedPlaylistId: string | null;
  searchQuery: string;
  
  currentTrack: Track | null;
  queue: Track[];
  queueIndex: number;
  isPlaying: boolean;
  isAutoPlay: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  repeatMode: RepeatMode;
  isShuffled: boolean;
  playbackSpeed: PlaybackSpeed;
  
  toasts: Toast[];
  
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  
  setCurrentView: (view: ViewSection) => void;
  setSelectedPlaylistId: (id: string | null) => void;
  setSearchQuery: (query: string) => void;
  
  addTrack: (file: File, onProgress?: (p: number) => void) => Promise<void>;
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
  toggleAutoPlay: () => void;
  shuffleAll: () => Promise<void>;
  setPlaybackSpeed: (speed: PlaybackSpeed) => void;
  
  setTheme: (theme: 'light' | 'dark') => void;
  setSortBy: (sortBy: Preferences['sortBy']) => void;
  setSortOrder: (order: 'asc' | 'desc') => void;
  setViewMode: (mode: 'grid' | 'list') => void;
  
  clearRecentlyPlayed: () => Promise<void>;
  
  addToast: (type: Toast['type'], message: string) => void;
  removeToast: (id: string) => void;
  
  loadUserData: () => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,
  
  tracks: [],
  playlists: [],
  recentlyPlayed: [],
  favorites: new Set<string>(),
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
  isAutoPlay: true,
  currentTime: 0,
  duration: 0,
  volume: 0.7,
  isMuted: false,
  repeatMode: 'none',
  isShuffled: false,
  playbackSpeed: 1,
  
  toasts: [],
  
  initialize: async () => {
    try {
      const user = await storage.getCurrentUser();
      
      if (user) {
        set({ user, isAuthenticated: true });
        await get().loadUserData();
      }
      
      storage.onAuthStateChange(async (authUser) => {
        if (authUser) {
          set({ user: authUser, isAuthenticated: true });
          await get().loadUserData();
        } else {
          set({ 
            user: null, 
            isAuthenticated: false,
            tracks: [],
            playlists: [],
            recentlyPlayed: [],
            favorites: new Set(),
            currentTrack: null,
            queue: [],
          });
        }
      });
      
      set({ isInitialized: true });
    } catch (error) {
      console.error('Failed to initialize:', error);
      set({ isInitialized: true });
    }
  },
  
  signIn: async (email, password) => {
    set({ isLoading: true });
    const { error } = await storage.signIn(email, password);
    set({ isLoading: false });
    return { error };
  },
  
  signUp: async (email, password) => {
    set({ isLoading: true });
    const { error } = await storage.signUp(email, password);
    set({ isLoading: false });
    return { error };
  },
  
  signOut: async () => {
    audioService.destroy();
    await storage.signOut();
    set({
      user: null,
      isAuthenticated: false,
      tracks: [],
      playlists: [],
      recentlyPlayed: [],
      favorites: new Set(),
      currentTrack: null,
      queue: [],
      queueIndex: -1,
      isPlaying: false,
    });
  },
  
  loadUserData: async () => {
    const [tracks, playlists, recentlyPlayed, favoritesData, preferences] = await Promise.all([
      storage.getTracks(),
      storage.getPlaylists(),
      storage.getRecentlyPlayed(),
      storage.getFavorites(),
      storage.getPreferences(),
    ]);
    
    const favorites = new Set(favoritesData);
    
    const tracksWithFavorites = tracks.map(t => ({
      ...t,
      isFavorite: favorites.has(t.id),
    }));
    
    set({
      tracks: tracksWithFavorites,
      playlists,
      recentlyPlayed,
      favorites,
      preferences,
    });
    
    applyTheme(preferences.theme);
  },
  
  setCurrentView: (view) => set({ currentView: view }),
  setSelectedPlaylistId: (id) => set({ selectedPlaylistId: id, currentView: id ? 'playlist-detail' : 'playlists' }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  
  addTrack: async (file, _onProgress) => {
    const track = await createLocalTrack(file);
    
    const user = get().user;
    if (!user) {
      get().addToast('error', 'Please sign in to upload tracks');
      return;
    }
    
    set({ isLoading: true });
    
    try {
      const uploadResult = await storage.uploadAudioFile(user.id, file);
      
      if (!uploadResult) {
        get().addToast('error', 'Failed to upload file');
        set({ isLoading: false });
        return;
      }
      
      const trackToSave: Track = {
        ...track,
        storagePath: uploadResult.path,
        publicUrl: uploadResult.url,
        fileBlob: null,
      };
      
      await storage.saveTrack(trackToSave, uploadResult.path);
      
      set((state) => ({
        tracks: [trackToSave, ...state.tracks],
        isLoading: false,
      }));
      
      get().addToast('success', `Added "${track.title}" to library`);
    } catch (error) {
      console.error('Failed to add track:', error);
      get().addToast('error', 'Failed to add track');
      set({ isLoading: false });
    }
  },
  
  deleteTrack: async (id) => {
    const track = get().tracks.find(t => t.id === id);
    
    await storage.deleteTrack(id, track?.storagePath);
    
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
    if (!track) return;
    
    const newValue = !track.isFavorite;
    
    await storage.updateTrackFavorite(id, newValue);
    
    set((state) => {
      const newFavorites = new Set(state.favorites);
      if (newValue) {
        newFavorites.add(id);
      } else {
        newFavorites.delete(id);
      }
      
      return {
        favorites: newFavorites,
        tracks: state.tracks.map(t => 
          t.id === id ? { ...t, isFavorite: newValue } : t
        ),
      };
    });
    
    get().addToast('success', newValue ? 'Added to favorites' : 'Removed from favorites');
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
    
    set((state) => ({
      playlists: [playlist, ...state.playlists],
    }));
    
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
    await storage.addToPlaylist(playlistId, trackId);
    
    set((state) => ({
      playlists: state.playlists.map(p => 
        p.id === playlistId && !p.trackIds.includes(trackId)
          ? { ...p, trackIds: [...p.trackIds, trackId], dateModified: Date.now() }
          : p
      ),
    }));
    
    get().addToast('success', 'Added to playlist');
  },
  
  removeFromPlaylist: async (playlistId, trackId) => {
    await storage.removeFromPlaylist(playlistId, trackId);
    
    set((state) => ({
      playlists: state.playlists.map(p => 
        p.id === playlistId
          ? { ...p, trackIds: p.trackIds.filter(id => id !== trackId), dateModified: Date.now() }
          : p
      ),
    }));
  },
  
  playTrack: async (track) => {
    try {
      if (!track.publicUrl && !track.storagePath) {
        get().addToast('error', 'Track not available. Please re-upload.');
        return;
      }
      
      await audioService.loadTrack(track);
      audioService.play();
      
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
    if (!track.publicUrl && !track.storagePath) {
      get().addToast('error', 'Track not available. Please re-upload.');
      return;
    }
    
    try {
      await audioService.loadTrack(track);
      audioService.play();
      
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
    const { queue, queueIndex, repeatMode, isShuffled, isAutoPlay } = get();
    if (queue.length === 0) return;
    
    let nextIndex: number;
    
    if (isShuffled) {
      do {
        nextIndex = Math.floor(Math.random() * queue.length);
      } while (queue.length > 1 && nextIndex === queueIndex);
    } else if (queueIndex >= queue.length - 1) {
      if (repeatMode === 'all' || isAutoPlay) {
        nextIndex = 0;
      } else {
        nextIndex = -1;
      }
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
  
  shuffleAll: async () => {
    const { tracks } = get();
    if (tracks.length === 0) return;
    
    const shuffled = [...tracks].sort(() => Math.random() - 0.5);
    
    await get().playQueue(shuffled, 0);
    set({ isShuffled: true, isAutoPlay: true });
  },
  
  toggleAutoPlay: () => set((state) => ({ isAutoPlay: !state.isAutoPlay })),
  
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

async function createLocalTrack(file: File): Promise<Track> {
  const { v4: uuidv4 } = await import('uuid');
  
  let artwork: string | null = null;
  let duration = 0;
  let title = file.name.replace(/\.[^/.]+$/, '');
  let artist = 'Unknown Artist';
  let album = 'Unknown Album';
  
  try {
    const { parseBlob } = await import('music-metadata');
    const metadata = await parseBlob(file);
    
    title = metadata.common.title || title;
    artist = metadata.common.artist || artist;
    album = metadata.common.album || album;
    duration = metadata.format.duration || 0;
    
    if (metadata.common.picture && metadata.common.picture.length > 0) {
      const pic = metadata.common.picture[0];
      const base64 = btoa(String.fromCharCode(...new Uint8Array(pic.data)));
      artwork = `data:${pic.format};base64,${base64}`;
    }
  } catch (error) {
    console.warn('Failed to extract metadata:', error);
  }
  
  return {
    id: uuidv4(),
    title,
    artist,
    album,
    duration,
    artwork,
    fileBlob: file,
    fileName: file.name,
    fileSize: file.size,
    dateAdded: Date.now(),
    playCount: 0,
    isFavorite: false,
  };
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
