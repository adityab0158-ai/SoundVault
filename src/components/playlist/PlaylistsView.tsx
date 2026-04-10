import { useMemo } from 'react';
import { Plus, ListMusic, Play } from 'lucide-react';
import { useStore } from '../../stores/appStore';
import { formatDurationLong } from '../../services/metadataService';
import styles from './PlaylistsView.module.css';

interface PlaylistsViewProps {
  onCreatePlaylist: () => void;
}

export function PlaylistsView({ onCreatePlaylist }: PlaylistsViewProps) {
  const { playlists, tracks, setSelectedPlaylistId, playQueue } = useStore();
  
  const playlistData = useMemo(() => {
    return playlists.map((playlist) => {
      const playlistTracks = playlist.trackIds
        .map((id) => tracks.find((t) => t.id === id))
        .filter(Boolean) as typeof tracks;
      
      const totalDuration = playlistTracks.reduce((sum, t) => sum + t.duration, 0);
      const artwork = playlistTracks[0]?.artwork;
      
      return {
        ...playlist,
        trackCount: playlist.trackIds.length,
        totalDuration,
        artwork,
      };
    });
  }, [playlists, tracks]);
  
  const handlePlayPlaylist = (playlist: typeof playlistData[0]) => {
    const playlistTracks = playlist.trackIds
      .map((id) => tracks.find((t) => t.id === id))
      .filter(Boolean) as typeof tracks;
    
    if (playlistTracks.length > 0) {
      playQueue(playlistTracks, 0);
    }
  };
  
  return (
    <div className={styles.view}>
      <div className={styles.header}>
        <h1 className={styles.title}>Playlists</h1>
        <button className={styles.createBtn} onClick={onCreatePlaylist}>
          <Plus size={20} />
          <span>New Playlist</span>
        </button>
      </div>
      
      {playlists.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>
            <ListMusic size={64} />
          </div>
          <h2 className={styles.emptyTitle}>No playlists yet</h2>
          <p className={styles.emptyText}>
            Create your first playlist to organize your music.
          </p>
          <button className={styles.emptyBtn} onClick={onCreatePlaylist}>
            <Plus size={20} />
            <span>Create Playlist</span>
          </button>
        </div>
      ) : (
        <div className={styles.grid}>
          {playlistData.map((playlist) => (
            <div
              key={playlist.id}
              className={styles.card}
              onClick={() => setSelectedPlaylistId(playlist.id)}
            >
              <div className={styles.artworkContainer}>
                {playlist.artwork ? (
                  <img src={playlist.artwork} alt={playlist.name} className={styles.artwork} />
                ) : (
                  <div className={styles.placeholder}>
                    <ListMusic size={40} />
                  </div>
                )}
                <button 
                  className={styles.playBtn}
                  onClick={(e) => { e.stopPropagation(); handlePlayPlaylist(playlist); }}
                >
                  <Play size={24} fill="currentColor" />
                </button>
              </div>
              
              <div className={styles.info}>
                <h3 className={styles.playlistName}>{playlist.name}</h3>
                <p className={styles.meta}>
                  {playlist.trackCount} tracks • {formatDurationLong(playlist.totalDuration)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
