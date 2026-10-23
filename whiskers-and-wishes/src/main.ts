import Phaser from 'phaser';
import { MenuScene } from './game/scenes/MenuScene';
import { WorldScene } from './game/scenes/WorldScene';
import { PlatformScene } from './game/scenes/PlatformScene';
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
  scene: [MenuScene, WorldScene, PlatformScene],
  render: { antialias: false, pixelArt: true, roundPixels: true },
};

new Phaser.Game(config);
