import Phaser from "phaser";

import { PLAYER_SPEED, TILE } from "../constants";
import type { Facing } from "../sprites";
import { animKey, IDLE_DOWN_FRAME, PLAYER_SPRITE } from "../sprites";

import { readTouchAxis } from "../touchInput";

type Direction = Facing;

/**
 * 스프라이트는 16x24 지만 충돌체는 발밑 작은 사각형이다. 전신을 충돌체로 쓰면
 * 머리가 벽에 닿아 멈춰서, 탑다운에서 몸이 건물에 겹쳐 보이는 느낌이 사라진다.
 */
const BODY = { w: 8, h: 6, offsetX: 4, offsetY: 17 } as const;

/** 차에 치였을 때 튕겨 나가는 시간 (ms). 이 동안 입력을 받지 않는다. */
const KNOCK_MS = 520;
/** 일어난 직후 다시 치이지 않게 두는 무적 시간 (ms). */
const GRACE_MS = 500;

export class Player extends Phaser.Physics.Arcade.Sprite {
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd?: Record<Direction, Phaser.Input.Keyboard.Key>;
  private facing: Direction = "down";
  /** 이 시각까지는 튕겨 나가는 중이라 입력을 무시한다. */
  private knockedUntil = 0;
  /** 이 시각까지는 다시 치이지 않는다. */
  private safeUntil = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, PLAYER_SPRITE.key, IDLE_DOWN_FRAME);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.arcadeBody
      .setSize(BODY.w, BODY.h)
      .setOffset(BODY.offsetX, BODY.offsetY);
    this.arcadeBody.setCollideWorldBounds(true);
    // 평소에는 매 프레임 속도를 직접 넣으므로 감속이 보이지 않는다.
    // 튕겨 나가는 동안에만 이 감속이 일한다.
    this.arcadeBody.setDrag(420, 420);
    this.arcadeBody.setBounce(0.4, 0.4);
    this.play(animKey(PLAYER_SPRITE.key, "idle", "down"));

    const keyboard = scene.input.keyboard;
    if (keyboard) {
      this.cursors = keyboard.createCursorKeys();
      this.wasd = {
        up: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
        down: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
        left: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
        right: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      };
    }
  }

  private get arcadeBody() {
    return this.body as Phaser.Physics.Arcade.Body;
  }

  private held(direction: Direction) {
    return (
      this.cursors?.[direction].isDown === true ||
      this.wasd?.[direction].isDown === true
    );
  }

  get direction() {
    return this.facing;
  }

  /**
   * 발이 딛고 선 타일. 상호작용 판정은 이 값을 써야 한다 — 스프라이트 원점은
   * 몸 가운데라서 `y / TILE` 로는 한 칸 위를 가리킨다.
   */
  get footTile() {
    const body = this.arcadeBody;
    return {
      x: Math.floor((body.x + body.width / 2) / TILE),
      y: Math.floor((body.y + body.height / 2) / TILE),
    };
  }

  /** 모달이 열린 동안 호출한다. 멈추지 않으면 마지막 속도로 계속 미끄러진다. */
  halt() {
    this.arcadeBody.setVelocity(0, 0);
    this.knockedUntil = 0;
    this.setAngle(0);
    this.play(animKey(PLAYER_SPRITE.key, "idle", this.facing), true);
  }

  /** 지금 차에 치일 수 있는 상태인가. */
  get hittable() {
    return this.scene.time.now >= this.safeUntil;
  }

  /**
   * 차에 치여 튕겨 나간다.
   *
   * 속도만 주고 **입력을 잠깐 끊는다.** 안 끊으면 다음 프레임에 `update` 가
   * 입력으로 속도를 덮어써서 전혀 날아가지 않는다. 감속은 drag 가 맡는다.
   */
  knockBack(vx: number, vy: number) {
    const now = this.scene.time.now;
    this.arcadeBody.setVelocity(vx, vy);
    this.knockedUntil = now + KNOCK_MS;
    this.safeUntil = now + KNOCK_MS + GRACE_MS;
    this.play(animKey(PLAYER_SPRITE.key, "idle", this.facing), true);
  }

  update() {
    // 튕겨 나가는 동안은 입력을 받지 않는다. 속도는 drag 가 깎아 준다.
    if (this.scene.time.now < this.knockedUntil) {
      this.setAngle(this.angle + 18);
      this.setDepth(this.arcadeBody.bottom);
      return;
    }
    if (this.angle !== 0) this.setAngle(0);

    const touch = readTouchAxis();
    let x = touch.x;
    let y = touch.y;

    if (this.held("left")) x -= 1;
    if (this.held("right")) x += 1;
    if (this.held("up")) y -= 1;
    if (this.held("down")) y += 1;

    // 대각선이 더 빠르지 않도록 정규화한다.
    const velocity = new Phaser.Math.Vector2(x, y)
      .normalize()
      .scale(PLAYER_SPEED);
    this.arcadeBody.setVelocity(velocity.x, velocity.y);

    // 세로 입력을 우선해 바라보는 방향을 갱신한다.
    if (y < 0) this.facing = "up";
    else if (y > 0) this.facing = "down";
    else if (x < 0) this.facing = "left";
    else if (x > 0) this.facing = "right";

    // 발 위치로 깊이를 갱신한다. 건물·나무도 같은 기준이라 앞뒤가 자연스럽게 가려진다.
    this.setDepth(this.arcadeBody.bottom);

    const moving = x !== 0 || y !== 0;
    this.play(
      animKey(PLAYER_SPRITE.key, moving ? "walk" : "idle", this.facing),
      true,
    );
  }
}
