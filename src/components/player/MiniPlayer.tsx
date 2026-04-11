import { Play, Pause, SkipBack, SkipForward, Heart, ListMusic } from 'lucide-react';
import { useStore } from '../../stores/appStore';
import { formatDuration, generatePlaceholderArtwork } from '../../services/metadataService';
import styles from './MiniPlayer.module.css';

interface MiniPlayerProps {
  onExpand: () => void;
  onOpenQueue: () => void;
}

export function MiniPlayer({ onExpand, onOpenQueue }: MiniPlayerProps) {
  const { 
    currentTrack, 
    isPlaying, 
    isAutoPlay,
    togglePlay, 
    nextTrack, 
    previousTrack, 
    currentTime, 
    duration,
    toggleFavorite
  } = useStore();
  
  if (!currentTrack) return null;
  
  const artwork = currentTrack.artwork || generatePlaceholderArtwork(currentTrack.title + currentTrack.artist);
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  
  return (
    <div className={styles.miniPlayer} onClick={onExpand}>
      <div className={styles.progressBar} style={{ width: `${progress}%` }} />
      
      <div className={styles.content}>
        <div className={styles.trackInfo}>
          <img src={artwork} alt={currentTrack.title} className={styles.artwork} />
          <div className={styles.text}>
            <span className={styles.title}>{currentTrack.title}</span>
            <span className={styles.artist}>{currentTrack.artist}</span>
          </div>
        </div>
        
        <div className={styles.controls}>
          <button 
            className={styles.controlBtn} 
            onClick={(e) => { e.stopPropagation(); previousTrack(); }}
          >
            <SkipBack size={20} />
          </button>
          
          <button 
            className={`${styles.controlBtn} ${styles.playBtn}`} 
            onClick={(e) => { e.stopPropagation(); togglePlay(); }}
          >
            {isPlaying ? <Pause size={24} /> : <Play size={24} />}
          </button>
          
          <button 
            className={styles.controlBtn} 
            onClick={(e) => { e.stopPropagation(); nextTrack(); }}
          >
            <SkipForward size={20} />
          </button>
        </div>
        
        <div className={styles.actions}>
          <button 
            className={`${styles.actionBtn} ${currentTrack.isFavorite ? styles.favorited : ''}`}
            onClick={(e) => { e.stopPropagation(); toggleFavorite(currentTrack.id); }}
          >
            <Heart size={18} fill={currentTrack.isFavorite ? 'currentColor' : 'none'} />
          </button>
          
          <button 
            className={styles.actionBtn}
            onClick={(e) => { e.stopPropagation(); onOpenQueue(); }}
          >
            <ListMusic size={18} />
          </button>
          
          <span className={styles.time}>
            {formatDuration(currentTime)} / {formatDuration(duration)}
          </span>
          
          {isAutoPlay && (
            <span className={styles.autoPlayIndicator} title="Auto-play On">AP</span>
          )}
        </div>
      </div>
    </div>
  );
}
