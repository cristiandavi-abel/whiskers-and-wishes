import Phaser from 'phaser';
import { PERSONALIZATION, personalText } from '../../config/personalization';
import { addOnce, SaveManager, type SaveData } from '../systems/SaveManager';
import { AudioManager } from '../systems/AudioManager';
import { DialogueBox, type DialoguePage } from '../ui/DialogueBox';
import { addPanel, CSS, textStyle, UI } from '../ui/Theme';

/**
 * Cena final: Cristian encontra sua namorada no Lugar Especial.
 * O diálogo vem de config/personalization.ts (finalDialogue) e a
 * carta vem de finalLetter. Tudo é editável sem mexer nesta cena.
 */
export class FinaleScene extends Phaser.Scene {
  private save!: SaveData;
  private dialogue!: DialogueBox;
  private letterLayer?: Phaser.GameObjects.Container;
  private amada?: Phaser.GameObjects.Sprite;
  private cristian?: Phaser.GameObjects.Sprite;
  private heartsTimer?: Phaser.Time.TimerEvent;
  private sequenceDone = false;
  private letterShown = false;

  constructor() {
    super('FinaleScene');
  }

  create(): void {
    this.save = SaveManager.load();
    this.save.endingSeen = true;
    this.save.area = 'village';
    addOnce(this.save.flags, 'ending_seen');
    SaveManager.save(this.save);

    this.sequenceDone = false;
    this.letterShown = false;
    this.letterLayer = undefined;

    this.cameras.main.setBackgroundColor('#1a2438');
    this.cameras.main.fadeIn(900, 12, 16, 30);
    AudioManager.playMusic('finale');

    this.buildSky();
    this.buildGround();
    this.buildCharacters();
    this.dialogue = new DialogueBox(this);

    this.input.keyboard?.on('keydown-E', () => this.advance());
    this.input.keyboard?.on('keydown-ENTER', () => this.advance());
    this.input.keyboard?.on('keydown-SPACE', () => this.advance());

    this.time.delayedCall(1500, () => this.startDialogue());
  }

  /* ─────────────────────────  CENÁRIO  ───────────────────────── */

  private buildSky(): void {
    const { width, height } = this.scale;

    const sky = this.add.graphics().setDepth(-30);
    const bands = [0x141c30, 0x1b2640, 0x25334f, 0x33455e, 0x465a6c, 0x5d7078];
    bands.forEach((color, index) => {
      sky.fillStyle(color);
      sky.fillRect(0, index * 96, width, 100);
    });

    // Lua e halo.
    this.add.circle(806, 84, 62, 0xfff3c4, 0.1).setDepth(-29);
    this.add.circle(806, 84, 46, 0xfff3c4, 0.95).setDepth(-29);
    this.add.circle(790, 70, 40, 0x1b2640, 1).setDepth(-28);

    // Estrelas cintilantes.
    for (let i = 0; i < 120; i++) {
      const x = Phaser.Math.Between(4, width - 4);
      const y = Phaser.Math.Between(4, 330);
      const star = this.add.rectangle(
        x,
        y,
        i % 13 === 0 ? 3 : 2,
        i % 13 === 0 ? 3 : 2,
        i % 4 === 0 ? 0xffdf7e : i % 5 === 0 ? 0xf6c6cf : 0xd8ecf0,
        0.85,
      ).setDepth(-27);
      this.tweens.add({
        targets: star,
        alpha: { from: 0.18, to: 0.95 },
        duration: 900 + (i % 11) * 210,
        yoyo: true,
        repeat: -1,
        delay: i * 45,
      });
    }

    // Colinas em camadas com parallax suave.
    const hills = this.add.graphics().setDepth(-20);
    hills.fillStyle(0x233a3c, 0.9);
    hills.fillEllipse(180, 430, 760, 300);
    hills.fillStyle(0x294643, 0.95);
    hills.fillEllipse(760, 440, 920, 320);
    hills.fillStyle(0x315247, 1);
    hills.fillEllipse(480, 470, 1400, 280);

    // Árvores silhuetas nas bordas.
    const addTree = (x: number, y: number, scale: number, tint: number): void => {
      this.add.image(x, y, 'tree-pine')
        .setOrigin(0.5, 1)
        .setScale(scale)
        .setTint(tint)
        .setAlpha(0.85)
        .setDepth(-18);
    };
    addTree(56, 452, 1.9, 0x1d3335);
    addTree(126, 468, 1.35, 0x223b38);
    addTree(894, 456, 1.75, 0x1d3335);
    addTree(842, 472, 1.2, 0x223b38);

    // Poeira de estrelas subindo.
    this.add.particles(0, 0, 'pixel', {
      x: { min: 0, max: width },
      y: { min: 220, max: 480 },
      lifespan: 7000,
      speedX: { min: -8, max: 8 },
      speedY: { min: -22, max: -6 },
      scale: { start: 0.6, end: 0 },
      alpha: { start: 0.8, end: 0 },
      frequency: 150,
      quantity: 1,
      blendMode: 'ADD',
      tint: [0xffdf7e, 0xfff3bd, 0xf6c6cf, 0xa8d9dc],
    }).setDepth(4);
  }

  private buildGround(): void {
    const ground = this.add.graphics().setDepth(-10);
    ground.fillStyle(0x3b5c47, 1);
    ground.fillRect(0, 424, 960, 116);
    ground.fillStyle(0x4a6e53, 1);
    ground.fillRect(0, 424, 960, 14);
    ground.fillStyle(0x5d865f, 1);
    ground.fillRect(0, 424, 960, 4);

    // Floresta de fundo.
    for (let i = 0; i < 14; i++) {
      const x = 20 + i * 68;
      const tree = this.add.image(x, 436, i % 2 === 0 ? 'tree-round' : 'tree-pine')
        .setOrigin(0.5, 1)
        .setScale(0.75 + (i % 3) * 0.1)
        .setTint(0x50795a)
        .setAlpha(0.55)
        .setDepth(-9);
      this.tweens.add({
        targets: tree,
        angle: { from: -1.2, to: 1.2 },
        duration: 2600 + i * 120,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }

    // Flores no chão do Lugar Especial.
    for (let i = 0; i < 26; i++) {
      const x = Phaser.Math.Between(20, 940);
      const y = Phaser.Math.Between(444, 524);
      const key = i % 3 === 0 ? 'flower-yellow' : i % 3 === 1 ? 'flower-pink' : 'flower-blue';
      const flower = this.add.image(x, y, key).setOrigin(0.5, 1).setScale(0.8).setDepth(y);
      this.tweens.add({
        targets: flower,
        angle: { from: -4, to: 4 },
        duration: 1600 + i * 90,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }

    // Pequena colina central onde eles se encontram.
    const hill = this.add.graphics().setDepth(-5);
    hill.fillStyle(0x3f6349, 1);
    hill.fillEllipse(480, 428, 620, 90);
    hill.fillStyle(0x4d7554, 1);
    hill.fillEllipse(480, 424, 560, 70);

    // Lanternas ao redor.
    [120, 220, 740, 840].forEach((x, index) => {
      const lantern = this.add.image(x, 472, 'lantern').setOrigin(0.5, 1).setScale(1.05).setDepth(472);
      const glow = this.add.image(x, 432, 'glow-gold').setScale(0.7).setAlpha(0.3).setDepth(471).setBlendMode(Phaser.BlendModes.ADD);
      this.tweens.add({
        targets: glow,
        alpha: 0.5,
        duration: 1300 + index * 180,
        yoyo: true,
        repeat: -1,
      });
      void lantern;
    });
  }

  /* ─────────────────────────  PERSONAGENS  ───────────────────────── */

  private buildCharacters(): void {
    this.cristian = this.add.sprite(-50, 428, 'cristian-idle-0')
      .setOrigin(0.5, 1)
      .setScale(1.5)
      .setDepth(430);
    this.cristian.play('cristian-walk');
    this.cristian.setFlipX(false);

    this.amada = this.add.sprite(1010, 428, 'amada-idle-0')
      .setOrigin(0.5, 1)
      .setScale(1.5)
      .setDepth(430);
    this.amada.play('amada-walk');
    this.amada.setFlipX(true);

    // Caminham um em direção ao outro.
    this.tweens.add({
      targets: this.cristian,
      x: 408,
      duration: 2200,
      ease: 'Sine.easeOut',
      onComplete: () => {
        this.cristian?.play('cristian-idle');
        this.cristian?.setFlipX(false);
      },
    });
    this.tweens.add({
      targets: this.amada,
      x: 552,
      duration: 2200,
      ease: 'Sine.easeOut',
      onComplete: () => {
        this.amada?.play('amada-idle');
        this.amada?.setFlipX(true);
      },
    });

    this.time.delayedCall(2250, () => {
      this.add.image(480, 388, 'glow-pink').setScale(1.5).setAlpha(0.28).setDepth(429).setBlendMode(Phaser.BlendModes.ADD);
      AudioManager.sfx('heart');
      this.heartBurst(480, 386);
      this.startHearts();
      this.tweens.add({
        targets: this.cristian,
        x: 424,
        duration: 700,
        ease: 'Sine.easeInOut',
      });
      this.tweens.add({
        targets: this.amada,
        x: 536,
        duration: 700,
        ease: 'Sine.easeInOut',
      });
      this.floatingText(480, 344, '♥', '#f6c6cf');
    });
  }

  private startHearts(): void {
    this.heartsTimer?.remove();
    this.heartsTimer = this.time.addEvent({
      delay: 650,
      loop: true,
      callback: () => {
        const x = 448 + Phaser.Math.Between(0, 64);
        const y = 372 + Phaser.Math.Between(-8, 10);
        const heart = this.add.image(x, y, 'heart').setScale(0.8).setDepth(600).setAlpha(0.95);
        this.tweens.add({
          targets: heart,
          y: y - Phaser.Math.Between(54, 120),
          x: x + Phaser.Math.Between(-26, 26),
          alpha: 0,
          angle: Phaser.Math.Between(-24, 24),
          duration: 2100,
          ease: 'Sine.easeOut',
          onComplete: () => heart.destroy(),
        });
      },
    });
  }

  private heartBurst(x: number, y: number): void {
    const emitter = this.add.particles(x, y, 'heart', {
      speed: { min: 40, max: 130 },
      angle: { min: 200, max: 340 },
      lifespan: { min: 800, max: 1500 },
      scale: { start: 0.8, end: 0 },
      alpha: { start: 1, end: 0 },
      quantity: 1,
      emitting: false,
      gravityY: -30,
    }).setDepth(601);
    emitter.explode(14);
    this.time.delayedCall(1600, () => emitter.destroy());
  }

  private floatingText(x: number, y: number, text: string, color: string): void {
    const label = this.add.text(x, y, text, {
      fontFamily: '"Nunito", sans-serif',
      fontSize: '22px',
      fontStyle: '900',
      color,
      stroke: '#203c35',
      strokeThickness: 5,
    }).setOrigin(0.5).setDepth(650);
    this.tweens.add({
      targets: label,
      y: y - 30,
      alpha: 0,
      duration: 1600,
      ease: 'Sine.easeOut',
      onComplete: () => label.destroy(),
    });
  }

  /* ─────────────────────────  DIÁLOGO  ───────────────────────── */

  private startDialogue(): void {
    if (this.sequenceDone) return;
    const pages: DialoguePage[] = PERSONALIZATION.finalDialogue.map((line) => ({
      speaker: line.speaker,
      text: line.text,
      portrait: line.portrait,
      accent: line.portrait?.startsWith('amada') ? '#f6c6cf' : '#ffe9a8',
    }));
    this.dialogue.open(pages, () => {
      this.sequenceDone = true;
      this.showLetter();
    });
  }

  private advance(): void {
    if (this.letterShown) return;
    if (this.dialogue?.isOpen) this.dialogue.advance();
  }

  /* ─────────────────────────  CARTA FINAL  ───────────────────────── */

  private showLetter(): void {
    if (this.letterShown) return;
    this.letterShown = true;
    this.heartsTimer?.remove();
    AudioManager.sfx('heart');

    const layer = this.add.container(0, 0).setDepth(1500).setScrollFactor(0).setAlpha(0);
    const dim = this.add.rectangle(480, 270, 960, 540, 0x0b111c, 0.72);
    const panel = addPanel(this, 150, 34, 660, 472, {
      fill: 0xfff4e2,
      stroke: UI.pinkDark,
      radius: 20,
    });

    // Fita decorativa no topo.
    const ribbon = this.add.graphics();
    ribbon.fillStyle(UI.pinkDark, 1);
    ribbon.fillRoundedRect(150, 22, 220, 30, 10);
    ribbon.fillStyle(0xffffff, 0.16);
    ribbon.fillRect(162, 28, 196, 2);

    const badge = this.add.text(170, 26, '✦  LUGAR ESPECIAL', textStyle(11, CSS.cream, {
      fontStyle: '900',
      letterSpacing: 1,
    }));

    const title = this.add.text(480, 82, personalText(PERSONALIZATION.finalLetter.title), {
      fontFamily: '"Nunito", sans-serif',
      fontSize: '27px',
      fontStyle: '900',
      color: '#3b3038',
      align: 'center',
      wordWrap: { width: 560 },
    }).setOrigin(0.5, 0);

    const paragraphs = PERSONALIZATION.finalLetter.paragraphs.map((paragraph) => personalText(paragraph));
    const body = this.add.text(196, 126, paragraphs.join('\n\n'), {
      fontFamily: '"Nunito", sans-serif',
      fontSize: '13px',
      fontStyle: '600',
      color: '#5b4a54',
      lineSpacing: 5,
      wordWrap: { width: 568 },
      align: 'left',
    });

    const divider = this.add.graphics();
    divider.fillStyle(0xe0c8b0, 1);
    divider.fillRect(196, 384, 568, 2);

    const signature = this.add.text(764, 392, personalText(PERSONALIZATION.finalLetter.signature), {
      fontFamily: '"Nunito", sans-serif',
      fontSize: '14px',
      fontStyle: '800',
      color: '#8a5566',
      align: 'right',
      lineSpacing: 3,
    }).setOrigin(1, 0);

    const footer = this.add.text(480, 452, personalText(PERSONALIZATION.finalLetter.footer), {
      fontFamily: '"Nunito", sans-serif',
      fontSize: '11px',
      fontStyle: '700',
      color: '#a08a7d',
      align: 'center',
    }).setOrigin(0.5, 0);

    // Botões.
    const replay = this.makeButton(388, 490, 'voltar ao mundo', () => {
      AudioManager.sfx('ui');
      this.save.area = 'village';
      SaveManager.save(this.save);
      this.cameras.main.fadeOut(420, 12, 16, 30);
      this.time.delayedCall(440, () => {
        this.scene.start('AdventureScene', { area: 'village', spawn: 'fromTrail' });
      });
    }, UI.cream, CSS.ink);

    const menu = this.makeButton(574, 490, 'menu inicial', () => {
      AudioManager.sfx('ui');
      this.cameras.main.fadeOut(420, 12, 16, 30);
      this.time.delayedCall(440, () => this.scene.start('MenuScene'));
    }, UI.pink, CSS.ink);

    const note = this.add.text(480, 520, PERSONALIZATION.finalNote, {
      fontFamily: '"Nunito", sans-serif',
      fontSize: '10px',
      fontStyle: '600',
      color: '#c9b6ab',
      align: 'center',
    }).setOrigin(0.5, 0);

    // Pequenas estrelinhas decorativas.
    const decorations: Phaser.GameObjects.GameObject[] = [];
    for (let i = 0; i < 8; i++) {
      const star = this.add.image(196 + i * 76, 108, 'sparkle')
        .setScale(0.55)
        .setAlpha(0.45)
        .setTint(i % 2 === 0 ? 0xffdf7e : 0xf6c6cf);
      this.tweens.add({
        targets: star,
        alpha: { from: 0.2, to: 0.7 },
        duration: 900 + i * 120,
        yoyo: true,
        repeat: -1,
      });
      decorations.push(star);
    }

    layer.add([
      dim, panel, ribbon, badge, title, body, divider, signature, footer,
      replay, menu, note, ...decorations,
    ]);
    this.letterLayer = layer;

    this.tweens.add({ targets: layer, alpha: 1, duration: 700, ease: 'Sine.easeOut' });
    this.cameras.main.flash(500, 255, 240, 210, false);
  }

  private makeButton(
    x: number,
    y: number,
    label: string,
    onClick: () => void,
    fill: number,
    color: string,
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);
    const width = 168;
    const height = 38;
    const bg = this.add.graphics();
    bg.fillStyle(0x1d2a22, 0.18);
    bg.fillRoundedRect(-width / 2 + 2, -height / 2 + 3, width, height, 11);
    bg.fillStyle(fill, 1);
    bg.fillRoundedRect(-width / 2, -height / 2, width, height, 11);
    bg.lineStyle(2, UI.pinkDark, 0.8);
    bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 11);
    const text = this.add.text(0, 0, label, {
      fontFamily: '"Nunito", sans-serif',
      fontSize: '13px',
      fontStyle: '900',
      color,
    }).setOrigin(0.5);
    const hit = this.add.zone(0, 0, width, height).setInteractive({ useHandCursor: true });
    hit.on('pointerover', () => container.setScale(1.05));
    hit.on('pointerout', () => container.setScale(1));
    hit.on('pointerdown', onClick);
    container.add([bg, text, hit]);
    return container;
  }
}
