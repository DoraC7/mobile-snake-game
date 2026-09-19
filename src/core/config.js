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
  /** 開始與恢復遊戲前的倒數秒數 */
  COUNTDOWN_SECONDS: 3,
  /** 首次操作教學版本；調升可讓既有玩家重新看到新版教學 */
  TUTORIAL_VERSION: 1,
  /** 連續吃到食物可延續 Combo 的遊戲時間 */
  COMBO_WINDOW_SECONDS: 3,
  /** 每吃幾個普通食物生成一次金色食物 */
  GOLDEN_FOOD_EVERY: 5,
  /** 金色食物存在秒數 */
  GOLDEN_FOOD_DURATION: 5,
  /** Neon Arcade 配色：青綠蛇身 + 深色棋盤 + 橘紅蘋果 */
  COLOR_SNAKE: '#00e5ff',
  COLOR_SNAKE_HEAD: '#80f0ff',
  COLOR_SNAKE_OUTLINE: '#007a99',
  COLOR_SNAKE_HIGHLIGHT: 'rgba(255,255,255,0.4)',
  COLOR_FOOD: '#ff4d6d',
  COLOR_FOOD_HIGHLIGHT: 'rgba(255,255,255,0.6)',
  COLOR_FOOD_LEAF: '#00e676',
  COLOR_FOOD_STEM: '#4a2040',
  /** 棋盤格雙色（深夜霓虹底） */
  COLOR_BOARD_A: '#0f1625',
  COLOR_BOARD_B: '#0b1020',
  COLOR_BG: '#080c18',
  COLOR_GRID: 'rgba(0,229,255,0.03)',
  COLOR_TEXT: '#e2e8f4',
  /** localStorage key 前綴 */
  STORAGE_PREFIX: 'mobile-snake:',
});

/** 遊戲狀態列舉 */
export const GameState = Object.freeze({
  TITLE: 'TITLE',
  TUTORIAL: 'TUTORIAL',
  COUNTDOWN: 'COUNTDOWN',
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
