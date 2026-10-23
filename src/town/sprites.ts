import type Phaser from "phaser";

/**
 * 플레이어 스프라이트시트.
 *
 * "Cozy Town Lite" by Spaceyyy (CC-BY 4.0). 출처 표기가 의무라
 * public/town/sprites/CREDITS.txt 와 정적 페이지 푸터에 남겨 뒀다.
 */
export const PLAYER_SPRITE = {
  key: "player",
  path: "/town/sprites/player.png",
  frameWidth: 16,
  frameHeight: 24,
  columns: 6,
} as const;

export type Facing = "down" | "left" | "right" | "up";

/** 시트의 행 순서. 이 순서가 바뀌면 애니메이션이 전부 어긋난다. */
const ROWS: Record<"idle" | "walk", Record<Facing, number>> = {
  idle: { down: 0, left: 1, right: 2, up: 3 },
  walk: { down: 4, left: 5, right: 6, up: 7 },
};

/** idle 은 4 프레임, walk 은 6 프레임만 채워져 있다. 나머지 칸은 비어 있다. */
const FRAME_COUNT = { idle: 4, walk: 6 } as const;

export const animKey = (kind: "idle" | "walk", facing: Facing) =>
  `${PLAYER_SPRITE.key}-${kind}-${facing}`;

/** 정지 상태로 쓸 첫 프레임. 스프라이트를 만들 때 넘긴다. */
export const IDLE_DOWN_FRAME = ROWS.idle.down * PLAYER_SPRITE.columns;

/**
 * 애니메이션은 씬이 아니라 게임 전역에 등록된다. 씬을 다시 시작해도 남아 있으므로
 * 이미 있으면 건너뛴다.
 */
export function createPlayerAnimations(scene: Phaser.Scene) {
  for (const kind of ["idle", "walk"] as const) {
    for (const facing of ["down", "left", "right", "up"] as const) {
      const key = animKey(kind, facing);
      if (scene.anims.exists(key)) continue;

      const start = ROWS[kind][facing] * PLAYER_SPRITE.columns;
      scene.anims.create({
        key,
        frames: scene.anims.generateFrameNumbers(PLAYER_SPRITE.key, {
          start,
          end: start + FRAME_COUNT[kind] - 1,
        }),
        frameRate: kind === "walk" ? 10 : 4,
        repeat: -1,
      });
    }
  }
}
