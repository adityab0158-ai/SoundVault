import { useMemo } from 'react';
import { Clock, Trash2, Play, Grid, List } from 'lucide-react';
import { useStore } from '../../stores/appStore';
import { TrackCard } from './TrackCard';
import { TrackRow } from './TrackRow';
import styles from './RecentlyPlayedView.module.css';

export function RecentlyPlayedView() {
  const {
    tracks,
    recentlyPlayed,
    preferences,
    setViewMode,
    playTrack,
    playQueue,
    currentTrack,
    isPlaying,
    clearRecentlyPlayed,
  } = useStore();
  
  const playedTracks = useMemo(() => {
    return recentlyPlayed
      .map((rp) => tracks.find((t) => t.id === rp.trackId))
      .filter(Boolean) as typeof tracks;
  }, [recentlyPlayed, tracks]);
  
  const handlePlayTrack = (track: typeof tracks[0]) => {
    playTrack(track);
  };
  
  const handlePlayAll = () => {
    if (playedTracks.length > 0) {
      playQueue(playedTracks, 0);
    }
  };
  
  return (
    <div className={styles.view}>
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <div className={styles.iconContainer}>
            <Clock size={28} />
          </div>
          <div>
            <h1 className={styles.title}>Recently Played</h1>
            <span className={styles.count}>{playedTracks.length} tracks</span>
          </div>
        </div>
        
        <div className={styles.actions}>
          {playedTracks.length > 0 && (
            <button className={styles.playAllBtn} onClick={handlePlayAll}>
              <Play size={18} fill="currentColor" />
              <span>Play All</span>
            </button>
          )}
          
          {playedTracks.length > 0 && (
            <button className={styles.clearBtn} onClick={clearRecentlyPlayed}>
              <Trash2 size={18} />
              <span>Clear</span>
            </button>
          )}
          
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
      </div>
      
      {playedTracks.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>
            <Clock size={64} />
          </div>
          <h2 className={styles.emptyTitle}>No recently played</h2>
          <p className={styles.emptyText}>
            Tracks you play will appear here so you can easily find them again.
          </p>
        </div>
      ) : preferences.viewMode === 'grid' ? (
        <div className={styles.grid}>
          {playedTracks.map((track) => (
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
          {playedTracks.map((track, index) => (
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
