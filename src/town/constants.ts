/** 타일 한 변의 픽셀 수. 에셋을 16px 타일셋으로 맞춘다. */
export const TILE = 16;

/**
 * 마을 크기 (타일 단위).
 *
 * 64x40 = 1024x640px. 배율 2 면 2048x1280 이라 1920x1080 화면도 덮는다.
 * 맵이 화면보다 작으면 카메라 바운드에 걸려 가장자리가 검게 남으므로,
 * 맵 크기는 "가장 낮게 허용할 배율 × 가장 큰 화면" 을 넘겨야 한다.
 */
export const MAP_TILES = { w: 64, h: 40 } as const;

/** 마을 크기 (월드 픽셀) */
export const MAP_PX = {
  w: MAP_TILES.w * TILE,
  h: MAP_TILES.h * TILE,
} as const;

/** 캔버스 초기 크기. Scale.RESIZE 가 곧 창 크기로 덮어쓴다. */
export const GAME_SIZE = { w: 960, h: 540 } as const;

/**
 * 카메라 배율. 16px 타일이 화면에서 `TILE * zoom` 픽셀로 보인다.
 *
 * 정수만 쓴다 — 소수 배율은 픽셀아트에서 타일 경계에 틈이나 뭉개짐을 만든다.
 * 런타임에 바꿀 수 있고 선택값은 localStorage 에 남는다.
 */
export const ZOOM = { default: 2, min: 1, max: 5 } as const;
export const ZOOM_STORAGE_KEY = "town:zoom";

/** 텍스트 선명도는 최대 배율 기준으로 고정한다. 배율마다 다시 만들 수 없으니. */
export const TEXT_RESOLUTION = ZOOM.max;

export const PLAYER_SIZE = { w: 10, h: 12 } as const;
export const PLAYER_SPEED = 80;

/**
 * 길 (타일 단위, 끝 포함).
 *
 * **마을은 줄로 선다.** 가로길 두 개가 건물 줄을 나누고, 건물은 전부 길의
 * **북쪽**에 서서 아래 길을 바라본다 — 스프라이트가 정면도라 그래야 문이
 * 플레이어 쪽을 향한다.
 *
 *   y  2..10  건물 A열 (바닥 10)   ← 큰길 1 을 바라본다
 *   y 12..14  큰길 1
 *   y 18..25  건물 B열 (바닥 25)   ← 큰길 2 를 바라본다
 *   y 27..29  큰길 2
 *   y 31..38  바깥 들판
 *
 * 세로길은 폭이 다르다. 가운데 하나만 3칸(큰길)이고 나머지는 2칸(골목)이라
 * 격자가 기계처럼 보이지 않는다.
 */
export const ROADS = {
  horizontal: [
    { from: 12, to: 14 },
    { from: 27, to: 29 },
  ],
  vertical: [
    { from: 16, to: 17 },
    { from: 31, to: 33 },
    { from: 50, to: 51 },
  ],
} as const;

/**
 * 광장. 분수를 놓고 바닥을 포장한다.
 *
 * 마을에 **초점이 하나는 있어야 한다.** 없으면 아무리 채워도 건물이 흩어진
 * 벌판으로 보인다. 큰길 둘과 세로 큰길이 만나는 모서리에 둔다.
 */
export const PLAZA = { x: 35, y: 16, w: 13, h: 11 } as const;

/**
 * 꽃이 흩어지고 나무가 빽빽한 구역.
 *
 * **지면 기본이 잔디**라 공원을 잔디로 구분할 수 없다. 그래서 공원은 "꽃밭 +
 * 나무 밀집" 으로 표시한다. 건물과 주민 순찰 경로를 피해 배치했다.
 */
export const PARKS = [
  { x: 53, y: 16, w: 10, h: 11, grove: true }, // 동쪽 공원
  { x: 53, y: 1, w: 10, h: 10, grove: true }, // 북동쪽 숲
  { x: 19, y: 16, w: 11, h: 11, grove: true }, // 가게 뒤 녹지
  { x: 0, y: 0, w: 7, h: 5, grove: true }, // 집 뒤 숲
  { x: 0, y: 16, w: 8, h: 4, grove: true }, // 공방 뒤 숲
  // 들판은 성글어야 한다. 공원과 같은 밀도로 심으면 마을 남쪽이 통째로 숲이 된다.
  { x: 1, y: 31, w: 62, h: 8, grove: false }, // 남쪽 들판
] as const;

/** 시작 지점 — 집 앞 길 (타일 단위) */
export const SPAWN_TILE = { x: 6, y: 10 } as const;

export const COLORS = {
  ground: 0x1b1e26,
  block: 0x232733,
  road: 0x3a4152,
  roadLine: 0x5a6478,
  grid: 0x262b36,
  door: 0xffd166,
  player: 0xf4f6fb,
  playerOutline: 0x121419,
} as const;
