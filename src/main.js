// @ts-check
import { Game } from './core/game.js';
import { Renderer } from './render/renderer.js';
import { InputManager } from './input/input-manager.js';
import { HapticManager } from './utils/haptic-manager.js';
import { StatsManager } from './utils/stats-manager.js';
import { AudioEngine } from './audio/audio-engine.js';
import { I18n } from './i18n/i18n.js';
import { GameState } from './core/config.js';

async function main() {
  const canvas = /** @type {HTMLCanvasElement} */ (document.getElementById('game-canvas'));
  const scoreEl = document.getElementById('score-display');
  const overlay = document.getElementById('overlay');
  const overlayTitle = document.getElementById('overlay-title');
  const overlaySubtitle = document.getElementById('overlay-subtitle');
  const overlayHint = document.getElementById('overlay-hint');
  const settingsPanel = document.getElementById('settings-panel');
  const hapticToggle = /** @type {HTMLInputElement} */ (document.getElementById('haptic-toggle'));
  const soundToggle = /** @type {HTMLInputElement} */ (document.getElementById('sound-toggle'));
  const langSelect = /** @type {HTMLSelectElement} */ (document.getElementById('lang-select'));
  const settingsBtn = document.getElementById('settings-btn');
  const statsList = document.getElementById('stats-list');

  const i18n = new I18n();
  await i18n.init();

  const haptic = new HapticManager();
  const audio = new AudioEngine();
  const stats = new StatsManager();

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
      li.textContent = `${label}: ${value}`;
      statsList.appendChild(li);
    });
  }

  function showTitleScreen() {
    overlay.hidden = false;
    overlayTitle.textContent = i18n.t('title.start');
    overlaySubtitle.textContent = i18n.t('title.highScore', { score: stats.getSummary().highScore });
    overlayHint.hidden = true;
    refreshStats();
  }

  function showGameOverScreen(isNewHighScore) {
    overlay.hidden = false;
    overlayTitle.textContent = i18n.t('gameover.title');
    overlaySubtitle.textContent = isNewHighScore
      ? `${i18n.t('gameover.score', { score: game.score })} · ${i18n.t('gameover.newHighScore')}`
      : i18n.t('gameover.score', { score: game.score });
    overlayHint.hidden = false;
    overlayHint.textContent = i18n.t('gameover.restart');
    refreshStats();
  }

  let pendingHighScoreCheck = false;

  const game = new Game({
    onEat: () => {
      haptic.trigger('eat_food');
      audio.playEat();
      renderer.triggerFoodPulse();
    },
    onDeath: () => {
      haptic.trigger('death');
      audio.playDeath();
    },
    onScoreChange: (score) => {
      scoreEl.textContent = i18n.t('hud.score') + ': ' + score;
    },
    onStateChange: (from, to) => {
      if (to === GameState.PLAYING) {
        overlay.hidden = true;
      } else if (to === GameState.GAME_OVER) {
        const { isNewHighScore } = stats.recordGameEnd({
          score: game.score,
          length: game.snake.length,
          foodEaten: game.foodEatenThisGame,
        });
        if (isNewHighScore) haptic.trigger('new_high_score', Date.now());
        showGameOverScreen(isNewHighScore);
      }
    },
  });

  const renderer = new Renderer(canvas, game.grid);
  game.setRenderCallback((alpha) => {
    renderer.render(game.snake, game.food, alpha, 1 / 60);
  });

  function tryStart() {
    audio.init();
    if (game.stateMachine.is(GameState.TITLE) || game.stateMachine.is(GameState.GAME_OVER)) {
      if (game.stateMachine.is(GameState.GAME_OVER)) {
        game.stateMachine.transition(GameState.TITLE);
      }
      game.startNewGame();
    }
  }

  const input = new InputManager({
    onDirection: (dir) => game.queueDirection(dir),
    onPrimaryAction: () => tryStart(),
  });
  input.bindSwipe(canvas);
  input.bindDpad(document.querySelectorAll('.dpad-btn'));

  overlay.addEventListener('click', tryStart);

  settingsBtn.addEventListener('click', () => {
    settingsPanel.hidden = !settingsPanel.hidden;
  });
  hapticToggle.addEventListener('change', () => haptic.setEnabled(hapticToggle.checked));
  soundToggle.addEventListener('change', () => audio.setMuted(!soundToggle.checked));
  langSelect.addEventListener('change', async () => {
    await i18n.setLocale(langSelect.value);
    refreshTexts();
    if (overlay.hidden === false) {
      if (game.stateMachine.is(GameState.TITLE)) showTitleScreen();
      else if (game.stateMachine.is(GameState.GAME_OVER)) {
        showGameOverScreen(false);
      }
    }
  });

  window.addEventListener('resize', () => renderer.resize());

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
