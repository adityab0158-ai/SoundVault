import { useState, useMemo, useRef } from 'react';
import { Plus, Grid, List, ArrowUpDown, Upload, Shuffle, Play, Pause } from 'lucide-react';
import { useStore } from '../../stores/appStore';
import { TrackCard } from './TrackCard';
import { TrackRow } from './TrackRow';
import type { SortOption, Track } from '../../types';
import styles from './LibraryView.module.css';

export function LibraryView() {
  const {
    tracks,
    preferences,
    setSortBy,
    setSortOrder,
    setViewMode,
    addTrack,
    playTrack,
    playQueue,
    shuffleAll,
    currentTrack,
    isPlaying,
    searchQuery,
    updateTrackMetadata,
  } = useStore();
  
  const [isDragging, setIsDragging] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [editingTrack, setEditingTrack] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editArtist, setEditArtist] = useState('');
  const [editAlbum, setEditAlbum] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const filteredAndSortedTracks = useMemo(() => {
    let result = [...tracks];
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(query) ||
          t.artist.toLowerCase().includes(query) ||
          t.album.toLowerCase().includes(query)
      );
    }
    
    result.sort((a, b) => {
      let comparison = 0;
      
      switch (preferences.sortBy) {
        case 'name':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'dateAdded':
          comparison = a.dateAdded - b.dateAdded;
          break;
        case 'duration':
          comparison = a.duration - b.duration;
          break;
        case 'artist':
          comparison = a.artist.localeCompare(b.artist);
          break;
      }
      
      return preferences.sortOrder === 'asc' ? comparison : -comparison;
    });
    
    return result;
  }, [tracks, searchQuery, preferences.sortBy, preferences.sortOrder]);
  
  const handleFiles = async (files: FileList | null) => {
    if (!files) return;
    
    const audioFiles = Array.from(files).filter((file) =>
      ['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/aac', 'audio/flac', 'audio/ogg', 'audio/x-m4a'].includes(file.type) ||
      /\.(mp3|wav|m4a|aac|flac|ogg)$/i.test(file.name)
    );
    
    for (const file of audioFiles) {
      try {
        await addTrack(file);
      } catch (error) {
        console.error('Failed to add track:', file.name, error);
      }
    }
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const handleDragLeave = () => {
    setIsDragging(false);
  };
  
  const handlePlayTrack = (track: Track) => {
    playTrack(track);
  };
  
  const handleEditStart = (track: Track) => {
    setEditingTrack(track.id);
    setEditTitle(track.title);
    setEditArtist(track.artist);
    setEditAlbum(track.album);
  };
  
  const handleEditSave = async () => {
    if (editingTrack) {
      await updateTrackMetadata(editingTrack, {
        title: editTitle,
        artist: editArtist,
        album: editAlbum,
      });
      setEditingTrack(null);
    }
  };
  
  const sortOptions: { value: SortOption; label: string }[] = [
    { value: 'name', label: 'Name' },
    { value: 'dateAdded', label: 'Date Added' },
    { value: 'duration', label: 'Duration' },
    { value: 'artist', label: 'Artist' },
  ];
  
  return (
    <div
      className={`${styles.library} ${isDragging ? styles.dragging : ''}`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      {isDragging && (
        <div className={styles.dropOverlay}>
          <Upload size={64} />
          <p>Drop audio files here</p>
        </div>
      )}
      
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Library</h1>
          <span className={styles.count}>{tracks.length} tracks</span>
        </div>
        
        <div className={styles.actions}>
          <div className={styles.sortContainer}>
            <button 
              className={styles.actionBtn}
              onClick={() => setShowSortMenu(!showSortMenu)}
            >
              <ArrowUpDown size={18} />
              <span>Sort</span>
            </button>
            
            {showSortMenu && (
              <div className={styles.sortMenu}>
                {sortOptions.map((option) => (
                  <div key={option.value} className={styles.sortSection}>
                    <span className={styles.sortLabel}>{option.label}</span>
                    <div className={styles.sortOptions}>
                      <button
                        className={`${styles.sortOption} ${preferences.sortBy === option.value && preferences.sortOrder === 'asc' ? styles.active : ''}`}
                        onClick={() => { setSortBy(option.value); setSortOrder('asc'); setShowSortMenu(false); }}
                      >
                        A-Z
                      </button>
                      <button
                        className={`${styles.sortOption} ${preferences.sortBy === option.value && preferences.sortOrder === 'desc' ? styles.active : ''}`}
                        onClick={() => { setSortBy(option.value); setSortOrder('desc'); setShowSortMenu(false); }}
                      >
                        Z-A
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
          
          {tracks.length > 0 && (
            <>
              <button 
                className={styles.addBtn} 
                onClick={() => playQueue(filteredAndSortedTracks, 0)}
                style={{ backgroundColor: 'var(--primary)', marginRight: '8px' }}
              >
                {isPlaying && currentTrack ? <Pause size={20} /> : <Play size={20} />}
                <span>Play All</span>
              </button>
              
              <button 
                className={styles.addBtn} 
                onClick={shuffleAll}
              >
                <Shuffle size={20} />
                <span>Shuffle</span>
              </button>
            </>
          )}
          
          <button className={styles.addBtn} onClick={() => fileInputRef.current?.click()}>
            <Plus size={20} />
            <span>Add Music</span>
          </button>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            multiple
            onChange={(e) => handleFiles(e.target.files)}
            style={{ display: 'none' }}
          />
        </div>
      </div>
      
      {tracks.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>
            <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
              <circle cx="40" cy="40" r="38" stroke="var(--border)" strokeWidth="2" strokeDasharray="4 4"/>
              <path d="M30 50V30L50 40L30 50Z" fill="var(--text-tertiary)" opacity="0.5"/>
            </svg>
          </div>
          <h2 className={styles.emptyTitle}>Your library is empty</h2>
          <p className={styles.emptyText}>
            Add music to your library by clicking "Add Music" or drag and drop audio files here.
          </p>
          <button className={styles.emptyBtn} onClick={() => fileInputRef.current?.click()}>
            <Plus size={20} />
            <span>Add Music</span>
          </button>
        </div>
      ) : filteredAndSortedTracks.length === 0 ? (
        <div className={styles.empty}>
          <h2 className={styles.emptyTitle}>No tracks found</h2>
          <p className={styles.emptyText}>
            No tracks match your search "{searchQuery}"
          </p>
        </div>
      ) : (
        <>
          {preferences.viewMode === 'grid' ? (
            <div className={styles.grid}>
              {filteredAndSortedTracks.map((track) => (
                <TrackCard
                  key={track.id}
                  track={track}
                  isPlaying={isPlaying}
                  isCurrentTrack={currentTrack?.id === track.id}
                  onPlay={() => handlePlayTrack(track)}
                  onEdit={() => handleEditStart(track)}
                />
              ))}
            </div>
          ) : (
            <div className={styles.list}>
              <div className={styles.listHeader}>
                <span>#</span>
                <span>Title</span>
                <span>Album</span>
                <span>Date Added</span>
                <span>Duration</span>
              </div>
              {filteredAndSortedTracks.map((track, index) => (
                <TrackRow
                  key={track.id}
                  track={track}
                  index={index}
                  isPlaying={isPlaying}
                  isCurrentTrack={currentTrack?.id === track.id}
                  onPlay={() => handlePlayTrack(track)}
                  onEdit={() => handleEditStart(track)}
                />
              ))}
            </div>
          )}
        </>
      )}
      
      {editingTrack && (
        <div className={styles.modalOverlay} onClick={() => setEditingTrack(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>Edit Track Info</h3>
            <div className={styles.form}>
              <label className={styles.label}>
                <span>Title</span>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className={styles.input}
                />
              </label>
              <label className={styles.label}>
                <span>Artist</span>
                <input
                  type="text"
                  value={editArtist}
                  onChange={(e) => setEditArtist(e.target.value)}
                  className={styles.input}
                />
              </label>
              <label className={styles.label}>
                <span>Album</span>
                <input
                  type="text"
                  value={editAlbum}
                  onChange={(e) => setEditAlbum(e.target.value)}
                  className={styles.input}
                />
              </label>
            </div>
            <div className={styles.modalActions}>
              <button className={styles.cancelBtn} onClick={() => setEditingTrack(null)}>
                Cancel
              </button>
              <button className={styles.saveBtn} onClick={handleEditSave}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
