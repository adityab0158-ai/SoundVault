import { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Play, Pause, SkipBack, SkipForward, 
  Repeat, Repeat1, Shuffle, Volume2, Volume1, VolumeX,
  Clock, ChevronDown, MoreHorizontal, ListPlus, Heart
} from 'lucide-react';
import { useStore } from '../../stores/appStore';
import { formatDuration, generatePlaceholderArtwork } from '../../services/metadataService';
import type { PlaybackSpeed, RepeatMode } from '../../types';
import { QueuePanel } from './QueuePanel';
import styles from './FullPlayer.module.css';

interface FullPlayerProps {
  onClose: () => void;
}

export function FullPlayer({ onClose }: FullPlayerProps) {
  const {
    currentTrack,
    isPlaying,
    isAutoPlay,
    togglePlay,
    nextTrack,
    previousTrack,
    currentTime,
    duration,
    seek,
    volume,
    setVolume,
    isMuted,
    toggleMute,
    repeatMode,
    setRepeatMode,
    isShuffled,
    toggleShuffle,
    toggleAutoPlay,
    playbackSpeed,
    setPlaybackSpeed,
    toggleFavorite,
    playlists,
    addToPlaylist,
  } = useStore();
  
  const [showQueue, setShowQueue] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showAddToPlaylist, setShowAddToPlaylist] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragTime, setDragTime] = useState(0);
  const seekBarRef = useRef<HTMLDivElement>(null);
  
  const artwork = currentTrack?.artwork || generatePlaceholderArtwork(currentTrack?.title + '|' + currentTrack?.artist || 'default');
  
  const progress = isDragging ? dragTime : currentTime;
  const progressPercent = duration > 0 ? (progress / duration) * 100 : 0;
  
  const handleSeekBarClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!seekBarRef.current || !duration) return;
    const rect = seekBarRef.current.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    seek(percent * duration);
  }, [duration, seek]);
  
  const handleSeekBarDrag = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!seekBarRef.current || !duration || !isDragging) return;
    const rect = seekBarRef.current.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setDragTime(percent * duration);
  }, [duration, isDragging]);
  
  const handleDragStart = () => setIsDragging(true);
  const handleDragEnd = () => {
    if (isDragging) {
      seek(dragTime);
      setIsDragging(false);
    }
  };
  
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVolume(parseFloat(e.target.value));
  };
  
  const handleRepeatCycle = () => {
    const modes: RepeatMode[] = ['none', 'all', 'one'];
    const currentIndex = modes.indexOf(repeatMode);
    setRepeatMode(modes[(currentIndex + 1) % modes.length]);
  };
  
  const speedOptions: PlaybackSpeed[] = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
  
  useEffect(() => {
    const handleMouseUp = () => handleDragEnd();
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, [isDragging]);
  
  if (!currentTrack) return null;
  
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.player} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <button className={styles.closeBtn} onClick={onClose}>
            <ChevronDown size={24} />
          </button>
          <span className={styles.nowPlaying}>Now Playing</span>
          <button className={styles.moreBtn}>
            <MoreHorizontal size={24} />
          </button>
        </div>
        
        <div className={styles.content}>
          <div className={styles.artworkContainer}>
            <img src={artwork} alt={currentTrack.title} className={styles.artwork} />
          </div>
          
          <div className={styles.trackInfo}>
            <div className={styles.titleRow}>
              <h1 className={styles.title}>{currentTrack.title}</h1>
              <button 
                className={`${styles.favoriteBtn} ${currentTrack.isFavorite ? styles.favorited : ''}`}
                onClick={() => toggleFavorite(currentTrack.id)}
              >
                <Heart size={24} fill={currentTrack.isFavorite ? 'currentColor' : 'none'} />
              </button>
            </div>
            <p className={styles.artist}>{currentTrack.artist}</p>
            <p className={styles.album}>{currentTrack.album}</p>
          </div>
          
          <div className={styles.seekContainer}>
            <span className={styles.time}>{formatDuration(progress)}</span>
            <div 
              ref={seekBarRef}
              className={styles.seekBar}
              onClick={handleSeekBarClick}
              onMouseMove={handleSeekBarDrag}
              onMouseDown={handleDragStart}
              onMouseLeave={() => isDragging && handleDragEnd()}
            >
              <div className={styles.seekTrack}>
                <div className={styles.seekFill} style={{ width: `${progressPercent}%` }} />
                <div className={styles.seekThumb} style={{ left: `${progressPercent}%` }} />
              </div>
            </div>
            <span className={styles.time}>{formatDuration(duration)}</span>
          </div>
          
          <div className={styles.controls}>
            <button 
              className={`${styles.controlBtn} ${isShuffled ? styles.active : ''}`}
              onClick={toggleShuffle}
            >
              <Shuffle size={20} />
            </button>
            
            <button className={styles.controlBtn} onClick={previousTrack}>
              <SkipBack size={24} />
            </button>
            
            <button className={`${styles.controlBtn} ${styles.playBtn}`} onClick={togglePlay}>
              {isPlaying ? <Pause size={32} /> : <Play size={32} />}
            </button>
            
            <button className={styles.controlBtn} onClick={nextTrack}>
              <SkipForward size={24} />
            </button>
            
            <button 
              className={`${styles.controlBtn} ${repeatMode !== 'none' ? styles.active : ''}`}
              onClick={handleRepeatCycle}
              title={`Repeat: ${repeatMode}`}
            >
              {repeatMode === 'one' ? <Repeat1 size={20} /> : <Repeat size={20} />}
            </button>
            
            <button 
              className={`${styles.controlBtn} ${isAutoPlay ? styles.active : ''}`}
              onClick={toggleAutoPlay}
              title={`Auto-play: ${isAutoPlay ? 'On' : 'Off'}`}
            >
              <span style={{ fontSize: '10px', fontWeight: 'bold' }}>AP</span>
            </button>
          </div>
          
          <div className={styles.secondaryControls}>
            <div className={styles.volumeControl}>
              <button className={styles.iconBtn} onClick={toggleMute}>
                {isMuted || volume === 0 ? (
                  <VolumeX size={20} />
                ) : volume < 0.5 ? (
                  <Volume1 size={20} />
                ) : (
                  <Volume2 size={20} />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className={styles.volumeSlider}
              />
            </div>
            
            <div className={styles.actions}>
              <div className={styles.speedControl}>
                <button 
                  className={styles.iconBtn}
                  onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                >
                  <Clock size={18} />
                  <span className={styles.speedLabel}>{playbackSpeed}x</span>
                </button>
                {showSpeedMenu && (
                  <div className={styles.speedMenu}>
                    {speedOptions.map((speed) => (
                      <button
                        key={speed}
                        className={`${styles.speedOption} ${playbackSpeed === speed ? styles.active : ''}`}
                        onClick={() => { setPlaybackSpeed(speed); setShowSpeedMenu(false); }}
                      >
                        {speed}x
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              <div className={styles.addToPlaylistContainer}>
                <button 
                  className={styles.iconBtn}
                  onClick={() => setShowAddToPlaylist(!showAddToPlaylist)}
                >
                  <ListPlus size={20} />
                </button>
                {showAddToPlaylist && (
                  <div className={styles.addToPlaylistMenu}>
                    {playlists.length === 0 ? (
                      <span className={styles.emptyText}>No playlists yet</span>
                    ) : (
                      playlists.map((playlist) => (
                        <button
                          key={playlist.id}
                          className={styles.playlistOption}
                          onClick={() => { addToPlaylist(playlist.id, currentTrack.id); setShowAddToPlaylist(false); }}
                        >
                          {playlist.name}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
              
              <button 
                className={styles.iconBtn}
                onClick={() => setShowQueue(!showQueue)}
              >
                <ListPlus size={20} />
              </button>
            </div>
          </div>
        </div>
        
        {showQueue && (
          <QueuePanel onClose={() => setShowQueue(false)} />
        )}
      </div>
    </div>
  );
}
