import Phaser from 'phaser';
import {
  AREAS,
  AREA_NAME_BY_SAVE,
  AREA_PROGRESS,
  CAT_TOTAL,
  ITEM_LABELS,
  QUESTS,
  type AreaDef,
  type CatDef,
  type ExitDef,
  type InteractableDef,
  type ItemDef,
  type NpcDef,
  type QuestDef,
  type SecretDef,
  type TopAreaId,
} from '../../data/worldData';
import {
  addOnce,
  hasFlag,
  hasItem,
  questIsActive,
  questIsDone,
  SaveManager,
  type SaveData,
} from '../systems/SaveManager';
import { AudioManager } from '../systems/AudioManager';
import { DialogueBox, type DialoguePage } from '../ui/DialogueBox';
import { Hud } from '../ui/Hud';
import { TouchControls } from '../ui/TouchControls';
import { addPanel, CSS, textStyle, UI } from '../ui/Theme';
import { PERSONALIZATION } from '../../config/personalization';

type AdventureData = { area?: string; spawn?: string };

type CatRuntime = {
  def: CatDef;
  sprite: Phaser.GameObjects.Sprite;
  label: Phaser.GameObjects.Text;
  heart?: Phaser.GameObjects.Image;
};

type NpcRuntime = {
  def: NpcDef;
  sprite: Phaser.GameObjects.Sprite;
  label: Phaser.GameObjects.Text;
};

type ItemRuntime = {
  def: ItemDef;
  sprite: Phaser.GameObjects.Image;
  glow: Phaser.GameObjects.Image;
};

type ExitRuntime = {
  def: ExitDef;
  marker: Phaser.GameObjects.Text;
  glow: Phaser.GameObjects.Image;
  cx: number;
  cy: number;
};

type SecretRuntime = {
  def: SecretDef;
  sparkle: Phaser.GameObjects.Image;
  glow: Phaser.GameObjects.Image;
};

type InteractableRuntime = {
  def: InteractableDef;
  sparkle?: Phaser.GameObjects.Image;
};

type Nearby =
  | { kind: 'cat'; dist: number; cat: CatRuntime; markerX: number; markerY: number }
  | { kind: 'npc'; dist: number; npc: NpcRuntime; markerX: number; markerY: number }
  | { kind: 'exit'; dist: number; exit: ExitRuntime; markerX: number; markerY: number }
  | { kind: 'secret'; dist: number; secret: SecretRuntime; markerX: number; markerY: number }
  | { kind: 'interactable'; dist: number; interactable: InteractableRuntime; markerX: number; markerY: number };

const FLAVOR: Record<TopAreaId, string[]> = {
  garden: [
    'As flores daqui parecem sorrir quando você passa. Ou é impressão minha?',
    'Talvez eu devesse conversar com os gatinhos. Eles parecem saber de tudo.',
    'O lago reflete o céu como um espelho. Um peixinho de brinquedo não estaria perdido por aqui, né?',
  ],
  forest: [
    'Os vaga-lumes estão dançando. Será que eles também estão procurando alguém?',
    'Essa floresta parece guardar segredos em cada canto. Melhor olhar com calma.',
    'Ouvir o vento nas árvores é quase como ouvir uma canção de ninar.',
  ],
  village: [
    'Cheiro de pão quentinho. Será que alguém aqui vende um?',
    'A vila inteira parece ter sido feita para caber um abraço.',
    'Os sinos estão quietos. Talvez o festival esteja esperando alguma coisa.',
  ],
};

export class AdventureScene extends Phaser.Scene {
  private area!: AreaDef;
  private areaId!: TopAreaId;
  private save!: SaveData;
  private pendingArea?: string;
  private pendingSpawn?: string;

  private player!: Phaser.Physics.Arcade.Sprite;
  private playerShadow!: Phaser.GameObjects.Ellipse;
  private solids!: Phaser.Physics.Arcade.StaticGroup;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;

  private cats: CatRuntime[] = [];
  private npcs: NpcRuntime[] = [];
  private items: ItemRuntime[] = [];
  private exits: ExitRuntime[] = [];
  private secrets: SecretRuntime[] = [];
  private interactables: InteractableRuntime[] = [];
  private starObjects = new Map<string, { star: Phaser.Physics.Arcade.Sprite; glow: Phaser.GameObjects.Image }>();
  private starsGroup!: Phaser.Physics.Arcade.Group;

  private hud!: Hud;
  private dialogue!: DialogueBox;
  private controls!: TouchControls;
  private eMarker!: Phaser.GameObjects.Container;
  private nearby: Nearby | null = null;

  private paused = false;
  private transitioning = false;
  private pauseLayer?: Phaser.GameObjects.Container;
  private lastHint = '';
  private secretHinted = new Set<string>();
  private playedFlavor = new Set<string>();
  private walkDust = 0;

  constructor() {
    super('AdventureScene');
  }

  init(data: AdventureData): void {
    this.pendingArea = data?.area;
    this.pendingSpawn = data?.spawn;
  }

  create(): void {
    this.save = SaveManager.load();
    this.cats = [];
    this.npcs = [];
    this.items = [];
    this.exits = [];
    this.secrets = [];
    this.interactables = [];
    this.starObjects.clear();
    this.nearby = null;
    this.paused = false;
    this.transitioning = false;
    this.lastHint = '';
    this.secretHinted.clear();
    this.playedFlavor.clear();
    this.pauseLayer = undefined;

    const requested = (this.pendingArea ?? this.save.area) as TopAreaId;
    this.areaId = ['garden', 'forest', 'village'].includes(requested) ? requested : 'garden';
    this.area = AREAS[this.areaId];
    this.save.area = this.areaId;
    SaveManager.save(this.save);

    this.physics.world.setBounds(0, 0, this.area.width, this.area.height);
    this.cameras.main.setBounds(0, 0, this.area.width, this.area.height);
    this.cameras.main.setBackgroundColor(this.areaId === 'forest' ? '#20362e' : '#78a969');

    this.solids = this.physics.add.staticGroup();
    this.drawGround();
    this.buildProps();

    const spawn = this.area.spawns[this.pendingSpawn ?? 'default'] ?? this.area.spawns.default;
    this.player = this.physics.add.sprite(spawn.x, spawn.y, 'cristian-idle-0').setDepth(spawn.y);
    this.player.setSize(16, 12).setOffset(12, 42);
    this.player.setCollideWorldBounds(true);
    this.player.play('cristian-idle');
    this.physics.add.collider(this.player, this.solids);
    this.playerShadow = this.add.ellipse(spawn.x, spawn.y + 26, 30, 10, 0x1d2a22, 0.22).setDepth(spawn.y - 1);

    this.buildCats();
    this.buildNpcs();
    this.buildStars();
    this.buildExits();
    this.buildSecrets();
    this.buildInteractables();

    this.cameras.main.startFollow(this.player, true, 0.09, 0.09);
    this.cameras.main.setDeadzone(120, 80);
    this.cameras.main.fadeIn(420, 23, 44, 40);

    this.buildHud();
    this.dialogue = new DialogueBox(this);
    this.controls = new TouchControls(this, 'adventure', () => this.onAction());
    this.buildMarker();

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.keys = this.input.keyboard!.addKeys('W,A,S,D,E,M,ESC,ENTER,SPACE') as Record<string, Phaser.Input.Keyboard.Key>;
    this.input.keyboard?.on('keydown-E', () => this.onAction());
    this.input.keyboard?.on('keydown-ENTER', () => this.onAction());
    this.input.keyboard?.on('keydown-SPACE', () => this.onAction());
    this.input.keyboard?.on('keydown-ESC', () => this.togglePause());
    this.input.keyboard?.on('keydown-M', () => this.toggleMute());

    AudioManager.playMusic(this.area.music);
    this.syncItems();
    this.refreshQuestTracker();
    this.refreshExitMarkers();
    this.hud.update(this.save);
    this.showAreaBanner();
    this.tryIntro();
  }

  /* ─────────────────────────  CENÁRIO  ───────────────────────── */

  private drawGround(): void {
    const area = this.area;
    this.add.tileSprite(area.width / 2, area.height / 2, area.width, area.height, area.tile).setDepth(-30);

    const paths = this.add.graphics().setDepth(-20);
    area.pathRects.forEach((rect) => {
      paths.fillStyle(area.pathEdge, 1);
      paths.fillRect(rect.x - 7, rect.y - 7, rect.w + 14, rect.h + 14);
      paths.fillStyle(area.pathColor, 1);
      paths.fillRect(rect.x, rect.y, rect.w, rect.h);
    });
    area.clearings.forEach((clear) => {
      paths.fillStyle(area.pathEdge, 1);
      paths.fillEllipse(clear.x + clear.w / 2, clear.y + clear.h / 2, clear.w + 18, clear.h + 18);
      paths.fillStyle(area.pathColor, 1);
      paths.fillEllipse(clear.x + clear.w / 2, clear.y + clear.h / 2, clear.w, clear.h);
    });

    // Pedrinhas e detalhes sobre os caminhos.
    let seed = this.areaId.length * 733 + 41;
    const rnd = (): number => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    for (let i = 0; i < 150; i++) {
      const x = rnd() * area.width;
      const y = rnd() * area.height;
      const onPath = area.pathRects.some((rect) => x > rect.x && x < rect.x + rect.w && y > rect.y && y < rect.y + rect.h)
        || area.clearings.some((clear) => {
          const cx = clear.x + clear.w / 2;
          const cy = clear.y + clear.h / 2;
          return ((x - cx) / (clear.w / 2)) ** 2 + ((y - cy) / (clear.h / 2)) ** 2 < 1;
        });
      if (onPath) {
        this.add.rectangle(x, y, rnd() > 0.7 ? 3 : 2, 2, 0xb39468, 0.55).setDepth(-18);
      }
    }

    // Tufos de grama e florzinhas espalhadas.
    const decals = this.add.graphics().setDepth(-10);
    for (let i = 0; i < 150; i++) {
      const x = rnd() * (area.width - 20) + 10;
      const y = rnd() * (area.height - 20) + 10;
      decals.fillStyle(i % 5 === 0 ? 0x9ac785 : 0x5d8c50, 0.55);
      decals.fillRect(x, y, 1, 3);
      decals.fillRect(x + 2, y + 1, 1, 2);
      if (i % 11 === 0) {
        decals.fillStyle(i % 22 === 0 ? 0xf6c6cf : 0xffe58b, 0.75);
        decals.fillRect(x - 1, y - 2, 2, 2);
      }
    }

    if (area.pond) this.drawPond(area.pond);

    if (this.areaId === 'forest') {
      const mist = this.add.graphics().setDepth(-8);
      for (let i = 0; i < 9; i++) {
        const x = 160 + rnd() * (area.width - 320);
        const y = 160 + rnd() * (area.height - 320);
        mist.fillStyle(0xa8d9dc, 0.045);
        mist.fillEllipse(x, y, 220 + rnd() * 160, 80 + rnd() * 50);
      }
      this.add.particles(0, 0, 'pixel', {
        x: { min: 0, max: area.width },
        y: { min: 100, max: area.height - 80 },
        lifespan: 5200,
        speedX: { min: -6, max: 6 },
        speedY: { min: -10, max: -2 },
        scale: { start: 0.55, end: 0 },
        alpha: { start: 0.8, end: 0 },
        frequency: 240,
        quantity: 1,
        blendMode: 'ADD',
        tint: [0xffdf7e, 0xa8d9dc, 0xc6edb5],
      }).setDepth(3);
    } else if (this.areaId === 'garden') {
      this.add.particles(0, 0, 'pixel', {
        x: { min: 0, max: area.width },
        y: { min: 80, max: area.height - 100 },
        lifespan: 6000,
        speedX: { min: -10, max: 10 },
        speedY: { min: -6, max: 4 },
        scale: { start: 0.5, end: 0 },
        alpha: { start: 0.6, end: 0 },
        frequency: 420,
        quantity: 1,
        tint: [0xffe58b, 0xf6c6cf, 0xffffff],
      }).setDepth(3);
    } else {
      // Bandeirinhas do festival na vila.
      const bunting = this.add.graphics().setDepth(4);
      const colors = [0xf18ca9, 0xffdf7e, 0x7fa7dd, 0x9ac785];
      for (let i = 0; i < 26; i++) {
        const x = 40 + i * 80;
        const y = 180 + Math.sin(i * 0.9) * 16;
        bunting.fillStyle(0x4a3226, 0.75);
        bunting.fillRect(x, y, 80, 1);
        bunting.fillStyle(colors[i % colors.length], 0.9);
        bunting.fillTriangle(x + 18, y + 1, x + 34, y + 1, x + 26, y + 20);
        bunting.fillTriangle(x + 46, y + 1, x + 62, y + 1, x + 54, y + 18);
      }
      this.add.particles(0, 0, 'pixel', {
        x: { min: 0, max: area.width },
        y: { min: 100, max: area.height - 80 },
        lifespan: 7000,
        speedX: { min: -4, max: 8 },
        speedY: { min: 2, max: 10 },
        scale: { start: 0.5, end: 0 },
        alpha: { start: 0.55, end: 0 },
        frequency: 500,
        quantity: 1,
        tint: [0xf6c6cf, 0xffe58b, 0xffffff],
      }).setDepth(3);
    }
  }

  private drawPond(pond: { x: number; y: number; rx: number; ry: number }): void {
    const g = this.add.graphics().setDepth(-15);
    g.fillStyle(0xd9c79b, 1);
    g.fillEllipse(pond.x, pond.y, pond.rx * 2 + 34, pond.ry * 2 + 26);
    g.fillStyle(0x6aaeb2, 1);
    g.fillEllipse(pond.x, pond.y, pond.rx * 2, pond.ry * 2);
    g.fillStyle(0x5f9fb0, 1);
    g.fillEllipse(pond.x, pond.y + 10, pond.rx * 1.75, pond.ry * 1.55);
    g.fillStyle(0x7fc4c5, 0.6);
    g.fillEllipse(pond.x - pond.rx * 0.2, pond.y - pond.ry * 0.25, pond.rx * 1.2, pond.ry * 0.7);
    g.fillStyle(0xa8d9dc, 0.8);
    g.fillRect(pond.x - 80, pond.y - 10, 46, 3);
    g.fillRect(pond.x + 24, pond.y + 22, 38, 3);
    g.fillStyle(0x5d8c50, 1);
    g.fillCircle(pond.x - 70, pond.y + 30, 11);
    g.fillCircle(pond.x + 54, pond.y - 26, 9);
    g.fillStyle(0xf6c6cf, 1);
    g.fillRect(pond.x - 75, pond.y + 24, 4, 4);
    g.fillRect(pond.x + 50, pond.y - 32, 4, 4);
    // Juncos
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const x = pond.x + Math.cos(angle) * (pond.rx + 16);
      const y = pond.y + Math.sin(angle) * (pond.ry + 12);
      g.fillStyle(0x3f6f45, 0.9);
      g.fillRect(x, y - 16, 2, 18);
      g.fillRect(x - 3, y - 8, 3, 2);
    }

    // Corpos invisíveis aproximando a forma do lago.
    const blockers: Array<[number, number, number, number]> = [
      [pond.x, pond.y - pond.ry * 0.3, pond.rx * 1.5, pond.ry * 0.9],
      [pond.x, pond.y + pond.ry * 0.42, pond.rx * 1.35, pond.ry * 0.7],
      [pond.x - pond.rx * 0.62, pond.y, pond.rx * 0.7, pond.ry * 1.1],
      [pond.x + pond.rx * 0.62, pond.y, pond.rx * 0.7, pond.ry * 1.1],
    ];
    blockers.forEach(([x, y, w, h]) => this.addSolid(x, y, w, h));
  }

  private addSolid(x: number, y: number, width: number, height: number): void {
    const rect = this.add.rectangle(x, y, width, height, 0x000000, 0);
    this.solids.add(rect);
    const body = rect.body as Phaser.Physics.Arcade.StaticBody;
    body.setSize(width, height);
    body.updateFromGameObject();
  }

  private buildProps(): void {
    const solidSizes: Partial<Record<string, { w: number; h: number; dy: number }>> = {
      'tree-round': { w: 22, h: 18, dy: -6 },
      'tree-pine': { w: 18, h: 16, dy: -6 },
      bush: { w: 24, h: 12, dy: -4 },
      rock: { w: 18, h: 10, dy: -3 },
      'house-cottage': { w: 102, h: 26, dy: -12 },
      'house-tall': { w: 88, h: 26, dy: -12 },
      stall: { w: 86, h: 20, dy: -8 },
      well: { w: 44, h: 20, dy: -8 },
      bench: { w: 40, h: 14, dy: -4 },
      sign: { w: 24, h: 10, dy: -2 },
      fence: { w: 46, h: 10, dy: -2 },
    };

    this.area.props.forEach((prop) => {
      const scale = prop.scale ?? 1;
      const image = this.add.image(prop.x, prop.y, prop.kind)
        .setOrigin(0.5, 1)
        .setDepth(prop.y)
        .setScale(scale);
      if (prop.flipX) image.setFlipX(true);
      if (prop.tint) image.setTint(prop.tint);

      const size = solidSizes[prop.kind];
      if (prop.solid && size) {
        this.addSolid(prop.x, prop.y + size.dy * scale, size.w * scale, size.h * scale);
      }

      if (prop.kind === 'lantern') {
        const glow = this.add.image(prop.x, prop.y - 38 * scale, 'glow-gold')
          .setDepth(prop.y - 1).setScale(0.55 * scale).setAlpha(0.35).setBlendMode(Phaser.BlendModes.ADD);
        this.tweens.add({
          targets: glow,
          alpha: { from: 0.22, to: 0.48 },
          duration: 1500 + Math.random() * 900,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });
      }

      if (prop.kind === 'mushroom-teal') {
        const glow = this.add.image(prop.x, prop.y - 11 * scale, 'glow-blue')
          .setDepth(prop.y - 1).setScale(0.4 * scale).setAlpha(0.28).setBlendMode(Phaser.BlendModes.ADD);
        this.tweens.add({ targets: glow, alpha: 0.1, duration: 1800, yoyo: true, repeat: -1 });
      }
    });
  }

  /* ─────────────────────────  ENTIDADES  ───────────────────────── */

  private buildCats(): void {
    this.area.cats.forEach((def) => {
      if (def.requiresFlag && !hasFlag(this.save, def.requiresFlag)) return;
      const sprite = this.add.sprite(def.x, def.y, `cat-${def.variant}-0`)
        .setOrigin(0.5, 1)
        .setDepth(def.y)
        .setScale(1.15);
      sprite.play(`cat-${def.variant}-idle`);
      const label = this.add.text(def.x, def.y - 38, def.name, {
        fontFamily: '"Nunito", sans-serif',
        fontSize: '12px',
        fontStyle: '900',
        color: '#fff4e2',
        stroke: '#203c35',
        strokeThickness: 4,
      }).setOrigin(0.5, 1).setDepth(def.y + 1);

      let heart: Phaser.GameObjects.Image | undefined;
      if (this.save.catsFound.includes(def.id)) {
        heart = this.add.image(def.x + 22, def.y - 42, 'heart').setDepth(def.y + 2).setScale(0.75);
        this.tweens.add({ targets: heart, y: heart.y - 4, duration: 1200, yoyo: true, repeat: -1 });
      }
      this.cats.push({ def, sprite, label, heart });
    });
  }

  private buildNpcs(): void {
    this.area.npcs.forEach((def) => {
      if (def.requiresFlag && !hasFlag(this.save, def.requiresFlag)) return;
      const sprite = this.add.sprite(def.x, def.y, `${def.variant}-0`)
        .setOrigin(0.5, 1)
        .setDepth(def.y)
        .setScale(1.05);
      sprite.play(`${def.variant}-idle`);
      const label = this.add.text(def.x, def.y - 48, def.name, {
        fontFamily: '"Nunito", sans-serif',
        fontSize: '12px',
        fontStyle: '900',
        color: '#fff4e0',
        stroke: '#203c35',
        strokeThickness: 4,
      }).setOrigin(0.5, 1).setDepth(def.y + 1);
      this.npcs.push({ def, sprite, label });
    });
  }

  private buildStars(): void {
    this.starsGroup = this.physics.add.group({ allowGravity: false, immovable: true });
    this.area.stars.forEach((def) => {
      if (this.save.collectedStars.includes(def.id)) return;
      const glow = this.add.image(def.x, def.y, 'glow-gold')
        .setDepth(def.y - 1).setScale(0.55).setAlpha(0.35).setBlendMode(Phaser.BlendModes.ADD);
      const star = this.starsGroup.create(def.x, def.y, 'star') as Phaser.Physics.Arcade.Sprite;
      star.setDepth(def.y).setData('starId', def.id);
      this.tweens.add({
        targets: [star, glow],
        y: def.y - 7,
        duration: 1100 + (def.id.length % 5) * 120,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
      this.tweens.add({ targets: glow, alpha: 0.2, scale: 0.45, duration: 1500, yoyo: true, repeat: -1 });
      this.starObjects.set(def.id, { star, glow });
    });

    this.physics.add.overlap(this.player, this.starsGroup, (_player, object) => {
      if (this.dialogue?.isOpen || this.paused || this.transitioning) return;
      const star = object as Phaser.Physics.Arcade.Sprite;
      const id = star.getData('starId') as string;
      const starX = star.x;
      const starY = star.y;
      const runtime = this.starObjects.get(id);
      runtime?.glow.destroy();
      star.destroy();
      this.starObjects.delete(id);
      if (!this.save.collectedStars.includes(id)) {
        this.save.collectedStars.push(id);
        this.save.stars += 1;
        SaveManager.save(this.save);
      }
      AudioManager.sfx('star');
      this.burst(starX, starY);
      this.floatingText(starX, starY - 16, '+1 ★', '#ffe9a8');
      this.hud.update(this.save);
      this.refreshQuestTracker();
    });
  }

  private buildExits(): void {
    this.area.exits.forEach((def) => {
      const cx = def.x + def.width / 2;
      const cy = def.y + def.height / 2;
      const mx = Phaser.Math.Clamp(cx, 130, this.area.width - 130);
      const my = Phaser.Math.Clamp(cy - 84, 90, this.area.height - 70);
      const marker = this.add.text(mx, my, '', textStyle(13, '#fff4e2', {
        fontStyle: '900',
        stroke: '#203c35',
        strokeThickness: 5,
      })).setOrigin(0.5).setDepth(40);
      const glow = this.add.image(mx, my, 'glow-gold')
        .setScale(0.6).setAlpha(0).setDepth(39).setBlendMode(Phaser.BlendModes.ADD);
      this.exits.push({ def, marker, glow, cx, cy });
    });
  }

  private buildSecrets(): void {
    this.area.secrets.forEach((def) => {
      const glow = this.add.image(def.x, def.y, 'glow-pink')
        .setScale(1.1).setAlpha(0.35).setDepth(def.y - 1).setBlendMode(Phaser.BlendModes.ADD);
      const sparkle = this.add.image(def.x, def.y, 'sparkle').setDepth(def.y).setScale(1.15);
      this.tweens.add({
        targets: sparkle,
        angle: { from: 0, to: 180 },
        scale: { from: 0.9, to: 1.25 },
        duration: 1600,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
      this.tweens.add({ targets: glow, alpha: 0.15, duration: 1200, yoyo: true, repeat: -1 });
      if (hasFlag(this.save, def.flag)) {
        sparkle.setAlpha(0.18);
        glow.setAlpha(0.08);
      }
      this.secrets.push({ def, sparkle, glow });
    });
  }

  private buildInteractables(): void {
    this.area.interactables.forEach((def) => {
      let sparkle: Phaser.GameObjects.Image | undefined;
      if (def.rewardStars && (!def.flag || !hasFlag(this.save, def.flag))) {
        sparkle = this.add.image(def.x, def.y - 34, 'sparkle').setDepth(def.y + 2).setScale(0.8);
        this.tweens.add({ targets: sparkle, y: sparkle.y - 5, duration: 1200, yoyo: true, repeat: -1 });
      }
      this.interactables.push({ def, sparkle });
    });
  }

  /* ─────────────────────────  HUD E UI  ───────────────────────── */

  private buildHud(): void {
    this.hud = new Hud(this, this.area.name, `${AREA_PROGRESS[this.areaId]}/3`, {
      onPause: () => this.togglePause(),
    });
    this.hud.update(this.save);
    this.hud.setHint(this.defaultHint());
  }

  private buildMarker(): void {
    const bg = this.add.circle(0, 0, 13, UI.green, 0.94).setStrokeStyle(2, 0xfff4e2, 0.9);
    const text = this.add.text(0, 0, 'E', textStyle(13, CSS.cream, { fontStyle: '900' })).setOrigin(0.5);
    this.eMarker = this.add.container(0, 0, [bg, text]).setDepth(2600).setVisible(false);
  }

  private showAreaBanner(): void {
    const container = this.add.container(480, 104).setScrollFactor(0).setDepth(1150).setAlpha(0);
    const title = this.add.text(0, 0, this.area.name, {
      fontFamily: '"Nunito", sans-serif', fontSize: '28px', fontStyle: '900',
      color: '#fff4e2', stroke: '#203c35', strokeThickness: 7,
    }).setOrigin(0.5);
    const subtitle = this.add.text(0, 30, this.area.subtitle, {
      fontFamily: '"Nunito", sans-serif', fontSize: '13px', fontStyle: '700',
      color: '#f6c6cf', stroke: '#203c35', strokeThickness: 4,
    }).setOrigin(0.5);
    container.add([title, subtitle]);
    this.tweens.add({ targets: container, alpha: 1, y: 122, duration: 450, ease: 'Sine.easeOut' });
    this.tweens.add({
      targets: container,
      alpha: 0,
      y: 108,
      delay: 2200,
      duration: 650,
      ease: 'Sine.easeIn',
      onComplete: () => container.destroy(true),
    });
  }

  private tryIntro(): void {
    if (hasFlag(this.save, this.area.introFlag)) return;
    const attempt = (): void => {
      if (!this.scene.isActive()) return;
      if (this.paused || this.dialogue?.isOpen) {
        this.time.delayedCall(700, attempt);
        return;
      }
      addOnce(this.save.flags, this.area.introFlag);
      SaveManager.save(this.save);
      const pages: DialoguePage[] = this.area.introLines.map((line) => ({
        speaker: 'Narrador',
        accent: '#ffe9a8',
        text: line,
      }));
      this.openDialogue(pages, () => {
        this.hud.toast(this.area.name, 'Converse com os gatinhos e explore cada cantinho.');
      });
    };
    this.time.delayedCall(900, attempt);
  }

  /* ─────────────────────────  LOOP  ───────────────────────── */

  update(_time: number, delta: number): void {
    if (!this.player || this.transitioning) return;

    if (this.paused) {
      this.player.setVelocity(0, 0);
      this.eMarker.setVisible(false);
      return;
    }

    if (this.dialogue?.isOpen) {
      this.player.setVelocity(0, 0);
      this.player.play('cristian-idle', true);
      this.eMarker.setVisible(false);
      if (this.lastHint !== '') {
        this.hud.setHint('');
        this.lastHint = '';
      }
      return;
    }

    const speed = 178;
    let vx = 0;
    let vy = 0;
    if (this.cursors.left.isDown || this.keys.A.isDown) vx -= 1;
    if (this.cursors.right.isDown || this.keys.D.isDown) vx += 1;
    if (this.cursors.up.isDown || this.keys.W.isDown) vy -= 1;
    if (this.cursors.down.isDown || this.keys.S.isDown) vy += 1;
    vx += this.controls.direction.x;
    vy += this.controls.direction.y;
    const length = Math.hypot(vx, vy);
    if (length > 1) {
      vx /= length;
      vy /= length;
    }
    this.player.setVelocity(vx * speed, vy * speed);

    const moving = Math.abs(vx) > 0.08 || Math.abs(vy) > 0.08;
    if (moving) {
      this.player.play('cristian-walk', true);
      if (Math.abs(vx) > 0.08) this.player.setFlipX(vx < 0);
      this.walkDust += delta;
      if (this.walkDust > 240) {
        this.walkDust = 0;
        this.footstep();
      }
    } else {
      this.player.play('cristian-idle', true);
    }

    this.player.setDepth(this.player.y);
    this.playerShadow.setPosition(this.player.x, this.player.y + 26).setDepth(this.player.y - 1);

    this.updateNearby();
    this.checkAutoPickups();
    this.checkSecrets();
  }

  private updateNearby(): void {
    const candidates: Nearby[] = [];
    const px = this.player.x;
    const py = this.player.y;

    this.cats.forEach((cat) => {
      const d = Phaser.Math.Distance.Between(px, py, cat.sprite.x, cat.sprite.y);
      if (d < 92) candidates.push({ kind: 'cat', dist: d, cat, markerX: cat.sprite.x, markerY: cat.sprite.y - 48 });
    });
    this.npcs.forEach((npc) => {
      const d = Phaser.Math.Distance.Between(px, py, npc.sprite.x, npc.sprite.y);
      if (d < 96) candidates.push({ kind: 'npc', dist: d, npc, markerX: npc.sprite.x, markerY: npc.sprite.y - 56 });
    });
    this.exits.forEach((exit) => {
      const d = Phaser.Math.Distance.Between(px, py, exit.cx, exit.cy);
      const reach = Math.max(exit.def.width, exit.def.height) / 2 + 60;
      if (d < reach) {
        candidates.push({ kind: 'exit', dist: d, exit, markerX: exit.marker.x, markerY: exit.marker.y - 20 });
      }
    });
    this.secrets.forEach((secret) => {
      if (hasFlag(this.save, secret.def.flag)) return;
      const d = Phaser.Math.Distance.Between(px, py, secret.def.x, secret.def.y);
      if (d < secret.def.radius + 30) {
        candidates.push({ kind: 'secret', dist: d, secret, markerX: secret.def.x, markerY: secret.def.y - 26 });
      }
    });
    this.interactables.forEach((interactable) => {
      const d = Phaser.Math.Distance.Between(px, py, interactable.def.x, interactable.def.y);
      if (d < (interactable.def.radius ?? 82)) {
        candidates.push({
          kind: 'interactable',
          dist: d,
          interactable,
          markerX: interactable.def.x,
          markerY: interactable.def.y - 48,
        });
      }
    });

    candidates.sort((a, b) => a.dist - b.dist);
    this.nearby = candidates[0] ?? null;

    if (this.nearby) {
      this.eMarker.setVisible(true);
      this.eMarker.setPosition(this.nearby.markerX, this.nearby.markerY);
      this.setHint(this.hintFor(this.nearby));
    } else {
      this.eMarker.setVisible(false);
      this.setHint(this.defaultHint());
    }
  }

  private hintFor(nearby: Nearby): string {
    switch (nearby.kind) {
      case 'cat':
        return `E  •  conversar com ${nearby.cat.def.name}`;
      case 'npc':
        return `E  •  conversar com ${nearby.npc.def.name}`;
      case 'exit': {
        const unlocked = this.exitUnlocked(nearby.exit.def);
        return unlocked ? `E  •  ir para ${nearby.exit.def.label}` : `E  •  ${nearby.exit.def.label} (bloqueado)`;
      }
      case 'secret':
        return hasFlag(this.save, nearby.secret.def.flag) ? 'E  •  lembrar deste cantinho' : 'E  •  investigar o brilho';
      case 'interactable':
        return `E  •  ${nearby.interactable.def.name}`;
    }
  }

  private defaultHint(): string {
    return 'WASD / setas para andar  •  E para interagir  •  ESC para pausar';
  }

  private setHint(hint: string): void {
    if (hint === this.lastHint) return;
    this.lastHint = hint;
    this.hud.setHint(hint);
  }

  private onAction(): void {
    if (this.transitioning || this.paused) return;
    AudioManager.init();
    if (this.dialogue.isOpen) {
      this.dialogue.advance();
      return;
    }
    if (!this.nearby) {
      this.showFlavor();
      return;
    }
    switch (this.nearby.kind) {
      case 'cat':
        this.talkToCat(this.nearby.cat);
        break;
      case 'npc':
        this.talkToNpc(this.nearby.npc);
        break;
      case 'exit':
        this.tryExit(this.nearby.exit.def);
        break;
      case 'secret':
        this.investigateSecret(this.nearby.secret);
        break;
      case 'interactable':
        this.useInteractable(this.nearby.interactable);
        break;
    }
  }

  private showFlavor(): void {
    const lines = FLAVOR[this.areaId];
    const key = `${this.areaId}-${lines.length}-${this.playedFlavor.size}`;
    const line = lines[this.playedFlavor.size % lines.length];
    this.playedFlavor.add(key);
    this.openDialogue([{ speaker: PERSONALIZATION.playerName, text: line, portrait: 'cristian-idle-0' }]);
  }

  /* ─────────────────────────  GATINHOS E NPCs  ───────────────────────── */

  private markCatFound(cat: CatDef, spriteX: number, spriteY: number): void {
    if (this.save.catsFound.includes(cat.id)) return;
    addOnce(this.save.catsFound, cat.id);
    SaveManager.save(this.save);
    AudioManager.sfx('meow');
    this.hud.toast('Gatinho encontrado! ♥', `${cat.name} agora faz parte da aventura.`);
    this.floatingText(spriteX, spriteY - 52, '♥', '#f6c6cf');
    const runtime = this.cats.find((item) => item.def.id === cat.id);
    if (runtime) {
      runtime.heart?.destroy();
      runtime.heart = this.add.image(spriteX + 22, spriteY - 42, 'heart').setDepth(spriteY + 2).setScale(0.75);
      this.tweens.add({ targets: runtime.heart, y: spriteY - 46, duration: 1200, yoyo: true, repeat: -1 });
    }
    this.hud.update(this.save);
  }

  private catPages(cat: CatDef, lines: string[]): DialoguePage[] {
    return lines.map((line) => ({
      speaker: cat.name,
      text: line,
      portrait: `cat-${cat.variant}-0`,
      accent: '#ffe9a8',
    }));
  }

  private talkToCat(runtime: CatRuntime): void {
    const cat = runtime.def;
    this.markCatFound(cat, runtime.sprite.x, runtime.sprite.y);
    const quest = cat.questId ? QUESTS[cat.questId] : undefined;

    if (!quest) {
      this.openDialogue(this.catPages(cat, cat.lines));
      return;
    }

    if (questIsDone(this.save, quest.id)) {
      const extra = quest.id === 'nuvem_glade'
        ? ['Amora está na vila agora. Ela passa o dia inteiro tomando sol na praça. Obrigada por trazê-la de volta, miau.']
        : [];
      this.openDialogue(this.catPages(cat, [...extra, ...cat.lines]));
      return;
    }

    if (questIsActive(this.save, quest.id)) {
      const found = quest.itemIds.filter((id) => hasItem(this.save, id)).length;
      if (quest.itemIds.length > 0 && found >= quest.itemIds.length) {
        this.completeQuest(quest);
        const pages = this.catPages(cat, [quest.complete]);
        pages.push({
          speaker: 'Narrador',
          accent: '#ffe9a8',
          text: `Missão concluída: ${quest.title}. Você recebeu ${quest.rewardStars} estrelinhas ✦.`,
        });
        this.openDialogue(pages, () => this.hud.toast('Caminho aberto!', 'Uma nova área espera por você.'));
      } else {
        const progress = quest.itemIds.length > 1 && found > 0
          ? `${quest.waiting} (${found}/${quest.itemIds.length} encontrados)`
          : quest.waiting;
        this.openDialogue(this.catPages(cat, [progress, ...cat.lines.slice(0, 1)]));
      }
      return;
    }

    // Inicia a missão.
    addOnce(this.save.questsActive, quest.id);
    SaveManager.save(this.save);
    AudioManager.sfx('meow');
    this.hud.update(this.save);
    this.refreshQuestTracker();
    const pages = this.catPages(cat, [quest.start]);
    pages.push({
      speaker: 'Nova missão',
      accent: '#ffdf7e',
      text: `${quest.title}\n${quest.objective}`,
    });
    this.openDialogue(pages, () => {
      this.syncItems();
      this.refreshQuestTracker();
      this.hud.toast('Nova missão!', quest.title);
    });
  }

  private talkToNpc(runtime: NpcRuntime): void {
    const pages = runtime.def.lines.map((line) => ({
      speaker: runtime.def.name,
      text: line,
      portrait: `${runtime.def.variant}-0`,
      accent: '#ffe9a8',
    }));
    this.openDialogue(pages);
  }

  private completeQuest(quest: QuestDef, rewardOverride?: number, silent = false): void {
    if (questIsDone(this.save, quest.id)) return;
    addOnce(this.save.questsDone, quest.id);
    this.save.questsActive = this.save.questsActive.filter((id) => id !== quest.id);
    addOnce(this.save.flags, quest.unlockFlag);
    this.save.inventory = this.save.inventory.filter((id) => !quest.itemIds.includes(id));
    const reward = rewardOverride ?? quest.rewardStars;
    this.save.stars += reward;
    SaveManager.save(this.save);
    AudioManager.sfx('quest');
    this.burst(this.player.x, this.player.y - 20);
    this.floatingText(this.player.x, this.player.y - 70, `+${reward} ★`, '#ffe9a8');
    this.syncItems();
    this.refreshExitMarkers();
    this.refreshQuestTracker();
    this.hud.update(this.save);
    if (!silent) this.hud.toast('Missão concluída!', `${quest.title}  •  +${reward} ★`);
  }

  /* ─────────────────────────  ITENS, ESTRELAS E SEGREDOS  ───────────────────────── */

  private syncItems(): void {
    this.area.items.forEach((def) => {
      if (!questIsActive(this.save, def.questId)) return;
      if (questIsDone(this.save, def.questId)) return;
      if (hasItem(this.save, def.id)) return;
      if (this.items.some((item) => item.def.id === def.id)) return;

      const glow = this.add.image(def.x, def.y, 'glow-gold')
        .setDepth(def.y - 1).setScale(0.5).setAlpha(0.32).setBlendMode(Phaser.BlendModes.ADD);
      const sprite = this.add.image(def.x, def.y, def.texture).setDepth(def.y).setScale(1.15);
      this.tweens.add({
        targets: [sprite, glow],
        y: def.y - 6,
        duration: 1100,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
      this.tweens.add({ targets: glow, alpha: 0.16, duration: 900, yoyo: true, repeat: -1 });
      this.items.push({ def, sprite, glow });
    });
  }

  private checkAutoPickups(): void {
    if (this.items.length === 0) return;
    for (const item of [...this.items]) {
      const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, item.sprite.x, item.sprite.y);
      if (d > 46) continue;
      addOnce(this.save.inventory, item.def.id);
      SaveManager.save(this.save);
      AudioManager.sfx('item');
      this.burst(item.sprite.x, item.sprite.y, 'sparkle');
      this.floatingText(item.sprite.x, item.sprite.y - 18, item.def.label, '#fff3bd');
      item.sprite.destroy();
      item.glow.destroy();
      this.items = this.items.filter((entry) => entry !== item);
      const quest = QUESTS[item.def.questId];
      if (quest) {
        const found = quest.itemIds.filter((id) => hasItem(this.save, id)).length;
        if (found >= quest.itemIds.length) {
          this.hud.toast('Tudo encontrado!', `Volte para ${quest.giver}.`);
        } else {
          this.hud.toast(`${item.def.label} encontrado!`, `${found}/${quest.itemIds.length}  •  continue explorando.`);
        }
      }
      this.refreshQuestTracker();
      this.hud.update(this.save);
    }
  }

  private checkSecrets(): void {
    if (this.nearby?.kind === 'secret') return;
    for (const secret of this.secrets) {
      const def = secret.def;
      if (hasFlag(this.save, def.flag)) continue;
      const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, def.x, def.y);
      if (d > def.radius) continue;

      if (def.requiresQuest && !questIsActive(this.save, def.requiresQuest) && !questIsDone(this.save, def.requiresQuest)) {
        if (!this.secretHinted.has(def.id)) {
          this.secretHinted.add(def.id);
          this.hud.toast('Há algo aqui...', def.hint ?? 'Talvez alguém precise de ajuda para encontrar este lugar.');
        }
        return;
      }
      this.triggerSecret(secret);
      return;
    }
  }

  private triggerSecret(secret: SecretRuntime): void {
    const def = secret.def;
    if (hasFlag(this.save, def.flag)) return;
    addOnce(this.save.flags, def.flag);
    const quest = def.requiresQuest ? QUESTS[def.requiresQuest] : undefined;
    this.save.stars += def.rewardStars;
    if (def.rewardCatId) addOnce(this.save.catsFound, def.rewardCatId);
    if (quest && questIsActive(this.save, quest.id)) {
      this.completeQuest(quest, 0, true);
    }
    SaveManager.save(this.save);
    AudioManager.sfx('quest');
    this.burst(def.x, def.y, 'sparkle');
    this.floatingText(def.x, def.y - 30, `+${def.rewardStars} ★`, '#ffe9a8');
    secret.sparkle.setAlpha(0.15);
    secret.glow.setAlpha(0.08);
    this.hud.toast('Segredo descoberto!', `${def.title}  •  +${def.rewardStars} ★`);
    this.hud.update(this.save);
    this.refreshQuestTracker();

    const pages: DialoguePage[] = [{ speaker: 'Descoberta', accent: '#ffdf7e', text: def.text }];
    if (def.rewardCatId) {
      pages.push({
        speaker: 'Amora',
        portrait: 'cat-black-0',
        accent: '#ffe9a8',
        text: 'Miau... obrigada por me encontrar. Eu me escondi porque estava com medo, mas agora quero conhecer a vila. A Nuvem falou tanto dela!',
      });
    }
    if (quest) {
      pages.push({
        speaker: 'Narrador',
        accent: '#ffe9a8',
        text: `Missão concluída: ${quest.title}. Amora vai encontrar você na Vila Aconchegante.`,
      });
    }
    this.openDialogue(pages);
  }

  private investigateSecret(secret: SecretRuntime): void {
    if (!hasFlag(this.save, secret.def.flag)) {
      this.triggerSecret(secret);
      return;
    }
    this.openDialogue([{
      speaker: PERSONALIZATION.playerName,
      portrait: 'cristian-idle-0',
      text: 'Este cantinho continua brilhando. Alguns lugares guardam a magia de quem já passou por eles.',
    }]);
  }

  /* ─────────────────────────  SAÍDAS E INTERAÇÕES  ───────────────────────── */

  private exitUnlocked(def: ExitDef): boolean {
    if (def.requiresQuest && !questIsDone(this.save, def.requiresQuest)) return false;
    if (def.requiresFlag && !hasFlag(this.save, def.requiresFlag)) return false;
    return true;
  }

  private refreshQuestTracker(): void {
    const quest = Object.values(QUESTS).find((entry) => questIsActive(this.save, entry.id));
    if (!quest) {
      this.hud.setQuest(null);
      return;
    }
    const found = quest.itemIds.filter((id) => hasItem(this.save, id)).length;
    const total = quest.itemIds.length;
    const objective = total > 0 ? `${quest.objective} (${found}/${total})` : quest.objective;
    this.hud.setQuest({
      title: quest.title,
      objective,
      collected: found,
      total,
      areaProgress: `${this.save.questsDone.length}/4`,
    });
  }

  private refreshExitMarkers(): void {
    this.exits.forEach((exit) => {
      const unlocked = this.exitUnlocked(exit.def);
      const leftSide = exit.cx < this.area.width / 2;
      const arrow = leftSide ? '←' : '→';
      exit.marker.setText(unlocked ? `${leftSide ? arrow : ''} ${exit.def.label} ${leftSide ? '' : arrow}`.trim() : `${exit.def.label}  ·  bloqueado`);
      exit.marker.setColor(unlocked ? '#ffe9a8' : '#f0b8c4');
      exit.glow.setAlpha(unlocked ? 0.4 : 0);
    });
  }

  private tryExit(def: ExitDef): void {
    if (!this.exitUnlocked(def)) {
      AudioManager.sfx('locked');
      const pages: DialoguePage[] = [{
        speaker: PERSONALIZATION.playerName,
        portrait: 'cristian-idle-0',
        text: def.lockedText ?? 'O caminho ainda está fechado. Talvez alguém por aqui saiba como abrir.',
      }];
      if (def.requiresQuest) {
        const quest = QUESTS[def.requiresQuest];
        if (quest) {
          pages.push({
            speaker: 'Objetivo',
            accent: '#ffdf7e',
            text: `${quest.title}\n${quest.objective}`,
          });
        }
      }
      this.openDialogue(pages);
      return;
    }

    this.transitioning = true;
    this.controls.setEnabled(false);
    this.save.area = def.target;
    SaveManager.save(this.save);
    AudioManager.sfx('ui');
    this.cameras.main.fadeOut(380, 23, 44, 40);
    this.time.delayedCall(400, () => {
      if (def.target === 'trail') {
        this.scene.start('StarTrailScene', { spawn: 'fromVillage' });
      } else {
        this.scene.start('AdventureScene', { area: def.target, spawn: def.targetSpawn });
      }
    });
  }

  private useInteractable(runtime: InteractableRuntime): void {
    const def = runtime.def;
    if (def.once && def.flag && hasFlag(this.save, def.flag)) {
      this.openDialogue([{
        speaker: def.name,
        text: def.id === 'wish-well'
          ? 'O poço continua brilhando. Você já deixou um desejo aqui — e ele parece feliz com a visita.'
          : 'Você já leu esta placa. Ela continua exatamente onde deveria estar.',
      }]);
      return;
    }

    const pages: DialoguePage[] = def.lines.map((line) => ({ speaker: def.name, text: line }));
    if (def.rewardStars) {
      addOnce(this.save.flags, def.flag ?? `used-${def.id}`);
      this.save.stars += def.rewardStars;
      SaveManager.save(this.save);
      runtime.sparkle?.destroy();
      AudioManager.sfx('star');
      this.burst(def.x, def.y - 30);
      this.floatingText(def.x, def.y - 60, `+${def.rewardStars} ★`, '#ffe9a8');
      this.hud.update(this.save);
      this.hud.toast('Desejo feito!', `+${def.rewardStars} estrelinha  •  que ele se realize.`);
    }
    this.openDialogue(pages);
  }

  /* ─────────────────────────  DIÁLOGO E PAUSA  ───────────────────────── */

  private openDialogue(pages: DialoguePage[], onClose?: () => void): void {
    this.controls.setEnabled(false);
    this.eMarker.setVisible(false);
    this.hud.setHint('');
    this.lastHint = '';
    this.dialogue.open(pages, () => {
      if (!this.paused) this.controls.setEnabled(true);
      this.updateNearby();
      onClose?.();
    });
  }

  private togglePause(): void {
    if (this.transitioning) return;
    if (this.dialogue?.isOpen) {
      this.dialogue.close();
      return;
    }
    if (this.paused) this.closePause();
    else this.openPause();
  }

  private openPause(): void {
    if (this.paused) return;
    this.paused = true;
    this.player.setVelocity(0, 0);
    this.controls.setEnabled(false);
    this.eMarker.setVisible(false);
    this.hud.setHint('');
    this.lastHint = '';
    AudioManager.sfx('ui');

    const layer = this.add.container(0, 0).setDepth(1600).setScrollFactor(0);
    const dim = this.add.rectangle(480, 270, 960, 540, 0x101b18, 0.62).setInteractive();
    const panel = addPanel(this, 138, 54, 684, 432, { radius: 18 });
    const title = this.add.text(480, 86, 'Pausa da aventura', textStyle(27, CSS.ink, { fontStyle: '900' })).setOrigin(0.5);
    const sub = this.add.text(480, 114, `${this.area.name}  •  ${this.area.subtitle}`, textStyle(12, '#6a5560', { fontStyle: '700' })).setOrigin(0.5);

    const leftX = 178;
    const rightX = 496;
    const invTitle = this.add.text(leftX, 148, 'INVENTÁRIO', textStyle(12, '#8a5566', { fontStyle: '900', letterSpacing: 1 }));
    const inventory = this.save.inventory.length > 0
      ? this.save.inventory.map((id) => `• ${ITEM_LABELS[id] ?? id}`).join('\n')
      : 'Nada ainda.\nExplore, converse com os gatinhos\ne ajude quem precisa.';
    const invBody = this.add.text(leftX, 172, inventory, textStyle(13, CSS.inkSoft, { lineSpacing: 5 }));

    const questTitle = this.add.text(rightX, 148, 'MISSÕES', textStyle(12, '#8a5566', { fontStyle: '900', letterSpacing: 1 }));
    const questLines = Object.values(QUESTS).map((quest) => {
      if (questIsDone(this.save, quest.id)) return `✓  ${quest.title}`;
      if (questIsActive(this.save, quest.id)) return `●  ${quest.title}`;
      return `○  ${quest.title}`;
    });
    const questBody = this.add.text(rightX, 172, questLines.join('\n'), textStyle(13, CSS.inkSoft, { lineSpacing: 7 }));

    const stats = this.add.text(480, 342,
      `★ ${this.save.stars} estrelinhas    ♥ ${this.save.catsFound.length}/${CAT_TOTAL} gatinhos    ✦ ${this.save.questsDone.length}/4 missões`,
      textStyle(13, '#6a5560', { fontStyle: '800' })).setOrigin(0.5);

    const controls = this.add.text(480, 366,
      'WASD / setas: mover  •  E: interagir  •  ESC: pausar  •  M: som',
      textStyle(11, '#8a747d', { fontStyle: '600' })).setOrigin(0.5);

    const resume = this.add.text(480, 408, 'CONTINUAR', {
      fontFamily: '"Nunito", sans-serif', fontSize: '16px', fontStyle: '900',
      color: '#3b3038', backgroundColor: '#f3b8c6', padding: { x: 34, y: 10 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    const mute = this.add.text(480, 452, `SOM: ${AudioManager.isMuted ? 'DESLIGADO' : 'LIGADO'}`, {
      fontFamily: '"Nunito", sans-serif', fontSize: '12px', fontStyle: '800',
      color: '#6a5560',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    const menu = this.add.text(480, 474, 'salvar e voltar ao menu', {
      fontFamily: '"Nunito", sans-serif', fontSize: '12px', fontStyle: '700',
      color: '#8a5566', backgroundColor: '#fff4e2', padding: { x: 18, y: 6 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    resume.on('pointerdown', () => this.closePause());
    mute.on('pointerdown', () => {
      const muted = AudioManager.toggleMute();
      mute.setText(`SOM: ${muted ? 'DESLIGADO' : 'LIGADO'}`);
      this.hud.setMuted(muted);
    });
    menu.on('pointerdown', () => {
      SaveManager.save(this.save);
      this.scene.start('MenuScene');
    });

    layer.add([dim, panel, title, sub, invTitle, invBody, questTitle, questBody, stats, controls, resume, mute, menu]);
    this.pauseLayer = layer;
  }

  private closePause(): void {
    this.pauseLayer?.destroy(true);
    this.pauseLayer = undefined;
    this.paused = false;
    this.controls.setEnabled(true);
    this.updateNearby();
  }

  private toggleMute(): void {
    const muted = AudioManager.toggleMute();
    this.hud.setMuted(muted);
    this.hud.toast(muted ? 'Som desligado' : 'Som ligado', muted ? 'A aventura continua em silêncio.' : 'Música e efeitos de volta.');
  }

  /* ─────────────────────────  FEEDBACK VISUAL  ───────────────────────── */

  private burst(x: number, y: number, texture = 'sparkle'): void {
    const emitter = this.add.particles(x, y, texture, {
      speed: { min: 30, max: 110 },
      angle: { min: 0, max: 360 },
      lifespan: { min: 280, max: 650 },
      scale: { start: 0.9, end: 0 },
      alpha: { start: 1, end: 0 },
      quantity: 1,
      emitting: false,
      blendMode: 'ADD',
      tint: [0xffdf7e, 0xfff3bd, 0xf6c6cf, 0xa8d9dc],
    }).setDepth(2500);
    emitter.explode(12);
    this.time.delayedCall(900, () => emitter.destroy());
  }

  private floatingText(x: number, y: number, text: string, color: string): void {
    const label = this.add.text(x, y, text, {
      fontFamily: '"Nunito", sans-serif',
      fontSize: '13px',
      fontStyle: '900',
      color,
      stroke: '#203c35',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(2700);
    this.tweens.add({
      targets: label,
      y: y - 34,
      alpha: 0,
      duration: 1050,
      ease: 'Sine.easeOut',
      onComplete: () => label.destroy(),
    });
  }

  private footstep(): void {
    const puff = this.add.ellipse(this.player.x, this.player.y + 24, 15, 6, 0xd9c79b, 0.28).setDepth(this.player.y - 2);
    this.tweens.add({
      targets: puff,
      alpha: 0,
      scaleX: 1.6,
      scaleY: 1.6,
      duration: 420,
      onComplete: () => puff.destroy(),
    });
  }
}
