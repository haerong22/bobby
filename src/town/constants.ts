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
 *
 * **보도는 `paved: true` 인 길에만 깐다.** 길마다 양옆에 보도를 깔았더니
 * 베이지 띠 여덟 줄이 맵을 갈라 초록이 전부 직사각형 조각이 됐다. 작은 마을의
 * 포장은 큰길 하나에만 있고, 나머지는 아스팔트가 바로 풀밭에 닿는다. 이
 * 하나로 포장 면적이 절반 이하로 줄고 큰길과 골목의 위계가 생긴다.
 */
export const ROADS = {
  horizontal: [
    { from: 12, to: 14, paved: true }, // 큰길 — 마을에서 유일하게 보도가 있다
    { from: 27, to: 29, paved: false },
  ],
  vertical: [
    { from: 21, to: 23, paved: false }, // 세로 큰길
    { from: 46, to: 47, paved: false }, // 골목
  ],
} as const;

/**
 * 흙 오솔길. 사람이 다니는 길이다.
 *
 * 순환이 아스팔트 하나뿐이면 마을이 격자로만 읽힌다. 차가 다니는 큰길과
 * 사람이 다니는 오솔길을 나누면 같은 격자 위에서도 마을처럼 보인다.
 *
 * 각 줄은 꺾은선이고, 칸 사이는 ㄱ 자로 잇는다 — 대각선 타일이 없어서다.
 * 세로 큰길을 하나 덜어 낸 자리(동쪽)를 이 길이 대신 잇는다.
 */
export const TRAILS: readonly (readonly { x: number; y: number }[])[] = [
  // 큰길 → 공방과 도서관 사이 → 아래 길
  [{ x: 10, y: 16 }, { x: 10, y: 26 }],
  // 광장 옆 녹지를 세로로 가른다
  [{ x: 42, y: 16 }, { x: 42, y: 26 }],
  // 광장 남쪽 → 들판을 지그재그로 가로질러 서쪽 끝까지
  [
    { x: 32, y: 26 }, { x: 32, y: 33 }, { x: 24, y: 33 }, { x: 24, y: 36 },
    { x: 14, y: 36 }, { x: 14, y: 33 }, { x: 6, y: 33 }, { x: 6, y: 30 },
  ],
  // 들판 → 동쪽 공원
  [
    { x: 32, y: 33 }, { x: 40, y: 33 }, { x: 40, y: 36 }, { x: 52, y: 36 },
    { x: 52, y: 22 }, { x: 49, y: 22 },
  ],
  // 동쪽 공원을 가로지르는 짧은 줄기
  [{ x: 52, y: 27 }, { x: 62, y: 27 }],
] as const;

/**
 * 남쪽 들판의 텃밭.
 *
 * 들판이 나무만 흩어진 벌판이면 "아직 안 만든 땅" 으로 보인다. 생울타리로
 * 두르고 화단을 줄줄이 심으면 마을 사람이 쓰는 땅이 된다.
 */
export const PLOTS = [
  { x: 2, y: 35, w: 7, h: 3 },
  { x: 28, y: 35, w: 8, h: 3 },
] as const;

/**
 * 광장. 분수를 놓고 바닥을 포장한다.
 *
 * 마을에 **초점이 하나는 있어야 한다.** 없으면 아무리 채워도 건물이 흩어진
 * 벌판으로 보인다. 큰길 둘과 세로 큰길이 만나는 모서리에 둔다.
 */
export const PLAZA = { x: 26, y: 16, w: 13, h: 11 } as const;

/**
 * 꽃이 흩어지고 나무가 빽빽한 구역.
 *
 * **지면 기본이 잔디**라 공원을 잔디로 구분할 수 없다. 그래서 공원은 "꽃밭 +
 * 나무 밀집" 으로 표시한다. 건물과 주민 순찰 경로를 피해 배치했다.
 */
export const PARKS = [
  { x: 49, y: 15, w: 15, h: 13, grove: true }, // 동쪽 공원
  { x: 56, y: 1, w: 8, h: 10, grove: true }, // 북동쪽 숲
  { x: 39, y: 16, w: 7, h: 11, grove: true }, // 광장 옆 녹지
  { x: 41, y: 1, w: 5, h: 10, grove: true }, // 회사 옆 녹지
  { x: 0, y: 0, w: 8, h: 4, grove: true }, // 집 뒤 숲
  { x: 0, y: 15, w: 11, h: 5, grove: true }, // 공방 뒤 녹지
  // 들판은 성글어야 한다. 공원과 같은 밀도로 심으면 마을 남쪽이 통째로 숲이 된다.
  { x: 1, y: 31, w: 62, h: 8, grove: false }, // 남쪽 들판
] as const;

/**
 * 그 칸이 공원 안인가.
 *
 * **경계를 직사각형 그대로 쓰면 안 된다.** 나무 밀도와 잔디 색이 정확한
 * 직선에서 끊겨 "초록 사각형을 붙여 놓은" 티가 난다. 가장자리 두 칸을 잡음으로
 * 갉고 밖으로도 두 칸 번지게 해서 경계를 풀어 준다.
 */
export function parkAt(x: number, y: number): boolean {
  const n = (() => {
    const v = Math.sin(x * 91.7 + y * 47.3) * 43758.5453;
    return v - Math.floor(v);
  })();
  for (const park of PARKS) {
    const d = Math.min(
      x - park.x,
      park.x + park.w - 1 - x,
      y - park.y,
      park.y + park.h - 1 - y,
    );
    if (d >= 2) return true;
    if (d >= 0 && n < 0.55 + d * 0.22) return true;
    if (d >= -2 && n > 0.78) return true;
  }
  return false;
}

/** 시작 지점 — 집 앞 길 (타일 단위) */
export const SPAWN_TILE = { x: 7, y: 9 } as const;

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
