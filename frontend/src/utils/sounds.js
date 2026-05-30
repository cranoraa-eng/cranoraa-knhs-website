/**
 * sounds.js — Web Audio API sound effects for KNHS Portal
 *
 * All sounds are generated programmatically (no audio files needed).
 * Respects user's mute preference stored in localStorage.
 *
 * Usage:
 *   import { playSound } from '../utils/sounds';
 *   playSound('notification');
 *
 * Available sounds:
 *   notification  — soft chime for incoming notifications
 *   message       — subtle pop for incoming chat messages
 *   messageSent   — light whoosh for sent messages
 *   success       — pleasant two-tone for successful actions
 *   error         — low double-buzz for errors
 *   click         — very subtle tick for button presses
 *   gradeSubmit   — ascending arpeggio for grade submission
 */

let ctx = null;

const getCtx = () => {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  // Resume if suspended (browser autoplay policy)
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
};

const isMuted = () => localStorage.getItem('knhs_sound_muted') === 'true';

export const setMuted = (val) => localStorage.setItem('knhs_sound_muted', String(val));
export const getMuted = () => isMuted();
export const toggleMute = () => { setMuted(!isMuted()); return !isMuted(); };

// ── Core oscillator helper ────────────────────────────────────────────────────
const tone = (freq, type, startTime, duration, gainPeak, ctx) => {
  const osc  = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = type;
  osc.frequency.setValueAtTime(freq, startTime);
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(gainPeak, startTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
  osc.start(startTime);
  osc.stop(startTime + duration + 0.05);
};

// ── Sound definitions ─────────────────────────────────────────────────────────
const SOUNDS = {

  // Soft two-note chime — incoming notification
  notification: (c) => {
    const t = c.currentTime;
    tone(880, 'sine', t,        0.4, 0.18, c);
    tone(1100, 'sine', t + 0.15, 0.35, 0.12, c);
  },

  // Short pop — incoming chat message
  message: (c) => {
    const t = c.currentTime;
    tone(660, 'sine', t,        0.12, 0.15, c);
    tone(880, 'sine', t + 0.08, 0.18, 0.10, c);
  },

  // Light whoosh — message sent
  messageSent: (c) => {
    const t = c.currentTime;
    const osc  = c.createOscillator();
    const gain = c.createGain();
    osc.connect(gain);
    gain.connect(c.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, t);
    osc.frequency.exponentialRampToValueAtTime(900, t + 0.12);
    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
    osc.start(t);
    osc.stop(t + 0.2);
  },

  // Pleasant ascending two-tone — success / save
  success: (c) => {
    const t = c.currentTime;
    tone(523, 'sine', t,        0.25, 0.15, c); // C5
    tone(659, 'sine', t + 0.12, 0.25, 0.15, c); // E5
    tone(784, 'sine', t + 0.24, 0.35, 0.12, c); // G5
  },

  // Low double-buzz — error
  error: (c) => {
    const t = c.currentTime;
    tone(180, 'sawtooth', t,        0.15, 0.18, c);
    tone(160, 'sawtooth', t + 0.18, 0.15, 0.15, c);
  },

  // Very subtle tick — button click
  click: (c) => {
    const t = c.currentTime;
    const buf = c.createBuffer(1, c.sampleRate * 0.04, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length) * 0.15;
    const src  = c.createBufferSource();
    const gain = c.createGain();
    src.buffer = buf;
    src.connect(gain);
    gain.connect(c.destination);
    gain.gain.setValueAtTime(0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);
    src.start(t);
  },

  // Ascending arpeggio — grade submit
  gradeSubmit: (c) => {
    const t = c.currentTime;
    const notes = [523, 659, 784, 1047]; // C E G C (major chord)
    notes.forEach((freq, i) => {
      tone(freq, 'sine', t + i * 0.08, 0.3, 0.13, c);
    });
  },

  // Soft alert — new announcement
  announcement: (c) => {
    const t = c.currentTime;
    tone(740, 'sine', t,        0.3, 0.14, c);
    tone(740, 'sine', t + 0.35, 0.3, 0.10, c);
  },
};

// ── Public API ────────────────────────────────────────────────────────────────
export const playSound = (name) => {
  if (isMuted()) return;
  const fn = SOUNDS[name];
  if (!fn) return;
  try {
    fn(getCtx());
  } catch (e) {
    // Silently ignore — audio may be blocked by browser policy
    console.warn('[Sound] Could not play:', name, e);
  }
};
