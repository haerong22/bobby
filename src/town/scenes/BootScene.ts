import Phaser from "phaser";

import { COLORS, GAME_SIZE } from "../constants";
import { TILESET } from "../tiles";
import { MapScene } from "./MapScene";

export class BootScene extends Phaser.Scene {
  static readonly KEY = "BootScene";

  constructor() {
    super(BootScene.KEY);
  }

  preload() {
    this.drawProgress();
    this.load.image(TILESET.key, TILESET.image);
    this.load.tilemapTiledJSON(MapScene.MAP_KEY, "/town/maps/city.tmj");
  }

  create() {
    this.scene.start(MapScene.KEY);
  }

  private drawProgress() {
    const width = 160;
    const x = (GAME_SIZE.w - width) / 2;
    const y = GAME_SIZE.h / 2;

    const bar = this.add.graphics();
    this.load.on("progress", (value: number) => {
      bar.clear();
      bar.fillStyle(COLORS.grid, 1);
      bar.fillRect(x, y, width, 6);
      bar.fillStyle(COLORS.door, 1);
      bar.fillRect(x, y, width * value, 6);
    });
    this.load.on("complete", () => bar.destroy());
  }
}
