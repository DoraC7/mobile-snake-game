// @ts-check
import { CONFIG, Direction, isOpposite } from './config.js?v=9';
import { Grid } from './grid.js?v=9';

/**
 * 蛇身資料結構、移動、碰撞偵測
 */
export class Snake {
  /**
   * @param {Grid} grid
   */
  constructor(grid) {
    this.grid = grid;
    this.reset();
  }

  reset() {
    const cx = Math.floor(this.grid.cols / 2);
    const cy = Math.floor(this.grid.rows / 2);
    /** @type {{x:number,y:number}[]} 由頭到尾 */
    this.body = [];
    for (let i = 0; i < CONFIG.INITIAL_LENGTH; i++) {
      this.body.push({ x: cx - i, y: cy });
    }
    this.direction = Direction.RIGHT;
    /** @type {{x:number,y:number}[]} 輸入佇列 */
    this.inputQueue = [];
    this.pendingGrowth = 0;
    this.alive = true;
    /** @type {null | 'wall' | 'self' | 'obstacle'} */
    this.deathReason = null;
  }

  /**
   * 佇列一個方向輸入（含反向過濾）
   * @param {{x:number,y:number,name:string}} dir
   */
  queueDirection(dir) {
    const last = this.inputQueue.length
      ? this.inputQueue[this.inputQueue.length - 1]
      : this.direction;
    if (isOpposite(dir, last)) return; // 過濾立即反向
    if (dir.x === last.x && dir.y === last.y) return; // 過濾重複方向
    if (this.inputQueue.length >= CONFIG.INPUT_QUEUE_MAX) return; // 佇列滿了就丟棄
    this.inputQueue.push(dir);
  }

  grow(amount = 1) {
    this.pendingGrowth += amount;
  }

  /**
   * 前進一格（邏輯 tick）
  * @param {{wrapWalls?:boolean, obstacles?:{x:number,y:number}[]}} [rules]
  * @returns {boolean} 是否仍存活
   */
  step(rules = {}) {
    if (this.inputQueue.length) {
      this.direction = this.inputQueue.shift();
    }

    const head = this.body[0];
    const rawNext = { x: head.x + this.direction.x, y: head.y + this.direction.y };
    if (rules.wrapWalls === false && !this.grid.contains(rawNext)) {
      this.alive = false;
      this.deathReason = 'wall';
      return false;
    }
    const next = rules.wrapWalls === false ? rawNext : this.grid.wrap(rawNext);

    if (rules.obstacles && rules.obstacles.some((cell) => Grid.equals(cell, next))) {
      this.alive = false;
      this.deathReason = 'obstacle';
      return false;
    }

    // 撞自己偵測（尾巴會移動，除非本次要成長，所以檢查時排除即將離開的尾格）
    const willGrow = this.pendingGrowth > 0;
    const bodyToCheck = willGrow ? this.body : this.body.slice(0, -1);
    const hitSelf = bodyToCheck.some((seg) => Grid.equals(seg, next));

    if (hitSelf) {
      this.alive = false;
      this.deathReason = 'self';
      return false;
    }

    this.body.unshift(next);
    if (willGrow) {
      this.pendingGrowth -= 1;
    } else {
      this.body.pop();
    }
    return true;
  }

  get head() {
    return this.body[0];
  }

  get length() {
    return this.body.length;
  }
}
