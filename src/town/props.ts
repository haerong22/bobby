import { BUILDINGS, doorTile } from "./buildings";
import { MAP_TILES, PARKS, PLAZA, ROADS } from "./constants";
import { NPCS } from "./npcs";

/**
 * 거리 소품. 가로수 · 가로등 · 벤치 · 화단 · 관목 · 생울타리 · 분수.
 *
 * 좌표를 손으로 적지 않고 도로·건물·공원 배치에서 계산한다. 맵이 바뀌면 소품도
 * 따라온다.
 *
 * **마을처럼 보이게 하는 규칙**
 * - 가로수와 가로등은 길을 따라 **촘촘히 번갈아** 선다. 드문드문 심으면 길이
 *   아니라 빈 벌판에 나무 몇 그루 꽂아 둔 것으로 보인다
 * - 수관은 밑동보다 두 칸 위로 올라간다. 길 **남쪽**에는 두 칸 내려 심어야
 *   수관이 도로를 덮지 않는다
 * - 교차로 둘레는 비운다. 횡단보도 앞에 나무가 서면 길을 막는 것처럼 보인다
 * - 광장에는 분수를 가운데 두고 벤치와 가로등을 둘러 앉힌다
 * - 건물 뒷마당은 생울타리로 가른다. 빈 잔디가 덜 허전해진다
 * - 맵 가장자리는 나무로 둘러 마을 바깥이 숲으로 이어지는 것처럼 만든다
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
  "hedge",
  "fountain",
] as const;

const SPECS = {
  "tree-a": { w: 2, h: 3, footprintH: 1 },
  "tree-b": { w: 2, h: 3, footprintH: 1 },
  bush: { w: 1, h: 1, footprintH: 1 },
  lamppost: { w: 1, h: 2, footprintH: 1 },
  bench: { w: 2, h: 1, footprintH: 1 },
  "flower-bed": { w: 2, h: 1, footprintH: 1 },
  hedge: { w: 1, h: 1, footprintH: 1 },
  fountain: { w: 3, h: 3, footprintH: 2 },
} as const;

type Texture = keyof typeof SPECS;

type Band = { readonly from: number; readonly to: number };
const within = (bands: readonly Band[], v: number) =>
  bands.some((band) => v >= band.from && v <= band.to);

const noise = (x: number, y: number) => {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return n - Math.floor(n);
};

const inPlaza = (x: number, y: number) =>
  x >= PLAZA.x && x < PLAZA.x + PLAZA.w && y >= PLAZA.y && y < PLAZA.y + PLAZA.h;

/**
 * 출입문 앞 통로. 여기에 무엇이든 서면 입구를 가리고 상호작용 칸을 밟기 어려워진다.
 * 문 칸 기준 좌우 한 칸 · 앞 **여섯 칸**을 비운다 — 길 건너 보도까지 터야
 * 반대편에서 곧장 걸어 들어올 수 있다.
 */
const doorApron = new Set<string>();
for (const building of BUILDINGS) {
  const door = doorTile(building);
  for (let dx = -1; dx <= 1; dx += 1) {
    for (let dy = 0; dy <= 5; dy += 1) {
      doorApron.add(`${door.x + dx},${door.y + dy}`);
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
    const x = Math.round(from.x + (to.x - from.x) * t);
    const y = Math.round(from.y + (to.y - from.y) * t);
    for (let dx = -1; dx <= 1; dx += 1) npcPath.add(`${x + dx},${y}`);
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
      for (let ty = footY - (spec.footprintH - 1); ty <= footY; ty += 1) {
        if (taken.has(`${tx},${ty}`)) return;
      }
    }
    for (let tx = x; tx < x + spec.w; tx += 1) {
      for (let ty = footY - (spec.footprintH - 1); ty <= footY; ty += 1) {
        taken.add(`${tx},${ty}`);
      }
    }
    props.push({ texture, x, y: footY - (spec.h - 1), ...spec });
  };

  /** 교차로에서 이만큼 떨어진 곳부터 심는다. */
  const CLEAR = 3;
  const nearVertical = (x: number) =>
    ROADS.vertical.some((v) => x >= v.from - CLEAR && x <= v.to + CLEAR);
  const nearHorizontal = (y: number) =>
    ROADS.horizontal.some((h) => y >= h.from - CLEAR && y <= h.to + CLEAR);

  // ── 광장 : 분수를 가운데 두고 벤치와 가로등을 둘러 앉힌다 ──────────
  const px = PLAZA.x;
  const py = PLAZA.y;
  const pr = px + PLAZA.w - 1;
  const pb = py + PLAZA.h - 1;
  const fx = px + Math.floor((PLAZA.w - 3) / 2);
  const fy = py + Math.floor((PLAZA.h - 3) / 2);
  add("fountain", fx, fy + 2);
  for (const [bx, by] of [
    [fx - 4, fy - 1],
    [fx + 3, fy - 1],
    [fx - 4, fy + 4],
    [fx + 3, fy + 4],
  ] as const) {
    add("bench", bx, by);
  }
  for (const [lx, ly] of [
    [px + 1, py + 1],
    [pr - 1, py + 1],
    [px + 1, pb - 1],
    [pr - 1, pb - 1],
  ] as const) {
    add("lamppost", lx, ly);
  }
  add("flower-bed", fx, py + 1);
  add("flower-bed", fx, pb - 1);

  // ── 길을 따라 가로수와 가로등 ──────────────────────────────────────
  for (const band of ROADS.horizontal) {
    // 북쪽 연석: 나무와 가로등을 번갈아. 수관이 보도 위로 올라간다.
    let slot = 0;
    for (let x = 2; x < MAP_TILES.w - 2; x += 3) {
      if (nearVertical(x)) continue;
      if (slot % 2 === 0) add(x % 7 === 0 ? "tree-b" : "tree-a", x, band.from - 1);
      else add("lamppost", x, band.from - 1);
      slot += 1;
    }
    // 남쪽: 나무는 두 칸 내려 심어야 수관이 도로를 덮지 않는다.
    slot = 0;
    for (let x = 3; x < MAP_TILES.w - 2; x += 3) {
      if (nearVertical(x)) continue;
      if (slot % 2 === 1) add("lamppost", x, band.to + 1);
      else add(x % 5 === 0 ? "tree-b" : "tree-a", x, band.to + 3);
      slot += 1;
    }
  }

  for (const band of ROADS.vertical) {
    for (const col of [band.from - 2, band.to + 2]) {
      let slot = 0;
      for (let y = 3; y < MAP_TILES.h - 2; y += 4) {
        if (nearHorizontal(y)) continue;
        add(slot % 2 === 0 ? "lamppost" : "tree-b", col, y);
        slot += 1;
      }
    }
  }

  // ── 공원·들판 : 나무를 잡음으로 흩고 가장자리에 앉을 자리 ──────────
  for (const park of PARKS) {
    const right = park.x + park.w - 1;
    const bottom = park.y + park.h - 1;

    // 숲은 빽빽하게, 들판은 성글게. 같은 밀도로 심으면 마을 밖이 통째로 숲이 된다.
    const treeAt = park.grove ? 0.86 : 0.95;
    for (let y = park.y + 1; y <= bottom; y += 1) {
      for (let x = park.x; x <= right - 1; x += 1) {
        if (inPlaza(x, y)) continue;
        const n = noise(x * 5, y * 5);
        if (n > treeAt) add(n > treeAt + 0.04 ? "tree-b" : "tree-a", x, y);
        else if (n < (park.grove ? 0.1 : 0.05)) add("bush", x, y);
        else if (n > treeAt - 0.03) add("flower-bed", x, y);
      }
    }

    if (park.w >= 8 && park.h >= 5) {
      add("bench", park.x + 2, bottom - 1);
      add("bench", right - 3, bottom - 1);
    }
  }

  // ── 건물 뒷마당을 생울타리로 가른다 ────────────────────────────────
  for (const b of BUILDINGS) {
    const top = b.y - 2;
    // 길가에 걸리면 보도 한복판에 울타리가 서 버린다.
    if (nearHorizontal(top)) continue;
    for (let x = b.x - 1; x <= b.x + b.w; x += 1) add("hedge", x, top);
  }

  // ── 맵 가장자리는 숲으로. 북쪽은 건물 줄이 가장자리라 건너뛴다 ──────
  for (let x = 0; x < MAP_TILES.w - 1; x += 3) {
    add(x % 6 === 0 ? "tree-b" : "tree-a", x, MAP_TILES.h - 1);
  }
  for (let y = 2; y < MAP_TILES.h - 1; y += 4) {
    add("tree-a", 0, y);
    add("tree-a", MAP_TILES.w - 2, y);
  }

  return props;
}
