// @ts-check
import { CONFIG } from '../core/config.js?v=9';

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
      recentGames: [],
      bestByMode: {},
      dailyResults: {},
      achievements: {},
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
  * @param {{score:number, length:number, foodEaten:number, mode?:string, durationSeconds?:number, maxCombo?:number, maxSpeedLevel?:number, goldenFoodEaten?:number, deathReason?:string|null}} result
  * @returns {{isNewHighScore:boolean, previousScore:number|null, modeBest:number}}
   */
  recordGameEnd(result) {
    const { score, length, foodEaten } = result;
    const d = this.data;
    const isNewHighScore = score > d.highScore;
    const mode = result.mode || 'classic';
    const previous = d.recentGames.length ? d.recentGames[d.recentGames.length - 1] : null;

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
    const modeBest = Math.max(Number(d.bestByMode[mode] || 0), score);
    d.bestByMode[mode] = modeBest;
    d.recentGames.push({ ...result, endedAt: Date.now() });
    d.recentGames = d.recentGames.slice(-50);
    if (result.dailyId) {
      const previousDaily = d.dailyResults[result.dailyId] || { bestScore: 0, completed: false };
      d.dailyResults[result.dailyId] = {
        bestScore: Math.max(previousDaily.bestScore, score),
        completed: previousDaily.completed || Boolean(result.dailyCompleted),
      };
    }

    this._save();
    return { isNewHighScore, previousScore: previous ? previous.score : null, modeBest };
  }

  getSummary() {
    return { ...this.data };
  }

  getRecentGames(limit = 7) {
    return this.data.recentGames.slice(-limit);
  }
}
