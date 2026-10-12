import Phaser from "phaser";

import { COLORS, PLAYER_SIZE, PLAYER_SPEED } from "../constants";

type Direction = "up" | "down" | "left" | "right";

/**
 * Phase 1 플레이스홀더. 스프라이트 시트가 들어오면 Rectangle 대신
 * Phaser.Physics.Arcade.Sprite 로 바꾸고 4 방향 walk 애니메이션을 붙인다.
 */
export class Player extends Phaser.GameObjects.Rectangle {
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd?: Record<Direction, Phaser.Input.Keyboard.Key>;
  /** 스프라이트 교체 시 바로 애니메이션 키로 쓰기 위해 들고 있는다. */
  private facing: Direction = "down";

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, PLAYER_SIZE.w, PLAYER_SIZE.h, COLORS.player);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setDepth(10);
    this.setStrokeStyle(1, COLORS.playerOutline);
    this.arcadeBody.setCollideWorldBounds(true);

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
  }
}
