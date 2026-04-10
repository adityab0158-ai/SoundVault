import { Play, Heart, MoreHorizontal, Trash2, ListPlus, Edit2 } from 'lucide-react';
import type { Track } from '../../types';
import { useStore } from '../../stores/appStore';
import { formatDuration, generatePlaceholderArtwork } from '../../services/metadataService';
import { useState, useRef, useEffect } from 'react';
import styles from './TrackCard.module.css';

interface TrackCardProps {
  track: Track;
  isPlaying: boolean;
  isCurrentTrack: boolean;
  onPlay: () => void;
  onEdit?: () => void;
}

export function TrackCard({ track, isPlaying, isCurrentTrack, onPlay, onEdit }: TrackCardProps) {
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
    <div className={`${styles.card} ${isCurrentTrack ? styles.playing : ''}`}>
      <div className={styles.artworkContainer} onClick={onPlay}>
        <img src={artwork} alt={track.title} className={styles.artwork} />
        <div className={styles.overlay}>
          <button className={styles.playBtn}>
            {isPlaying && isCurrentTrack ? (
              <div className={styles.equalizer}>
                <span /><span /><span />
              </div>
            ) : (
              <Play size={24} fill="currentColor" />
            )}
          </button>
        </div>
      </div>
      
      <div className={styles.info}>
        <span className={styles.title}>{track.title}</span>
        <span className={styles.artist}>{track.artist}</span>
        <span className={styles.duration}>{formatDuration(track.duration)}</span>
      </div>
      
      <button 
        className={`${styles.favoriteBtn} ${track.isFavorite ? styles.favorited : ''}`}
        onClick={() => toggleFavorite(track.id)}
      >
        <Heart size={16} fill={track.isFavorite ? 'currentColor' : 'none'} />
      </button>
      
      <div className={styles.menuContainer} ref={menuRef}>
        <button className={styles.menuBtn} onClick={() => setShowMenu(!showMenu)}>
          <MoreHorizontal size={18} />
        </button>
        
        {showMenu && (
          <div className={styles.menu}>
            <button className={styles.menuItem} onClick={onPlay}>
              <Play size={16} />
              <span>Play</span>
            </button>
            
            <div 
              className={styles.menuItem} 
              onMouseEnter={() => setShowPlaylistSubmenu(true)}
              onMouseLeave={() => setShowPlaylistSubmenu(false)}
            >
              <ListPlus size={16} />
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
                <Edit2 size={16} />
                <span>Edit Info</span>
              </button>
            )}
            
            <button 
              className={`${styles.menuItem} ${styles.danger}`} 
              onClick={() => { deleteTrack(track.id); setShowMenu(false); }}
            >
              <Trash2 size={16} />
              <span>Delete</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
