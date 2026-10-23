import { SaveManager } from './SaveManager';

export type MusicTheme = 'menu' | 'garden' | 'forest' | 'village' | 'trail' | 'finale';
export type SfxName =
  | 'star'
  | 'item'
  | 'quest'
  | 'talk'
  | 'jump'
  | 'meow'
  | 'locked'
  | 'heart'
  | 'ui'
  | 'fall';

type ThemeConfig = {
  /** Frequências de uma escala pentatônica agradável. */
  notes: number[];
  tempo: number;
  wave: OscillatorType;
  bass: number[];
  shimmer: boolean;
};

const THEMES: Record<MusicTheme, ThemeConfig> = {
  menu: { notes: [261.6, 329.6, 392.0, 440.0, 523.3, 659.3], tempo: 620, wave: 'sine', bass: [130.8, 164.8, 196.0], shimmer: true },
  garden: { notes: [329.6, 392.0, 440.0, 523.3, 587.3, 659.3], tempo: 540, wave: 'triangle', bass: [164.8, 196.0, 220.0], shimmer: false },
  forest: { notes: [261.6, 293.7, 349.2, 392.0, 466.2, 523.3], tempo: 700, wave: 'sine', bass: [130.8, 146.8, 174.6], shimmer: true },
  village: { notes: [349.2, 392.0, 440.0, 523.3, 587.3, 698.5], tempo: 480, wave: 'triangle', bass: [174.6, 196.0, 220.0], shimmer: false },
  trail: { notes: [392.0, 466.2, 523.3, 587.3, 698.5, 784.0], tempo: 430, wave: 'square', bass: [196.0, 233.1, 261.6], shimmer: true },
  finale: { notes: [261.6, 329.6, 392.0, 493.9, 523.3, 659.3], tempo: 680, wave: 'sine', bass: [130.8, 164.8, 196.0], shimmer: true },
};

/**
 * Música e efeitos gerados em tempo real com WebAudio.
 * Nenhum arquivo de áudio externo é necessário.
 */
class AudioManagerImpl {
  private ctx?: AudioContext;
  private master?: GainNode;
  private musicGain?: GainNode;
  private sfxGain?: GainNode;
  private delay?: DelayNode;
  private timer?: number;
  private step = 0;
  private theme?: MusicTheme;
  private muted = SaveManager.isMuted();
  private pendingTheme?: MusicTheme;
  private initialized = false;
  private suspended = false;

  /** Deve ser chamado após um gesto do usuário (clique/tecla). */
  init(): void {
    if (this.initialized) {
      void this.ctx?.resume();
      return;
    }
    try {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return;
      this.ctx = new Ctor();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.5;
      this.master.connect(this.ctx.destination);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0.16;
      this.musicGain.connect(this.master);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = 0.3;
      this.sfxGain.connect(this.master);

      // Eco suave para a música soar aconchegante.
      this.delay = this.ctx.createDelay(1);
      this.delay.delayTime.value = 0.33;
      const feedback = this.ctx.createGain();
      feedback.gain.value = 0.22;
      const wet = this.ctx.createGain();
      wet.gain.value = 0.2;
      this.delay.connect(feedback);
      feedback.connect(this.delay);
      this.delay.connect(wet);
      wet.connect(this.musicGain);

      this.initialized = true;
      void this.ctx.resume();
      if (this.pendingTheme) {
        const next = this.pendingTheme;
        this.pendingTheme = undefined;
        this.playMusic(next);
      }
    } catch {
      /* Áudio é opcional. */
    }
  }

  get isMuted(): boolean {
    return this.muted;
  }

  toggleMute(): boolean {
    this.muted = !this.muted;
    SaveManager.setMuted(this.muted);
    if (this.master && this.ctx) {
      this.master.gain.cancelScheduledValues(this.ctx.currentTime);
      this.master.gain.linearRampToValueAtTime(this.muted ? 0 : 0.5, this.ctx.currentTime + 0.2);
    }
    return this.muted;
  }

  setMuted(muted: boolean): void {
    if (muted !== this.muted) this.toggleMute();
  }

  playMusic(theme: MusicTheme): void {
    if (!this.initialized) {
      this.pendingTheme = theme;
      return;
    }
    if (this.theme === theme) return;
    this.theme = theme;
    this.step = 0;
    if (this.timer) window.clearInterval(this.timer);
    this.timer = undefined;
    if (this.suspended) return;
    const config = THEMES[theme];
    this.timer = window.setInterval(() => this.musicTick(theme, config), config.tempo);
    this.musicTick(theme, config);
  }

  /** Silencia temporariamente ao trocar de aba, sem perder o tema atual. */
  suspend(): void {
    this.suspended = true;
    if (this.timer) window.clearInterval(this.timer);
    this.timer = undefined;
    void this.ctx?.suspend();
  }

  resume(): void {
    if (!this.suspended) return;
    this.suspended = false;
    void this.ctx?.resume();
    if (this.initialized && this.theme && !this.timer) {
      const theme = this.theme;
      const config = THEMES[theme];
      this.timer = window.setInterval(() => this.musicTick(theme, config), config.tempo);
    }
  }

  stopMusic(): void {
    if (this.timer) window.clearInterval(this.timer);
    this.timer = undefined;
    this.theme = undefined;
  }

  private musicTick(theme: MusicTheme, config: ThemeConfig): void {
    if (!this.ctx || !this.musicGain || this.muted) return;
    const index = this.step;
    const note = config.notes[index % config.notes.length];
    const octave = index % 12 < 6 ? 1 : 2;
    this.tone(note * octave, 1.15, config.wave, 0.05, this.musicGain, this.ctx.currentTime, 0.35);
    if (index % 4 === 0) {
      const bass = config.bass[(index / 4) % config.bass.length];
      this.tone(bass, 2.1, 'sine', 0.045, this.musicGain, this.ctx.currentTime, 0.4);
    }
    if (config.shimmer && index % 3 === 0) {
      this.tone(note * 4, 0.55, 'sine', 0.018, this.musicGain, this.ctx.currentTime + 0.12, 0.5);
    }
    if (theme === 'finale' && index % 6 === 2) {
      this.tone(note * 2, 1.4, 'sine', 0.025, this.musicGain, this.ctx.currentTime + 0.18, 0.5);
    }
    this.step += 1;
  }

  private tone(
    freq: number,
    duration: number,
    type: OscillatorType,
    volume: number,
    destination?: AudioNode,
    when?: number,
    attack = 0.02,
  ): void {
    if (!this.ctx || !destination) return;
    const start = when ?? this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, volume), start + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    osc.connect(gain);
    gain.connect(destination);
    if (this.delay && destination === this.musicGain) gain.connect(this.delay);
    osc.start(start);
    osc.stop(start + duration + 0.05);
  }

  private glide(freqA: number, freqB: number, duration: number, volume: number, type: OscillatorType = 'sine'): void {
    if (!this.ctx || !this.sfxGain) return;
    const start = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freqA, start);
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, freqB), start + duration);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(start);
    osc.stop(start + duration + 0.05);
  }

  sfx(name: SfxName): void {
    if (!this.initialized) this.init();
    if (!this.ctx || !this.sfxGain || this.muted) return;
    switch (name) {
      case 'star':
        this.tone(880, 0.22, 'sine', 0.09, this.sfxGain, this.ctx.currentTime, 0.01);
        this.tone(1174.7, 0.3, 'sine', 0.07, this.sfxGain, this.ctx.currentTime + 0.08, 0.01);
        this.tone(1568, 0.35, 'triangle', 0.045, this.sfxGain, this.ctx.currentTime + 0.17, 0.01);
        break;
      case 'item':
        this.tone(523.3, 0.18, 'triangle', 0.08, this.sfxGain, this.ctx.currentTime, 0.01);
        this.tone(698.5, 0.22, 'triangle', 0.07, this.sfxGain, this.ctx.currentTime + 0.09, 0.01);
        this.tone(1046.5, 0.3, 'sine', 0.05, this.sfxGain, this.ctx.currentTime + 0.18, 0.01);
        break;
      case 'quest':
        [523.3, 659.3, 784, 1046.5].forEach((f, i) => {
          this.tone(f, 0.5, 'triangle', 0.07, this.sfxGain, this.ctx!.currentTime + i * 0.12, 0.01);
        });
        break;
      case 'talk':
        this.tone(440 + Math.random() * 90, 0.05, 'square', 0.012, this.sfxGain, this.ctx.currentTime, 0.005);
        break;
      case 'jump':
        this.glide(330, 620, 0.16, 0.06, 'triangle');
        break;
      case 'fall':
        this.glide(420, 120, 0.35, 0.06, 'sine');
        break;
      case 'meow':
        this.glide(520, 760, 0.16, 0.07, 'triangle');
        window.setTimeout(() => this.glide(780, 480, 0.28, 0.05, 'triangle'), 130);
        break;
      case 'locked':
        this.tone(196, 0.16, 'square', 0.05, this.sfxGain, this.ctx.currentTime, 0.01);
        this.tone(164.8, 0.24, 'square', 0.045, this.sfxGain, this.ctx.currentTime + 0.12, 0.01);
        break;
      case 'heart':
        this.tone(659.3, 0.3, 'sine', 0.06, this.sfxGain, this.ctx.currentTime, 0.01);
        this.tone(987.8, 0.4, 'sine', 0.04, this.sfxGain, this.ctx.currentTime + 0.14, 0.01);
        break;
      case 'ui':
        this.tone(620, 0.08, 'sine', 0.04, this.sfxGain, this.ctx.currentTime, 0.005);
        break;
    }
  }
}

export const AudioManager = new AudioManagerImpl();
