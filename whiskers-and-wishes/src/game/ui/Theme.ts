import Phaser from 'phaser';

export const FONT = '"Nunito", "Trebuchet MS", sans-serif';

export const UI = {
  ink: 0x3b3038,
  inkSoft: 0x6a5560,
  cream: 0xfff4e2,
  creamDark: 0xf0dfc4,
  pink: 0xf3b8c6,
  pinkDark: 0x8a5566,
  gold: 0xffdf7e,
  green: 0x203c35,
  greenSoft: 0x35604f,
  blue: 0x4f7fc4,
};

export const CSS = {
  ink: '#3b3038',
  inkSoft: '#6a5560',
  cream: '#fff4e2',
  pink: '#f6c6cf',
  gold: '#ffdf7e',
  green: '#203c35',
  white: '#ffffff',
};

export function addPanel(
  scene: Phaser.Scene,
  x: number,
  y: number,
  width: number,
  height: number,
  options: { fill?: number; stroke?: number; alpha?: number; radius?: number } = {},
): Phaser.GameObjects.Graphics {
  const {
    fill = UI.cream,
    stroke = UI.pinkDark,
    alpha = 0.98,
    radius = 14,
  } = options;
  const g = scene.add.graphics();
  g.fillStyle(0x1d2a22, 0.22);
  g.fillRoundedRect(x + 4, y + 5, width, height, radius);
  g.fillStyle(fill, alpha);
  g.fillRoundedRect(x, y, width, height, radius);
  g.lineStyle(3, stroke, 1);
  g.strokeRoundedRect(x, y, width, height, radius);
  g.fillStyle(0xffffff, 0.35);
  g.fillRect(x + radius, y + 3, width - radius * 2, 2);
  return g;
}

export function textStyle(size: number, color = CSS.ink, extra: Phaser.Types.GameObjects.Text.TextStyle = {}): Phaser.Types.GameObjects.Text.TextStyle {
  return {
    fontFamily: FONT,
    fontSize: `${size}px`,
    color,
    ...extra,
  };
}
