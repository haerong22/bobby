/**
 * 지면 타일셋.
 *
 * `public/town/tilesets/town.png` 은 **생성물**이다 (`npm run gen:assets`).
 * 원본 "Cozy Town Lite" 에는 가로 차선·횡단보도만 있어서, 90도 돌린 세로 변형을
 * 덧붙여 만든다. 아래 인덱스는 `scripts/gen-town-assets.mts` 의 `PACKED` 배열
 * 순서와 1:1 로 대응하므로 **한쪽만 고치면 지면이 통째로 어긋난다.**
 *
 * 원본: "Cozy Town Lite" by Spaceyyy (CC-BY 4.0).
 */

export const TILESET = {
  key: "town-tiles",
  /** .tmj 안의 tileset name 과 반드시 일치해야 한다. */
  name: "town",
  image: "/town/tilesets/town.png",
  imageWidth: 128,
  imageHeight: 96,
  columns: 8,
  tileCount: 46,
  spacing: 0,
  margin: 0,
} as const;

export const T = {
  asphalt: 0,
  asphaltAlt: 1,
  manhole: 2,
  drain: 3,
  /** 가로 도로의 중앙 점선 */
  lineEw: 4,
  /** 세로 도로의 중앙 점선 (원본에 없어 생성) */
  lineNs: 5,
  crosswalkEw: 6,
  crosswalkNs: 7,
  sidewalk: 8,
  grass: 9,
  grassAlt: 10,
  grassAlt2: 11,
  flowers: 12,
  flowersAlt: 13,
  flowersAlt2: 14,
  // 연석(curb). 이름은 "도로를 기준으로 보도가 어디 있는가" 가 아니라
  // **이 타일을 어디에 놓는가** 로 지었다. 타일을 확대해 보고 맞춘 값이다.
  /** 연석이 위쪽에 있는 보도 → 도로 **아래** 첫 줄에 놓는다 */
  curbBelowRoad: 15,
  /** 연석이 아래쪽에 있는 보도 → 도로 **위** 마지막 줄에 놓는다 */
  curbAboveRoad: 16,
  /** 연석이 왼쪽에 있는 보도 → 도로 **오른쪽** 첫 칸에 놓는다 */
  curbRightOfRoad: 17,
  /** 연석이 오른쪽에 있는 보도 → 도로 **왼쪽** 마지막 칸에 놓는다 */
  curbLeftOfRoad: 18,
  /** 잔디 위쪽에 보도가 붙은 타일 → 잔디밭 첫 줄 */
  grassEdgeTop: 19,
  grassEdgeBottom: 20,
  grassEdgeLeft: 21,
  grassEdgeRight: 22,
  rampN: 23,
  rampS: 24,
  grassFlip: 25,
  /**
   * 흙 오솔길 오토타일 16 장의 **첫 인덱스**. 실제 타일은
   * `dirtTile(mask)` 로 고른다 (N=1 · E=2 · S=4 · W=8).
   */
  dirt0: 26,
  grassShade: 42,
  grassDry: 43,
  grassWeed: 44,
  grassPebble: 45,
} as const;

/** 이웃이 이어진 방향. 흙길 오토타일의 마스크 비트. */
export const DIRT_N = 1;
export const DIRT_E = 2;
export const DIRT_S = 4;
export const DIRT_W = 8;

/** 이웃 마스크(0~15)로 흙길 타일 인덱스를 고른다. */
export const dirtTile = (mask: number) => T.dirt0 + (mask & 15);

/** 지면은 전부 걸어 다닐 수 있다. 막는 것은 건물과 소품뿐이다. */
export const GRASS_VARIANTS = [
  T.grass,
  T.grassAlt,
  T.grassAlt2,
  T.grassFlip,
  T.grassWeed,
  T.grassPebble,
] as const;

/**
 * 나무 밑과 공원 속. **묶음 안의 톤은 서로 가까워야 한다** — 밝은 잔디와 어두운
 * 잔디를 한 묶음에 넣고 칸마다 뽑으면 체크무늬가 된다.
 */
export const SHADE_VARIANTS = [T.grassShade, T.grassShade, T.grassWeed] as const;

/** 마을 바깥 들판. 마른 풀을 섞어 안쪽 잔디와 구별한다. */
export const DRY_VARIANTS = [T.grassDry, T.grassDry, T.grassPebble] as const;

export const FLOWER_VARIANTS = [
  T.flowers,
  T.flowersAlt,
  T.flowersAlt2,
] as const;
