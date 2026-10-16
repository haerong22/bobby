import Phaser from "phaser";

import type { BuildingId } from "../buildings";
import { BUILDINGS, doorTile } from "../buildings";
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
  private marker!: Phaser.GameObjects.Text;
  private nearDoor: BuildingId | null = null;
  private paused = false;

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
    this.createMarker();

    const camera = this.cameras.main;
    camera.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    camera.setZoom(CAMERA_ZOOM);
    camera.startFollow(this.player, true, 0.12, 0.12);
    camera.roundPixels = true;

    this.input.keyboard?.on("keydown-SPACE", this.enterBuilding, this);

    const offPause = EventBus.on("game:pause", () => this.setPaused(true));
    const offResume = EventBus.on("game:resume", () => this.setPaused(false));
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      offPause();
      offResume();
    });

    EventBus.emit("game:ready", { scene: MapScene.KEY });
  }

  update() {
    if (this.paused) {
      this.player.halt();
      return;
    }
    this.player.update();
    this.syncNearestDoor();
  }

  private setPaused(paused: boolean) {
    this.paused = paused;
    const keyboard = this.input.keyboard;
    if (!keyboard) return;

    keyboard.enabled = !paused;
    // enabled 만으로는 preventDefault 가 남아 모달 입력까지 삼킨다.
    if (paused) keyboard.disableGlobalCapture();
    else keyboard.enableGlobalCapture();
  }

  private enterBuilding() {
    if (this.paused || !this.nearDoor) return;
    EventBus.emit("building:open", { id: this.nearDoor });
  }

  /** 플레이어가 선 칸이 어느 출입문 앞인지 보고 들어갈 때/나올 때만 알린다. */
  private syncNearestDoor() {
    const tx = Math.floor(this.player.x / TILE);
    const ty = Math.floor(this.player.y / TILE);

    const hit = BUILDINGS.find((building) => {
      const door = doorTile(building);
      // 문 칸 자체와 그 바로 앞 칸, 두 칸을 유효 범위로 본다.
      return tx === door.x && (ty === door.y || ty === door.y + 1);
    });

    const id = hit?.id ?? null;
    if (id === this.nearDoor) return;

    if (this.nearDoor) EventBus.emit("door:away", { id: this.nearDoor });
    this.nearDoor = id;

    if (hit) {
      const door = doorTile(hit);
      this.marker.setPosition(center(door.x), door.y * TILE - 10).setVisible(true);
      EventBus.emit("door:near", { id: hit.id });
    } else {
      this.marker.setVisible(false);
    }
  }

  /** 들어갈 수 있는 문 위에 뜨는 표시. */
  private createMarker() {
    this.marker = this.add
      .text(0, 0, "!", {
        fontSize: "10px",
        color: "#1b1e26",
        backgroundColor: "#ffd166",
        padding: { x: 3, y: 1 },
      })
      .setOrigin(0.5, 1)
      .setResolution(CAMERA_ZOOM * 2)
      .setDepth(7)
      .setVisible(false);
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
