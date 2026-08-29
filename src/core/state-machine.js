// @ts-check
import { GameState } from './config.js';

/**
 * 極簡狀態機：TITLE / PLAYING / PAUSED / DYING / GAME_OVER
 */
export class StateMachine {
  constructor() {
    this.state = GameState.TITLE;
    /** @type {Map<string, Set<string>>} 合法轉換表 */
    this.transitions = new Map([
      [GameState.TITLE, new Set([GameState.PLAYING])],
      [GameState.PLAYING, new Set([GameState.PAUSED, GameState.DYING])],
      [GameState.PAUSED, new Set([GameState.PLAYING])],
      [GameState.DYING, new Set([GameState.GAME_OVER])],
      [GameState.GAME_OVER, new Set([GameState.TITLE, GameState.PLAYING])],
    ]);
    /** @type {((from:string,to:string)=>void)[]} */
    this._listeners = [];
  }

  /**
   * @param {string} to
   * @returns {boolean} 是否轉換成功
   */
  transition(to) {
    const allowed = this.transitions.get(this.state);
    if (!allowed || !allowed.has(to)) return false;
    const from = this.state;
    this.state = to;
    this._listeners.forEach((cb) => cb(from, to));
    return true;
  }

  /** @param {(from:string,to:string)=>void} cb */
  onChange(cb) {
    this._listeners.push(cb);
  }

  is(state) {
    return this.state === state;
  }
}
