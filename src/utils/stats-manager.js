// @ts-check
import { CONFIG } from '../core/config.js';

const STORAGE_KEY = CONFIG.STORAGE_PREFIX + 'stats';

/**
 * v1 統計數據：最高分 / 最高長度 / 終身食物數 / 總遊玩場次 / 連勝（目前 & 歷史最佳）
 */
export class StatsManager {
  constructor() {
    this.data = this._load();
  }

  _defaults() {
    return {
      highScore: 0,
      highLength: 0,
      totalFoodEaten: 0,
      totalGamesPlayed: 0,
      currentStreak: 0,
      bestStreak: 0,
    };
  }

  _load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return this._defaults();
      const parsed = JSON.parse(raw);
      return { ...this._defaults(), ...parsed };
    } catch {
      return this._defaults();
    }
  }

  _save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch {
      // 忽略儲存失敗（例如無痕模式配額限制）
    }
  }

  /**
   * @param {{score:number, length:number, foodEaten:number}} result
   * @returns {{isNewHighScore:boolean}}
   */
  recordGameEnd({ score, length, foodEaten }) {
    const d = this.data;
    const isNewHighScore = score > d.highScore;

    if (isNewHighScore) {
      d.highScore = score;
      d.currentStreak += 1;
      d.bestStreak = Math.max(d.bestStreak, d.currentStreak);
    } else {
      d.currentStreak = 0;
    }

    d.highLength = Math.max(d.highLength, length);
    d.totalFoodEaten += foodEaten;
    d.totalGamesPlayed += 1;

    this._save();
    return { isNewHighScore };
  }

  getSummary() {
    return { ...this.data };
  }
}
