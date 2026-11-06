import Phaser from "phaser";

import { BUILDINGS, buildingTexture } from "../buildings";
import { CAR_TEXTURES } from "../cars";
import { COLORS } from "../constants";
import { NPC_TEXTURES } from "../npcs";
import { PROP_TEXTURES } from "../props";
import { CHARACTER_SHEET, createCharacterAnimations, PLAYER_SPRITE } from "../sprites";
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
    for (const building of BUILDINGS) {
      this.load.image(
        buildingTexture(building),
        `/town/buildings/${building.sprite}.png`,
      );
    }
    for (const texture of PROP_TEXTURES) {
      this.load.image(`prop-${texture}`, `/town/props/${texture}.png`);
    }
    for (const texture of CAR_TEXTURES) {
      this.load.image(texture, `/town/props/${texture}.png`);
    }
    const frames = {
      frameWidth: CHARACTER_SHEET.frameWidth,
      frameHeight: CHARACTER_SHEET.frameHeight,
    };
    this.load.spritesheet(PLAYER_SPRITE.key, PLAYER_SPRITE.path, frames);
    for (const texture of NPC_TEXTURES) {
      this.load.spritesheet(texture, `/town/sprites/${texture}.png`, frames);
    }
  }

  create() {
    createCharacterAnimations(this, PLAYER_SPRITE.key);
    for (const texture of NPC_TEXTURES) {
      createCharacterAnimations(this, texture);
    }
    this.scene.start(MapScene.KEY);
  }

  private drawProgress() {
    // RESIZE 모드라 캔버스 크기가 창을 따라간다. 카메라 뷰포트도 같이 맞춰야
    // 로딩바가 화면 밖으로 잘리지 않는다.
    this.cameras.main.setSize(this.scale.width, this.scale.height);

    const width = 160;
    const x = (this.scale.width - width) / 2;
    const y = this.scale.height / 2;

    const label = this.add
      .text(this.scale.width / 2, y - 14, "마을을 불러오는 중...", {
        fontSize: "12px",
        color: "#6b7280",
      })
      .setOrigin(0.5, 1);

    const bar = this.add.graphics();
    this.load.on("progress", (value: number) => {
      bar.clear();
      bar.fillStyle(COLORS.grid, 1);
      bar.fillRect(x, y, width, 6);
      bar.fillStyle(COLORS.door, 1);
      bar.fillRect(x, y, width * value, 6);
    });
    this.load.on("complete", () => {
      bar.destroy();
      label.destroy();
    });
  }
}
