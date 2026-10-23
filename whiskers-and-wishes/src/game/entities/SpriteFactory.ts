import Phaser from 'phaser';

/**
 * Toda a arte do jogo é desenhada por código em texturas de pixel art.
 * Isso mantém o projeto leve, offline-friendly e fácil de ajustar.
 */

type Pose = 'idle0' | 'idle1' | 'walk0' | 'walk1' | 'walk2' | 'walk3' | 'jump';
type CatPalette = { fur: number; furDark: number; accent: number; nose: number; eye: number };

const CAT_PALETTES: Record<string, CatPalette> = {
  cream: { fur: 0xf1e6d5, furDark: 0xd9c7ae, accent: 0xe8a8b7, nose: 0xdb8797, eye: 0x5a8c5f },
  orange: { fur: 0xe79a52, furDark: 0xc77a3b, accent: 0xffd27b, nose: 0xd97b80, eye: 0x5d7f4c },
  gray: { fur: 0x9a9ba8, furDark: 0x7b7c8b, accent: 0xcbb8dd, nose: 0xce8f9b, eye: 0x7fa36c },
  brown: { fur: 0x8b5e4a, furDark: 0x6f4737, accent: 0xd9a06b, nose: 0xcf8492, eye: 0x8aa25f },
  white: { fur: 0xf7f2e8, furDark: 0xd9d1c4, accent: 0xe6b3c4, nose: 0xe095a2, eye: 0x6f9a7f },
  black: { fur: 0x4a4650, furDark: 0x35323b, accent: 0x8d86a0, nose: 0xc08494, eye: 0xd8bf72 },
};

function paint(
  scene: Phaser.Scene,
  key: string,
  width: number,
  height: number,
  draw: (g: Phaser.GameObjects.Graphics) => void,
): void {
  if (scene.textures.exists(key)) return;
  const g = scene.make.graphics({ x: 0, y: 0 });
  draw(g);
  g.generateTexture(key, width, height);
  g.destroy();
}

/** Elipse "pixelada" desenhada em linhas de 2px. */
function pixelEllipse(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  color: number,
  alpha = 1,
): void {
  g.fillStyle(color, alpha);
  for (let y = -ry; y <= ry; y += 2) {
    const ratio = y / Math.max(1, ry);
    const w = Math.round(rx * Math.sqrt(Math.max(0, 1 - ratio * ratio)));
    if (w > 0) g.fillRect(Math.round(cx - w), Math.round(cy + y), w * 2, 2);
  }
}

function triangleTier(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  topY: number,
  height: number,
  halfWidth: number,
  color: number,
): void {
  g.fillStyle(color);
  for (let row = 0; row < height; row += 2) {
    const w = Math.round((row / height) * halfWidth);
    g.fillRect(cx - w, topY + row, Math.max(2, w * 2), 2);
  }
}

/* ─────────────────────────  PERSONAGENS  ───────────────────────── */

function drawCristian(g: Phaser.GameObjects.Graphics, pose: Pose): void {
  const bob = pose === 'idle1' || pose === 'walk1' || pose === 'walk3' ? 1 : 0;
  const jump = pose === 'jump';
  const hair = 0x2f2429;
  const hairHi = 0x4a363d;
  const skin = 0xeec39c;
  const skinShade = 0xd3a078;
  const blush = 0xed9f9f;
  const shirt = 0x272630;
  const shirtHi = 0x3b3a48;
  const pants = 0x353543;
  const shoes = 0xf1e4d2;

  pixelEllipse(g, 20, 53, 12, 3, 0x1d2a22, 0.22);

  // Pernas e sapatos
  if (jump) {
    g.fillStyle(pants); g.fillRect(13, 42, 6, 6); g.fillRect(21, 42, 6, 6);
    g.fillStyle(shoes); g.fillRect(12, 47, 7, 4); g.fillRect(21, 47, 7, 4);
  } else {
    const leftX = pose === 'walk0' ? 12 : pose === 'walk2' ? 23 : 14;
    const rightX = pose === 'walk0' ? 23 : pose === 'walk2' ? 12 : 22;
    const leftY = pose === 'walk0' ? 43 : 42;
    const rightY = pose === 'walk2' ? 43 : 42;
    g.fillStyle(pants);
    g.fillRect(leftX, leftY, 5, 9);
    g.fillRect(rightX, rightY, 5, 9);
    g.fillStyle(skinShade); g.fillRect(leftX + 1, leftY, 1, 8); g.fillRect(rightX + 1, rightY, 1, 8);
    g.fillStyle(shoes);
    g.fillRect(leftX - 1, leftY + 9, 7, 4);
    g.fillRect(rightX - 1, rightY + 9, 7, 4);
    g.fillStyle(0xcbbfa9);
    g.fillRect(leftX - 1, leftY + 12, 7, 1);
    g.fillRect(rightX - 1, rightY + 12, 7, 1);
  }

  // Corpo / camisa preta
  g.fillStyle(shirt);
  g.fillRect(13, 27 + bob, 14, 16);
  g.fillRect(11, 28 + bob, 18, 6);
  g.fillStyle(shirtHi);
  g.fillRect(14, 29 + bob, 2, 10);
  g.fillRect(26, 30 + bob, 1, 7);
  g.fillStyle(0x191820);
  g.fillRect(13, 42 + bob, 14, 2);
  g.fillStyle(0xf6ead6);
  g.fillRect(18, 25 + bob, 4, 2);
  g.fillRect(19, 33 + bob, 2, 2);
  g.fillRect(18, 35 + bob, 4, 1);
  g.fillRect(20, 32 + bob, 1, 4);

  // Braços
  if (jump) {
    g.fillStyle(shirt);
    g.fillRect(7, 26 + bob, 4, 7);
    g.fillRect(29, 26 + bob, 4, 7);
    g.fillStyle(skin);
    g.fillRect(7, 21 + bob, 4, 5);
    g.fillRect(29, 21 + bob, 4, 5);
  } else {
    const leftY = pose === 'walk0' ? 30 : pose === 'walk2' ? 28 : 29;
    const rightY = pose === 'walk0' ? 28 : pose === 'walk2' ? 30 : 29;
    g.fillStyle(shirt);
    g.fillRect(9, leftY + bob, 4, 7);
    g.fillRect(27, rightY + bob, 4, 7);
    g.fillStyle(skin);
    g.fillRect(9, leftY + 7 + bob, 4, 5);
    g.fillRect(27, rightY + 7 + bob, 4, 5);
  }

  const hy = 9 + bob;

  // Pescoço e orelhas
  g.fillStyle(skinShade);
  g.fillRect(18, hy + 14, 4, 4);
  g.fillStyle(skin);
  g.fillRect(8, hy + 7, 3, 5);
  g.fillRect(29, hy + 7, 3, 5);

  // Rosto
  g.fillStyle(skin);
  g.fillRect(12, hy, 16, 14);
  g.fillRect(13, hy - 2, 14, 2);
  g.fillRect(11, hy + 2, 2, 10);
  g.fillRect(27, hy + 2, 2, 10);
  g.fillRect(13, hy + 14, 14, 2);
  g.fillRect(15, hy + 16, 10, 1);
  g.fillStyle(0xf6d2b1);
  g.fillRect(14, hy + 1, 5, 2);
  g.fillStyle(skinShade);
  g.fillRect(15, hy + 15, 10, 1);

  // Cabelo curto e cacheado
  g.fillStyle(0x241c21);
  g.fillRect(11, hy - 5, 18, 7);
  g.fillRect(9, hy - 3, 4, 12);
  g.fillRect(27, hy - 3, 4, 11);
  g.fillStyle(hair);
  g.fillRect(12, hy - 5, 16, 5);
  g.fillRect(10, hy - 2, 4, 10);
  g.fillRect(27, hy - 2, 3, 9);
  g.fillRect(11, hy - 6, 5, 3);
  g.fillRect(17, hy - 7, 4, 3);
  g.fillRect(23, hy - 6, 5, 3);
  g.fillRect(28, hy - 4, 3, 4);
  g.fillRect(10, hy + 5, 2, 4);
  g.fillStyle(hairHi);
  g.fillRect(14, hy - 4, 5, 1);
  g.fillRect(23, hy - 3, 3, 1);
  g.fillRect(11, hy + 1, 2, 2);
  g.fillStyle(hair);
  g.fillRect(12, hy + 1, 4, 2);
  g.fillRect(19, hy + 1, 3, 2);
  g.fillRect(25, hy + 1, 3, 2);

  // Sobrancelhas e óculos redondos
  g.fillStyle(0x3a2c2f);
  g.fillRect(15, hy + 5, 4, 1);
  g.fillRect(22, hy + 5, 4, 1);
  g.fillStyle(0x18171d);
  // lentes (quadros com cantos arredondados)
  g.fillRect(14, hy + 6, 6, 1); g.fillRect(14, hy + 10, 6, 1);
  g.fillRect(14, hy + 7, 1, 3); g.fillRect(19, hy + 7, 1, 3);
  g.fillRect(21, hy + 6, 6, 1); g.fillRect(21, hy + 10, 6, 1);
  g.fillRect(21, hy + 7, 1, 3); g.fillRect(26, hy + 7, 1, 3);
  g.fillRect(20, hy + 8, 1, 1);
  g.fillStyle(0x3a3340);
  g.fillRect(16, hy + 8, 2, 2);
  g.fillRect(23, hy + 8, 2, 1);
  g.fillStyle(0xe8f2f5);
  g.fillRect(15, hy + 7, 1, 1);
  g.fillRect(22, hy + 7, 1, 1);
  g.fillStyle(0x2c2226);
  g.fillRect(20, hy + 11, 1, 2);
  g.fillRect(19, hy + 13, 2, 1);
  g.fillStyle(blush, 0.65);
  g.fillRect(12, hy + 11, 2, 1);
  g.fillRect(26, hy + 11, 2, 1);
  g.fillStyle(0x9a5d58);
  g.fillRect(17, hy + 13, 1, 1);
  g.fillRect(22, hy + 13, 1, 1);
  g.fillRect(19, hy + 14, 2, 1);
}

function drawAmada(g: Phaser.GameObjects.Graphics, pose: Pose): void {
  const bob = pose === 'idle1' || pose === 'walk1' || pose === 'walk3' ? 1 : 0;
  const jump = pose === 'jump';
  const hair = 0x2c2025;
  const hairHi = 0x4b313a;
  const skin = 0xf0c6a0;
  const skinShade = 0xd6a278;
  const blush = 0xef9fae;
  const dress = 0x4f7fc4;
  const dressHi = 0x6f9ddb;
  const dressDark = 0x3f67a3;
  const stockings = 0xe7d3c1;

  pixelEllipse(g, 20, 53, 12, 3, 0x1d2a22, 0.22);

  // Cabelo comprido atrás do corpo
  g.fillStyle(0x1f171b);
  g.fillRect(8, 7 + bob, 24, 34);
  g.fillRect(6, 14 + bob, 4, 22);
  g.fillRect(30, 14 + bob, 4, 24);
  g.fillStyle(hair);
  g.fillRect(9, 8 + bob, 22, 31);
  g.fillRect(7, 15 + bob, 3, 20);
  g.fillRect(30, 15 + bob, 3, 22);
  g.fillStyle(hairHi);
  g.fillRect(10, 10 + bob, 3, 14);
  g.fillRect(28, 18 + bob, 2, 12);

  // Pernas
  if (jump) {
    g.fillStyle(stockings); g.fillRect(15, 46, 4, 5); g.fillRect(21, 46, 4, 5);
    g.fillStyle(0xa96e63); g.fillRect(14, 49, 6, 3); g.fillRect(21, 49, 6, 3);
  } else {
    const leftX = pose === 'walk0' ? 15 : pose === 'walk2' ? 22 : 16;
    const rightX = pose === 'walk0' ? 22 : pose === 'walk2' ? 15 : 21;
    g.fillStyle(stockings);
    g.fillRect(leftX, 47, 4, 5);
    g.fillRect(rightX, 47, 4, 5);
    g.fillStyle(0xa96e63);
    g.fillRect(leftX - 1, 51, 6, 3);
    g.fillRect(rightX - 1, 51, 6, 3);
  }

  // Vestido azul
  g.fillStyle(dressDark);
  g.fillRect(13, 27 + bob, 14, 12);
  g.fillRect(10, 38 + bob, 20, 8);
  g.fillRect(9, 45 + bob, 22, 2);
  g.fillStyle(dress);
  g.fillRect(14, 27 + bob, 12, 11);
  g.fillRect(11, 38 + bob, 18, 7);
  g.fillStyle(dressHi);
  g.fillRect(15, 28 + bob, 2, 9);
  g.fillRect(12, 39 + bob, 3, 5);
  g.fillStyle(0xf6ead6);
  g.fillRect(17, 25 + bob, 6, 2);
  g.fillRect(18, 27 + bob, 1, 3);
  g.fillRect(21, 27 + bob, 1, 3);
  g.fillStyle(0xf0b6c4);
  g.fillRect(15, 36 + bob, 10, 2);
  g.fillRect(19, 38 + bob, 2, 2);
  g.fillStyle(dressDark);
  g.fillRect(19, 40 + bob, 2, 7);

  // Mangas bufantes e braços
  g.fillStyle(dressDark);
  g.fillRect(9, 27 + bob, 5, 6);
  g.fillRect(26, 27 + bob, 5, 6);
  g.fillStyle(dressHi);
  g.fillRect(10, 28 + bob, 3, 4);
  g.fillRect(27, 28 + bob, 3, 4);
  const armLift = jump ? 3 : 0;
  g.fillStyle(skin);
  g.fillRect(9, 33 + bob - armLift, 4, 6);
  g.fillRect(27, 33 + bob - armLift, 4, 6);

  const hy = 10 + bob;
  g.fillStyle(skinShade);
  g.fillRect(18, hy + 13, 4, 4);
  g.fillStyle(skin);
  g.fillRect(9, hy + 7, 3, 5);
  g.fillRect(28, hy + 7, 3, 5);

  // Rosto delicado
  g.fillStyle(skin);
  g.fillRect(13, hy, 14, 14);
  g.fillRect(14, hy - 2, 12, 2);
  g.fillRect(12, hy + 2, 2, 10);
  g.fillRect(26, hy + 2, 2, 10);
  g.fillRect(14, hy + 14, 12, 2);
  g.fillRect(16, hy + 16, 8, 1);
  g.fillStyle(0xf8d7b8);
  g.fillRect(15, hy + 1, 4, 2);
  g.fillStyle(skinShade);
  g.fillRect(16, hy + 15, 8, 1);

  // Cabelo frontal com repartição
  g.fillStyle(hair);
  g.fillRect(12, hy - 5, 17, 5);
  g.fillRect(10, hy - 3, 4, 11);
  g.fillRect(27, hy - 3, 4, 13);
  g.fillRect(13, hy - 6, 6, 3);
  g.fillRect(20, hy - 7, 5, 3);
  g.fillRect(26, hy - 4, 3, 3);
  g.fillRect(11, hy + 5, 2, 5);
  g.fillStyle(hairHi);
  g.fillRect(15, hy - 4, 4, 1);
  g.fillRect(24, hy - 3, 3, 1);
  g.fillStyle(hair);
  g.fillRect(15, hy + 1, 4, 3);
  g.fillRect(23, hy + 1, 3, 3);
  g.fillStyle(0xffd873);
  g.fillRect(14, hy - 1, 2, 2);

  // Trança lateral
  for (let i = 0; i < 5; i++) {
    const bx = 29 + (i % 2 === 0 ? 0 : 1);
    const by = hy + 5 + i * 5;
    g.fillStyle(hair);
    g.fillRect(bx, by, 4, 5);
    g.fillStyle(hairHi);
    g.fillRect(bx + 1, by + 1, 1, 3);
  }
  g.fillStyle(0xf0a8b8);
  g.fillRect(29, hy + 30, 5, 2);

  // Olhos expressivos
  g.fillStyle(0x3a2c30);
  g.fillRect(16, hy + 6, 4, 1);
  g.fillRect(22, hy + 6, 4, 1);
  g.fillStyle(0xffffff);
  g.fillRect(16, hy + 7, 3, 3);
  g.fillRect(22, hy + 7, 3, 3);
  g.fillStyle(0x3b2a33);
  g.fillRect(17, hy + 8, 2, 2);
  g.fillRect(23, hy + 8, 2, 2);
  g.fillStyle(0xffffff);
  g.fillRect(17, hy + 7, 1, 1);
  g.fillRect(23, hy + 7, 1, 1);
  g.fillStyle(0x3a2c30);
  g.fillRect(15, hy + 6, 1, 1);
  g.fillRect(20, hy + 6, 1, 1);
  g.fillRect(15, hy + 7, 1, 2);
  g.fillRect(21, hy + 7, 1, 2);
  g.fillStyle(0x2c2226);
  g.fillRect(19, hy + 11, 1, 2);
  g.fillRect(18, hy + 13, 2, 1);
  g.fillStyle(blush, 0.7);
  g.fillRect(13, hy + 11, 3, 1);
  g.fillRect(25, hy + 11, 3, 1);
  g.fillStyle(0xd37f88);
  g.fillRect(18, hy + 14, 4, 1);
}

function drawCat(g: Phaser.GameObjects.Graphics, palette: CatPalette, frame: number): void {
  const blink = frame === 1;
  const lift = blink ? 1 : 0;
  const outline = 0x3b2d35;
  pixelEllipse(g, 16, 25, 12, 3, 0x1d2a22, 0.2);

  // Cauda
  g.fillStyle(outline);
  g.fillRect(24, 12 - lift, 3, 12);
  g.fillRect(26, 9 - lift, 4, 4);
  g.fillRect(29, 7 - lift, 3, 5);
  g.fillStyle(palette.fur);
  g.fillRect(25, 12 - lift, 2, 10);
  g.fillRect(27, 9 - lift, 3, 3);
  g.fillRect(30, 8 - lift, 1, 3);

  // Corpo
  g.fillStyle(outline);
  g.fillRect(7, 13, 19, 11);
  g.fillRect(9, 22, 15, 3);
  g.fillStyle(palette.fur);
  g.fillRect(8, 14, 17, 9);
  g.fillRect(10, 22, 13, 2);
  g.fillStyle(palette.furDark);
  g.fillRect(9, 19, 3, 4);
  g.fillRect(21, 18, 3, 5);
  g.fillStyle(0xf7e8d5);
  g.fillRect(13, 17, 7, 6);
  g.fillStyle(palette.furDark);
  g.fillRect(7, 23, 4, 2);
  g.fillRect(21, 23, 4, 2);

  const hy = lift;
  // Cabeça com contorno
  g.fillStyle(outline);
  g.fillRect(5, 5 + hy, 19, 12);
  g.fillRect(6, 3 + hy, 5, 5);
  g.fillRect(19, 3 + hy, 5, 5);
  g.fillStyle(palette.fur);
  g.fillRect(6, 6 + hy, 17, 10);
  g.fillRect(7, 4 + hy, 3, 4);
  g.fillRect(20, 4 + hy, 3, 4);
  g.fillStyle(palette.accent);
  g.fillRect(8, 4 + hy, 2, 2);
  g.fillRect(21, 4 + hy, 2, 2);

  // Listras
  g.fillStyle(palette.furDark);
  g.fillRect(9, 6 + hy, 4, 1);
  g.fillRect(15, 6 + hy, 3, 1);
  g.fillRect(20, 6 + hy, 3, 1);
  g.fillRect(8, 8 + hy, 2, 2);
  g.fillRect(22, 8 + hy, 2, 2);

  // Rostinho
  g.fillStyle(0xf7e8d5);
  g.fillRect(11, 12 + hy, 8, 4);
  g.fillStyle(palette.eye);
  if (blink) {
    g.fillRect(10, 11 + hy, 3, 1);
    g.fillRect(19, 11 + hy, 3, 1);
  } else {
    g.fillRect(10, 10 + hy, 3, 3);
    g.fillRect(19, 10 + hy, 3, 3);
    g.fillStyle(0x241c21);
    g.fillRect(11, 11 + hy, 1, 2);
    g.fillRect(20, 11 + hy, 1, 2);
  }
  g.fillStyle(palette.nose);
  g.fillRect(14, 13 + hy, 2, 1);
  g.fillStyle(0x5a4048);
  g.fillRect(15, 14 + hy, 1, 1);
  g.fillRect(14, 15 + hy, 1, 1);
  g.fillRect(16, 15 + hy, 1, 1);
  g.lineStyle(1, 0xcfc2b5, 0.8);
  g.lineBetween(11, 14 + hy, 6, 13 + hy);
  g.lineBetween(11, 15 + hy, 6, 16 + hy);
  g.lineBetween(20, 14 + hy, 25, 13 + hy);
  g.lineBetween(20, 15 + hy, 25, 16 + hy);
  g.fillStyle(0xef9fae, 0.7);
  g.fillRect(8, 13 + hy, 2, 1);
  g.fillRect(22, 13 + hy, 2, 1);
}

function drawBunny(g: Phaser.GameObjects.Graphics, pink: boolean, frame: number): void {
  const bob = frame === 1 ? 1 : 0;
  const fur = pink ? 0xe9c4c8 : 0xd8c3a7;
  const furDark = pink ? 0xcfa2a9 : 0xbba58a;
  const dress = pink ? 0xc98798 : 0x7f9c74;
  const dressHi = pink ? 0xe0a3b2 : 0x9ab88c;
  const outline = 0x4a3740;
  pixelEllipse(g, 17, 44, 12, 3, 0x1d2a22, 0.2);

  // Orelhas longas
  g.fillStyle(outline);
  g.fillRect(9, 2 + bob, 6, 16);
  g.fillRect(20, 1 + bob, 6, 17);
  g.fillStyle(fur);
  g.fillRect(10, 3 + bob, 4, 14);
  g.fillRect(21, 2 + bob, 4, 15);
  g.fillStyle(0xf3b4c0);
  g.fillRect(11, 6 + bob, 2, 8);
  g.fillRect(22, 5 + bob, 2, 9);

  // Pés
  g.fillStyle(furDark);
  g.fillRect(11, 41, 6, 4);
  g.fillRect(19, 41, 6, 4);

  // Corpo / avental
  g.fillStyle(outline);
  g.fillRect(10, 23 + bob, 15, 19);
  g.fillStyle(dress);
  g.fillRect(11, 24 + bob, 13, 17);
  g.fillStyle(dressHi);
  g.fillRect(12, 25 + bob, 3, 12);
  g.fillStyle(0xf3e7d2);
  g.fillRect(16, 28 + bob, 5, 12);
  g.fillStyle(0xe8b7c1);
  g.fillRect(16, 28 + bob, 5, 2);

  // Braços
  g.fillStyle(fur);
  g.fillRect(7, 26 + bob, 4, 8);
  g.fillRect(24, 26 + bob, 4, 8);

  // Cabeça
  g.fillStyle(outline);
  g.fillRect(8, 12 + bob, 19, 14);
  g.fillStyle(fur);
  g.fillRect(9, 13 + bob, 17, 12);
  g.fillStyle(furDark);
  g.fillRect(10, 14 + bob, 2, 3);
  g.fillStyle(0x3b2a33);
  g.fillRect(12, 18 + bob, 3, 3);
  g.fillRect(20, 18 + bob, 3, 3);
  g.fillStyle(0xffffff);
  g.fillRect(12, 18 + bob, 1, 1);
  g.fillRect(20, 18 + bob, 1, 1);
  g.fillStyle(0xd98796);
  g.fillRect(16, 21 + bob, 2, 2);
  g.fillStyle(0x8a5c63);
  g.fillRect(16, 23 + bob, 2, 1);
  g.fillStyle(0xef9fae, 0.7);
  g.fillRect(10, 21 + bob, 2, 1);
  g.fillRect(23, 21 + bob, 2, 1);
}

/* ─────────────────────────  CENÁRIO  ───────────────────────── */

function makeTiles(scene: Phaser.Scene): void {
  type TileSpec = { key: string; base: number; specks: number[]; accent: number };
  const specs: TileSpec[] = [
    { key: 'tile-grass', base: 0x78a969, specks: [0x6b9c5e, 0x88b977, 0x9ac785, 0x5f8f55], accent: 0xf3d9a3 },
    { key: 'tile-forest', base: 0x517d5c, specks: [0x466f52, 0x5f8f68, 0x6d9c72, 0x3f6549], accent: 0x8bc5a1 },
    { key: 'tile-village', base: 0x8db47a, specks: [0x7fa86e, 0x9bc287, 0x6f9861, 0xaacf94], accent: 0xe8cf9c },
    { key: 'tile-path', base: 0xd8bd8c, specks: [0xc9ac7b, 0xe4c99a, 0xbfa070, 0xefd8b0], accent: 0xa88b67 },
    { key: 'tile-stone', base: 0x8d8d9b, specks: [0x7c7c8b, 0x9c9caa, 0xb0b0bc, 0x6e6e7d], accent: 0xc6c6d0 },
  ];

  specs.forEach((spec, tileIndex) => {
    paint(scene, spec.key, 32, 32, (g) => {
      g.fillStyle(spec.base).fillRect(0, 0, 32, 32);
      let seed = 97 + tileIndex * 131;
      const rnd = () => {
        seed = (seed * 16807) % 2147483647;
        return seed / 2147483647;
      };
      for (let i = 0; i < 34; i++) {
        const x = Math.floor(rnd() * 32);
        const y = Math.floor(rnd() * 32);
        const size = rnd() > 0.75 ? 2 : 1;
        g.fillStyle(spec.specks[i % spec.specks.length], 0.55 + rnd() * 0.35);
        g.fillRect(x, y, size, size);
      }
      if (spec.key === 'tile-grass' || spec.key === 'tile-village') {
        for (let i = 0; i < 3; i++) {
          const x = 4 + Math.floor(rnd() * 24);
          const y = 6 + Math.floor(rnd() * 22);
          g.fillStyle(0x5d8c50, 0.7);
          g.fillRect(x, y, 1, 3);
          g.fillRect(x + 2, y + 1, 1, 2);
        }
        g.fillStyle(spec.accent, 0.85);
        g.fillRect(20, 8, 2, 2);
        g.fillRect(9, 24, 2, 2);
      }
      if (spec.key === 'tile-path') {
        g.fillStyle(spec.accent, 0.6);
        g.fillRect(4, 9, 3, 2);
        g.fillRect(21, 20, 4, 2);
        g.fillRect(14, 4, 2, 2);
      }
      if (spec.key === 'tile-stone') {
        g.fillStyle(0x6d6d7c, 0.7);
        g.fillRect(0, 15, 32, 1);
        g.fillRect(15, 0, 1, 15);
        g.fillRect(8, 16, 1, 16);
        g.fillRect(24, 16, 1, 16);
      }
      if (spec.key === 'tile-forest') {
        g.fillStyle(0x3a5f45, 0.65);
        g.fillRect(6, 18, 4, 2);
        g.fillRect(24, 7, 3, 2);
        g.fillStyle(0x7fb08a, 0.5);
        g.fillRect(13, 27, 2, 2);
      }
    });
  });

  paint(scene, 'tile-water', 32, 32, (g) => {
    g.fillStyle(0x5f9fb0).fillRect(0, 0, 32, 32);
    g.fillStyle(0x6fb2c1).fillRect(0, 5, 32, 2).fillRect(4, 18, 20, 2).fillRect(14, 27, 18, 2);
    g.fillStyle(0xa8d9dc, 0.8).fillRect(8, 10, 7, 1).fillRect(22, 23, 6, 1);
    g.fillStyle(0x4b8798, 0.6).fillRect(0, 12, 12, 2).fillRect(18, 30, 14, 2);
  });
}

function makeProps(scene: Phaser.Scene): void {
  // Árvore frondosa
  paint(scene, 'tree-round', 56, 78, (g) => {
    pixelEllipse(g, 28, 73, 19, 4, 0x1d2a22, 0.18);
    g.fillStyle(0x4a3226); g.fillRect(24, 44, 9, 31);
    g.fillStyle(0x6f4a35); g.fillRect(25, 44, 7, 30);
    g.fillStyle(0x80573d); g.fillRect(26, 46, 2, 20);
    g.fillStyle(0x3a271f); g.fillRect(20, 72, 7, 3); g.fillRect(30, 72, 7, 3);
    pixelEllipse(g, 28, 27, 26, 23, 0x2f6440);
    pixelEllipse(g, 28, 27, 23, 20, 0x478256);
    pixelEllipse(g, 20, 20, 11, 9, 0x5b9966);
    pixelEllipse(g, 37, 25, 10, 9, 0x3f7a4d);
    pixelEllipse(g, 28, 16, 10, 8, 0x6aa974);
    g.fillStyle(0x89c28a);
    g.fillRect(17, 16, 3, 2); g.fillRect(24, 12, 2, 2); g.fillRect(33, 18, 3, 2);
    g.fillStyle(0xf3d9a3); g.fillRect(12, 27, 2, 2); g.fillRect(41, 33, 2, 2);
  });

  paint(scene, 'tree-pine', 50, 84, (g) => {
    pixelEllipse(g, 25, 80, 16, 4, 0x1d2a22, 0.18);
    g.fillStyle(0x3f2c23); g.fillRect(21, 58, 8, 22);
    g.fillStyle(0x5c402f); g.fillRect(22, 58, 6, 21);
    g.fillStyle(0x274d37);
    triangleTier(g, 25, 34, 28, 22, 0x2b5b3e);
    triangleTier(g, 25, 22, 24, 18, 0x2f6644);
    triangleTier(g, 25, 10, 20, 14, 0x357049);
    g.fillStyle(0x4e8b5c);
    g.fillRect(18, 42, 3, 2); g.fillRect(27, 30, 3, 2); g.fillRect(23, 16, 2, 2);
    g.fillStyle(0x6fa778);
    g.fillRect(12, 52, 2, 2); g.fillRect(34, 40, 2, 2);
    g.fillStyle(0xf3d9a3); g.fillRect(36, 52, 2, 2);
  });

  paint(scene, 'bush', 36, 26, (g) => {
    pixelEllipse(g, 18, 22, 15, 4, 0x1d2a22, 0.16);
    pixelEllipse(g, 18, 14, 16, 11, 0x2f6440);
    pixelEllipse(g, 18, 13, 14, 9, 0x4c8755);
    pixelEllipse(g, 11, 10, 7, 5, 0x619b65);
    g.fillStyle(0x87bf7f); g.fillRect(15, 8, 2, 2); g.fillRect(23, 12, 2, 2);
    g.fillStyle(0xf0a8b8); g.fillRect(10, 17, 2, 2);
  });

  paint(scene, 'rock', 26, 20, (g) => {
    pixelEllipse(g, 13, 17, 11, 3, 0x1d2a22, 0.16);
    pixelEllipse(g, 13, 11, 12, 8, 0x6f6f7d);
    pixelEllipse(g, 11, 9, 9, 5, 0x8b8b98);
    g.fillStyle(0xa6a6b0); g.fillRect(7, 7, 5, 2);
    g.fillStyle(0x595966); g.fillRect(16, 13, 4, 2);
  });

  const mushroom = (key: string, cap: number, capHi: number, spots: number, glow: boolean) => {
    paint(scene, key, 26, 30, (g) => {
      if (glow) pixelEllipse(g, 13, 17, 13, 11, 0x6fe0d0, 0.16);
      pixelEllipse(g, 13, 27, 9, 3, 0x1d2a22, 0.18);
      g.fillStyle(0xe8d9c0); g.fillRect(9, 16, 8, 11);
      g.fillStyle(0xcdbda3); g.fillRect(10, 17, 2, 9);
      g.fillStyle(0x4a2b33); g.fillRect(5, 9, 16, 8);
      pixelEllipse(g, 13, 11, 11, 7, cap);
      pixelEllipse(g, 11, 9, 7, 4, capHi);
      g.fillStyle(spots); g.fillRect(7, 9, 3, 2); g.fillRect(15, 8, 2, 2); g.fillRect(19, 12, 2, 2);
      if (glow) g.fillStyle(0xd8fff8, 0.75).fillRect(9, 6, 2, 2);
    });
  };
  mushroom('mushroom-red', 0xd46a6a, 0xf09288, 0xf8e3d0, false);
  mushroom('mushroom-teal', 0x4fb3ad, 0x8adfd6, 0xd8fff8, true);

  const flower = (key: string, petal: number, petalHi: number) => {
    paint(scene, key, 14, 20, (g) => {
      g.fillStyle(0x3f6f45); g.fillRect(6, 12, 2, 7);
      g.fillStyle(0x5f9b68); g.fillRect(3, 15, 4, 2); g.fillRect(8, 16, 4, 2);
      g.fillStyle(petal);
      g.fillRect(4, 3, 6, 3); g.fillRect(2, 5, 3, 4); g.fillRect(9, 5, 3, 4); g.fillRect(4, 9, 6, 2);
      g.fillStyle(petalHi);
      g.fillRect(5, 4, 2, 1); g.fillRect(10, 5, 1, 2);
      g.fillStyle(0xffe58b); g.fillRect(5, 5, 4, 4);
      g.fillStyle(0xf7c76a); g.fillRect(6, 6, 2, 2);
    });
  };
  flower('flower-pink', 0xf18ca9, 0xffb9c9);
  flower('flower-yellow', 0xf2d06b, 0xffe89c);
  flower('flower-blue', 0x7fa7dd, 0xa9c7f0);

  paint(scene, 'lantern', 18, 48, (g) => {
    g.fillStyle(0x3a3038); g.fillRect(8, 18, 3, 28);
    g.fillStyle(0x51424c); g.fillRect(9, 18, 1, 27);
    g.fillStyle(0x3a3038); g.fillRect(5, 44, 9, 3);
    g.fillStyle(0x51424c); g.fillRect(7, 12, 5, 7);
    g.fillStyle(0xffd77e, 0.35); g.fillCircle(9, 10, 9);
    g.fillStyle(0xffd77e); g.fillRect(6, 6, 7, 8);
    g.fillStyle(0xfff3c4); g.fillRect(8, 7, 3, 5);
    g.fillStyle(0x3a3038); g.fillRect(5, 4, 9, 2); g.fillRect(6, 12, 7, 2);
    g.fillStyle(0xffdf8a, 0.2); g.fillRect(2, 2, 14, 14);
  });

  paint(scene, 'sign', 44, 36, (g) => {
    g.fillStyle(0x4a3226); g.fillRect(20, 20, 5, 15);
    g.fillStyle(0x6f4a35); g.fillRect(21, 20, 3, 15);
    g.fillStyle(0x4a3226); g.fillRect(4, 4, 36, 20);
    g.fillStyle(0xb98a5b); g.fillRect(6, 6, 32, 16);
    g.fillStyle(0xd9ab78); g.fillRect(7, 7, 30, 3);
    g.fillStyle(0x6a4a36); g.fillRect(10, 13, 20, 2); g.fillRect(10, 17, 13, 2);
    g.fillStyle(0xf0d8a8); g.fillRect(33, 12, 2, 2);
  });

  paint(scene, 'fence', 50, 30, (g) => {
    g.fillStyle(0x5a3e2e); g.fillRect(2, 8, 46, 4); g.fillRect(2, 18, 46, 4);
    g.fillStyle(0x7d583f); g.fillRect(3, 9, 44, 2); g.fillRect(3, 19, 44, 2);
    for (const x of [4, 18, 32, 44]) {
      g.fillStyle(0x4b3327); g.fillRect(x, 5, 5, 23);
      g.fillStyle(0x876144); g.fillRect(x + 1, 6, 3, 21);
      g.fillStyle(0xa37a56); g.fillRect(x + 2, 7, 1, 17);
    }
  });

  paint(scene, 'house-cottage', 126, 102, (g) => {
    pixelEllipse(g, 63, 98, 52, 5, 0x1d2a22, 0.18);
    g.fillStyle(0x4f3a34); g.fillRect(16, 40, 94, 58);
    g.fillStyle(0xf0dcc0); g.fillRect(19, 42, 88, 54);
    g.fillStyle(0xdfc7a6); g.fillRect(19, 82, 88, 14);
    // telhado
    g.fillStyle(0x5e3338); g.fillTriangle(7, 43, 63, 6, 119, 43);
    g.fillStyle(0x8b4d4d); g.fillTriangle(12, 42, 63, 11, 114, 42);
    g.fillStyle(0xa9615e); g.fillTriangle(22, 39, 63, 16, 104, 39);
    g.fillStyle(0x6f3a40); g.fillRect(100, 14, 12, 24);
    g.fillStyle(0x9a5b5c); g.fillRect(101, 13, 10, 3);
    // porta e janelas
    g.fillStyle(0x4a3226); g.fillRect(56, 66, 20, 30);
    g.fillStyle(0x7d5136); g.fillRect(58, 68, 16, 28);
    g.fillStyle(0xffd77e); g.fillRect(60, 71, 12, 9);
    g.fillStyle(0x6a452f); g.fillRect(66, 83, 6, 13);
    g.fillStyle(0xffd77e); g.fillRect(28, 58, 18, 15);
    g.fillRect(84, 58, 18, 15);
    g.fillStyle(0x6a452f); g.fillRect(36, 58, 2, 15); g.fillRect(92, 58, 2, 15);
    g.fillStyle(0x8b6c4f); g.fillRect(28, 72, 18, 2); g.fillRect(84, 72, 18, 2);
    // floreiras
    g.fillStyle(0x6a452f); g.fillRect(27, 76, 20, 3); g.fillRect(83, 76, 20, 3);
    g.fillStyle(0xf18ca9); g.fillRect(29, 74, 2, 2); g.fillRect(34, 74, 2, 2); g.fillRect(39, 74, 2, 2);
    g.fillStyle(0xf2d06b); g.fillRect(85, 74, 2, 2); g.fillRect(90, 74, 2, 2); g.fillRect(95, 74, 2, 2);
    g.fillStyle(0xc7ad8c); g.fillRect(18, 92, 90, 4);
  });

  paint(scene, 'house-tall', 110, 140, (g) => {
    pixelEllipse(g, 55, 136, 45, 5, 0x1d2a22, 0.18);
    g.fillStyle(0x4f3a34); g.fillRect(12, 44, 86, 90);
    g.fillStyle(0xe8d3b4); g.fillRect(15, 46, 80, 86);
    g.fillStyle(0xd4ba98); g.fillRect(15, 88, 80, 6);
    g.fillStyle(0x533036); g.fillTriangle(4, 48, 55, 8, 106, 48);
    g.fillStyle(0x7d4448); g.fillTriangle(10, 46, 55, 15, 100, 46);
    g.fillStyle(0x9a5b5c); g.fillTriangle(20, 42, 55, 20, 90, 42);
    g.fillStyle(0x8c5a3e); g.fillRect(84, 16, 11, 25);
    g.fillStyle(0xb77a56); g.fillRect(85, 15, 9, 3);
    // janelas superiores
    g.fillStyle(0xffd77e); g.fillRect(27, 60, 18, 17); g.fillRect(65, 60, 18, 17);
    g.fillStyle(0x6a452f); g.fillRect(35, 60, 2, 17); g.fillRect(73, 60, 2, 17);
    g.fillRect(27, 67, 18, 2); g.fillRect(65, 67, 18, 2);
    // porta
    g.fillStyle(0x4a3226); g.fillRect(45, 104, 22, 28);
    g.fillStyle(0x7d5136); g.fillRect(47, 106, 18, 26);
    g.fillStyle(0xffd77e); g.fillRect(49, 109, 14, 8);
    g.fillStyle(0xd9a24e); g.fillRect(60, 121, 2, 2);
    g.fillStyle(0xc7ad8c); g.fillRect(14, 130, 82, 3);
  });

  paint(scene, 'stall', 100, 80, (g) => {
    pixelEllipse(g, 50, 76, 40, 4, 0x1d2a22, 0.16);
    g.fillStyle(0x5a3e2e); g.fillRect(10, 34, 80, 40);
    g.fillStyle(0x8a5f3e); g.fillRect(12, 48, 76, 24);
    g.fillStyle(0x6a452f); g.fillRect(12, 46, 76, 3);
    for (let i = 0; i < 5; i++) {
      g.fillStyle(i % 2 ? 0xf0d8a8 : 0xc96a72); g.fillRect(8 + i * 17, 24, 17, 12);
    }
    g.fillStyle(0xf6e6c8); g.fillRect(6, 34, 88, 3);
    g.fillStyle(0xd9a24e); g.fillRect(19, 54, 8, 6); g.fillRect(40, 52, 9, 8);
    g.fillStyle(0xef9fae); g.fillRect(64, 53, 8, 7);
    g.fillStyle(0x8bc5a1); g.fillRect(20, 53, 6, 2); g.fillRect(65, 52, 6, 2);
  });

  paint(scene, 'well', 66, 66, (g) => {
    pixelEllipse(g, 33, 62, 28, 4, 0x1d2a22, 0.18);
    g.fillStyle(0x5a5a68); g.fillRect(12, 40, 42, 20);
    g.fillStyle(0x8d8d9b); g.fillRect(14, 41, 38, 17);
    g.fillStyle(0x767684); g.fillRect(14, 47, 38, 2);
    g.fillStyle(0x3f6d78); g.fillRect(18, 30, 30, 13);
    g.fillStyle(0x6fb2c1); g.fillRect(20, 31, 26, 9);
    g.fillStyle(0xa8d9dc, 0.8); g.fillRect(23, 34, 8, 2);
    g.fillStyle(0x5a3e2e); g.fillRect(10, 12, 4, 32); g.fillRect(52, 12, 4, 32);
    g.fillStyle(0x7d583f); g.fillRect(12, 12, 2, 30); g.fillRect(53, 12, 2, 30);
    g.fillStyle(0x4f3a34); g.fillTriangle(8, 14, 33, 2, 58, 14);
    g.fillStyle(0x7d4448); g.fillTriangle(12, 13, 33, 5, 54, 13);
    g.fillStyle(0x8c7c66); g.fillRect(30, 14, 6, 8);
    g.fillStyle(0xffd77e); g.fillRect(31, 15, 4, 4);
  });

  paint(scene, 'bench', 50, 30, (g) => {
    g.fillStyle(0x4a3226); g.fillRect(4, 8, 42, 4);
    g.fillStyle(0x8a5f3e); g.fillRect(5, 9, 40, 2);
    g.fillStyle(0x6a452f); g.fillRect(8, 16, 34, 4);
    g.fillStyle(0x8a5f3e); g.fillRect(9, 17, 32, 2);
    g.fillStyle(0x4a3226); g.fillRect(7, 14, 4, 14); g.fillRect(39, 14, 4, 14);
    g.fillStyle(0x876144); g.fillRect(8, 15, 2, 12); g.fillRect(40, 15, 2, 12);
  });

  paint(scene, 'portal', 88, 108, (g) => {
    g.fillStyle(0x2a3d46); g.fillRect(10, 34, 68, 70);
    g.fillStyle(0x5b7c86); g.fillRect(10, 30, 68, 8);
    g.fillStyle(0x4a6a77); g.fillRect(6, 44, 10, 60); g.fillRect(72, 44, 10, 60);
    g.fillStyle(0x6f929c); g.fillRect(8, 44, 6, 58); g.fillRect(74, 44, 6, 58);
    for (let i = 0; i < 7; i++) {
      const w = 8 + i * 6;
      g.fillStyle(0x5f8792);
      g.fillRect(44 - w, 34 - i * 4, w * 2, 4);
    }
    g.fillStyle(0x7fb3c4); g.fillRect(17, 48, 54, 52);
    g.fillStyle(0x4f7fc4, 0.8); g.fillRect(20, 51, 48, 48);
    g.fillStyle(0xa8d9dc, 0.55); g.fillRect(24, 55, 16, 40);
    g.fillStyle(0xfff3c4, 0.9);
    g.fillRect(28, 60, 2, 2); g.fillRect(46, 68, 2, 2); g.fillRect(56, 58, 2, 2);
    g.fillRect(37, 82, 2, 2); g.fillRect(52, 86, 2, 2);
    g.fillStyle(0xdfe8ee, 0.35); g.fillRect(23, 55, 5, 2);
    g.fillStyle(0x8b6c4f); g.fillRect(34, 100, 20, 7);
    g.fillStyle(0x4a3226); g.fillRect(33, 100, 22, 2);
  });
}

function makeItemsAndEffects(scene: Phaser.Scene): void {
  paint(scene, 'star', 22, 22, (g) => {
    const points = [
      new Phaser.Geom.Point(11, 1), new Phaser.Geom.Point(13.6, 7.3), new Phaser.Geom.Point(20.4, 7.3),
      new Phaser.Geom.Point(14.8, 11.6), new Phaser.Geom.Point(16.9, 18.6), new Phaser.Geom.Point(11, 14.4),
      new Phaser.Geom.Point(5.1, 18.6), new Phaser.Geom.Point(7.2, 11.6), new Phaser.Geom.Point(1.6, 7.3),
      new Phaser.Geom.Point(8.4, 7.3),
    ];
    g.fillStyle(0xc99a3f); g.fillPoints(points, true);
    g.fillStyle(0xffd873); g.fillPoints(points.map((p) => new Phaser.Geom.Point(11 + (p.x - 11) * 0.8, 10 + (p.y - 10) * 0.8)), true);
    g.fillStyle(0xfff3bd); g.fillRect(9, 7, 3, 5); g.fillRect(7, 10, 3, 2);
  });

  paint(scene, 'sparkle', 16, 16, (g) => {
    g.fillStyle(0xfff3bd, 0.28); g.fillCircle(8, 8, 7);
    g.fillStyle(0xffdf7e); g.fillRect(7, 1, 2, 14); g.fillRect(1, 7, 14, 2);
    g.fillStyle(0xffffff); g.fillRect(7, 5, 2, 6); g.fillRect(5, 7, 6, 2);
  });

  paint(scene, 'heart', 13, 12, (g) => {
    g.fillStyle(0x9d4e63); g.fillRect(2, 2, 4, 2); g.fillRect(8, 2, 4, 2);
    g.fillRect(1, 4, 12, 3); g.fillRect(2, 7, 10, 2); g.fillRect(4, 9, 6, 2); g.fillRect(6, 11, 2, 1);
    g.fillStyle(0xf18ca9); g.fillRect(2, 3, 3, 2); g.fillRect(8, 3, 3, 2);
    g.fillRect(2, 5, 9, 2); g.fillRect(4, 7, 5, 2);
    g.fillStyle(0xffc3d0); g.fillRect(3, 4, 2, 2);
  });

  paint(scene, 'pixel', 3, 3, (g) => {
    g.fillStyle(0xffffff); g.fillRect(0, 0, 3, 3);
  });

  [['glow-gold', 0xffd873], ['glow-blue', 0x7fc4dd], ['glow-pink', 0xf18ca9]].forEach(([key, color]) => {
    paint(scene, key as string, 72, 72, (g) => {
      const c = color as number;
      g.fillStyle(c, 0.05); g.fillCircle(36, 36, 36);
      g.fillStyle(c, 0.08); g.fillCircle(36, 36, 27);
      g.fillStyle(c, 0.12); g.fillCircle(36, 36, 19);
      g.fillStyle(c, 0.18); g.fillCircle(36, 36, 12);
    });
  });

  paint(scene, 'fish-toy', 24, 16, (g) => {
    g.fillStyle(0x3f67a3); g.fillRect(4, 4, 12, 8);
    g.fillStyle(0x6f9ddb); g.fillRect(5, 5, 10, 5);
    g.fillStyle(0x3f67a3); g.fillRect(1, 4, 4, 3); g.fillRect(1, 9, 4, 3); g.fillRect(0, 7, 3, 2);
    g.fillStyle(0xa9c7f0); g.fillRect(8, 5, 4, 2);
    g.fillStyle(0x2b2a35); g.fillRect(15, 6, 2, 2);
    g.fillStyle(0xf6e6c8); g.fillRect(18, 3, 5, 2); g.fillRect(17, 4, 7, 2);
    g.fillStyle(0xffffff); g.fillRect(15, 6, 1, 1);
  });

  paint(scene, 'bell', 18, 20, (g) => {
    g.fillStyle(0xc99a3f); g.fillRect(5, 5, 8, 3); g.fillRect(4, 8, 10, 5); g.fillRect(3, 13, 12, 3);
    g.fillStyle(0xffd873); g.fillRect(6, 5, 6, 2); g.fillRect(5, 7, 8, 6); g.fillRect(4, 13, 10, 2);
    g.fillStyle(0xfff3bd); g.fillRect(6, 7, 2, 5);
    g.fillStyle(0xc99a3f); g.fillRect(8, 1, 2, 3); g.fillRect(8, 16, 2, 3);
    g.fillStyle(0x8c6a2f); g.fillRect(8, 4, 2, 2);
    g.fillStyle(0xffdf7e, 0.25); g.fillCircle(9, 10, 8);
  });

  paint(scene, 'lantern-item', 20, 26, (g) => {
    g.fillStyle(0x3a3038); g.fillRect(8, 1, 4, 4);
    g.fillStyle(0x51424c); g.fillRect(4, 5, 12, 4);
    g.fillStyle(0xffd77e, 0.3); g.fillCircle(10, 15, 9);
    g.fillStyle(0xffd77e); g.fillRect(5, 9, 10, 11);
    g.fillStyle(0xfff3c4); g.fillRect(7, 11, 5, 6);
    g.fillStyle(0x51424c); g.fillRect(4, 20, 12, 3); g.fillRect(6, 23, 8, 2);
    g.fillStyle(0xffdf7e); g.fillRect(9, 10, 2, 9);
  });
}

/* ─────────────────────────  API PÚBLICA  ───────────────────────── */

export function buildAllTextures(scene: Phaser.Scene): void {
  makeTiles(scene);
  makeProps(scene);
  makeItemsAndEffects(scene);

  const poses: Pose[] = ['idle0', 'idle1', 'walk0', 'walk1', 'walk2', 'walk3', 'jump'];
  poses.forEach((pose) => {
    paint(scene, `cristian-${pose}`, 40, 56, (g) => drawCristian(g, pose));
    paint(scene, `amada-${pose}`, 40, 56, (g) => drawAmada(g, pose));
  });

  Object.entries(CAT_PALETTES).forEach(([variant, palette]) => {
    paint(scene, `cat-${variant}-0`, 34, 28, (g) => drawCat(g, palette, 0));
    paint(scene, `cat-${variant}-1`, 34, 28, (g) => drawCat(g, palette, 1));
  });

  paint(scene, 'bunny-0', 36, 46, (g) => drawBunny(g, false, 0));
  paint(scene, 'bunny-1', 36, 46, (g) => drawBunny(g, false, 1));
  paint(scene, 'bunny-pink-0', 36, 46, (g) => drawBunny(g, true, 0));
  paint(scene, 'bunny-pink-1', 36, 46, (g) => drawBunny(g, true, 1));
}

export function buildAnimations(scene: Phaser.Scene): void {
  const register = (
    key: string,
    frames: string[],
    frameRate: number,
    repeat: number,
  ): void => {
    if (scene.anims.exists(key)) return;
    scene.anims.create({
      key,
      frames: frames.map((frameKey) => ({ key: frameKey })),
      frameRate,
      repeat,
    });
  };

  register('cristian-idle', ['cristian-idle-0', 'cristian-idle-1'], 2, -1);
  register('cristian-walk', ['cristian-walk-0', 'cristian-walk-1', 'cristian-walk-2', 'cristian-walk-3'], 9, -1);
  register('cristian-jump', ['cristian-jump'], 1, 0);
  register('amada-idle', ['amada-idle-0', 'amada-idle-1'], 2, -1);
  register('amada-walk', ['amada-walk-0', 'amada-walk-1', 'amada-walk-2', 'amada-walk-3'], 9, -1);
  register('amada-jump', ['amada-jump'], 1, 0);

  Object.keys(CAT_PALETTES).forEach((variant) => {
    register(`cat-${variant}-idle`, [
      `cat-${variant}-0`, `cat-${variant}-0`, `cat-${variant}-0`, `cat-${variant}-1`,
    ], 3, -1);
  });
  register('bunny-idle', ['bunny-0', 'bunny-0', 'bunny-1', 'bunny-0'], 3, -1);
  register('bunny-pink-idle', ['bunny-pink-0', 'bunny-pink-0', 'bunny-pink-1', 'bunny-pink-0'], 3, -1);
}
