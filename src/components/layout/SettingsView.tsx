import { Sun, Moon, Info } from 'lucide-react';
import { useStore } from '../../stores/appStore';
import styles from './SettingsView.module.css';

export function SettingsView() {
  const { preferences, setTheme, tracks } = useStore();
  
  const totalDuration = tracks.reduce((sum, t) => sum + t.duration, 0);
  const formatTotalDuration = () => {
    const hours = Math.floor(totalDuration / 3600);
    const minutes = Math.floor((totalDuration % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes} minutes`;
  };
  
  return (
    <div className={styles.view}>
      <h1 className={styles.title}>Settings</h1>
      
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Appearance</h2>
        
        <div className={styles.setting}>
          <div className={styles.settingInfo}>
            <span className={styles.settingLabel}>Theme</span>
            <span className={styles.settingDescription}>
              Choose your preferred color scheme
            </span>
          </div>
          
          <div className={styles.themeToggle}>
            <button
              className={`${styles.themeBtn} ${preferences.theme === 'light' ? styles.active : ''}`}
              onClick={() => setTheme('light')}
            >
              <Sun size={18} />
              <span>Light</span>
            </button>
            <button
              className={`${styles.themeBtn} ${preferences.theme === 'dark' ? styles.active : ''}`}
              onClick={() => setTheme('dark')}
            >
              <Moon size={18} />
              <span>Dark</span>
            </button>
          </div>
        </div>
      </div>
      
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Library</h2>
        
        <div className={styles.statGrid}>
          <div className={styles.stat}>
            <span className={styles.statValue}>{tracks.length}</span>
            <span className={styles.statLabel}>Tracks</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>{formatTotalDuration()}</span>
            <span className={styles.statLabel}>Total Duration</span>
          </div>
        </div>
      </div>
      
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>About</h2>
        
        <div className={styles.about}>
          <div className={styles.logoRow}>
            <div className={styles.logoIcon}>
              <svg width="32" height="32" viewBox="0 0 28 28" fill="none">
                <circle cx="14" cy="14" r="13" stroke="url(#logoGrad)" strokeWidth="2"/>
                <circle cx="14" cy="14" r="4" fill="url(#logoGrad)"/>
                <circle cx="14" cy="14" r="8" stroke="url(#logoGrad)" strokeWidth="1" strokeDasharray="2 2"/>
                <defs>
                  <linearGradient id="logoGrad" x1="0" y1="0" x2="28" y2="28">
                    <stop stopColor="var(--accent-primary)"/>
                    <stop offset="1" stopColor="var(--accent-secondary)"/>
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <div>
              <h3 className={styles.appName}>SoundVault</h3>
              <span className={styles.appVersion}>Version 1.0.0</span>
            </div>
          </div>
          
          <p className={styles.aboutText}>
            A premium personal audio player for your own music library. 
            Upload, organize, and enjoy your music offline with a beautiful interface.
          </p>
          
          <div className={styles.featureList}>
            <div className={styles.feature}>
              <Info size={16} />
              <span>Your music is stored locally on your device</span>
            </div>
            <div className={styles.feature}>
              <Info size={16} />
              <span>Supports MP3, WAV, M4A, AAC, FLAC, OGG</span>
            </div>
            <div className={styles.feature}>
              <Info size={16} />
              <span>Lyrics powered by LRCLIB</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
