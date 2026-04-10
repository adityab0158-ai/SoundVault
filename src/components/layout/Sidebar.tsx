import { useStore } from '../../stores/appStore';
import { Library, Heart, Clock, ListMusic, Settings, Plus, ChevronRight } from 'lucide-react';
import styles from './Sidebar.module.css';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onCreatePlaylist: () => void;
}

export function Sidebar({ isOpen, onClose, onCreatePlaylist }: SidebarProps) {
  const { currentView, setCurrentView, playlists, selectedPlaylistId, setSelectedPlaylistId } = useStore();
  
  const navItems = [
    { id: 'library', icon: Library, label: 'Library' },
    { id: 'favorites', icon: Heart, label: 'Favorites' },
    { id: 'recent', icon: Clock, label: 'Recently Played' },
    { id: 'playlists', icon: ListMusic, label: 'Playlists' },
  ] as const;
  
  return (
    <>
      <div className={`${styles.overlay} ${isOpen ? styles.open : ''}`} onClick={onClose} />
      <aside className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}>
        <div className={styles.logo}>
          <div className={styles.logoIcon}>
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <circle cx="14" cy="14" r="13" stroke="url(#logoGradient)" strokeWidth="2"/>
              <circle cx="14" cy="14" r="4" fill="url(#logoGradient)"/>
              <circle cx="14" cy="14" r="8" stroke="url(#logoGradient)" strokeWidth="1" strokeDasharray="2 2"/>
              <defs>
                <linearGradient id="logoGradient" x1="0" y1="0" x2="28" y2="28">
                  <stop stopColor="var(--accent-primary)"/>
                  <stop offset="1" stopColor="var(--accent-secondary)"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <span className={styles.logoText}>SoundVault</span>
        </div>
        
        <nav className={styles.nav}>
          <div className={styles.navSection}>
            {navItems.map((item) => (
              <button
                key={item.id}
                className={`${styles.navItem} ${currentView === item.id ? styles.active : ''}`}
                onClick={() => setCurrentView(item.id as typeof currentView)}
              >
                <item.icon size={20} />
                <span>{item.label}</span>
              </button>
            ))}
          </div>
          
          <div className={styles.divider} />
          
          <div className={styles.playlistSection}>
            <div className={styles.sectionHeader}>
              <span>Playlists</span>
              <button className={styles.addBtn} onClick={onCreatePlaylist} title="Create playlist">
                <Plus size={18} />
              </button>
            </div>
            
            <div className={styles.playlistList}>
              {playlists.map((playlist) => (
                <button
                  key={playlist.id}
                  className={`${styles.playlistItem} ${selectedPlaylistId === playlist.id ? styles.active : ''}`}
                  onClick={() => setSelectedPlaylistId(playlist.id)}
                >
                  <ListMusic size={18} />
                  <span className={styles.playlistName}>{playlist.name}</span>
                  <ChevronRight size={14} className={styles.chevron} />
                </button>
              ))}
            </div>
          </div>
        </nav>
        
        <div className={styles.footer}>
          <button
            className={`${styles.navItem} ${currentView === 'settings' ? styles.active : ''}`}
            onClick={() => setCurrentView('settings')}
          >
            <Settings size={20} />
            <span>Settings</span>
          </button>
        </div>
      </aside>
    </>
  );
}
