// @ts-check
import { Grid } from './grid.js';

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
  }

  /**
   * 產生新的食物位置，避開蛇身
   * @param {{x:number,y:number}[]} occupied
   */
  spawn(occupied) {
    const total = this.grid.cols * this.grid.rows;
    if (occupied.length >= total) {
      // 幾乎填滿地圖，找不到空位就不生成（理論上很難發生）
      return;
    }
    let candidate = this.grid.randomCell();
    let attempts = 0;
    while (occupied.some((seg) => Grid.equals(seg, candidate)) && attempts < 500) {
      candidate = this.grid.randomCell();
      attempts += 1;
    }
    this.position = candidate;
  }

  /**
   * 判斷某座標是否為食物所在位置
   * @param {{x:number,y:number}} pos
   */
  isAt(pos) {
    return Grid.equals(this.position, pos);
  }
}
