import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { useStore } from '../../stores/appStore';
import styles from './Toast.module.css';

export function ToastContainer() {
  const { toasts, removeToast } = useStore();
  
  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle size={20} />;
      case 'error':
        return <AlertCircle size={20} />;
      default:
        return <Info size={20} />;
    }
  };
  
  return (
    <div className={styles.container}>
      {toasts.map((toast) => (
        <div key={toast.id} className={`${styles.toast} ${styles[toast.type]}`}>
          <span className={styles.icon}>{getIcon(toast.type)}</span>
          <span className={styles.message}>{toast.message}</span>
          <button className={styles.closeBtn} onClick={() => removeToast(toast.id)}>
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}
