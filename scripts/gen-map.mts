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

import { BUILDINGS, doorTile } from "../src/town/buildings.ts";
import { MAP_TILES, PARKS, ROADS } from "../src/town/constants.ts";
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

type Band = { readonly from: number; readonly to: number };
const within = (bands: readonly Band[], v: number) =>
  bands.some((band) => v >= band.from && v <= band.to);

const onRoad = (x: number, y: number) =>
  within(ROADS.horizontal, y) || within(ROADS.vertical, x);

// ── ground ──────────────────────────────────────────────────────────────
const ground = layer(gid(GROUND.sidewalk));

for (let y = 0; y < H; y += 1) {
  for (let x = 0; x < W; x += 1) {
    if (onRoad(x, y)) put(ground, x, y, GROUND.road);
  }
}

// 차선. 교차로 구간은 비워 둬야 도로처럼 읽힌다.
for (const band of ROADS.horizontal) {
  for (let x = 0; x < W; x += 1) {
    if (within(ROADS.vertical, x)) continue;
    put(ground, x, band.from + 1, GROUND.roadLineH);
  }
}
for (const band of ROADS.vertical) {
  for (let y = 0; y < H; y += 1) {
    if (within(ROADS.horizontal, y)) continue;
    put(ground, band.from + 1, y, GROUND.roadDashV);
  }
}

// 교차로마다 네 변에 횡단보도.
for (const h of ROADS.horizontal) {
  for (const v of ROADS.vertical) {
    for (let y = h.from; y <= h.to; y += 1) {
      put(ground, v.from - 2, y, GROUND.crosswalkV);
      put(ground, v.to + 2, y, GROUND.crosswalkV);
    }
    for (let x = v.from; x <= v.to; x += 1) {
      put(ground, x, h.from - 2, GROUND.crosswalkH);
      put(ground, x, h.to + 2, GROUND.crosswalkH);
    }
  }
}

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
  // 상호작용 판정과 같은 식을 써야 문과 존이 어긋나지 않는다.
  const door = doorTile(b);

  for (let ty = 0; ty < b.h; ty += 1) {
    for (let tx = 0; tx < b.w; tx += 1) {
      const x = b.x + tx;
      const y = b.y + ty;

      if (ty < facadeTop) {
        put(buildings, x, y, mat.roof);
      } else if (ty === b.h - 1) {
        if (x === door.x && y === door.y) put(buildings, x, y, DOOR);
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

/**
 * 좌표 기반 결정적 난수. `(x + y) % n` 같은 식은 대각선 줄무늬를 만들어
 * 심어 놓은 티가 난다. 시드가 좌표뿐이라 돌릴 때마다 같은 맵이 나온다.
 */
const noise = (x: number, y: number) => {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return n - Math.floor(n);
};

for (const park of PARKS) {
  for (let y = park.y; y < park.y + park.h; y += 1) {
    for (let x = park.x; x < park.x + park.w; x += 1) {
      const value = noise(x, y);
      if (value > 0.8) put(props, x, y, PROPS.tree);
      else if (value < 0.12) put(props, x, y, PROPS.bush);
    }
  }
}

// 인도 가로수. 도로에 접한 보도 한 줄에 네 칸 간격으로.
const STREET_TREE_STEP = 4;
for (const band of ROADS.horizontal) {
  for (let x = 1; x < W; x += STREET_TREE_STEP) {
    if (ROADS.vertical.some((v) => x >= v.from - 1 && x <= v.to + 1)) continue;
    put(props, x, band.from - 1, PROPS.tree);
    put(props, x, band.to + 1, PROPS.tree);
  }
}
for (const band of ROADS.vertical) {
  for (let y = 1; y < H; y += STREET_TREE_STEP) {
    if (ROADS.horizontal.some((h) => y >= h.from - 1 && y <= h.to + 1)) continue;
    put(props, band.from - 1, y, PROPS.tree);
    put(props, band.to + 1, y, PROPS.tree);
  }
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
