// @ts-check
import { CONFIG } from '../core/config.js';

/** 事件名稱 → 震動模式與優先權對照表（見 SPEC §3.3） */
const PATTERNS = {
  eat_food: { pattern: 10, priority: 1 },
  death: { pattern: [30, 20, 60], priority: 3 },
  new_high_score: { pattern: [15, 15, 15, 15, 40], priority: 2 },
  dpad_press: { pattern: 5, priority: 0 },
};

const STORAGE_KEY = CONFIG.STORAGE_PREFIX + 'haptics-enabled';

export class HapticManager {
  constructor() {
    this.supported = typeof navigator !== 'undefined' && 'vibrate' in navigator;
    const saved = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    this.enabled = saved === null ? true : saved === 'true';
    this._lastTickPriority = -1;
    this._lastTickId = -1;
  }

  setEnabled(value) {
    this.enabled = !!value;
    try {
      localStorage.setItem(STORAGE_KEY, String(this.enabled));
    } catch {
      // localStorage 不可用時（如隱私模式）靜默忽略
    }
  }

  /**
   * @param {string} eventName
   * @param {number} [tickId] 同一 tick 傳入相同值可觸發節流
   */
  trigger(eventName, tickId = Date.now()) {
    if (!this.enabled || !this.supported) return;
    const def = PATTERNS[eventName];
    if (!def) return;

    if (tickId === this._lastTickId && def.priority <= this._lastTickPriority) {
      return; // 同一 tick 已有更高優先權事件，節流略過
    }
    this._lastTickId = tickId;
    this._lastTickPriority = def.priority;

    try {
      navigator.vibrate(def.pattern);
    } catch {
      // 部分瀏覽器可能拋錯，靜默忽略避免影響遊戲流程
    }
  }
}
