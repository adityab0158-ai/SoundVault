import { useState } from 'react';
import { Mail, Lock, Loader2 } from 'lucide-react';
import { useStore } from '../../stores/appStore';
import styles from './Auth.module.css';

export function AuthView() {
  const { signIn, signUp, isLoading } = useStore();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (mode === 'signup') {
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters');
        return;
      }
      const { error } = await signUp(email, password);
      if (error) {
        setError(error.message);
      } else {
        setSuccess('Account created! Check your email to confirm.');
      }
    } else {
      const { error } = await signIn(email, password);
      if (error) {
        setError(error.message);
      }
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.logo}>
            <svg width="48" height="48" viewBox="0 0 28 28" fill="none">
              <circle cx="14" cy="14" r="13" stroke="url(#authGrad)" strokeWidth="2"/>
              <circle cx="14" cy="14" r="4" fill="url(#authGrad)"/>
              <circle cx="14" cy="14" r="8" stroke="url(#authGrad)" strokeWidth="1" strokeDasharray="2 2"/>
              <defs>
                <linearGradient id="authGrad" x1="0" y1="0" x2="28" y2="28">
                  <stop stopColor="var(--accent-primary)"/>
                  <stop offset="1" stopColor="var(--accent-secondary)"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <h1 className={styles.title}>SoundVault</h1>
          <p className={styles.subtitle}>
            {mode === 'signin' 
              ? 'Sign in to access your music library' 
              : 'Create an account to start your music library'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {error && (
            <div className={styles.error}>{error}</div>
          )}
          {success && (
            <div className={styles.success}>{success}</div>
          )}

          <div className={styles.inputGroup}>
            <Mail size={18} className={styles.inputIcon} />
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={styles.input}
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <Lock size={18} className={styles.inputIcon} />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={styles.input}
              required
              minLength={6}
            />
          </div>

          {mode === 'signup' && (
            <div className={styles.inputGroup}>
              <Lock size={18} className={styles.inputIcon} />
              <input
                type="password"
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={styles.input}
                required
                minLength={6}
              />
            </div>
          )}

          <button type="submit" className={styles.submitBtn} disabled={isLoading}>
            {isLoading ? (
              <Loader2 size={20} className={styles.spinner} />
            ) : (
              mode === 'signin' ? 'Sign In' : 'Create Account'
            )}
          </button>
        </form>

        <div className={styles.footer}>
          {mode === 'signin' ? (
            <p>
              Don't have an account?{' '}
              <button onClick={() => setMode('signup')} className={styles.link}>
                Sign up
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{' '}
              <button onClick={() => setMode('signin')} className={styles.link}>
                Sign in
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
