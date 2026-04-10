import { Play, Heart, MoreHorizontal, Trash2, ListPlus, Edit2 } from 'lucide-react';
import type { Track } from '../../types';
import { useStore } from '../../stores/appStore';
import { formatDuration, generatePlaceholderArtwork } from '../../services/metadataService';
import { useState, useRef, useEffect } from 'react';
import styles from './TrackRow.module.css';

interface TrackRowProps {
  track: Track;
  index: number;
  isPlaying: boolean;
  isCurrentTrack: boolean;
  onPlay: () => void;
  onEdit?: () => void;
}

export function TrackRow({ track, index, isPlaying, isCurrentTrack, onPlay, onEdit }: TrackRowProps) {
  const { toggleFavorite, deleteTrack, addToPlaylist, playlists } = useStore();
  const [showMenu, setShowMenu] = useState(false);
  const [showPlaylistSubmenu, setShowPlaylistSubmenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  
  const artwork = track.artwork || generatePlaceholderArtwork(track.title + track.artist);
  
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
        setShowPlaylistSubmenu(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  return (
    <div className={`${styles.row} ${isCurrentTrack ? styles.playing : ''}`}>
      <span className={styles.index}>
        {isPlaying && isCurrentTrack ? (
          <div className={styles.equalizer}>
            <span /><span /><span />
          </div>
        ) : (
          <span>{index + 1}</span>
        )}
      </span>
      
      <div className={styles.trackInfo} onClick={onPlay}>
        <img src={artwork} alt={track.title} className={styles.artwork} />
        <div className={styles.text}>
          <span className={`${styles.title} ${isCurrentTrack ? styles.active : ''}`}>
            {track.title}
          </span>
          <span className={styles.artist}>{track.artist}</span>
        </div>
      </div>
      
      <span className={styles.album}>{track.album}</span>
      <span className={styles.date}>
        {new Date(track.dateAdded).toLocaleDateString()}
      </span>
      <span className={styles.duration}>{formatDuration(track.duration)}</span>
      
      <button 
        className={`${styles.actionBtn} ${track.isFavorite ? styles.favorited : ''}`}
        onClick={() => toggleFavorite(track.id)}
      >
        <Heart size={16} fill={track.isFavorite ? 'currentColor' : 'none'} />
      </button>
      
      <div className={styles.menuContainer} ref={menuRef}>
        <button className={styles.actionBtn} onClick={() => setShowMenu(!showMenu)}>
          <MoreHorizontal size={16} />
        </button>
        
        {showMenu && (
          <div className={styles.menu}>
            <button className={styles.menuItem} onClick={() => { onPlay(); setShowMenu(false); }}>
              <Play size={14} />
              <span>Play</span>
            </button>
            
            <div 
              className={styles.menuItem} 
              onMouseEnter={() => setShowPlaylistSubmenu(true)}
              onMouseLeave={() => setShowPlaylistSubmenu(false)}
            >
              <ListPlus size={14} />
              <span>Add to Playlist</span>
              {showPlaylistSubmenu && (
                <div className={styles.submenu}>
                  {playlists.length === 0 ? (
                    <span className={styles.emptyText}>No playlists</span>
                  ) : (
                    playlists.map((playlist) => (
                      <button
                        key={playlist.id}
                        className={styles.submenuItem}
                        onClick={() => {
                          addToPlaylist(playlist.id, track.id);
                          setShowMenu(false);
                          setShowPlaylistSubmenu(false);
                        }}
                      >
                        {playlist.name}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
            
            {onEdit && (
              <button className={styles.menuItem} onClick={() => { onEdit(); setShowMenu(false); }}>
                <Edit2 size={14} />
                <span>Edit Info</span>
              </button>
            )}
            
            <button 
              className={`${styles.menuItem} ${styles.danger}`} 
              onClick={() => { deleteTrack(track.id); setShowMenu(false); }}
            >
              <Trash2 size={14} />
              <span>Delete</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
