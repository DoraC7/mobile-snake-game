// @ts-check
import { CONFIG } from '../core/config.js?v=9';

const STORAGE_KEY = CONFIG.STORAGE_PREFIX + 'locale';
const RTL_LOCALES = new Set(['ar-SA', 'fa-IR', 'ur-PK']);

/**
 * 語系載入與切換邏輯
 */
export class I18n {
  constructor() {
    /** @type {Record<string,string>} */
    this.strings = {};
    this.locale = 'en-US';
    /** @type {{code:string,label:string,rtl:boolean}[]} */
    this.available = [];
  }

  async init() {
    const idx = await fetch('./i18n/index.json', { cache: 'no-cache' }).then((r) => r.json());
    this.available = idx.locales;
    // 預設一律使用英文（idx.default），不自動偵測瀏覽器語系，
    // 只有使用者在設定面板主動切換過的語系才會被記住並優先套用。
    const saved = localStorage.getItem(STORAGE_KEY);
    const initial = saved || idx.default;
    await this.setLocale(initial);
  }

  /** @param {string} code */
  async setLocale(code) {
    const meta = this.available.find((l) => l.code === code);
    const finalCode = meta ? code : 'en-US';
    const [fallback, selected] = await Promise.all([
      fetch('./i18n/en-US.json', { cache: 'no-cache' }).then((r) => r.json()),
      fetch(`./i18n/${finalCode}.json`, { cache: 'no-cache' }).then((r) => r.json()),
    ]);
    this.strings = { ...fallback, ...selected };
    this.locale = finalCode;
    try {
      localStorage.setItem(STORAGE_KEY, finalCode);
    } catch {
      // 忽略
    }
    document.documentElement.lang = finalCode;
    document.documentElement.dir = RTL_LOCALES.has(finalCode) ? 'rtl' : 'ltr';
  }

  /**
   * @param {string} key
   * @param {Record<string, string|number>} [params]
   */
  t(key, params = {}) {
    let str = this.strings[key] || key;
    for (const [k, v] of Object.entries(params)) {
      str = str.replace(`{${k}}`, String(v));
    }
    return str;
  }
}
