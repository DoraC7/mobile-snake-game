// @ts-check
import { CONFIG, Direction } from '../core/config.js';

const KEY_MAP = {
  ArrowUp: Direction.UP,
  KeyW: Direction.UP,
  ArrowDown: Direction.DOWN,
  KeyS: Direction.DOWN,
  ArrowLeft: Direction.LEFT,
  KeyA: Direction.LEFT,
  ArrowRight: Direction.RIGHT,
  KeyD: Direction.RIGHT,
};

/**
 * 鍵盤 + 觸控滑動 + D-pad 輸入整合
 */
export class InputManager {
  /**
   * @param {{ onDirection: (dir:any)=>void, onPrimaryAction: ()=>void }} handlers
   */
  constructor({ onDirection, onPrimaryAction }) {
    this.onDirection = onDirection;
    this.onPrimaryAction = onPrimaryAction;
    this._touchStart = null;
    this._bindKeyboard();
  }

  _bindKeyboard() {
    window.addEventListener('keydown', (e) => {
      const dir = KEY_MAP[e.code];
      if (dir) {
        e.preventDefault();
        this.onDirection(dir);
      } else if (e.code === 'Space' || e.code === 'Enter') {
        this.onPrimaryAction();
      }
    });
  }

  /**
   * 綁定觸控滑動手勢到指定元素
   * @param {HTMLElement} el
   */
  bindSwipe(el) {
    el.addEventListener(
      'touchstart',
      (e) => {
        const t = e.changedTouches[0];
        this._touchStart = { x: t.clientX, y: t.clientY };
      },
      { passive: true }
    );

    el.addEventListener(
      'touchend',
      (e) => {
        if (!this._touchStart) return;
        const t = e.changedTouches[0];
        const dx = t.clientX - this._touchStart.x;
        const dy = t.clientY - this._touchStart.y;
        this._touchStart = null;

        const absX = Math.abs(dx);
        const absY = Math.abs(dy);
        if (Math.max(absX, absY) < CONFIG.SWIPE_MIN_DISTANCE) {
          // 距離太短視為點擊（可用於開始/重新開始）
          this.onPrimaryAction();
          return;
        }

        if (absX > absY) {
          this.onDirection(dx > 0 ? Direction.RIGHT : Direction.LEFT);
        } else {
          this.onDirection(dy > 0 ? Direction.DOWN : Direction.UP);
        }
      },
      { passive: true }
    );
  }

  /**
   * 綁定 D-pad 按鈕（元素需有 data-dir="UP|DOWN|LEFT|RIGHT" 屬性）
   * @param {NodeListOf<Element> | Element[]} buttons
   */
  bindDpad(buttons) {
    buttons.forEach((btn) => {
      btn.addEventListener(
        'touchstart',
        (e) => {
          e.preventDefault();
          const name = btn.getAttribute('data-dir');
          const dir = Direction[name];
          if (dir) this.onDirection(dir);
        },
        { passive: false }
      );
      btn.addEventListener('click', () => {
        const name = btn.getAttribute('data-dir');
        const dir = Direction[name];
        if (dir) this.onDirection(dir);
      });
    });
  }
}
