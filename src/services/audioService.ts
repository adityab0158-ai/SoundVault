import type { Track, PlaybackSpeed } from '../types';

class AudioService {
  private audio: HTMLAudioElement;
  private currentBlobUrl: string | null = null;

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

    this.audio.addEventListener('error', () => {
      this.onError?.();
    });

    this.audio.addEventListener('play', () => {
      this.onPlayStateChange?.(true);
    });

    this.audio.addEventListener('pause', () => {
      this.onPlayStateChange?.(false);
    });
  }

  onTimeUpdate?: () => void;
  onEnded?: () => void;
  onError?: () => void;
  onPlayStateChange?: (isPlaying: boolean) => void;

  async loadTrack(track: Track): Promise<void> {
    if (this.currentBlobUrl) {
      URL.revokeObjectURL(this.currentBlobUrl);
    }
    this.currentBlobUrl = URL.createObjectURL(track.fileBlob);
    this.audio.src = this.currentBlobUrl;
    this.audio.load();
  }

  play(): Promise<void> {
    return this.audio.play();
  }

  pause(): void {
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

  destroy(): void {
    if (this.currentBlobUrl) {
      URL.revokeObjectURL(this.currentBlobUrl);
    }
    this.audio.pause();
    this.audio.src = '';
  }
}

export const audioService = new AudioService();
