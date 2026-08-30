// @ts-check
/**
 * 全域常數設定
 * 集中管理，避免魔術數字散落各處。
 */

export const CONFIG = Object.freeze({
  /** 格子欄數 */
  COLS: 21,
  /** 格子列數 */
  ROWS: 21,
  /** 每格像素大小（實際渲染時會依畫布尺寸縮放） */
  CELL_SIZE: 20,
  /** 邏輯更新頻率（tick/秒），數字越大蛇移動越快 */
  TICK_RATE: 8,
  /** 隨分數提升更新頻率的上限（避免無限加速失控） */
  MAX_TICK_RATE: 16,
  /** 每吃 N 個食物，tick rate +1（漸進加速） */
  SPEEDUP_EVERY_N_FOOD: 5,
  /** 蛇初始長度 */
  INITIAL_LENGTH: 3,
  /** 方向輸入佇列最大緩衝數量 */
  INPUT_QUEUE_MAX: 2,
  /** 觸控滑動最小距離門檻（px） */
  SWIPE_MIN_DISTANCE: 30,
  /** 卡通風格配色：藍色蛇身 + 綠色棋盤 + 紅蘋果 */
  COLOR_SNAKE: '#4C8DFF',
  COLOR_SNAKE_HEAD: '#5B9BFF',
  COLOR_SNAKE_OUTLINE: '#2E5FCC',
  COLOR_SNAKE_HIGHLIGHT: 'rgba(255,255,255,0.35)',
  COLOR_FOOD: '#E63946',
  COLOR_FOOD_HIGHLIGHT: 'rgba(255,255,255,0.55)',
  COLOR_FOOD_LEAF: '#4CAF50',
  COLOR_FOOD_STEM: '#6B4226',
  /** 棋盤格雙色（休閒卡通綠） */
  COLOR_BOARD_A: '#AAD751',
  COLOR_BOARD_B: '#A2D149',
  COLOR_BG: '#14181a',
  COLOR_GRID: 'rgba(255,255,255,0.03)',
  COLOR_TEXT: '#eef1ee',
  /** localStorage key 前綴 */
  STORAGE_PREFIX: 'mobile-snake:',
});

/** 遊戲狀態列舉 */
export const GameState = Object.freeze({
  TITLE: 'TITLE',
  PLAYING: 'PLAYING',
  PAUSED: 'PAUSED',
  DYING: 'DYING',
  GAME_OVER: 'GAME_OVER',
});

/** 方向列舉（dx, dy） */
export const Direction = Object.freeze({
  UP: { x: 0, y: -1, name: 'UP' },
  DOWN: { x: 0, y: 1, name: 'DOWN' },
  LEFT: { x: -1, y: 0, name: 'LEFT' },
  RIGHT: { x: 1, y: 0, name: 'RIGHT' },
});

/**
 * 判斷兩個方向是否互為反向（用來過濾非法輸入）
 * @param {{x:number,y:number}} a
 * @param {{x:number,y:number}} b
 */
export function isOpposite(a, b) {
  return a.x === -b.x && a.y === -b.y;
}
