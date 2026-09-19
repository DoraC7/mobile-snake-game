// @ts-check
import { GameState } from './config.js?v=9';

/**
 * 遊戲狀態機：包含首次教學、開始倒數、暫停及結束流程。
 */
export class StateMachine {
  constructor() {
    this.state = GameState.TITLE;
    /** @type {Map<string, Set<string>>} 合法轉換表 */
    this.transitions = new Map([
      [GameState.TITLE, new Set([GameState.TUTORIAL, GameState.COUNTDOWN])],
      [GameState.TUTORIAL, new Set([GameState.COUNTDOWN, GameState.TITLE])],
      [GameState.COUNTDOWN, new Set([GameState.PLAYING, GameState.PAUSED, GameState.TITLE])],
      [GameState.PLAYING, new Set([GameState.PAUSED, GameState.DYING, GameState.TITLE])],
      [GameState.PAUSED, new Set([GameState.COUNTDOWN, GameState.TITLE])],
      [GameState.DYING, new Set([GameState.GAME_OVER, GameState.TITLE])],
      [GameState.GAME_OVER, new Set([GameState.COUNTDOWN, GameState.TITLE])],
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
