import { ReminderToneId, ToneInfo } from '../types';

export const AVAILABLE_TONES: ToneInfo[] = [
  {
    id: 'chime',
    name: 'Gentle Chime',
    description: 'Harmonic two-tone chime, soft & calming',
    tag: 'Pleasant',
    icon: '🔔',
  },
  {
    id: 'marimba',
    name: 'Marimba Melody',
    description: 'Upbeat 4-note wooden marimba arpeggio',
    tag: 'Cheerful',
    icon: '🪵',
  },
  {
    id: 'digital-pulse',
    name: 'Digital Pulse',
    description: 'Crisp modern digital watch dual-beep',
    tag: 'Classic',
    icon: '⚡',
  },
  {
    id: 'zen-bell',
    name: 'Zen Singing Bowl',
    description: 'Deep resonant meditation bell with overtones',
    tag: 'Peaceful',
    icon: '🧘',
  },
  {
    id: 'radar-ping',
    name: 'Radar Ping',
    description: 'Futuristic sonar ping sweep',
    tag: 'Modern',
    icon: '📡',
  },
  {
    id: 'harp-arpeggio',
    name: 'Celestial Harp',
    description: 'Gentle cascading 5-note harp flourish',
    tag: 'Warm',
    icon: '✨',
  },
  {
    id: 'urgent-alarm',
    name: 'Action Pulse',
    description: 'Clear triple pulse for medicines & critical tasks',
    tag: 'Urgent',
    icon: '🚨',
  },
  {
    id: 'bubble-pop',
    name: 'Playful Bubble',
    description: 'Light, friendly water droplet pop',
    tag: 'Subtle',
    icon: '🫧',
  },
];

let sharedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return null;
    if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
      sharedAudioCtx = new AudioContextClass();
    }
    if (sharedAudioCtx.state === 'suspended') {
      sharedAudioCtx.resume().catch(() => {});
    }
    return sharedAudioCtx;
  } catch (e) {
    console.warn('AudioContext initialization error:', e);
    return null;
  }
}

// Ensure audio context is unlocked on user interaction
export function unlockAudioContext() {
  const ctx = getAudioContext();
  if (ctx && ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }
}

export function playTone(toneId: ReminderToneId = 'chime', volumeLevel: number = 0.8) {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const masterGain = ctx.createGain();
  // Clamp volume between 0 and 1
  const vol = Math.max(0, Math.min(1, volumeLevel));
  masterGain.gain.setValueAtTime(vol * 0.45, now);
  masterGain.connect(ctx.destination);

  switch (toneId) {
    case 'chime': {
      // D5 (587.33 Hz) -> A5 (880 Hz)
      const osc1 = ctx.createOscillator();
      const g1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now);
      g1.gain.setValueAtTime(0.7, now);
      g1.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc1.connect(g1);
      g1.connect(masterGain);
      osc1.start(now);
      osc1.stop(now + 0.45);

      const osc2 = ctx.createOscillator();
      const g2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, now + 0.16);
      g2.gain.setValueAtTime(0.85, now + 0.16);
      g2.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
      osc2.connect(g2);
      g2.connect(masterGain);
      osc2.start(now + 0.16);
      osc2.stop(now + 0.7);
      break;
    }

    case 'marimba': {
      // 4-note ascending marimba mallet: C5, E5, G5, C6
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, idx) => {
        const start = now + idx * 0.11;
        // Fundamental
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, start);
        g.gain.setValueAtTime(0.8, start);
        g.gain.exponentialRampToValueAtTime(0.001, start + 0.28);
        osc.connect(g);
        g.connect(masterGain);
        osc.start(start);
        osc.stop(start + 0.28);

        // Warm 2nd harmonic
        const oscH = ctx.createOscillator();
        const gH = ctx.createGain();
        oscH.type = 'sine';
        oscH.frequency.setValueAtTime(freq * 2, start);
        gH.gain.setValueAtTime(0.25, start);
        gH.gain.exponentialRampToValueAtTime(0.001, start + 0.18);
        oscH.connect(gH);
        gH.connect(masterGain);
        oscH.start(start);
        oscH.stop(start + 0.18);
      });
      break;
    }

    case 'digital-pulse': {
      // Dual crisp electronic pulse
      [0, 0.12].forEach((offset, idx) => {
        const start = now + offset;
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(idx === 0 ? 1100 : 1550, start);
        g.gain.setValueAtTime(0.4, start);
        g.gain.exponentialRampToValueAtTime(0.001, start + 0.08);
        osc.connect(g);
        g.connect(masterGain);
        osc.start(start);
        osc.stop(start + 0.08);
      });
      break;
    }

    case 'zen-bell': {
      // 432 Hz Tibetan singing bowl with resonant overtones & slow decay
      const baseFreq = 432;
      const overtones = [
        { mult: 1, amp: 0.8, decay: 1.6 },
        { mult: 2.05, amp: 0.35, decay: 1.2 },
        { mult: 3.12, amp: 0.18, decay: 0.9 },
      ];

      // Subtle vibrato LFO
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.setValueAtTime(4.5, now);
      lfoGain.gain.setValueAtTime(3.5, now);
      lfo.connect(lfoGain);
      lfo.start(now);
      lfo.stop(now + 1.6);

      overtones.forEach(({ mult, amp, decay }) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(baseFreq * mult, now);
        lfoGain.connect(osc.frequency);
        g.gain.setValueAtTime(amp, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + decay);
        osc.connect(g);
        g.connect(masterGain);
        osc.start(now);
        osc.stop(now + decay);
      });
      break;
    }

    case 'radar-ping': {
      // Sonar frequency sweep with echo
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(550, now);
      osc.frequency.exponentialRampToValueAtTime(1400, now + 0.18);
      g.gain.setValueAtTime(0.7, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc.connect(g);
      g.connect(masterGain);
      osc.start(now);
      osc.stop(now + 0.5);

      // Rebound ping echo
      const oscEcho = ctx.createOscillator();
      const gEcho = ctx.createGain();
      oscEcho.type = 'sine';
      oscEcho.frequency.setValueAtTime(1400, now + 0.22);
      gEcho.gain.setValueAtTime(0.25, now + 0.22);
      gEcho.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
      oscEcho.connect(gEcho);
      gEcho.connect(masterGain);
      oscEcho.start(now + 0.22);
      oscEcho.stop(now + 0.55);
      break;
    }

    case 'harp-arpeggio': {
      // 5-note gentle flourish: G4, B4, D5, G5, B5
      const harpNotes = [392.0, 493.88, 587.33, 783.99, 987.77];
      harpNotes.forEach((freq, idx) => {
        const start = now + idx * 0.08;
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);
        g.gain.setValueAtTime(0.7, start);
        g.gain.exponentialRampToValueAtTime(0.001, start + 0.45);
        osc.connect(g);
        g.connect(masterGain);
        osc.start(start);
        osc.stop(start + 0.45);
      });
      break;
    }

    case 'urgent-alarm': {
      // 3 rhythmic urgent pulses
      const pulses = [
        { offset: 0, freq: 880, dur: 0.1 },
        { offset: 0.14, freq: 880, dur: 0.1 },
        { offset: 0.28, freq: 1174.66, dur: 0.2 },
      ];
      pulses.forEach(({ offset, freq, dur }) => {
        const start = now + offset;
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, start);
        // Soft filter to remove harsh edge while retaining alert urgency
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2200, start);

        g.gain.setValueAtTime(0.6, start);
        g.gain.exponentialRampToValueAtTime(0.001, start + dur);
        osc.connect(filter);
        filter.connect(g);
        g.connect(masterGain);
        osc.start(start);
        osc.stop(start + dur);
      });
      break;
    }

    case 'bubble-pop': {
      // Dual cheerful water droplet bubble pop
      [0, 0.12].forEach((offset, idx) => {
        const start = now + offset;
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sine';
        const startF = idx === 0 ? 420 : 580;
        const endF = idx === 0 ? 880 : 1250;
        osc.frequency.setValueAtTime(startF, start);
        osc.frequency.exponentialRampToValueAtTime(endF, start + 0.08);

        g.gain.setValueAtTime(0.7, start);
        g.gain.exponentialRampToValueAtTime(0.001, start + 0.12);
        osc.connect(g);
        g.connect(masterGain);
        osc.start(start);
        osc.stop(start + 0.12);
      });
      break;
    }

    default: {
      // Fallback
      playTone('chime', volumeLevel);
      break;
    }
  }
}
