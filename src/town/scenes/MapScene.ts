import Phaser from "phaser";

import { BUILDINGS } from "../buildings";
import { CAMERA_ZOOM, SPAWN_TILE, TILE } from "../constants";
import { Player } from "../entities/Player";
import { EventBus } from "../EventBus";
import { DOOR, TILESET } from "../tiles";

/** 타일 좌표 → 타일 중심의 월드 픽셀 좌표 */
const center = (tile: number, span = 1) => (tile + span / 2) * TILE;

/** Tiled 의 firstgid 가 1 이므로 Phaser 의 tile.index 는 타일 인덱스 + 1 이다. */
const DOOR_INDEX = DOOR + 1;

export class MapScene extends Phaser.Scene {
  static readonly KEY = "MapScene";
  static readonly MAP_KEY = "city-map";

  private player!: Player;

  constructor() {
    super(MapScene.KEY);
  }

  create() {
    const map = this.make.tilemap({ key: MapScene.MAP_KEY });
    const tileset = map.addTilesetImage(TILESET.name, TILESET.key);
    if (!tileset) {
      throw new Error(
        `타일셋 '${TILESET.name}' 을 붙이지 못했다. .tmj 의 tileset name 과 tiles.ts 의 TILESET.name 이 어긋났는지 확인할 것.`,
      );
    }

    const ground = map.createLayer("ground", tileset, 0, 0);
    const buildings = map.createLayer("buildings", tileset, 0, 0);
    const props = map.createLayer("props", tileset, 0, 0);
    if (!ground || !buildings || !props) {
      throw new Error(".tmj 의 레이어 이름이 ground/buildings/props 와 어긋났다.");
    }

    ground.setDepth(0);
    buildings.setDepth(1);
    props.setDepth(2);

    // 출입문만 밟고 설 수 있어야 하므로 충돌에서 뺀다.
    buildings.setCollisionByExclusion([-1, DOOR_INDEX]);
    props.setCollisionByExclusion([-1]);

    this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

    this.player = new Player(this, center(SPAWN_TILE.x), center(SPAWN_TILE.y));
    this.physics.add.collider(this.player, buildings);
    this.physics.add.collider(this.player, props);

    this.drawLabels();

    const camera = this.cameras.main;
    camera.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    camera.setZoom(CAMERA_ZOOM);
    camera.startFollow(this.player, true, 0.12, 0.12);
    camera.roundPixels = true;

    EventBus.emit("game:ready", { scene: MapScene.KEY });
  }

  update() {
    this.player.update();
  }

  /** 건물 이름. 실제 간판 스프라이트가 생기면 이 자리를 대체한다. */
  private drawLabels() {
    for (const building of BUILDINGS) {
      this.add
        .text(
          center(building.x, building.w),
          (building.y + building.h - 3) * TILE - 9,
          building.label,
          {
            fontSize: "8px",
            color: "#f4f6fb",
            backgroundColor: "#1b1e26cc",
            padding: { x: 2, y: 1 },
          },
        )
        .setOrigin(0.5, 0)
        .setResolution(CAMERA_ZOOM * 2)
        .setDepth(6);
    }
  }
}
