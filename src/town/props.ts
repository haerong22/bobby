import { BUILDINGS } from "./buildings";
import { MAP_TILES, PARKS, ROADS } from "./constants";
import { NPCS } from "./npcs";

/**
 * 거리 소품. 가로수 · 가로등 · 벤치 · 화단 · 관목.
 *
 * 좌표를 손으로 적지 않고 도로·건물·공원 배치에서 계산한다. 맵이 바뀌면 소품도
 * 따라온다.
 *
 * 도시처럼 보이게 하는 규칙:
 * - 가로수와 가로등은 **연석을 따라** 번갈아 선다. 한 종류만 반복하면 기계처럼 보인다.
 * - 교차로 근처는 비운다. 횡단보도 앞에 나무가 서면 길을 막는 것처럼 보인다.
 * - 공원 안은 나무를 잡음으로 흩고 가장자리에 벤치를 둔다.
 */
export interface PropPlacement {
  texture: string;
  /** 좌상단 타일 좌표 */
  x: number;
  y: number;
  /** 이미지 크기 (타일 단위) */
  w: number;
  h: number;
  /** 충돌 박스로 쓸 아래쪽 줄 수. 나무는 밑동만 막는다. */
  footprintH: number;
}

export const PROP_TEXTURES = [
  "tree-a",
  "tree-b",
  "bush",
  "lamppost",
  "bench",
  "flower-bed",
] as const;

const SPECS = {
  "tree-a": { w: 2, h: 3, footprintH: 1 },
  "tree-b": { w: 2, h: 3, footprintH: 1 },
  bush: { w: 1, h: 1, footprintH: 1 },
  lamppost: { w: 1, h: 2, footprintH: 1 },
  bench: { w: 2, h: 1, footprintH: 1 },
  "flower-bed": { w: 2, h: 1, footprintH: 1 },
} as const;

type Texture = keyof typeof SPECS;

type Band = { readonly from: number; readonly to: number };
const within = (bands: readonly Band[], v: number) =>
  bands.some((band) => v >= band.from && v <= band.to);

const noise = (x: number, y: number) => {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return n - Math.floor(n);
};

const inPark = (x: number, y: number) =>
  PARKS.some(
    (park) =>
      x >= park.x && x < park.x + park.w && y >= park.y && y < park.y + park.h,
  );

/**
 * 출입문 앞 통로. 여기에 나무가 서면 입구를 가리고, 상호작용 칸을 밟기도 어려워진다.
 * 문 칸 기준 좌우 한 칸 · 앞 세 칸을 비운다.
 */
const doorApron = new Set<string>();
for (const building of BUILDINGS) {
  const doorX = building.x + building.doorOffset;
  const doorY = building.y + building.h - 1;
  for (let dx = -1; dx <= 1; dx += 1) {
    for (let dy = 0; dy <= 3; dy += 1) {
      doorApron.add(`${doorX + dx},${doorY + dy}`);
    }
  }
}

/** 주민 순찰로. 소품이 올라가면 주민이 길에 갇힌다. */
const npcPath = new Set<string>();
for (const npc of NPCS) {
  const { from, to } = npc;
  const steps = Math.max(Math.abs(to.x - from.x), Math.abs(to.y - from.y));
  for (let i = 0; i <= steps; i += 1) {
    const t = steps === 0 ? 0 : i / steps;
    npcPath.add(
      `${Math.round(from.x + (to.x - from.x) * t)},${Math.round(from.y + (to.y - from.y) * t)}`,
    );
  }
}

/** 밑동이 놓일 칸이 비어 있는지. 윗부분(수관)은 겹쳐도 된다. */
function footBlocked(x: number, y: number, w: number) {
  for (let tx = x; tx < x + w; tx += 1) {
    if (tx < 0 || tx >= MAP_TILES.w || y < 0 || y >= MAP_TILES.h) return true;
    if (within(ROADS.horizontal, y) || within(ROADS.vertical, tx)) return true;
    if (npcPath.has(`${tx},${y}`)) return true;
    if (doorApron.has(`${tx},${y}`)) return true;
    const onBuilding = BUILDINGS.some(
      (b) => tx >= b.x && tx < b.x + b.w && y >= b.y && y < b.y + b.h,
    );
    if (onBuilding) return true;
  }
  return false;
}

export function computeProps(): PropPlacement[] {
  const props: PropPlacement[] = [];
  const taken = new Set<string>();

  const add = (texture: Texture, x: number, footY: number) => {
    const spec = SPECS[texture];
    if (footBlocked(x, footY, spec.w)) return;
    for (let tx = x; tx < x + spec.w; tx += 1) {
      if (taken.has(`${tx},${footY}`)) return;
    }
    for (let tx = x; tx < x + spec.w; tx += 1) taken.add(`${tx},${footY}`);
    props.push({ texture, x, y: footY - (spec.h - 1), ...spec });
  };

  /** 교차로에서 이만큼 떨어진 곳부터 심는다. */
  const CLEAR = 4;
  const nearCrossing = (x: number, y: number) =>
    ROADS.vertical.some((v) => x >= v.from - CLEAR && x <= v.to + CLEAR) ||
    ROADS.horizontal.some((h) => y >= h.from - CLEAR && y <= h.to + CLEAR);

  // ── 연석을 따라 가로수와 가로등을 번갈아 ──────────────────────────
  for (const band of ROADS.horizontal) {
    // 나무는 3 칸 높이라 밑동 위로 수관이 두 칸 올라간다. 도로 **북쪽**에서는
    // 수관이 보도로 올라가지만, 남쪽에서는 도로를 덮어 길에 심은 것처럼 보인다.
    // 그래서 남쪽은 두 칸 내려 심는다.
    const rows = [
      { foot: band.from - 1, tree: true },
      { foot: band.to + 1, tree: false },
      { foot: band.to + 3, tree: true },
    ];
    for (const row of rows) {
      let slot = 0;
      for (let x = 2; x < MAP_TILES.w - 2; x += 5) {
        if (ROADS.vertical.some((v) => x >= v.from - CLEAR && x <= v.to + CLEAR)) {
          continue;
        }
        if (inPark(x, row.foot)) continue;
        if (row.tree) {
          if (slot % 2 === 0) add(x % 10 === 0 ? "tree-b" : "tree-a", x, row.foot);
        } else if (slot % 2 === 1) {
          add("lamppost", x, row.foot);
        }
        slot += 1;
      }
    }
  }

  for (const band of ROADS.vertical) {
    for (const col of [band.from - 2, band.to + 1]) {
      let slot = 0;
      for (let y = 6; y < MAP_TILES.h - 2; y += 6) {
        if (nearCrossing(col, y)) continue;
        if (inPark(col, y)) continue;
        add(slot % 2 === 0 ? "lamppost" : "tree-b", col, y);
        slot += 1;
      }
    }
  }

  // ── 공원 ────────────────────────────────────────────────────────
  for (const park of PARKS) {
    const right = park.x + park.w - 1;
    const bottom = park.y + park.h - 1;

    // 나무는 잡음으로 흩되 가장자리 한 칸은 비워 길처럼 남긴다.
    for (let y = park.y + 2; y <= bottom - 1; y += 1) {
      for (let x = park.x + 1; x <= right - 2; x += 1) {
        const n = noise(x * 5, y * 5);
        if (n > 0.93) add(n > 0.965 ? "tree-b" : "tree-a", x, y);
        else if (n < 0.06) add("bush", x, y);
      }
    }

    if (park.w >= 8 && park.h >= 5) {
      add("bench", park.x + 2, bottom - 1);
      add("bench", right - 3, bottom - 1);
      add("flower-bed", park.x + 2, park.y + 1);
      add("flower-bed", right - 3, park.y + 1);
    }
  }

  return props;
}
