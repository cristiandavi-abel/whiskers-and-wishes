import Phaser from 'phaser';
import { AudioManager } from '../systems/AudioManager';
import { personalText } from '../../config/personalization';
import { addPanel, CSS, textStyle, UI } from './Theme';

export type DialoguePage = {
  speaker: string;
  text: string;
  portrait?: string;
  /** Cor do nome do personagem. */
  accent?: string;
};

/**
 * Caixa de diálogo com retrato, efeito de máquina de escrever e
 * avanço por tecla E, Enter, Espaço ou toque.
 */
export class DialogueBox {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private portraitFrame: Phaser.GameObjects.Graphics;
  private portrait: Phaser.GameObjects.Image;
  private speaker: Phaser.GameObjects.Text;
  private body: Phaser.GameObjects.Text;
  private hint: Phaser.GameObjects.Text;
  private blocker: Phaser.GameObjects.Zone;
  private pages: DialoguePage[] = [];
  private index = 0;
  private fullText = '';
  private typed = 0;
  private typing = false;
  private timer?: Phaser.Time.TimerEvent;
  private onClose?: () => void;
  private openState = false;

  constructor(scene: Phaser.Scene, depth = 1200) {
    this.scene = scene;
    const width = 812;
    const x = 480 - width / 2;
    const y = 392;

    this.container = scene.add.container(0, 0).setScrollFactor(0).setDepth(depth).setVisible(false);
    const panel = addPanel(scene, x, y, width, 130, { radius: 16 });
    const namePlate = scene.add.graphics();
    namePlate.fillStyle(UI.pinkDark, 1);
    namePlate.fillRoundedRect(x + 22, y - 16, 210, 30, 10);
    namePlate.fillStyle(0xffffff, 0.15);
    namePlate.fillRect(x + 34, y - 10, 186, 2);

    this.speaker = scene.add.text(x + 34, y - 12, '', textStyle(16, CSS.cream, { fontStyle: '900' }));
    this.speaker.setShadow(0, 2, '#3b3038', 0, true, true);

    const portraitX = x + 54;
    const portraitY = y + 65;
    this.portraitFrame = scene.add.graphics();
    this.portraitFrame.fillStyle(0x1d2a22, 0.25);
    this.portraitFrame.fillRoundedRect(portraitX - 42, portraitY - 47, 84, 94, 12);
    this.portraitFrame.fillStyle(0xe8d9c9, 1);
    this.portraitFrame.fillRoundedRect(portraitX - 38, portraitY - 43, 76, 86, 10);
    this.portraitFrame.lineStyle(2, UI.pinkDark, 0.7);
    this.portraitFrame.strokeRoundedRect(portraitX - 38, portraitY - 43, 76, 86, 10);

    this.portrait = scene.add.image(portraitX, portraitY + 4, 'cristian-idle-0').setScale(1.05);

    this.body = scene.add.text(x + 102, y + 20, '', textStyle(17, CSS.ink, {
      wordWrap: { width: width - 132 },
      lineSpacing: 5,
    }));

    this.hint = scene.add.text(x + width - 24, y + 106, '', textStyle(11, CSS.inkSoft, { fontStyle: '700' }))
      .setOrigin(1, 0.5);

    this.container.add([panel, namePlate, this.speaker, this.portraitFrame, this.portrait, this.body, this.hint]);

    this.blocker = scene.add.zone(480, 270, 960, 540).setScrollFactor(0).setDepth(depth - 1).setInteractive();
    this.blocker.setVisible(false);
    this.blocker.on('pointerdown', () => this.advance());
  }

  get isOpen(): boolean {
    return this.openState;
  }

  open(pages: DialoguePage[], onClose?: () => void): void {
    if (pages.length === 0) {
      onClose?.();
      return;
    }
    this.pages = pages.map((page) => ({
      ...page,
      speaker: personalText(page.speaker),
      text: personalText(page.text),
    }));
    this.index = 0;
    this.onClose = onClose;
    this.openState = true;
    this.container.setVisible(true);
    this.blocker.setVisible(true);
    this.blocker.setActive(true);
    this.showPage();
    AudioManager.sfx('ui');
  }

  advance(): void {
    if (!this.openState) return;
    if (this.typing) {
      this.finishTyping();
      return;
    }
    if (this.index < this.pages.length - 1) {
      this.index += 1;
      this.showPage();
      AudioManager.sfx('ui');
      return;
    }
    this.close();
  }

  close(): void {
    if (!this.openState) return;
    this.openState = false;
    this.typing = false;
    this.timer?.remove();
    this.timer = undefined;
    this.container.setVisible(false);
    this.blocker.setVisible(false);
    this.blocker.setActive(false);
    const callback = this.onClose;
    this.onClose = undefined;
    callback?.();
  }

  private showPage(): void {
    const page = this.pages[this.index];
    this.speaker.setText(page.speaker);
    this.speaker.setColor(page.accent ?? CSS.cream);
    this.fullText = page.text;
    this.typed = 0;
    this.typing = true;
    this.body.setText('');
    this.hint.setText('');

    if (page.portrait && this.scene.textures.exists(page.portrait)) {
      this.portrait.setTexture(page.portrait);
      this.portrait.setVisible(true);
      this.portraitFrame.setVisible(true);
      // Ajusta o retrato para caber bonitinho na moldura.
      const frame = this.scene.textures.getFrame(page.portrait);
      const maxH = 86;
      const maxW = 76;
      const scale = Math.min(maxW / frame.width, maxH / frame.height);
      this.portrait.setScale(scale);
      this.body.setX(480 - 812 / 2 + 102);
    } else {
      this.portrait.setVisible(false);
      this.portraitFrame.setVisible(false);
      this.body.setX(480 - 812 / 2 + 34);
      this.body.setWordWrapWidth(812 - 68);
    }

    if (page.portrait) this.body.setWordWrapWidth(812 - 132);

    this.timer?.remove();
    this.timer = this.scene.time.addEvent({
      delay: 16,
      loop: true,
      callback: () => {
        if (!this.typing) return;
        this.typed = Math.min(this.fullText.length, this.typed + 1);
        this.body.setText(this.fullText.slice(0, this.typed));
        if (this.typed % 5 === 0) AudioManager.sfx('talk');
        if (this.typed >= this.fullText.length) this.finishTyping();
      },
    });
  }

  private finishTyping(): void {
    this.typing = false;
    this.typed = this.fullText.length;
    this.body.setText(this.fullText);
    this.timer?.remove();
    this.timer = undefined;
    this.hint.setText(this.index < this.pages.length - 1 ? 'E / toque para continuar ▸' : 'E / toque para fechar ✓');
  }

  destroy(): void {
    this.timer?.remove();
    this.container.destroy(true);
    this.blocker.destroy();
  }
}
