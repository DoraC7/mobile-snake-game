// @ts-check
import { CONFIG } from './config.js';

/**
 * 座標系統與邊界（wrap-around）邏輯
 */
export class Grid {
  constructor(cols = CONFIG.COLS, rows = CONFIG.ROWS) {
    this.cols = cols;
    this.rows = rows;
  }

  /**
   * 將座標依 wrap-around 規則正規化
   * @param {{x:number,y:number}} pos
   * @returns {{x:number,y:number}}
   */
  wrap(pos) {
    let x = pos.x % this.cols;
    let y = pos.y % this.rows;
    if (x < 0) x += this.cols;
    if (y < 0) y += this.rows;
    return { x, y };
  }

  /** @param {{x:number,y:number}} pos */
  contains(pos) {
    return pos.x >= 0 && pos.x < this.cols && pos.y >= 0 && pos.y < this.rows;
  }

  /**
   * 產生隨機格子座標
   * @returns {{x:number,y:number}}
   */
  randomCell() {
    return {
      x: Math.floor(Math.random() * this.cols),
      y: Math.floor(Math.random() * this.rows),
    };
  }

  /**
   * 兩座標是否相同
   * @param {{x:number,y:number}} a
   * @param {{x:number,y:number}} b
   */
  static equals(a, b) {
    return a.x === b.x && a.y === b.y;
  }
}
