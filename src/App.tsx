import { useEffect, useState } from 'react';
import { useStore } from './stores/appStore';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { MiniPlayer } from './components/player/MiniPlayer';
import { FullPlayer } from './components/player/FullPlayer';
import { LibraryView } from './components/library/LibraryView';
import { FavoritesView } from './components/library/FavoritesView';
import { RecentlyPlayedView } from './components/library/RecentlyPlayedView';
import { PlaylistsView } from './components/playlist/PlaylistsView';
import { PlaylistDetailView } from './components/playlist/PlaylistDetailView';
import { CreatePlaylistModal } from './components/playlist/CreatePlaylistModal';
import { SettingsView } from './components/layout/SettingsView';
import { ToastContainer } from './components/common/Toast';
import styles from './App.module.css';

function App() {
  const { initialize, isLoading, currentView, currentTrack } = useStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [fullPlayerOpen, setFullPlayerOpen] = useState(false);
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);
  
  useEffect(() => {
    initialize();
  }, [initialize]);
  
  if (isLoading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
        <p>Loading your library...</p>
      </div>
    );
  }
  
  const renderContent = () => {
    switch (currentView) {
      case 'library':
        return <LibraryView />;
      case 'favorites':
        return <FavoritesView />;
      case 'recent':
        return <RecentlyPlayedView />;
      case 'playlists':
        return <PlaylistsView onCreatePlaylist={() => setShowCreatePlaylist(true)} />;
      case 'playlist-detail':
        return <PlaylistDetailView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <LibraryView />;
    }
  };
  
  return (
    <div className={styles.app}>
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        onCreatePlaylist={() => setShowCreatePlaylist(true)}
      />
      
      <div className={styles.main}>
        <Header onMenuClick={() => setSidebarOpen(true)} />
        
        <main className={styles.content}>
          {renderContent()}
        </main>
      </div>
      
      <MiniPlayer 
        onExpand={() => setFullPlayerOpen(true)}
        onOpenQueue={() => setFullPlayerOpen(true)}
      />
      
      {fullPlayerOpen && currentTrack && (
        <FullPlayer onClose={() => setFullPlayerOpen(false)} />
      )}
      
      {showCreatePlaylist && (
        <CreatePlaylistModal onClose={() => setShowCreatePlaylist(false)} />
      )}
      
      <ToastContainer />
    </div>
  );
}

export default App;
