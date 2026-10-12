/** 타일 한 변의 픽셀 수. 에셋을 16px 타일셋으로 맞춘다. */
export const TILE = 16;

/** 마을 크기 (타일 단위) */
export const MAP_TILES = { w: 40, h: 30 } as const;

/** 마을 크기 (월드 픽셀) */
export const MAP_PX = {
  w: MAP_TILES.w * TILE,
  h: MAP_TILES.h * TILE,
} as const;

/** 캔버스 해상도. Scale.FIT 이 이 비율을 유지하며 늘린다. */
export const GAME_SIZE = { w: 960, h: 540 } as const;

/** 카메라 배율. 16px 타일이 화면에서 32px 로 보인다. */
export const CAMERA_ZOOM = 2;

export const PLAYER_SIZE = { w: 10, h: 12 } as const;
export const PLAYER_SPEED = 80;

/** 도시 간선도로 (타일 단위, 끝 포함) */
export const ROADS = {
  horizontal: { from: 13, to: 15 },
  vertical: { from: 18, to: 20 },
} as const;

/** 시작 지점 — 집 앞 (타일 단위) */
export const SPAWN_TILE = { x: 5, y: 24 } as const;

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
