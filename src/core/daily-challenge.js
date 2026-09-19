// @ts-check

/** 回傳本機日期的 YYYY-MM-DD。 @param {Date} [date] */
export function localDateId(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** @param {string} text */
export function hashSeed(text) {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/** @param {string} id */
export function createDailyChallenge(id = localDateId()) {
  const seed = hashSeed(`mobile-snake:${id}:v1`);
  return Object.freeze({
    id,
    seed,
    targetScore: 20 + (seed % 11),
    difficulty: seed % 3 === 0 ? 'hard' : 'normal',
  });
}

/** 可重現的 Mulberry32 隨機數。 @param {number} seed */
export function seededRandom(seed) {
  let value = seed >>> 0;
  return () => {
    value += 0x6D2B79F5;
    let t = value;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
