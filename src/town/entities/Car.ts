import Phaser from "phaser";

import type { LaneData } from "../cars";
import { CAR_CROSS_SLOW, CAR_SPEED, CAR_WAIT } from "../cars";
import { MAP_PX, ROADS, TILE } from "../constants";

const rand = (min: number, max: number) => min + Math.random() * (max - min);
const pick = <V,>(list: readonly V[]) =>
  list[Math.floor(Math.random() * list.length)]!;

/**
 * 길을 달리는 자동차.
 *
 * 한 바퀴를 돌 때마다 **속도 · 색 · 다음 차가 들어오기까지의 대기 시간을 다시
 * 뽑는다.** 전부 고정하면 같은 차가 같은 간격으로 도는 게 눈에 보여서 배경이
 * 아니라 장식품처럼 느껴진다.
 *
 * 충돌체는 있지만 `collider` 가 아니라 `overlap` 으로 쓴다 — 밀어내지 않고
 * 겹친 순간에만 알린다. `collider` 로 걸면 움직이는 immovable 이 플레이어를
 * 건물 앞면에 밀어붙여 가둘 수 있다. 치이면 튕겨 나가는 쪽이 안전하고 재미있다.
 *
 * `data` 는 Phaser GameObject 의 DataManager 라 가리면 안 된다 (Npc 와 같은 이유).
 */
export class Car extends Phaser.Physics.Arcade.Image {
  readonly info: LaneData;
  private speed = 0;
  private waiting = 0;

  constructor(scene: Phaser.Scene, info: LaneData) {
    super(scene, 0, 0, pick(info.textures));
    this.info = info;

    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.arcadeBody.setAllowGravity(false);
    this.arcadeBody.setImmovable(true);

    if (info.axis === "x") {
      this.y = (info.lane + 0.5) * TILE;
      // 옆모습은 오른쪽을 보고 그려 뒀다. 서쪽으로 가면 뒤집는다.
      this.setFlipX(info.dir < 0);
      this.arcadeBody.setSize(28, 11).setOffset(2, 5);
    } else {
      this.x = (info.lane + 0.5) * TILE;
      this.arcadeBody.setSize(12, 26).setOffset(3, 3);
    }

    // 첫 등장은 제각각이어야 한다. 전부 같이 출발하면 줄지어 들어온다.
    this.respawn(rand(0, CAR_WAIT.max));
  }

  private get arcadeBody() {
    return this.body as Phaser.Physics.Arcade.Body;
  }

  /** 맵 밖 출발선에 세우고, 다음 등장까지 기다리게 한다. */
  private respawn(delay: number) {
    this.waiting = delay;
    this.speed = rand(CAR_SPEED.min, CAR_SPEED.max);
    this.setTexture(pick(this.info.textures));
    this.setVisible(false);
    this.arcadeBody.setVelocity(0, 0);

    if (this.info.axis === "x") {
      const edge = this.width;
      this.x = this.info.dir > 0 ? -edge : MAP_PX.w + edge;
    } else {
      const edge = this.height;
      this.y = this.info.dir > 0 ? -edge : MAP_PX.h + edge;
    }
  }

  /** 교차로를 지나는 중인가. 가로 차는 세로 도로를, 세로 차는 가로 도로를 본다. */
  private atCrossing() {
    const bands = this.info.axis === "x" ? ROADS.vertical : ROADS.horizontal;
    const pos = this.info.axis === "x" ? this.x : this.y;
    return bands.some(
      (band) => pos > (band.from - 2) * TILE && pos < (band.to + 3) * TILE,
    );
  }

  update(delta: number) {
    if (this.waiting > 0) {
      this.waiting -= delta;
      if (this.waiting <= 0) this.setVisible(true);
      return;
    }

    const speed = this.speed * (this.atCrossing() ? CAR_CROSS_SLOW : 1);
    if (this.info.axis === "x") {
      this.arcadeBody.setVelocity(speed * this.info.dir, 0);
      const edge = this.width * 1.5;
      if (this.x > MAP_PX.w + edge || this.x < -edge) {
        this.respawn(rand(CAR_WAIT.min, CAR_WAIT.max));
        return;
      }
    } else {
      this.arcadeBody.setVelocity(0, speed * this.info.dir);
      const edge = this.height * 1.5;
      if (this.y > MAP_PX.h + edge || this.y < -edge) {
        this.respawn(rand(CAR_WAIT.min, CAR_WAIT.max));
        return;
      }
    }

    // 건물·나무와 같은 기준으로 발 위치를 깊이로 쓴다.
    this.setDepth(this.y + this.height / 2);
  }
}
