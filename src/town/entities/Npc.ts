import Phaser from "phaser";

import { TILE } from "../constants";
import type { NpcData } from "../npcs";
import type { Facing } from "../sprites";
import { animKey, IDLE_DOWN_FRAME } from "../sprites";

const SPEED = 28;
/** 끝점에 이만큼 가까워지면 도착한 것으로 본다. 정확히 같아지길 기다리면 떤다. */
const ARRIVE = 1.5;
const BODY = { w: 8, h: 6, offsetX: 4, offsetY: 17 } as const;

const center = (tile: number) => (tile + 0.5) * TILE;

export class Npc extends Phaser.Physics.Arcade.Sprite {
  /** `data` 는 Phaser GameObject 의 DataManager 라 가리면 안 된다. */
  readonly info: NpcData;
  private readonly start: Phaser.Math.Vector2;
  private readonly end: Phaser.Math.Vector2;
  private goal: Phaser.Math.Vector2;
  private facing: Facing = "down";
  private frozen = false;

  constructor(scene: Phaser.Scene, data: NpcData) {
    super(scene, center(data.from.x), center(data.from.y), data.texture, IDLE_DOWN_FRAME);
    this.info = data;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.arcadeBody
      .setSize(BODY.w, BODY.h)
      .setOffset(BODY.offsetX, BODY.offsetY);
    // 플레이어가 밀고 다닐 수 있으면 순찰 경로를 벗어나 건물에 끼어 버린다.
    this.arcadeBody.setImmovable(true);

    this.start = new Phaser.Math.Vector2(center(data.from.x), center(data.from.y));
    this.end = new Phaser.Math.Vector2(center(data.to.x), center(data.to.y));
    this.goal = this.end;

    this.play(animKey(data.texture, "idle", "down"));
  }

  private get arcadeBody() {
    return this.body as Phaser.Physics.Arcade.Body;
  }

  get tilePos() {
    const body = this.arcadeBody;
    return {
      x: Math.floor((body.x + body.width / 2) / TILE),
      y: Math.floor((body.y + body.height / 2) / TILE),
    };
  }

  /** 대화 중에는 멈춰 서서 말을 건 쪽을 바라본다. */
  freeze(lookAt?: Phaser.Math.Vector2) {
    this.frozen = true;
    this.arcadeBody.setVelocity(0, 0);
    if (lookAt) {
      const dx = lookAt.x - this.x;
      const dy = lookAt.y - this.y;
      this.facing =
        Math.abs(dx) > Math.abs(dy)
          ? dx > 0
            ? "right"
            : "left"
          : dy > 0
            ? "down"
            : "up";
    }
    this.play(animKey(this.info.texture, "idle", this.facing), true);
  }

  unfreeze() {
    this.frozen = false;
  }

  update() {
    // 발 위치로 깊이를 갱신한다 — 건물·나무와 같은 기준.
    this.setDepth(this.arcadeBody.bottom);
    if (this.frozen) return;

    const position = new Phaser.Math.Vector2(this.x, this.y);
    if (position.distance(this.goal) <= ARRIVE) {
      // 제자리 주민은 두 점이 같아 매 프레임 도착 상태다. 그냥 서 있게 둔다.
      this.goal = this.goal === this.end ? this.start : this.end;
    }

    const step = this.goal.clone().subtract(position);
    if (step.length() <= ARRIVE) {
      this.arcadeBody.setVelocity(0, 0);
      this.play(animKey(this.info.texture, "idle", this.facing), true);
      return;
    }

    const velocity = step.normalize().scale(SPEED);
    this.arcadeBody.setVelocity(velocity.x, velocity.y);

    this.facing =
      Math.abs(velocity.x) > Math.abs(velocity.y)
        ? velocity.x > 0
          ? "right"
          : "left"
        : velocity.y > 0
          ? "down"
          : "up";
    this.play(animKey(this.info.texture, "walk", this.facing), true);
  }
}
