/**
 * 도시 맵(.tmj)을 생성한다. `npm run gen:map`
 *
 * 배치는 src/town 의 데이터가 단일 진실 공급원이고 여기서 타일로 펼칠 뿐이다.
 * **건물은 더 이상 타일이 아니다** — 80x80 스프라이트라 MapScene 이 직접 놓는다.
 * 여기서는 지면(도로·보도·잔디)만 그린다.
 *
 * 생성된 .tmj 는 Tiled 로 열어 손으로 다듬을 수 있다 — 다만 이 스크립트를 다시
 * 돌리면 덮어쓰므로, 손으로 고치기 시작하면 이 스크립트는 버리는 게 맞다.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { BUILDINGS, doorTile } from "../src/town/buildings.ts";
import { MAP_TILES, parkAt, PLAZA, ROADS, TRAILS } from "../src/town/constants.ts";
import {
  DIRT_E,
  DIRT_N,
  DIRT_S,
  DIRT_W,
  dirtTile,
  DRY_VARIANTS,
  FLOWER_VARIANTS,
  GRASS_VARIANTS,
  SHADE_VARIANTS,
  T,
  TILESET,
} from "../src/town/tiles.ts";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = resolve(ROOT, "public/town/maps/city.tmj");

const { w: W, h: H } = MAP_TILES;

/** Tiled 의 gid 는 1-based. 타일 인덱스에 firstgid 를 더한다. */
const gid = (index: number) => index + 1;

const layer = (fill: number) => new Array<number>(W * H).fill(fill);
const put = (data: number[], x: number, y: number, index: number) => {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  data[y * W + x] = gid(index);
};

/**
 * 좌표 기반 결정적 난수. 같은 타일만 반복하면 바닥이 격자처럼 보인다.
 * 시드가 좌표뿐이라 돌릴 때마다 같은 맵이 나온다.
 */
const noise = (x: number, y: number) => {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return n - Math.floor(n);
};

const pick = <V,>(options: readonly V[], x: number, y: number) =>
  options[Math.floor(noise(x, y) * options.length) % options.length]!;

type Band = { readonly from: number; readonly to: number };
const within = (bands: readonly Band[], v: number) =>
  bands.some((band) => v >= band.from && v <= band.to);

const onRoad = (x: number, y: number) =>
  within(ROADS.horizontal, y) || within(ROADS.vertical, x);

// ── ground ──────────────────────────────────────────────────────────────
/**
 * **지면 기본은 잔디다.**
 *
 * 한동안 보도를 깔아 두고 그 위에 공원만 얹었는데, 마을이 "건물 일곱 채가
 * 흩어진 베이지 벌판" 으로 보였다. 포장은 사람이 실제로 걷는 데만 깐다 —
 * 길 · 길 양옆 보도 두 줄 · 광장 · 건물 앞마당 · 문 앞 오솔길. 나머지는 전부 잔디다.
 */
const ground = layer(gid(T.grass));
const paved: boolean[] = new Array(W * H).fill(false);

const pave = (x: number, y: number) => {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  paved[y * W + x] = true;
};
const isPaved = (x: number, y: number) =>
  x >= 0 && y >= 0 && x < W && y < H && paved[y * W + x] === true;

/**
 * 길 양옆 보도. 한 줄이면 가로수를 심는 순간 사람이 지나갈 데가 없어 두 줄이다.
 *
 * **다만 맵 끝까지 깔지 않는다.** 길을 따라 보도를 쭉 깔았더니 베이지 띠가
 * 맵을 가로질러 초록을 전부 직사각형으로 잘라 버렸다. 실제 마을은 시가지를
 * 벗어나면 포장이 끊기고 길이 바로 풀밭에 닿는다. 그래서 `BUILT` 안에서만
 * 두 줄, 가장자리 네 칸은 한 줄로 좁히다가 끊는다.
 */
const BUILT = { x0: 0, x1: 56, y0: 7, y1: 31 } as const;
const TAPER = 4;

/** 시가지 끝에서 보도 폭을 2 → 1 → 0 으로 줄여 끊는다. */
const walkWidth = (v: number, lo: number, hi: number) => {
  if (v < lo - TAPER || v > hi + TAPER) return 0;
  if (v < lo || v > hi) return 1;
  return 2;
};

for (const band of ROADS.horizontal) {
  if (!band.paved) continue;
  for (let x = 0; x < W; x += 1) {
    const width = walkWidth(x, BUILT.x0, BUILT.x1);
    for (let i = 1; i <= width; i += 1) {
      pave(x, band.from - i);
      pave(x, band.to + i);
    }
  }
}
for (const band of ROADS.vertical) {
  if (!band.paved) continue;
  for (let y = 0; y < H; y += 1) {
    const width = walkWidth(y, BUILT.y0, BUILT.y1);
    for (let i = 1; i <= width; i += 1) {
      pave(band.from - i, y);
      pave(band.to + i, y);
    }
  }
}

// 광장. 가장자리 한 줄은 잡음으로 갉아 직사각형 티를 뺀다.
for (let y = PLAZA.y; y < PLAZA.y + PLAZA.h; y += 1) {
  for (let x = PLAZA.x; x < PLAZA.x + PLAZA.w; x += 1) {
    const rim =
      x === PLAZA.x ||
      y === PLAZA.y ||
      x === PLAZA.x + PLAZA.w - 1 ||
      y === PLAZA.y + PLAZA.h - 1;
    if (rim && noise(x * 5.1, y * 3.7) < 0.45) continue;
    pave(x, y);
  }
}

// 건물 앞마당 — 발자국 **아래 한 줄만** 깐다. 사방에 두르면 앞마당끼리 붙어
// 북쪽 전체가 베이지 벌판이 된다.
for (const b of BUILDINGS) {
  for (let x = b.x; x < b.x + b.w; x += 1) pave(x, b.y + b.h);
  // 문에서 길까지 이어지는 오솔길. 전면선이 들쭉날쭉해 길이마다 다르다.
  const door = doorTile(b);
  for (let y = door.y; y < H; y += 1) {
    pave(door.x, y);
    if (onRoad(door.x, y) || isPaved(door.x, y + 1)) break;
  }
}

// ── 흙 오솔길 ───────────────────────────────────────────────────────────
// 대각선 타일이 없으므로 꺾은선의 각 구간을 ㄱ 자(가로 → 세로)로 깐다.
const trail: boolean[] = new Array(W * H).fill(false);
const isTrail = (x: number, y: number) =>
  x >= 0 && y >= 0 && x < W && y < H && trail[y * W + x] === true;
const walk = (x: number, y: number) => {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  if (onRoad(x, y) || isPaved(x, y)) return;
  trail[y * W + x] = true;
};
for (const line of TRAILS) {
  for (let i = 1; i < line.length; i += 1) {
    const a = line[i - 1]!;
    const b = line[i]!;
    const stepX = Math.sign(b.x - a.x);
    const stepY = Math.sign(b.y - a.y);
    for (let x = a.x; x !== b.x + stepX && stepX !== 0; x += stepX) walk(x, a.y);
    for (let y = a.y; y !== b.y + stepY && stepY !== 0; y += stepY) walk(b.x, y);
  }
}

for (let y = 0; y < H; y += 1) {
  for (let x = 0; x < W; x += 1) {
    if (onRoad(x, y)) {
      // 아스팔트는 두 종류를 섞고, 드물게 맨홀·배수구를 얹어 반복감을 줄인다.
      const n = noise(x, y);
      if (n > 0.975) put(ground, x, y, T.manhole);
      else if (n > 0.95) put(ground, x, y, T.drain);
      else put(ground, x, y, n > 0.5 ? T.asphalt : T.asphaltAlt);
    } else if (isPaved(x, y)) {
      put(ground, x, y, T.sidewalk);
    } else if (isTrail(x, y)) {
      const mask =
        (isTrail(x, y - 1) ? DIRT_N : 0) |
        (isTrail(x + 1, y) ? DIRT_E : 0) |
        (isTrail(x, y + 1) ? DIRT_S : 0) |
        (isTrail(x - 1, y) ? DIRT_W : 0);
      put(ground, x, y, dirtTile(mask));
    } else {
      // 잔디를 세 구역으로 나눈다 — 공원 속은 그늘지게, 마을 밖은 마르게.
      //
      // **구역 판정은 저주파로 한다.** 칸마다 뽑으면 밝은 잔디와 어두운 잔디가
      // 한 칸씩 번갈아 체크무늬가 된다. 네 칸짜리 셀 단위로 정해야 넓은 뙈기로
      // 번져 풀밭처럼 보인다.
      const n = noise(x * 3, y * 3);
      const cell = noise(Math.floor(x / 4) * 3.1, Math.floor(y / 4) * 3.1);
      const park = parkAt(x, y);
      const outside = y >= 31 || y <= 1 || x <= 1 || x >= W - 2;
      if (park && n > 0.86) put(ground, x, y, pick(FLOWER_VARIANTS, x, y));
      else if (park && cell > 0.38) put(ground, x, y, pick(SHADE_VARIANTS, x, y));
      else if (outside && cell > 0.45) put(ground, x, y, pick(DRY_VARIANTS, x, y));
      else put(ground, x, y, pick(GRASS_VARIANTS, x, y));
    }
  }
}

// 잔디가 포장과 맞닿는 줄은 전환 타일로 덮는다. 안 그러면 경계가 칼로 자른 듯하다.
const hard = (x: number, y: number) => onRoad(x, y) || isPaved(x, y);
for (let y = 0; y < H; y += 1) {
  for (let x = 0; x < W; x += 1) {
    if (hard(x, y) || isTrail(x, y)) continue;
    if (hard(x, y - 1)) put(ground, x, y, T.grassEdgeTop);
    else if (hard(x, y + 1)) put(ground, x, y, T.grassEdgeBottom);
    else if (hard(x - 1, y)) put(ground, x, y, T.grassEdgeLeft);
    else if (hard(x + 1, y)) put(ground, x, y, T.grassEdgeRight);
  }
}

// 차선. 교차로와 2칸 골목은 비운다 — 골목 한가운데 중앙선은 어색하다.
for (const band of ROADS.horizontal) {
  if (band.to - band.from < 2) continue;
  for (let x = 0; x < W; x += 1) {
    if (within(ROADS.vertical, x)) continue;
    put(ground, x, band.from + 1, T.lineEw);
  }
}
for (const band of ROADS.vertical) {
  if (band.to - band.from < 2) continue;
  for (let y = 0; y < H; y += 1) {
    if (within(ROADS.horizontal, y)) continue;
    put(ground, band.from + 1, y, T.lineNs);
  }
}

// 교차로마다 네 변에 횡단보도.
for (const h of ROADS.horizontal) {
  for (const v of ROADS.vertical) {
    for (let y = h.from; y <= h.to; y += 1) {
      put(ground, v.from - 2, y, T.crosswalkNs);
      put(ground, v.to + 2, y, T.crosswalkNs);
    }
    for (let x = v.from; x <= v.to; x += 1) {
      put(ground, x, h.from - 2, T.crosswalkEw);
      put(ground, x, h.to + 2, T.crosswalkEw);
    }
  }
}

// 연석. 도로와 보도가 맞닿는 줄을 전환 타일로 덮는다. 잔디가 바로 닿는 자리는
// 이미 잔디 전환 타일이 깔려 있으므로 건너뛴다.
const curb = (x: number, y: number, index: number) => {
  if (onRoad(x, y) || !isPaved(x, y)) return;
  put(ground, x, y, index);
};
for (const band of ROADS.horizontal) {
  for (let x = 0; x < W; x += 1) {
    if (within(ROADS.vertical, x)) continue;
    curb(x, band.from - 1, T.curbAboveRoad);
    curb(x, band.to + 1, T.curbBelowRoad);
  }
}
for (const band of ROADS.vertical) {
  for (let y = 0; y < H; y += 1) {
    if (within(ROADS.horizontal, y)) continue;
    curb(band.from - 1, y, T.curbLeftOfRoad);
    curb(band.to + 1, y, T.curbRightOfRoad);
  }
}

// ── write ───────────────────────────────────────────────────────────────
const map = {
  compressionlevel: -1,
  height: H,
  infinite: false,
  layers: [
    {
      data: ground,
      height: H,
      id: 1,
      name: "ground",
      opacity: 1,
      type: "tilelayer",
      visible: true,
      width: W,
      x: 0,
      y: 0,
    },
  ],
  nextlayerid: 2,
  nextobjectid: 1,
  orientation: "orthogonal",
  renderorder: "right-down",
  tiledversion: "1.11.0",
  tileheight: 16,
  tilesets: [
    {
      columns: TILESET.columns,
      firstgid: 1,
      image: "../tilesets/town.png",
      imageheight: TILESET.imageHeight,
      imagewidth: TILESET.imageWidth,
      margin: TILESET.margin,
      name: TILESET.name,
      spacing: TILESET.spacing,
      tilecount: TILESET.tileCount,
      tileheight: 16,
      tilewidth: 16,
    },
  ],
  tilewidth: 16,
  type: "map",
  version: "1.10",
  width: W,
};

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, `${JSON.stringify(map)}\n`);
console.log(`wrote ${OUT} (${W}x${H}, ground only — 건물은 스프라이트)`);
