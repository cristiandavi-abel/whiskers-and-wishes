import Phaser from 'phaser';
import { STAR_TRAIL_TOTAL } from '../../data/worldData';
import { AudioManager } from '../systems/AudioManager';
import { SaveManager, type SaveData } from '../systems/SaveManager';
import { TouchControls } from '../ui/TouchControls';
import { addPanel, CSS, textStyle, UI } from '../ui/Theme';

type PlatformDef = { x: number; y: number; w: number; h?: number; upper?: boolean };
type StarDef = { id: string; x: number; y: number };

const PLATFORM_H = 24;

const PLATFORMS: PlatformDef[] = [
  // Chão com brechas
  { x: 350, y: 690, w: 700 },
  { x: 1035, y: 690, w: 430 },
  { x: 1590, y: 690, w: 380 },
  { x: 2105, y: 690, w: 350 },
  { x: 2615, y: 690, w: 370 },
  // Rota alta
  { x: 760, y: 600, w: 150, upper: true },
  { x: 940, y: 525, w: 140, upper: true },
  { x: 1130, y: 455, w: 150, upper: true },
  { x: 1340, y: 520, w: 150, upper: true },
  { x: 1550, y: 440, w: 150, upper: true },
  { x: 1770, y: 380, w: 150, upper: true },
  { x: 1990, y: 450, w: 150, upper: true },
  { x: 2200, y: 380, w: 150, upper: true },
  { x: 2420, y: 310, w: 160, upper: true },
  { x: 2640, y: 240, w: 200, upper: true },
];

const STARS: StarDef[] = [
  { id: 'trail-1', x: 330, y: 618 },
  { id: 'trail-2', x: 760, y: 552 },
  { id: 'trail-3', x: 940, y: 475 },
  { id: 'trail-4', x: 1130, y: 405 },
  { id: 'trail-5', x: 1340, y: 470 },
  { id: 'trail-6', x: 1550, y: 390 },
  { id: 'trail-7', x: 1770, y: 330 },
  { id: 'trail-8', x: 1990, y: 400 },
  { id: 'trail-9', x: 2200, y: 330 },
  { id: 'trail-10', x: 2420, y: 260 },
];

const CHECKPOINTS = [
  { x: 900, y: 660 },
  { x: 1500, y: 660 },
  { x: 2050, y: 660 },
  { x: 2520, y: 660 },
];

const HAZARDS = [
  { x: 1040, w: 58 },
  { x: 1620, w: 58 },
  { x: 2140, w: 58 },
];

export class StarTrailScene extends Phaser.Scene {
  private save!: SaveData;
  private player!: Phaser.Physics.Arcade.Sprite;
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private starsGroup!: Phaser.Physics.Arcade.Group;
  private starObjects = new Map<string, { star: Phaser.Physics.Arcade.Sprite; glow: Phaser.GameObjects.Image }>();
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private controls!: TouchControls;
  private hudStars!: Phaser.GameObjects.Text;
  private hudProgress!: Phaser.GameObjects.Text;
  private hint!: Phaser.GameObjects.Text;
  private portalPrompt!: Phaser.GameObjects.Text;
  private portalGlow!: Phaser.GameObjects.Image;
  private respawn = new Phaser.Math.Vector2(90, 600);
  private nextCheckpoint = 0;
  private lastGrounded = 0;
  private jumpBuffer = 0;
  private trailStars = 0;
  private portalWarned = false;
  private finishing = false;
  private returning = false;
  private portalZone!: Phaser.Geom.Rectangle;

  constructor() {
    super('StarTrailScene');
  }

  create(): void {
    this.save = SaveManager.load();
    this.save.area = 'trail';
    SaveManager.save(this.save);
    this.respawn.set(90, 600);
    this.nextCheckpoint = 0;
    this.trailStars = this.save.collectedStars.filter((id) => id.startsWith('trail-')).length;
    this.finishing = false;
    this.returning = false;
    this.portalWarned = false;
    this.starObjects.clear();

    this.physics.world.setBounds(0, 0, 2800, 1200);
    this.cameras.main.setBounds(0, 0, 2800, 800);
    this.cameras.main.setBackgroundColor('#2c4f63');
    this.cameras.main.fadeIn(420, 20, 35, 45);

    this.drawSky();
    this.buildPlatforms();
    this.buildDecor();
    this.buildHazards();
    this.buildCheckpoints();
    this.buildPortal();

    this.player = this.physics.add.sprite(90, 600, 'cristian-idle-0');
    this.player.setSize(16, 12).setOffset(12, 42);
    this.player.setMaxVelocity(260, 780);
    this.player.setGravityY(1300);
    this.player.setCollideWorldBounds(false);
    this.player.play('cristian-idle');
    this.physics.add.collider(this.player, this.platforms);

    this.buildStars();
    this.buildHud();

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.keys = this.input.keyboard!.addKeys('A,D,W,SPACE,ESC,M') as Record<string, Phaser.Input.Keyboard.Key>;
    this.input.keyboard?.on('keydown-ESC', () => this.returnToVillage());
    this.input.keyboard?.on('keydown-M', () => {
      const muted = AudioManager.toggleMute();
      this.hint.setText(muted ? 'Som desligado  •  toque em ♪ para voltar' : this.defaultHint());
    });

    this.controls = new TouchControls(
      this,
      'trail',
      () => undefined,
      () => this.returnToVillage(),
    );

    this.cameras.main.startFollow(this.player, true, 0.12, 0.1);
    this.cameras.main.setDeadzone(180, 120);

    this.add.particles(0, 0, 'pixel', {
      x: { min: 0, max: 2800 },
      y: { min: 40, max: 500 },
      lifespan: 7000,
      speedX: { min: -4, max: 4 },
      speedY: { min: -6, max: 2 },
      scale: { start: 0.5, end: 0 },
      alpha: { start: 0.6, end: 0 },
      frequency: 360,
      quantity: 1,
      blendMode: 'ADD',
      tint: [0xffdf7e, 0xa8d9dc, 0xffffff],
    }).setDepth(2);

    this.updateHud();
    AudioManager.playMusic('trail');
  }

  /* ─────────────────────────  CENÁRIO  ───────────────────────── */

  private drawSky(): void {
    const sky = this.add.graphics().setScrollFactor(0).setDepth(-40);
    const bands = [0x223d50, 0x2b4b60, 0x355a70, 0x416b7e, 0x517e8c, 0x668f97];
    bands.forEach((color, index) => {
      sky.fillStyle(color);
      sky.fillRect(0, index * 95, 960, 100);
    });
    sky.fillStyle(0x9fc8d2, 0.18);
    sky.fillRect(0, 470, 960, 70);

    this.add.circle(800, 96, 46, 0xfff3c4, 0.92).setScrollFactor(0).setDepth(-39);
    this.add.circle(780, 82, 42, 0x2b4b60, 1).setScrollFactor(0).setDepth(-39);

    for (let i = 0; i < 80; i++) {
      const x = Phaser.Math.Between(0, 960);
      const y = Phaser.Math.Between(0, 400);
      const star = this.add.rectangle(x, y, i % 9 === 0 ? 3 : 2, i % 9 === 0 ? 3 : 2, i % 4 === 0 ? 0xffdf7e : 0xd8ecf0, 0.8)
        .setScrollFactor(0).setDepth(-38);
      this.tweens.add({
        targets: star,
        alpha: { from: 0.15, to: 0.9 },
        duration: 1100 + (i % 11) * 180,
        yoyo: true,
        repeat: -1,
        delay: i * 40,
      });
    }

    // Montanhas distantes com parallax.
    const mountains = this.add.graphics().setScrollFactor(0.25).setDepth(-30);
    for (let i = 0; i < 8; i++) {
      const x = i * 420 - 100;
      mountains.fillStyle(i % 2 ? 0x2e5560 : 0x345e68, 0.8);
      mountains.fillTriangle(x, 430, x + 260, 190 + (i % 3) * 30, x + 520, 430);
      mountains.fillStyle(0x3f6b74, 0.5);
      mountains.fillTriangle(x + 200, 430, x + 300, 270, x + 430, 430);
    }
    mountains.fillStyle(0x25454f, 0.8);
    mountains.fillRect(-200, 410, 3400, 40);

    // Nuvens suaves.
    for (let i = 0; i < 6; i++) {
      const cloud = this.add.graphics().setScrollFactor(0.4).setDepth(-29).setAlpha(0.14);
      cloud.fillStyle(0xffffff);
      cloud.fillEllipse(i * 480 + 120, 160 + (i % 3) * 60, 220, 46);
      cloud.fillEllipse(i * 480 + 190, 144 + (i % 3) * 60, 150, 52);
    }
  }

  private buildPlatforms(): void {
    this.platforms = this.physics.add.staticGroup();
    PLATFORMS.forEach((def, index) => {
      const h = def.h ?? PLATFORM_H;
      const fill = def.upper ? 0x4c7a66 : 0x516f5c;
      const edge = def.upper ? 0x35574b : 0x3b5544;
      const rect = this.add.rectangle(def.x, def.y, def.w, h, fill).setStrokeStyle(3, edge);
      this.platforms.add(rect);
      const body = rect.body as Phaser.Physics.Arcade.StaticBody;
      body.setSize(def.w, h);
      body.updateFromGameObject();
      rect.setDepth(10);

      const top = this.add.rectangle(def.x, def.y - h / 2 + 4, def.w - 4, 7, 0x74a06f).setDepth(11);
      top.setAlpha(0.95);
      const highlight = this.add.rectangle(def.x, def.y - h / 2 + 8, def.w - 12, 2, 0x9ac785, 0.7).setDepth(11);
      highlight.setAlpha(0.7);

      // Trepadeiras e florzinhas penduradas.
      if (index % 2 === 0) {
        for (let i = 0; i < 3; i++) {
          const vx = def.x - def.w / 2 + 20 + i * (def.w / 4);
          this.add.rectangle(vx, def.y + h / 2 + 8, 2, 16, 0x3f6f45, 0.8).setDepth(9);
          this.add.rectangle(vx - 3, def.y + h / 2 + 14, 4, 2, 0x5d8c50, 0.8).setDepth(9);
        }
      }
      if (index % 3 === 0) {
        this.add.image(def.x - def.w / 3, def.y - h / 2 + 3, 'flower-pink').setOrigin(0.5, 1).setScale(0.7).setDepth(12);
        this.add.image(def.x + def.w / 4, def.y - h / 2 + 3, 'flower-yellow').setOrigin(0.5, 1).setScale(0.65).setDepth(12);
      }
    });
  }

  private buildDecor(): void {
    // Lanternas flutuantes e pedrinhas.
    for (let i = 0; i < 12; i++) {
      const x = 140 + i * 220;
      const y = 300 + Math.sin(i * 1.7) * 80;
      const lantern = this.add.image(x, y, 'lantern').setScale(0.8).setDepth(3).setAlpha(0.8);
      const glow = this.add.image(x, y - 30, 'glow-gold').setScale(0.55).setAlpha(0.28).setDepth(2).setBlendMode(Phaser.BlendModes.ADD);
      this.tweens.add({ targets: [lantern, glow], y: y - 10, duration: 2200 + i * 80, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      this.tweens.add({ targets: glow, alpha: 0.42, duration: 1300, yoyo: true, repeat: -1 });
    }
    // Estrelinhas decorativas no céu distante (sem colisão).
    for (let i = 0; i < 18; i++) {
      this.add.image(Phaser.Math.Between(0, 2800), Phaser.Math.Between(160, 460), 'sparkle')
        .setScale(0.5).setAlpha(0.22).setDepth(1);
    }
  }

  private buildHazards(): void {
    HAZARDS.forEach((hazard) => {
      const baseY = 660;
      const glow = this.add.image(hazard.x, baseY - 18, 'glow-pink').setScale(0.5).setAlpha(0.2).setDepth(13).setBlendMode(Phaser.BlendModes.ADD);
      this.tweens.add({ targets: glow, alpha: 0.4, duration: 800, yoyo: true, repeat: -1 });
      for (let i = 0; i < 4; i++) {
        const x = hazard.x - 26 + i * 16;
        const h = 24 + (i % 3) * 12;
        const crystal = this.add.graphics().setDepth(14);
        crystal.fillStyle(0x7d3f5c);
        crystal.fillTriangle(x - 9, baseY, x, baseY - h, x + 9, baseY);
        crystal.fillStyle(0xe08aa6);
        crystal.fillTriangle(x - 7, baseY - 2, x, baseY - h + 3, x + 7, baseY - 2);
        crystal.fillStyle(0xffc3d0);
        crystal.fillTriangle(x - 2, baseY - 5, x, baseY - h + 6, x + 3, baseY - 5);
      }
      this.add.text(hazard.x, baseY - 58, 'cuidado', {
        fontFamily: '"Nunito", sans-serif', fontSize: '10px', fontStyle: '800',
        color: '#ffc3d0', stroke: '#2a1f2a', strokeThickness: 3,
      }).setOrigin(0.5).setDepth(15).setAlpha(0.8);
    });
  }

  private buildCheckpoints(): void {
    CHECKPOINTS.forEach((checkpoint, index) => {
      const lantern = this.add.image(checkpoint.x, checkpoint.y, 'lantern').setOrigin(0.5, 1).setScale(1.05).setDepth(16);
      const glow = this.add.image(checkpoint.x, checkpoint.y - 40, 'glow-gold').setScale(0.7).setAlpha(0.28).setDepth(15).setBlendMode(Phaser.BlendModes.ADD);
      this.tweens.add({ targets: glow, alpha: 0.45, duration: 1300 + index * 200, yoyo: true, repeat: -1 });
      this.add.text(checkpoint.x, checkpoint.y - 64, '✓', {
        fontFamily: '"Nunito", sans-serif', fontSize: '12px', fontStyle: '900',
        color: '#203c35', backgroundColor: '#ffe9a8', padding: { x: 5, y: 2 },
      }).setOrigin(0.5).setDepth(17);
      void lantern;
    });
  }

  private buildPortal(): void {
    const portal = this.add.image(2640, 229, 'portal').setOrigin(0.5, 1).setDepth(18);
    this.portalGlow = this.add.image(2640, 160, 'glow-blue').setScale(2.2).setAlpha(0.4).setDepth(17).setBlendMode(Phaser.BlendModes.ADD);
    this.tweens.add({ targets: this.portalGlow, alpha: 0.65, scale: 2.45, duration: 1600, yoyo: true, repeat: -1 });
    this.tweens.add({ targets: portal, y: 225, duration: 2400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.portalPrompt = this.add.text(2640, 110, 'PORTAL DOS DESEJOS', {
      fontFamily: '"Nunito", sans-serif', fontSize: '13px', fontStyle: '900',
      color: '#fff4e2', stroke: '#203c35', strokeThickness: 5,
    }).setOrigin(0.5).setDepth(19);
    this.portalZone = new Phaser.Geom.Rectangle(2560, 120, 160, 130);
  }

  private buildStars(): void {
    this.starsGroup = this.physics.add.group({ allowGravity: false, immovable: true });
    STARS.forEach((def) => {
      if (this.save.collectedStars.includes(def.id)) return;
      const glow = this.add.image(def.x, def.y, 'glow-gold').setScale(0.55).setAlpha(0.35).setDepth(12).setBlendMode(Phaser.BlendModes.ADD);
      const star = this.starsGroup.create(def.x, def.y, 'star') as Phaser.Physics.Arcade.Sprite;
      star.setDepth(13).setData('starId', def.id);
      this.tweens.add({ targets: [star, glow], y: def.y - 7, duration: 1000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      this.tweens.add({ targets: glow, alpha: 0.18, duration: 1100, yoyo: true, repeat: -1 });
      this.starObjects.set(def.id, { star, glow });
    });

    this.physics.add.overlap(this.player, this.starsGroup, (_player, object) => {
      if (this.finishing || this.returning) return;
      const star = object as Phaser.Physics.Arcade.Sprite;
      const id = star.getData('starId') as string;
      const x = star.x;
      const y = star.y;
      this.starObjects.get(id)?.glow.destroy();
      this.starObjects.delete(id);
      star.destroy();
      if (!this.save.collectedStars.includes(id)) {
        this.save.collectedStars.push(id);
        this.save.stars += 1;
        this.trailStars += 1;
        SaveManager.save(this.save);
      }
      AudioManager.sfx('star');
      this.burst(x, y);
      this.floatingText(x, y - 18, '+1 ★', '#ffe9a8');
      this.updateHud();
      if (this.trailStars === 6) {
        this.showToast('O portal despertou!', 'Seis estrelas já iluminam o caminho.');
        this.portalPrompt.setText('PORTAL DOS DESEJOS  ·  ABERTO');
        AudioManager.sfx('quest');
      }
    });
  }

  /* ─────────────────────────  HUD  ───────────────────────── */

  private buildHud(): void {
    const depth = 900;
    addPanel(this, 14, 14, 370, 78, { radius: 14 }).setScrollFactor(0).setDepth(depth);
    this.add.text(30, 24, 'TRILHA DAS ESTRELAS', textStyle(18, CSS.ink, { fontStyle: '900' }))
      .setScrollFactor(0).setDepth(depth + 1);
    this.hudStars = this.add.text(30, 50, '', textStyle(13, '#6a5560', { fontStyle: '800' }))
      .setScrollFactor(0).setDepth(depth + 1);
    this.hudProgress = this.add.text(366, 51, '', textStyle(11, '#8a5566', { fontStyle: '800' }))
      .setOrigin(1, 0).setScrollFactor(0).setDepth(depth + 1);

    const back = this.add.text(946, 26, '↩ vila', {
      fontFamily: '"Nunito", sans-serif', fontSize: '13px', fontStyle: '900',
      color: '#3b3038', backgroundColor: '#fff4e2', padding: { x: 12, y: 8 },
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(depth + 1).setInteractive({ useHandCursor: true });
    back.on('pointerdown', () => this.returnToVillage());

    const mute = this.add.text(946, 64, '♪ som', {
      fontFamily: '"Nunito", sans-serif', fontSize: '11px', fontStyle: '800',
      color: '#3b3038', backgroundColor: '#fff4e2', padding: { x: 10, y: 5 },
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(depth + 1).setInteractive({ useHandCursor: true });
    mute.on('pointerdown', () => {
      const muted = AudioManager.toggleMute();
      mute.setText(muted ? '✕ som' : '♪ som');
      this.hint.setText(muted ? 'Som desligado  •  a trilha continua em silêncio' : this.defaultHint());
    });

    this.hint = this.add.text(480, 506, this.defaultHint(), {
      fontFamily: '"Nunito", sans-serif', fontSize: '12px', fontStyle: '700',
      color: '#fff4e2', backgroundColor: '#203c35cc', padding: { x: 16, y: 7 },
    }).setOrigin(0.5).setScrollFactor(0).setDepth(depth + 1).setAlpha(0.96);

    this.updateHud();
  }

  private defaultHint(): string {
    return 'A/D ou setas: correr  •  Espaço/W: pular  •  colete 6 estrelas para abrir o portal';
  }

  private updateHud(): void {
    const needed = Math.max(0, 6 - this.trailStars);
    this.hudStars.setText(`★ ${this.trailStars}/${STAR_TRAIL_TOTAL} estrelas da trilha`);
    this.hudProgress.setText(needed > 0 ? `faltam ${needed} para o portal` : 'portal aberto ✦');
  }

  /* ─────────────────────────  LOOP  ───────────────────────── */

  update(time: number, delta: number): void {
    if (!this.player || this.finishing || this.returning) return;
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    const onGround = body.blocked.down || body.touching.down;
    if (onGround) this.lastGrounded = time;

    const left = this.cursors.left.isDown || this.keys.A.isDown || this.controls.leftHeld;
    const right = this.cursors.right.isDown || this.keys.D.isDown || this.controls.rightHeld;
    const vx = (right ? 1 : 0) - (left ? 1 : 0);
    this.player.setVelocityX(vx * 235);
    if (vx !== 0) this.player.setFlipX(vx < 0);

    const jumpPressed = Phaser.Input.Keyboard.JustDown(this.keys.SPACE)
      || Phaser.Input.Keyboard.JustDown(this.keys.W)
      || Phaser.Input.Keyboard.JustDown(this.cursors.up)
      || this.controls.consumeJump();
    if (jumpPressed) this.jumpBuffer = 120;
    this.jumpBuffer = Math.max(0, this.jumpBuffer - delta);

    if (this.jumpBuffer > 0 && time - this.lastGrounded < 110) {
      this.player.setVelocityY(-470);
      this.jumpBuffer = 0;
      this.lastGrounded = -999;
      AudioManager.sfx('jump');
      this.jumpPuff();
    }

    const jumpHeld = this.keys.SPACE.isDown || this.keys.W.isDown || this.cursors.up.isDown || this.controls.jumpHeld;
    if (!jumpHeld && body.velocity.y < -190) {
      this.player.setVelocityY(-190);
    }

    if (onGround) {
      if (vx !== 0) this.player.play('cristian-walk', true);
      else this.player.play('cristian-idle', true);
    } else {
      this.player.play('cristian-jump', true);
    }

    if (this.player.x < 20) {
      this.player.setX(20);
      if (this.player.body) (this.player.body as Phaser.Physics.Arcade.Body).velocity.x = 0;
    }

    this.checkpointCheck();
    this.hazardCheck();
    this.portalCheck();
    this.hintCheck();

    if (this.player.y > 840) this.fall();
  }

  private checkpointCheck(): void {
    if (this.nextCheckpoint >= CHECKPOINTS.length) return;
    const cp = CHECKPOINTS[this.nextCheckpoint];
    if (this.player.x < cp.x) return;
    const groundTop = 660;
    this.respawn.set(cp.x, groundTop - 70);
    this.nextCheckpoint += 1;
    this.showToast('Checkpoint!', 'Se você cair daqui em diante, volta para cá.');
    AudioManager.sfx('item');
    this.burst(cp.x, cp.y - 40);
  }

  private hazardCheck(): void {
    if (this.player.y < 560) return;
    const px = this.player.x;
    for (const hazard of HAZARDS) {
      if (Math.abs(px - hazard.x) < hazard.w / 2 + 12) {
        this.respawnPlayer('Os cristais te empurraram de volta!', true);
        return;
      }
    }
  }

  private portalCheck(): void {
    const px = this.player.x;
    const py = this.player.y;
    const nearPortal = Phaser.Geom.Rectangle.Contains(this.portalZone, px, py);
    if (nearPortal) {
      if (this.trailStars >= 6) {
        this.finishing = true;
        this.controls.setEnabled(false);
        this.player.setVelocity(0, 0);
        this.cameras.main.fadeOut(900, 25, 20, 40);
        SaveManager.save(this.save);
        this.time.delayedCall(950, () => this.scene.start('FinaleScene'));
        return;
      }
      if (!this.portalWarned) {
        this.portalWarned = true;
        this.showToast('O portal ainda dorme...', `Faltam ${6 - this.trailStars} estrelas da trilha.`);
        AudioManager.sfx('locked');
      }
    } else {
      this.portalWarned = false;
    }

    if (nearPortal || (px > 2460 && py < 330)) {
      this.portalPrompt.setText(this.trailStars >= 6
        ? 'PORTAL DOS DESEJOS  ·  ABERTO ✦'
        : `PORTAL DOS DESEJOS  ·  ${this.trailStars}/6 estrelas`);
    }
  }

  private hintCheck(): void {
    if (this.player.x > 2440) {
      const cx = this.player.x;
      if (this.trailStars >= 6) {
        this.hint.setText('Entre no portal para encontrar o que você procura...');
      } else {
        this.hint.setText(`O portal precisa de 6 estrelas da trilha (${this.trailStars}/6). Explore os caminhos altos!`);
      }
      this.hint.setX(480);
      void cx;
    } else if (this.hint.text !== this.defaultHint() && !this.hint.text.startsWith('O portal')) {
      this.hint.setText(this.defaultHint());
    }
  }

  private fall(): void {
    this.respawnPlayer('Uops! A trilha te trouxe de volta.', false);
  }

  private respawnPlayer(message: string, shake: boolean): void {
    if (this.finishing || this.returning) return;
    AudioManager.sfx('fall');
    if (shake) this.cameras.main.shake(180, 0.008);
    this.player.setPosition(this.respawn.x, this.respawn.y);
    this.player.setVelocity(0, 0);
    this.player.play('cristian-idle', true);
    this.showToast('De volta ao caminho', message);
  }

  /* ─────────────────────────  SAÍDA / EFEITOS  ───────────────────────── */

  private returnToVillage(): void {
    if (this.returning || this.finishing) return;
    this.returning = true;
    this.controls.setEnabled(false);
    this.save.area = 'village';
    SaveManager.save(this.save);
    this.cameras.main.fadeOut(350, 23, 44, 40);
    this.time.delayedCall(370, () => this.scene.start('AdventureScene', { area: 'village', spawn: 'fromTrail' }));
  }

  private showToast(title: string, body: string): void {
    const container = this.add.container(480, 120).setScrollFactor(0).setDepth(1200).setAlpha(0);
    const bg = this.add.graphics();
    bg.fillStyle(UI.green, 0.95);
    bg.fillRoundedRect(-220, -30, 440, 62, 14);
    bg.lineStyle(2, UI.pink, 0.8);
    bg.strokeRoundedRect(-220, -30, 440, 62, 14);
    const t = this.add.text(0, -12, title, textStyle(15, CSS.cream, { fontStyle: '900' })).setOrigin(0.5);
    const b = this.add.text(0, 10, body, textStyle(11, '#e6d9c4', { fontStyle: '600' })).setOrigin(0.5);
    container.add([bg, t, b]);
    this.tweens.add({ targets: container, alpha: 1, y: 104, duration: 240, ease: 'Back.easeOut' });
    this.tweens.add({ targets: container, alpha: 0, y: 92, delay: 2300, duration: 400, onComplete: () => container.destroy(true) });
  }

  private jumpPuff(): void {
    const puff = this.add.ellipse(this.player.x, this.player.y + 26, 18, 7, 0xdfe8ee, 0.3).setDepth(16);
    this.tweens.add({ targets: puff, alpha: 0, scaleX: 1.7, scaleY: 1.7, duration: 350, onComplete: () => puff.destroy() });
  }

  private burst(x: number, y: number): void {
    const emitter = this.add.particles(x, y, 'sparkle', {
      speed: { min: 30, max: 110 },
      angle: { min: 0, max: 360 },
      lifespan: { min: 280, max: 620 },
      scale: { start: 0.9, end: 0 },
      alpha: { start: 1, end: 0 },
      quantity: 1,
      emitting: false,
      blendMode: 'ADD',
      tint: [0xffdf7e, 0xfff3bd, 0xa8d9dc],
    }).setDepth(1200);
    emitter.explode(12);
    this.time.delayedCall(850, () => emitter.destroy());
  }

  private floatingText(x: number, y: number, text: string, color: string): void {
    const label = this.add.text(x, y, text, {
      fontFamily: '"Nunito", sans-serif', fontSize: '13px', fontStyle: '900',
      color, stroke: '#203c35', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(1200);
    this.tweens.add({ targets: label, y: y - 32, alpha: 0, duration: 950, ease: 'Sine.easeOut', onComplete: () => label.destroy() });
  }
}
