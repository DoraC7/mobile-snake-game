// @ts-check

/**
 * 固定時間步遊戲迴圈（累加器模式）
 * 讓邏輯更新頻率與畫面刷新頻率脫鉤，確保移動插值平滑。
 */
export class GameLoop {
  /**
   * @param {{ update: (dt:number)=>void, render: (alpha:number)=>void, getStep: () => number }} handlers
   */
  constructor({ update, render, getStep }) {
    this.update = update;
    this.render = render;
    this.getStep = getStep;
    this.accumulator = 0;
    this.lastTime = 0;
    this.running = false;
    this._rafId = 0;
    this._tick = this._tick.bind(this);
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.accumulator = 0;
    this._rafId = requestAnimationFrame(this._tick);
  }

  stop() {
    this.running = false;
    if (this._rafId) cancelAnimationFrame(this._rafId);
  }

  /** @param {number} now */
  _tick(now) {
    if (!this.running) return;
    let delta = (now - this.lastTime) / 1000;
    this.lastTime = now;
    // 防止分頁被切到背景太久導致一次補太多 tick
    if (delta > 0.25) delta = 0.25;
    this.accumulator += delta;

    const step = this.getStep();
    while (this.accumulator >= step) {
      this.update(step);
      this.accumulator -= step;
    }

    const alpha = this.accumulator / step;
    this.render(alpha);
    this._rafId = requestAnimationFrame(this._tick);
  }
}
