import Phaser from "phaser";

import { PLAYER_SPEED, TILE } from "../constants";
import type { Facing } from "../sprites";
import { animKey, IDLE_DOWN_FRAME, PLAYER_SPRITE } from "../sprites";

type Direction = Facing;

/**
 * 스프라이트는 16x24 지만 충돌체는 발밑 작은 사각형이다. 전신을 충돌체로 쓰면
 * 머리가 벽에 닿아 멈춰서, 탑다운에서 몸이 건물에 겹쳐 보이는 느낌이 사라진다.
 */
const BODY = { w: 8, h: 6, offsetX: 4, offsetY: 17 } as const;

export class Player extends Phaser.Physics.Arcade.Sprite {
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd?: Record<Direction, Phaser.Input.Keyboard.Key>;
  private facing: Direction = "down";

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, PLAYER_SPRITE.key, IDLE_DOWN_FRAME);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setDepth(10);
    this.arcadeBody
      .setSize(BODY.w, BODY.h)
      .setOffset(BODY.offsetX, BODY.offsetY);
    this.arcadeBody.setCollideWorldBounds(true);
    this.play(animKey("idle", "down"));

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
    this.play(animKey("idle", this.facing), true);
  }

  update() {
    let x = 0;
    let y = 0;

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

    const moving = x !== 0 || y !== 0;
    this.play(animKey(moving ? "walk" : "idle", this.facing), true);
  }
}
