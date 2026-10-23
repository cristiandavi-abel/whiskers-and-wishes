import Phaser from 'phaser';
import { CAT_TOTAL } from '../../data/worldData';
import type { SaveData } from '../systems/SaveManager';
import { AudioManager } from '../systems/AudioManager';
import { addPanel, CSS, textStyle, UI } from './Theme';

export type QuestTracker = {
  title: string;
  objective: string;
  collected: number;
  total: number;
  areaProgress: string;
};

type HudOptions = {
  onPause: () => void;
};

/** HUD compartilhado pelas áreas exploráveis. */
export class Hud {
  private scene: Phaser.Scene;
  private root: Phaser.GameObjects.Container;
  private statsText: Phaser.GameObjects.Text;
  private areaText: Phaser.GameObjects.Text;
  private progressText: Phaser.GameObjects.Text;
  private questRoot: Phaser.GameObjects.Container;
  private questTitle: Phaser.GameObjects.Text;
  private questBody: Phaser.GameObjects.Text;
  private questCounter: Phaser.GameObjects.Text;
  private hintRoot: Phaser.GameObjects.Container;
  private hintText: Phaser.GameObjects.Text;
  private hintBg: Phaser.GameObjects.Graphics;
  private toastRoot: Phaser.GameObjects.Container;
  private toastTitle: Phaser.GameObjects.Text;
  private toastBody: Phaser.GameObjects.Text;
  private toastTimer?: Phaser.Time.TimerEvent;
  private muteText: Phaser.GameObjects.Text;
  private areaProgressText: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, areaName: string, areaProgress: string, options: HudOptions) {
    this.scene = scene;
    const depth = 900;

    this.root = scene.add.container(0, 0).setScrollFactor(0).setDepth(depth);

    addPanel(scene, 14, 14, 342, 76, { radius: 14 }).setScrollFactor(0).setDepth(depth);
    scene.add.text(30, 25, 'WHISKERS & WISHES', textStyle(10, '#8a5566', { fontStyle: '900', letterSpacing: 1 }))
      .setScrollFactor(0).setDepth(depth + 1);
    this.areaText = scene.add.text(30, 41, areaName, textStyle(19, CSS.ink, { fontStyle: '900' }))
      .setScrollFactor(0).setDepth(depth + 1);
    this.areaProgressText = scene.add.text(344, 44, areaProgress, textStyle(11, '#8a5566', { fontStyle: '800' }))
      .setOrigin(1, 0).setScrollFactor(0).setDepth(depth + 1);

    this.statsText = scene.add.text(30, 69, '', textStyle(13, CSS.inkSoft, { fontStyle: '700' }))
      .setScrollFactor(0).setDepth(depth + 1);

    this.progressText = scene.add.text(344, 68, '', textStyle(11, '#8a5566', { fontStyle: '800' }))
      .setOrigin(1, 0).setScrollFactor(0).setDepth(depth + 1);

    // Botões: som e pausa.
    this.muteText = this.makeRoundButton(866, 42, '♪', () => {
      const muted = AudioManager.toggleMute();
      this.setMuted(muted);
    });
    this.makeRoundButton(918, 42, '☰', () => options.onPause());

    // Rastreador de missão
    this.questRoot = scene.add.container(0, 0).setScrollFactor(0).setDepth(depth).setVisible(false);
    const questPanel = addPanel(scene, 14, 100, 352, 108, { fill: 0xfff0d8, radius: 12 });
    const ribbon = scene.add.graphics();
    ribbon.fillStyle(UI.pinkDark, 1);
    ribbon.fillRoundedRect(14, 92, 126, 24, 8);
    ribbon.fillStyle(0xffffff, 0.15);
    ribbon.fillRect(26, 97, 104, 2);
    const questLabel = scene.add.text(30, 96, 'MISSÃO ATUAL', textStyle(10, CSS.cream, { fontStyle: '900', letterSpacing: 1 }));
    this.questTitle = scene.add.text(30, 123, '', textStyle(15, CSS.ink, { fontStyle: '900' }));
    this.questBody = scene.add.text(30, 145, '', textStyle(12, CSS.inkSoft, {
      wordWrap: { width: 320 },
      lineSpacing: 2,
    }));
    this.questCounter = scene.add.text(348, 96, '', textStyle(11, CSS.cream, { fontStyle: '900' })).setOrigin(1, 0);
    this.questRoot.add([questPanel, ribbon, questLabel, this.questTitle, this.questBody, this.questCounter]);

    // Dica contextual
    this.hintRoot = scene.add.container(480, 352).setScrollFactor(0).setDepth(depth);
    this.hintBg = scene.add.graphics();
    this.hintText = scene.add.text(0, 0, '', textStyle(13, CSS.cream, { fontStyle: '700' })).setOrigin(0.5);
    this.hintRoot.add([this.hintBg, this.hintText]);
    this.hintRoot.setVisible(false);

    // Toast
    this.toastRoot = scene.add.container(480, 112).setScrollFactor(0).setDepth(depth + 30).setAlpha(0);
    const toastBg = scene.add.graphics();
    toastBg.fillStyle(UI.green, 0.94);
    toastBg.fillRoundedRect(-230, -30, 460, 66, 14);
    toastBg.lineStyle(2, UI.pink, 0.85);
    toastBg.strokeRoundedRect(-230, -30, 460, 66, 14);
    this.toastTitle = scene.add.text(0, -14, '', textStyle(15, CSS.cream, { fontStyle: '900' })).setOrigin(0.5);
    this.toastBody = scene.add.text(0, 9, '', textStyle(12, '#e6d9c4', { fontStyle: '600' })).setOrigin(0.5);
    this.toastRoot.add([toastBg, this.toastTitle, this.toastBody]);

    this.setMuted(AudioManager.isMuted);
    this.setHint('WASD / setas para andar  •  E para interagir  •  ESC para pausar');
  }

  private makeRoundButton(x: number, y: number, label: string, onClick: () => void): Phaser.GameObjects.Text {
    const scene = this.scene;
    const circle = scene.add.circle(x, y, 22, UI.cream, 0.96)
      .setStrokeStyle(3, UI.pinkDark)
      .setScrollFactor(0)
      .setDepth(910)
      .setInteractive({ useHandCursor: true });
    const text = scene.add.text(x, y, label, textStyle(18, CSS.ink, { fontStyle: '900' }))
      .setOrigin(0.5).setScrollFactor(0).setDepth(911);
    circle.on('pointerover', () => circle.setScale(1.08));
    circle.on('pointerout', () => circle.setScale(1));
    circle.on('pointerdown', () => {
      AudioManager.sfx('ui');
      onClick();
    });
    return text;
  }

  setArea(name: string): void {
    this.areaText.setText(name);
  }

  setAreaProgress(text: string): void {
    this.areaProgressText.setText(text);
  }

  update(save: SaveData): void {
    this.statsText.setText(`★ ${save.stars}    ♥ ${save.catsFound.length}/${CAT_TOTAL}    ✦ ${save.questsDone.length}/4`);
    this.progressText.setText(save.questsDone.length >= 4 ? 'aventura completa' : 'salvo automaticamente');
  }

  setQuest(quest: QuestTracker | null): void {
    if (!quest) {
      this.questRoot.setVisible(false);
      return;
    }
    this.questRoot.setVisible(true);
    this.questTitle.setText(quest.title);
    this.questBody.setText(quest.objective);
    this.questCounter.setText(quest.areaProgress);
  }

  setHint(text: string): void {
    if (!text) {
      this.hintRoot.setVisible(false);
      return;
    }
    this.hintText.setText(text);
    const width = Math.max(180, Math.min(700, this.hintText.width + 44));
    this.hintBg.clear();
    this.hintBg.fillStyle(0x1d2a22, 0.28);
    this.hintBg.fillRoundedRect(-width / 2 + 3, 16, width, 32, 10);
    this.hintBg.fillStyle(UI.green, 0.92);
    this.hintBg.fillRoundedRect(-width / 2, 13, width, 32, 10);
    this.hintBg.lineStyle(2, 0xf3b8c6, 0.55);
    this.hintBg.strokeRoundedRect(-width / 2, 13, width, 32, 10);
    this.hintText.setY(29);
    this.hintRoot.setVisible(true);
  }

  toast(title: string, body = ''): void {
    this.toastTimer?.remove();
    this.toastTitle.setText(title);
    this.toastBody.setText(body);
    this.toastRoot.setAlpha(0).setY(130);
    this.toastRoot.setVisible(true);
    this.scene.tweens.killTweensOf(this.toastRoot);
    this.scene.tweens.add({
      targets: this.toastRoot,
      y: 112,
      alpha: 1,
      duration: 260,
      ease: 'Back.easeOut',
    });
    this.toastTimer = this.scene.time.delayedCall(2600, () => {
      this.scene.tweens.add({
        targets: this.toastRoot,
        y: 100,
        alpha: 0,
        duration: 380,
        ease: 'Sine.easeIn',
      });
    });
  }

  setMuted(muted: boolean): void {
    this.muteText.setText(muted ? '✕' : '♪');
    this.muteText.setColor(muted ? '#a05f6e' : CSS.ink);
  }

  destroy(): void {
    this.toastTimer?.remove();
    this.root.destroy(true);
    this.questRoot.destroy(true);
    this.hintRoot.destroy(true);
    this.toastRoot.destroy(true);
  }
}
