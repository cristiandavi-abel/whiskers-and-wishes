import Phaser from 'phaser';

export function makePixelHero(scene: Phaser.Scene, key: string, shirtColor: number, hairColor: number, glasses = false): void {
  const g = scene.make.graphics({ x: 0, y: 0 });
  // Sprite pequeno desenhado em blocos para manter o estilo pixel art.
  g.fillStyle(0x30272e); g.fillRect(8, 1, 16, 7); g.fillRect(5, 6, 22, 8);
  g.fillStyle(hairColor); g.fillRect(7, 3, 18, 10); g.fillRect(5, 7, 5, 8);
  g.fillStyle(0xf1c29b); g.fillRect(9, 9, 14, 10);
  g.fillStyle(hairColor); g.fillRect(7, 7, 4, 7); g.fillRect(21, 7, 4, 5);
  g.fillStyle(0x382a35); g.fillRect(11, 12, 3, 2); g.fillRect(19, 12, 3, 2);
  if (glasses) {
    g.lineStyle(1, 0x262b35); g.strokeRect(9, 11, 7, 5); g.strokeRect(17, 11, 7, 5);
    g.lineBetween(16, 13, 17, 13);
  }
  g.fillStyle(shirtColor); g.fillRect(7, 19, 18, 12); g.fillRect(4, 20, 5, 10); g.fillRect(23, 20, 5, 10);
  g.fillStyle(0x2b2832); g.fillRect(9, 30, 6, 9); g.fillRect(18, 30, 6, 9);
  g.fillStyle(0xf1e8d8); g.fillRect(8, 38, 8, 4); g.fillRect(17, 38, 8, 4);
  g.generateTexture(key, 32, 44); g.destroy();
}

export function makeCat(scene: Phaser.Scene, key: string, furColor: number, accentColor: number): void {
  const g = scene.make.graphics({ x: 0, y: 0 });
  g.fillStyle(furColor); g.fillRect(5, 8, 24, 15); g.fillRect(6, 3, 8, 10); g.fillRect(20, 3, 8, 10);
  g.fillStyle(accentColor); g.fillTriangle(7, 4, 10, 10, 13, 6); g.fillTriangle(21, 6, 24, 10, 27, 4);
  g.fillStyle(furColor); g.fillRect(25, 16, 7, 5); g.fillRect(29, 12, 4, 6);
  g.fillStyle(0x352a32); g.fillRect(10, 13, 3, 3); g.fillRect(21, 13, 3, 3);
  g.fillStyle(0xf7e8d5); g.fillRect(14, 17, 7, 4);
  g.fillStyle(0x40313a); g.fillRect(8, 22, 5, 4); g.fillRect(21, 22, 5, 4);
  g.generateTexture(key, 36, 28); g.destroy();
}

export function makeStar(scene: Phaser.Scene, key: string): void {
  const g = scene.make.graphics({ x: 0, y: 0 });
  g.fillStyle(0xffdf7e);
  g.fillRect(7, 0, 4, 4); g.fillRect(4, 4, 10, 4); g.fillRect(0, 8, 18, 4); g.fillRect(4, 12, 10, 4); g.fillRect(7, 16, 4, 3);
  g.fillStyle(0xfff6ca); g.fillRect(7, 4, 3, 7);
  g.generateTexture(key, 18, 19); g.destroy();
}

export function makeFlower(scene: Phaser.Scene, key: string): void {
  const g = scene.make.graphics({ x: 0, y: 0 });
  g.fillStyle(0xf18ca9); g.fillRect(5, 0, 5, 5); g.fillRect(0, 5, 5, 5); g.fillRect(10, 5, 5, 5); g.fillRect(5, 10, 5, 5);
  g.fillStyle(0xffe58b); g.fillRect(5, 5, 5, 5);
  g.fillStyle(0x5f9b68); g.fillRect(7, 15, 2, 7); g.fillRect(3, 18, 5, 2);
  g.generateTexture(key, 15, 22); g.destroy();
}
