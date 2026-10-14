/**
 * 도시 맵(.tmj)을 생성한다. `npm run gen:map`
 *
 * 배치는 src/town 의 데이터가 단일 진실 공급원이고 여기서 타일로 펼칠 뿐이다.
 * 생성된 .tmj 는 Tiled 로 열어 손으로 다듬을 수 있다 — 다만 이 스크립트를 다시
 * 돌리면 덮어쓰므로, 손으로 고치기 시작하면 이 스크립트는 버리는 게 맞다.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { BUILDINGS } from "../src/town/buildings.ts";
import { MAP_TILES, ROADS } from "../src/town/constants.ts";
import { DOOR, GLASS, GROUND, MATERIALS, PROPS, TILESET } from "../src/town/tiles.ts";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = resolve(ROOT, "public/town/maps/city.tmj");

const { w: W, h: H } = MAP_TILES;
const EMPTY = 0;

/** Tiled 의 gid 는 1-based. 타일 인덱스에 firstgid 를 더한다. */
const gid = (index: number) => index + 1;

const layer = (fill: number) => new Array<number>(W * H).fill(fill);
const put = (data: number[], x: number, y: number, index: number) => {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  data[y * W + x] = gid(index);
};

const onRoad = (x: number, y: number) =>
  (y >= ROADS.horizontal.from && y <= ROADS.horizontal.to) ||
  (x >= ROADS.vertical.from && x <= ROADS.vertical.to);

// ── ground ──────────────────────────────────────────────────────────────
const ground = layer(gid(GROUND.sidewalk));

for (let y = 0; y < H; y += 1) {
  for (let x = 0; x < W; x += 1) {
    if (onRoad(x, y)) put(ground, x, y, GROUND.road);
  }
}

// 차선. 교차로 구간은 비워 둬야 도로처럼 읽힌다.
const hMid = ROADS.horizontal.from + 1;
const vMid = ROADS.vertical.from + 1;
for (let x = 0; x < W; x += 1) {
  if (x >= ROADS.vertical.from && x <= ROADS.vertical.to) continue;
  put(ground, x, hMid, GROUND.roadLineH);
}
for (let y = 0; y < H; y += 1) {
  if (y >= ROADS.horizontal.from && y <= ROADS.horizontal.to) continue;
  put(ground, vMid, y, GROUND.roadDashV);
}

// 교차로 네 변의 횡단보도.
for (let y = ROADS.horizontal.from; y <= ROADS.horizontal.to; y += 1) {
  put(ground, ROADS.vertical.from - 2, y, GROUND.crosswalkV);
  put(ground, ROADS.vertical.to + 2, y, GROUND.crosswalkV);
}
for (let x = ROADS.vertical.from; x <= ROADS.vertical.to; x += 1) {
  put(ground, x, ROADS.horizontal.from - 2, GROUND.crosswalkH);
  put(ground, x, ROADS.horizontal.to + 2, GROUND.crosswalkH);
}

// 공원 두 곳. 블록의 빈 구석을 잔디로 덮는다.
const PARKS = [
  { x: 2, y: 25, w: 7, h: 4 },
  { x: 21, y: 24, w: 5, h: 5 },
] as const;
for (const park of PARKS) {
  for (let y = park.y; y < park.y + park.h; y += 1) {
    for (let x = park.x; x < park.x + park.w; x += 1) put(ground, x, y, GROUND.grass);
  }
}

// ── buildings ───────────────────────────────────────────────────────────
const buildings = layer(EMPTY);

for (const b of BUILDINGS) {
  const mat = MATERIALS[b.material];
  // 아래 3줄이 카메라를 향한 외벽, 나머지 위쪽은 지붕.
  const facadeTop = b.h - 3;

  for (let ty = 0; ty < b.h; ty += 1) {
    for (let tx = 0; tx < b.w; tx += 1) {
      const x = b.x + tx;
      const y = b.y + ty;

      if (ty < facadeTop) {
        put(buildings, x, y, mat.roof);
      } else if (ty === b.h - 1) {
        if (tx === b.doorOffset) put(buildings, x, y, DOOR);
        else if (tx % 3 === 1) put(buildings, x, y, GLASS);
        else put(buildings, x, y, mat.wall);
      } else {
        put(buildings, x, y, ty % 2 === 0 ? mat.windowBand : mat.wall);
      }
    }
  }
}

// ── props ───────────────────────────────────────────────────────────────
const props = layer(EMPTY);

for (const park of PARKS) {
  for (let y = park.y; y < park.y + park.h; y += 1) {
    for (let x = park.x; x < park.x + park.w; x += 1) {
      const edge = x === park.x || y === park.y;
      if (edge && (x + y) % 2 === 0) put(props, x, y, PROPS.bush);
      else if ((x + y) % 5 === 0) put(props, x, y, PROPS.tree);
    }
  }
}

// 인도 가로수. 도로에 접한 보도 한 줄에 일정 간격으로.
for (let x = 0; x < W; x += 3) {
  if (x >= ROADS.vertical.from - 1 && x <= ROADS.vertical.to + 1) continue;
  put(props, x, ROADS.horizontal.from - 1, PROPS.tree);
  put(props, x, ROADS.horizontal.to + 1, PROPS.tree);
}

// 건물 위에 가로수가 겹치지 않게 정리한다.
for (const b of BUILDINGS) {
  for (let y = b.y; y < b.y + b.h; y += 1) {
    for (let x = b.x; x < b.x + b.w; x += 1) props[y * W + x] = EMPTY;
  }
}

// ── write ───────────────────────────────────────────────────────────────
const tileLayer = (name: string, id: number, data: number[]) => ({
  data,
  height: H,
  id,
  name,
  opacity: 1,
  type: "tilelayer",
  visible: true,
  width: W,
  x: 0,
  y: 0,
});

const map = {
  compressionlevel: -1,
  height: H,
  infinite: false,
  layers: [
    tileLayer("ground", 1, ground),
    tileLayer("buildings", 2, buildings),
    tileLayer("props", 3, props),
  ],
  nextlayerid: 4,
  nextobjectid: 1,
  orientation: "orthogonal",
  renderorder: "right-down",
  tiledversion: "1.11.0",
  tileheight: 16,
  tilesets: [
    {
      columns: TILESET.columns,
      firstgid: 1,
      image: "../tilesets/roguelikeCity.png",
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
console.log(`wrote ${OUT} (${W}x${H}, ${map.layers.length} layers)`);
