import Phaser from 'phaser';
import { PERSONALIZATION } from '../../config/personalization';
import { AREA_NAME_BY_SAVE, CAT_TOTAL } from '../../data/worldData';
import { AudioManager } from '../systems/AudioManager';
import { emptySave, SaveManager } from '../systems/SaveManager';
import { addPanel, CSS, textStyle, UI } from '../ui/Theme';

export class MenuScene extends Phaser.Scene {
  private starting = false;
  private confirmLayer?: Phaser.GameObjects.Container;
  private muteText?: Phaser.GameObjects.Text;

  constructor() {
    super('MenuScene');
  }

  create(): void {
    this.starting = false;
    const { width, height } = this.scale;
    const save = SaveManager.load();
    const hasProgress = SaveManager.hasProgress();
    this.cameras.main.fadeIn(500, 23, 44, 40);
    AudioManager.playMusic('menu');

    this.buildBackground(width, height);
    this.buildTitle(width);
    this.buildButtons(width, save.area, hasProgress);
    this.buildFooter(width);

    this.input.keyboard?.on('keydown-ENTER', () => this.launch(hasProgress));
    this.input.keyboard?.on('keydown-M', () => {
      AudioManager.init();
      this.muteText?.setText(AudioManager.toggleMute() ? '✕' : '♪');
    });
    this.input.once('pointerdown', () => AudioManager.init());
  }

  private buildBackground(width: number, height: number): void {
    const bg = this.add.graphics();
    const bands = [0x1b3438, 0x214146, 0x2a4f4f, 0x365d52, 0x446b56, 0x547a5b];
    bands.forEach((color, index) => {
      bg.fillStyle(color);
      bg.fillRect(0, index * 90, width, 95);
    });
    // Estrelas e vaga-lumes
    for (let i = 0; i < 70; i++) {
      const x = Phaser.Math.Between(8, width - 8);
      const y = Phaser.Math.Between(8, 330);
      const star = this.add.rectangle(x, y, i % 7 === 0 ? 3 : 2, i % 7 === 0 ? 3 : 2, i % 3 === 0 ? 0xffdf7e : 0xd9f0d1, 0.7);
      this.tweens.add({
        targets: star,
        alpha: { from: 0.2, to: 0.9 },
        duration: 900 + (i % 9) * 220,
        yoyo: true,
        repeat: -1,
        delay: i * 60,
      });
    }

    // Lua
    this.add.circle(812, 92, 42, 0xfff0d1, 0.92);
    this.add.circle(794, 80, 38, 0x214146, 1);

    // Colinas
    const hills = this.add.graphics();
    hills.fillStyle(0x2d5246); hills.fillEllipse(180, 400, 620, 260);
    hills.fillStyle(0x355e4b); hills.fillEllipse(760, 420, 780, 280);
    hills.fillStyle(0x3f6b50); hills.fillEllipse(480, 480, 1100, 250);
    hills.fillStyle(0x203c35); hills.fillRect(0, 465, width, 75);

    // Árvores nas laterais
    this.add.image(70, 410, 'tree-pine').setOrigin(0.5, 1).setScale(1.5).setTint(0xb6d1b0);
    this.add.image(155, 438, 'tree-round').setOrigin(0.5, 1).setScale(1.15).setTint(0xc3d8bb);
    this.add.image(890, 420, 'tree-pine').setOrigin(0.5, 1).setScale(1.7).setTint(0xaecbb0);
    this.add.image(800, 445, 'tree-round').setOrigin(0.5, 1).setScale(1.05).setTint(0xb9d1b5);

    // Casinha
    this.add.image(742, 452, 'house-cottage').setOrigin(0.5, 1).setScale(1.05).setTint(0xd9c7b6);
    this.add.image(770, 424, 'glow-gold').setScale(0.7).setAlpha(0.35);
    this.add.image(742, 462, 'bush').setOrigin(0.5, 1).setScale(0.9);

    // Chão com flores
    for (let i = 0; i < 16; i++) {
      const flower = this.add.image(Phaser.Math.Between(180, 780), Phaser.Math.Between(470, 510), i % 3 === 0 ? 'flower-yellow' : i % 3 === 1 ? 'flower-pink' : 'flower-blue')
        .setScale(0.9).setAlpha(0.9);
      this.tweens.add({ targets: flower, angle: { from: -4, to: 4 }, duration: 1400 + i * 80, yoyo: true, repeat: -1 });
    }

    // Cristian, sua amada e um gatinho no jardim do menu.
    const cristian = this.add.sprite(388, 500, 'cristian-idle-0').setOrigin(0.5, 1).setScale(1.05);
    cristian.play('cristian-idle');
    cristian.setFlipX(true);
    const amada = this.add.sprite(588, 500, 'amada-idle-0').setOrigin(0.5, 1).setScale(1.05);
    amada.play('amada-idle');
    const cat = this.add.sprite(482, 504, 'cat-cream-0').setOrigin(0.5, 1).setScale(1.1);
    cat.play('cat-cream-idle');
    this.add.image(490, 476, 'glow-pink').setScale(0.6).setAlpha(0.25);

    // Corações subindo
    this.time.addEvent({
      delay: 900,
      loop: true,
      callback: () => {
        const heart = this.add.image(Phaser.Math.Between(420, 560), 470, 'heart').setAlpha(0.9).setScale(0.8);
        this.tweens.add({
          targets: heart,
          y: heart.y - Phaser.Math.Between(60, 120),
          x: heart.x + Phaser.Math.Between(-20, 20),
          alpha: 0,
          angle: Phaser.Math.Between(-20, 20),
          duration: 2200,
          ease: 'Sine.easeOut',
          onComplete: () => heart.destroy(),
        });
      },
    });
  }

  private buildTitle(width: number): void {
    const title = this.add.text(width / 2, 92, 'WHISKERS', {
      fontFamily: '"Nunito", sans-serif',
      fontSize: '60px',
      fontStyle: '900',
      color: '#fff4e2',
      stroke: '#1b2e2a',
      strokeThickness: 9,
    }).setOrigin(0.5);
    title.setShadow(0, 5, '#1b2e2a', 0, true, true);

    const sub = this.add.text(width / 2, 143, '&  WISHES', {
      fontFamily: '"Nunito", sans-serif',
      fontSize: '30px',
      fontStyle: '900',
      color: '#f6c6cf',
      stroke: '#1b2e2a',
      strokeThickness: 6,
      letterSpacing: 3,
    }).setOrigin(0.5);

    this.add.text(width / 2, 180, PERSONALIZATION.tagline, {
      fontFamily: '"Nunito", sans-serif',
      fontSize: '15px',
      color: '#e6e8cf',
    }).setOrigin(0.5).setAlpha(0.92);

    this.tweens.add({
      targets: [title, sub],
      y: '-=4',
      duration: 2400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  private buildButtons(width: number, area: string, hasProgress: boolean): void {
    const save = SaveManager.load();
    const primaryY = hasProgress ? 250 : 268;

    if (hasProgress) {
      const areaName = AREA_NAME_BY_SAVE[area] ?? 'Jardim dos Gatinhos';
      this.makeButton(width / 2, primaryY, 'CONTINUAR', () => this.launch(true), {
        width: 280,
        primary: true,
        small: `★ ${save.stars}   ♥ ${save.catsFound.length}/${CAT_TOTAL}   •   ${areaName}`,
      });
      this.makeButton(width / 2, primaryY + 68, 'NOVA AVENTURA', () => this.askReset(), { width: 240 });
      this.add.text(width / 2, primaryY + 108, 'seu progresso é salvo automaticamente neste navegador', {
        fontFamily: '"Nunito", sans-serif', fontSize: '11px', color: '#c8d5c0',
      }).setOrigin(0.5).setAlpha(0.85);
    } else {
      this.makeButton(width / 2, primaryY, 'COMEÇAR A AVENTURA', () => this.launch(false), { width: 300, primary: true });
      this.add.text(width / 2, primaryY + 52, 'WASD / setas  •  E para interagir  •  ESC para pausar', {
        fontFamily: '"Nunito", sans-serif', fontSize: '12px', color: '#e6e8cf',
      }).setOrigin(0.5).setAlpha(0.9);
    }

    // Botão de som
    const muteCircle = this.add.circle(924, 32, 20, 0xfff4e2, 0.92)
      .setStrokeStyle(2, UI.pinkDark)
      .setInteractive({ useHandCursor: true });
    this.muteText = this.add.text(924, 32, AudioManager.isMuted ? '✕' : '♪', textStyle(17, CSS.ink, { fontStyle: '900' })).setOrigin(0.5);
    muteCircle.on('pointerdown', () => {
      AudioManager.init();
      this.muteText?.setText(AudioManager.toggleMute() ? '✕' : '♪');
    });

    // Botão de apagar progresso é discreto, no rodapé.
    if (hasProgress) {
      const reset = this.add.text(924, 512, 'apagar progresso', {
        fontFamily: '"Nunito", sans-serif', fontSize: '10px', color: '#b9c9b2',
      }).setOrigin(1, 0.5).setInteractive({ useHandCursor: true });
      reset.on('pointerdown', () => this.askReset());
    }
  }

  private makeButton(
    x: number,
    y: number,
    label: string,
    onClick: () => void,
    options: { width?: number; primary?: boolean; small?: string } = {},
  ): void {
    const buttonWidth = options.width ?? 260;
    const height = options.small ? 62 : 50;
    const container = this.add.container(x, y);
    const panel = addPanel(this, -buttonWidth / 2, -height / 2, buttonWidth, height, {
      fill: options.primary ? UI.pink : UI.cream,
      radius: 15,
    });
    const text = this.add.text(0, options.small ? -9 : 0, label, {
      fontFamily: '"Nunito", sans-serif',
      fontSize: options.primary ? '18px' : '16px',
      fontStyle: '900',
      color: options.primary ? '#3b3038' : '#5b4a54',
      letterSpacing: 1,
    }).setOrigin(0.5);
    container.add([panel, text]);
    if (options.small) {
      const small = this.add.text(0, 13, options.small, {
        fontFamily: '"Nunito", sans-serif',
        fontSize: '11px',
        fontStyle: '700',
        color: '#6a5560',
      }).setOrigin(0.5);
      container.add(small);
    }
    const hit = this.add.zone(0, 0, buttonWidth + 10, height + 10).setInteractive({ useHandCursor: true });
    container.add(hit);
    hit.on('pointerover', () => container.setScale(1.035));
    hit.on('pointerout', () => container.setScale(1));
    hit.on('pointerdown', () => {
      if (this.starting) return;
      AudioManager.init();
      AudioManager.sfx('ui');
      onClick();
    });
  }

  private buildFooter(width: number): void {
    this.add.text(width / 2, 504, PERSONALIZATION.menuNote, {
      fontFamily: '"Nunito", sans-serif', fontSize: '12px', color: '#e6e8cf',
    }).setOrigin(0.5).setAlpha(0.9);
    this.add.text(width / 2, 524, 'um presente interativo  •  feito com Phaser 3 + TypeScript', {
      fontFamily: '"Nunito", sans-serif', fontSize: '10px', color: '#a9bfa5',
    }).setOrigin(0.5).setAlpha(0.85);
  }

  private askReset(): void {
    if (this.confirmLayer) return;
    AudioManager.sfx('ui');
    this.confirmLayer = this.add.container(0, 0).setDepth(500);
    const dim = this.add.rectangle(480, 270, 960, 540, 0x101b18, 0.62).setInteractive();
    const panel = addPanel(this, 270, 175, 420, 190, { radius: 18 });
    const title = this.add.text(480, 215, 'Começar de novo?', textStyle(24, CSS.ink, { fontStyle: '900' })).setOrigin(0.5);
    const body = this.add.text(480, 257, 'Isso vai apagar estrelinhas, missões e gatinhos encontrados.', {
      fontFamily: '"Nunito", sans-serif', fontSize: '14px', color: '#6a5560',
      align: 'center', wordWrap: { width: 340 },
    }).setOrigin(0.5);
    const yes = this.add.text(480, 318, 'SIM, COMEÇAR DE NOVO', {
      fontFamily: '"Nunito", sans-serif', fontSize: '14px', fontStyle: '900',
      color: '#3b3038', backgroundColor: '#f3b8c6', padding: { x: 18, y: 10 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    const no = this.add.text(480, 350, 'voltar', {
      fontFamily: '"Nunito", sans-serif', fontSize: '12px', color: '#6a5560',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    yes.on('pointerdown', () => {
      SaveManager.reset();
      this.launch(false);
    });
    no.on('pointerdown', () => {
      this.confirmLayer?.destroy(true);
      this.confirmLayer = undefined;
    });
    dim.on('pointerdown', () => {
      this.confirmLayer?.destroy(true);
      this.confirmLayer = undefined;
    });
    this.confirmLayer.add([dim, panel, title, body, yes, no]);
  }

  private launch(continueGame: boolean): void {
    if (this.starting) return;
    this.starting = true;
    AudioManager.init();
    AudioManager.sfx('ui');

    let save = SaveManager.load();
    if (!continueGame) {
      SaveManager.reset();
      save = emptySave();
      SaveManager.save(save);
    }

    this.cameras.main.fadeOut(320, 23, 44, 40);
    this.time.delayedCall(340, () => {
      if (continueGame && save.area === 'trail') {
        this.scene.start('StarTrailScene', { spawn: 'fromVillage' });
      } else {
        const area = ['garden', 'forest', 'village'].includes(save.area) ? save.area : 'garden';
        this.scene.start('AdventureScene', { area, spawn: 'default' });
      }
    });
  }
}
