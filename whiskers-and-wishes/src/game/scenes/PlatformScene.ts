import Phaser from 'phaser';
import { makePixelHero, makeStar } from '../entities/SpriteFactory';
import { SaveManager } from '../systems/SaveManager';

export class PlatformScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private stars!: Phaser.Physics.Arcade.Group;
  private touchLeft = false;
  private touchRight = false;
  private touchJump = false;

  constructor() { super('PlatformScene'); }

  create(): void {
    makePixelHero(this, 'platform-hero', 0x3474ad, 0x3c2c2a);
    makeStar(this, 'platform-star');
    this.physics.world.setBounds(0, 0, 1700, 540);
    this.cameras.main.setBackgroundColor('#7a9fba');

    const sky = this.add.graphics();
    sky.fillStyle(0x9fc8d2); sky.fillRect(0, 0, 1700, 540);
    sky.fillStyle(0xf4d6a3); sky.fillCircle(1380, 90, 42);
    for (let i = 0; i < 9; i++) {
      const x = i * 210;
      sky.fillStyle(i % 2 ? 0x6b9a88 : 0x7ba88c);
      sky.fillTriangle(x, 390, x + 115, 160 + (i % 3) * 25, x + 230, 390);
    }

    const platforms = this.physics.add.staticGroup();
    const makePlatform = (x: number, y: number, w: number, h: number, color = 0x527c59) => {
      const rect = this.add.rectangle(x, y, w, h, color).setStrokeStyle(3, 0x385d48);
      platforms.add(rect);
      (rect.body as Phaser.Physics.Arcade.StaticBody).setSize(w, h).updateFromGameObject();
    };
    makePlatform(850, 520, 1700, 50, 0x7b654d);
    makePlatform(300, 420, 170, 24); makePlatform(535, 350, 150, 24);
    makePlatform(780, 285, 160, 24); makePlatform(1030, 350, 150, 24);
    makePlatform(1280, 280, 170, 24); makePlatform(1510, 210, 140, 24);

    this.player = this.physics.add.sprite(70, 440, 'platform-hero');
    this.player.setCollideWorldBounds(true).setBounce(0);
    this.player.setSize(18, 24).setOffset(7, 17);
    this.player.setMaxVelocity(230, 650);
    this.player.setGravityY(850);
    this.physics.add.collider(this.player, platforms);

    this.stars = this.physics.add.group({ allowGravity: false, immovable: true });
    [[300, 380], [535, 310], [780, 245], [1030, 310], [1280, 240], [1510, 170]].forEach(([x, y]) => {
      const s = this.stars.create(x, y, 'platform-star') as Phaser.Physics.Arcade.Sprite;
      s.setDepth(5);
    });
    this.physics.add.overlap(this.player, this.stars, (_p, object) => {
      object.destroy();
      const data = SaveManager.load(); data.stars += 1; SaveManager.save(data);
    });

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.keys = this.input.keyboard!.addKeys('A,D,SPACE,ESC') as Record<string, Phaser.Input.Keyboard.Key>;
    this.cameras.main.setBounds(0, 0, 1700, 540).startFollow(this.player, true, 0.1, 0.1);
    this.add.text(20, 18, 'TRILHA DAS ESTRELAS', { fontFamily: 'Nunito', fontSize: '21px', fontStyle: '900', color: '#fff4df', stroke: '#385d48', strokeThickness: 5 }).setScrollFactor(0).setDepth(20);
    this.add.text(20, 49, 'A/D ou setas: mover  •  Espaço/W/↑: pular  •  ESC: voltar', { fontFamily: 'Nunito', fontSize: '13px', color: '#fff4df', stroke: '#385d48', strokeThickness: 3 }).setScrollFactor(0).setDepth(20);
    this.add.text(870, 80, 'Colete as estrelas!', { fontFamily: 'Nunito', fontSize: '18px', fontStyle: '800', color: '#fff4df', stroke: '#385d48', strokeThickness: 4 }).setOrigin(0.5).setScrollFactor(0).setDepth(20);
    this.makeMobileButton(790, 450, '◀', () => { this.touchLeft = true; }, () => { this.touchLeft = false; });
    this.makeMobileButton(865, 450, '▶', () => { this.touchRight = true; }, () => { this.touchRight = false; });
    this.makeMobileButton(910, 375, '↑', () => { this.touchJump = true; }, () => { this.touchJump = false; });
    this.input.keyboard?.on('keydown-ESC', () => this.scene.start('WorldScene'));
  }

  private makeMobileButton(x: number, y: number, label: string, down: () => void, up: () => void): void {
    const circle = this.add.circle(x, y, 27, 0xfff0d8, 0.72).setStrokeStyle(3, 0x7c5361).setScrollFactor(0).setDepth(30).setInteractive();
    this.add.text(x, y, label, { fontFamily: 'Nunito', fontSize: '22px', fontStyle: '900', color: '#3d3540' }).setOrigin(0.5).setScrollFactor(0).setDepth(31);
    circle.on('pointerdown', down);
    circle.on('pointerup', up);
    circle.on('pointerout', up);
  }

  update(): void {
    const left = this.cursors.left.isDown || this.keys.A.isDown || this.touchLeft;
    const right = this.cursors.right.isDown || this.keys.D.isDown || this.touchRight;
    this.player.setVelocityX(((right ? 1 : 0) - (left ? 1 : 0)) * 210);
    const jump = this.cursors.up.isDown || this.cursors.space.isDown || this.keys.SPACE.isDown || this.touchJump;
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    if (jump && body.blocked.down) this.player.setVelocityY(-390);
    if (this.player.y > 600) { this.player.setPosition(70, 440); this.player.setVelocity(0, 0); }
    if (this.player.x > 1650) this.scene.start('WorldScene');
    if (this.player.x < 15 && this.player.y < 490) this.player.setX(15);
  }
}
