// @ts-check
import { CONFIG, GameState } from './config.js?v=9';
import { Grid } from './grid.js?v=9';
import { Snake } from './snake.js?v=9';
import { FoodManager } from './food-manager.js?v=9';
import { StateMachine } from './state-machine.js?v=9';
import { GameLoop } from './game-loop.js?v=9';
import { createGameRules } from './game-rules.js?v=9';

/**
 * Facade：協調 Grid / Snake / FoodManager / StateMachine / GameLoop
 * 對外提供簡單 API，並透過 callbacks 通知外部（renderer/haptic/audio/stats）。
 */
export class Game {
  /**
   * @param {{
  *  onEat?: (event:{type:string,points:number,combo:number,multiplier:number}) => void,
   *  onDeath?: () => void,
   *  onStateChange?: (from:string, to:string) => void,
   *  onScoreChange?: (score:number) => void,
  *  onCountdown?: (seconds:number) => void,
  *  onSpeedLevelChange?: (level:number) => void,
  *  onComboChange?: (combo:number,multiplier:number) => void,
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
    this.rules = createGameRules();
    this.tickRate = this.rules.initialTickRate;
    this._dyingTimer = 0;
    this._countdownRemaining = 0;
    this.elapsedSeconds = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.comboRemaining = 0;
    this.speedLevel = 1;
    this.maxSpeedLevel = 1;
    this.goldenFoodEaten = 0;
    /** @type {{x:number,y:number}[]} */
    this.obstacles = [];

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

  /** @param {{difficulty?:string, mode?:string, wrapWalls?:boolean, dailyChallenge?:{id:string,targetScore:number,seed:number}}} options */
  configure(options) {
    this.rules = createGameRules(options);
    this.dailyChallenge = options.dailyChallenge || null;
    this._random = this.dailyChallenge ? this._createSeededRandom(this.dailyChallenge.seed) : Math.random;
  }

  /** 重置本局並進入開始倒數。 */
  startNewGame() {
    this.snake.reset();
    this.obstacles = this._buildObstacles();
    this.food.golden = null;
    this.food.spawn(this.snake.body, this.obstacles, this._random);
    this.score = 0;
    this.foodEatenThisGame = 0;
    this.tickRate = this.rules.initialTickRate;
    this._dyingTimer = 0;
    this.elapsedSeconds = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.comboRemaining = 0;
    this.speedLevel = 1;
    this.maxSpeedLevel = 1;
    this.goldenFoodEaten = 0;
    this._startCountdown();
    this.callbacks.onScoreChange && this.callbacks.onScoreChange(this.score);
  }

  restart() {
    if (this.stateMachine.is(GameState.PLAYING) || this.stateMachine.is(GameState.COUNTDOWN)) {
      this.stateMachine.transition(GameState.PAUSED);
    }
    this.startNewGame();
  }

  pause() {
    const state = this.stateMachine.state;
    if (state !== GameState.PLAYING && state !== GameState.COUNTDOWN) return false;
    return this.stateMachine.transition(GameState.PAUSED);
  }

  resume() {
    if (!this.stateMachine.is(GameState.PAUSED)) return false;
    this._startCountdown();
    return true;
  }

  returnToTitle() {
    if (this.stateMachine.is(GameState.TITLE)) return true;
    return this.stateMachine.transition(GameState.TITLE);
  }

  _startCountdown() {
    this._countdownRemaining = CONFIG.COUNTDOWN_SECONDS;
    this.loop.resetClock();
    if (!this.stateMachine.transition(GameState.COUNTDOWN)) return;
    this.callbacks.onCountdown && this.callbacks.onCountdown(Math.ceil(this._countdownRemaining));
  }

  queueDirection(dir) {
    if (!this.stateMachine.is(GameState.PLAYING)) return;
    this.snake.queueDirection(dir);
  }

  /** @param {number} dt */
  _update(dt) {
    const state = this.stateMachine.state;

    if (state === GameState.COUNTDOWN) {
      const before = Math.ceil(this._countdownRemaining);
      this._countdownRemaining -= dt;
      const after = Math.max(0, Math.ceil(this._countdownRemaining));
      if (after !== before) this.callbacks.onCountdown && this.callbacks.onCountdown(after);
      if (this._countdownRemaining <= 0) {
        this.loop.resetClock();
        this.stateMachine.transition(GameState.PLAYING);
      }
    } else if (state === GameState.PLAYING) {
      this.elapsedSeconds += dt;
      this.food.update(dt);
      if (this.combo > 0) {
        this.comboRemaining -= dt;
        if (this.comboRemaining <= 0) {
          this.combo = 0;
          this.callbacks.onComboChange && this.callbacks.onComboChange(0, 1);
        }
      }
      this.snake._prevBody = this.snake.body.map((s) => ({ x: s.x, y: s.y }));
      const alive = this.snake.step({ ...this.rules, obstacles: this.obstacles });

      if (!alive) {
        this.stateMachine.transition(GameState.DYING);
        this._dyingTimer = 0;
        this.callbacks.onDeath && this.callbacks.onDeath();
        return;
      }

      const foodType = this.food.consumeAt(this.snake.head);
      if (foodType) {
        const basePoints = foodType === 'golden' ? 3 : 1;
        this.combo = this.comboRemaining > 0 ? this.combo + 1 : 1;
        this.comboRemaining = CONFIG.COMBO_WINDOW_SECONDS;
        this.maxCombo = Math.max(this.maxCombo, this.combo);
        const multiplier = Math.min(4, 1 + Math.floor((this.combo - 1) / 3));
        const points = basePoints * multiplier;
        this.snake.grow(foodType === 'golden' ? 2 : 1);
        this.score += points;
        this.foodEatenThisGame += 1;
        if (foodType === 'golden') {
          this.goldenFoodEaten += 1;
        } else {
          this.food.spawn(this.snake.body, this.obstacles, this._random);
          if (this.foodEatenThisGame % CONFIG.GOLDEN_FOOD_EVERY === 0) {
            this.food.spawnGolden(this.snake.body, this.obstacles, this._random);
          }
          this._maybeSpeedUp();
        }
        this.callbacks.onComboChange && this.callbacks.onComboChange(this.combo, multiplier);
        this.callbacks.onEat && this.callbacks.onEat({ type: foodType, points, combo: this.combo, multiplier });
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
    if (this.foodEatenThisGame % this.rules.speedupEveryFood === 0) {
      const nextRate = Math.min(this.rules.maxTickRate, this.tickRate + 1);
      if (nextRate !== this.tickRate) {
        this.tickRate = nextRate;
        this.speedLevel += 1;
        this.maxSpeedLevel = Math.max(this.maxSpeedLevel, this.speedLevel);
        this.callbacks.onSpeedLevelChange && this.callbacks.onSpeedLevelChange(this.speedLevel);
      }
    }
  }

  _buildObstacles() {
    if (this.rules.mode !== 'obstacle' && this.rules.mode !== 'daily') return [];
    const cells = [];
    const c = Math.floor(this.grid.cols / 2);
    const positions = [
      { x: c - 5, y: c - 5 }, { x: c - 4, y: c - 5 }, { x: c - 5, y: c - 4 },
      { x: c + 5, y: c - 5 }, { x: c + 4, y: c - 5 }, { x: c + 5, y: c - 4 },
      { x: c - 5, y: c + 5 }, { x: c - 4, y: c + 5 }, { x: c - 5, y: c + 4 },
      { x: c + 5, y: c + 5 }, { x: c + 4, y: c + 5 }, { x: c + 5, y: c + 4 },
    ];
    positions.forEach((cell) => {
      if (!this.snake.body.some((part) => Grid.equals(part, cell))) cells.push(cell);
    });
    return cells;
  }

  _createSeededRandom(seed) {
    let value = seed >>> 0;
    return () => {
      value += 0x6D2B79F5;
      let t = value;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  getResult() {
    return {
      score: this.score,
      length: this.snake.length,
      foodEaten: this.foodEatenThisGame,
      goldenFoodEaten: this.goldenFoodEaten,
      maxCombo: this.maxCombo,
      maxSpeedLevel: this.maxSpeedLevel,
      durationSeconds: Math.round(this.elapsedSeconds),
      mode: this.rules.mode,
      difficulty: this.rules.difficulty,
      deathReason: this.snake.deathReason,
      dailyId: this.dailyChallenge ? this.dailyChallenge.id : null,
      dailyCompleted: this.dailyChallenge ? this.score >= this.dailyChallenge.targetScore : false,
    };
  }
}
