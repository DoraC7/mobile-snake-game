// @ts-check
import { CONFIG } from './config.js?v=9';

export const Difficulty = Object.freeze({
  EASY: 'easy',
  NORMAL: 'normal',
  HARD: 'hard',
});

export const GameMode = Object.freeze({
  CLASSIC: 'classic',
  BOUNDARY: 'boundary',
  OBSTACLE: 'obstacle',
  DAILY: 'daily',
});

const DIFFICULTY_PRESETS = Object.freeze({
  [Difficulty.EASY]: Object.freeze({ initialTickRate: 6, maxTickRate: 12, speedupEveryFood: 7 }),
  [Difficulty.NORMAL]: Object.freeze({
    initialTickRate: CONFIG.TICK_RATE,
    maxTickRate: CONFIG.MAX_TICK_RATE,
    speedupEveryFood: CONFIG.SPEEDUP_EVERY_N_FOOD,
  }),
  [Difficulty.HARD]: Object.freeze({ initialTickRate: 10, maxTickRate: 18, speedupEveryFood: 4 }),
});

/**
 * 建立經過驗證且不可變的遊戲規則。
 * @param {{difficulty?:string, mode?:string, wrapWalls?:boolean}} [options]
 */
export function createGameRules(options = {}) {
  const difficulty = Object.hasOwn(DIFFICULTY_PRESETS, options.difficulty || '')
    ? options.difficulty
    : Difficulty.NORMAL;
  const speed = DIFFICULTY_PRESETS[difficulty];
  const requestedMode = options.mode || (options.wrapWalls === false ? GameMode.BOUNDARY : GameMode.CLASSIC);
  const mode = Object.values(GameMode).includes(requestedMode) ? requestedMode : GameMode.CLASSIC;
  return Object.freeze({
    difficulty,
    mode,
    wrapWalls: mode === GameMode.CLASSIC,
    ...speed,
  });
}
