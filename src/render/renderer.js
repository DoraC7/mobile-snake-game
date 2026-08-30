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
    this._drawBoard();

    this._drawFood(food, dt);
    this._drawSnake(snake, alpha);
  }

  /** 繪製綠色雙色棋盤格背景 */
  _drawBoard() {
    const { ctx, cellSize, grid } = this;
    for (let y = 0; y < grid.rows; y++) {
      for (let x = 0; x < grid.cols; x++) {
        ctx.fillStyle = (x + y) % 2 === 0 ? CONFIG.COLOR_BOARD_A : CONFIG.COLOR_BOARD_B;
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
      }
    }
  }

  /** @param {import('../core/food-manager.js').FoodManager} food */
  _drawFood(food, dt) {
    this._foodPulseT += dt;
    const pulse = Math.max(0, 1 - this._foodPulseT / 0.2); // 0.2 秒內衰減
    const scale = 1 + pulse * 0.4;
    const { ctx, cellSize } = this;
    const cx = (food.position.x + 0.5) * cellSize;
    const cy = (food.position.y + 0.5) * cellSize;
    const r = cellSize * 0.36 * scale;

    ctx.save();
    // 蘋果本體
    ctx.fillStyle = CONFIG.COLOR_FOOD;
    ctx.beginPath();
    ctx.arc(cx, cy + r * 0.08, r, 0, Math.PI * 2);
    ctx.fill();

    // 高光
    ctx.fillStyle = CONFIG.COLOR_FOOD_HIGHLIGHT;
    ctx.beginPath();
    ctx.ellipse(cx - r * 0.35, cy - r * 0.3, r * 0.28, r * 0.18, -0.5, 0, Math.PI * 2);
    ctx.fill();

    // 蒂
    ctx.strokeStyle = CONFIG.COLOR_FOOD_STEM;
    ctx.lineWidth = Math.max(1, cellSize * 0.06);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cx, cy - r * 0.9);
    ctx.lineTo(cx + r * 0.12, cy - r * 1.35);
    ctx.stroke();

    // 葉子
    ctx.fillStyle = CONFIG.COLOR_FOOD_LEAF;
    ctx.beginPath();
    ctx.ellipse(cx + r * 0.35, cy - r * 1.2, r * 0.32, r * 0.16, -0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  /**
   * 計算插值後的蛇身座標（格子單位）
   * @param {import('../core/snake.js').Snake} snake
   * @param {number} alpha
   * @returns {{x:number,y:number}[]}
   */
  _computeInterpolatedPoints(snake, alpha) {
    const body = snake.body;
    const pts = [];
    for (let i = 0; i < body.length; i++) {
      const seg = body[i];
      const prev = snake._prevBody ? snake._prevBody[i] : undefined;
      let x = seg.x;
      let y = seg.y;
      if (prev) {
        const dx = seg.x - prev.x;
        const dy = seg.y - prev.y;
        if (Math.abs(dx) <= 1 && Math.abs(dy) <= 1) {
          x = prev.x + dx * alpha;
          y = prev.y + dy * alpha;
        }
      }
      pts.push({ x, y });
    }
    return pts;
  }

  /**
   * 沿蛇身中心點畫出圓角、連續、粗厚的線條（遇到穿牆跳躍時斷開子路徑）
   * @param {{x:number,y:number}[]} pts 格子單位座標
   * @param {number} lineWidth 像素寬度
   * @param {string} color
   */
  _strokeSnakePath(pts, lineWidth, color) {
    const { ctx, cellSize } = this;
    ctx.save();
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = color;

    ctx.beginPath();
    let started = false;
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      const px = (p.x + 0.5) * cellSize;
      const py = (p.y + 0.5) * cellSize;
      if (i > 0) {
        const prev = pts[i - 1];
        const dx = Math.abs(p.x - prev.x);
        const dy = Math.abs(p.y - prev.y);
        if (dx > 1.5 || dy > 1.5) {
          // 穿牆跳躍：斷開子路徑，避免畫出橫跨整個畫布的線
          started = false;
        }
      }
      if (!started) {
        ctx.moveTo(px, py);
        started = true;
      } else {
        ctx.lineTo(px, py);
      }
    }
    ctx.stroke();
    ctx.restore();
  }

  /**
   * @param {import('../core/snake.js').Snake} snake
   * @param {number} alpha
   */
  _drawSnake(snake, alpha) {
    const { ctx, cellSize } = this;
    const pts = this._computeInterpolatedPoints(snake, alpha);
    if (!pts.length) return;

    const bodyWidth = cellSize * 0.72;

    // 深色描邊，加強卡通輪廓感
    this._strokeSnakePath(pts, bodyWidth + cellSize * 0.14, CONFIG.COLOR_SNAKE_OUTLINE);
    // 主體藍色，圓角連續造型（轉彎處自動呈圓弧，不出現直角）
    this._strokeSnakePath(pts, bodyWidth, CONFIG.COLOR_SNAKE);

    // 蛇頭：圓潤且略大於身體
    this._drawHead(pts[0], snake.direction, bodyWidth);
  }

  /**
   * 繪製圓潤蛇頭與簡潔可愛的眼睛
   * @param {{x:number,y:number}} headPt 格子單位座標
   * @param {{x:number,y:number}} dir 目前移動方向
   * @param {number} bodyWidth 身體像素寬度
   */
  _drawHead(headPt, dir, bodyWidth) {
    const { ctx, cellSize } = this;
    const cx = (headPt.x + 0.5) * cellSize;
    const cy = (headPt.y + 0.5) * cellSize;
    const headRadius = bodyWidth * 0.62; // 略大於身體半徑

    // 注意：不可用 `dir?.x || 1`，因為 dir.x/dir.y 合法值可能是 0（往上/往下移動時）
    // 用 `||` 會把 0 誤判為 falsy 而退回預設值，導致垂直移動時眼睛歪向水平偏移
    const dx = dir ? dir.x : 1;
    const dy = dir ? dir.y : 0;
    const px = -dy; // 垂直於前進方向
    const py = dx;

    // 深色外框
    ctx.fillStyle = CONFIG.COLOR_SNAKE_OUTLINE;
    ctx.beginPath();
    ctx.arc(cx, cy, headRadius + cellSize * 0.05, 0, Math.PI * 2);
    ctx.fill();

    // 頭部主體
    ctx.fillStyle = CONFIG.COLOR_SNAKE_HEAD;
    ctx.beginPath();
    ctx.arc(cx, cy, headRadius, 0, Math.PI * 2);
    ctx.fill();

    // 眼睛（白眼底 + 黑眼珠，朝前方偏移，簡潔可愛）
    const eyeForward = headRadius * 0.45;
    const eyeSpread = headRadius * 0.5;
    const eyeR = headRadius * 0.32;
    const pupilR = headRadius * 0.16;
    const eyeCenters = [
      { x: cx + dx * eyeForward + px * eyeSpread, y: cy + dy * eyeForward + py * eyeSpread },
      { x: cx + dx * eyeForward - px * eyeSpread, y: cy + dy * eyeForward - py * eyeSpread },
    ];
    for (const e of eyeCenters) {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(e.x, e.y, eyeR, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#22262b';
      ctx.beginPath();
      ctx.arc(e.x + dx * eyeR * 0.3, e.y + dy * eyeR * 0.3, pupilR, 0, Math.PI * 2);
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
