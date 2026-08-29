// @ts-check
import { CONFIG } from '../core/config.js';

/**
 * Canvas 2D 繪圖（極簡風格），支援移動插值與吃食物彈跳動畫
 */
export class Renderer {
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {import('../core/grid.js').Grid} grid
   */
  constructor(canvas, grid) {
    this.canvas = canvas;
    this.grid = grid;
    this.ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));
    this.cellSize = CONFIG.CELL_SIZE;
    /** 食物彈跳動畫計時器（秒），每次吃到食物時重置 */
    this._foodPulseT = 999;
    this.resize();
  }

  resize() {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    this.cellSize = Math.floor(
      Math.min(rect.width / this.grid.cols, rect.height / this.grid.rows)
    );
    this.canvas.width = this.grid.cols * this.cellSize * dpr;
    this.canvas.height = this.grid.rows * this.cellSize * dpr;
    this.canvas.style.width = `${this.grid.cols * this.cellSize}px`;
    this.canvas.style.height = `${this.grid.rows * this.cellSize}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  triggerFoodPulse() {
    this._foodPulseT = 0;
  }

  /**
   * @param {import('../core/snake.js').Snake} snake
   * @param {import('../core/food-manager.js').FoodManager} food
   * @param {number} alpha 插值係數 0~1
   * @param {number} dt 每幀秒數，用於動畫計時
   */
  render(snake, food, alpha, dt) {
    const { ctx, cellSize } = this;
    const w = this.grid.cols * cellSize;
    const h = this.grid.rows * cellSize;

    ctx.fillStyle = CONFIG.COLOR_BG;
    ctx.fillRect(0, 0, w, h);

    this._drawFood(food, dt);
    this._drawSnake(snake, alpha);
  }

  /** @param {import('../core/food-manager.js').FoodManager} food */
  _drawFood(food, dt) {
    this._foodPulseT += dt;
    const pulse = Math.max(0, 1 - this._foodPulseT / 0.2); // 0.2 秒內衰減
    const scale = 1 + pulse * 0.4;
    const { ctx, cellSize } = this;
    const cx = (food.position.x + 0.5) * cellSize;
    const cy = (food.position.y + 0.5) * cellSize;
    const size = cellSize * 0.7 * scale;
    ctx.fillStyle = CONFIG.COLOR_FOOD;
    this._roundRect(ctx, cx - size / 2, cy - size / 2, size, size, size * 0.3);
    ctx.fill();
  }

  /**
   * @param {import('../core/snake.js').Snake} snake
   * @param {number} alpha
   */
  _drawSnake(snake, alpha) {
    const { ctx, cellSize } = this;
    const body = snake.body;
    for (let i = body.length - 1; i >= 0; i--) {
      const seg = body[i];
      const prev = snake._prevBody ? snake._prevBody[i] : undefined;
      let x = seg.x;
      let y = seg.y;
      if (prev) {
        // 若座標差距過大（wrap 穿牆），不插值，避免畫面飛越整個畫布
        const dx = seg.x - prev.x;
        const dy = seg.y - prev.y;
        if (Math.abs(dx) <= 1 && Math.abs(dy) <= 1) {
          x = prev.x + dx * alpha;
          y = prev.y + dy * alpha;
        }
      }
      const px = x * cellSize;
      const py = y * cellSize;
      ctx.fillStyle = i === 0 ? CONFIG.COLOR_SNAKE_HEAD : CONFIG.COLOR_SNAKE;
      const pad = cellSize * 0.08;
      this._roundRect(ctx, px + pad, py + pad, cellSize - pad * 2, cellSize - pad * 2, cellSize * 0.25);
      ctx.fill();
    }
  }

  _roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
}
