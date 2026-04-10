import { X } from 'lucide-react';
import { useStore } from '../../stores/appStore';
import { formatDuration, generatePlaceholderArtwork } from '../../services/metadataService';
import styles from './QueuePanel.module.css';

interface QueuePanelProps {
  onClose: () => void;
}

export function QueuePanel({ onClose }: QueuePanelProps) {
  const { queue, queueIndex, playQueue } = useStore();
  
  const handlePlayTrack = (index: number) => {
    playQueue(queue, index);
  };
  
  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <h3 className={styles.title}>Queue</h3>
        <button className={styles.closeBtn} onClick={onClose}>
          <X size={20} />
        </button>
      </div>
      
      <div className={styles.content}>
        {queue.length === 0 ? (
          <div className={styles.empty}>
            <p className={styles.emptyText}>Queue is empty</p>
            <p className={styles.emptySubtext}>Add songs to your queue to see them here.</p>
          </div>
        ) : (
          <div className={styles.list}>
            {queue.map((track, index) => {
              const isCurrent = index === queueIndex;
              const artwork = track.artwork || generatePlaceholderArtwork(track.title + track.artist);
              
              return (
                <div
                  key={`${track.id}-${index}`}
                  className={`${styles.item} ${isCurrent ? styles.playing : ''}`}
                  onClick={() => handlePlayTrack(index)}
                >
                  <div className={styles.artworkContainer}>
                    <img src={artwork} alt={track.title} className={styles.artwork} />
                    {isCurrent && (
                      <div className={styles.playingOverlay}>
                        <div className={styles.equalizer}>
                          <span /><span /><span />
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className={styles.info}>
                    <span className={`${styles.trackTitle} ${isCurrent ? styles.active : ''}`}>
                      {track.title}
                    </span>
                    <span className={styles.trackArtist}>{track.artist}</span>
                  </div>
                  
                  <span className={styles.duration}>{formatDuration(track.duration)}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
