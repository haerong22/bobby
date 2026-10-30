import Phaser from "phaser";

import type { BuildingId } from "../buildings";
import { BUILDINGS, buildingTexture, doorTile } from "../buildings";
import {
  SPAWN_TILE,
  TEXT_RESOLUTION,
  TILE,
  ZOOM,
  ZOOM_STORAGE_KEY,
} from "../constants";
import { Npc } from "../entities/Npc";
import { Player } from "../entities/Player";
import { EventBus } from "../EventBus";
import { NPCS } from "../npcs";
import { computeProps } from "../props";
import { TILESET } from "../tiles";

/** 타일 좌표 → 타일 중심의 월드 픽셀 좌표 */
const center = (tile: number, span = 1) => (tile + span / 2) * TILE;

export class MapScene extends Phaser.Scene {
  static readonly KEY = "MapScene";
  static readonly MAP_KEY = "city-map";

  private player!: Player;
  private npcs: Npc[] = [];
  private marker!: Phaser.GameObjects.Text;
  private nearDoor: BuildingId | null = null;
  private nearNpc: Npc | null = null;
  private paused = false;
  private mapSize = { w: 0, h: 0 };

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
    if (!ground) {
      throw new Error(".tmj 에 'ground' 레이어가 없다.");
    }
    ground.setDepth(0);

    this.mapSize = { w: map.widthInPixels, h: map.heightInPixels };
    this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

    const walls = [...this.placeBuildings(), ...this.placeProps()];

    this.player = new Player(this, center(SPAWN_TILE.x), center(SPAWN_TILE.y));
    this.physics.add.collider(this.player, walls);

    // 주민은 건물·가로수와 충돌시키지 않는다. 순찰 경로를 비워 둔 전제이고,
    // 충돌을 걸면 한 번 끼었을 때 영영 빠져나오지 못한다.
    this.npcs = NPCS.map((data) => new Npc(this, data));
    this.physics.add.collider(this.player, this.npcs);

    this.drawLabels();
    this.createMarker();

    const camera = this.cameras.main;
    camera.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    camera.setZoom(this.loadZoom());
    camera.startFollow(this.player, true, 0.12, 0.12);
    camera.roundPixels = true;

    // Scale.RESIZE 는 캔버스만 늘리고 카메라 뷰포트는 초기 크기로 둔다.
    // 맞춰 주지 않으면 캔버스 나머지가 검게 남는다.
    this.fitCameraToCanvas();
    const onResize = () => this.fitCameraToCanvas();
    this.scale.on(Phaser.Scale.Events.RESIZE, onResize);

    this.input.keyboard?.on("keydown-SPACE", this.interact, this);
    this.input.keyboard?.on("keydown-MINUS", () => this.nudgeZoom(-1));
    this.input.keyboard?.on("keydown-PLUS", () => this.nudgeZoom(1));

    const offPause = EventBus.on("game:pause", () => this.setPaused(true));
    const offResume = EventBus.on("game:resume", () => this.setPaused(false));
    const offInteract = EventBus.on("game:interact", () => this.interact());
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      offPause();
      offResume();
      offInteract();
      this.scale.off(Phaser.Scale.Events.RESIZE, onResize);
    });

    EventBus.emit("game:ready", { scene: MapScene.KEY });
  }

  update() {
    if (this.paused) {
      this.player.halt();
      return;
    }

    this.player.update();
    for (const npc of this.npcs) npc.update();
    this.syncInteractTarget();
  }

  private fitCameraToCanvas() {
    const camera = this.cameras.main;
    camera.setSize(this.scale.width, this.scale.height);
    // 창이 커지면 허용 최소 배율도 올라간다. 다시 눌러 맞추지 않으면
    // 카메라 바운드에 걸려 가장자리가 검게 남는다.
    camera.setZoom(this.clampZoom(camera.zoom));
  }

  /**
   * 맵이 화면을 덮는 최소 배율. 이보다 낮추면 카메라 바운드 밖이 비어 검게 보인다.
   * 픽셀아트라 정수 배율만 쓰므로 올림한다.
   */
  private minZoom() {
    const needed = Math.max(
      this.scale.width / this.mapSize.w,
      this.scale.height / this.mapSize.h,
    );
    return Math.min(ZOOM.max, Math.max(ZOOM.min, Math.ceil(needed)));
  }

  private clampZoom(zoom: number) {
    return Phaser.Math.Clamp(zoom, this.minZoom(), ZOOM.max);
  }

  /** 저장된 배율을 읽는다. 값이 깨져 있어도 기본값으로 떨어지게 한다. */
  private loadZoom() {
    const stored = Number(
      globalThis.localStorage?.getItem(ZOOM_STORAGE_KEY) ?? "",
    );
    const wanted =
      Number.isInteger(stored) && stored >= ZOOM.min && stored <= ZOOM.max
        ? stored
        : ZOOM.default;
    return this.clampZoom(wanted);
  }

  private nudgeZoom(step: number) {
    if (this.paused) return;
    const camera = this.cameras.main;
    const next = this.clampZoom(camera.zoom + step);
    if (next === camera.zoom) return;

    camera.setZoom(next);
    globalThis.localStorage?.setItem(ZOOM_STORAGE_KEY, String(next));
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

  /** Space 또는 터치 입장 버튼. 대상이 문이면 입장, 주민이면 대화. */
  private interact() {
    if (this.paused) return;

    if (this.nearDoor) {
      EventBus.emit("building:open", { id: this.nearDoor });
      return;
    }
    if (this.nearNpc) {
      this.nearNpc.freeze(new Phaser.Math.Vector2(this.player.x, this.player.y));
      EventBus.emit("npc:talk", {
        id: this.nearNpc.info.id,
        name: this.nearNpc.info.name,
        lines: this.nearNpc.info.lines,
      });
    }
  }

  /**
   * 플레이어 옆에 무엇이 있는지 보고 들어오고 나갈 때만 알린다.
   *
   * **문이 주민보다 우선이다.** 둘 다 범위에 들면 어느 쪽인지 헷갈리므로 규칙을
   * 하나로 고정했다. 그래서 주민은 출입문 앞을 비켜 배치해야 한다 (npcs.ts 참고).
   */
  private syncInteractTarget() {
    // 스프라이트 원점은 몸 가운데라 발이 딛은 칸을 따로 물어봐야 한다.
    const foot = this.player.footTile;

    const building = BUILDINGS.find((candidate) => {
      const door = doorTile(candidate);
      // 문 칸 자체와 그 바로 앞 칸, 두 칸을 유효 범위로 본다.
      return foot.x === door.x && (foot.y === door.y || foot.y === door.y + 1);
    });

    const npc = building
      ? null
      : (this.npcs.find((candidate) => {
          const tile = candidate.tilePos;
          return (
            Math.abs(tile.x - foot.x) <= 1 && Math.abs(tile.y - foot.y) <= 1
          );
        }) ?? null);

    this.syncDoor(building?.id ?? null);
    this.syncNpc(npc);
    this.syncMarker(building ?? null, npc);
  }

  private syncDoor(id: BuildingId | null) {
    if (id === this.nearDoor) return;
    if (this.nearDoor) EventBus.emit("door:away", { id: this.nearDoor });
    this.nearDoor = id;
    if (id) EventBus.emit("door:near", { id });
  }

  private syncNpc(npc: Npc | null) {
    if (npc === this.nearNpc) return;
    if (this.nearNpc) {
      EventBus.emit("npc:away", { id: this.nearNpc.info.id });
      this.nearNpc.unfreeze();
    }
    this.nearNpc = npc;
    if (npc) {
      EventBus.emit("npc:near", { id: npc.info.id, name: npc.info.name });
    }
  }

  private syncMarker(building: (typeof BUILDINGS)[number] | null, npc: Npc | null) {
    if (building) {
      const door = doorTile(building);
      this.marker
        .setText("!")
        .setPosition(center(door.x), door.y * TILE - 10)
        .setVisible(true);
    } else if (npc) {
      this.marker.setText("…").setPosition(npc.x, npc.y - 16).setVisible(true);
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
      .setResolution(TEXT_RESOLUTION)
      .setDepth(7)
      .setVisible(false);
  }

  /**
   * 건물을 스프라이트로 놓고 충돌체를 만든다.
   *
   * 건물 한 채당 사각형 세 개를 쓴다 — 윗부분 전체, 그리고 아랫줄의 문 좌우.
   * 문 칸만 비워야 플레이어가 문 앞에 설 수 있다.
   */
  private placeBuildings() {
    const walls: Phaser.GameObjects.Rectangle[] = [];

    const wall = (
      tileX: number,
      tileY: number,
      tilesW: number,
      tilesH: number,
    ) => {
      if (tilesW <= 0 || tilesH <= 0) return;
      const rect = this.add.rectangle(
        center(tileX, tilesW),
        center(tileY, tilesH),
        tilesW * TILE,
        tilesH * TILE,
      );
      this.physics.add.existing(rect, true);
      walls.push(rect);
    };

    for (const building of BUILDINGS) {
      this.add
        .image(
          center(building.x, building.w),
          center(building.y, building.h),
          buildingTexture(building),
        )
        .setDepth(5);

      const door = doorTile(building);
      const lastRow = building.y + building.h - 1;

      wall(building.x, building.y, building.w, building.h - 1);
      wall(building.x, lastRow, door.x - building.x, 1);
      wall(door.x + 1, lastRow, building.x + building.w - door.x - 1, 1);
    }

    return walls;
  }

  /**
   * 거리 소품. 충돌은 이미지 전체가 아니라 밑동만 잡는다 — 가로등 불빛 부분에
   * 막히면 길이 좁아 보이고 실제로도 답답하다.
   */
  private placeProps() {
    const walls: Phaser.GameObjects.Rectangle[] = [];

    for (const prop of computeProps()) {
      this.add
        .image(
          center(prop.x, prop.w),
          center(prop.y, prop.h),
          `prop-${prop.texture}`,
        )
        .setDepth(4);

      const footY = prop.y + prop.h - prop.footprintH;
      const rect = this.add.rectangle(
        center(prop.x, prop.w),
        center(footY, prop.footprintH),
        prop.w * TILE,
        prop.footprintH * TILE,
      );
      this.physics.add.existing(rect, true);
      walls.push(rect);
    }

    return walls;
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
        .setResolution(TEXT_RESOLUTION)
        .setDepth(6);
    }
  }
}
