import type Phaser from "phaser";

/**
 * 캐릭터 스프라이트시트.
 *
 * 플레이어와 주민이 **같은 시트 구조**를 쓴다. 주민 시트는 플레이어 시트의
 * 머리·셔츠 색만 바꾼 것이라(scripts/gen-npc-sprites.mts) 프레임 배치가 동일하고,
 * 덕분에 애니메이션 생성 코드를 그대로 재사용한다.
 *
 * 원본: "Cozy Town Lite" by Spaceyyy (CC-BY 4.0).
 * 출처 표기 의무는 public/town/sprites/CREDITS.txt 와 정적 페이지 푸터에서 진다.
 */
export const CHARACTER_SHEET = {
  frameWidth: 16,
  frameHeight: 24,
  columns: 6,
} as const;

export const PLAYER_SPRITE = {
  key: "player",
  path: "/town/sprites/player.png",
  ...CHARACTER_SHEET,
} as const;

export type Facing = "down" | "left" | "right" | "up";

/** 시트의 행 순서. 이 순서가 바뀌면 애니메이션이 전부 어긋난다. */
const ROWS: Record<"idle" | "walk", Record<Facing, number>> = {
  idle: { down: 0, left: 1, right: 2, up: 3 },
  walk: { down: 4, left: 5, right: 6, up: 7 },
};

/** idle 은 4 프레임, walk 은 6 프레임만 채워져 있다. 나머지 칸은 비어 있다. */
const FRAME_COUNT = { idle: 4, walk: 6 } as const;

export const animKey = (
  texture: string,
  kind: "idle" | "walk",
  facing: Facing,
) => `${texture}-${kind}-${facing}`;

/** 정지 상태로 쓸 첫 프레임. 스프라이트를 만들 때 넘긴다. */
export const IDLE_DOWN_FRAME = ROWS.idle.down * CHARACTER_SHEET.columns;

/**
 * 애니메이션은 씬이 아니라 게임 전역에 등록된다. 씬을 다시 시작해도 남아 있으므로
 * 이미 있으면 건너뛴다.
 */
export function createCharacterAnimations(scene: Phaser.Scene, texture: string) {
  for (const kind of ["idle", "walk"] as const) {
    for (const facing of ["down", "left", "right", "up"] as const) {
      const key = animKey(texture, kind, facing);
      if (scene.anims.exists(key)) continue;

      const start = ROWS[kind][facing] * CHARACTER_SHEET.columns;
      scene.anims.create({
        key,
        frames: scene.anims.generateFrameNumbers(texture, {
          start,
          end: start + FRAME_COUNT[kind] - 1,
        }),
        frameRate: kind === "walk" ? 10 : 4,
        repeat: -1,
      });
    }
  }
}
