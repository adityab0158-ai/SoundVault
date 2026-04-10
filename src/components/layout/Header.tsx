import { Search, Sun, Moon, Menu } from 'lucide-react';
import { useStore } from '../../stores/appStore';
import styles from './Header.module.css';

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { searchQuery, setSearchQuery, preferences, setTheme } = useStore();
  
  const toggleTheme = () => {
    setTheme(preferences.theme === 'dark' ? 'light' : 'dark');
  };
  
  return (
    <header className={styles.header}>
      <button className={styles.menuBtn} onClick={onMenuClick}>
        <Menu size={24} />
      </button>
      
      <div className={styles.searchContainer}>
        <Search size={18} className={styles.searchIcon} />
        <input
          type="text"
          placeholder="Search your library..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={styles.searchInput}
        />
      </div>
      
      <button className={styles.themeBtn} onClick={toggleTheme} title="Toggle theme">
        {preferences.theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
      </button>
    </header>
  );
}
