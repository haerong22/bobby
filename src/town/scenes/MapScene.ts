import Phaser from "phaser";

import { BUILDINGS } from "../buildings";
import {
  CAMERA_ZOOM,
  COLORS,
  MAP_PX,
  MAP_TILES,
  ROADS,
  SPAWN_TILE,
  TILE,
} from "../constants";
import { Player } from "../entities/Player";
import { EventBus } from "../EventBus";

/** 타일 좌표 → 타일 중심의 월드 픽셀 좌표 */
const center = (tile: number, span = 1) => (tile + span / 2) * TILE;

export class MapScene extends Phaser.Scene {
  static readonly KEY = "MapScene";

  private player!: Player;

  constructor() {
    super(MapScene.KEY);
  }

  create() {
    this.physics.world.setBounds(0, 0, MAP_PX.w, MAP_PX.h);

    this.drawGround();
    this.drawRoads();

    this.player = new Player(
      this,
      center(SPAWN_TILE.x),
      center(SPAWN_TILE.y),
    );

    this.physics.add.collider(this.player, this.drawBuildings());

    const camera = this.cameras.main;
    camera.setBounds(0, 0, MAP_PX.w, MAP_PX.h);
    camera.setZoom(CAMERA_ZOOM);
    camera.startFollow(this.player, true, 0.12, 0.12);
    camera.roundPixels = true;

    EventBus.emit("game:ready", { scene: MapScene.KEY });
  }

  update() {
    this.player.update();
  }

  private drawGround() {
    this.add
      .rectangle(0, 0, MAP_PX.w, MAP_PX.h, COLORS.ground)
      .setOrigin(0, 0);

    // 타일 격자. Phase 2 에서 Tiled 로 맵을 그릴 때 좌표를 눈으로 맞추기 위한 보조선.
    const grid = this.add.graphics().setDepth(1);
    grid.lineStyle(1, COLORS.grid, 1);
    for (let x = 0; x <= MAP_TILES.w; x += 1) {
      grid.lineBetween(x * TILE, 0, x * TILE, MAP_PX.h);
    }
    for (let y = 0; y <= MAP_TILES.h; y += 1) {
      grid.lineBetween(0, y * TILE, MAP_PX.w, y * TILE);
    }
  }

  private drawRoads() {
    const { horizontal, vertical } = ROADS;
    const hHeight = (horizontal.to - horizontal.from + 1) * TILE;
    const vWidth = (vertical.to - vertical.from + 1) * TILE;

    const roads = this.add.graphics().setDepth(2);
    roads.fillStyle(COLORS.road, 1);
    roads.fillRect(0, horizontal.from * TILE, MAP_PX.w, hHeight);
    roads.fillRect(vertical.from * TILE, 0, vWidth, MAP_PX.h);

    // 중앙선. 교차로 구간은 비워 둬야 도로처럼 읽힌다.
    const lanes = this.add.graphics().setDepth(3);
    lanes.fillStyle(COLORS.roadLine, 1);
    const hMid = center(horizontal.from + 1) - 1;
    const vMid = center(vertical.from + 1) - 1;
    for (let x = 0; x < MAP_PX.w; x += TILE) {
      if (x >= vertical.from * TILE && x <= vertical.to * TILE) continue;
      lanes.fillRect(x + 4, hMid, TILE - 8, 2);
    }
    for (let y = 0; y < MAP_PX.h; y += TILE) {
      if (y >= horizontal.from * TILE && y <= horizontal.to * TILE) continue;
      lanes.fillRect(vMid, y + 4, 2, TILE - 8);
    }
  }

  /** 건물을 그리고 충돌체로 쓸 사각형들을 돌려준다. */
  private drawBuildings() {
    return BUILDINGS.map((building) => {
      const body = this.add
        .rectangle(
          center(building.x, building.w),
          center(building.y, building.h),
          building.w * TILE,
          building.h * TILE,
          building.color,
        )
        .setDepth(4)
        .setStrokeStyle(1, COLORS.playerOutline);

      this.physics.add.existing(body, true);

      // 출입구. Phase 3 에서 이 자리에 상호작용 존이 붙는다.
      this.add
        .rectangle(
          center(building.x + building.doorOffset),
          (building.y + building.h) * TILE - TILE / 2,
          TILE - 4,
          TILE - 4,
          COLORS.door,
        )
        .setDepth(5);

      this.add
        .text(
          center(building.x, building.w),
          building.y * TILE + 6,
          building.label,
          { fontSize: "8px", color: "#f4f6fb" },
        )
        .setOrigin(0.5, 0)
        .setResolution(CAMERA_ZOOM * 2)
        .setDepth(6);

      return body;
    });
  }
}
