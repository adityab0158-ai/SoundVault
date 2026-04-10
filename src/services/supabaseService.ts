import { supabase, STORAGE_BUCKET } from '../lib/supabase';
import type { Track, Playlist, RecentlyPlayed, Preferences } from '../types';

export interface SupabaseTrack {
  id: string;
  user_id: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  storage_path: string;
  artwork_url: string | null;
  file_name: string;
  file_size: number;
  created_at: string;
  updated_at: string;
}

export interface SupabasePlaylist {
  id: string;
  user_id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface SupabasePlaylistItem {
  id: string;
  playlist_id: string;
  track_id: string;
  position: number;
  added_at: string;
}

export interface SupabaseFavorite {
  id: string;
  user_id: string;
  track_id: string;
  created_at: string;
}

export interface SupabaseRecentlyPlayed {
  id: string;
  user_id: string;
  track_id: string;
  played_at: string;
}

export interface SupabasePreferences {
  user_id: string;
  theme: 'light' | 'dark';
  sort_by: 'name' | 'dateAdded' | 'duration' | 'artist';
  sort_order: 'asc' | 'desc';
  view_mode: 'grid' | 'list';
  updated_at: string;
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function getCurrentUserId(): Promise<string | null> {
  const user = await getCurrentUser();
  return user?.id || null;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
}

export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  return { data, error };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

export async function onAuthStateChange(callback: (user: any) => void) {
  return supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user || null);
  });
}

export async function uploadAudioFile(
  userId: string,
  file: File,
  _onProgress?: (progress: number) => void
): Promise<{ path: string; url: string } | null> {
  const fileName = `${userId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
  
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    console.error('Upload error:', error);
    return null;
  }

  const { data: urlData } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(data.path);

  return { path: data.path, url: urlData.publicUrl };
}

export async function deleteAudioFile(storagePath: string): Promise<boolean> {
  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .remove([storagePath]);

  if (error) {
    console.error('Delete file error:', error);
    return false;
  }
  return true;
}

export function getAudioUrl(storagePath: string): string {
  const { data } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(storagePath);
  return data.publicUrl;
}

export async function getTracks(): Promise<Track[]> {
  const userId = await getCurrentUserId();
  if (!userId) return [];

  const { data, error } = await supabase
    .from('tracks')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching tracks:', error);
    return [];
  }

  return data.map(convertDbTrackToTrack);
}

export async function saveTrack(track: Track, storagePath?: string): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) return;

  const { error } = await supabase.from('tracks').insert({
    id: track.id,
    user_id: userId,
    title: track.title,
    artist: track.artist,
    album: track.album,
    duration: track.duration,
    storage_path: storagePath,
    artwork_url: track.artwork,
    file_name: track.fileName,
    file_size: track.fileSize || 0,
  });

  if (error) {
    console.error('Error saving track:', error);
  }
}

export async function deleteTrack(id: string, storagePath?: string): Promise<void> {
  if (storagePath) {
    await deleteAudioFile(storagePath);
  }

  const { error } = await supabase
    .from('tracks')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting track:', error);
  }
}

export async function updateTrackFavorite(trackId: string, isFavorite: boolean): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) return;

  if (isFavorite) {
    await supabase.from('favorites').upsert({
      user_id: userId,
      track_id: trackId,
    }, {
      onConflict: 'user_id,track_id'
    });
  } else {
    await supabase
      .from('favorites')
      .delete()
      .eq('user_id', userId)
      .eq('track_id', trackId);
  }
}

export async function getFavorites(): Promise<string[]> {
  const userId = await getCurrentUserId();
  if (!userId) return [];

  const { data, error } = await supabase
    .from('favorites')
    .select('track_id')
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching favorites:', error);
    return [];
  }

  return data.map(f => f.track_id);
}

export async function getPlaylists(): Promise<Playlist[]> {
  const userId = await getCurrentUserId();
  if (!userId) return [];

  const { data, error } = await supabase
    .from('playlists')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching playlists:', error);
    return [];
  }

  const playlists = data.map(convertDbPlaylistToPlaylist);

  const itemsData = await supabase
    .from('playlist_items')
    .select('playlist_id, track_id, position')
    .in('playlist_id', data.map(p => p.id));

  if (!itemsData.error && itemsData.data) {
    for (const playlist of playlists) {
      const items = itemsData.data
        .filter(i => i.playlist_id === playlist.id)
        .sort((a, b) => a.position - b.position);
      playlist.trackIds = items.map(i => i.track_id);
    }
  }

  return playlists;
}

export async function savePlaylist(playlist: Playlist): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) return;

  const { error: playlistError } = await supabase.from('playlists').upsert({
    id: playlist.id,
    user_id: userId,
    name: playlist.name,
    description: playlist.description,
  }, {
    onConflict: 'id'
  });

  if (playlistError) {
    console.error('Error saving playlist:', playlistError);
  }

  await supabase
    .from('playlist_items')
    .delete()
    .eq('playlist_id', playlist.id);

  for (let i = 0; i < playlist.trackIds.length; i++) {
    await supabase.from('playlist_items').insert({
      playlist_id: playlist.id,
      track_id: playlist.trackIds[i],
      position: i,
    });
  }
}

export async function deletePlaylist(id: string): Promise<void> {
  await supabase
    .from('playlist_items')
    .delete()
    .eq('playlist_id', id);

  const { error } = await supabase
    .from('playlists')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting playlist:', error);
  }
}

export async function addToPlaylist(playlistId: string, trackId: string): Promise<void> {
  const { data: existing } = await supabase
    .from('playlist_items')
    .select('position')
    .eq('playlist_id', playlistId)
    .order('position', { ascending: false })
    .limit(1);

  const maxPosition = existing && existing.length > 0 ? existing[0].position : -1;

  await supabase.from('playlist_items').insert({
    playlist_id: playlistId,
    track_id: trackId,
    position: maxPosition + 1,
  });
}

export async function removeFromPlaylist(playlistId: string, trackId: string): Promise<void> {
  await supabase
    .from('playlist_items')
    .delete()
    .eq('playlist_id', playlistId)
    .eq('track_id', trackId);
}

export async function getRecentlyPlayed(): Promise<RecentlyPlayed[]> {
  const userId = await getCurrentUserId();
  if (!userId) return [];

  const { data, error } = await supabase
    .from('recently_played')
    .select('track_id, played_at')
    .eq('user_id', userId)
    .order('played_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('Error fetching recently played:', error);
    return [];
  }

  return data.map(r => ({
    trackId: r.track_id,
    playedAt: new Date(r.played_at).getTime(),
  }));
}

export async function addToRecentlyPlayed(trackId: string): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) return;

  await supabase.from('recently_played').insert({
    user_id: userId,
    track_id: trackId,
  });

  const { data: allPlayed } = await supabase
    .from('recently_played')
    .select('id')
    .eq('user_id', userId)
    .order('played_at', { ascending: false });

  if (allPlayed && allPlayed.length > 50) {
    const toDelete = allPlayed.slice(50).map(r => r.id);
    await supabase.from('recently_played').delete().in('id', toDelete);
  }
}

export async function clearRecentlyPlayed(): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) return;

  await supabase
    .from('recently_played')
    .delete()
    .eq('user_id', userId);
}

export async function getPreferences(): Promise<Preferences> {
  const userId = await getCurrentUserId();
  if (!userId) {
    return {
      theme: 'dark',
      sortBy: 'dateAdded',
      sortOrder: 'desc',
      viewMode: 'grid',
    };
  }

  const { data, error } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    return {
      theme: 'dark',
      sortBy: 'dateAdded',
      sortOrder: 'desc',
      viewMode: 'grid',
    };
  }

  return {
    theme: data.theme,
    sortBy: data.sort_by,
    sortOrder: data.sort_order,
    viewMode: data.view_mode,
  };
}

export async function savePreferences(prefs: Preferences): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) return;

  await supabase.from('user_preferences').upsert({
    user_id: userId,
    theme: prefs.theme,
    sort_by: prefs.sortBy,
    sort_order: prefs.sortOrder,
    view_mode: prefs.viewMode,
  }, {
    onConflict: 'user_id'
  });
}

export async function incrementPlayCount(_trackId: string): Promise<void> {
  // Not needed with Supabase - play count is tracked differently
}

export async function updateTrackMetadata(
  trackId: string,
  metadata: { title?: string; artist?: string; album?: string }
): Promise<void> {
  const updates: any = {};
  if (metadata.title !== undefined) updates.title = metadata.title;
  if (metadata.artist !== undefined) updates.artist = metadata.artist;
  if (metadata.album !== undefined) updates.album = metadata.album;
  updates.updated_at = new Date().toISOString();

  const { error } = await supabase
    .from('tracks')
    .update(updates)
    .eq('id', trackId);

  if (error) {
    console.error('Error updating track:', error);
  }
}

function convertDbTrackToTrack(db: any): Track {
  return {
    id: db.id,
    title: db.title,
    artist: db.artist,
    album: db.album,
    duration: db.duration,
    artwork: db.artwork_url,
    fileBlob: null as any,
    fileName: db.file_name,
    fileSize: db.file_size,
    storagePath: db.storage_path,
    publicUrl: db.storage_path ? getAudioUrl(db.storage_path) : null,
    dateAdded: new Date(db.created_at).getTime(),
    playCount: 0,
    isFavorite: false,
  };
}

function convertDbPlaylistToPlaylist(db: any): Playlist {
  return {
    id: db.id,
    name: db.name,
    description: db.description,
    trackIds: [],
    dateCreated: new Date(db.created_at).getTime(),
    dateModified: new Date(db.updated_at).getTime(),
  };
}
