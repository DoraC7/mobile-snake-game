// @ts-check
import { CONFIG, GameState } from './config.js';
import { Grid } from './grid.js';
import { Snake } from './snake.js';
import { FoodManager } from './food-manager.js';
import { StateMachine } from './state-machine.js';
import { GameLoop } from './game-loop.js';

/**
 * Facade：協調 Grid / Snake / FoodManager / StateMachine / GameLoop
 * 對外提供簡單 API，並透過 callbacks 通知外部（renderer/haptic/audio/stats）。
 */
export class Game {
  /**
   * @param {{
   *  onEat?: () => void,
   *  onDeath?: () => void,
   *  onStateChange?: (from:string, to:string) => void,
   *  onScoreChange?: (score:number) => void,
   * }} [callbacks]
   */
  constructor(callbacks = {}) {
    this.callbacks = callbacks;
    this.grid = new Grid(CONFIG.COLS, CONFIG.ROWS);
    this.snake = new Snake(this.grid);
    this.food = new FoodManager(this.grid);
    this.stateMachine = new StateMachine();
    this.score = 0;
    this.foodEatenThisGame = 0;
    this.tickRate = CONFIG.TICK_RATE;
    this._dyingTimer = 0;

    this.stateMachine.onChange((from, to) => {
      this.callbacks.onStateChange && this.callbacks.onStateChange(from, to);
    });

    this.loop = new GameLoop({
      update: (dt) => this._update(dt),
      render: (alpha) => {
        this._onRender && this._onRender(alpha);
      },
      getStep: () => 1 / this.tickRate,
    });
  }

  /** @param {(alpha:number)=>void} cb */
  setRenderCallback(cb) {
    this._onRender = cb;
  }

  start() {
    this.loop.start();
  }

  /** 由 TITLE 進入 PLAYING，重置所有狀態 */
  startNewGame() {
    this.snake.reset();
    this.food.spawn(this.snake.body);
    this.score = 0;
    this.foodEatenThisGame = 0;
    this.tickRate = CONFIG.TICK_RATE;
    this.stateMachine.transition(GameState.PLAYING);
    this.callbacks.onScoreChange && this.callbacks.onScoreChange(this.score);
  }

  queueDirection(dir) {
    if (!this.stateMachine.is(GameState.PLAYING)) return;
    this.snake.queueDirection(dir);
  }

  /** @param {number} dt */
  _update(dt) {
    const state = this.stateMachine.state;

    if (state === GameState.PLAYING) {
      this.snake._prevBody = this.snake.body.map((s) => ({ x: s.x, y: s.y }));
      const alive = this.snake.step();

      if (!alive) {
        this.stateMachine.transition(GameState.DYING);
        this._dyingTimer = 0;
        this.callbacks.onDeath && this.callbacks.onDeath();
        return;
      }

      if (this.food.isAt(this.snake.head)) {
        this.snake.grow(1);
        this.score += 1;
        this.foodEatenThisGame += 1;
        this.food.spawn(this.snake.body);
        this._maybeSpeedUp();
        this.callbacks.onEat && this.callbacks.onEat();
        this.callbacks.onScoreChange && this.callbacks.onScoreChange(this.score);
      }
    } else if (state === GameState.DYING) {
      this._dyingTimer += dt;
      if (this._dyingTimer > 0.4) {
        this.stateMachine.transition(GameState.GAME_OVER);
      }
    }
  }

  _maybeSpeedUp() {
    if (this.foodEatenThisGame % CONFIG.SPEEDUP_EVERY_N_FOOD === 0) {
      this.tickRate = Math.min(CONFIG.MAX_TICK_RATE, this.tickRate + 1);
    }
  }
}
