import type { Track, PlaybackSpeed } from '../types';

class AudioService {
  private audio: HTMLAudioElement;
  private currentUrl: string | null = null;

  constructor() {
    this.audio = new Audio();
    this.audio.preload = 'metadata';
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.audio.addEventListener('loadedmetadata', () => {
      this.onTimeUpdate?.();
    });

    this.audio.addEventListener('timeupdate', () => {
      this.onTimeUpdate?.();
    });

    this.audio.addEventListener('ended', () => {
      this.onEnded?.();
    });

    this.audio.addEventListener('error', (e) => {
      console.error('Audio error:', e);
      this.onError?.();
    });

    this.audio.addEventListener('play', () => {
      this.onPlayStateChange?.(true);
    });

    this.audio.addEventListener('pause', () => {
      this.onPlayStateChange?.(false);
    });

    this.audio.addEventListener('canplay', () => {
      this.onCanPlay?.();
    });
  }

  onTimeUpdate?: () => void;
  onEnded?: () => void;
  onError?: () => void;
  onPlayStateChange?: (isPlaying: boolean) => void;
  onCanPlay?: () => void;

  async loadTrack(track: Track): Promise<void> {
    const url = track.publicUrl || track.storagePath;
    if (!url) {
      console.error('No URL available for track');
      throw new Error('No audio URL available');
    }

    if (this.currentUrl !== url) {
      this.currentUrl = url;
      this.audio.src = url;
      this.audio.load();
    }
  }

  play(): Promise<void> {
    console.log('[AudioService] play() called');
    return this.audio.play();
  }

  pause(): void {
    console.log('[AudioService] pause() called');
    this.audio.pause();
  }

  seek(time: number): void {
    if (isFinite(time) && time >= 0) {
      this.audio.currentTime = Math.min(time, this.duration);
    }
  }

  setVolume(volume: number): void {
    this.audio.volume = Math.max(0, Math.min(1, volume));
  }

  setMuted(muted: boolean): void {
    this.audio.muted = muted;
  }

  setPlaybackSpeed(speed: PlaybackSpeed): void {
    this.audio.playbackRate = speed;
  }

  get currentTime(): number {
    return this.audio.currentTime;
  }

  get duration(): number {
    return isFinite(this.audio.duration) ? this.audio.duration : 0;
  }

  get isPlaying(): boolean {
    return !this.audio.paused && !this.audio.ended;
  }

  get volume(): number {
    return this.audio.volume;
  }

  get muted(): boolean {
    return this.audio.muted;
  }

  get readyState(): number {
    return this.audio.readyState;
  }

  destroy(): void {
    this.audio.pause();
    this.audio.src = '';
    this.currentUrl = null;
  }
}

export const audioService = new AudioService();
