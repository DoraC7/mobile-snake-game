// @ts-check
import { Grid } from './grid.js?v=9';
import { CONFIG } from './config.js?v=9';

/**
 * 食物生成與碰撞檢查
 */
export class FoodManager {
  /**
   * @param {Grid} grid
   */
  constructor(grid) {
    this.grid = grid;
    /** @type {{x:number,y:number}} */
    this.position = { x: 0, y: 0 };
    /** @type {{x:number,y:number,remaining:number,duration:number}|null} */
    this.golden = null;
  }

  /**
   * 產生新的食物位置，避開蛇身
   * @param {{x:number,y:number}[]} occupied
  * @param {{x:number,y:number}[]} [blocked]
  * @param {()=>number} [rng]
   */
  spawn(occupied, blocked = [], rng = Math.random) {
    const extra = this.golden ? [this.golden] : [];
    const candidate = this._randomFreeCell([...occupied, ...blocked, ...extra], rng);
    if (candidate) this.position = candidate;
  }

  /** @param {{x:number,y:number}[]} occupied @param {{x:number,y:number}[]} [blocked] @param {()=>number} [rng] */
  spawnGolden(occupied, blocked = [], rng = Math.random) {
    const candidate = this._randomFreeCell([...occupied, ...blocked, this.position], rng);
    if (!candidate) return false;
    this.golden = {
      ...candidate,
      remaining: CONFIG.GOLDEN_FOOD_DURATION,
      duration: CONFIG.GOLDEN_FOOD_DURATION,
    };
    return true;
  }

  /** @param {number} dt */
  update(dt) {
    if (!this.golden) return;
    this.golden.remaining -= dt;
    if (this.golden.remaining <= 0) this.golden = null;
  }

  /** @param {{x:number,y:number}} pos */
  consumeAt(pos) {
    if (this.golden && Grid.equals(this.golden, pos)) {
      this.golden = null;
      return 'golden';
    }
    return this.isAt(pos) ? 'normal' : null;
  }

  /** @param {{x:number,y:number}[]} occupied @param {()=>number} [rng] */
  _randomFreeCell(occupied, rng = Math.random) {
    const free = [];
    for (let y = 0; y < this.grid.rows; y += 1) {
      for (let x = 0; x < this.grid.cols; x += 1) {
        const cell = { x, y };
        if (!occupied.some((item) => Grid.equals(item, cell))) free.push(cell);
      }
    }
    return free.length ? free[Math.floor(rng() * free.length)] : null;
  }

  /**
   * 判斷某座標是否為食物所在位置
   * @param {{x:number,y:number}} pos
   */
  isAt(pos) {
    return Grid.equals(this.position, pos);
  }
}
