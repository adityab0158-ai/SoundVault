import { openDB } from 'idb';
import type { DBSchema, IDBPDatabase } from 'idb';
import type { Track, Playlist, RecentlyPlayed, Preferences } from '../types';

interface SoundVaultDB extends DBSchema {
  tracks: {
    key: string;
    value: Track;
    indexes: { 'by-dateAdded': number; 'by-artist': string };
  };
  playlists: {
    key: string;
    value: Playlist;
    indexes: { 'by-dateCreated': number };
  };
  history: {
    key: number;
    value: RecentlyPlayed;
    indexes: { 'by-playedAt': number };
  };
  preferences: {
    key: string;
    value: Preferences;
  };
}

const DB_NAME = 'soundvault-db';
const DB_VERSION = 1;

let dbInstance: IDBPDatabase<SoundVaultDB> | null = null;

export async function getDB(): Promise<IDBPDatabase<SoundVaultDB>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<SoundVaultDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('tracks')) {
        const trackStore = db.createObjectStore('tracks', { keyPath: 'id' });
        trackStore.createIndex('by-dateAdded', 'dateAdded');
        trackStore.createIndex('by-artist', 'artist');
      }
      if (!db.objectStoreNames.contains('playlists')) {
        const playlistStore = db.createObjectStore('playlists', { keyPath: 'id' });
        playlistStore.createIndex('by-dateCreated', 'dateCreated');
      }
      if (!db.objectStoreNames.contains('history')) {
        const historyStore = db.createObjectStore('history', { keyPath: 'trackId' });
        historyStore.createIndex('by-playedAt', 'playedAt');
      }
      if (!db.objectStoreNames.contains('preferences')) {
        db.createObjectStore('preferences', { keyPath: 'id' });
      }
    },
  });

  return dbInstance;
}

export async function getAllTracks(): Promise<Track[]> {
  const db = await getDB();
  return db.getAll('tracks');
}

export async function getTrack(id: string): Promise<Track | undefined> {
  const db = await getDB();
  return db.get('tracks', id);
}

export async function saveTrack(track: Track): Promise<void> {
  const db = await getDB();
  await db.put('tracks', track);
}

export async function deleteTrack(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('tracks', id);
}

export async function getAllPlaylists(): Promise<Playlist[]> {
  const db = await getDB();
  return db.getAll('playlists');
}

export async function getPlaylist(id: string): Promise<Playlist | undefined> {
  const db = await getDB();
  return db.get('playlists', id);
}

export async function savePlaylist(playlist: Playlist): Promise<void> {
  const db = await getDB();
  await db.put('playlists', playlist);
}

export async function deletePlaylist(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('playlists', id);
}

export async function getRecentlyPlayed(): Promise<RecentlyPlayed[]> {
  const db = await getDB();
  const all = await db.getAllFromIndex('history', 'by-playedAt');
  return all.reverse();
}

export async function addToRecentlyPlayed(trackId: string): Promise<void> {
  const db = await getDB();
  await db.put('history', {
    trackId,
    playedAt: Date.now(),
  });
}

export async function clearRecentlyPlayed(): Promise<void> {
  const db = await getDB();
  await db.clear('history');
}

export async function getPreferences(): Promise<Preferences> {
  const db = await getDB();
  const prefs = await db.get('preferences', 'user-prefs');
  return prefs || {
    theme: 'dark',
    sortBy: 'dateAdded',
    sortOrder: 'desc',
    viewMode: 'grid',
  };
}

export async function savePreferences(prefs: Preferences): Promise<void> {
  const db = await getDB();
  await db.put('preferences', { ...prefs, id: 'user-prefs' } as Preferences & { id: string });
}

export async function updateTrackFavorite(trackId: string, isFavorite: boolean): Promise<void> {
  const db = await getDB();
  const track = await db.get('tracks', trackId);
  if (track) {
    track.isFavorite = isFavorite;
    await db.put('tracks', track);
  }
}

export async function updateTrackMetadata(
  trackId: string,
  metadata: { title?: string; artist?: string; album?: string }
): Promise<void> {
  const db = await getDB();
  const track = await db.get('tracks', trackId);
  if (track) {
    if (metadata.title !== undefined) track.title = metadata.title;
    if (metadata.artist !== undefined) track.artist = metadata.artist;
    if (metadata.album !== undefined) track.album = metadata.album;
    await db.put('tracks', track);
  }
}

export async function incrementPlayCount(trackId: string): Promise<void> {
  const db = await getDB();
  const track = await db.get('tracks', trackId);
  if (track) {
    track.playCount += 1;
    await db.put('tracks', track);
  }
}
