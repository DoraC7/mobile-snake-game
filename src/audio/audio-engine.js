// @ts-check
import { CONFIG } from '../core/config.js?v=9';

const STORAGE_KEY = CONFIG.STORAGE_PREFIX + 'muted';

/**
 * 極簡 Web Audio 即時合成音效引擎：吃食物 / 死亡
 */
export class AudioEngine {
  constructor() {
    /** @type {AudioContext | null} */
    this.ctx = null;
    const saved = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    this.muted = saved === 'true';
  }

  /** 需在使用者互動事件（如 touchstart/click）內呼叫，才符合自動播放政策 */
  init() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
  }

  setMuted(value) {
    this.muted = !!value;
    try {
      localStorage.setItem(STORAGE_KEY, String(this.muted));
    } catch {
      // 忽略
    }
  }

  /**
   * @param {number} freqStart
   * @param {number} freqEnd
   * @param {number} duration 秒
   */
  _tone(freqStart, freqEnd, duration) {
    if (this.muted || !this.ctx) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freqStart, now);
    osc.frequency.linearRampToValueAtTime(freqEnd, now + duration);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.25, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  playEat() {
    this._tone(440, 880, 0.12);
  }

  playDeath() {
    this._tone(300, 90, 0.18);
  }
}
