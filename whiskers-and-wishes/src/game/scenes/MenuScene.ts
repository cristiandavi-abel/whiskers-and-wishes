import Phaser from 'phaser';
import { SaveManager } from '../systems/SaveManager';

export class MenuScene extends Phaser.Scene {
  constructor() { super('MenuScene'); }

  create(): void {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor('#203c35');

    const bg = this.add.graphics();
    bg.fillStyle(0x2e5145); bg.fillRect(0, 0, width, height);
    bg.fillStyle(0x3f6b52); bg.fillCircle(100, 70, 115); bg.fillCircle(850, 75, 150);
    bg.fillStyle(0x1c3933); bg.fillRect(0, 365, width, 175);
    bg.fillStyle(0x41684a); bg.fillRect(0, 390, width, 150);
    for (let i = 0; i < 55; i++) {
      const x = Phaser.Math.Between(20, width - 20), y = Phaser.Math.Between(25, 500);
      this.add.rectangle(x, y, 3, 3, i % 2 ? 0xf6d68b : 0xb3d69a, 0.8);
    }

    this.add.text(width / 2, 105, 'WHISKERS', {
      fontFamily: 'Nunito, sans-serif', fontSize: '54px', fontStyle: '900',
      color: '#fff0d1', stroke: '#283d35', strokeThickness: 8,
    }).setOrigin(0.5);
    this.add.text(width / 2, 157, '& WISHES', {
      fontFamily: 'Nunito, sans-serif', fontSize: '29px', fontStyle: '800',
      color: '#f6c6cf', stroke: '#283d35', strokeThickness: 5,
    }).setOrigin(0.5);
    this.add.text(width / 2, 205, 'uma pequena aventura cheia de magia e gatinhos', {
      fontFamily: 'Nunito, sans-serif', fontSize: '17px', color: '#fff0d1',
    }).setOrigin(0.5);

    const button = this.add.container(width / 2, 290);
    const plate = this.add.rectangle(0, 0, 245, 54, 0xf6c6cf).setStrokeStyle(3, 0x7c5361);
    const label = this.add.text(0, 0, 'COMEÇAR A AVENTURA', {
      fontFamily: 'Nunito, sans-serif', fontSize: '17px', fontStyle: '900', color: '#3c303a',
    }).setOrigin(0.5);
    button.add([plate, label]);
    plate.setInteractive({ useHandCursor: true }).on('pointerover', () => button.setScale(1.04))
      .on('pointerout', () => button.setScale(1))
      .on('pointerdown', () => this.scene.start('WorldScene'));

    const continueText = this.add.text(width / 2, 345, 'Seu progresso é salvo neste navegador.', {
      fontFamily: 'Nunito, sans-serif', fontSize: '13px', color: '#d2dfc5',
    }).setOrigin(0.5);

    this.add.text(width / 2, 470, 'WASD / setas para andar  •  E para interagir  •  P para pular', {
      fontFamily: 'Nunito, sans-serif', fontSize: '14px', color: '#e4e8ce',
    }).setOrigin(0.5);
    this.add.text(width / 2, 495, `Estrelinhas encontradas: ${SaveManager.load().stars}`, {
      fontFamily: 'Nunito, sans-serif', fontSize: '13px', color: '#ffdf7e',
    }).setOrigin(0.5);
  }
}
