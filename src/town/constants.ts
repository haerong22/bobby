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
 * 도시 간선도로 (타일 단위, 끝 포함). 가로 2 · 세로 2 가 맵을 9 블록으로 가른다.
 */
export const ROADS = {
  horizontal: [
    { from: 12, to: 14 },
    { from: 27, to: 29 },
  ],
  vertical: [
    { from: 14, to: 16 },
    { from: 44, to: 46 },
  ],
} as const;

/** 공원. 건물이 없는 블록을 잔디로 채운다. */
export const PARKS = [
  { x: 2, y: 2, w: 10, h: 8 },
  { x: 20, y: 31, w: 12, h: 7 },
  { x: 50, y: 31, w: 10, h: 7 },
] as const;

/** 시작 지점 — 집 문 앞 (타일 단위) */
export const SPAWN_TILE = { x: 6, y: 24 } as const;

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
