import Phaser from 'phaser';
import { BootScene } from './game/scenes/BootScene';
import { MenuScene } from './game/scenes/MenuScene';
import { AdventureScene } from './game/scenes/AdventureScene';
import { StarTrailScene } from './game/scenes/StarTrailScene';
import { FinaleScene } from './game/scenes/FinaleScene';
import { AudioManager } from './game/systems/AudioManager';
import './styles/main.css';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#203c35',
  pixelArt: true,
  roundPixels: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 960,
    height: 540,
    parent: 'game',
  },
  physics: {
    default: 'arcade',
    arcade: { debug: false },
  },
  input: {
    activePointers: 3,
  },
  scene: [BootScene, MenuScene, AdventureScene, StarTrailScene, FinaleScene],
  render: { antialias: false, pixelArt: true, roundPixels: true },
};

const game = new Phaser.Game(config);

/** Remove a tela de carregamento assim que o jogo inicia. */
const hideSplash = (): void => {
  const splash = document.getElementById('boot-splash');
  if (!splash) return;
  splash.classList.add('is-hidden');
  window.setTimeout(() => splash.remove(), 450);
};
game.events.once('ready', hideSplash);
window.setTimeout(hideSplash, 8000);

/**
 * Navegadores só liberam áudio após um gesto do usuário.
 * O AudioManager é inicializado no primeiro clique/toque/tecla.
 */
const unlockAudio = (): void => {
  AudioManager.init();
  window.removeEventListener('pointerdown', unlockAudio);
  window.removeEventListener('keydown', unlockAudio);
  window.removeEventListener('touchstart', unlockAudio);
};
window.addEventListener('pointerdown', unlockAudio, { once: true });
window.addEventListener('keydown', unlockAudio, { once: true });
window.addEventListener('touchstart', unlockAudio, { once: true });

/** Pausa o áudio quando a aba perde o foco (economiza bateria). */
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    AudioManager.suspend();
  } else {
    AudioManager.resume();
  }
});

/** Registra o service worker apenas em produção (build do GitHub Pages). */
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {
      /* PWA é um extra: o jogo funciona sem o service worker. */
    });
  });
}
