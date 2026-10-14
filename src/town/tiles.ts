/**
 * Kenney "Roguelike Modern City" (CC0) 스프라이트시트의 타일 인덱스.
 *
 * 시트는 37열 × 28행 = 1036 타일, 타일 16x16, 타일 사이 1px 간격.
 * 인덱스는 0 부터 좌→우, 위→아래. Tiled 의 gid 는 여기에 firstgid(1) 를 더한 값이다.
 * 값은 시트를 잘라 눈으로 확인하고 고른 것이라 시트를 교체하면 전부 다시 잡아야 한다.
 */

export const TILESET = {
  key: "city-tiles",
  /** .tmj 안의 tileset name 과 반드시 일치해야 한다. */
  name: "city",
  image: "/town/tilesets/roguelikeCity.png",
  imageWidth: 628,
  imageHeight: 475,
  columns: 37,
  tileCount: 1036,
  spacing: 1,
  margin: 0,
} as const;

export const GROUND = {
  grass: 888,
  sidewalk: 890,
  road: 714,
  /** 세로 도로 중앙의 흰 점선 */
  roadDashV: 787,
  /** 가로 도로 중앙의 노란 실선 */
  roadLineH: 751,
  crosswalkH: 823,
  crosswalkV: 826,
} as const;

export const PROPS = {
  tree: 438,
  bush: 403,
} as const;

export type Material = "red" | "gray" | "tan";

/** 건물 한 채를 구성하는 타일 묶음. */
export const MATERIALS: Record<
  Material,
  { roof: number; wall: number; windowBand: number }
> = {
  red: { roof: 4, wall: 187, windowBand: 224 },
  gray: { roof: 10, wall: 191, windowBand: 228 },
  tan: { roof: 10, wall: 195, windowBand: 232 },
};

/** 출입문은 밟고 설 수 있어야 한다 — 충돌에서 제외하는 유일한 건물 타일. */
export const DOOR = 234;
export const GLASS = 197;
