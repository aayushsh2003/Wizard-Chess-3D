/**
 * Wizard Chess 3D - Cinematic Sound Effect Manager
 * Procedural Web Audio API sound synthesis for carved stone chess pieces:
 * - Weighty stone-sliding friction rumble across cathedral slate tiles
 * - Crisp, resonant stone impact & clicking / settling sounds
 * - Cinematic stone melee strikes, shattering statue debris, and falling king crashes
 * - Procedural Gothic Cathedral impulse response reverb
 * Zero external audio file dependencies.
 */

export interface SoundOptions {
  duration?: number;
  pieceType?: string;
  squares?: number;
  volume?: number;
  pitchOffset?: number;
  intensity?: number;
  delayMs?: number;
}

export interface ActiveSlideSound {
  stop: (fadeSeconds?: number) => void;
}

class SoundEffectManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private reverbConvolver: ConvolverNode | null = null;
  private reverbGain: GainNode | null = null;
  private dryGain: GainNode | null = null;
  private isMutedState = false;
  private masterVolume = 0.85;
  private isInitialized = false;
  private noiseBuffer: AudioBuffer | null = null;
  private listeners: Array<(muted: boolean, volume: number) => void> = [];
  private activeSlides: Set<ActiveSlideSound> = new Set();

  constructor() {
    // Restore persistent settings
    if (typeof window !== 'undefined') {
      try {
        const savedMute = localStorage.getItem('wizard_chess_sound_muted');
        if (savedMute !== null) {
          this.isMutedState = savedMute === 'true';
        }
        const savedVol = localStorage.getItem('wizard_chess_sound_volume');
        if (savedVol !== null) {
          const v = parseFloat(savedVol);
          if (!isNaN(v) && v >= 0 && v <= 1) {
            this.masterVolume = v;
          }
        }
      } catch {
        // Ignore localStorage restrictions
      }

      // Auto-unlock AudioContext on first user interaction (click, touch, key)
      const unlockAudio = () => {
        this.ensureContext();
        if (this.ctx && this.ctx.state === 'suspended') {
          this.ctx.resume().catch(() => {});
        }
        window.removeEventListener('pointerdown', unlockAudio);
        window.removeEventListener('keydown', unlockAudio);
        window.removeEventListener('touchstart', unlockAudio);
      };

      window.addEventListener('pointerdown', unlockAudio, { passive: true });
      window.addEventListener('keydown', unlockAudio, { passive: true });
      window.addEventListener('touchstart', unlockAudio, { passive: true });
    }
  }

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return null;

    if (!this.ctx) {
      try {
        this.ctx = new AudioContextClass();
      } catch {
        return null;
      }
    }

    if (!this.isInitialized && this.ctx) {
      this.isInitialized = true;
      try {
        // Master bus
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.isMutedState ? 0 : this.masterVolume, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);

        // Dry bus
        this.dryGain = this.ctx.createGain();
        this.dryGain.gain.setValueAtTime(0.85, this.ctx.currentTime);
        this.dryGain.connect(this.masterGain);

        // Reverb Convolver for Cathedral acoustic depth
        this.reverbConvolver = this.ctx.createConvolver();
        this.reverbConvolver.buffer = this.buildCathedralImpulseResponse(this.ctx);

        this.reverbGain = this.ctx.createGain();
        this.reverbGain.gain.setValueAtTime(0.38, this.ctx.currentTime);
        this.reverbConvolver.connect(this.reverbGain);
        this.reverbGain.connect(this.masterGain);

        // Pre-generate reusable noise buffer for granitic friction & clicks
        this.noiseBuffer = this.buildNoiseBuffer(this.ctx, 3.0);
      } catch {
        // Graceful fallback
      }
    }

    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    return this.ctx;
  }

  /**
   * Generates a 1.6-second stereo impulse response simulating a vaulted stone gothic cathedral.
   * Cathedral acoustics feature early specular stone reflections and a warm, low-passed reverberant tail.
   */
  private buildCathedralImpulseResponse(ctx: AudioContext): AudioBuffer {
    const rate = ctx.sampleRate;
    const length = Math.floor(rate * 1.6);
    const impulse = ctx.createBuffer(2, length, rate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);

    // Discrete early reflections (in samples)
    const earlyReflections = [
      { delay: Math.floor(rate * 0.016), gainL: 0.42, gainR: 0.18 },
      { delay: Math.floor(rate * 0.034), gainL: 0.22, gainR: 0.38 },
      { delay: Math.floor(rate * 0.052), gainL: 0.31, gainR: 0.27 },
      { delay: Math.floor(rate * 0.078), gainL: 0.19, gainR: 0.24 },
      { delay: Math.floor(rate * 0.110), gainL: 0.15, gainR: 0.14 }
    ];

    for (const er of earlyReflections) {
      if (er.delay < length) {
        left[er.delay] += er.gainL;
        right[er.delay] += er.gainR;
      }
    }

    // Diffuse decay with high-frequency attenuation (limestone & granite absorb highs quickly)
    const decayDuration = 1.45;
    for (let i = 0; i < length; i++) {
      const t = i / rate;
      const decay = Math.exp(-t * (4.2 / decayDuration));
      // Progressive high-damping factor
      const damping = Math.exp(-t * 2.8);
      const whiteL = (Math.random() * 2 - 1) * decay * damping;
      const whiteR = (Math.random() * 2 - 1) * decay * damping;
      left[i] += whiteL * 0.48;
      right[i] += whiteR * 0.48;
    }

    return impulse;
  }

  /**
   * Generates a repeatable looped buffer of multi-octave pink/brown noise for stone friction.
   */
  private buildNoiseBuffer(ctx: AudioContext, seconds: number): AudioBuffer {
    const length = Math.floor(ctx.sampleRate * seconds);
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      // Pink noise filter algorithm (Paul Kellet's filter)
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.12;
      b6 = white * 0.115926;
    }
    return buffer;
  }

  /**
   * Get mass / resonance properties for each piece type
   */
  private getPieceAcoustics(type?: string) {
    switch (type) {
      case 'king':
        return { baseFreq: 82, gritFreq: 440, massGain: 1.25, scrapePitch: 0.90 };
      case 'queen':
        return { baseFreq: 95, gritFreq: 510, massGain: 1.18, scrapePitch: 0.96 };
      case 'rook':
        return { baseFreq: 88, gritFreq: 460, massGain: 1.20, scrapePitch: 0.92 };
      case 'knight':
        return { baseFreq: 112, gritFreq: 580, massGain: 1.05, scrapePitch: 1.08 };
      case 'bishop':
        return { baseFreq: 118, gritFreq: 610, massGain: 1.02, scrapePitch: 1.12 };
      case 'pawn':
      default:
        return { baseFreq: 135, gritFreq: 700, massGain: 0.92, scrapePitch: 1.22 };
    }
  }

  // =========================================================================
  // Core Public Audio Effects
  // =========================================================================

  /**
   * Plays a weighty, cinematic stone-sliding friction sound as a piece moves across the stone altar.
   * Includes:
   * - Low granitic rumble (weight & momentum)
   * - Mid-frequency stone grain scrape (textured surface friction)
   * - High-frequency limestone scuff
   * - Smooth kinetic attack and deceleration fade
   */
  public playStoneSlide(options: SoundOptions = {}): ActiveSlideSound {
    const ctx = this.ensureContext();
    if (!ctx || this.isMutedState || !this.dryGain || !this.reverbConvolver) {
      return { stop: () => {} };
    }

    const duration = Math.max(0.35, options.duration || 0.72);
    const acoustics = this.getPieceAcoustics(options.pieceType);
    const userVolume = options.volume !== undefined ? options.volume : 1.0;
    const squares = Math.max(1, options.squares || 1);

    const now = ctx.currentTime + (options.delayMs ? options.delayMs / 1000 : 0);

    // Master node for this specific slide event
    const slideGain = ctx.createGain();
    const peakVol = 0.42 * acoustics.massGain * userVolume * Math.min(1.35, 0.85 + squares * 0.08);

    // Kinematic friction envelope: rapid build, steady glide with subtle modulation, smooth stop
    const attack = Math.min(0.12, duration * 0.22);
    const decay = Math.min(0.16, duration * 0.28);
    slideGain.gain.setValueAtTime(0.0001, now);
    slideGain.gain.exponentialRampToValueAtTime(peakVol, now + attack);
    slideGain.gain.setValueAtTime(peakVol, now + duration - decay);
    slideGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    // Route to dry and cathedral reverb
    slideGain.connect(this.dryGain);
    const slideReverbSend = ctx.createGain();
    slideReverbSend.gain.setValueAtTime(0.24, now);
    slideGain.connect(slideReverbSend);
    slideReverbSend.connect(this.reverbConvolver);

    // LAYER 1: Deep Granite Mass Rumble (Sub-bass low oscillator + low-passed noise)
    const subOsc = ctx.createOscillator();
    subOsc.type = 'triangle';
    const basePitch = acoustics.baseFreq * (options.pitchOffset ? Math.pow(2, options.pitchOffset / 12) : 1);
    subOsc.frequency.setValueAtTime(basePitch * 0.95, now);
    subOsc.frequency.exponentialRampToValueAtTime(basePitch * 1.05, now + duration * 0.45);
    subOsc.frequency.exponentialRampToValueAtTime(basePitch * 0.88, now + duration);

    const subGain = ctx.createGain();
    subGain.gain.setValueAtTime(0.32, now);
    subOsc.connect(subGain);
    subGain.connect(slideGain);

    // LAYER 2: Granitic Stone Surface Friction (Band-pass filtered noise with micro-resonance)
    let noiseSrc: AudioBufferSourceNode | null = null;
    let bandFilter: BiquadFilterNode | null = null;
    let highScuffFilter: BiquadFilterNode | null = null;

    if (this.noiseBuffer) {
      noiseSrc = ctx.createBufferSource();
      noiseSrc.buffer = this.noiseBuffer;
      noiseSrc.loop = true;
      noiseSrc.playbackRate.setValueAtTime(acoustics.scrapePitch, now);
      noiseSrc.playbackRate.linearRampToValueAtTime(acoustics.scrapePitch * 0.92, now + duration);

      // Resonant bandpass for rough stone scrape
      bandFilter = ctx.createBiquadFilter();
      bandFilter.type = 'bandpass';
      bandFilter.frequency.setValueAtTime(acoustics.gritFreq, now);
      bandFilter.frequency.linearRampToValueAtTime(acoustics.gritFreq * 1.08, now + duration * 0.5);
      bandFilter.frequency.linearRampToValueAtTime(acoustics.gritFreq * 0.88, now + duration);
      bandFilter.Q.setValueAtTime(2.2, now);

      const bandGain = ctx.createGain();
      bandGain.gain.setValueAtTime(0.68, now);

      // Gentle high scuff for limestone dust texture
      highScuffFilter = ctx.createBiquadFilter();
      highScuffFilter.type = 'highpass';
      highScuffFilter.frequency.setValueAtTime(2200, now);
      const highGain = ctx.createGain();
      highGain.gain.setValueAtTime(0.14, now);

      noiseSrc.connect(bandFilter);
      bandFilter.connect(bandGain);
      bandGain.connect(slideGain);

      noiseSrc.connect(highScuffFilter);
      highScuffFilter.connect(highGain);
      highGain.connect(slideGain);

      noiseSrc.start(now);
      noiseSrc.stop(now + duration + 0.05);
    }

    subOsc.start(now);
    subOsc.stop(now + duration + 0.05);

    const cleanup = () => {
      try {
        subOsc.disconnect();
        subGain.disconnect();
        if (noiseSrc) noiseSrc.disconnect();
        if (bandFilter) bandFilter.disconnect();
        if (highScuffFilter) highScuffFilter.disconnect();
        slideGain.disconnect();
        slideReverbSend.disconnect();
      } catch {
        // Ignore
      }
    };

    const activeSlide: ActiveSlideSound = {
      stop: (fadeSec = 0.08) => {
        try {
          const stopTime = ctx.currentTime;
          slideGain.gain.cancelScheduledValues(stopTime);
          slideGain.gain.setValueAtTime(slideGain.gain.value, stopTime);
          slideGain.gain.exponentialRampToValueAtTime(0.0001, stopTime + fadeSec);
          setTimeout(() => {
            try {
              subOsc.stop();
              if (noiseSrc) noiseSrc.stop();
              cleanup();
            } catch {}
          }, fadeSec * 1000 + 30);
        } catch {
          cleanup();
        }
        this.activeSlides.delete(activeSlide);
      }
    };

    this.activeSlides.add(activeSlide);
    setTimeout(() => {
      this.activeSlides.delete(activeSlide);
      cleanup();
    }, (duration + (options.delayMs || 0) / 1000) * 1000 + 100);

    return activeSlide;
  }

  /**
   * Plays a crisp, solid stone-on-stone click / impact sound when a piece lands or settles on a square.
   * Includes:
   * - Sharp acoustic transient impact (<10ms edge contact)
   * - Limestone resonant body decay (~240-360 Hz)
   * - Sub-bass stone mass thud (~80 Hz)
   * - Cathedral acoustic tail
   */
  public playStoneClick(options: SoundOptions = {}) {
    const ctx = this.ensureContext();
    if (!ctx || this.isMutedState || !this.dryGain || !this.reverbConvolver) return;

    const acoustics = this.getPieceAcoustics(options.pieceType);
    const intensity = options.intensity !== undefined ? options.intensity : 1.0;
    const userVolume = options.volume !== undefined ? options.volume : 1.0;
    const now = ctx.currentTime + (options.delayMs ? options.delayMs / 1000 : 0);

    const clickGain = ctx.createGain();
    const finalVol = 0.62 * acoustics.massGain * intensity * userVolume;
    clickGain.gain.setValueAtTime(finalVol, now);
    clickGain.connect(this.dryGain);

    // Send impulse to Cathedral reverb
    const reverbSend = ctx.createGain();
    reverbSend.gain.setValueAtTime(0.32 * intensity, now);
    clickGain.connect(reverbSend);
    reverbSend.connect(this.reverbConvolver);

    // 1. Sharp Transient Contact Impulse (White noise micro-burst)
    if (this.noiseBuffer) {
      const snapSrc = ctx.createBufferSource();
      snapSrc.buffer = this.noiseBuffer;
      snapSrc.playbackRate.setValueAtTime(1.8 + Math.random() * 0.4, now);

      const snapFilter = ctx.createBiquadFilter();
      snapFilter.type = 'bandpass';
      snapFilter.frequency.setValueAtTime(1600 + Math.random() * 400, now);
      snapFilter.Q.setValueAtTime(1.8, now);

      const snapGain = ctx.createGain();
      snapGain.gain.setValueAtTime(0.95, now);
      snapGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.024);

      snapSrc.connect(snapFilter);
      snapFilter.connect(snapGain);
      snapGain.connect(clickGain);

      snapSrc.start(now);
      snapSrc.stop(now + 0.03);
    }

    // 2. Resonant Carved Stone Fundamental (Exponential decay of dense limestone)
    const stoneOsc = ctx.createOscillator();
    stoneOsc.type = 'sine';
    const fundamental = acoustics.baseFreq * 2.4;
    // Rapid initial pitch drop simulates initial acoustic compression upon impact
    stoneOsc.frequency.setValueAtTime(fundamental * 1.5, now);
    stoneOsc.frequency.exponentialRampToValueAtTime(fundamental, now + 0.018);

    const stoneGain = ctx.createGain();
    stoneGain.gain.setValueAtTime(0.75, now);
    stoneGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.11);

    stoneOsc.connect(stoneGain);
    stoneGain.connect(clickGain);

    stoneOsc.start(now);
    stoneOsc.stop(now + 0.12);

    // 3. Sub-bass Altar Mass Thud (Solid granite table contact)
    const thudOsc = ctx.createOscillator();
    thudOsc.type = 'sine';
    thudOsc.frequency.setValueAtTime(95, now);
    thudOsc.frequency.exponentialRampToValueAtTime(45, now + 0.065);

    const thudGain = ctx.createGain();
    thudGain.gain.setValueAtTime(0.58, now);
    thudGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.075);

    thudOsc.connect(thudGain);
    thudGain.connect(clickGain);

    thudOsc.start(now);
    thudOsc.stop(now + 0.08);

    // Auto-cleanup
    setTimeout(() => {
      try {
        stoneOsc.disconnect();
        thudOsc.disconnect();
        clickGain.disconnect();
        reverbSend.disconnect();
      } catch {}
    }, ((options.delayMs || 0) / 1000 + 0.35) * 1000);
  }

  /**
   * Subtle muted stone tap when a piece is selected or picked up.
   */
  public playStoneSelect() {
    this.playStoneClick({ intensity: 0.45, volume: 0.65 });
  }

  /**
   * Dramatic stone melee strike: visceral weapon impact when the attacker's stone sword/weapon
   * cleaves into the defending statue in a cinematic melee duel.
   */
  public playStoneStrike(options: SoundOptions = {}) {
    const ctx = this.ensureContext();
    if (!ctx || this.isMutedState || !this.dryGain || !this.reverbConvolver) return;

    const now = ctx.currentTime;
    const strikeGain = ctx.createGain();
    strikeGain.gain.setValueAtTime(0.85, now);
    strikeGain.connect(this.dryGain);

    const reverbSend = ctx.createGain();
    reverbSend.gain.setValueAtTime(0.48, now);
    strikeGain.connect(reverbSend);
    reverbSend.connect(this.reverbConvolver);

    // 1. Heavy resonant chisel impact ring
    const ringOsc = ctx.createOscillator();
    ringOsc.type = 'triangle';
    ringOsc.frequency.setValueAtTime(580, now);
    ringOsc.frequency.exponentialRampToValueAtTime(260, now + 0.04);

    const ringGain = ctx.createGain();
    ringGain.gain.setValueAtTime(0.72, now);
    ringGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);

    ringOsc.connect(ringGain);
    ringGain.connect(strikeGain);
    ringOsc.start(now);
    ringOsc.stop(now + 0.20);

    // 2. Heavy crushing stone thud
    const heavyOsc = ctx.createOscillator();
    heavyOsc.type = 'sine';
    heavyOsc.frequency.setValueAtTime(140, now);
    heavyOsc.frequency.exponentialRampToValueAtTime(50, now + 0.09);

    const heavyGain = ctx.createGain();
    heavyGain.gain.setValueAtTime(0.85, now);
    heavyGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

    heavyOsc.connect(heavyGain);
    heavyGain.connect(strikeGain);
    heavyOsc.start(now);
    heavyOsc.stop(now + 0.14);

    // 3. Crisp fracture crack
    if (this.noiseBuffer) {
      const crack = ctx.createBufferSource();
      crack.buffer = this.noiseBuffer;
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.setValueAtTime(2200, now);
      bp.Q.setValueAtTime(2.5, now);

      const cGain = ctx.createGain();
      cGain.gain.setValueAtTime(0.82, now);
      cGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.045);

      crack.connect(bp);
      bp.connect(cGain);
      cGain.connect(strikeGain);

      crack.start(now);
      crack.stop(now + 0.05);
    }
  }

  /**
   * Cinematic stone shatter: explosive rupture and tumbling stone shard debris
   * when a defeated statue detonates into flying fragments.
   */
  public playStoneShatter(options: SoundOptions = {}) {
    const ctx = this.ensureContext();
    if (!ctx || this.isMutedState || !this.dryGain || !this.reverbConvolver) return;

    const now = ctx.currentTime;
    const shatterGain = ctx.createGain();
    shatterGain.gain.setValueAtTime(0.92, now);
    shatterGain.connect(this.dryGain);

    const reverbSend = ctx.createGain();
    reverbSend.gain.setValueAtTime(0.65, now);
    shatterGain.connect(reverbSend);
    reverbSend.connect(this.reverbConvolver);

    // 1. Initial explosive stone rupture blast
    if (this.noiseBuffer) {
      const blastSrc = ctx.createBufferSource();
      blastSrc.buffer = this.noiseBuffer;
      const lowFilter = ctx.createBiquadFilter();
      lowFilter.type = 'lowpass';
      lowFilter.frequency.setValueAtTime(1400, now);
      lowFilter.frequency.exponentialRampToValueAtTime(280, now + 0.35);

      const blastGain = ctx.createGain();
      blastGain.gain.setValueAtTime(0.95, now);
      blastGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.42);

      blastSrc.connect(lowFilter);
      lowFilter.connect(blastGain);
      blastGain.connect(shatterGain);

      blastSrc.start(now);
      blastSrc.stop(now + 0.45);
    }

    // 2. Sub-bass shockwave boom
    const boomOsc = ctx.createOscillator();
    boomOsc.type = 'sine';
    boomOsc.frequency.setValueAtTime(115, now);
    boomOsc.frequency.exponentialRampToValueAtTime(32, now + 0.24);

    const boomGain = ctx.createGain();
    boomGain.gain.setValueAtTime(0.85, now);
    boomGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);

    boomOsc.connect(boomGain);
    boomGain.connect(shatterGain);
    boomOsc.start(now);
    boomOsc.stop(now + 0.30);

    // 3. Staggered stone debris shower (micro-shards clattering across the altar slate)
    const numShards = 7;
    for (let i = 0; i < numShards; i++) {
      const shardDelay = 0.06 + Math.random() * 0.32;
      const tShard = now + shardDelay;

      const shardOsc = ctx.createOscillator();
      shardOsc.type = 'sine';
      const shardFreq = 480 + Math.random() * 720;
      shardOsc.frequency.setValueAtTime(shardFreq, tShard);

      const sGain = ctx.createGain();
      const sVol = 0.12 + Math.random() * 0.18;
      sGain.gain.setValueAtTime(sVol, tShard);
      sGain.gain.exponentialRampToValueAtTime(0.0001, tShard + 0.035);

      shardOsc.connect(sGain);
      sGain.connect(shatterGain);

      shardOsc.start(tShard);
      shardOsc.stop(tShard + 0.04);
    }
  }

  /**
   * Cataclysmic monarch crash: when the defeated King statue topples and crashes onto the board.
   */
  public playKingCrash() {
    const ctx = this.ensureContext();
    if (!ctx || this.isMutedState || !this.dryGain || !this.reverbConvolver) return;

    const now = ctx.currentTime;
    // Layer 1: Huge monolithic stone thud
    const kingThud = ctx.createOscillator();
    kingThud.type = 'triangle';
    kingThud.frequency.setValueAtTime(80, now);
    kingThud.frequency.exponentialRampToValueAtTime(28, now + 0.38);

    const thudGain = ctx.createGain();
    thudGain.gain.setValueAtTime(0.98, now);
    thudGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

    kingThud.connect(thudGain);
    thudGain.connect(this.dryGain);
    if (this.reverbConvolver) {
      thudGain.connect(this.reverbConvolver);
    }
    kingThud.start(now);
    kingThud.stop(now + 0.48);

    // Layer 2: Fracturing marble crown impact
    this.playStoneStrike({ volume: 1.1 });
    // Layer 3: Secondary bounce clatter
    this.playStoneClick({ pieceType: 'king', intensity: 0.85, delayMs: 140 });
  }

  // =========================================================================
  // State, Volume, and Mute Controls
  // =========================================================================

  public toggleMute(): boolean {
    this.setMuted(!this.isMutedState);
    return this.isMutedState;
  }

  public setMuted(muted: boolean) {
    this.isMutedState = Boolean(muted);
    this.ensureContext();
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
      this.masterGain.gain.setValueAtTime(
        this.isMutedState ? 0 : this.masterVolume,
        this.ctx.currentTime
      );
    }
    try {
      localStorage.setItem('wizard_chess_sound_muted', String(this.isMutedState));
    } catch {}
    this.notify();
  }

  public isMuted(): boolean {
    return this.isMutedState;
  }

  public setMasterVolume(vol: number) {
    const v = Math.max(0, Math.min(1, vol));
    this.masterVolume = v;
    this.ensureContext();
    if (this.masterGain && this.ctx && !this.isMutedState) {
      this.masterGain.gain.setValueAtTime(v, this.ctx.currentTime);
    }
    try {
      localStorage.setItem('wizard_chess_sound_volume', String(v));
    } catch {}
    this.notify();
  }

  public getMasterVolume(): number {
    return this.masterVolume;
  }

  public subscribe(listener: (muted: boolean, volume: number) => void): () => void {
    this.listeners.push(listener);
    listener(this.isMutedState, this.masterVolume);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    for (const listener of this.listeners) {
      listener(this.isMutedState, this.masterVolume);
    }
  }
}

export const soundManager = new SoundEffectManager();
