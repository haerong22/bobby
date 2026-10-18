import Phaser from "phaser";

import { COLORS } from "../constants";
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
    // RESIZE 모드라 캔버스 크기가 창을 따라간다. 카메라 뷰포트도 같이 맞춰야
    // 로딩바가 화면 밖으로 잘리지 않는다.
    this.cameras.main.setSize(this.scale.width, this.scale.height);

    const width = 160;
    const x = (this.scale.width - width) / 2;
    const y = this.scale.height / 2;

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
