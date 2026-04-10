import { useMemo } from 'react';
import { Heart, Grid, List } from 'lucide-react';
import { useStore } from '../../stores/appStore';
import { TrackCard } from './TrackCard';
import { TrackRow } from './TrackRow';
import styles from './FavoritesView.module.css';

export function FavoritesView() {
  const {
    tracks,
    preferences,
    setViewMode,
    playTrack,
    currentTrack,
    isPlaying,
  } = useStore();
  
  const favoriteTracks = useMemo(() => {
    return tracks.filter((t) => t.isFavorite);
  }, [tracks]);
  
  const handlePlayTrack = (track: typeof tracks[0]) => {
    playTrack(track);
  };
  
  return (
    <div className={styles.view}>
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <div className={styles.iconContainer}>
            <Heart size={32} fill="currentColor" />
          </div>
          <div>
            <h1 className={styles.title}>Favorites</h1>
            <span className={styles.count}>{favoriteTracks.length} tracks</span>
          </div>
        </div>
        
        <div className={styles.viewToggle}>
          <button
            className={`${styles.viewBtn} ${preferences.viewMode === 'grid' ? styles.active : ''}`}
            onClick={() => setViewMode('grid')}
          >
            <Grid size={18} />
          </button>
          <button
            className={`${styles.viewBtn} ${preferences.viewMode === 'list' ? styles.active : ''}`}
            onClick={() => setViewMode('list')}
          >
            <List size={18} />
          </button>
        </div>
      </div>
      
      {favoriteTracks.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>
            <Heart size={64} />
          </div>
          <h2 className={styles.emptyTitle}>No favorites yet</h2>
          <p className={styles.emptyText}>
            Tap the heart icon on any track to add it to your favorites.
          </p>
        </div>
      ) : preferences.viewMode === 'grid' ? (
        <div className={styles.grid}>
          {favoriteTracks.map((track) => (
            <TrackCard
              key={track.id}
              track={track}
              isPlaying={isPlaying}
              isCurrentTrack={currentTrack?.id === track.id}
              onPlay={() => handlePlayTrack(track)}
            />
          ))}
        </div>
      ) : (
        <div className={styles.list}>
          <div className={styles.listHeader}>
            <span>#</span>
            <span>Title</span>
            <span>Album</span>
            <span>Duration</span>
          </div>
          {favoriteTracks.map((track, index) => (
            <TrackRow
              key={track.id}
              track={track}
              index={index}
              isPlaying={isPlaying}
              isCurrentTrack={currentTrack?.id === track.id}
              onPlay={() => handlePlayTrack(track)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
