// @ts-check
import { CONFIG } from '../core/config.js?v=9';

const STORAGE_KEY = CONFIG.STORAGE_PREFIX + 'achievements';

export const ACHIEVEMENTS = Object.freeze([
  { id: 'first-game', titleKey: 'achievement.firstGame', test: (r, s) => s.totalGamesPlayed >= 1 },
  { id: 'score-10', titleKey: 'achievement.score10', test: (r) => r.score >= 10 },
  { id: 'combo-5', titleKey: 'achievement.combo5', test: (r) => r.maxCombo >= 5 },
  { id: 'golden', titleKey: 'achievement.golden', test: (r) => r.goldenFoodEaten >= 1 },
  { id: 'explorer', titleKey: 'achievement.explorer', test: (r, s) => Object.keys(s.bestByMode || {}).length >= 3 },
  { id: 'daily', titleKey: 'achievement.daily', test: (r) => !!r.dailyCompleted },
]);

export class AchievementManager {
  constructor() {
    try {
      this.unlocked = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    } catch {
      this.unlocked = {};
    }
  }

  evaluate(result, summary) {
    const newlyUnlocked = [];
    ACHIEVEMENTS.forEach((item) => {
      if (!this.unlocked[item.id] && item.test(result, summary)) {
        this.unlocked[item.id] = Date.now();
        newlyUnlocked.push(item);
      }
    });
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(this.unlocked)); } catch { /* ignore */ }
    return newlyUnlocked;
  }

  isUnlocked(id) {
    return Boolean(this.unlocked[id]);
  }

  getUnlockedCount() {
    return Object.keys(this.unlocked).length;
  }
}
