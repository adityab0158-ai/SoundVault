import { useState, useMemo } from 'react';
import { ArrowLeft, Play, Pencil, Trash2, X, ListMusic } from 'lucide-react';
import { useStore } from '../../stores/appStore';
import { formatDurationLong } from '../../services/metadataService';
import { TrackRow } from '../library/TrackRow';
import styles from './PlaylistDetailView.module.css';

export function PlaylistDetailView() {
  const {
    selectedPlaylistId,
    playlists,
    tracks,
    setSelectedPlaylistId,
    updatePlaylist,
    deletePlaylist,
    removeFromPlaylist,
    playQueue,
    currentTrack,
    isPlaying,
  } = useStore();
  
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  
  const playlist = playlists.find((p) => p.id === selectedPlaylistId);
  
  const playlistTracks = useMemo(() => {
    if (!playlist) return [];
    return playlist.trackIds
      .map((id) => tracks.find((t) => t.id === id))
      .filter(Boolean) as typeof tracks;
  }, [playlist, tracks]);
  
  const totalDuration = useMemo(() => {
    return playlistTracks.reduce((sum, t) => sum + t.duration, 0);
  }, [playlistTracks]);
  
  const artwork = playlistTracks[0]?.artwork || null;
  
  if (!playlist) {
    return (
      <div className={styles.view}>
        <p>Playlist not found</p>
      </div>
    );
  }
  
  const handleBack = () => {
    setSelectedPlaylistId(null);
  };
  
  const handleEditStart = () => {
    setEditName(playlist.name);
    setEditDescription(playlist.description);
    setIsEditing(true);
  };
  
  const handleEditSave = async () => {
    await updatePlaylist(playlist.id, {
      name: editName,
      description: editDescription,
    });
    setIsEditing(false);
  };
  
  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this playlist?')) {
      await deletePlaylist(playlist.id);
      setSelectedPlaylistId(null);
    }
  };
  
  const handlePlayAll = () => {
    if (playlistTracks.length > 0) {
      playQueue(playlistTracks, 0);
    }
  };
  
  const handlePlayTrack = (track: typeof tracks[0]) => {
    const index = playlistTracks.findIndex((t) => t.id === track.id);
    if (index >= 0) {
      playQueue(playlistTracks, index);
    }
  };
  
  return (
    <div className={styles.view}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={handleBack}>
          <ArrowLeft size={20} />
        </button>
        
        <div className={styles.playlistInfo}>
          <div className={styles.artworkContainer}>
            {artwork ? (
              <img src={artwork} alt={playlist.name} className={styles.artwork} />
            ) : (
              <div className={styles.placeholder}>
                <ListMusic size={48} />
              </div>
            )}
          </div>
          
          <div className={styles.details}>
            <span className={styles.type}>Playlist</span>
            {isEditing ? (
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className={styles.nameInput}
                autoFocus
              />
            ) : (
              <h1 className={styles.name}>{playlist.name}</h1>
            )}
            
            {isEditing ? (
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className={styles.descriptionInput}
                placeholder="Add a description..."
                rows={2}
              />
            ) : (
              <p className={styles.description}>
                {playlist.description || 'No description'}
              </p>
            )}
            
            <p className={styles.meta}>
              {playlistTracks.length} tracks • {formatDurationLong(totalDuration)}
            </p>
          </div>
        </div>
      </div>
      
      <div className={styles.actions}>
        <button className={styles.playBtn} onClick={handlePlayAll} disabled={playlistTracks.length === 0}>
          <Play size={20} fill="currentColor" />
          <span>Play All</span>
        </button>
        
        {isEditing ? (
          <>
            <button className={styles.actionBtn} onClick={() => setIsEditing(false)}>
              <X size={18} />
              <span>Cancel</span>
            </button>
            <button className={styles.saveBtn} onClick={handleEditSave}>
              Save
            </button>
          </>
        ) : (
          <>
            <button className={styles.actionBtn} onClick={handleEditStart}>
              <Pencil size={18} />
              <span>Edit</span>
            </button>
            <button className={`${styles.actionBtn} ${styles.danger}`} onClick={handleDelete}>
              <Trash2 size={18} />
              <span>Delete</span>
            </button>
          </>
        )}
      </div>
      
      {playlistTracks.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>
            <ListMusic size={48} />
          </div>
          <h3 className={styles.emptyTitle}>This playlist is empty</h3>
          <p className={styles.emptyText}>
            Add songs from your library to this playlist.
          </p>
        </div>
      ) : (
        <div className={styles.list}>
          <div className={styles.listHeader}>
            <span>#</span>
            <span>Title</span>
            <span>Album</span>
            <span>Duration</span>
          </div>
          {playlistTracks.map((track, index) => (
            <div key={track.id} className={styles.trackRow}>
              <TrackRow
                track={track}
                index={index}
                isPlaying={isPlaying}
                isCurrentTrack={currentTrack?.id === track.id}
                onPlay={() => handlePlayTrack(track)}
              />
              <button
                className={styles.removeBtn}
                onClick={() => removeFromPlaylist(playlist.id, track.id)}
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
