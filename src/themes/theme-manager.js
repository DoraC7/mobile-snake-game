// @ts-check
import { CONFIG } from '../core/config.js?v=9';

const STORAGE_KEY = CONFIG.STORAGE_PREFIX + 'theme';

export const THEMES = Object.freeze({
  neon: Object.freeze({ id: 'neon', accent: '#00e5ff', accentRgb: '0, 229, 255', snake: '#00e5ff', head: '#80f0ff', outline: '#007a99' }),
  jade: Object.freeze({ id: 'jade', accent: '#9cbba0', accentRgb: '156, 187, 160', snake: '#9cbba0', head: '#c6ddc9', outline: '#4d7055' }),
  sunset: Object.freeze({ id: 'sunset', accent: '#ff8a65', accentRgb: '255, 138, 101', snake: '#ff8a65', head: '#ffc1ad', outline: '#a33f2d' }),
});

export class ThemeManager {
  constructor() {
    this.selected = localStorage.getItem(STORAGE_KEY) || 'neon';
  }

  available(achievements) {
    return [THEMES.neon, ...(achievements.isUnlocked('score-10') ? [THEMES.jade] : []), ...(achievements.isUnlocked('daily') ? [THEMES.sunset] : [])];
  }

  apply(id, renderer) {
    const theme = THEMES[id] || THEMES.neon;
    this.selected = theme.id;
    const root = document.documentElement;
    root.style.setProperty('--accent', theme.accent);
    root.style.setProperty('--accent-dim', `rgba(${theme.accentRgb}, 0.1)`);
    root.style.setProperty('--accent-glow', `rgba(${theme.accentRgb}, 0.28)`);
    root.style.setProperty('--border', `rgba(${theme.accentRgb}, 0.14)`);
    root.style.setProperty('--border-hi', `rgba(${theme.accentRgb}, 0.5)`);
    renderer.setPalette(theme);
    try { localStorage.setItem(STORAGE_KEY, theme.id); } catch { /* ignore */ }
  }
}
