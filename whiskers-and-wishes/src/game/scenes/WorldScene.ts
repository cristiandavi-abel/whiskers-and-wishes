import Phaser from 'phaser';
import { makePixelHero, makeCat, makeStar, makeFlower } from '../entities/SpriteFactory';
import { SaveManager, SaveData } from '../systems/SaveManager';

type CatInfo = { id: string; x: number; y: number; name: string; line: string; key: string };

export class WorldScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private cats!: Phaser.Physics.Arcade.StaticGroup;
  private stars!: Phaser.Physics.Arcade.Group;
  private hud!: Phaser.GameObjects.Text;
  private hint!: Phaser.GameObjects.Text;
  private dialogue!: Phaser.GameObjects.Container;
  private dialogueText!: Phaser.GameObjects.Text;
  private save!: SaveData;
  private interacting = false;
  private mobileDirection = { x: 0, y: 0 };
  private touchMove?: { x: number; y: number };

  constructor() { super('WorldScene'); }

  create(): void {
    this.save = SaveManager.load();
    makePixelHero(this, 'hero', 0x3474ad, 0x3c2c2a, false);
    makePixelHero(this, 'hero-glasses', 0x282832, 0x35272b, true);
    makeCat(this, 'cat-cream', 0xf1e6d5, 0xe8a8b7);
    makeCat(this, 'cat-orange', 0xe79a52, 0xffd27b);
    makeCat(this, 'cat-gray', 0x8b8c9b, 0xc8b8dd);
    makeStar(this, 'star');
    makeFlower(this, 'flower');

    this.physics.world.setBounds(0, 0, 1800, 1100);
    this.drawWorld();

    this.player = this.physics.add.sprite(175, 190, 'hero').setDepth(10);
    this.player.setCollideWorldBounds(true);
    this.player.setSize(18, 24).setOffset(7, 17);
    this.physics.add.collider(this.player, this.obstacles);

    this.cats = this.physics.add.staticGroup();
    const catData: CatInfo[] = [
      { id: 'mochi', x: 385, y: 285, name: 'Mochi', line: 'Miau... eu estava tirando uma soneca! Quer brincar?', key: 'cat-cream' },
      { id: 'pipoca', x: 780, y: 520, name: 'Pipoca', line: 'Miau! Aposto que tem uma estrelinha escondida por aqui.', key: 'cat-orange' },
      { id: 'nuvem', x: 1360, y: 300, name: 'Nuvem', line: 'Pronto para uma aventura? Explore cada cantinho!', key: 'cat-gray' },
    ];
    catData.forEach((cat) => {
      const sprite = this.cats.create(cat.x, cat.y, cat.key) as Phaser.Physics.Arcade.Sprite;
      sprite.setData('catInfo', cat).setDepth(8);
      if (this.save.catsFound.includes(cat.id)) sprite.setTint(0xb8e6a5);
    });

    this.stars = this.physics.add.group({ allowGravity: false, immovable: true });
    const starPositions = [[270, 170], [535, 430], [690, 200], [1015, 365], [1210, 610], [1530, 470]];
    starPositions.forEach(([x, y], index) => {
      if (this.save.stars >= index + 1) return;
      const star = this.stars.create(x, y, 'star') as Phaser.Physics.Arcade.Sprite;
      star.setDepth(5).setData('starIndex', index);
      this.tweens.add({ targets: star, y: y - 7, duration: 900 + index * 70, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    });
    this.physics.add.overlap(this.player, this.stars, (_player, object) => {
      const star = object as Phaser.Physics.Arcade.Sprite;
      star.destroy();
      this.save.stars += 1;
      SaveManager.save(this.save);
      this.updateHud();
      this.showMessage('Uma estrelinha! ✨', 'Você encontrou um pedacinho de magia.');
    });

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.keys = this.input.keyboard!.addKeys('W,A,S,D,E,P,ESC') as Record<string, Phaser.Input.Keyboard.Key>;

    this.hud = this.add.text(18, 16, '', {
      fontFamily: 'Nunito, sans-serif', fontSize: '16px', fontStyle: '800',
      color: '#fff4df', backgroundColor: '#203c35dd', padding: { x: 12, y: 8 },
    }).setScrollFactor(0).setDepth(100);
    this.hint = this.add.text(480, 500, 'Explore o jardim • Aproxime-se dos gatinhos e aperte E', {
      fontFamily: 'Nunito, sans-serif', fontSize: '14px', color: '#fff4df',
      backgroundColor: '#203c35cc', padding: { x: 10, y: 6 },
    }).setOrigin(0.5).setScrollFactor(0).setDepth(100);
    this.dialogue = this.add.container(480, 440).setScrollFactor(0).setDepth(120).setVisible(false);
    const panel = this.add.rectangle(0, 0, 600, 88, 0xfff0d8, 0.98).setStrokeStyle(4, 0x7c5361);
    this.dialogueText = this.add.text(-275, -23, '', {
      fontFamily: 'Nunito, sans-serif', fontSize: '17px', color: '#3d3540',
      wordWrap: { width: 545 }, lineSpacing: 4,
    });
    this.dialogue.add([panel, this.dialogueText]);
    this.updateHud();

    this.cameras.main.setBounds(0, 0, 1800, 1100);
    this.cameras.main.startFollow(this.player, true, 0.09, 0.09);
    this.createMobileControls();
    this.input.keyboard?.on('keydown-E', () => this.interact());
    this.input.keyboard?.on('keydown-ESC', () => this.togglePause());
    this.input.keyboard?.on('keydown-P', () => this.scene.start('PlatformScene'));
    this.input.keyboard?.on('keydown-SPACE', () => this.scene.start('PlatformScene'));
  }

  private obstacles!: Phaser.Physics.Arcade.StaticGroup;

  private drawWorld(): void {
    const bg = this.add.graphics().setDepth(0);
    bg.fillStyle(0x79a96a); bg.fillRect(0, 0, 1800, 1100);
    // Caminhos de terra e pequenas clareiras.
    bg.fillStyle(0xd8b987); bg.fillRect(0, 350, 1800, 82); bg.fillRect(440, 0, 95, 1100);
    bg.fillEllipse(900, 350, 390, 220); bg.fillEllipse(1320, 760, 520, 270);
    // Poça / lago decorativo.
    bg.fillStyle(0x6aaeb2); bg.fillEllipse(1430, 170, 270, 150);
    bg.lineStyle(5, 0x9ad5cf, 0.7); bg.strokeEllipse(1430, 170, 240, 125);
    for (let i = 0; i < 190; i++) {
      const x = Phaser.Math.Between(12, 1780), y = Phaser.Math.Between(12, 1080);
      const color = [0x5c9459, 0x8cbd75, 0xf3d9a3, 0xf4a9ba][i % 4];
      bg.fillStyle(color, i % 4 > 1 ? 0.9 : 0.7);
      bg.fillRect(x, y, i % 6 === 0 ? 5 : 3, i % 6 === 0 ? 5 : 3);
    }
    // Árvores decorativas.
    this.obstacles = this.physics.add.staticGroup();
    for (let i = 0; i < 52; i++) {
      const x = Phaser.Math.Between(45, 1750), y = Phaser.Math.Between(45, 1050);
      if ((x < 260 && y < 270) || (x > 1300 && y < 250) || (y > 320 && y < 430)) continue;
      const trunk = this.add.rectangle(x, y + 13, 12, 22, 0x80543e).setDepth(2);
      const leaves = this.add.circle(x, y - 4, Phaser.Math.Between(19, 27), i % 2 ? 0x3f784b : 0x4e8950).setDepth(3);
      this.add.circle(x - 8, y - 11, 10, 0x75a95f).setDepth(3);
      const blocker = this.add.rectangle(x, y + 15, 24, 25, 0x000000, 0).setVisible(false);
      this.obstacles.add(blocker);
      trunk.setAlpha(0.9); leaves.setStrokeStyle(2, 0x326441, 0.8);
    }
    // Casa aconchegante.
    const house = this.add.graphics().setDepth(4);
    house.fillStyle(0xf0d4a3); house.fillRect(1030, 115, 170, 115);
    house.fillStyle(0x8b4d4d); house.fillTriangle(1005, 125, 1115, 35, 1225, 125);
    house.fillStyle(0x4d393c); house.fillRect(1095, 170, 35, 60);
    house.fillStyle(0x8bc5cb); house.fillRect(1050, 145, 26, 25); house.fillRect(1150, 145, 26, 25);
    this.add.text(1115, 248, 'Vila Aconchegante', { fontFamily: 'Nunito', fontSize: '15px', color: '#fff4df', stroke: '#31503b', strokeThickness: 4 }).setOrigin(0.5).setDepth(5);
    // Flores.
    for (let i = 0; i < 24; i++) {
      const x = Phaser.Math.Between(70, 1700), y = Phaser.Math.Between(60, 1030);
      const f = this.add.image(x, y, 'flower').setDepth(4).setScale(0.7 + Math.random() * 0.4);
      if (i % 3 === 0) this.tweens.add({ targets: f, angle: { from: -8, to: 8 }, duration: 1100 + i * 20, yoyo: true, repeat: -1 });
    }
  }

  private createMobileControls(): void {
    const joystick = this.add.circle(95, 430, 53, 0x203c35, 0.45).setStrokeStyle(3, 0xfff0d8, 0.7).setScrollFactor(0).setDepth(110);
    const knob = this.add.circle(95, 430, 23, 0xfff0d8, 0.7).setScrollFactor(0).setDepth(111);
    joystick.setInteractive();
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (p.x < 190 && p.y > 330) { this.touchMove = { x: p.x, y: p.y }; this.updateTouch(p, knob); }
      else if (p.x > 770 && p.y > 385) {
        if (p.x > 870) this.interact();
        else this.scene.start('PlatformScene');
      }
    });
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => { if (p.isDown && this.touchMove) this.updateTouch(p, knob); });
    this.input.on('pointerup', () => { this.touchMove = undefined; this.mobileDirection = { x: 0, y: 0 }; knob.setPosition(95, 430); });
    this.add.text(95, 493, 'MOVER', { fontFamily: 'Nunito', fontSize: '11px', color: '#fff4df' }).setOrigin(0.5).setScrollFactor(0).setDepth(111);
    this.add.circle(820, 440, 31, 0xf6c6cf, 0.9).setStrokeStyle(3, 0x7c5361).setScrollFactor(0).setDepth(110);
    this.add.text(820, 440, 'P', { fontFamily: 'Nunito', fontSize: '20px', fontStyle: '900', color: '#3d3540' }).setOrigin(0.5).setScrollFactor(0).setDepth(111);
    this.add.circle(900, 440, 31, 0xffdf7e, 0.9).setStrokeStyle(3, 0x7c5361).setScrollFactor(0).setDepth(110);
    this.add.text(900, 440, 'E', { fontFamily: 'Nunito', fontSize: '20px', fontStyle: '900', color: '#3d3540' }).setOrigin(0.5).setScrollFactor(0).setDepth(111);
  }

  private updateTouch(p: Phaser.Input.Pointer, knob: Phaser.GameObjects.Arc): void {
    const dx = p.x - 95, dy = p.y - 430, len = Math.max(1, Math.hypot(dx, dy));
    const scale = Math.min(1, 40 / len);
    knob.setPosition(95 + dx * scale, 430 + dy * scale);
    this.mobileDirection = { x: dx / len, y: dy / len };
  }

  private interact(): void {
    if (this.dialogue.visible) { this.dialogue.setVisible(false); this.interacting = false; return; }
    let nearest: Phaser.Physics.Arcade.Sprite | null = null;
    let best = 75;
    this.cats.getChildren().forEach((obj) => {
      const cat = obj as Phaser.Physics.Arcade.Sprite;
      const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, cat.x, cat.y);
      if (d < best) { best = d; nearest = cat; }
    });
    if (nearest) {
      const cat = nearest as Phaser.Physics.Arcade.Sprite;
      const info = cat.getData('catInfo') as CatInfo;
      if (!this.save.catsFound.includes(info.id)) this.save.catsFound.push(info.id);
      SaveManager.save(this.save);
      this.showMessage(`${info.name} 🐾`, info.line);
      cat.setTint(0xc6edb5);
      this.updateHud();
      return;
    }
    this.showMessage('Um mundo cheio de segredos', 'Explore o jardim, colete estrelinhas e encontre os três gatinhos. Aperte P para visitar uma área de plataforma!');
  }

  private showMessage(title: string, body: string): void {
    this.dialogueText.setText(`${title}\n${body}\n\n(E para fechar)`);
    this.dialogue.setVisible(true);
  }

  private updateHud(): void {
    if (this.hud) this.hud.setText(`🌟 ${this.save.stars}   🐈 ${this.save.catsFound.length}/3   🌿 Jardim dos Gatinhos`);
  }

  private togglePause(): void {
    if (this.dialogue.visible) { this.dialogue.setVisible(false); return; }
    const panel = this.add.container(480, 270).setScrollFactor(0).setDepth(200);
    const box = this.add.rectangle(0, 0, 340, 170, 0xfff0d8).setStrokeStyle(4, 0x7c5361);
    const title = this.add.text(0, -48, 'Pausa da aventura', { fontFamily: 'Nunito', fontSize: '24px', fontStyle: '900', color: '#3d3540' }).setOrigin(0.5);
    const resume = this.add.text(0, 4, 'Continuar', { fontFamily: 'Nunito', fontSize: '18px', fontStyle: '800', color: '#3d3540', backgroundColor: '#f6c6cf', padding: { x: 18, y: 7 } }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    const menu = this.add.text(0, 54, 'Voltar ao menu', { fontFamily: 'Nunito', fontSize: '16px', color: '#3d3540' }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    panel.add([box, title, resume, menu]);
    resume.on('pointerdown', () => panel.destroy());
    menu.on('pointerdown', () => { panel.destroy(); this.scene.start('MenuScene'); });
  }

  update(): void {
    if (!this.player || this.dialogue?.visible) return;
    const speed = 165;
    const left = this.cursors.left.isDown || this.keys.A.isDown;
    const right = this.cursors.right.isDown || this.keys.D.isDown;
    const up = this.cursors.up.isDown || this.keys.W.isDown;
    const down = this.cursors.down.isDown || this.keys.S.isDown;
    let vx = (right ? 1 : 0) - (left ? 1 : 0) + this.mobileDirection.x;
    let vy = (down ? 1 : 0) - (up ? 1 : 0) + this.mobileDirection.y;
    const length = Math.hypot(vx, vy);
    if (length > 1) { vx /= length; vy /= length; }
    this.player.setVelocity(vx * speed, vy * speed);
    if (Math.abs(vx) > 0.1) this.player.setFlipX(vx < 0);
  }
}
