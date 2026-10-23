import Phaser from 'phaser';
import { buildAllTextures, buildAnimations } from '../entities/SpriteFactory';

/**
 * Gera todas as texturas e animações em tempo de execução e
 * segue para o menu. Nenhum asset de imagem externo é necessário.
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  create(): void {
    buildAllTextures(this);
    buildAnimations(this);
    this.scene.start('MenuScene');
  }
}
