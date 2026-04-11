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

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  console.log('[Supabase] getCurrentUser:', user?.id || 'null');
  return user;
}

export async function getCurrentUserId(): Promise<string | null> {
  const user = await getCurrentUser();
  const userId = user?.id || null;
  console.log('[Supabase] getCurrentUserId:', userId);
  return userId;
}

export async function signIn(email: string, password: string) {
  console.log('[Supabase] Signing in:', email);
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) {
    console.error('[Supabase] Sign in error:', error);
  } else {
    console.log('[Supabase] Sign in success, user:', data.user?.id);
  }
  return { data, error };
}

export async function signUp(email: string, password: string) {
  console.log('[Supabase] Signing up:', email);
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  if (error) {
    console.error('[Supabase] Sign up error:', error);
  } else {
    console.log('[Supabase] Sign up success, user:', data.user?.id);
  }
  return { data, error };
}

export async function signOut() {
  console.log('[Supabase] Signing out');
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('[Supabase] Sign out error:', error);
  }
  return { error };
}

export async function onAuthStateChange(callback: (user: any) => void) {
  return supabase.auth.onAuthStateChange((event, session) => {
    console.log('[Supabase] Auth state change:', event, session?.user?.id || 'no user');
    callback(session?.user || null);
  });
}

export async function uploadAudioFile(
  userId: string,
  file: File
): Promise<{ path: string; url: string } | null> {
  console.log('[Supabase] Uploading file:', file.name, 'for user:', userId);
  
  const fileName = `${userId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
  
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    console.error('[Supabase] Upload error:', error);
    return null;
  }

  console.log('[Supabase] Upload success, path:', data.path);

  const { data: urlData } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(data.path);

  return { path: data.path, url: urlData.publicUrl };
}

export async function deleteAudioFile(storagePath: string): Promise<boolean> {
  console.log('[Supabase] Deleting file:', storagePath);
  
  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .remove([storagePath]);

  if (error) {
    console.error('[Supabase] Delete file error:', error);
    return false;
  }
  
  console.log('[Supabase] File deleted successfully');
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
  
  if (!userId) {
    console.log('[Supabase] getTracks: No user ID, returning empty array');
    return [];
  }

  console.log('[Supabase] getTracks: Fetching tracks for user:', userId);

  const { data, error } = await supabase
    .from('tracks')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[Supabase] getTracks error:', error);
    return [];
  }

  console.log('[Supabase] getTracks: Found', data?.length || 0, 'tracks');

  return data.map(convertDbTrackToTrack);
}

export async function saveTrack(track: Track, storagePath: string): Promise<boolean> {
  const userId = await getCurrentUserId();
  
  if (!userId) {
    console.error('[Supabase] saveTrack: No user ID');
    return false;
  }

  console.log('[Supabase] saveTrack: Inserting track:', track.id, 'for user:', userId);
  console.log('[Supabase] saveTrack: Track data:', {
    title: track.title,
    artist: track.artist,
    album: track.album,
    duration: track.duration,
    storagePath: storagePath,
  });

  const { data, error, status } = await supabase
    .from('tracks')
    .insert({
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
    })
    .select()
    .single();

  if (error) {
    console.error('[Supabase] saveTrack error:', error, 'Status:', status);
    return false;
  }

  console.log('[Supabase] saveTrack success, inserted track:', data?.id);
  return true;
}

export async function deleteTrack(id: string, storagePath?: string): Promise<void> {
  console.log('[Supabase] deleteTrack:', id, 'storagePath:', storagePath);
  
  if (storagePath) {
    await deleteAudioFile(storagePath);
  }

  const { error } = await supabase
    .from('tracks')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('[Supabase] deleteTrack error:', error);
  } else {
    console.log('[Supabase] deleteTrack success');
  }
}

export async function updateTrackFavorite(trackId: string, isFavorite: boolean): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) return;

  console.log('[Supabase] updateTrackFavorite:', trackId, isFavorite ? 'adding' : 'removing');

  if (isFavorite) {
    const { error } = await supabase.from('favorites').upsert({
      user_id: userId,
      track_id: trackId,
    }, {
      onConflict: 'user_id,track_id'
    });
    if (error) console.error('[Supabase] Add favorite error:', error);
  } else {
    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', userId)
      .eq('track_id', trackId);
    if (error) console.error('[Supabase] Remove favorite error:', error);
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
    console.error('[Supabase] getFavorites error:', error);
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
    console.error('[Supabase] getPlaylists error:', error);
    return [];
  }

  const playlists = data.map(convertDbPlaylistToPlaylist);

  if (data.length > 0) {
    const { data: itemsData } = await supabase
      .from('playlist_items')
      .select('playlist_id, track_id, position')
      .in('playlist_id', data.map(p => p.id));

    if (itemsData) {
      for (const playlist of playlists) {
        const items = itemsData
          .filter(i => i.playlist_id === playlist.id)
          .sort((a, b) => a.position - b.position);
        playlist.trackIds = items.map(i => i.track_id);
      }
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
    console.error('[Supabase] savePlaylist error:', playlistError);
    return;
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
    console.error('[Supabase] deletePlaylist error:', error);
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
    console.error('[Supabase] getRecentlyPlayed error:', error);
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
    console.error('[Supabase] updateTrackMetadata error:', error);
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
