import { useState } from 'react';
import { X } from 'lucide-react';
import { useStore } from '../../stores/appStore';
import styles from './CreatePlaylistModal.module.css';

interface CreatePlaylistModalProps {
  onClose: () => void;
}

export function CreatePlaylistModal({ onClose }: CreatePlaylistModalProps) {
  const { createPlaylist } = useStore();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      await createPlaylist(name.trim(), description.trim());
      onClose();
    }
  };
  
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>Create Playlist</h2>
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className={styles.form}>
          <label className={styles.label}>
            <span>Name</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My awesome playlist"
              className={styles.input}
              autoFocus
            />
          </label>
          
          <label className={styles.label}>
            <span>Description (optional)</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description..."
              className={styles.textarea}
              rows={3}
            />
          </label>
          
          <div className={styles.actions}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>
              Cancel
            </button>
            <button 
              type="submit" 
              className={styles.createBtn}
              disabled={!name.trim()}
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
