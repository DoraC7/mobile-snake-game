// @ts-check
import { Game } from './core/game.js?v=9';
import { Renderer } from './render/renderer.js?v=13';
import { InputManager } from './input/input-manager.js?v=9';
import { HapticManager } from './utils/haptic-manager.js?v=9';
import { StatsManager } from './utils/stats-manager.js?v=9';
import { AudioEngine } from './audio/audio-engine.js?v=9';
import { I18n } from './i18n/i18n.js?v=9';
import { GameState } from './core/config.js?v=9';
import { createDailyChallenge } from './core/daily-challenge.js?v=9';
import { AchievementManager, ACHIEVEMENTS } from './utils/achievement-manager.js?v=9';
import { ThemeManager } from './themes/theme-manager.js?v=9';
import { shareResult } from './render/share-card-renderer.js?v=9';

async function main() {
  const canvas = /** @type {HTMLCanvasElement} */ (document.getElementById('game-canvas'));
  const scoreEl = document.getElementById('score-val');
  const bestEl = document.getElementById('best-val');
  const overlay = document.getElementById('overlay');
  const overlayTitle = document.getElementById('overlay-title');
  const overlaySubtitle = document.getElementById('overlay-subtitle');
  const overlayHint = document.getElementById('overlay-hint');
  const settingsPanel = document.getElementById('settings-panel');
  const settingsBackdrop = document.getElementById('settings-backdrop');
  const hapticToggle = /** @type {HTMLInputElement} */ (document.getElementById('haptic-toggle'));
  const soundToggle = /** @type {HTMLInputElement} */ (document.getElementById('sound-toggle'));
  const langSelect = /** @type {HTMLSelectElement} */ (document.getElementById('lang-select'));
  const settingsBtn = document.getElementById('settings-btn');
  const statsList = document.getElementById('stats-list');
  const overlayHero = document.getElementById('overlay-hero');
  const overlayScoreHero = document.getElementById('overlay-score-hero');
  const overlayHsBadge = document.getElementById('overlay-hs-badge');
  const canvasFrame = document.querySelector('.canvas-frame');
  const boardWrap = document.getElementById('board-wrap');
  const pauseBtn = document.getElementById('pause-btn');
  const restartBtn = document.getElementById('restart-btn');
  const homeBtn = document.getElementById('home-btn');
  const countdownEl = document.getElementById('countdown');
  const tutorialCard = document.getElementById('tutorial-card');
  const difficultySelect = /** @type {HTMLSelectElement} */ (document.getElementById('difficulty-select'));
  const modeSelect = /** @type {HTMLSelectElement} */ (document.getElementById('mode-select'));
  const speedLevelEl = document.getElementById('speed-level');
  const comboStatusEl = document.getElementById('combo-status');
  const resultComparisonEl = document.getElementById('result-comparison');
  const progressPanel = document.getElementById('progress-panel');
  const dailySummary = document.getElementById('daily-summary');
  const achievementSummary = document.getElementById('achievement-summary');
  const trendCanvas = /** @type {HTMLCanvasElement} */ (document.getElementById('trend-canvas'));
  const shareBtn = document.getElementById('share-btn');
  const themeSelect = /** @type {HTMLSelectElement} */ (document.getElementById('theme-select'));

  const DIFFICULTY_KEY = 'mobile-snake:difficulty';
  const MODE_KEY = 'mobile-snake:mode';
  const TUTORIAL_KEY = 'mobile-snake:tutorial-v1';
  difficultySelect.value = localStorage.getItem(DIFFICULTY_KEY) || 'normal';
  modeSelect.value = localStorage.getItem(MODE_KEY) || 'classic';

  const i18n = new I18n();
  await i18n.init();

  const haptic = new HapticManager();
  const audio = new AudioEngine();
  const stats = new StatsManager();
  const achievements = new AchievementManager();
  const themes = new ThemeManager();
  const dailyChallenge = createDailyChallenge();

  hapticToggle.checked = haptic.enabled;
  soundToggle.checked = !audio.muted;

  i18n.available.forEach((l) => {
    const opt = document.createElement('option');
    opt.value = l.code;
    opt.textContent = l.label;
    if (l.code === i18n.locale) opt.selected = true;
    langSelect.appendChild(opt);
  });

  function refreshTexts() {
    document.title = i18n.t('app.title');
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      if (key) el.textContent = i18n.t(key);
    });
    speedLevelEl.textContent = i18n.t('hud.level', { level: game.speedLevel || 1 });
  }

  function refreshStats() {
    const s = stats.getSummary();
    statsList.innerHTML = '';
    const rows = [
      [i18n.t('stats.highScore'), s.highScore],
      [i18n.t('stats.highLength'), s.highLength],
      [i18n.t('stats.totalFood'), s.totalFoodEaten],
      [i18n.t('stats.totalGames'), s.totalGamesPlayed],
      [i18n.t('stats.currentStreak'), s.currentStreak],
      [i18n.t('stats.bestStreak'), s.bestStreak],
    ];
    rows.forEach(([label, value]) => {
      const li = document.createElement('li');
      const labelEl = document.createElement('span');
      labelEl.className = 'stat-label';
      labelEl.textContent = label;
      const valueEl = document.createElement('span');
      valueEl.className = 'stat-value';
      valueEl.textContent = value;
      li.appendChild(labelEl);
      li.appendChild(valueEl);
      statsList.appendChild(li);
    });
  }

  function drawTrend() {
    const games = stats.getRecentGames(7);
    const ctx = trendCanvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = trendCanvas.getBoundingClientRect();
    const width = Math.max(1, Math.round(rect.width));
    const height = Math.max(1, Math.round(rect.height));
    trendCanvas.width = Math.round(width * dpr);
    trendCanvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    if (games.length < 2) return;
    const max = Math.max(1, ...games.map((item) => item.score));
    ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
    ctx.lineWidth = 4;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    games.forEach((item, index) => {
      const x = 8 + index * ((width - 16) / (games.length - 1));
      const y = height - 8 - (item.score / max) * (height - 16);
      if (index === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.stroke();
  }

  function refreshProgress() {
    const daily = stats.getSummary().dailyResults[dailyChallenge.id];
    dailySummary.textContent = daily?.completed
      ? i18n.t('daily.completed')
      : i18n.t('daily.target', { score: dailyChallenge.targetScore });
    achievementSummary.textContent = i18n.t('achievement.summary', {
      count: achievements.getUnlockedCount(), total: ACHIEVEMENTS.length,
    });
    drawTrend();
  }

  function refreshThemes() {
    const available = themes.available(achievements);
    themeSelect.innerHTML = '';
    available.forEach((theme) => {
      const option = document.createElement('option');
      option.value = theme.id;
      option.textContent = i18n.t(`theme.${theme.id}`);
      themeSelect.appendChild(option);
    });
    if (available.some((theme) => theme.id === themes.selected)) themeSelect.value = themes.selected;
    else themeSelect.value = 'neon';
  }

  function showTitleScreen() {
    overlay.hidden = false;
    overlay.classList.remove('overlay--gameover');
    overlay.dataset.hs = 'false';
    overlayHero.hidden = true;
    overlayTitle.textContent = i18n.t('title.start');
    overlaySubtitle.hidden = false;
    overlaySubtitle.textContent = i18n.t('title.highScore', { score: stats.getSummary().highScore });
    speedLevelEl.textContent = i18n.t('hud.level', { level: 1 });
    comboStatusEl.hidden = true;
    overlayHint.hidden = false;
    overlayHint.textContent = i18n.t('title.start');
    restartBtn.hidden = true;
    homeBtn.hidden = true;
    shareBtn.hidden = true;
    countdownEl.hidden = true;
    resultComparisonEl.hidden = true;
    tutorialCard.hidden = true;
    progressPanel.hidden = false;
    refreshProgress();
    pauseBtn.hidden = true;
    // Title 畫面不顯示 stats，保持 overlay 簡潔
    statsList.innerHTML = '';
    statsList.hidden = true;
  }

  function showGameOverScreen(isNewHighScore) {
    overlay.hidden = false;
    overlay.classList.add('overlay--gameover');
    overlay.dataset.hs = isNewHighScore ? 'true' : 'false';

    // Hero score
    overlayScoreHero.textContent = game.score;
    overlayHero.hidden = false;
    overlayHsBadge.hidden = !isNewHighScore;

    overlayTitle.textContent = i18n.t('gameover.title');
    overlaySubtitle.hidden = true;   // score 已在 hero 區不需重複

    overlayHint.hidden = false;
    overlayHint.textContent = i18n.t('gameover.restart');
    restartBtn.hidden = true;
    homeBtn.hidden = false;
    homeBtn.textContent = i18n.t('pause.home');
    countdownEl.hidden = true;
    tutorialCard.hidden = true;
    pauseBtn.hidden = true;
    statsList.hidden = false;
    refreshStats();
    progressPanel.hidden = true;
    shareBtn.hidden = false;
    const last = stats.getSummary().recentGames.at(-1);
    const previous = stats.getSummary().recentGames.at(-2);
    if (last && previous) {
      const difference = last.score - previous.score;
      resultComparisonEl.textContent = difference >= 0
        ? i18n.t('result.better', { score: difference })
        : i18n.t('result.lower', { score: Math.abs(difference) });
      resultComparisonEl.hidden = false;
    } else {
      resultComparisonEl.hidden = true;
    }
  }

  function showPauseScreen() {
    overlay.hidden = false;
    overlay.classList.remove('overlay--gameover');
    overlayHero.hidden = true;
    overlayTitle.textContent = i18n.t('pause.title');
    overlaySubtitle.hidden = false;
    overlaySubtitle.textContent = i18n.t('pause.subtitle');
    statsList.hidden = true;
    tutorialCard.hidden = true;
    progressPanel.hidden = true;
    shareBtn.hidden = true;
    countdownEl.hidden = true;
    resultComparisonEl.hidden = true;
    overlayHint.hidden = false;
    overlayHint.textContent = i18n.t('pause.continue');
    restartBtn.hidden = false;
    restartBtn.textContent = i18n.t('pause.restart');
    homeBtn.hidden = false;
    homeBtn.textContent = i18n.t('pause.home');
    pauseBtn.hidden = true;
  }

  function showTutorial() {
    overlay.hidden = false;
    overlay.classList.remove('overlay--gameover');
    overlayHero.hidden = true;
    overlayTitle.textContent = i18n.t('tutorial.title');
    overlaySubtitle.hidden = true;
    statsList.hidden = true;
    countdownEl.hidden = true;
    resultComparisonEl.hidden = true;
    tutorialCard.hidden = false;
    progressPanel.hidden = true;
    shareBtn.hidden = true;
    overlayHint.hidden = false;
    overlayHint.textContent = i18n.t('tutorial.start');
    restartBtn.hidden = true;
    homeBtn.hidden = false;
    homeBtn.textContent = i18n.t('pause.home');
  }

  function showCountdown(seconds) {
    overlay.hidden = false;
    overlay.classList.remove('overlay--gameover');
    overlayHero.hidden = true;
    overlayTitle.textContent = i18n.t('countdown.ready');
    overlaySubtitle.hidden = true;
    statsList.hidden = true;
    tutorialCard.hidden = true;
    progressPanel.hidden = true;
    shareBtn.hidden = true;
    overlayHint.hidden = true;
    restartBtn.hidden = true;
    homeBtn.hidden = true;
    countdownEl.hidden = false;
    resultComparisonEl.hidden = true;
    countdownEl.textContent = seconds > 0 ? String(seconds) : i18n.t('countdown.go');
    pauseBtn.hidden = false;
  }

  let lastGameOverWasHighScore = false;

  const game = new Game({
    onEat: (event) => {
      haptic.trigger('eat_food');
      audio.playEat();
      renderer.triggerFoodPulse();
      if (event.type === 'golden') {
        canvasFrame.classList.remove('golden-flash');
        void canvasFrame.offsetWidth;
        canvasFrame.classList.add('golden-flash');
        canvasFrame.addEventListener('animationend', () => canvasFrame.classList.remove('golden-flash'), { once: true });
      }
    },
    onDeath: () => {
      haptic.trigger('death');
      audio.playDeath();
      // Canvas 死亡震動
      canvasFrame.classList.add('death-shake');
      canvasFrame.addEventListener('animationend', () => {
        canvasFrame.classList.remove('death-shake');
      }, { once: true });
    },
    onScoreChange: (score) => {
      scoreEl.textContent = score;
      // 分數跳車動畫（reflow trick 確保重複觸發）
      scoreEl.classList.remove('bump');
      void scoreEl.offsetWidth;
      scoreEl.classList.add('bump');
    },
    onStateChange: (from, to) => {
      if (to === GameState.PLAYING) {
        overlay.hidden = true;
        pauseBtn.hidden = false;
      } else if (to === GameState.PAUSED) {
        showPauseScreen();
      } else if (to === GameState.TITLE) {
        showTitleScreen();
      } else if (to === GameState.GAME_OVER) {
        const result = game.getResult();
        const { isNewHighScore } = stats.recordGameEnd(result);
        achievements.evaluate(result, stats.getSummary());
        refreshThemes();
        if (isNewHighScore) haptic.trigger('new_high_score', Date.now());
        if (bestEl) bestEl.textContent = stats.getSummary().highScore;
        lastGameOverWasHighScore = isNewHighScore;
        showGameOverScreen(isNewHighScore);
      }
    },
    onCountdown: (seconds) => showCountdown(seconds),
    onSpeedLevelChange: (level) => {
      speedLevelEl.textContent = i18n.t('hud.level', { level });
      speedLevelEl.classList.remove('bump');
      void speedLevelEl.offsetWidth;
      speedLevelEl.classList.add('bump');
    },
    onComboChange: (combo, multiplier) => {
      comboStatusEl.hidden = combo < 2;
      comboStatusEl.textContent = combo < 2 ? '' : `×${multiplier} · ${combo}`;
    },
  });

  function applyRules() {
    if (modeSelect.value === 'daily') {
      game.configure({ difficulty: dailyChallenge.difficulty, mode: 'daily', dailyChallenge });
    } else {
      game.configure({ difficulty: difficultySelect.value, mode: modeSelect.value });
    }
  }

  function resizeBoard() {
    const size = Math.floor(Math.min(boardWrap.clientWidth, boardWrap.clientHeight));
    if (size > 0) {
      canvasFrame.style.width = `${size}px`;
      canvasFrame.style.height = `${size}px`;
    }
  }

  resizeBoard();
  const renderer = new Renderer(canvas, game.grid);
  game.setRenderCallback((alpha) => {
    renderer.render(game.snake, game.food, alpha, 1 / 60, game.obstacles);
  });

  function tryStart() {
    audio.init();
    if (game.stateMachine.is(GameState.TITLE)) {
      if (localStorage.getItem(TUTORIAL_KEY) !== 'seen') {
        game.stateMachine.transition(GameState.TUTORIAL);
        showTutorial();
        return;
      }
      applyRules();
      game.startNewGame();
    } else if (game.stateMachine.is(GameState.GAME_OVER)) {
      applyRules();
      game.startNewGame();
    } else if (game.stateMachine.is(GameState.TUTORIAL)) {
      localStorage.setItem(TUTORIAL_KEY, 'seen');
      applyRules();
      game.startNewGame();
    } else if (game.stateMachine.is(GameState.PAUSED)) {
      game.resume();
    }
  }

  const input = new InputManager({
    onDirection: (dir) => game.queueDirection(dir),
    onPrimaryAction: () => tryStart(),
    onPauseAction: () => {
      if (game.stateMachine.is(GameState.PLAYING) || game.stateMachine.is(GameState.COUNTDOWN)) game.pause();
      else if (game.stateMachine.is(GameState.PAUSED)) game.resume();
    },
  });
  input.bindSwipe(canvas);
  input.bindDpad(document.querySelectorAll('.dpad-btn'));

  overlayHint.addEventListener('click', (event) => {
    event.stopPropagation();
    tryStart();
  });
  restartBtn.addEventListener('click', (event) => {
    event.stopPropagation();
    applyRules();
    game.restart();
  });
  homeBtn.addEventListener('click', (event) => {
    event.stopPropagation();
    game.returnToTitle();
  });
  shareBtn.addEventListener('click', async (event) => {
    event.stopPropagation();
    const result = stats.getRecentGames(1)[0];
    if (!result) return;
    try {
      await shareResult(result, i18n.t('share.title'), i18n.t(`mode.${result.mode}`),
        i18n.t('share.text', { score: result.score }));
    } catch (error) {
      if (error?.name !== 'AbortError') console.warn('Share failed', error);
    }
  });
  pauseBtn.addEventListener('click', () => game.pause());

  function openSettings() {
    if (game.stateMachine.is(GameState.PLAYING) || game.stateMachine.is(GameState.COUNTDOWN)) game.pause();
    settingsPanel.hidden = false;
    settingsBackdrop.hidden = false;
  }
  function closeSettings() {
    settingsPanel.hidden = true;
    settingsBackdrop.hidden = true;
  }

  settingsBtn.addEventListener('click', () => {
    settingsPanel.hidden ? openSettings() : closeSettings();
  });
  settingsBackdrop.addEventListener('click', closeSettings);
  hapticToggle.addEventListener('change', () => haptic.setEnabled(hapticToggle.checked));
  soundToggle.addEventListener('change', () => audio.setMuted(!soundToggle.checked));
  langSelect.addEventListener('change', async () => {
    await i18n.setLocale(langSelect.value);
    refreshTexts();
    if (overlay.hidden === false) {
      if (game.stateMachine.is(GameState.TITLE)) showTitleScreen();
      else if (game.stateMachine.is(GameState.TUTORIAL)) showTutorial();
      else if (game.stateMachine.is(GameState.PAUSED)) showPauseScreen();
      else if (game.stateMachine.is(GameState.GAME_OVER)) {
        showGameOverScreen(lastGameOverWasHighScore);
      }
    }
  });
  difficultySelect.addEventListener('change', () => localStorage.setItem(DIFFICULTY_KEY, difficultySelect.value));
  modeSelect.addEventListener('change', () => localStorage.setItem(MODE_KEY, modeSelect.value));
  themeSelect.addEventListener('change', () => themes.apply(themeSelect.value, renderer));

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) game.pause();
  });

  window.addEventListener('resize', () => {
    resizeBoard();
    renderer.resize();
  });

  if (bestEl) bestEl.textContent = stats.getSummary().highScore;
  speedLevelEl.textContent = i18n.t('hud.level', { level: 1 });
  refreshThemes();
  themes.apply(themeSelect.value, renderer);
  refreshTexts();
  showTitleScreen();
  game.start();

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch(() => {});
    });
  }
}

main();
