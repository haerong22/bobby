import { ROADS } from "./constants";

/**
 * 길을 지나다니는 자동차.
 *
 * **차선 하나에 한 대씩만 둔다.** 같은 차선에 여러 대를 띄우면 빠른 차가 느린
 * 차를 통과해 버린다. 차선마다 한 대로 묶어 두면 그런 일이 없고, 매 바퀴마다
 * 속도·색·대기 시간을 다시 뽑으므로 같은 차가 도는 것처럼 보이지도 않는다.
 *
 * 차선은 **우측통행**으로 잡았다 — 동쪽으로 가면 아래 차선, 서쪽으로 가면 위
 * 차선. 세로도 같은 규칙이라 남행은 왼쪽, 북행은 오른쪽이다. 반대로 잡으면
 * 중앙선을 사이에 두고 마주 달리는 것처럼 보인다.
 */
export interface LaneData {
  id: string;
  /** 달리는 축. "x" 는 가로 도로, "y" 는 세로 도로 */
  axis: "x" | "y";
  /** 차선이 놓인 줄 (타일). 가로면 y, 세로면 x */
  lane: number;
  /** +1 이면 오른쪽·아래로 */
  dir: 1 | -1;
  /** 이 차선에 들어올 수 있는 차들. 한 바퀴마다 하나를 뽑는다. */
  textures: readonly string[];
}

/** 한 바퀴마다 이 범위에서 다시 뽑는다. 플레이어는 80 이다. */
export const CAR_SPEED = { min: 58, max: 118 } as const;

/** 맵을 빠져나간 뒤 다시 들어오기까지 기다리는 시간 (ms). */
export const CAR_WAIT = { min: 700, max: 5600 } as const;

/** 교차로 부근에서 줄이는 비율. 일정 속도로 가로지르면 기계처럼 보인다. */
export const CAR_CROSS_SLOW = 0.5;

const SIDE = ["car-red", "car-blue", "car-cream", "car-olive", "car-amber"] as const;
const DOWN = ["car-down-amber", "car-down-blue", "car-down-cream"] as const;
const UP = ["car-up-olive", "car-up-red", "car-up-cream"] as const;

const [main, south] = ROADS.horizontal;
const [cross] = ROADS.vertical;

export const LANES: readonly LaneData[] = [
  { id: "main-east", axis: "x", lane: main!.to, dir: 1, textures: SIDE },
  { id: "main-west", axis: "x", lane: main!.from, dir: -1, textures: SIDE },
  { id: "south-east", axis: "x", lane: south!.to, dir: 1, textures: SIDE },
  { id: "south-west", axis: "x", lane: south!.from, dir: -1, textures: SIDE },
  { id: "cross-south", axis: "y", lane: cross!.from, dir: 1, textures: DOWN },
  { id: "cross-north", axis: "y", lane: cross!.to, dir: -1, textures: UP },
];

export const CAR_TEXTURES = [...SIDE, ...DOWN, ...UP];
