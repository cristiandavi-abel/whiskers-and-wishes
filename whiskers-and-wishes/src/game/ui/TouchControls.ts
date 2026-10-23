import Phaser from 'phaser';
import { AudioManager } from '../systems/AudioManager';
import { CSS, textStyle, UI } from './Theme';

type Mode = 'adventure' | 'trail';

/**
 * Controles de toque: joystick + botão de ação nas áreas de exploração;
 * botões de direção + pulo na Trilha das Estrelas.
 */
export class TouchControls {
  private scene: Phaser.Scene;
  private mode: Mode;
  private objects: Phaser.GameObjects.GameObject[] = [];
  private base?: Phaser.GameObjects.Arc;
  private knob?: Phaser.GameObjects.Arc;
  private pointerId?: number;
  private center = new Phaser.Math.Vector2(104, 438);
  private enabled = true;
  private visible: boolean;
  direction = new Phaser.Math.Vector2(0, 0);
  private jumpQueued = false;
  jumpHeld = false;
  leftHeld = false;
  rightHeld = false;
  onInteract: () => void;
  onBack?: () => void;

  constructor(
    scene: Phaser.Scene,
    mode: Mode,
    onInteract: () => void,
    onBack?: () => void,
  ) {
    this.scene = scene;
    this.mode = mode;
    this.onInteract = onInteract;
    this.onBack = onBack;
    this.visible = scene.sys.game.device.input.touch || (navigator.maxTouchPoints ?? 0) > 0;

    if (this.visible) {
      if (mode === 'adventure') this.buildJoystick();
      else this.buildTrailButtons();
    }

    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.destroy());
  }

  private buildJoystick(): void {
    const scene = this.scene;
    this.base = scene.add.circle(this.center.x, this.center.y, 58, 0x203c35, 0.35)
      .setStrokeStyle(3, 0xfff4e2, 0.55)
      .setScrollFactor(0)
      .setDepth(920);
    this.knob = scene.add.circle(this.center.x, this.center.y, 24, 0xfff4e2, 0.72)
      .setStrokeStyle(2, UI.pinkDark, 0.7)
      .setScrollFactor(0)
      .setDepth(921);
    const label = scene.add.text(this.center.x, this.center.y + 76, 'MOVER', textStyle(10, '#fff4e2', { fontStyle: '800' }))
      .setOrigin(0.5).setScrollFactor(0).setDepth(921);
    this.objects.push(this.base, this.knob, label);

    const action = scene.add.circle(854, 438, 38, 0xf3b8c6, 0.92)
      .setStrokeStyle(3, UI.pinkDark)
      .setScrollFactor(0)
      .setDepth(921)
      .setInteractive({ useHandCursor: true });
    const actionLabel = scene.add.text(854, 432, 'E', textStyle(24, CSS.ink, { fontStyle: '900' }))
      .setOrigin(0.5).setScrollFactor(0).setDepth(922);
    const actionHint = scene.add.text(854, 454, 'AÇÃO', textStyle(9, '#6a5560', { fontStyle: '900' }))
      .setOrigin(0.5).setScrollFactor(0).setDepth(922);
    this.objects.push(action, actionLabel, actionHint);

    action.on('pointerdown', () => {
      if (!this.enabled) return;
      AudioManager.sfx('ui');
      this.onInteract();
    });

    const onDown = (pointer: Phaser.Input.Pointer): void => {
      if (!this.enabled) return;
      const dx = pointer.x - this.center.x;
      const dy = pointer.y - this.center.y;
      if (Math.hypot(dx, dy) > 100) return;
      this.pointerId = pointer.id;
      this.updateJoystick(pointer);
    };
    const onMove = (pointer: Phaser.Input.Pointer): void => {
      if (pointer.id === this.pointerId && pointer.isDown) this.updateJoystick(pointer);
    };
    const onUp = (pointer: Phaser.Input.Pointer): void => {
      if (pointer.id !== this.pointerId) return;
      this.pointerId = undefined;
      this.direction.set(0, 0);
      this.knob?.setPosition(this.center.x, this.center.y);
    };
    scene.input.on('pointerdown', onDown);
    scene.input.on('pointermove', onMove);
    scene.input.on('pointerup', onUp);
    scene.input.on('pointerupoutside', onUp);
    this.cleanup = () => {
      scene.input.off('pointerdown', onDown);
      scene.input.off('pointermove', onMove);
      scene.input.off('pointerup', onUp);
      scene.input.off('pointerupoutside', onUp);
    };
  }

  private buildTrailButtons(): void {
    const scene = this.scene;
    this.makeTrailButton(96, 448, '◀', () => { this.leftHeld = true; }, () => { this.leftHeld = false; });
    this.makeTrailButton(188, 448, '▶', () => { this.rightHeld = true; }, () => { this.rightHeld = false; });
    this.makeTrailButton(852, 430, '↑', () => {
      this.jumpHeld = true;
      this.jumpQueued = true;
    }, () => { this.jumpHeld = false; }, 46);

    if (this.onBack) {
      const back = scene.add.circle(48, 118, 24, 0xfff4e2, 0.92)
        .setStrokeStyle(3, UI.pinkDark)
        .setScrollFactor(0)
        .setDepth(921)
        .setInteractive({ useHandCursor: true });
      const label = scene.add.text(48, 118, '↩', textStyle(20, CSS.ink, { fontStyle: '900' }))
        .setOrigin(0.5).setScrollFactor(0).setDepth(922);
      back.on('pointerdown', () => { if (this.enabled) this.onBack?.(); });
      this.objects.push(back, label);
    }
  }

  private makeTrailButton(
    x: number,
    y: number,
    label: string,
    down: () => void,
    up: () => void,
    radius = 40,
  ): void {
    const scene = this.scene;
    const circle = scene.add.circle(x, y, radius, 0xfff4e2, 0.72)
      .setStrokeStyle(3, UI.pinkDark, 0.8)
      .setScrollFactor(0)
      .setDepth(921)
      .setInteractive({ useHandCursor: true });
    const text = scene.add.text(x, y, label, textStyle(24, CSS.ink, { fontStyle: '900' }))
      .setOrigin(0.5).setScrollFactor(0).setDepth(922);
    circle.on('pointerdown', () => { if (this.enabled) down(); });
    circle.on('pointerup', up);
    circle.on('pointerout', up);
    circle.on('pointerupoutside', up);
    this.objects.push(circle, text);
  }

  private updateJoystick(pointer: Phaser.Input.Pointer): void {
    const dx = pointer.x - this.center.x;
    const dy = pointer.y - this.center.y;
    const len = Math.max(1, Math.hypot(dx, dy));
    const scale = Math.min(1, 44 / len);
    this.knob?.setPosition(this.center.x + dx * scale, this.center.y + dy * scale);
    const magnitude = Math.min(1, len / 50);
    this.direction.set((dx / len) * magnitude, (dy / len) * magnitude);
  }

  private cleanup?: () => void;

  get isVisible(): boolean {
    return this.visible;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) {
      this.direction.set(0, 0);
      this.knob?.setPosition(this.center.x, this.center.y);
      this.leftHeld = false;
      this.rightHeld = false;
      this.jumpHeld = false;
      this.jumpQueued = false;
    }
  }

  setVisible(visible: boolean): void {
    this.visible = visible;
    this.objects.forEach((object) => {
      (object as unknown as Phaser.GameObjects.Components.Visible).setVisible(visible);
    });
    this.setEnabled(visible);
  }

  consumeJump(): boolean {
    if (!this.jumpQueued) return false;
    this.jumpQueued = false;
    return true;
  }

  destroy(): void {
    this.cleanup?.();
    this.objects.forEach((object) => object.destroy());
    this.objects = [];
  }
}
